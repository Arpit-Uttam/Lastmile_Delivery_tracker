const nodemailer = require("nodemailer");

// Configure transporter (uses SMTP env vars; falls back to Ethereal for dev)
let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("Using Ethereal test email. Preview at: https://ethereal.email");
  }
  return transporter;
}

const STATUS_MESSAGES = {
  CREATED: "Your order has been created and is awaiting confirmation.",
  CONFIRMED: "Your order has been confirmed.",
  ASSIGNED: "A delivery agent has been assigned to your order.",
  PICKED_UP: "Your package has been picked up by the delivery agent.",
  IN_TRANSIT: "Your package is in transit.",
  OUT_FOR_DELIVERY: "Your package is out for delivery. Expect it soon!",
  DELIVERED: "Your package has been delivered successfully. Thank you!",
  FAILED: "Delivery attempt failed. Please reschedule your delivery.",
  RESCHEDULED: "Your delivery has been rescheduled.",
};

async function sendStatusEmail(to, name, trackingNumber, status, note) {
  try {
    const t = await getTransporter();
    const message = note || STATUS_MESSAGES[status] || `Order status updated to ${status}.`;
    const info = await t.sendMail({
      from: `"Delivery Tracker" <${process.env.SMTP_FROM || "noreply@delivery.com"}>`,
      to,
      subject: `Order ${trackingNumber} - Status: ${status.replace(/_/g, " ")}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#2563eb">Delivery Update</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>${message}</p>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
            <strong>Tracking Number:</strong> ${trackingNumber}<br/>
            <strong>Status:</strong> ${status.replace(/_/g, " ")}
          </div>
          <p>Track your order anytime at your delivery portal.</p>
        </div>
      `,
    });
    console.log(`Email sent to ${to}: ${nodemailer.getTestMessageUrl(info) || info.messageId}`);
  } catch (err) {
    console.error("Email send error:", err.message);
  }
}

async function sendSMS(phone, message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !phone) return;
  try {
    const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER,
      to: phone,
    });
  } catch (err) {
    console.error("SMS send error:", err.message);
  }
}

async function notifyCustomer(customer, trackingNumber, status, note) {
  const message = note || STATUS_MESSAGES[status] || `Status: ${status}`;
  await Promise.all([
    sendStatusEmail(customer.email, customer.name, trackingNumber, status, note),
    sendSMS(customer.phone, `[DeliveryTracker] Order ${trackingNumber}: ${message}`),
  ]);
}

module.exports = { notifyCustomer };
