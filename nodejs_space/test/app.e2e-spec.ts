import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('SipHappens E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let distilleryId: string;
  let spiritId: string;
  let pourId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Authentication', () => {
    it('should signup a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/signup')
        .send({
          email: 'e2etest@example.com',
          password: 'password123',
          name: 'E2E Test User',
          ageVerified: true,
          ageVerificationTimestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('e2etest@example.com');
      authToken = response.body.token;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'john@doe.com',
          password: 'johndoe123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('john@doe.com');
    });

    it('should get current user profile', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'john@doe.com',
          password: 'johndoe123',
        });

      const token = loginResponse.body.token;

      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe('john@doe.com');
    });
  });

  describe('Distilleries', () => {
    it('should create a new distillery', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/distilleries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Distillery',
          country: 'Scotland',
          region: 'Speyside',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('E2E Test Distillery');
      distilleryId = response.body.id;
    });

    it('should search distilleries', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/distilleries/search?q=E2E')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Spirits', () => {
    it('should create a new spirit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/spirits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Spirit',
          distilleryId: distilleryId,
          category: 'Whisky',
          style: 'Single Malt',
          abv: 40,
          region: 'Speyside',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('E2E Test Spirit');
      spiritId = response.body.id;
    });

    it('should get spirit by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/spirits/${spiritId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(spiritId);
      expect(response.body.name).toBe('E2E Test Spirit');
    });

    it('should search spirits', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/spirits?q=E2E')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Pours', () => {
    it('should create a new pour', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/pours')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          spiritId: spiritId,
          whyItHit: 'This is a test pour with smooth vanilla notes that really hit the spot!',
          isShared: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.whyItHit).toContain('test pour');
      pourId = response.body.id;
    });

    it('should get all pours', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pours')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get pour by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/pours/${pourId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(pourId);
    });

    it('should filter pours by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pours?category=Whisky')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update a pour', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/pours/${pourId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          whyItHit: 'Updated test pour with even better notes!',
        })
        .expect(200);

      expect(response.body.whyItHit).toContain('Updated test pour');
    });

    it('should delete a pour', async () => {
      await request(app.getHttpServer())
        .delete(`/api/pours/${pourId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Profile', () => {
    it('should get user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
    });

    it('should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Updated Name',
          bio: 'E2E test bio',
          experienceLevel: 'Social',
        })
        .expect(200);

      expect(response.body.name).toBe('E2E Updated Name');
      expect(response.body.bio).toBe('E2E test bio');
    });
  });

  describe('Flavor Tags', () => {
    it('should get all flavor tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flavor-tags')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(10);
    });
  });
});