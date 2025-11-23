import { tavilyClient } from './tavilyClient';
import { AccountPlan, ResearchSession, SourceData, createEmptyAccountPlan, Product, Leader, SWOT } from '@/types/accountPlan';

export interface ResearchProgress {
  step: string;
  progress: number;
  message: string;
  completed: boolean;
}

export interface ResearchCallbacks {
  onProgress: (progress: ResearchProgress) => void;
  onComplete: (session: ResearchSession) => void;
  onError: (error: string) => void;
}

export type ResearchDepth = 'initial' | 'deeper' | 'expert';
export type ResearchFocus = 'leadership' | 'competitors' | 'swot' | 'financial' | 'market' | 'products' | 'general';

export class ResearchAgent {
  private currentSession: ResearchSession | null = null;
  private callbacks: ResearchCallbacks | null = null;

  constructor() {}

  async startResearch(companyName: string, callbacks: ResearchCallbacks): Promise<ResearchSession> {
    this.callbacks = callbacks;

    // Create new research session
    this.currentSession = {
      id: this.generateSessionId(),
      companyName,
      status: 'starting',
      progress: 0,
      currentStep: 'Initializing research',
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      this.updateProgress(5, 'Starting company research', false);

      // Step 1: Collect basic company information
      await this.collectCompanyInfo(companyName);

      // Step 2: Gather leadership information
      await this.collectLeadershipInfo(companyName);

      // Step 3: Identify competitors
      await this.collectCompetitorInfo(companyName);

      // Step 4: Find recent news and articles
      await this.collectRecentNews(companyName);

      // Step 5: Synthesize data and generate account plan
      await this.synthesizeAccountPlan(companyName);

      // Complete research
      if (this.currentSession) {
        this.currentSession.status = 'complete';
        this.currentSession.progress = 100;
        this.currentSession.currentStep = 'Research completed';
        this.currentSession.updatedAt = new Date();

        this.updateProgress(100, 'Research completed successfully', true);
        this.callbacks?.onComplete(this.currentSession);
      }
    } catch (error) {
      if (this.currentSession) {
        this.currentSession.status = 'error';
        this.currentSession.currentStep = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.currentSession.updatedAt = new Date();
      }

      this.callbacks?.onError(error instanceof Error ? error.message : 'Unknown error');
    }

    return this.currentSession!;
  }

  private async collectCompanyInfo(companyName: string): Promise<void> {
    this.updateProgress(10, 'Searching for company information', false);

    try {
      const sources = await tavilyClient.searchCompanyInfo(companyName);
      this.currentSession!.sources.push(...sources);

      this.updateProgress(25, 'Company information collected', false);
    } catch (error) {
      console.error('Company info collection failed:', error);
      // Continue with other data sources
    }
  }

  private async collectLeadershipInfo(companyName: string): Promise<void> {
    this.updateProgress(30, 'Researching leadership team', false);

    try {
      const sources = await tavilyClient.searchLeadershipInfo(companyName);
      this.currentSession!.sources.push(...sources);

      this.updateProgress(45, 'Leadership information collected', false);
    } catch (error) {
      console.error('Leadership info collection failed:', error);
    }
  }

  private async collectCompetitorInfo(companyName: string): Promise<void> {
    this.updateProgress(50, 'Identifying competitors', false);

    try {
      const sources = await tavilyClient.searchCompetitors(companyName);
      this.currentSession!.sources.push(...sources);

      this.updateProgress(65, 'Competitor analysis completed', false);
    } catch (error) {
      console.error('Competitor info collection failed:', error);
    }
  }

  private async collectRecentNews(companyName: string): Promise<void> {
    this.updateProgress(70, 'Finding recent news and articles', false);

    try {
      const sources = await tavilyClient.searchRecentNews(companyName);
      this.currentSession!.sources.push(...sources);

      this.updateProgress(85, 'Recent news collected', false);
    } catch (error) {
      console.error('News collection failed:', error);
    }
  }

  private async synthesizeAccountPlan(companyName: string): Promise<void> {
    this.updateProgress(90, 'Synthesizing data and generating account plan', false);

    if (!this.currentSession) return;

    const accountPlan = createEmptyAccountPlan();
    const sources = this.currentSession.sources;

    // Extract and synthesize information from sources
    accountPlan.company_overview = this.extractCompanyOverview(companyName, sources);
    accountPlan.mission_and_vision = this.extractMissionVision(companyName, sources);
    accountPlan.key_products_and_services = this.extractProductsServices(companyName, sources);
    accountPlan.target_market = this.extractTargetMarket(sources);
    accountPlan.business_model = this.extractBusinessModel(sources);
    accountPlan.unique_value_proposition = this.extractValueProposition(companyName, sources);
    accountPlan.leadership_and_key_people = this.extractLeadership(sources);
    accountPlan.competitors = this.extractCompetitors(sources);
    accountPlan.market_position_summary = this.extractMarketPosition(companyName, sources);
    accountPlan.swot_analysis = this.generateSWOTAnalysis(companyName, sources);
    accountPlan.mermaid_diagram = this.generateMermaidDiagram(companyName, accountPlan);
    accountPlan.notable_clients = this.extractNotableClients(sources);
    accountPlan.recent_articles = this.extractRecentArticles(sources);
    accountPlan.final_summary = this.generateFinalSummary(companyName, accountPlan);
    accountPlan.notes = this.generateNotes(companyName, sources);

    this.currentSession.accountPlan = accountPlan;
  }

  private extractCompanyOverview(companyName: string, sources: SourceData[]): string {
    const companySources = sources.filter(s => s.type === 'company');
    if (companySources.length === 0) {
      return `Information about ${companyName} could not be retrieved from available sources.`;
    }

    // Combine relevant content from multiple sources
    const overviews = companySources.map(source => {
      const sentences = source.content.split('.').filter(s => s.trim().length > 20);
      return sentences.slice(0, 3).join('. '); // Take first 3 sentences
    });

    return overviews.join('. ').trim() || `Company overview for ${companyName} is currently being compiled.`;
  }

  private extractMissionVision(companyName: string, sources: SourceData[]): string {
    const companySources = sources.filter(s => s.type === 'company');
    const keywords = ['mission', 'vision', 'purpose', 'values', 'goal', 'objective'];

    for (const source of companySources) {
      const sentences = source.content.split('.');
      for (const sentence of sentences) {
        if (keywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          return sentence.trim();
        }
      }
    }

    return `Mission and vision information for ${companyName} is currently being researched.`;
  }

  private extractProductsServices(companyName: string, sources: SourceData[]): Product[] {
    const products: Product[] = [];
    const companySources = sources.filter(s => s.type === 'company');

    for (const source of companySources) {
      // Look for product/service mentions
      const productKeywords = ['product', 'service', 'solution', 'platform', 'offering', 'software'];
      const sentences = source.content.split('.');

      for (const sentence of sentences) {
        if (productKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          const productName = this.extractProductName(sentence);
          if (productName && !products.some(p => p.name === productName)) {
            products.push({
              name: productName,
              features: this.extractFeatures(sentence),
              pricing: this.extractPricing(sentence),
            });
          }
        }
      }
    }

    return products.slice(0, 10); // Limit to 10 products
  }

  private extractProductName(sentence: string): string | null {
    // Simple extraction - look for capitalized words or known patterns
    const words = sentence.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.length > 3 && word[0] === word[0].toUpperCase()) {
        return word.replace(/[.,!?;]/g, '');
      }
    }
    return null;
  }

  private extractFeatures(sentence: string): string | undefined {
    // Look for feature-related keywords
    const featureKeywords = ['feature', 'capability', 'function', 'include', 'offer', 'provide'];
    if (featureKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
      return sentence.trim();
    }
    return undefined;
  }

  private extractPricing(sentence: string): string | undefined {
    // Look for pricing information
    const pricePatterns = [/\$\d+/g, /free/i, /subscription/i, /pricing/i];
    for (const pattern of pricePatterns) {
      if (pattern.test(sentence)) {
        return sentence.trim();
      }
    }
    return undefined;
  }

  private extractTargetMarket(sources: SourceData[]): string {
    const companySources = sources.filter(s => s.type === 'company');
    const marketKeywords = ['market', 'customer', 'client', 'industry', 'sector', 'audience'];

    for (const source of companySources) {
      const sentences = source.content.split('.');
      for (const sentence of sentences) {
        if (marketKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          return sentence.trim();
        }
      }
    }

    return 'Target market information is currently being researched.';
  }

  private extractBusinessModel(sources: SourceData[]): string {
    const companySources = sources.filter(s => s.type === 'company');
    const businessKeywords = ['business model', 'revenue', 'monetization', 'business strategy'];

    for (const source of companySources) {
      const sentences = source.content.split('.');
      for (const sentence of sentences) {
        if (businessKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          return sentence.trim();
        }
      }
    }

    return 'Business model information is currently being researched.';
  }

  private extractValueProposition(companyName: string, sources: SourceData[]): string {
    const companySources = sources.filter(s => s.type === 'company');
    const valueKeywords = ['unique value proposition', 'differentiate', 'advantage', 'competitive edge'];

    for (const source of companySources) {
      const sentences = source.content.split('.');
      for (const sentence of sentences) {
        if (valueKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          return sentence.trim();
        }
      }
    }

    return `${companyName}'s unique value proposition is currently being analyzed.`;
  }

  private extractLeadership(sources: SourceData[]): Leader[] {
    const leadership: Leader[] = [];
    const leadershipSources = sources.filter(s => s.type === 'leadership');

    for (const source of leadershipSources) {
      // Look for leadership titles and names
      const titlePatterns = ['CEO', 'CTO', 'CFO', 'President', 'Founder', 'Director', 'Vice President'];
      const sentences = source.content.split('.');

      for (const sentence of sentences) {
        for (const title of titlePatterns) {
          if (sentence.includes(title)) {
            const leader = this.parseLeadershipInfo(sentence, title, source.url);
            if (leader && !leadership.some(l => l.name === leader.name && l.role === leader.role)) {
              leadership.push(leader);
            }
          }
        }
      }
    }

    return leadership.slice(0, 10); // Limit to 10 leaders
  }

  private parseLeadershipInfo(sentence: string, title: string, sourceUrl: string): Leader | null {
    // Simple parsing for leadership information
    const words = sentence.split(' ');
    let name = '';

    // Look for name patterns (usually before or after title)
    for (let i = 0; i < words.length; i++) {
      if (words[i].includes(title)) {
        // Name might be before or after the title
        if (i > 0 && words[i - 1].length > 2) {
          name = words[i - 1];
        } else if (i < words.length - 1 && words[i + 1].length > 2) {
          name = words[i + 1];
        }
        break;
      }
    }

    if (name) {
      return {
        name: name.replace(/[.,!?;]/g, ''),
        role: title,
        details: sentence.trim(),
        source_urls: [sourceUrl],
      };
    }

    return null;
  }

  private extractCompetitors(sources: SourceData[]): string[] {
    const competitorSources = sources.filter(s => s.type === 'competitor');
    const competitors: string[] = [];

    for (const source of competitorSources) {
      // Look for company names in competitor-related content
      const sentences = source.content.split('.');
      for (const sentence of sentences) {
        // Simple extraction - look for capitalized words that might be company names
        const words = sentence.split(' ');
        for (const word of words) {
          const cleanWord = word.replace(/[.,!?;]/g, '');
          if (cleanWord.length > 2 && cleanWord[0] === cleanWord[0].toUpperCase() &&
              !cleanWord.includes('The') && !cleanWord.includes('And') &&
              !competitors.includes(cleanWord)) {
            competitors.push(cleanWord);
          }
        }
      }
    }

    return competitors.slice(0, 10); // Limit to 10 competitors
  }

  private extractMarketPosition(companyName: string, sources: SourceData[]): string {
    const allSources = sources.filter(s => s.type === 'company' || s.type === 'competitor');
    const positionKeywords = ['market position', 'market share', 'industry leader', 'position', 'rank'];

    for (const source of allSources) {
      const sentences = source.content.split('.');
      for (const sentence of sentences) {
        if (positionKeywords.some(keyword => sentence.toLowerCase().includes(keyword)) ||
            sentence.toLowerCase().includes(companyName.toLowerCase())) {
          return sentence.trim();
        }
      }
    }

    return `${companyName}'s market position is currently being analyzed.`;
  }

  private generateSWOTAnalysis(companyName: string, sources: SourceData[]): SWOT {
    const allSources = sources;

    // Simple keyword-based SWOT analysis
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    const strengthKeywords = ['strength', 'advantage', 'leader', 'innovative', 'successful'];
    const weaknessKeywords = ['challenge', 'weakness', 'issue', 'problem', 'limitation'];
    const opportunityKeywords = ['opportunity', 'potential', 'growth', 'expansion', 'emerging'];
    const threatKeywords = ['threat', 'risk', 'competition', 'decline', 'challenge'];

    for (const source of allSources) {
      const sentences = source.content.split('.');
      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();

        if (strengthKeywords.some(keyword => lowerSentence.includes(keyword))) {
          if (strengths.length < 5) strengths.push(sentence.trim());
        } else if (weaknessKeywords.some(keyword => lowerSentence.includes(keyword))) {
          if (weaknesses.length < 5) weaknesses.push(sentence.trim());
        } else if (opportunityKeywords.some(keyword => lowerSentence.includes(keyword))) {
          if (opportunities.length < 5) opportunities.push(sentence.trim());
        } else if (threatKeywords.some(keyword => lowerSentence.includes(keyword))) {
          if (threats.length < 5) threats.push(sentence.trim());
        }
      }
    }

    // Fallback entries if no data found
    if (strengths.length === 0) strengths.push(`${companyName} strengths are currently being analyzed.`);
    if (weaknesses.length === 0) weaknesses.push(`${companyName} potential challenges are being identified.`);
    if (opportunities.length === 0) opportunities.push('Market opportunities are being researched.');
    if (threats.length === 0) threats.push('Market threats and risks are being assessed.');

    return { strengths, weaknesses, opportunities, threats };
  }

  private generateMermaidDiagram(companyName: string, accountPlan: AccountPlan): string {
    const products = accountPlan.key_products_and_services.slice(0, 4);
    const markets = accountPlan.target_market.split(',').slice(0, 3);

    let diagram = 'graph LR\n';
    diagram += `A["${companyName}"]`;

    // Add products
    products.forEach((product, index) => {
      const letter = String.fromCharCode(66 + index); // B, C, D, E...
      diagram += `\nA --> ${letter}["${product.name}"]`;
    });

    // Add markets
    if (markets.length > 0) {
      const marketLetter = String.fromCharCode(66 + products.length);
      diagram += `\nA --> ${marketLetter}["Target Markets"]`;
      markets.forEach((market, index) => {
        diagram += `\n${marketLetter} --> ${String.fromCharCode(90 + index)}["${market.trim()}"]`;
      });
    }

    return diagram;
  }

  private extractNotableClients(sources: SourceData[]): string[] | undefined {
    const clients: string[] = [];
    const clientKeywords = ['client', 'customer', 'partner'];

    for (const source of sources) {
      const sentences = source.content.split('.');
      for (const sentence of sentences) {
        if (clientKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          // Simple extraction - this would need improvement in real implementation
          const words = sentence.split(' ');
          for (const word of words) {
            const cleanWord = word.replace(/[.,!?;]/g, '');
            if (cleanWord.length > 3 && cleanWord[0] === cleanWord[0].toUpperCase() &&
                !clients.includes(cleanWord)) {
              clients.push(cleanWord);
              if (clients.length >= 5) break;
            }
          }
        }
      }
    }

    return clients.length > 0 ? clients : undefined;
  }

  private extractRecentArticles(sources: SourceData[]): string[] | undefined {
    const newsSources = sources.filter(s => s.type === 'news');
    if (newsSources.length === 0) return undefined;

    return newsSources.slice(0, 5).map(source => source.title);
  }

  private generateFinalSummary(companyName: string, accountPlan: AccountPlan): string {
    const summary = [
      `Account plan for ${companyName} has been generated based on comprehensive research.`,
      `Key findings include ${accountPlan.key_products_and_services.length} products/services,`,
      `${accountPlan.leadership_and_key_people.length} identified leaders,`,
      `and ${accountPlan.competitors.length} main competitors.`,
      `Further analysis and manual review recommended for strategic planning.`,
    ];

    return summary.join(' ');
  }

  private generateNotes(companyName: string, sources: SourceData[]): string[] {
    const notes: string[] = [];

    if (sources.length === 0) {
      notes.push(`No data sources found for ${companyName}. Research may be incomplete.`);
      notes.push('Consider verifying company name spelling or providing additional context.');
    } else {
      notes.push(`Analysis based on ${sources.length} web sources.`);
      notes.push('Data accuracy should be verified through official company sources.');

      if (sources.every(s => s.type === 'company')) {
        notes.push('Leadership and competitor information may be incomplete.');
      }

      if (sources.length < 5) {
        notes.push('Limited number of sources found. Consider additional research.');
      }
    }

    return notes;
  }

  private updateProgress(progress: number, step: string, completed: boolean): void {
    if (this.currentSession && this.callbacks) {
      this.currentSession.progress = progress;
      this.currentSession.currentStep = step;
      this.currentSession.updatedAt = new Date();

      this.callbacks.onProgress({
        step,
        progress,
        message: step,
        completed,
      });
    }
  }

  private generateSessionId(): string {
    return `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentSession(): ResearchSession | null {
    return this.currentSession;
  }

  isResearchActive(): boolean {
    return this.currentSession?.status === 'starting' ||
           this.currentSession?.status === 'searching' ||
           this.currentSession?.status === 'synthesizing';
  }
}

// Singleton instance for the application
export const researchAgent = new ResearchAgent();