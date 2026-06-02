export interface DistilleryProfile {
  id: string;
  name: string;
  logo?: string;
  heroImage?: string;
  bio?: string;
  verified: boolean;
  isPremium: boolean;
  websiteUrl?: string;
  latitude?: number;
  longitude?: number;
  followersCount: number;
  spiritsCount: number;
  poursCount: number;
  isFollowing: boolean;
  country?: string;
  region?: string;
  hasOwner: boolean;
  isClaimed: boolean; // true = user-created/claimed, false = seeded
}

export interface DistilleryMapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  region?: string;
  verified?: boolean;
  isClaimed?: boolean;
}

export interface DistilleryDiscoverData {
  mapPins: DistilleryMapPin[];
}

export interface DistilleryPour {
  id: string;
  whyItHit: string;
  image?: string;
  createdAt: string;
  isDistilleryPost: boolean;
  distilleryVerified?: boolean; // Whether the distillery is verified (for badge display)
  user?: {
    id: string;
    name: string;
    profilePhoto?: string;
    experienceLevel?: string;
  };
  spirit: {
    id: string;
    name: string;
    category?: string;
    bottleImage?: string;
  };
  flavorTags: Array<{
    id: string;
    name: string;
  }>;
  cheersCount: number;
  hasCheered: boolean;
}

export interface DistillerySpirit {
  id: string;
  name: string;
  category?: string;
  style?: string;
  abv?: number;
  region?: string;
  bottleImage?: string;
  flavorTags: Array<{
    id: string;
    name: string;
  }>;
  isOnRadar: boolean;
  hasInsights: boolean;
  insight?: DistilleryInsight;
}

export interface DistilleryInsight {
  id: string;
  howWeCreated?: string;
  whatMakesItSpecial?: string;
  tastingNotes?: string;
}

export interface DistilleryAnalytics {
  overview: {
    totalPours: number;
    totalFollowers: number;
    totalSpiritsOnRadar: number;
    averageRating: number;
  };
  topSpirits: Array<{
    spiritName: string;
    onRadarCount: number;
  }>;
  topFlavorTags: Array<{
    tagName: string;
    count: number;
  }>;
  monthlyPours: Array<{
    month: string;
    count: number;
  }>;
}
