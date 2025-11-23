'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Download, FileText, Eye, EyeOff, BarChart3, Users, Target, Lightbulb, TrendingUp } from 'lucide-react';
import { AccountPlan, ResearchSession } from '@/types/accountPlan';
import { AccountPlanSchema } from '@/types/accountPlan';

interface AccountPlanDisplayProps {
  researchSession: ResearchSession;
  onPlanUpdate?: (plan: AccountPlan) => void;
  className?: string;
}

export const AccountPlanDisplay: React.FC<AccountPlanDisplayProps> = ({
  researchSession,
  onPlanUpdate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [plan, setPlan] = useState<AccountPlan | null>(null);

  useEffect(() => {
    if (researchSession.accountPlan) {
      setPlan(researchSession.accountPlan);
    }
  }, [researchSession]);

  if (!plan) {
    return (
      <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
        <div className="p-8 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Plan Yet</h3>
          <p className="text-gray-600">Start a company research to generate an account plan.</p>
        </div>
      </div>
    );
  }

  const handleEdit = (field: string, currentValue: string | string[]) => {
    setEditingField(field);
    setEditValue(typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2));
  };

  const handleSave = () => {
    if (!editingField || !plan) return;

    let newValue: any = editValue;

    // Parse JSON if it looks like an array or object
    if (editValue.trim().startsWith('[') || editValue.trim().startsWith('{')) {
      try {
        newValue = JSON.parse(editValue);
      } catch (e) {
        console.error('Invalid JSON:', e);
        return;
      }
    }

    const updatedPlan = { ...plan, [editingField]: newValue };

    // Validate the updated plan
    const validation = AccountPlanSchema.safeParse(updatedPlan);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      alert('Invalid data: ' + validation.error.issues[0]?.message);
      return;
    }

    setPlan(updatedPlan);
    onPlanUpdate?.(updatedPlan);
    setEditingField(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const downloadJson = () => {
    const dataStr = JSON.stringify(plan, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${researchSession.companyName.replace(/\s+/g, '_')}_account_plan.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderEditableField = (field: string, value: string | string[], type: 'text' | 'json' = 'text') => {
    const isEditing = editingField === field;

    if (isEditing) {
      return (
        <div className="space-y-2">
          {type === 'text' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          ) : (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              rows={8}
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="group relative">
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEdit(field, value)}
            className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            title="Edit field"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
        {type === 'text' ? (
          <p className="text-gray-700 whitespace-pre-wrap pr-8">
            {value || <span className="text-gray-400 italic">Not specified</span>}
          </p>
        ) : (
          <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded overflow-x-auto pr-8">
            {JSON.stringify(value, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'products', label: 'Products', icon: Target },
    { id: 'leadership', label: 'Leadership', icon: Users },
    { id: 'swot', label: 'SWOT', icon: Lightbulb },
    { id: 'diagram', label: 'Diagram', icon: BarChart3 },
    { id: 'json', label: 'Raw Data', icon: Eye },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Company Overview</h3>
        {renderEditableField('company_overview', plan.company_overview)}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Mission & Vision</h3>
        {renderEditableField('mission_and_vision', plan.mission_and_vision)}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Target Market</h3>
        {renderEditableField('target_market', plan.target_market)}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Business Model</h3>
        {renderEditableField('business_model', plan.business_model)}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Unique Value Proposition</h3>
        {renderEditableField('unique_value_proposition', plan.unique_value_proposition)}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Market Position Summary</h3>
        {renderEditableField('market_position_summary', plan.market_position_summary)}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Final Summary</h3>
        {renderEditableField('final_summary', plan.final_summary)}
      </div>

      {plan.notes && plan.notes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Research Notes</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {plan.notes.map((note, index) => (
              <li key={index} className="text-sm">{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Products & Services</h3>
        <button
          onClick={() => handleEdit('key_products_and_services', plan.key_products_and_services)}
          className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
          title="Edit products"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>

      {plan.key_products_and_services.length === 0 ? (
        <p className="text-gray-400 italic">No products or services identified</p>
      ) : (
        <div className="grid gap-4">
          {plan.key_products_and_services.map((product, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
              {product.features && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Features:</span>
                  <p className="text-sm text-gray-600">{product.features}</p>
                </div>
              )}
              {product.pricing && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Pricing:</span>
                  <p className="text-sm text-gray-600">{product.pricing}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {plan.notable_clients && plan.notable_clients.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Notable Clients</h3>
          <div className="flex flex-wrap gap-2">
            {plan.notable_clients.map((client, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {client}
              </span>
            ))}
          </div>
        </div>
      )}

      {plan.recent_articles && plan.recent_articles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Recent Articles</h3>
          <ul className="space-y-2">
            {plan.recent_articles.map((article, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <TrendingUp className="w-3 h-3 mt-1 text-blue-600 flex-shrink-0" />
                {article}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderLeadership = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Leadership Team</h3>
        <button
          onClick={() => handleEdit('leadership_and_key_people', plan.leadership_and_key_people)}
          className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
          title="Edit leadership"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>

      {plan.leadership_and_key_people.length === 0 ? (
        <p className="text-gray-400 italic">No leadership information available</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plan.leadership_and_key_people.map((leader, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900">{leader.name || 'Unknown Name'}</h4>
              <p className="text-blue-600 text-sm font-medium mb-2">{leader.role || 'Unknown Role'}</p>
              {leader.details && (
                <p className="text-sm text-gray-600 mb-2">{leader.details}</p>
              )}
              {leader.source_urls && leader.source_urls.length > 0 && (
                <div className="text-xs text-gray-500">
                  Sources: {leader.source_urls.slice(0, 2).join(', ')}
                  {leader.source_urls.length > 2 && ` +${leader.source_urls.length - 2} more`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Competitors</h3>
        <div className="flex flex-wrap gap-2">
          {plan.competitors.length === 0 ? (
            <p className="text-gray-400 italic">No competitors identified</p>
          ) : (
            plan.competitors.map((competitor, index) => (
              <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {competitor}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSWOT = () => {
    const { strengths, weaknesses, opportunities, threats } = plan.swot_analysis;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Strengths
          </h4>
          <ul className="space-y-2">
            {strengths.length === 0 ? (
              <li className="text-gray-400 italic text-sm">No strengths identified</li>
            ) : (
              strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                  <span className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                  {strength}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 rotate-180" />
            Weaknesses
          </h4>
          <ul className="space-y-2">
            {weaknesses.length === 0 ? (
              <li className="text-gray-400 italic text-sm">No weaknesses identified</li>
            ) : (
              weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                  <span className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                  {weakness}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Opportunities
          </h4>
          <ul className="space-y-2">
            {opportunities.length === 0 ? (
              <li className="text-gray-400 italic text-sm">No opportunities identified</li>
            ) : (
              opportunities.map((opportunity, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  {opportunity}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Threats
          </h4>
          <ul className="space-y-2">
            {threats.length === 0 ? (
              <li className="text-gray-400 italic text-sm">No threats identified</li>
            ) : (
              threats.map((threat, index) => (
                <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                  <span className="w-1 h-1 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  {threat}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderDiagram = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Company Structure Diagram</h3>
        <button
          onClick={() => handleEdit('mermaid_diagram', plan.mermaid_diagram)}
          className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
          title="Edit diagram"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>

      {plan.mermaid_diagram ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="bg-gray-50 p-4 rounded text-center">
            <pre className="text-sm text-gray-600 text-left mb-4">{plan.mermaid_diagram}</pre>
            <div className="text-gray-400 text-sm italic">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" />
              Mermaid diagram visualization would be rendered here
              <br />
              <span className="text-xs">In a production environment, this would display the actual diagram</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 italic">No diagram available</p>
      )}
    </div>
  );

  const renderRawJson = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Raw JSON Data</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title={showRawJson ? 'Hide JSON' : 'Show JSON'}
          >
            {showRawJson ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
          <button
            onClick={downloadJson}
            className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            title="Download JSON"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showRawJson && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-700 font-mono">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'products':
        return renderProducts();
      case 'leadership':
        return renderLeadership();
      case 'swot':
        return renderSWOT();
      case 'diagram':
        return renderDiagram();
      case 'json':
        return renderRawJson();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Account Plan</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{researchSession.companyName}</span>
            <span className="text-gray-400">•</span>
            <span>{new Date(researchSession.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
};