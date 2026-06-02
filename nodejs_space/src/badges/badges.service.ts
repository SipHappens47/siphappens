import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Normalize region to country only (e.g., "Swartland, South Africa" -> "South Africa")
  private normalizeRegion(region: string): string {
    if (!region) return '';
    const parts = region.split(',').map(p => p.trim());
    if (parts.length > 1) {
      return parts[parts.length - 1]; // Return last part (country)
    }
    return region;
  }

  /**
   * Get user's unlocked badges with progress toward each badge
   */
  async getUserBadgesWithProgress(userId: string) {
    // Fetch all badges
    const allBadges = await this.prisma.badge.findMany({
      orderBy: { name: 'asc' },
    });

    // Fetch user's unlocked badges
    const unlockedBadges = await this.prisma.userbadge.findMany({
      where: { userid: userId },
      include: { badge: true },
    });

    // Calculate progress for each badge SEQUENTIALLY to avoid exhausting DB connections
    const badgesWithProgress: any[] = [];
    for (const badge of allBadges) {
      const criteria = badge.criteriajson as any;
      const progress = await this.calculateBadgeProgress(
        userId,
        criteria.type,
        criteria,
      );

      // Find user's unlocked tiers for this badge
      const userUnlocks = unlockedBadges.filter(
        (ub) => ub.badgeid === badge.id,
      );

      badgesWithProgress.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        imageUrl: badge.imageurl,
        criteria: criteria,
        unlocked: userUnlocks.map((u) => ({
          tier: u.tier,
          unlockedAt: u.unlockedat,
        })),
        progress,
      });
    }

    return badgesWithProgress;
  }

  /**
   * Calculate progress toward a specific badge type
   */
  private async calculateBadgeProgress(
    userId: string,
    type: string,
    criteria: any,
  ) {
    switch (type) {
      case 'unique_flavor_count':
        return await this.calculateFlavorProgress(userId, criteria);
      case 'unique_region_count':
        return await this.calculateRegionProgress(userId, criteria);
      case 'unique_category_style_combinations':
        return await this.calculateCategoryStyleProgress(userId, criteria);
      case 'unique_distillery_count':
        return await this.calculateDistilleryProgress(userId, criteria);
      case 'rare_high_rating':
        return await this.calculateHiddenGemProgress(userId, criteria);
      case 'unique_maturation_styles':
        return await this.calculateMaturationProgress(userId, criteria);
      case 'unique_proof_bands':
        return await this.calculateProofBandsProgress(userId, criteria);
      case 'unique_botanical_families':
        return await this.calculateBotanicalProgress(userId, criteria);
      case 'unique_heritage_categories':
        return await this.calculateHeritageProgress(userId, criteria);
      case 'contrast_sessions':
        return await this.calculateContrastProgress(userId, criteria);
      case 'underdog_high_ratings':
        return await this.calculateUnderdogProgress(userId, criteria);
      default:
        return { current: 0, target: 0, percentage: 0 };
    }
  }

  private async calculateFlavorProgress(userId: string, criteria: any) {
    const uniqueFlavors = await this.prisma.pourflavortag.findMany({
      where: {
        pour: { userid: userId },
      },
      distinct: ['flavortagid'],
      select: { flavortagid: true },
    });

    const current = uniqueFlavors.length;
    const target = criteria.target ?? 10;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateRegionProgress(userId: string, criteria: any) {
    // Count unique COUNTRIES ONLY - from both distillery.country and normalized spirit.region
    const allPours = await this.prisma.pour.findMany({
      where: {
        userid: userId,
      },
      select: {
        spirit: { 
          select: { 
            region: true,
            distillery: { select: { country: true } } 
          } 
        },
      },
      distinct: ['spiritid'],
    });

    const countrySet = new Set<string>();
    
    allPours.forEach((pour) => {
      // Prefer distillery country if available
      if (pour?.spirit?.distillery?.country) {
        countrySet.add(pour.spirit.distillery.country);
      } 
      // Otherwise use normalized region (extract country from "City, Country")
      else if (pour?.spirit?.region) {
        const normalizedCountry = this.normalizeRegion(pour.spirit.region);
        if (normalizedCountry) {
          countrySet.add(normalizedCountry);
        }
      }
    });

    const current = countrySet.size;
    const target = criteria.thresholds?.gold ?? 15;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateCategoryStyleProgress(userId: string, criteria: any) {
    const uniqueCombos = await this.prisma.pour.findMany({
      where: {
        userid: userId,
        spirit: {
          OR: [{ category: { not: null } }, { style: { not: null } }],
        },
      },
      select: {
        spirit: { select: { category: true, style: true } },
      },
      distinct: ['spiritid'],
    });

    const comboSet = new Set(
      uniqueCombos
        .map((p) => `${p.spirit?.category ?? 'unknown'}-${p.spirit?.style ?? 'unknown'}`)
        .filter((c) => !c.includes('unknown')),
    );
    const current = comboSet.size;
    const target = criteria.thresholds?.gold ?? 10;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateDistilleryProgress(userId: string, criteria: any) {
    const uniqueDistilleries = await this.prisma.pour.findMany({
      where: {
        userid: userId,
        spirit: {
          distilleryid: { not: null },
        },
      },
      select: {
        spirit: { select: { distilleryid: true } },
      },
      distinct: ['spiritid'],
    });

    const distillerySet = new Set(
      uniqueDistilleries
        .map((p) => p.spirit?.distilleryid)
        .filter((id) => id != null),
    );
    const current = distillerySet.size;
    const target = criteria.thresholds?.gold ?? 15;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateHiddenGemProgress(userId: string, criteria: any) {
    // This badge doesn't have continuous progress - it's either unlocked or not
    // We'll check if user has any qualifying pours
    const totalUsers = await this.prisma.user.count();
    const minRating = criteria.minRating ?? 4.5;
    const maxUserPct = criteria.maxUserPercentage ?? 10;

    // Find user's high-rated pours
    const userPours = await this.prisma.pour.findMany({
      where: {
        userid: userId,
      },
      select: {
        spiritid: true,
      },
    });

    // For each spirit, check if it's rare (< maxUserPct of users have poured it)
    let hiddenGemsFound = 0;
    for (const pour of userPours) {
      const uniqueUsers = await this.prisma.pour.findMany({
        where: { spiritid: pour.spiritid },
        distinct: ['userid'],
        select: { userid: true },
      });
      const pourCount = uniqueUsers.length;
      const percentage = (pourCount / totalUsers) * 100;
      if (percentage <= maxUserPct) {
        hiddenGemsFound++;
      }
    }

    return {
      current: hiddenGemsFound,
      target: 1,
      percentage: hiddenGemsFound > 0 ? 100 : 0,
    };
  }

  private async calculateMaturationProgress(userId: string, criteria: any) {
    // Count unique aging/maturation mentions in spirit names/styles
    // Simplified approach: look for keywords in spirit name and style
    const pours = await this.prisma.pour.findMany({
      where: { userid: userId },
      include: { spirit: true },
    });

    const maturationKeywords = [
      'unaged', 'white', 'silver', 'blanco',
      'bourbon cask', 'bourbon barrel', 'ex-bourbon',
      'sherry', 'sherry cask', 'sherry finish',
      'port', 'port cask', 'port finish',
      'new oak', 'virgin oak',
      'solera',
      'rum cask', 'wine cask', 'cognac cask',
      'peat', 'peated', 'smoked',
      'double cask', 'triple cask', 'cask finish'
    ];

    const foundStyles = new Set<string>();
    
    for (const pour of pours) {
      const searchText = `${pour.spirit?.name ?? ''} ${pour.spirit?.style ?? ''}`.toLowerCase();
      
      for (const keyword of maturationKeywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          foundStyles.add(keyword);
        }
      }
    }

    const current = foundStyles.size;
    const target = criteria.thresholds?.gold ?? 9;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateProofBandsProgress(userId: string, criteria: any) {
    // Count unique ABV bands from user's pours
    const pours = await this.prisma.pour.findMany({
      where: { userid: userId },
      include: { spirit: true },
    });

    const bands = new Set<string>();
    
    for (const pour of pours) {
      const abvDecimal = pour.spirit?.abv;
      if (!abvDecimal) continue;

      const abv = Number(abvDecimal);

      if (abv < 40) bands.add('under40');
      else if (abv >= 40 && abv < 45) bands.add('40-45');
      else if (abv >= 45 && abv < 50) bands.add('45-50');
      else if (abv >= 50 && abv < 55) bands.add('50-55');
      else if (abv >= 55 && abv < 60) bands.add('55-60-cask');
      else if (abv >= 60) bands.add('60plus-overproof');
    }

    const current = bands.size;
    const target = criteria.thresholds?.gold ?? 7;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateBotanicalProgress(userId: string, criteria: any) {
    // Count unique botanical families from categories and flavor tags
    const pours = await this.prisma.pour.findMany({
      where: { userid: userId },
      include: { 
        spirit: true,
        flavortags: { include: { flavortag: true } }
      },
    });

    const botanicalFamilies = new Set<string>();
    
    for (const pour of pours) {
      const category = pour.spirit?.category?.toLowerCase() ?? '';
      const style = pour.spirit?.style?.toLowerCase() ?? '';
      
      // Detect botanical families
      if (category.includes('gin')) botanicalFamilies.add('gin-botanicals');
      if (category.includes('liqueur') || style.includes('herbal')) botanicalFamilies.add('herbal-liqueur');
      if (style.includes('fruit') || category.includes('fruit')) botanicalFamilies.add('fruit-infused');
      if (style.includes('spice') || pour.flavortags?.some(ft => ft.flavortag.name === 'spicy')) botanicalFamilies.add('spice-driven');
      if (style.includes('barrel') || style.includes('finish')) botanicalFamilies.add('barrel-finished');
      if (pour.flavortags?.some(ft => ft.flavortag.name === 'smoky')) botanicalFamilies.add('smoked-peated');
      if (category.includes('amaro') || category.includes('bitter')) botanicalFamilies.add('bitter-botanical');
      if (style.includes('cacao') || style.includes('coffee') || style.includes('vanilla')) botanicalFamilies.add('dessert-botanical');
    }

    const current = botanicalFamilies.size;
    const target = criteria.thresholds?.gold ?? 10;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateHeritageProgress(userId: string, criteria: any) {
    // Count unique heritage categories from regions and categories
    const pours = await this.prisma.pour.findMany({
      where: { userid: userId },
      include: { spirit: true },
    });

    const heritageCategories = new Set<string>();
    
    for (const pour of pours) {
      const category = pour.spirit?.category?.toLowerCase() ?? '';
      const region = pour.spirit?.region?.toLowerCase() ?? '';
      
      // Detect heritage origins
      if (region.includes('cognac') || category.includes('cognac')) heritageCategories.add('cognac');
      if (region.includes('scotland') || category.includes('scotch')) heritageCategories.add('scotch');
      if (region.includes('tequila') || region.includes('jalisco') || category.includes('tequila')) heritageCategories.add('tequila');
      if (region.includes('mezcal') || category.includes('mezcal')) heritageCategories.add('mezcal');
      if (region.includes('armagnac') || category.includes('armagnac')) heritageCategories.add('armagnac');
      if (region.includes('kentucky') || region.includes('tennessee') || category.includes('bourbon')) heritageCategories.add('bourbon-kentucky');
      if ((category.includes('rum') && region.includes('martinique')) || category.includes('agricole')) heritageCategories.add('rum-agricole');
      if (region.includes('ireland') || category.includes('irish')) heritageCategories.add('irish-whiskey');
      if (region.includes('jamaica') && category.includes('rum')) heritageCategories.add('jamaican-rum');
      if (region.includes('japan') || category.includes('japanese')) heritageCategories.add('japanese-whisky');
    }

    const current = heritageCategories.size;
    const target = criteria.thresholds?.gold ?? 10;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateContrastProgress(userId: string, criteria: any) {
    // Count days where user logged contrasting pours
    // Simplified: count distinct dates with 2+ pours that have different characteristics
    const pours = await this.prisma.pour.findMany({
      where: { userid: userId },
      include: { 
        spirit: true,
        flavortags: { include: { flavortag: true } }
      },
      orderBy: { createdat: 'asc' },
    });

    const poursByDate = new Map<string, any[]>();
    
    for (const pour of pours) {
      const date = pour.createdat.toISOString().split('T')[0];
      if (!poursByDate.has(date)) {
        poursByDate.set(date, []);
      }
      poursByDate.get(date)!.push(pour);
    }

    let contrastSessions = 0;
    
    for (const [date, datePours] of poursByDate.entries()) {
      if (datePours.length < 2) continue;
      
      // Check for contrasts
      const abvs = datePours.map(p => p.spirit?.abv ?? 0).filter(a => a > 0);
      const hasProofContrast = abvs.length >= 2 && (Math.max(...abvs) - Math.min(...abvs) >= 15);
      
      const hasSmoky = datePours.some(p => p.flavortags?.some((ft: any) => ft.flavortag.name === 'smoky'));
      const hasFruity = datePours.some(p => p.flavortags?.some((ft: any) => ft.flavortag.name === 'fruity'));
      const hasFlavorContrast = hasSmoky && hasFruity;
      
      if (hasProofContrast || hasFlavorContrast) {
        contrastSessions++;
      }
    }

    const current = contrastSessions;
    const target = criteria.thresholds?.gold ?? 15;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  private async calculateUnderdogProgress(userId: string, criteria: any) {
    // Count pours from lesser-known categories (simplified: no rating filter since rating field doesn't exist on Pour model)
    const pours = await this.prisma.pour.findMany({
      where: { 
        userid: userId
      },
      include: { spirit: true },
    });

    // Define underdog categories (non-whiskey, craft, emerging)
    const underdogKeywords = [
      'american single malt', 'craft rum', 'japanese gin', 'indian whisky',
      'african', 'new world', 'craft gin', 'artisan', 'small batch',
      'baijiu', 'shochu', 'soju', 'pisco', 'aquavit', 'genever',
      'amaro', 'vermouth', 'aperitif', 'digestif'
    ];

    let underdogCount = 0;
    
    for (const pour of pours) {
      const searchText = `${pour.spirit?.category ?? ''} ${pour.spirit?.style ?? ''} ${pour.spirit?.name ?? ''}`.toLowerCase();
      
      const isUnderdog = underdogKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      
      if (isUnderdog) {
        underdogCount++;
      }
    }

    const current = underdogCount;
    const target = criteria.thresholds?.gold ?? 25;

    return {
      current,
      target,
      percentage: Math.round((current / target) * 100),
      nextTier: this.getNextTier(current, criteria.thresholds),
    };
  }

  /**
   * Get the next tier threshold based on current progress
   */
  private getNextTier(
    current: number,
    thresholds: { bronze?: number; silver?: number; gold?: number },
  ): string | null {
    if (!thresholds) return null;
    if (current < (thresholds.bronze ?? 0)) return 'bronze';
    if (current < (thresholds.silver ?? 0)) return 'silver';
    if (current < (thresholds.gold ?? 0)) return 'gold';
    return null; // All tiers unlocked
  }

  /**
   * Check and unlock badges after a pour is created/updated
   */
  async checkAndUnlockBadges(userId: string) {
    this.logger.log(`Checking badges for user ${userId}`);

    const badges = await this.prisma.badge.findMany();

    for (const badge of badges) {
      const criteria = badge.criteriajson as any;
      const progress = await this.calculateBadgeProgress(
        userId,
        criteria.type,
        criteria,
      );

      // Check if any tier should be unlocked
      if (criteria.type === 'rare_high_rating') {
        // Hidden Gem Hunter - no tiers, single unlock
        if (progress.current > 0) {
          await this.unlockBadge(userId, badge.id, null);
        }
      } else {
        // Tiered badges
        const thresholds = criteria.thresholds;
        if (thresholds) {
          if (progress.current >= thresholds.gold) {
            await this.unlockBadge(userId, badge.id, 'gold');
          }
          if (progress.current >= thresholds.silver) {
            await this.unlockBadge(userId, badge.id, 'silver');
          }
          if (progress.current >= thresholds.bronze) {
            await this.unlockBadge(userId, badge.id, 'bronze');
          }
        }
      }
    }
  }

  /**
   * Unlock a badge for a user (idempotent)
   */
  private async unlockBadge(
    userId: string,
    badgeId: string,
    tier: string | null,
  ) {
    try {
      await this.prisma.userbadge.create({
        data: {
          userid: userId,
          badgeid: badgeId,
          ...(tier ? { tier } : {}),
        },
      });
      this.logger.log(
        `Badge unlocked: ${badgeId} (tier: ${tier ?? 'none'}) for user ${userId}`,
      );
    } catch (error: any) {
      // Ignore unique constraint violations (badge already unlocked)
      if (error?.code === 'P2002') {
        this.logger.debug(`Badge already unlocked: ${badgeId} for user ${userId}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get user's taste summary stats
   */
  async getTasteSummary(userId: string) {
    // Count unique flavors used
    const uniqueFlavors = await this.prisma.pourflavortag.findMany({
      where: {
        pour: { userid: userId },
      },
      distinct: ['flavortagid'],
      select: { flavortagid: true },
    });

    // Count unique regions (COUNTRIES ONLY - normalized)
    const uniqueRegions = await this.prisma.pour.findMany({
      where: {
        userid: userId,
        spirit: { region: { not: null } },
      },
      select: {
        spirit: { select: { region: true } },
      },
      distinct: ['spiritid'],
    });
    const regionSet = new Set(
      uniqueRegions
        .map((p) => p.spirit?.region)
        .filter((r) => r != null && r !== '')
        .map((r) => this.normalizeRegion(r as string)), // Normalize to country only
    );

    // Count unique distilleries
    const uniqueDistilleries = await this.prisma.pour.findMany({
      where: {
        userid: userId,
        spirit: { distilleryid: { not: null } },
      },
      select: {
        spirit: { select: { distilleryid: true } },
      },
      distinct: ['spiritid'],
    });
    const distillerySet = new Set(
      uniqueDistilleries
        .map((p) => p.spirit?.distilleryid)
        .filter((d) => d != null),
    );

    // Flavor distribution
    const flavorDistribution = await this.prisma.pourflavortag.groupBy({
      by: ['flavortagid'],
      where: {
        pour: { userid: userId },
      },
      _count: { flavortagid: true },
    });

    const flavorsWithNames: any[] = [];
    for (const fd of flavorDistribution) {
      const tag = await this.prisma.flavortag.findUnique({
        where: { id: fd.flavortagid },
      });
      flavorsWithNames.push({
        name: tag?.name ?? 'Unknown',
        count: fd._count.flavortagid,
      });
    }

    // Region distribution (COUNTRIES ONLY - normalized)
    const allPours = await this.prisma.pour.findMany({
      where: { userid: userId },
      include: { spirit: { select: { region: true } } },
    });

    const regionCounts = allPours.reduce(
      (acc, pour) => {
        const region = pour.spirit?.region;
        if (region) {
          const normalizedRegion = this.normalizeRegion(region); // Normalize to country only
          acc[normalizedRegion] = (acc[normalizedRegion] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const regions = Object.entries(regionCounts).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      flavorCount: uniqueFlavors.length,
      regionCount: regionSet.size,
      distilleryCount: distillerySet.size,
      maxFlavors: 10,
      flavorDistribution: flavorsWithNames,
      regions,
    };
  }
}
