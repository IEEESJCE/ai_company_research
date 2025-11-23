'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { AccountPlan } from '@/types/accountPlan';

interface MermaidDiagramProps {
  accountPlan: AccountPlan;
  className?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  accountPlan,
  className = ''
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showCode, setShowCode] = useState<boolean>(false);
  const svgRef = useRef<HTMLDivElement>(null);

  // Generate a more comprehensive mermaid diagram based on account plan data
  const generateEnhancedDiagram = (plan: AccountPlan): string => {
    const companyName = plan.company_overview.split(' ').slice(0, 3).join(' ') || 'Company';
    const products = plan.key_products_and_services.slice(0, 4);
    const competitors = plan.competitors.slice(0, 3);
    const markets = plan.target_market.split(',').slice(0, 3).map(m => m.trim());
    const leadership = plan.leadership_and_key_people.slice(0, 2);

    let diagram = 'graph LR\n';
    diagram += `classDef company fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n`;
    diagram += `classDef product fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n`;
    diagram += `classDef market fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px\n`;
    diagram += `classDef competitor fill:#ffebee,stroke:#b71c1c,stroke-width:2px\n`;
    diagram += `classDef leader fill:#fff3e0,stroke:#e65100,stroke-width:2px\n\n`;

    // Main company node
    diagram += `A["${companyName}"]:::company\n`;

    // Products/Services
    if (products.length > 0) {
      diagram += `subgraph Products["Products & Services"]\n`;
      products.forEach((product, index) => {
        const letter = String.fromCharCode(66 + index); // B, C, D, E...
        diagram += `  ${letter}["${product.name}"]:::product\n`;
        diagram += `  A --> ${letter}\n`;
      });
      diagram += `end\n`;
    }

    // Target Markets
    if (markets.length > 0 && markets[0]) {
      const marketStart = String.fromCharCode(66 + products.length);
      diagram += `subgraph Markets["Target Markets"]\n`;
      markets.forEach((market, index) => {
        const letter = String.fromCharCode(90 - markets.length + index + 1); // Working backwards from Z
        diagram += `  ${letter}["${market}"]:::market\n`;
        if (index === 0) {
          diagram += `  A --> ${letter}\n`;
        }
      });
      diagram += `end\n`;
    }

    // Leadership
    if (leadership.length > 0) {
      diagram += `subgraph Leadership["Key Leadership"]\n`;
      leadership.forEach((leader, index) => {
        const letter = String.fromCharCode(80 + index); // P, Q, R...
        const leaderName = leader.name || 'Executive';
        diagram += `  ${letter}["${leaderName}<br/>${leader.role || 'Leader'}"]:::leader\n`;
        diagram += `  A -.-> ${letter}\n`;
      });
      diagram += `end\n`;
    }

    // Competitors
    if (competitors.length > 0) {
      diagram += `subgraph Competition["Key Competitors"]\n`;
      competitors.forEach((competitor, index) => {
        const letter = String.fromCharCode(70 + index); // F, G, H...
        diagram += `  ${letter}["${competitor}"]:::competitor\n`;
        diagram += `  ${letter} -.-> A\n`;
      });
      diagram += `end\n`;
    }

    // Add unique value proposition as a note if available
    if (plan.unique_value_proposition) {
      diagram += `note for A\n  "${plan.unique_value_proposition.substring(0, 100)}${plan.unique_value_proposition.length > 100 ? '...' : ''}"\nend note\n`;
    }

    return diagram;
  };

  // Simple fallback diagram generation
  const generateSimpleDiagram = (plan: AccountPlan): string => {
    const companyName = plan.company_overview.split(' ').slice(0, 2).join(' ') || 'Company';
    const products = plan.key_products_and_services.slice(0, 4);

    let diagram = 'graph LR\n';
    diagram += `A["${companyName}"]`;

    products.forEach((product, index) => {
      const letter = String.fromCharCode(66 + index);
      diagram += `\nA --> ${letter}["${product.name}"]`;
    });

    return diagram;
  };

  // Render mermaid diagram using mermaid library
  const renderDiagram = async () => {
    if (!accountPlan.mermaid_diagram && !accountPlan.company_overview) {
      setError('No data available for diagram generation');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Try to use the enhanced diagram first, fall back to simple if needed
      let diagramCode = accountPlan.mermaid_diagram || generateSimpleDiagram(accountPlan);

      // If account plan has substantial data, generate enhanced diagram
      if (accountPlan.key_products_and_services.length > 0 || accountPlan.competitors.length > 0) {
        diagramCode = generateEnhancedDiagram(accountPlan);
      }

      // For now, we'll just display the code since mermaid rendering requires additional setup
      // In a production environment, you would use the mermaid library to render the SVG
      console.log('Mermaid diagram code:', diagramCode);

    } catch (error) {
      console.error('Error rendering diagram:', error);
      setError('Failed to render diagram');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    renderDiagram();
  }, [accountPlan]);

  const downloadDiagram = () => {
    const diagramCode = accountPlan.mermaid_diagram || generateEnhancedDiagram(accountPlan);
    const dataStr = diagramCode;
    const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${accountPlan.company_overview.split(' ').slice(0, 2).join('_')}_diagram.mmd`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const diagramCode = accountPlan.mermaid_diagram || generateEnhancedDiagram(accountPlan);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Company Structure & Market Position</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title={showCode ? 'Show diagram' : 'Show code'}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={downloadDiagram}
            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            title="Download diagram"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={renderDiagram}
            disabled={isLoading}
            className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
            title="Regenerate diagram"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Generating diagram...</span>
          </div>
        </div>
      ) : showCode ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Mermaid Code</span>
          </div>
          <div className="bg-gray-50 p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700 font-mono whitespace-pre">
              {diagramCode}
            </pre>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Interactive Diagram View</h4>
            <p className="text-gray-600 mb-4">
              This would render an interactive mermaid diagram showing the company structure,
              products, markets, leadership, and competitive landscape.
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-left">
              <h5 className="font-medium text-gray-900 mb-2">Diagram Features:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Company overview with products and services</li>
                <li>• Target markets and customer segments</li>
                <li>• Leadership structure and key personnel</li>
                <li>• Competitive landscape positioning</li>
                <li>• Unique value proposition highlights</li>
              </ul>
            </div>
            <button
              onClick={() => setShowCode(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Mermaid Code
            </button>
          </div>
        </div>
      )}

      {/* Simple text-based diagram preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-3">Quick Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-700">Products:</span>
            <span className="text-gray-600 ml-2">
              {accountPlan.key_products_and_services.length > 0
                ? accountPlan.key_products_and_services.map(p => p.name).join(', ')
                : 'Not specified'}
            </span>
          </div>
          <div>
            <span className="font-medium text-red-700">Competitors:</span>
            <span className="text-gray-600 ml-2">
              {accountPlan.competitors.length > 0
                ? accountPlan.competitors.join(', ')
                : 'Not identified'}
            </span>
          </div>
          <div>
            <span className="font-medium text-green-700">Leadership:</span>
            <span className="text-gray-600 ml-2">
              {accountPlan.leadership_and_key_people.length > 0
                ? `${accountPlan.leadership_and_key_people.length} key members`
                : 'Not identified'}
            </span>
          </div>
          <div>
            <span className="font-medium text-purple-700">Market:</span>
            <span className="text-gray-600 ml-2">
              {accountPlan.target_market || 'Not specified'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};