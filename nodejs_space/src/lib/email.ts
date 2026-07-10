import { Logger } from '@nestjs/common';

const logger = new Logger('Email');

// Minimal transactional email via Resend's REST API (no SDK dependency).
// Swap the provider here if you move off Resend — callers don't change.
// If RESEND_API_KEY is unset, we log instead of throwing so flows that email
// (e.g. password reset) still behave correctly in dev without a key.
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'SipHappens <onboarding@resend.dev>';

  if (!apiKey) {
    logger.warn(`RESEND_API_KEY not set — skipping email to ${to} ("${subject}")`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error(`Failed to send email to ${to}: ${res.status} ${body}`);
    throw new Error('Failed to send email');
  }
}
