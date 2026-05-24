// utils/mailer.js
const nodemailer = require("nodemailer");

// Support EMAIL_* names (preferred) with SMTP_* fallbacks for backward compat.
const SMTP_HOST   = process.env.EMAIL_HOST   || process.env.SMTP_HOST;
const SMTP_PORT   = process.env.EMAIL_PORT   || process.env.SMTP_PORT;
const SMTP_SECURE = process.env.EMAIL_SECURE || process.env.SMTP_SECURE;
const SMTP_USER   = process.env.EMAIL_USER   || process.env.SMTP_USER;
const SMTP_PASS   = process.env.EMAIL_PASS   || process.env.SMTP_PASS;
const MAIL_FROM   = process.env.EMAIL_FROM   || process.env.MAIL_FROM;
const { NODE_ENV } = process.env;

let transporter;
let verified = false;

/** Decide secure automatically if not explicitly set */
function computeSecure(portFromEnv, secureFromEnv) {
  if (typeof secureFromEnv === "string") {
    return secureFromEnv === "true";
  }
  const p = Number(portFromEnv || 587);
  return p === 465; // only 465 is implicit TLS
}

function getTransporter() {
  if (!transporter) {
    const secure = computeSecure(SMTP_PORT, SMTP_SECURE);

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure,
      auth:
        SMTP_USER && SMTP_PASS
          ? { user: SMTP_USER, pass: SMTP_PASS }
          : undefined,
      // Helpful when corporate proxies break TLS (dev only)
      tls:
        NODE_ENV !== "production" ? { rejectUnauthorized: false } : undefined,
    });

    // Log config (without password)
    console.log("✉️  SMTP config:", {
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure,
      hasAuth: Boolean(SMTP_USER && SMTP_PASS),
      user: SMTP_USER ? `${SMTP_USER.slice(0, 3)}***` : undefined,
      from: MAIL_FROM,
      env: NODE_ENV,
    });

    transporter.verify().then(
      () => {
        verified = true;
        console.log("✅ SMTP connection verified.");
      },
      (err) => {
        verified = false;
        console.warn(
          "⚠️  SMTP verify failed:",
          err?.code || err?.message || err
        );
        console.warn(
          "   Check .env: SMTP_HOST/PORT/SECURE/USER/PASS.\n" +
            "   • Mailtrap dev? Use host: sandbox.smtp.mailtrap.io and your Inbox creds.\n" +
            "   • Gmail? Use smtp.gmail.com with an App Password and port 465 + SMTP_SECURE=true."
        );
      }
    );
  }
  return transporter;
}

/** Send email. Logs preview URL when provider supports it. Never throws. */
async function sendMail({ to, subject, text, html, replyTo }) {
  try {
    const t = getTransporter();
    if (!verified) {
      console.warn("⚠️  SMTP not verified yet; attempting send anyway…");
    }

    const info = await t.sendMail({
      from: MAIL_FROM || "no-reply@example.com",
      to,
      subject,
      text,
      html,
      replyTo,
    });

    console.log("📨 Email sent:", info?.messageId || "(no id)");
    const preview = nodemailer.getTestMessageUrl?.(info);
    if (preview) console.log("🔎 Preview URL:", preview);

    return info;
  } catch (err) {
    console.error("Email send error:", err);
    return null; // do not crash the request flow
  }
}

module.exports = { sendMail };
