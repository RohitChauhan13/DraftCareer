type SendOtpArgs = {
  email: string;
  otp: string;
  purpose: "email_verification" | "password_reset";
};

export async function sendOtpEmail({ email, otp, purpose }: SendOtpArgs) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "DraftCareer";
  const isPasswordReset = purpose === "password_reset";
  const subject = isPasswordReset
    ? "Reset your DraftCareer password"
    : "Verify your DraftCareer account";

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev email] OTP for ${email}: ${otp}`);
      return;
    }
    throw new Error("Brevo email configuration is missing.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email }],
      subject,
      htmlContent: professionalOtpEmail({
        otp,
        title: isPasswordReset ? "Reset your password" : "Verify your account",
        preview: isPasswordReset
          ? "Use this OTP to reset your DraftCareer password."
          : "Use this OTP to complete your DraftCareer account setup.",
        message: isPasswordReset
          ? "We received a request to reset your password. Enter the verification code below to create a new password."
          : "Thanks for creating your DraftCareer account. Enter the verification code below to activate your account."
      }),
      textContent: `${subject}\n\nYour verification code is ${otp}.\n\nThis code expires in 5 minutes. If you did not request this, you can ignore this email.`
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("Brevo OTP email failed", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody
    });
    throw new Error("Unable to send OTP email.");
  }
}

function professionalOtpEmail({
  otp,
  title,
  preview,
  message
}: {
  otp: string;
  title: string;
  preview: string;
  message: string;
}) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#047857;padding:24px 28px;color:#ffffff;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">DraftCareer</div>
                <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">${message}</p>
                <div style="margin:24px 0;padding:18px 20px;border:1px solid #d1fae5;border-radius:10px;background:#ecfdf5;text-align:center;">
                  <div style="font-size:13px;color:#047857;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Verification code</div>
                  <div style="margin-top:8px;font-size:34px;line-height:1;font-weight:800;letter-spacing:8px;color:#064e3b;">${otp}</div>
                </div>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">This code expires in <strong>5 minutes</strong>. If you did not request this email, you can safely ignore it.</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e5e7eb;padding:18px 28px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5;">
                Sent by DraftCareer. Please do not share this code with anyone.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
