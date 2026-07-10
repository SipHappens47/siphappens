import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Lightweight health check for uptime monitors and keep-warm pings.
  // Verifies the process is up and the database is reachable.
  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'degraded', db: 'down', timestamp: new Date().toISOString() };
    }
  }
}
