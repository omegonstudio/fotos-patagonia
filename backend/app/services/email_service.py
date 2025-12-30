import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from core.config import settings


def send_email(
    to_email: str,
    subject: str,
    body: str,
    html: bool = False
):
    if not settings.EMAIL_HOST:
        print("Email host not configured. Skipping email sending.")
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject

    if html:
        msg.attach(MIMEText(body, "html"))
    else:
        msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            if settings.EMAIL_USER and settings.EMAIL_PASSWORD:
                server.starttls()
                server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
        print(f"Email sent to {to_email} with subject {subject}")
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")