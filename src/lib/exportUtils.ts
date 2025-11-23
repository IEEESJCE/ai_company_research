import { AccountPlan, ResearchSession } from '@/types/accountPlan';
import { isValidAccountPlan } from '@/types/accountPlan';

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  includeSources?: boolean;
  includeNotes?: boolean;
  fileName?: string;
}

export class ExportUtils {
  static exportAccountPlan(
    accountPlan: AccountPlan,
    researchSession: ResearchSession,
    options: ExportOptions
  ): void {
    // Validate the account plan before export
    if (!isValidAccountPlan(accountPlan)) {
      throw new Error('Invalid account plan data. Cannot export.');
    }

    const fileName = options.fileName || `${researchSession.companyName.replace(/\s+/g, '_')}_account_plan`;

    switch (options.format) {
      case 'json':
        this.exportAsJson(accountPlan, researchSession, options, fileName);
        break;
      case 'csv':
        this.exportAsCsv(accountPlan, fileName);
        break;
      case 'pdf':
        this.exportAsPdf(accountPlan, researchSession, options, fileName);
        break;
      case 'markdown':
        this.exportAsMarkdown(accountPlan, researchSession, options, fileName);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static exportAsJson(
    accountPlan: AccountPlan,
    researchSession: ResearchSession,
    options: ExportOptions,
    fileName: string
  ): void {
    const exportData = {
      metadata: {
        companyName: researchSession.companyName,
        exportedAt: new Date().toISOString(),
        sessionId: researchSession.id,
        sourceCount: researchSession.sources.length,
      },
      ...(options.includeSources && { sources: researchSession.sources }),
      accountPlan: options.includeNotes ? accountPlan : {
        ...accountPlan,
        notes: undefined
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    this.downloadFile(dataUri, `${fileName}.json`, 'application/json');
  }

  private static exportAsCsv(accountPlan: AccountPlan, fileName: string): void {
    const csvRows = [];

    // Header
    csvRows.push('Section,Item,Details');

    // Company Overview
    csvRows.push('Company Overview,Overview,' + this.escapeCsv(accountPlan.company_overview));
    csvRows.push('Company Overview,Mission & Vision,' + this.escapeCsv(accountPlan.mission_and_vision));
    csvRows.push('Company Overview,Target Market,' + this.escapeCsv(accountPlan.target_market));
    csvRows.push('Company Overview,Business Model,' + this.escapeCsv(accountPlan.business_model));
    csvRows.push('Company Overview,Value Proposition,' + this.escapeCsv(accountPlan.unique_value_proposition));
    csvRows.push('Company Overview,Market Position,' + this.escapeCsv(accountPlan.market_position_summary));

    // Products
    accountPlan.key_products_and_services.forEach((product, index) => {
      csvRows.push('Products,' + this.escapeCsv(product.name), this.escapeCsv(product.features || '') + (product.pricing ? ' | ' + product.pricing : ''));
    });

    // Leadership
    accountPlan.leadership_and_key_people.forEach((leader, index) => {
      csvRows.push('Leadership,' + this.escapeCsv(leader.name || ''), this.escapeCsv((leader.role || '') + ' | ' + (leader.details || '')));
    });

    // Competitors
    accountPlan.competitors.forEach((competitor, index) => {
      csvRows.push('Competitors,' + this.escapeCsv(competitor), '');
    });

    // SWOT
    accountPlan.swot_analysis.strengths.forEach((strength, index) => {
      csvRows.push('SWOT Strengths,' + this.escapeCsv(strength), '');
    });

    accountPlan.swot_analysis.weaknesses.forEach((weakness, index) => {
      csvRows.push('SWOT Weaknesses,' + this.escapeCsv(weakness), '');
    });

    accountPlan.swot_analysis.opportunities.forEach((opportunity, index) => {
      csvRows.push('SWOT Opportunities,' + this.escapeCsv(opportunity), '');
    });

    accountPlan.swot_analysis.threats.forEach((threat, index) => {
      csvRows.push('SWOT Threats,' + this.escapeCsv(threat), '');
    });

    // Additional data
    if (accountPlan.notable_clients) {
      accountPlan.notable_clients.forEach((client, index) => {
        csvRows.push('Notable Clients,' + this.escapeCsv(client), '');
      });
    }

    if (accountPlan.recent_articles) {
      accountPlan.recent_articles.forEach((article, index) => {
        csvRows.push('Recent Articles,' + this.escapeCsv(article), '');
      });
    }

    csvRows.push('Final Summary,Summary,' + this.escapeCsv(accountPlan.final_summary));

    const csvContent = csvRows.join('\n');
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

    this.downloadFile(dataUri, `${fileName}.csv`, 'text/csv');
  }

  private static exportAsPdf(
    accountPlan: AccountPlan,
    researchSession: ResearchSession,
    options: ExportOptions,
    fileName: string
  ): void {
    // Simple PDF generation using browser print functionality
    // In a production environment, you would use a library like jsPDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups for this site.');
    }

    const htmlContent = this.generatePrintableHtml(accountPlan, researchSession, options);

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  }

  private static exportAsMarkdown(
    accountPlan: AccountPlan,
    researchSession: ResearchSession,
    options: ExportOptions,
    fileName: string
  ): void {
    let markdown = '';

    // Header
    markdown += `# Account Plan: ${researchSession.companyName}\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleDateString()} | `;
    markdown += `**Sources:** ${researchSession.sources.length} | `;
    markdown += `**Session ID:** ${researchSession.id}\n\n`;

    // Company Overview
    markdown += `## Company Overview\n\n`;
    markdown += `**Overview:** ${accountPlan.company_overview}\n\n`;
    markdown += `**Mission & Vision:** ${accountPlan.mission_and_vision}\n\n`;
    markdown += `**Target Market:** ${accountPlan.target_market}\n\n`;
    markdown += `**Business Model:** ${accountPlan.business_model}\n\n`;
    markdown += `**Unique Value Proposition:** ${accountPlan.unique_value_proposition}\n\n`;
    markdown += `**Market Position:** ${accountPlan.market_position_summary}\n\n`;

    // Products & Services
    if (accountPlan.key_products_and_services.length > 0) {
      markdown += `## Products & Services\n\n`;
      accountPlan.key_products_and_services.forEach((product, index) => {
        markdown += `### ${product.name}\n`;
        if (product.features) markdown += `- **Features:** ${product.features}\n`;
        if (product.pricing) markdown += `- **Pricing:** ${product.pricing}\n`;
        markdown += '\n';
      });
    }

    // Leadership
    if (accountPlan.leadership_and_key_people.length > 0) {
      markdown += `## Leadership Team\n\n`;
      accountPlan.leadership_and_key_people.forEach((leader, index) => {
        markdown += `### ${leader.name || 'Unknown'}\n`;
        if (leader.role) markdown += `- **Role:** ${leader.role}\n`;
        if (leader.details) markdown += `- **Details:** ${leader.details}\n`;
        if (leader.source_urls && leader.source_urls.length > 0) {
          markdown += `- **Sources:** ${leader.source_urls.join(', ')}\n`;
        }
        markdown += '\n';
      });
    }

    // Competitors
    if (accountPlan.competitors.length > 0) {
      markdown += `## Competitors\n\n`;
      accountPlan.competitors.forEach((competitor, index) => {
        markdown += `- ${competitor}\n`;
      });
      markdown += '\n';
    }

    // SWOT Analysis
    markdown += `## SWOT Analysis\n\n`;

    markdown += `### Strengths\n\n`;
    accountPlan.swot_analysis.strengths.forEach((strength, index) => {
      markdown += `- ${strength}\n`;
    });
    markdown += '\n';

    markdown += `### Weaknesses\n\n`;
    accountPlan.swot_analysis.weaknesses.forEach((weakness, index) => {
      markdown += `- ${weakness}\n`;
    });
    markdown += '\n';

    markdown += `### Opportunities\n\n`;
    accountPlan.swot_analysis.opportunities.forEach((opportunity, index) => {
      markdown += `- ${opportunity}\n`;
    });
    markdown += '\n';

    markdown += `### Threats\n\n`;
    accountPlan.swot_analysis.threats.forEach((threat, index) => {
      markdown += `- ${threat}\n`;
    });
    markdown += '\n';

    // Additional Information
    if (accountPlan.notable_clients && accountPlan.notable_clients.length > 0) {
      markdown += `## Notable Clients\n\n`;
      accountPlan.notable_clients.forEach((client, index) => {
        markdown += `- ${client}\n`;
      });
      markdown += '\n';
    }

    if (accountPlan.recent_articles && accountPlan.recent_articles.length > 0) {
      markdown += `## Recent Articles\n\n`;
      accountPlan.recent_articles.forEach((article, index) => {
        markdown += `- ${article}\n`;
      });
      markdown += '\n';
    }

    // Mermaid Diagram
    if (accountPlan.mermaid_diagram) {
      markdown += `## Company Structure Diagram\n\n`;
      markdown += '```mermaid\n';
      markdown += accountPlan.mermaid_diagram + '\n';
      markdown += '```\n\n';
    }

    // Final Summary
    markdown += `## Summary\n\n`;
    markdown += accountPlan.final_summary + '\n\n';

    // Notes
    if (options.includeNotes && accountPlan.notes && accountPlan.notes.length > 0) {
      markdown += `## Research Notes\n\n`;
      accountPlan.notes.forEach((note, index) => {
        markdown += `- ${note}\n`;
      });
      markdown += '\n';
    }

    // Sources
    if (options.includeSources && researchSession.sources.length > 0) {
      markdown += `## Sources\n\n`;
      researchSession.sources.forEach((source, index) => {
        markdown += `${index + 1}. [${source.title}](${source.url}) (${source.type})\n`;
      });
    }

    const dataUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
    this.downloadFile(dataUri, `${fileName}.md`, 'text/markdown');
  }

  private static generatePrintableHtml(
    accountPlan: AccountPlan,
    researchSession: ResearchSession,
    options: ExportOptions
  ): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Account Plan: ${researchSession.companyName}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #1e40af; border-bottom: 2px solid #1e40af; }
        h2 { color: #374151; margin-top: 30px; }
        h3 { color: #6b7280; }
        .metadata { background: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .swot-section { padding: 15px; border-radius: 5px; }
        .strengths { background: #dcfce7; }
        .weaknesses { background: #fee2e2; }
        .opportunities { background: #dbeafe; }
        .threats { background: #fed7aa; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
        .diagram { background: #f9fafb; padding: 20px; border-radius: 5px; font-family: monospace; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <h1>Account Plan: ${researchSession.companyName}</h1>

    <div class="metadata">
        <strong>Generated:</strong> ${new Date().toLocaleDateString()} |
        <strong>Sources:</strong> ${researchSession.sources.length} |
        <strong>Session ID:</strong> ${researchSession.id}
    </div>

    <div class="section">
        <h2>Company Overview</h2>
        <p><strong>Overview:</strong> ${accountPlan.company_overview}</p>
        <p><strong>Mission & Vision:</strong> ${accountPlan.mission_and_vision}</p>
        <p><strong>Target Market:</strong> ${accountPlan.target_market}</p>
        <p><strong>Business Model:</strong> ${accountPlan.business_model}</p>
        <p><strong>Value Proposition:</strong> ${accountPlan.unique_value_proposition}</p>
        <p><strong>Market Position:</strong> ${accountPlan.market_position_summary}</p>
    </div>

    ${accountPlan.key_products_and_services.length > 0 ? `
    <div class="section">
        <h2>Products & Services</h2>
        ${accountPlan.key_products_and_services.map(product => `
            <h3>${product.name}</h3>
            ${product.features ? `<p><strong>Features:</strong> ${product.features}</p>` : ''}
            ${product.pricing ? `<p><strong>Pricing:</strong> ${product.pricing}</p>` : ''}
        `).join('')}
    </div>
    ` : ''}

    ${accountPlan.leadership_and_key_people.length > 0 ? `
    <div class="section">
        <h2>Leadership Team</h2>
        ${accountPlan.leadership_and_key_people.map(leader => `
            <h3>${leader.name || 'Unknown'}</h3>
            ${leader.role ? `<p><strong>Role:</strong> ${leader.role}</p>` : ''}
            ${leader.details ? `<p><strong>Details:</strong> ${leader.details}</p>` : ''}
            ${leader.source_urls ? `<p><strong>Sources:</strong> ${leader.source_urls.join(', ')}</p>` : ''}
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>SWOT Analysis</h2>
        <div class="swot-grid">
            <div class="swot-section strengths">
                <h3>Strengths</h3>
                <ul>
                    ${accountPlan.swot_analysis.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            <div class="swot-section weaknesses">
                <h3>Weaknesses</h3>
                <ul>
                    ${accountPlan.swot_analysis.weaknesses.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
            <div class="swot-section opportunities">
                <h3>Opportunities</h3>
                <ul>
                    ${accountPlan.swot_analysis.opportunities.map(o => `<li>${o}</li>`).join('')}
                </ul>
            </div>
            <div class="swot-section threats">
                <h3>Threats</h3>
                <ul>
                    ${accountPlan.swot_analysis.threats.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>

    ${accountPlan.mermaid_diagram ? `
    <div class="section">
        <h2>Company Structure Diagram</h2>
        <div class="diagram">
            <pre>${accountPlan.mermaid_diagram}</pre>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>Summary</h2>
        <p>${accountPlan.final_summary}</p>
    </div>

    ${options.includeNotes && accountPlan.notes && accountPlan.notes.length > 0 ? `
    <div class="section">
        <h2>Research Notes</h2>
        <ul>
            ${accountPlan.notes.map(note => `<li>${note}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
</body>
</html>
    `;

    return html;
  }

  private static escapeCsv(str: string): string {
    return str.replace(/"/g, '""').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }

  private static downloadFile(dataUri: string, fileName: string, mimeType: string): void {
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.setAttribute('type', mimeType);
    linkElement.style.display = 'none';

    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }

  // Utility method to check if export is available
  static isExportAvailable(): boolean {
    return typeof document !== 'undefined' && typeof Blob !== 'undefined';
  }

  // Get supported formats
  static getSupportedFormats(): ExportFormat[] {
    return ['json', 'csv', 'pdf', 'markdown'];
  }
}