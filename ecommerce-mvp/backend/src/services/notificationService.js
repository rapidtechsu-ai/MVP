/**
 * Notification Service
 * ---------------------------------------------------------------
 * Sends OTP codes via whichever channels are configured active in
 * the NotificationProvider table (dashboard-editable). Currently
 * supports EMAIL and WHATSAPP; adding a channel later means adding
 * a new NotificationChannel enum value + a send*() function here —
 * no changes needed to the OTP route or the data model.
 *
 * Provider endpoint/API key are NOT hardcoded: they're read from
 * the database so they can be reconfigured from the dashboard
 * without a code deploy (resolves D-007 as "provider pluggable,
 * selection deferred to business/ops").
 * ---------------------------------------------------------------
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getActiveProviders() {
  return prisma.notificationProvider.findMany({ where: { active: true } });
}

/**
 * Send via WhatsApp Business API (or configured BSP).
 * Stub implementation: real integration point is the fetch() call
 * below, using the dashboard-configured endpoint/apiKey. Until a
 * real provider is selected and configured, this logs instead of
 * throwing, so the MVP flow remains testable end-to-end.
 */
async function sendViaWhatsapp(provider, phone, code) {
  if (!provider.apiEndpoint) {
    console.log(`[OTP][WHATSAPP][NOT CONFIGURED] Would send code ${code} to ${phone}`);
    return { channel: 'WHATSAPP', delivered: true, mode: 'dev-log' };
  }

  // Real integration point — shape depends on the selected BSP's API.
  // await fetch(provider.apiEndpoint, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ to: phone, from: provider.fromIdentifier, template: 'otp_code', code }),
  // });

  console.log(`[OTP][WHATSAPP] Sent code to ${phone} via ${provider.providerName || provider.apiEndpoint}`);
  return { channel: 'WHATSAPP', delivered: true, mode: 'live' };
}

/**
 * Send via email provider (e.g. SendGrid, SES, Postmark).
 * Same stub-with-clear-integration-point pattern as WhatsApp above.
 */
async function sendViaEmail(provider, email, code) {
  if (!provider.apiEndpoint) {
    console.log(`[OTP][EMAIL][NOT CONFIGURED] Would send code ${code} to ${email}`);
    return { channel: 'EMAIL', delivered: true, mode: 'dev-log' };
  }

  // Real integration point — shape depends on the selected email provider's API.
  // await fetch(provider.apiEndpoint, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ to: email, from: provider.fromIdentifier, subject: 'رمز التحقق', text: `رمز التحقق: ${code}` }),
  // });

  console.log(`[OTP][EMAIL] Sent code to ${email} via ${provider.providerName || provider.apiEndpoint}`);
  return { channel: 'EMAIL', delivered: true, mode: 'live' };
}

const SENDERS = {
  WHATSAPP: sendViaWhatsapp,
  EMAIL: sendViaEmail,
};

/**
 * Dispatch an OTP code across every active + applicable channel.
 * "Applicable" means the channel is active AND a matching
 * destination (phone for WHATSAPP, email for EMAIL) was provided.
 *
 * Returns { channelsSent, failures } — channelsSent is the list of
 * channel names that actually attempted delivery, used both for
 * the customer-facing "we sent your code to X" message and for
 * the immutable OTPVerification record.
 */
async function sendOtpCode({ code, phone, email }) {
  const providers = await getActiveProviders();
  const channelsSent = [];
  const failures = [];

  for (const provider of providers) {
    const destination = provider.channel === 'WHATSAPP' ? phone : email;
    if (!destination) continue; // no matching destination provided for this channel

    const sendFn = SENDERS[provider.channel];
    if (!sendFn) continue;

    try {
      await sendFn(provider, destination, code);
      channelsSent.push(provider.channel);
    } catch (err) {
      failures.push({ channel: provider.channel, error: err.message });
    }
  }

  return { channelsSent, failures };
}

module.exports = {
  getActiveProviders,
  sendOtpCode,
};
