import { createHash } from 'crypto';

// A ban deletes the account, so its email is remembered separately to stop it
// signing up again. No schema change: the ban is kept as a Resolved report row
// with this target type, holding a SHA-256 of the normalised email rather than
// the address itself. Users cannot create such rows (ReportDto only allows
// 'pour' and 'user', and user reports start Open).
export const BANNED_EMAIL_TARGET = 'banned_email';

export function bannedEmailKey(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export async function isBannedEmail(prisma: any, email: string | undefined): Promise<boolean> {
  if (!email?.trim()) return false;
  const ban = await prisma.report.findFirst({
    where: { targettype: BANNED_EMAIL_TARGET, targetid: bannedEmailKey(email), status: 'Resolved' },
    select: { id: true },
  });
  return !!ban;
}

export async function recordBannedEmail(prisma: any, adminUserId: string, email: string, reportId: string) {
  await prisma.report.create({
    data: {
      reporterid: adminUserId,
      targettype: BANNED_EMAIL_TARGET,
      targetid: bannedEmailKey(email),
      reason: `Account banned via report ${reportId}`,
      status: 'Resolved',
    },
  });
}
