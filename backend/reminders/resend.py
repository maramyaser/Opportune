import json, os
from urllib.request import Request, urlopen
from urllib.error import HTTPError

def send_email(to, subject, html):
    key = os.environ.get("RESEND_API_KEY", "").strip()
    sender = os.environ.get("RESEND_FROM_EMAIL", "").strip()
    if not key or not sender:
        raise RuntimeError("Configure RESEND_API_KEY and RESEND_FROM_EMAIL.")
    req = Request("https://api.resend.com/emails", data=json.dumps({"from": sender, "to": [to], "subject": subject, "html": html}).encode(), headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(req, timeout=20) as response:
            return json.loads(response.read().decode()).get("id", "")
    except HTTPError as exc:
        raise RuntimeError(f"Resend error {exc.code}: {exc.read().decode(errors='replace')}") from exc
