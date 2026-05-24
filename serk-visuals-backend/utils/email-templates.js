// utils/email-templates.js
const { PUBLIC_APP_URL } = process.env;

const fmt = (iso) => {
  try {
    if (!iso) return "N/A";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
};

function customerConfirmation(booking) {
  const { name, type, date, message } = booking || {};
  const when = fmt(date);
  const portal = PUBLIC_APP_URL || "#";

  const subject = `Booking received — ${when}`;
  const text = `Hi ${name || "there"},

Thanks for booking with Serk Visuals!
Here are your details:

• Session type: ${type || "N/A"}
• When: ${when}
• Notes: ${message || "—"}

We’ll review it and get back to you shortly.
– Serk Visuals`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:auto;padding:16px;color:#111;">
    <h2>Thanks for your booking, ${name || "there"}!</h2>
    <p>We’ve received your request. Here are the details:</p>
    <table style="border-collapse:collapse;width:100%;margin:12px 0;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;">Session type</td><td style="padding:8px;border-bottom:1px solid #eee;"><strong>${
        type || "N/A"
      }</strong></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;">When</td><td style="padding:8px;border-bottom:1px solid #eee;"><strong>${when}</strong></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;">Notes</td><td style="padding:8px;border-bottom:1px solid #eee;">${(
        message || "—"
      )
        .toString()
        .replace(/</g, "&lt;")}</td></tr>
    </table>
    <p>We’ll confirm with you soon. If you need to update anything, reply to this email.</p>
    <p><a href="${portal}" style="color:#2563eb;">Visit our website</a></p>
    <p style="color:#666">– Serk Visuals</p>
  </div>`;

  return { subject, text, html };
}

function adminNotification(booking) {
  const { name, email, phone, type, date, durationMinutes, message, status, createdAt, _id } =
    booking || {};
  const when = fmt(date);
  const submittedAt = fmt(createdAt);
  const duration = durationMinutes ? `${durationMinutes} min` : "N/A";

  const subject = `New booking: ${name || "Unknown"} — ${when}`;
  const text = `New booking received

Client:    ${name || "N/A"}
Email:     ${email || "N/A"}
Phone:     ${phone ?? "N/A"}
Service:   ${type || "N/A"}
Date/Time: ${when}
Duration:  ${duration}
Message:   ${message || "—"}
Status:    ${status || "new"}
Submitted: ${submittedAt}
ID:        ${_id || "N/A"}`;

  const row = (label, value) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">${label}</td><td style="padding:8px;border-bottom:1px solid #eee;"><strong>${value}</strong></td></tr>`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:auto;padding:16px;color:#111;">
    <h2 style="margin-top:0;">New booking received</h2>
    <table style="border-collapse:collapse;width:100%;margin:12px 0;">
      ${row("Client", name || "N/A")}
      ${row("Email", email || "N/A")}
      ${row("Phone", phone ?? "N/A")}
      ${row("Service", type || "N/A")}
      ${row("Date / Time", when)}
      ${row("Duration", duration)}
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Message</td><td style="padding:8px;border-bottom:1px solid #eee;">${(message || "—").toString().replace(/</g, "&lt;")}</td></tr>
      ${row("Status", status || "new")}
      ${row("Submitted", submittedAt)}
      ${row("Booking ID", _id || "N/A")}
    </table>
  </div>`;

  return { subject, text, html };
}

module.exports = { customerConfirmation, adminNotification };
