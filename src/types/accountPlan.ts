import { z } from 'zod';

export interface Product {
  name: string;
  features?: string;
  pricing?: string;
}

export interface Leader {
  name?: string;
  role?: string;
  details?: string;
  source_urls?: string[];
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface AccountPlan {
  company_overview: string;
  mission_and_vision: string;
  key_products_and_services: Product[];
  target_market: string;
  business_model: string;
  unique_value_proposition: string;
  leadership_and_key_people: Leader[];
  competitors: string[];
  market_position_summary: string;
  swot_analysis: SWOT;
  mermaid_diagram: string; // Plain mermaid graph LR code
  notable_clients?: string[];
  recent_articles?: string[];
  final_summary: string;
  notes?: string[]; // Data gaps / assumptions / provenance
}

// Zod schemas for validation
export const ProductSchema = z.object({
  name: z.string(),
  features: z.string().optional(),
  pricing: z.string().optional(),
});

export const LeaderSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  details: z.string().optional(),
  source_urls: z.array(z.string()).optional(),
});

export const SWOTSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
});

export const AccountPlanSchema = z.object({
  company_overview: z.string(),
  mission_and_vision: z.string(),
  key_products_and_services: z.array(ProductSchema),
  target_market: z.string(),
  business_model: z.string(),
  unique_value_proposition: z.string(),
  leadership_and_key_people: z.array(LeaderSchema),
  competitors: z.array(z.string()),
  market_position_summary: z.string(),
  swot_analysis: SWOTSchema,
  mermaid_diagram: z.string(),
  notable_clients: z.array(z.string()).optional(),
  recent_articles: z.array(z.string()).optional(),
  final_summary: z.string(),
  notes: z.array(z.string()).optional(),
});

export interface ResearchSession {
  id: string;
  companyName: string;
  status: 'starting' | 'searching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  accountPlan?: AccountPlan;
  sources: SourceData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceData {
  url: string;
  title: string;
  content: string;
  type: 'company' | 'leadership' | 'competitor' | 'news';
  relevanceScore: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

export interface VoiceStatus {
  isSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error?: string;
}

// Type guards
export function isValidAccountPlan(data: unknown): data is AccountPlan {
  return AccountPlanSchema.safeParse(data).success;
}

export function createEmptyAccountPlan(): AccountPlan {
  return {
    company_overview: '',
    mission_and_vision: '',
    key_products_and_services: [],
    target_market: '',
    business_model: '',
    unique_value_proposition: '',
    leadership_and_key_people: [],
    competitors: [],
    market_position_summary: '',
    swot_analysis: {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
    },
    mermaid_diagram: '',
    final_summary: '',
    notes: [],
  };
}