export interface User {
  id: string;
  email: string;
  name: string;
  profilePhoto?: string;
  bio?: string;
  experienceLevel?: 'Curious' | 'Social' | 'Serious';
  ageVerified: boolean;
  createdAt: string;
  poursCount?: number;
  connectionsCount?: number;
  cheersCount?: number;
  distilleryId?: string;
  isDistilleryAccount?: boolean;
  distillery?: {
    id: string;
    name: string;
    verified: boolean;
    logo?: string;
    heroImage?: string;
    bio?: string;
    region?: string;
    country?: string;
  };
}

export interface Spirit {
  id: string;
  name: string;
  distilleryId?: string;
  distilleryName?: string;
  category?: string;
  style?: string;
  abv?: number;
  region?: string;
  bottleImage?: string;
  flavorTags?: FlavorTag[];
  createdAt: string;
}

export interface Pour {
  id: string;
  userId: string;
  spiritId: string;
  spirit?: Spirit;
  whyItHit: string;
  isShared: boolean;
  image?: string;
  flavorTags?: FlavorTag[];
  createdAt: string;
  updatedAt: string;
}

export interface FlavorTag {
  id: string;
  name: string;
}

export interface Distillery {
  id: string;
  name: string;
  country?: string;
  region?: string;
}

export interface SpiritRecognitionMatch {
  spiritName: string;
  distilleryName?: string;
  category?: string;
  style?: string;
  abv?: number;
  region?: string;
  confidence: number;
}

export interface SpiritRecognitionResponse {
  matches: SpiritRecognitionMatch[];
}

export interface AuthResponse {
  token: string;
  user: User;
  distillery?: {
    id: string;
    name: string;
    verified: boolean;
    logo?: string;
    heroImage?: string;
  };
}

export interface FileUploadResponse {
  uploadUrl: string;
  cloud_storage_path: string;
  fileId: string;
}

export interface FileUrlResponse {
  url: string;
}

export interface Connection {
  id: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
  acceptedAt?: string;
  initiator: {
    id: string;
    name: string;
    profilePhoto?: string;
    experienceLevel?: string;
  };
  receiver: {
    id: string;
    name: string;
    profilePhoto?: string;
    experienceLevel?: string;
  };
}

export interface FellowSipper {
  connectionId: string;
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
    bio?: string;
    experienceLevel?: string;
    isOfficial?: boolean;
  };
  isMuted?: boolean;
  connectedAt?: string;
}

export interface BarPour {
  id: string;
  whyItHit: string;
  image?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
    experienceLevel?: string;
    isOfficial?: boolean;
  };
  spirit: Spirit;
  flavorTags: FlavorTag[];
  cheersCount?: number;
  hasUserCheered: boolean;
}

export interface RadarEntry {
  id: string;
  addedAt: string;
  spirit: Spirit;
}

export interface UniversalSearchUser {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  experienceLevel?: string;
  isOfficial?: boolean;
  type: 'user';
}

export interface UniversalSearchSpirit {
  id: string;
  name: string;
  category?: string;
  style?: string;
  abv?: number;
  region?: string;
  bottleImage?: string;
  distillery?: {
    id: string;
    name: string;
    country?: string;
    region?: string;
  };
  type: 'spirit';
}

export interface UniversalSearchDistillery {
  id: string;
  name: string;
  country?: string;
  region?: string;
  spiritsCount: number;
  type: 'distillery';
}

export interface UniversalSearchFlavorTag {
  id: string;
  name: string;
  spiritsCount: number;
  poursCount: number;
  type: 'flavorTag';
}

export interface UniversalSearchCategory {
  name: string;
  spiritsCount: number;
  type: 'category';
}

export interface UniversalSearchLocation {
  name: string;
  type: 'location';
}

export interface UniversalSearchReview {
  id: string;
  whyItHit: string;
  preview: string;
  spirit: {
    id: string;
    name: string;
    bottleImage?: string;
  };
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
  };
  createdAt: string;
  type: 'review';
}

export interface UniversalSearchResults {
  users: UniversalSearchUser[];
  spirits: UniversalSearchSpirit[];
  distilleries: UniversalSearchDistillery[];
  flavorTags: UniversalSearchFlavorTag[];
  categories: UniversalSearchCategory[];
  locations: UniversalSearchLocation[];
  reviews: UniversalSearchReview[];
}

// Badge and Gamification Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: {
    type: string;
    thresholds?: {
      bronze?: number;
      silver?: number;
      gold?: number;
    };
    target?: number;
    minRating?: number;
    maxUserPercentage?: number;
  };
  unlocked: Array<{
    tier?: string | null;
    unlockedAt: string;
  }>;
  progress: {
    current: number;
    target: number;
    percentage: number;
    nextTier?: string | null;
  };
}

export interface TasteSummary {
  flavorCount: number;
  regionCount: number;
  distilleryCount: number;
  maxFlavors: number;
  flavorDistribution: Array<{
    name: string;
    count: number;
  }>;
  regions: Array<{
    name: string;
    count: number;
  }>;
}
