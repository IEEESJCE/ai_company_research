import { NextRequest, NextResponse } from 'next/server';
import { tavilyClient } from '@/lib/tavilyClient';
import { AccountPlan, ResearchSession, SourceData, createEmptyAccountPlan } from '@/types/accountPlan';
import { isValidAccountPlan } from '@/types/accountPlan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName } = body;

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Create research session
    const session: ResearchSession = {
      id: `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyName,
      status: 'starting',
      progress: 0,
      currentStep: 'Initializing research',
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if Tavily API is configured
    if (!tavilyClient.isConfigured()) {
      return NextResponse.json(
        {
          error: 'Web search service is not configured. Please set TAVILY_API_KEY environment variable.',
          session: {
            ...session,
            status: 'error' as const,
            currentStep: 'Configuration error: Tavily API key not found'
          }
        },
        { status: 503 }
      );
    }

    // Start research process
    const researchResult = await performResearch(session);

    return NextResponse.json({
      success: true,
      session: researchResult,
    });

  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function performResearch(session: ResearchSession): Promise<ResearchSession> {
  try {
    // Update session status
    session.status = 'searching';
    session.progress = 10;
    session.currentStep = 'Collecting company information';
    session.updatedAt = new Date();

    // Step 1: Collect company information
    console.log(`Starting research for ${session.companyName}`);

    const companySources = await tavilyClient.searchCompanyInfo(session.companyName);
    session.sources.push(...companySources);
    session.progress = 30;
    session.currentStep = 'Gathering leadership information';
    session.updatedAt = new Date();

    // Step 2: Collect leadership information
    const leadershipSources = await tavilyClient.searchLeadershipInfo(session.companyName);
    session.sources.push(...leadershipSources);
    session.progress = 50;
    session.currentStep = 'Identifying competitors';
    session.updatedAt = new Date();

    // Step 3: Collect competitor information
    const competitorSources = await tavilyClient.searchCompetitors(session.companyName);
    session.sources.push(...competitorSources);
    session.progress = 70;
    session.currentStep = 'Finding recent news and articles';
    session.updatedAt = new Date();

    // Step 4: Collect recent news
    const newsSources = await tavilyClient.searchRecentNews(session.companyName);
    session.sources.push(...newsSources);
    session.progress = 85;
    session.currentStep = 'Synthesizing account plan';
    session.updatedAt = new Date();

    // Step 5: Generate account plan
    session.status = 'synthesizing';
    const accountPlan = await generateAccountPlan(session.companyName, session.sources);

    session.accountPlan = accountPlan;
    session.status = 'complete';
    session.progress = 100;
    session.currentStep = 'Research completed successfully';
    session.updatedAt = new Date();

    console.log(`Research completed for ${session.companyName} with ${session.sources.length} sources`);

    return session;

  } catch (error) {
    console.error('Research process failed:', error);
    session.status = 'error';
    session.currentStep = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    session.updatedAt = new Date();
    return session;
  }
}

async function generateAccountPlan(companyName: string, sources: SourceData[]): Promise<AccountPlan> {
  const accountPlan = createEmptyAccountPlan();

  try {
    // Extract company overview
    accountPlan.company_overview = extractCompanyOverview(companyName, sources);

    // Extract mission and vision
    accountPlan.mission_and_vision = extractMissionVision(companyName, sources);

    // Extract products and services
    accountPlan.key_products_and_services = extractProductsServices(companyName, sources);

    // Extract target market
    accountPlan.target_market = extractTargetMarket(sources);

    // Extract business model
    accountPlan.business_model = extractBusinessModel(sources);

    // Extract unique value proposition
    accountPlan.unique_value_proposition = extractValueProposition(companyName, sources);

    // Extract leadership information
    accountPlan.leadership_and_key_people = extractLeadership(sources);

    // Extract competitors
    accountPlan.competitors = extractCompetitors(sources);

    // Extract market position
    accountPlan.market_position_summary = extractMarketPosition(companyName, sources);

    // Generate SWOT analysis
    accountPlan.swot_analysis = generateSWOTAnalysis(companyName, sources);

    // Generate mermaid diagram
    accountPlan.mermaid_diagram = generateMermaidDiagram(companyName, accountPlan);

    // Extract notable clients
    accountPlan.notable_clients = extractNotableClients(sources);

    // Extract recent articles
    accountPlan.recent_articles = extractRecentArticles(sources);

    // Generate final summary
    accountPlan.final_summary = generateFinalSummary(companyName, accountPlan);

    // Generate notes
    accountPlan.notes = generateNotes(companyName, sources);

    // Validate the generated account plan
    if (!isValidAccountPlan(accountPlan)) {
      console.warn('Generated account plan failed validation, but returning anyway');
    }

    return accountPlan;

  } catch (error) {
    console.error('Error generating account plan:', error);
    // Return a basic plan with error information
    return {
      ...createEmptyAccountPlan(),
      company_overview: `Failed to generate complete account plan for ${companyName}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      notes: [
        'Account plan generation encountered errors.',
        'Some data may be incomplete or missing.',
        'Please verify the information and try again.',
        `Error details: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]
    };
  }
}

// Helper functions for data extraction (simplified versions of the client-side functions)

function extractCompanyOverview(companyName: string, sources: SourceData[]): string {
  const companySources = sources.filter(s => s.type === 'company');
  if (companySources.length === 0) {
    return `Limited information available about ${companyName}. More comprehensive data sources are needed.`;
  }

  // Combine content from the most relevant sources
  const relevantSources = companySources
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);

  const overviews = relevantSources.map(source => {
    const sentences = source.content.split('.').filter(s => s.trim().length > 20);
    return sentences.slice(0, 2).join('. ');
  });

  return overviews.join('. ').trim() || `Basic company information for ${companyName} has been collected.`;
}

function extractMissionVision(companyName: string, sources: SourceData[]): string {
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

  return `Mission and vision information for ${companyName} requires additional research.`;
}

function extractProductsServices(companyName: string, sources: SourceData[]): Array<{name: string, features?: string, pricing?: string}> {
  const products: Array<{name: string, features?: string, pricing?: string}> = [];
  const companySources = sources.filter(s => s.type === 'company');

  for (const source of companySources) {
    const productKeywords = ['product', 'service', 'solution', 'platform', 'offering', 'software'];
    const sentences = source.content.split('.');

    for (const sentence of sentences) {
      if (productKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        const productName = extractProductName(sentence);
        if (productName && !products.some(p => p.name === productName)) {
          products.push({
            name: productName,
            features: extractFeatures(sentence),
            pricing: extractPricing(sentence),
          });
        }
      }
    }
  }

  return products.slice(0, 8);
}

function extractProductName(sentence: string): string | null {
  const words = sentence.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.length > 3 && word[0] === word[0].toUpperCase() && !['The', 'And', 'With'].includes(word)) {
      return word.replace(/[.,!?;]/g, '');
    }
  }
  return null;
}

function extractFeatures(sentence: string): string | undefined {
  const featureKeywords = ['feature', 'capability', 'function', 'include', 'offer', 'provide'];
  if (featureKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
    return sentence.trim();
  }
  return undefined;
}

function extractPricing(sentence: string): string | undefined {
  const pricePatterns = [/\$\d+/g, /free/i, /subscription/i, /pricing/i];
  for (const pattern of pricePatterns) {
    if (pattern.test(sentence)) {
      return sentence.trim();
    }
  }
  return undefined;
}

function extractTargetMarket(sources: SourceData[]): string {
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

  return 'Target market analysis requires additional market research data.';
}

function extractBusinessModel(sources: SourceData[]): string {
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

  return 'Business model information requires deeper financial analysis.';
}

function extractValueProposition(companyName: string, sources: SourceData[]): string {
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

  return `${companyName}'s competitive advantages and market differentiation require further analysis.`;
}

function extractLeadership(sources: SourceData[]): Array<{name?: string, role?: string, details?: string, source_urls?: string[]}> {
  const leadership: Array<{name?: string, role?: string, details?: string, source_urls?: string[]}> = [];
  const leadershipSources = sources.filter(s => s.type === 'leadership');

  for (const source of leadershipSources) {
    const titlePatterns = ['CEO', 'CTO', 'CFO', 'President', 'Founder', 'Director', 'Vice President'];
    const sentences = source.content.split('.');

    for (const sentence of sentences) {
      for (const title of titlePatterns) {
        if (sentence.includes(title)) {
          const leader = parseLeadershipInfo(sentence, title, source.url);
          if (leader && !leadership.some(l => l.name === leader.name && l.role === leader.role)) {
            leadership.push(leader);
          }
        }
      }
    }
  }

  return leadership.slice(0, 8);
}

function parseLeadershipInfo(sentence: string, title: string, sourceUrl: string) {
  const words = sentence.split(' ');
  let name = '';

  for (let i = 0; i < words.length; i++) {
    if (words[i].includes(title)) {
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

function extractCompetitors(sources: SourceData[]): string[] {
  const competitorSources = sources.filter(s => s.type === 'competitor');
  const competitors: string[] = [];

  for (const source of competitorSources) {
    const sentences = source.content.split('.');
    for (const sentence of sentences) {
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

  return competitors.slice(0, 8);
}

function extractMarketPosition(companyName: string, sources: SourceData[]): string {
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

  return `${companyName}'s market position and competitive landscape analysis requires additional data.`;
}

function generateSWOTAnalysis(companyName: string, sources: SourceData[]) {
  const allSources = sources;
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
        if (strengths.length < 4) strengths.push(sentence.trim());
      } else if (weaknessKeywords.some(keyword => lowerSentence.includes(keyword))) {
        if (weaknesses.length < 4) weaknesses.push(sentence.trim());
      } else if (opportunityKeywords.some(keyword => lowerSentence.includes(keyword))) {
        if (opportunities.length < 4) opportunities.push(sentence.trim());
      } else if (threatKeywords.some(keyword => lowerSentence.includes(keyword))) {
        if (threats.length < 4) threats.push(sentence.trim());
      }
    }
  }

  if (strengths.length === 0) strengths.push(`${companyName} shows market presence and operational capabilities.`);
  if (weaknesses.length === 0) weaknesses.push(`Areas for improvement and potential challenges require identification.`);
  if (opportunities.length === 0) opportunities.push('Market expansion and growth opportunities available in current landscape.');
  if (threats.length === 0) threats.push('Competitive pressures and market risks require ongoing monitoring.');

  return { strengths, weaknesses, opportunities, threats };
}

function generateMermaidDiagram(companyName: string, accountPlan: AccountPlan): string {
  const products = accountPlan.key_products_and_services.slice(0, 3);

  let diagram = 'graph LR\n';
  diagram += `A["${companyName}"]`;

  products.forEach((product, index) => {
    const letter = String.fromCharCode(66 + index);
    diagram += `\nA --> ${letter}["${product.name}"]`;
  });

  diagram += `\nA --> D["Market"]`;

  return diagram;
}

function extractNotableClients(sources: SourceData[]) {
  const clients: string[] = [];
  const clientKeywords = ['client', 'customer', 'partner'];

  for (const source of sources) {
    const sentences = source.content.split('.');
    for (const sentence of sentences) {
      if (clientKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        const words = sentence.split(' ');
        for (const word of words) {
          const cleanWord = word.replace(/[.,!?;]/g, '');
          if (cleanWord.length > 3 && cleanWord[0] === cleanWord[0].toUpperCase() &&
              !clients.includes(cleanWord)) {
            clients.push(cleanWord);
            if (clients.length >= 4) break;
          }
        }
      }
    }
  }

  return clients.length > 0 ? clients : undefined;
}

function extractRecentArticles(sources: SourceData[]) {
  const newsSources = sources.filter(s => s.type === 'news');
  if (newsSources.length === 0) return undefined;

  return newsSources.slice(0, 4).map(source => source.title);
}

function generateFinalSummary(companyName: string, accountPlan: AccountPlan): string {
  const summary = [
    `Account plan for ${companyName} generated from ${accountPlan.leadership_and_key_people.length + accountPlan.key_products_and_services.length} data points.`,
    `Analysis includes ${accountPlan.key_products_and_services.length} products/services and ${accountPlan.competitors.length} identified competitors.`,
    'Recommendation: Review and validate data with additional sources for strategic planning.',
  ];

  return summary.join(' ');
}

function generateNotes(companyName: string, sources: SourceData[]): string[] {
  const notes: string[] = [];

  if (sources.length === 0) {
    notes.push(`No data sources found for ${companyName}. Research incomplete.`);
    notes.push('Verify company spelling and provide additional context for better results.');
  } else {
    notes.push(`Analysis based on ${sources.length} web sources.`);
    notes.push('Data accuracy should be verified through official company channels.');

    if (sources.every(s => s.type === 'company')) {
      notes.push('Leadership and competitor information may be incomplete.');
    }

    if (sources.length < 4) {
      notes.push('Limited sources found. Additional research recommended for comprehensive analysis.');
    }
  }

  return notes;
}