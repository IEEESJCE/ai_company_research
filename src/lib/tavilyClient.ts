import { SourceData } from '@/types/accountPlan';

// Tavily API client configuration
const TAVILY_API_URL = 'https://api.tavily.com/search';
const TAVILY_API_KEY = process.env.NEXT_PUBLIC_TAVILY_API_KEY || '';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

interface TavilyResponse {
  answer: string;
  results: TavilySearchResult[];
  response_time: number;
}

export class TavilyClient {
  private apiKey: string;
  private baseUrl: string;
  private demoMode: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || TAVILY_API_KEY;
    this.baseUrl = TAVILY_API_URL;
    this.demoMode = !this.apiKey;

    if (!this.apiKey) {
      console.warn('Tavily API key not provided. Running in DEMO mode with sample data.');
    }
  }

  async search(query: string, maxResults: number = 10): Promise<TavilyResponse> {
    if (!this.apiKey) {
      throw new Error('Tavily API key is required for web search functionality');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: 'basic',
          include_answer: true,
          include_raw_content: false,
          max_results: maxResults,
          include_domains: [],
          exclude_domains: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Tavily API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const data: TavilyResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Web search failed: ${error.message}`);
      }
      throw new Error('Web search failed: Unknown error');
    }
  }

  async searchCompanyInfo(companyName: string): Promise<SourceData[]> {
    try {
      const queries = [
        `${companyName} company overview business model`,
        `${companyName} leadership team executives`,
        `${companyName} competitors market analysis`,
        `${companyName} products services pricing`,
        `${companyName} recent news financial performance`,
      ];

      const allResults: SourceData[] = [];

      for (const query of queries) {
        try {
          const response = await this.search(query, 5);

          const sourceData: SourceData[] = response.results.map(result => ({
            url: result.url,
            title: result.title,
            content: result.content,
            type: this.inferSourceType(query, result.title),
            relevanceScore: result.score || 0.5,
          }));

          allResults.push(...sourceData);
        } catch (error) {
          console.warn(`Failed search for query: ${query}`, error);
          // Continue with other queries even if one fails
        }
      }

      // Remove duplicates based on URL
      const uniqueResults = allResults.filter((result, index, self) =>
        index === self.findIndex((r) => r.url === result.url)
      );

      // Sort by relevance score
      return uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Company search failed:', error);
      throw new Error(`Failed to search company information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchLeadershipInfo(companyName: string): Promise<SourceData[]> {
    try {
      const queries = [
        `${companyName} CEO leadership team`,
        `${companyName} executives management board`,
        `${companyName} founder key personnel`,
      ];

      const allResults: SourceData[] = [];

      for (const query of queries) {
        try {
          const response = await this.search(query, 3);

          const sourceData: SourceData[] = response.results.map(result => ({
            url: result.url,
            title: result.title,
            content: result.content,
            type: 'leadership',
            relevanceScore: result.score || 0.5,
          }));

          allResults.push(...sourceData);
        } catch (error) {
          console.warn(`Failed leadership search for query: ${query}`, error);
        }
      }

      return allResults
        .filter((result, index, self) => index === self.findIndex((r) => r.url === result.url))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Leadership search failed:', error);
      throw new Error(`Failed to search leadership information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchCompetitors(companyName: string): Promise<SourceData[]> {
    try {
      const queries = [
        `${companyName} competitors market share`,
        `companies similar to ${companyName}`,
        `${companyName} industry alternatives`,
      ];

      const allResults: SourceData[] = [];

      for (const query of queries) {
        try {
          const response = await this.search(query, 3);

          const sourceData: SourceData[] = response.results.map(result => ({
            url: result.url,
            title: result.title,
            content: result.content,
            type: 'competitor',
            relevanceScore: result.score || 0.5,
          }));

          allResults.push(...sourceData);
        } catch (error) {
          console.warn(`Failed competitor search for query: ${query}`, error);
        }
      }

      return allResults
        .filter((result, index, self) => index === self.findIndex((r) => r.url === result.url))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Competitor search failed:', error);
      throw new Error(`Failed to search competitor information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchRecentNews(companyName: string): Promise<SourceData[]> {
    try {
      const queries = [
        `${companyName} recent news 2024 2025`,
        `${companyName} latest developments updates`,
        `${companyName} press releases announcements`,
      ];

      const allResults: SourceData[] = [];

      for (const query of queries) {
        try {
          const response = await this.search(query, 3);

          const sourceData: SourceData[] = response.results.map(result => ({
            url: result.url,
            title: result.title,
            content: result.content,
            type: 'news',
            relevanceScore: result.score || 0.5,
          }));

          allResults.push(...sourceData);
        } catch (error) {
          console.warn(`Failed news search for query: ${query}`, error);
        }
      }

      return allResults
        .filter((result, index, self) => index === self.findIndex((r) => r.url === result.url))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('News search failed:', error);
      throw new Error(`Failed to search recent news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private inferSourceType(query: string, title: string): SourceData['type'] {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();

    if (queryLower.includes('leadership') || queryLower.includes('ceo') || queryLower.includes('executive') ||
        titleLower.includes('ceo') || titleLower.includes('founder') || titleLower.includes('leadership')) {
      return 'leadership';
    }

    if (queryLower.includes('competitor') || queryLower.includes('market share') || queryLower.includes('similar') ||
        titleLower.includes('competitor') || titleLower.includes('vs') || titleLower.includes('alternative')) {
      return 'competitor';
    }

    if (queryLower.includes('news') || queryLower.includes('recent') || queryLower.includes('latest') ||
        titleLower.includes('news') || titleLower.includes('announcement') || titleLower.includes('press release')) {
      return 'news';
    }

    return 'company';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}

// Singleton instance for the application
export const tavilyClient = new TavilyClient();