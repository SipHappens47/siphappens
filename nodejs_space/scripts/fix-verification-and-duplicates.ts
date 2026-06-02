import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================
// ISSUE 1: FIX VERIFIED SEEDED DISTILLERIES
// ============================
async function fixVerifiedSeededDistilleries() {
  console.log('\n=== FIXING VERIFIED SEEDED DISTILLERIES ===');
  
  const verifiedSeeded = await prisma.distillery.findMany({
    where: {
      verified: true,
      owneruserid: null
    }
  });
  
  console.log(`Found ${verifiedSeeded.length} seeded distilleries incorrectly marked as verified:`);
  verifiedSeeded.forEach(d => console.log(`  - ${d.name}`));
  
  if (verifiedSeeded.length > 0) {
    await prisma.distillery.updateMany({
      where: {
        verified: true,
        owneruserid: null
      },
      data: {
        verified: false
      }
    });
    
    console.log(`✅ Fixed ${verifiedSeeded.length} distilleries - set verified = false`);
  } else {
    console.log('✅ No seeded distilleries incorrectly verified');
  }
}

// ============================
// ISSUE 2: FIND SEMANTIC DUPLICATES
// ============================
function tokenize(name: string): Set<string> {
  return new Set(
    name.toLowerCase()
      .replace(/[\/\(\)\-,\.]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2) // Ignore short words like "the", "of"
  );
}

function calculateSimilarity(name1: string, name2: string): number {
  const tokens1 = tokenize(name1);
  const tokens2 = tokenize(name2);
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

async function findSemanticDuplicates() {
  console.log('\n=== FINDING SEMANTIC DUPLICATES ===');
  
  const allDistilleries = await prisma.distillery.findMany({
    select: { id: true, name: true, owneruserid: true, verified: true },
    orderBy: { name: 'asc' }
  });
  
  const duplicateGroups: Array<{ primary: any; duplicates: any[]; similarity: number }> = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < allDistilleries.length; i++) {
    if (processed.has(allDistilleries[i].id)) continue;
    
    const group: any[] = [];
    const primary = allDistilleries[i];
    
    for (let j = i + 1; j < allDistilleries.length; j++) {
      if (processed.has(allDistilleries[j].id)) continue;
      
      const similarity = calculateSimilarity(primary.name, allDistilleries[j].name);
      
      // Consider duplicates if similarity > 60%
      if (similarity > 0.6) {
        group.push({
          ...allDistilleries[j],
          similarity
        });
        processed.add(allDistilleries[j].id);
      }
    }
    
    if (group.length > 0) {
      duplicateGroups.push({
        primary,
        duplicates: group,
        similarity: Math.max(...group.map(d => d.similarity))
      });
      processed.add(primary.id);
    }
  }
  
  console.log(`Found ${duplicateGroups.length} potential duplicate groups:\n`);
  
  duplicateGroups.forEach((grp, idx) => {
    console.log(`Group ${idx + 1} (${grp.duplicates.length + 1} distilleries, ${(grp.similarity * 100).toFixed(0)}% similarity):`);
    console.log(`  PRIMARY: ${grp.primary.name} (ID: ${grp.primary.id.substring(0, 8)})`);
    grp.duplicates.forEach(d => {
      console.log(`  DUPLICATE: ${d.name} (ID: ${d.id.substring(0, 8)}, ${(d.similarity * 100).toFixed(0)}% match)`);
    });
    console.log('');
  });
  
  return duplicateGroups;
}

// ============================
// ISSUE 3: MERGE DUPLICATES
// ============================
async function mergeDuplicates(duplicateGroups: Array<{ primary: any; duplicates: any[] }>) {
  console.log('\n=== MERGING DUPLICATES ===');
  
  let totalMerged = 0;
  
  for (const group of duplicateGroups) {
    const primaryId = group.primary.id;
    const duplicateIds = group.duplicates.map(d => d.id);
    
    console.log(`\nMerging ${duplicateIds.length} duplicates into: ${group.primary.name}`);
    
    // Reassign spirits
    const spiritsUpdated = await prisma.spirit.updateMany({
      where: { distilleryid: { in: duplicateIds } },
      data: { distilleryid: primaryId }
    });
    console.log(`  ✓ Reassigned ${spiritsUpdated.count} spirits`);
    
    // Reassign pours (note: distilleryid can be null, only update non-null)
    const poursUpdated = await prisma.pour.updateMany({
      where: { 
        distilleryid: { in: duplicateIds }
      },
      data: { distilleryid: primaryId }
    });
    console.log(`  ✓ Reassigned ${poursUpdated.count} pours`);
    
    // Reassign followers - remove duplicates first to avoid unique constraint violations
    const existingFollowers = await prisma.distilleryfollower.findMany({
      where: { distilleryid: primaryId },
      select: { userid: true }
    });
    const existingUserIds = new Set(existingFollowers.map(f => f.userid));
    
    const duplicateFollowers = await prisma.distilleryfollower.findMany({
      where: { distilleryid: { in: duplicateIds } }
    });
    
    // Delete duplicate followers that would violate unique constraint
    const duplicateFollowersToDelete = duplicateFollowers
      .filter(f => existingUserIds.has(f.userid))
      .map(f => f.id);
    
    if (duplicateFollowersToDelete.length > 0) {
      await prisma.distilleryfollower.deleteMany({
        where: { id: { in: duplicateFollowersToDelete } }
      });
      console.log(`  ✓ Removed ${duplicateFollowersToDelete.length} duplicate followers`);
    }
    
    // Now update remaining followers
    const followersUpdated = await prisma.distilleryfollower.updateMany({
      where: { distilleryid: { in: duplicateIds } },
      data: { distilleryid: primaryId }
    });
    console.log(`  ✓ Reassigned ${followersUpdated.count} followers`);
    
    // Reassign insights
    const insightsUpdated = await prisma.distilleryinsight.updateMany({
      where: { distilleryid: { in: duplicateIds } },
      data: { distilleryid: primaryId }
    });
    console.log(`  ✓ Reassigned ${insightsUpdated.count} insights`);
    
    // Delete duplicate distilleries
    const deleted = await prisma.distillery.deleteMany({
      where: { id: { in: duplicateIds } }
    });
    console.log(`  ✓ Deleted ${deleted.count} duplicate distillery records`);
    
    totalMerged += duplicateIds.length;
  }
  
  console.log(`\n✅ Total duplicates merged: ${totalMerged}`);
}

// ============================
// MAIN EXECUTION
// ============================
async function main() {
  try {
    // Fix 1: Remove verified status from seeded distilleries
    await fixVerifiedSeededDistilleries();
    
    // Fix 2: Find semantic duplicates
    const duplicateGroups = await findSemanticDuplicates();
    
    // Fix 3: Merge duplicates
    if (duplicateGroups.length > 0) {
      await mergeDuplicates(duplicateGroups);
    } else {
      console.log('\n✅ No duplicates to merge');
    }
    
    console.log('\n=== ALL FIXES COMPLETE ===\n');
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
