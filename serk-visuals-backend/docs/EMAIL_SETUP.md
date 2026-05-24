# Email Notification Setup

When a client successfully submits a booking, you automatically receive an email with the full booking details.

The implementation reuses the existing `nodemailer` stack (`utils/mailer.js` + `utils/email-templates.js`).
Email errors are caught silently — a failed send never breaks the booking.

---

## Required environment variables

Add these to `config/.env`:

| Variable     | Description                                                   | Example                              |
|--------------|---------------------------------------------------------------|--------------------------------------|
| `EMAIL_HOST` | SMTP server hostname                                          | `smtp.gmail.com`                     |
| `EMAIL_PORT` | SMTP port (`465` for TLS, `587` for STARTTLS)                 | `465`                                |
| `EMAIL_USER` | Your Gmail address (or other SMTP username)                   | `you@gmail.com`                      |
| `EMAIL_PASS` | Gmail App Password (16 chars, no spaces)                      | `abcd efgh ijkl mnop` → `abcdefghijklmnop` |
| `EMAIL_TO`   | Where YOU receive booking notifications                       | `you@gmail.com`                      |
| `EMAIL_FROM` | "From" label shown in the email (must match `EMAIL_USER`)     | `Serk Visuals <you@gmail.com>`       |

> `EMAIL_SECURE` is optional. Port 465 is automatically treated as TLS (`true`); port 587 as STARTTLS (`false`).

---

## Gmail App Password setup (free, recommended)

Gmail App Passwords let you use Gmail SMTP without your real password and without disabling 2FA.

1. Go to your Google Account → **Security**.
2. Make sure **2-Step Verification** is ON (required).
3. Search for **"App Passwords"** in the security page and open it.
4. Select app: **Mail** — Select device: **Other (custom name)** → type `Serk Visuals`.
5. Click **Generate**. Copy the 16-character password shown.
6. Paste it (no spaces) into `EMAIL_PASS` in `config/.env`.

> App Passwords only appear if 2-Step Verification is enabled on the account.

---

## What the notification email includes

- Client name
- Client email
- Client phone number
- Selected service / session type
- Booking date and time
- Duration (minutes)
- Message / notes
- Booking status
- Submission timestamp
- Booking ID

---

## Testing checklist

- [ ] Fill in all `EMAIL_*` vars in `config/.env`.
- [ ] Restart the backend (`npm run dev` or `npm start`).
- [ ] Check the console for `✅ SMTP connection verified.` on startup.
- [ ] Submit a test booking via the booking form on the frontend.
- [ ] Confirm the booking returns HTTP 201 and the client sees the success message.
- [ ] Confirm you received the notification email within ~30 seconds.
- [ ] Confirm the admin booking list still shows the new booking.
- [ ] If the email does NOT arrive, check the backend logs for `Email send error:`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `SMTP verify failed: EAUTH` | App Password is wrong or has spaces — regenerate it. |
| `SMTP verify failed: ECONNREFUSED` | Wrong `EMAIL_HOST` / `EMAIL_PORT`. Gmail: host=`smtp.gmail.com`, port=`465`. |
| `SMTP verify failed: ETIMEDOUT` | Firewall or server is blocking outbound SMTP. Try port `587`. |
| Email arrives in spam | Set `EMAIL_FROM` to match `EMAIL_USER` exactly. |
| No log for `SMTP connection verified` | Backend did not restart after `.env` changes. |
