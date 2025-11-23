import { ChatMessage, ResearchSession } from '@/types/accountPlan';

export type UserPersona = 'confused' | 'efficient' | 'chatty' | 'edge_case' | 'normal';
export type ConversationContext = 'initial' | 'researching' | 'editing' | 'digging_deeper' | 'completed';

export interface ConversationState {
  currentCompany: string;
  persona: UserPersona;
  context: ConversationContext;
  lastResearchTime: number;
  conversationDepth: number;
  userStyle: {
    formality: number; // 0-10
    verbosity: number; // 0-10
    technical: number; // 0-10
  };
  memory: {
    previousQueries: string[];
    userPreferences: string[];
    conversationTopics: string[];
  };
}

export class AIConversationalEngine {
  private conversationHistory: ChatMessage[] = [];
  private state: ConversationState;

  constructor() {
    this.state = this.initializeState();
  }

  private initializeState(): ConversationState {
    return {
      currentCompany: '',
      persona: 'normal',
      context: 'initial',
      lastResearchTime: 0,
      conversationDepth: 0,
      userStyle: {
        formality: 5,
        verbosity: 5,
        technical: 5,
      },
      memory: {
        previousQueries: [],
        userPreferences: [],
        conversationTopics: [],
      },
    };
  }

  analyzeUserInput(input: string): {
    persona: UserPersona;
    intent: string;
    entities: string[];
    sentiment: number;
  } {
    const lowerInput = input.toLowerCase();
    const words = input.split(/\s+/);

    // Detect persona
    let persona: UserPersona = 'normal';

    // Confused user indicators
    if (lowerInput.includes('?') || lowerInput.includes('help') ||
        lowerInput.includes('what') || lowerInput.includes('how') ||
        lowerInput.includes('i don\'t know') || lowerInput.includes('not sure')) {
      persona = 'confused';
    }

    // Efficient user indicators
    if (lowerInput.length < 20 && words.length < 4 ||
        lowerInput.includes('quick') || lowerInput.includes('fast') ||
        lowerInput.includes('just') || lowerInput.includes('only')) {
      persona = 'efficient';
    }

    // Chatty user indicators
    if (words.length > 15 || lowerInput.length > 100 ||
        lowerInput.includes('by the way') || lowerInput.includes('also') ||
        lowerInput.includes('interesting') || lowerInput.includes('think')) {
      persona = 'chatty';
    }

    // Edge case indicators
    if (lowerInput.includes('hello') || lowerInput.includes('hi') ||
        lowerInput.includes('thanks') || lowerInput.includes('bye') ||
        !this.isCompanyRelated(input)) {
      persona = 'edge_case';
    }

    // Extract entities (company names, etc.)
    const entities = this.extractEntities(input);

    // Sentiment analysis
    const sentiment = this.analyzeSentiment(input);

    return {
      persona,
      intent: this.extractIntent(input),
      entities,
      sentiment,
    };
  }

  private extractEntities(input: string): string[] {
    const entities: string[] = [];

    // Simple company name extraction (could be enhanced with NLP)
    const companyPatterns = [
      /(?:company|corporation|inc|llc)\s+([A-Z][a-zA-Z\s&]+)/gi,
      /(?:research|analyze|tell me about|find)\s+([A-Z][a-zA-Z\s&]+)/gi,
      /^([A-Z][a-zA-Z\s&]+)\s+(?:company|corporation|inc|llc)/gi,
    ];

    companyPatterns.forEach(pattern => {
      const matches = input.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const entity = match.replace(/(?:company|corporation|inc|llc|research|analyze|tell me about|find)/gi, '').trim();
          if (entity && entity.length > 2) {
            entities.push(entity);
          }
        });
      }
    });

    // Capitalized words might be company names
    const capitalizedWords = input.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g);
    if (capitalizedWords) {
      entities.push(...capitalizedWords);
    }

    return [...new Set(entities)]; // Remove duplicates
  }

  private extractIntent(input: string): string {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('research') || lowerInput.includes('analyze') || lowerInput.includes('find')) {
      return 'research';
    } else if (lowerInput.includes('dig deeper') || lowerInput.includes('more information') || lowerInput.includes('tell me more')) {
      return 'dig_deeper';
    } else if (lowerInput.includes('edit') || lowerInput.includes('change') || lowerInput.includes('update')) {
      return 'edit';
    } else if (lowerInput.includes('export') || lowerInput.includes('save') || lowerInput.includes('download')) {
      return 'export';
    } else if (lowerInput.includes('competitor') || lowerInput.includes('competition')) {
      return 'competitor_analysis';
    } else if (lowerInput.includes('swot') || lowerInput.includes('strengths') || lowerInput.includes('weaknesses')) {
      return 'swot_analysis';
    } else if (this.isGreeting(input)) {
      return 'greeting';
    } else if (this.isCompanyRelated(input)) {
      return 'research';
    }

    return 'general';
  }

  private analyzeSentiment(input: string): number {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'interesting', 'love', 'perfect', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor', 'disappointed', 'frustrated'];

    const lowerInput = input.toLowerCase();
    let sentiment = 0;

    positiveWords.forEach(word => {
      if (lowerInput.includes(word)) sentiment += 1;
    });

    negativeWords.forEach(word => {
      if (lowerInput.includes(word)) sentiment -= 1;
    });

    // Normalize to -10 to 10 range
    return Math.max(-10, Math.min(10, sentiment * 2));
  }

  private isGreeting(input: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'thanks', 'thank you', 'bye', 'goodbye'];
    return greetings.some(greeting => input.toLowerCase().includes(greeting));
  }

  private isCompanyRelated(input: string): boolean {
    const companyKeywords = ['company', 'corporation', 'inc', 'llc', 'business', 'research', 'analyze', 'competitor', 'market', 'industry'];
    return companyKeywords.some(keyword => input.toLowerCase().includes(keyword));
  }

  generateResponse(userInput: string, currentSession?: ResearchSession): {
    response: string;
    suggestions: string[];
    followUpQuestions: string[];
    shouldContinueResearch: boolean;
  } {
    const analysis = this.analyzeUserInput(userInput);
    this.updateState(analysis);

    const response = this.craftResponse(analysis, currentSession);
    const suggestions = this.generateSuggestions(analysis);
    const followUpQuestions = this.generateFollowUpQuestions(analysis, currentSession);
    const shouldContinueResearch = this.shouldContinueResearch(analysis);

    return { response, suggestions, followUpQuestions, shouldContinueResearch };
  }

  private updateState(analysis: any) {
    this.state.persona = analysis.persona;
    this.state.conversationDepth++;

    if (analysis.entities.length > 0) {
      this.state.currentCompany = analysis.entities[0];
    }

    // Update user style based on input
    if (analysis.persona === 'efficient') {
      this.state.userStyle.verbosity = Math.max(1, this.state.userStyle.verbosity - 1);
    } else if (analysis.persona === 'chatty') {
      this.state.userStyle.verbosity = Math.min(10, this.state.userStyle.verbosity + 1);
    }

    // Add to memory
    this.state.memory.previousQueries.push(userInput);
    if (this.state.memory.previousQueries.length > 10) {
      this.state.memory.previousQueries.shift();
    }

    // Extract preferences
    if (analysis.sentiment > 0) {
      this.state.memory.userPreferences.push('positive_feedback');
    }
  }

  private craftResponse(analysis: any, currentSession?: ResearchSession): string {
    const { persona, intent, sentiment } = analysis;

    switch (persona) {
      case 'confused':
        return this.craftConfusedUserResponse(analysis, currentSession);
      case 'efficient':
        return this.craftEfficientUserResponse(analysis, currentSession);
      case 'chatty':
        return this.craftChattyUserResponse(analysis, currentSession);
      case 'edge_case':
        return this.craftEdgeCaseResponse(analysis, currentSession);
      default:
        return this.craftNormalUserResponse(analysis, currentSession);
    }
  }

  private craftConfusedUserResponse(analysis: any, currentSession?: ResearchSession): string {
    const { intent, entities } = analysis;

    if (this.isGreeting(analysis.entities[0] || '')) {
      return "Hello! I'm here to help you research companies and create comprehensive account plans. I can assist with finding company information, analyzing competitors, conducting SWOT analysis, and much more. What company would you like to learn about today? 🎯";
    }

    if (entities.length === 0) {
      return "I'd be happy to help! To get started, just tell me the name of any company you'd like to research. For example, you could say 'Tell me about Apple' or 'Research Tesla'. I'll then gather comprehensive information about the company, including their business model, leadership, competitors, and create a detailed account plan for you. 📊";
    }

    if (currentSession?.status === 'complete') {
      return `Perfect! I can see you've already researched ${this.state.currentCompany}. Would you like me to:

🔍 Dig deeper into specific aspects (like leadership, products, or market position)?
📊 Analyze the information I found?
✏️ Edit any part of the account plan?
📤 Export the results?

Just let me know what you'd like to explore further!`;
    }

    return `Great choice! I'll help you research ${entities[0]}. Let me gather comprehensive information about their business model, leadership team, products, competitors, and market position. This will take about 30-60 seconds while I analyze multiple data sources. Ready to begin the deep dive? 🚀`;
  }

  private craftEfficientUserResponse(analysis: any, currentSession?: ResearchSession): string {
    const { intent, entities } = analysis;

    if (entities.length === 0) {
      return "Which company should I research?";
    }

    if (currentSession?.status === 'complete') {
      return `${this.state.currentCompany} research complete. Options: dig deeper, edit, export. Which?`;
    }

    return `Researching ${entities[0]} now...`;
  }

  private craftChattyUserResponse(analysis: any, currentSession?: ResearchSession): string {
    const { intent, entities } = analysis;

    if (this.isGreeting(entities[0] || '')) {
      return "Oh, hello there! 👋 I'm absolutely thrilled to meet you! I'm your AI research assistant, and I absolutely love diving deep into companies and uncovering fascinating business insights. There's nothing more exciting than piecing together the puzzle of what makes companies successful, don't you think?

Whether you're interested in a tech giant, an innovative startup, or anything in between, I'm here to help you discover their story. So, what's on your mind? Which company has caught your curiosity today? ✨";
    }

    if (entities.length === 0) {
      return "I'm absolutely fascinated by your curiosity! Company research is such an incredible journey - it's like being a business detective, piecing together clues about strategy, innovation, and market positioning.

To get started, just share a company name that interests you. It could be a company you admire, want to compete with, or are simply curious about. I'll gather insights from across the web and create something truly comprehensive for you. What company would you like to explore together? 🕵️‍♀️";
    }

    return `Ooh, ${entities[0]}! That's such an interesting choice! I'm genuinely excited to dive into this one. Company research is like peeling back layers of an onion - there's always something fascinating to discover about their business strategy, the brilliant minds behind their success, their competitive landscape, and how they're positioning themselves for the future.

Let me gather some really comprehensive insights for you. I'll look at their business model, leadership philosophy, product ecosystem, competitive advantages, and so much more. This is going to be fascinating! Ready for this deep dive? 🚀✨`;
  }

  private craftEdgeCaseResponse(analysis: any, currentSession?: ResearchSession): string {
    const { intent, entities } = analysis;

    if (this.isGreeting(entities[0] || '')) {
      return "Hello! 👋 I'm an AI-powered company research assistant. I can help you create comprehensive account plans, analyze competitors, and conduct business intelligence research.

If you're looking to research a company, just tell me the name and I'll get started!";
    }

    if (!this.isCompanyRelated(entities[0] || '')) {
      return "I'd be happy to help! I specialize in company research and account plan generation.

To get started, simply tell me the name of any company you'd like to research, and I'll gather comprehensive information about their business model, leadership, competitors, and create a detailed account plan for you.

What company would you like to explore?";
    }

    return this.craftNormalUserResponse(analysis, currentSession);
  }

  private craftNormalUserResponse(analysis: any, currentSession?: ResearchSession): string {
    const { intent, entities } = analysis;

    if (entities.length === 0) {
      return "I'm ready to help with company research! Please provide the name of the company you'd like me to research, and I'll create a comprehensive account plan for you.";
    }

    if (currentSession?.status === 'complete') {
      return `Excellent! I've completed the research on ${this.state.currentCompany}. The account plan includes company overview, products/services, leadership analysis, SWOT assessment, and competitor insights.

Would you like me to dig deeper into any specific area, or would you prefer to export the results?`;
    }

    return `I'll research ${entities[0]} for you, gathering information about their business model, market position, leadership, and competitive landscape. This comprehensive analysis will help inform strategic decisions.";
  }

  private generateSuggestions(analysis: any): string[] {
    const { persona, intent, entities } = analysis;
    const suggestions: string[] = [];

    switch (persona) {
      case 'confused':
        suggestions.push(
          "Tell me about a specific company",
          "Help me understand my competitors",
          "Create an account plan template",
          "Show me examples of completed research"
        );
        break;
      case 'efficient':
        suggestions.push(
          entities.length > 0 ? `Research ${entities[0]}` : "Research a company",
          "Quick competitor analysis",
          "Export to JSON"
        );
        break;
      case 'chatty':
        suggestions.push(
          "Let's explore an innovative company together",
          "Tell me about your industry challenges",
          "Let's brainstorm business opportunities",
          "Share insights about market trends"
        );
        break;
      default:
        suggestions.push(
          "Research a company",
          "Analyze competitors",
          "Create SWOT analysis",
          "Export account plan"
        );
    }

    return suggestions;
  }

  private generateFollowUpQuestions(analysis: any, currentSession?: ResearchSession): string[] {
    const questions: string[] = [];

    if (currentSession?.status === 'complete') {
      questions.push(
        "Would you like me to dig deeper into any specific area?",
        "Should we analyze the competitive landscape further?",
        "Do you want to export this account plan?",
        "Would you like to edit any sections?"
      );
    } else {
      questions.push(
        "What aspects of the company are most important to you?",
        "Are you interested in their market position?",
        "Should I focus on leadership analysis?",
        "Would you like competitor information included?"
      );
    }

    return questions;
  }

  private shouldContinueResearch(analysis: any): boolean {
    const { intent, persona } = analysis;

    return intent === 'dig_deeper' ||
           (persona === 'chatty' && this.state.conversationDepth < 5) ||
           (this.state.currentCompany && analysis.intent === 'research' && this.state.conversationDepth > 1);
  }

  getConversationState(): ConversationState {
    return { ...this.state };
  }

  updateConversationState(updates: Partial<ConversationState>): void {
    this.state = { ...this.state, ...updates };
  }

  addMessage(message: ChatMessage): void {
    this.conversationHistory.push(message);
    if (this.conversationHistory.length > 100) {
      this.conversationHistory.shift();
    }
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  // Research continuity methods
  shouldStayOnSameCompany(newInput: string): boolean {
    const analysis = this.analyzeUserInput(newInput);

    // Stay on same company if:
    // 1. Research is complete and user wants to dig deeper
    // 2. User is asking about the current company
    // 3. User is asking for more details about research results
    return (
      (this.state.context === 'completed' && analysis.intent === 'dig_deeper') ||
      (this.state.currentCompany && newInput.toLowerCase().includes(this.state.currentCompany.toLowerCase())) ||
      (analysis.intent === 'edit' || analysis.intent === 'export') ||
      (newInput.toLowerCase().includes('more') || newInput.toLowerCase().includes('deeper') || newInput.toLowerCase().includes('details'))
    );
  }

  switchToNewCompany(companyName: string): void {
    this.state.currentCompany = companyName;
    this.state.context = 'researching';
    this.state.conversationDepth = 0;
    this.state.lastResearchTime = Date.now();
  }
}