import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import { ReportDto } from './dto/report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import * as s3 from '../lib/s3';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  // ---- Reporting -------------------------------------------------------
  async reportContent(reporterId: string, dto: ReportDto) {
    await this.prisma.report.create({
      data: {
        reporterid: reporterId,
        targettype: dto.targetType,
        targetid: dto.targetId,
        reason: dto.reason,
      },
    });
    return { success: true };
  }

  // ---- Blocking --------------------------------------------------------
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }
    await this.prisma.block.upsert({
      where: { blockerid_blockedid: { blockerid: blockerId, blockedid: blockedId } },
      update: {},
      create: { blockerid: blockerId, blockedid: blockedId },
    });
    return { success: true };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerid: blockerId, blockedid: blockedId },
    });
    return { success: true };
  }

  async getMyBlocks(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerid: userId },
      select: { blockedid: true },
    });
    return blocks.map((b) => b.blockedid);
  }

  // Every user id the given user should not see content from: people they
  // blocked, plus people who blocked them. Used to filter feeds and search.
  async getHiddenUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerid: userId }, { blockedid: userId }] },
      select: { blockerid: true, blockedid: true },
    });
    const ids = new Set<string>();
    for (const b of blocks) {
      ids.add(b.blockerid === userId ? b.blockedid : b.blockerid);
    }
    return [...ids];
  }

  // ---- Admin review ----------------------------------------------------
  async listReports(adminUserId: string, status: string = 'Open') {
    await this.adminService.checkAdminAccess(adminUserId);
    return this.prisma.report.findMany({
      where: { status: status as any },
      orderBy: { createdat: 'desc' },
      include: { reporter: { select: { id: true, name: true, email: true } } },
    });
  }

  async resolveReport(adminUserId: string, reportId: string, dto: ResolveReportDto) {
    await this.adminService.checkAdminAccess(adminUserId);

    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (dto.action === 'delete_content' && report.targettype === 'pour') {
      // Cascade removes the pour's flavor tags and cheers.
      await this.prisma.pour.deleteMany({ where: { id: report.targetid } });
    }

    if (dto.action === 'ban_user') {
      // Resolve the user to eject: the reported user, or the pour's owner.
      let userIdToBan = report.targettype === 'user' ? report.targetid : null;
      if (!userIdToBan && report.targettype === 'pour') {
        const pour = await this.prisma.pour.findUnique({ where: { id: report.targetid } });
        userIdToBan = pour?.userid ?? null;
      }
      if (userIdToBan) {
        await this.deleteUserAndStorage(userIdToBan);
      }
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: dto.action === 'dismiss' ? 'Dismissed' : 'Resolved' },
    });

    return { success: true };
  }

  // Best-effort storage cleanup then cascade-delete the account.
  private async deleteUserAndStorage(userId: string) {
    const files = await this.prisma.file.findMany({
      where: { userid: userId },
      select: { cloudstoragepath: true },
    });
    for (const file of files) {
      try {
        await s3.deleteFile(file.cloudstoragepath);
      } catch (err: any) {
        this.logger.warn(`Failed to delete storage object ${file.cloudstoragepath}: ${err?.message}`);
      }
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
