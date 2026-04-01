export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
}

export interface PinterestAccount {
  id: string;
  uid: string;
  username: string;
  niche: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  status: 'connected' | 'disconnected';
  createdAt: string;
  impressions?: number;
  clicks?: number;
}

export interface Campaign {
  id: string;
  uid: string;
  niche: string;
  pinIdeas: string;
  keywords: string[];
  blogUrl: string;
  numPins: number;
  timeGap: string;
  accountIds: string[];
  isAdCampaign?: boolean;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

export interface ScheduledPin {
  id: string;
  uid: string;
  campaignId: string;
  accountId: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  scheduledTime: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  pinterestPinId?: string;
  impressions?: number;
  clicks?: number;
}

export interface PinIdea {
  title: string;
  description: string;
  keywords: string[];
  imagePrompt: string;
}

export interface Link {
  id: string;
  uid: string;
  url: string;
  lastUsedAt?: any;
  createdAt: any;
}
