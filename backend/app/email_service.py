import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def send_otp_email(to_email: str, code: str) -> bool:
    """Sends a formatted HTML OTP verification email via SMTP if configured.

    Fallback: prints code to server console if SMTP credentials are missing.
    """
    smtp_server = os.getenv("SMTP_SERVER", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USERNAME", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user or "noreply@mindaxis.app")

    if not smtp_server or not smtp_user or not smtp_pass:
        print(f"[auth] SMTP not configured in .env. Console OTP for {to_email}: {code}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your MindAxis Verification Code: {code}"
        msg["From"] = smtp_from
        msg["To"] = to_email

        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f8f9ff; padding: 20px;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #dbe4f5;">
              <h2 style="color: #0058be; margin-top: 0;">MindAxis Verification Code 💙</h2>
              <p style="color: #424754; font-size: 15px;">Your single-use verification code is:</p>
              <div style="background-color: #eff4ff; padding: 16px; text-align: center; border-radius: 8px; font-size: 30px; font-weight: bold; letter-spacing: 6px; color: #0058be; margin: 20px 0;">
                {code}
              </div>
              <p style="color: #424754; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #dbe4f5; margin-top: 25px;" />
              <p style="color: #9297a4; font-size: 11px; text-align: center;">MindAxis — Privacy-First Mental Health Companion</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(html_content, "html"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_from, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_from, [to_email], msg.as_string())

        print(f"[auth] Real OTP email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"[auth] Failed to send email to {to_email}: {e}")
        print(f"[auth] Fallback Console OTP for {to_email}: {code}")
        return False
