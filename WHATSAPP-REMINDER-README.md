# WhatsApp fee reminder

Restart backend and frontend after extracting. Refresh the Attendance page.
Open "WhatsApp reminder settings" above the register. Enter academy name,
custom template, optional public HTTPS QR image/page link and optional UPI ID.
Save. Settings are scoped to the signed-in user/academy on THIS browser, not
synced between devices. Never use a private payment-management/dashboard URL.
Verify the QR link opens without login and displays the correct recipient.

Click DUE / 2M DUE / OVERDUE. WhatsApp opens for the row's displayed contact with
text prefilled. Press Send yourself. PAID and other statuses are plain text.
No message is sent by the app and no delivered/sent status is claimed.
WhatsApp must be installed or WhatsApp Web logged in; the destination number
must use WhatsApp. Browser popup restrictions may need to allow wa.me opening.

India: local 10-digit and +91 numbers supported. Other countries: save the phone
in explicit +country-code format. Missing/ambiguous numbers display an error.
The app cannot determine whether a phone has a WhatsApp account.

QR is a text link, not an automatically attached image. No QR hosting, API key,
Meta Business registration or paid messaging service is added. No real message
was sent in testing. Three helper tests and production build verified.

This package assumes the previously delivered attendance files are installed.
