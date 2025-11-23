# Company Research Assistant (Account Plan Generator)

An interactive AI agent that helps you research companies through natural conversation and generate comprehensive account plans. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔍 **Multi-Source Research**: Gathers information from multiple web sources using Tavily API
- 🎙️ **Voice Interaction**: Speech-to-text and text-to-speech support using Web Speech API
- 📊 **Account Plan Generation**: Creates structured JSON account plans with SWOT analysis
- ✏️ **Interactive Editing**: Edit and refine generated account plans in real-time
- 📈 **Visual Diagrams**: Mermaid diagrams showing company structure and market position
- 📤 **Multiple Export Formats**: JSON, CSV, PDF, and Markdown export options
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai_company_research
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Add your Tavily API key to `.env.local`:
   ```
   NEXT_PUBLIC_TAVILY_API_KEY=your_tavily_api_key_here
   ```

   Get a free API key from [Tavily](https://tavily.com/)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Workflow

1. **Enter Company Name**: Type or speak the name of the company you want to research
2. **Research Progress**: Watch as the AI gathers information from multiple sources
3. **Review Account Plan**: Examine the generated account plan with tabs for different sections
4. **Edit & Refine**: Make changes to any section with inline editing
5. **Export**: Download your account plan in your preferred format

### Voice Features

- **Voice Input**: Click the microphone button to use speech-to-text
- **Voice Output**: AI responses can be read aloud automatically
- **Voice Commands**: Control the research process with your voice

### Account Plan Sections

- **Overview**: Company overview, mission, vision, and market position
- **Products**: Products, services, pricing, and notable clients
- **Leadership**: Key executives and leadership team information
- **SWOT Analysis**: Strengths, weaknesses, opportunities, and threats
- **Diagram**: Visual representation of company structure
- **Raw Data**: Complete JSON data with source citations

## Architecture

### Frontend Components

- `ChatInterface.tsx`: Main chat interface with voice support
- `AccountPlanDisplay.tsx`: Tabbed display for account plans with editing
- `MermaidDiagram.tsx`: Company structure visualization
- `VoiceControls.tsx`: Voice interaction controls

### Backend Services

- `tavilyClient.ts`: Web search integration for company research
- `voiceRecognition.ts`: Web Speech API wrapper
- `researchAgent.ts`: AI processing and data synthesis
- `exportUtils.ts`: Multi-format export functionality

### Data Models

- `AccountPlan`: Complete account plan schema
- `ResearchSession`: Research progress and state management
- `SourceData`: Source tracking and citation management

## API Integration

### Tavily API Configuration

The application uses Tavily for web search capabilities:

```typescript
// Example search usage
const results = await tavilyClient.searchCompanyInfo('Tesla Inc');
```

### Research Workflow

1. **Company Information Search**: Overview, business model, market position
2. **Leadership Research**: Executives and key personnel
3. **Competitor Analysis**: Market competitors and alternatives
4. **Recent News**: Latest articles and press releases
5. **Data Synthesis**: AI-powered analysis and account plan generation

## Data Schema

The account plan follows this JSON structure:

```json
{
  "company_overview": "string",
  "mission_and_vision": "string",
  "key_products_and_services": [
    {
      "name": "string",
      "features": "string",
      "pricing": "string"
    }
  ],
  "target_market": "string",
  "business_model": "string",
  "unique_value_proposition": "string",
  "leadership_and_key_people": [
    {
      "name": "string",
      "role": "string",
      "details": "string",
      "source_urls": ["string"]
    }
  ],
  "competitors": ["string"],
  "market_position_summary": "string",
  "swot_analysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "mermaid_diagram": "string",
  "notable_clients": ["string"],
  "recent_articles": ["string"],
  "final_summary": "string",
  "notes": ["string"]
}
```

## Export Options

### Supported Formats

- **JSON**: Complete data with metadata and sources
- **CSV**: Tabular format for spreadsheet analysis
- **PDF**: Formatted document for presentation
- **Markdown**: Documentation-friendly format

### Export Features

- Source citation inclusion
- Research notes and assumptions
- Metadata tracking
- Batch export capabilities

## Browser Compatibility

### Voice Features

- **Chrome/Edge**: Full voice support
- **Firefox**: Limited support (text-to-speech only)
- **Safari**: Basic support with permission prompts
- **Mobile**: Voice input available on supported devices

### Fallback Options

- Text-only input always available
- Manual progress tracking
- Alternative export methods

## Development

### Project Structure

```
src/
├── app/
│   ├── api/research/          # Research API endpoint
│   ├── page.tsx              # Main application layout
│   └── layout.tsx            # App shell and providers
├── components/
│   ├── ChatInterface.tsx     # Chat and voice interface
│   ├── AccountPlanDisplay.tsx # Plan display and editing
│   └── MermaidDiagram.tsx    # Diagram visualization
├── lib/
│   ├── tavilyClient.ts       # Web search integration
│   ├── voiceRecognition.ts   # Speech API wrapper
│   ├── researchAgent.ts      # AI processing
│   └── exportUtils.ts        # Export functionality
└── types/
    ├── accountPlan.ts        # Type definitions
    └── speech.d.ts           # Speech API types
```

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

```env
NEXT_PUBLIC_TAVILY_API_KEY=your_api_key_here
```

## Troubleshooting

### Common Issues

**Voice Recognition Not Working**
- Check microphone permissions
- Use Chrome/Edge for best compatibility
- Ensure HTTPS connection

**API Key Errors**
- Verify Tavily API key is correctly set
- Check API quota and rate limits
- Ensure environment variables are loaded

**Export Issues**
- Check browser download permissions
- Verify data integrity before export
- Try alternative export formats

### Performance Tips

- Cache research results for repeated queries
- Limit concurrent research sessions
- Use text-only mode for faster processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards

- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- Prettier for formatting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with details
4. Include browser and environment information

## Roadmap

- [ ] Additional AI model integrations
- [ ] Advanced data visualization
- [ ] Team collaboration features
- [ ] CRM system integrations
- [ ] Mobile app development
- [ ] Advanced export templates
- [ ] Real-time collaboration
- [ ] API rate limiting optimization