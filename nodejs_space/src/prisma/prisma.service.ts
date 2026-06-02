import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL || '';
    const url = new URL(databaseUrl);
    
    // CRITICAL: Ultra-low connection pool to prevent exhaustion
    // Database role has limited connections - use absolute minimal pool
    url.searchParams.set('connection_limit', '1');
    url.searchParams.set('pool_timeout', '30');
    
    super({
      datasources: {
        db: {
          url: url.toString(),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}