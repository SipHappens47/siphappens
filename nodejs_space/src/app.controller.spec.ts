import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      // Fake Prisma: no database connection in unit tests.
      providers: [AppService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('reports ok when the database answers', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      await expect(appController.health()).resolves.toMatchObject({ status: 'ok', db: 'up' });
    });

    it('reports degraded when the database is unreachable', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('unreachable'));
      await expect(appController.health()).resolves.toMatchObject({ status: 'degraded', db: 'down' });
    });
  });
});
