
import ipaddress
import socket
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


MAX_PAGE_SIZE = 1_000_000
MAX_TEXT_LENGTH = 20_000
TIMEOUT = 10


class PageExtractionError(Exception):
    pass


def validate_public_url(url):
    parsed = urlparse(url)

    if parsed.scheme != "https":
        raise PageExtractionError(
            "Please provide a valid HTTPS opportunity URL."
        )

    if not parsed.hostname or parsed.username or parsed.password:
        raise PageExtractionError("Invalid URL.")

    if parsed.port not in (None, 443):
        raise PageExtractionError("Custom ports are not allowed.")

    try:
        addresses = socket.getaddrinfo(
            parsed.hostname, 443, type=socket.SOCK_STREAM
        )
    except socket.gaierror as exc:
        raise PageExtractionError(
            "Could not resolve the website."
        ) from exc

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            raise PageExtractionError(
                "This website address is not publicly accessible."
            )


def extract_page_text(url):
    validate_public_url(url)

    try:
        with requests.get(
            url,
            timeout=TIMEOUT,
            stream=True,
            allow_redirects=False,
            headers={
                "User-Agent": "OpportuneOpportunityTracker/1.0"
            },
        ) as response:
            if response.status_code in (301, 302, 303, 307, 308):
                raise PageExtractionError(
                    "The page redirects. Please use its final HTTPS URL."
                )

            response.raise_for_status()

            content_type = response.headers.get(
                "Content-Type", ""
            ).lower()

            if "text/html" not in content_type:
                raise PageExtractionError(
                    "The link does not return an HTML page."
                )

            chunks = []
            size = 0

            for chunk in response.iter_content(8192):
                size += len(chunk)

                if size > MAX_PAGE_SIZE:
                    raise PageExtractionError(
                        "The webpage is too large to process."
                    )

                chunks.append(chunk)

            html = b"".join(chunks)

    except requests.RequestException as exc:
        raise PageExtractionError(
            "Could not retrieve this webpage."
        ) from exc

    soup = BeautifulSoup(html, "html.parser")

    for element in soup(
        ["script", "style", "nav", "footer", "header", "noscript"]
    ):
        element.decompose()

    title = soup.title.get_text(" ", strip=True) if soup.title else ""
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
