import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateDistilleries() {
  console.log('\n=== CLEANING UP DUPLICATE DISTILLERIES ===');
  
  const allDistilleries = await prisma.distillery.findMany({
    orderBy: { createdat: 'asc' },
  });

  const nameGroups = new Map<string, any[]>();
  
  for (const distillery of allDistilleries) {
    const normalizedName = distillery.name.trim().toLowerCase();
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, []);
    }
    nameGroups.get(normalizedName)!.push(distillery);
  }

  let duplicatesFound = 0;
  let duplicatesRemoved = 0;

  for (const [normalizedName, distilleries] of nameGroups) {
    if (distilleries.length > 1) {
      duplicatesFound += distilleries.length - 1;
      console.log(`\nFound ${distilleries.length} duplicates for "${distilleries[0].name}"`);
      
      const primaryDistillery = distilleries[0];
      const duplicates = distilleries.slice(1);

      for (const duplicate of duplicates) {
        console.log(`  Merging ${duplicate.id} into ${primaryDistillery.id}`);
        
        try {
          await prisma.spirit.updateMany({
            where: { distilleryid: duplicate.id },
            data: { distilleryid: primaryDistillery.id },
          });

          await prisma.pour.updateMany({
            where: { distilleryid: duplicate.id },
            data: { distilleryid: primaryDistillery.id },
          });

          await prisma.distilleryfollower.updateMany({
            where: { distilleryid: duplicate.id },
            data: { distilleryid: primaryDistillery.id },
          });

          await prisma.distilleryinsight.updateMany({
            where: { distilleryid: duplicate.id },
            data: { distilleryid: primaryDistillery.id },
          });

          if (duplicate.owneruserid && !primaryDistillery.owneruserid) {
            await prisma.distillery.update({
              where: { id: primaryDistillery.id },
              data: { owneruserid: duplicate.owneruserid },
            });
          }

          await prisma.distillery.delete({
            where: { id: duplicate.id },
          });

          duplicatesRemoved++;
          console.log(`  ✅ Removed duplicate ${duplicate.id}`);
        } catch (error: any) {
          console.error(`  ❌ Failed to merge ${duplicate.id}:`, error.message);
        }
      }
    }
  }

  console.log(`\n✅ Distillery cleanup: Found ${duplicatesFound}, Removed ${duplicatesRemoved}`);
}

async function cleanupDuplicateSpirits() {
  console.log('\n=== CLEANING UP DUPLICATE SPIRITS ===');
  
  const allSpirits = await prisma.spirit.findMany({
    orderBy: { createdat: 'asc' },
  });

  const groups = new Map<string, any[]>();
  
  for (const spirit of allSpirits) {
    const key = `${spirit.name.trim().toLowerCase()}::${spirit.distilleryid || 'null'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(spirit);
  }

  let duplicatesFound = 0;
  let duplicatesRemoved = 0;

  for (const [key, spirits] of groups) {
    if (spirits.length > 1) {
      duplicatesFound += spirits.length - 1;
      console.log(`\nFound ${spirits.length} duplicates for "${spirits[0].name}"`);
      
      const primarySpirit = spirits[0];
      const duplicates = spirits.slice(1);

      for (const duplicate of duplicates) {
        try {
          await prisma.pour.updateMany({
            where: { spiritid: duplicate.id },
            data: { spiritid: primarySpirit.id },
          });

          await prisma.radar.updateMany({
            where: { spiritid: duplicate.id },
            data: { spiritid: primarySpirit.id },
          });

          await prisma.spiritflavortag.deleteMany({
            where: { spiritid: duplicate.id },
          });

          const insight = await prisma.distilleryinsight.findUnique({
            where: { spiritid: duplicate.id },
          });
          
          if (insight) {
            await prisma.distilleryinsight.delete({
              where: { id: insight.id },
            });
          }

          await prisma.spirit.delete({
            where: { id: duplicate.id },
          });

          duplicatesRemoved++;
        } catch (error: any) {
          console.error(`  ❌ Failed to merge ${duplicate.id}:`, error.message);
        }
      }
    }
  }

  console.log(`\n✅ Spirit cleanup: Found ${duplicatesFound}, Removed ${duplicatesRemoved}`);
}

async function main() {
  try {
    await cleanupDuplicateDistilleries();
    await cleanupDuplicateSpirits();
    console.log('\n✅ ALL CLEANUP COMPLETE\n');
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
