export interface InstagramPost {
  id: string;
  caption: string;
  url: string;
  imageUrl: string;
  likes: number;
  comments: number;
  views: number;
  engagementRate: number;
  category: "Politik" | "Surabaya" | "Sidoarjo" | "Olahraga" | "Kriminal" | "Ekonomi";
  publishedAt: string; // ISO format or YYYY-MM-DD
  statusEvaluasi: "Belum Dievaluasi" | "Perlu Verifikasi" | "Layak Tayang" | "Sensasional" | "Arsip";
  verified: boolean;
  isViral: boolean;
  integritasScore?: number;
  analisisVerifikasi?: string;
  saranTindakLanjut?: string;
  statusSensasional?: string;
}

export interface EditorialNote {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userEmail: string;
  content: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
}

export interface ContentRecommendation {
  title: string;
  category: "Politik" | "Surabaya" | "Sidoarjo" | "Olahraga" | "Kriminal" | "Ekonomi";
  potentialReach: string;
  confidence: string;
  reason: string;
  actionableSteps: string[];
  format: string;
}

export interface RecommendationResponse {
  executiveBriefing: string;
  recommendations: ContentRecommendation[];
  isAiPowered: boolean;
}

