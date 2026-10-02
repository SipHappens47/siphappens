import { Controller, Post, UseGuards, Body, UploadedFile, UseInterceptors, BadRequestException, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SeedService } from './seed.service';
import { AdminService } from '../admin/admin.service';
import { Logger } from '@nestjs/common';

@Controller('api/seed')
@UseGuards(JwtAuthGuard)
export class SeedController {
  private readonly logger = new Logger(SeedController.name);

  constructor(
    private readonly seedService: SeedService,
    private readonly adminService: AdminService,
  ) {}

  // Every seed route writes or inspects the shared catalogue, so all are admin-only.
  @Post('auto-import')
  async autoImport(@Request() req: any) {
    await this.adminService.checkAdminAccess(req.user.userId);
    this.logger.log('Starting auto-import from Connecticut and Iowa datasets');
    
    try {
      const result = await this.seedService.autoImportFromPublicDatasets();
      return {
        success: true,
        message: `Successfully imported ${result.totalImported} spirits`,
        details: result,
      };
    } catch (error: any) {
      this.logger.error('Auto-import failed:', error?.message ?? error);
      throw new BadRequestException(error?.message ?? 'Auto-import failed');
    }
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@Request() req: any, @UploadedFile() file: any) {
    await this.adminService.checkAdminAccess(req.user.userId);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Processing uploaded CSV: ${file.originalname}`);
    
    try {
      const result = await this.seedService.importFromUploadedCsv(file.buffer);
      return {
        success: true,
        message: `Successfully imported ${result.totalImported} spirits from ${file.originalname}`,
        details: result,
      };
    } catch (error: any) {
      this.logger.error('CSV upload failed:', error?.message ?? error);
      throw new BadRequestException(error?.message ?? 'CSV upload failed');
    }
  }

  @Post('get-stats')
  async getStats(@Request() req: any) {
    await this.adminService.checkAdminAccess(req.user.userId);
    const stats = await this.seedService.getDatabaseStats();
    return stats;
  }

  @Post('seed-test-distilleries')
  async seedTestDistilleries(@Request() req: any) {
    await this.adminService.checkAdminAccess(req.user.userId);
    this.logger.log('Starting test distillery seeding');
    
    try {
      const result = await this.seedService.seedTestDistilleries();
      return {
        success: true,
        message: `Successfully seeded ${result.count} test distilleries`,
        count: result.count,
      };
    } catch (error: any) {
      this.logger.error('Test distillery seeding failed:', error?.message ?? error);
      throw new BadRequestException(error?.message ?? 'Failed to seed test distilleries');
    }
  }
}
