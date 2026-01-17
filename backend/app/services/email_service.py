import resend
from core.config import settings


def send_email(
    to_email: str,
    subject: str,
    body: str,
    html: bool = False
):
    print("--- Attempting to send email via Resend API ---")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")

    if not settings.RESEND_API_KEY:
        print("CRITICAL: RESEND_API_KEY is not configured. Skipping email sending.")
        return

    if not settings.EMAIL_FROM:
        print("CRITICAL: EMAIL_FROM is not configured. Skipping email sending.")
        return

    try:
        resend.api_key = settings.RESEND_API_KEY
        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": subject,
        }

        if html:
            params["html"] = body
        else:
            params["text"] = body

        print("DEBUG: Sending email with params:", {"from": params["from"], "to": params["to"], "subject": params["subject"]})

        email = resend.Emails.send(params)

        print(f"SUCCESS: Email sent successfully to {to_email}. Resend ID: {email['id']}")

    except Exception as e:
        print(f"CRITICAL: Failed to send email to {to_email} via Resend. Error: {e}")
        # Opcional: podrías relanzar la excepción si quieres que el proceso que llama se entere del error.
        # raise e