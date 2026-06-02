import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupWhitespace() {
  console.log('\n=== CLEANING WHITESPACE FROM DATABASE ===');
  
  // Clean distilleries
  const distilleries = await prisma.distillery.findMany();
  let distilleriesUpdated = 0;
  
  for (const distillery of distilleries) {
    const updates: any = {};
    let needsUpdate = false;
    
    if (distillery.name && distillery.name !== distillery.name.trim()) {
      updates.name = distillery.name.trim();
      needsUpdate = true;
    }
    
    if (distillery.country && distillery.country !== distillery.country.trim()) {
      updates.country = distillery.country.trim();
      needsUpdate = true;
    }
    
    if (distillery.region && distillery.region !== distillery.region.trim()) {
      updates.region = distillery.region.trim();
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await prisma.distillery.update({
        where: { id: distillery.id },
        data: updates,
      });
      distilleriesUpdated++;
    }
  }
  
  console.log(`✅ Cleaned ${distilleriesUpdated} distilleries`);
  
  // Clean spirits
  const spirits = await prisma.spirit.findMany();
  let spiritsUpdated = 0;
  
  for (const spirit of spirits) {
    const updates: any = {};
    let needsUpdate = false;
    
    if (spirit.name && spirit.name !== spirit.name.trim()) {
      updates.name = spirit.name.trim();
      needsUpdate = true;
    }
    
    if (spirit.category && spirit.category !== spirit.category.trim()) {
      updates.category = spirit.category.trim();
      needsUpdate = true;
    }
    
    if (spirit.style && spirit.style !== spirit.style.trim()) {
      updates.style = spirit.style.trim();
      needsUpdate = true;
    }
    
    if (spirit.region && spirit.region !== spirit.region.trim()) {
      updates.region = spirit.region.trim();
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await prisma.spirit.update({
        where: { id: spirit.id },
        data: updates,
      });
      spiritsUpdated++;
    }
  }
  
  console.log(`✅ Cleaned ${spiritsUpdated} spirits`);
  
  // Clean users
  const users = await prisma.user.findMany();
  let usersUpdated = 0;
  
  for (const user of users) {
    const updates: any = {};
    let needsUpdate = false;
    
    if (user.name && user.name !== user.name.trim()) {
      updates.name = user.name.trim();
      needsUpdate = true;
    }
    
    if (user.bio && user.bio !== user.bio.trim()) {
      updates.bio = user.bio.trim();
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      usersUpdated++;
    }
  }
  
  console.log(`✅ Cleaned ${usersUpdated} users`);
  
  console.log('\n✅ WHITESPACE CLEANUP COMPLETE\n');
}

async function main() {
  try {
    await cleanupWhitespace();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
