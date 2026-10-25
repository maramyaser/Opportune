
import ipaddress
import socket
from urllib.parse import urlsplit

import certifi
import urllib3
from bs4 import BeautifulSoup

import logging

logger = logging.getLogger(__name__)

MAX_PAGE_SIZE = 1_000_000
MAX_TEXT_LENGTH = 20_000
CONNECT_TIMEOUT = 5
READ_TIMEOUT = 10


class PageExtractionError(Exception):
    pass


def validate_public_url(url):
    if not isinstance(url, str) or len(url) > 2048:
        raise PageExtractionError("Invalid URL.")

    try:
        parsed = urlsplit(url)

        if parsed.scheme != "https":
            raise PageExtractionError(
                "Please provide a valid HTTPS opportunity URL."
            )

        if (
            not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
        ):
            raise PageExtractionError("Invalid URL.")

        if parsed.port not in (None, 443):
            raise PageExtractionError(
                "Custom ports are not allowed."
            )

    except ValueError as exc:
        raise PageExtractionError("Invalid URL.") from exc

    try:
        addresses = socket.getaddrinfo(
            parsed.hostname,
            443,
            type=socket.SOCK_STREAM,
        )
    except (socket.gaierror, UnicodeError, ValueError) as exc:
        raise PageExtractionError(
            "Could not resolve the website."
        ) from exc

    if not addresses:
        raise PageExtractionError(
            "Could not resolve the website."
        )

    safe_ips = set()

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])

        if not ip.is_global:
            raise PageExtractionError(
                "This website address is not publicly accessible."
            )

        safe_ips.add(str(ip))

    # Return a validated IP for the actual connection.
    return parsed, sorted(safe_ips)[0]


def extract_page_text(url):
    parsed, validated_ip = validate_public_url(url)

    hostname = parsed.hostname

    # Connect to the already-validated IP address.
    # TLS still verifies the ORIGINAL hostname.
    pool = urllib3.HTTPSConnectionPool(
        host=validated_ip,
        port=443,
        server_hostname=hostname,
        assert_hostname=hostname,
        cert_reqs="CERT_REQUIRED",
        ca_certs=certifi.where(),
        timeout=urllib3.Timeout(
            connect=CONNECT_TIMEOUT,
            read=READ_TIMEOUT,
        ),
        maxsize=1,
    )

    # Preserve the original URL path and query string.
    target = parsed.path or "/"

    if parsed.query:
        target += "?" + parsed.query

    response = None

    try:
        response = pool.urlopen(
            "GET",
            target,
            headers={
                "Host": hostname,
                "User-Agent": "OpportuneOpportunityTracker/1.0",
                "Accept": "text/html",
            },
            retries=False,
            redirect=False,
            preload_content=False,
            assert_same_host=False,
        )

        if 300 <= response.status < 400:
            raise PageExtractionError(
                "The page redirects. Please use its final HTTPS URL."
            )

        if response.status >= 400:
             logger.warning(
              "[EXTRACTION] Target website returned HTTP %s",
                 response.status,
             )

             raise PageExtractionError(
                  "Could not retrieve this webpage."
            )

        content_type = response.headers.get(
            "Content-Type", ""
        ).lower()

        if "text/html" not in content_type:
            raise PageExtractionError(
                "The link does not return an HTML page."
            )

        chunks = []
        size = 0

        for chunk in response.stream(8192):
            size += len(chunk)

            if size > MAX_PAGE_SIZE:
                raise PageExtractionError(
                    "The webpage is too large to process."
                )

            chunks.append(chunk)

        html = b"".join(chunks)

    except urllib3.exceptions.HTTPError as exc:
        logger.warning(
        "[EXTRACTION] Network error: %s",
        type(exc).__name__,
    )

        raise PageExtractionError(
        "Could not retrieve this webpage."
    ) from exc

    finally:
        if response is not None:
            response.close()

        pool.close()

    soup = BeautifulSoup(html, "html.parser")

    for element in soup(
        ["script", "style", "nav", "footer", "header", "noscript"]
    ):
        element.decompose()

    title = (
        soup.title.get_text(" ", strip=True)
        if soup.title
        else ""
    )

    text = soup.get_text(" ", strip=True)
    text = " ".join(text.split())[:MAX_TEXT_LENGTH]

    if not text:
        raise PageExtractionError(
            "No readable text was found on this page."
        )

    return {
        "page_title": title,
        "text": text,
        "source_url": url,
    }
