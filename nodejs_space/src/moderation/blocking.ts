import { NotFoundException } from '@nestjs/common';

// SH-C02: blocking is two-way. Neither user sees the other's profile, pours,
// feed items, search results, cheers or notifications, and neither can
// connect, cheer or otherwise interact. Blocked content answers "not found"
// so a block is not disclosed to the other side.

export async function getHiddenUserIds(prisma: any, userId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerid: userId }, { blockedid: userId }] },
    select: { blockerid: true, blockedid: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) {
    ids.add(b.blockerid === userId ? b.blockedid : b.blockerid);
  }
  return [...ids];
}

export async function isBlockedBetween(prisma: any, userA: string, userB: string): Promise<boolean> {
  if (!userA || !userB || userA === userB) return false;
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerid: userA, blockedid: userB },
        { blockerid: userB, blockedid: userA },
      ],
    },
    select: { id: true },
  });
  return !!block;
}

export async function assertNotBlocked(
  prisma: any,
  viewerId: string,
  targetUserId: string,
  message = 'User not found',
): Promise<void> {
  if (await isBlockedBetween(prisma, viewerId, targetUserId)) {
    throw new NotFoundException(message);
  }
}
