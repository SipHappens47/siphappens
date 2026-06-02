import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FlavorTagsService {
  constructor(private prisma: PrismaService) {}

  async getAllFlavorTags() {
    return this.prisma.flavortag.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}