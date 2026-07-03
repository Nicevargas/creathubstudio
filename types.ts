
export interface UserPreferences {
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    cameoSora2?: string;
  };
  integrations?: {
    facebookAppId?: string;
    otherApiKey?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  category: string;
  avatar?: string;
  imageCredits: number;
  videoCredits: number;
  preferences?: UserPreferences;
  plan?: string;
  cnpj_cpf?: string;
  phone?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  category: string;
  status: 'draft' | 'published';
  summary?: string;
  date: string;
}

export interface GeneratedContent {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt?: string;
  created_at: string;
}

export interface Especialista {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'guru'; // Mantendo a role interna para compatibilidade com o webhook se necessário, mas mudando o visual
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  content: string;
  status: 'scheduled' | 'published';
  date: string;
  images: string[];
}

export enum PlanType {
  TEST = 'Teste',
  BASIC = 'Básico',
  PRO = 'Pro',
  PREMIUM = 'Premium',
  BUSINESS = 'Business'
}

export interface CreditPackage {
  id: string;
  name: string;
  price: number;
  image_credits: number;
  video_credits: number;
  price_id: string;
  popular?: boolean;
  best_value?: boolean;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  package_id?: string;
  image_credits_purchased: number;
  video_credits_purchased: number;
  amount_paid?: number;
  status?: string;
  created_at: string;
}

export interface CreditUsage {
  id: string;
  user_id: string;
  type: 'image' | 'video';
  amount: number;
  description: string;
  created_at: string;
}
