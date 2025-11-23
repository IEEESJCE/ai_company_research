'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit2, Save, X, Download, FileText, Eye, EyeOff, BarChart3, Users, Target, Lightbulb,
  TrendingUp, Zap, Award, Crown, Shield, Rocket, Star, Check, MoreVertical,
  Sparkles, ArrowUp, Copy, Share2, FileDown, Brain
} from 'lucide-react';
import { AccountPlan, ResearchSession } from '@/types/accountPlan';
import { AccountPlanSchema } from '@/types/accountPlan';
import { ExportUtils, ExportFormat } from '@/lib/exportUtils';

interface AccountPlanDisplayProps {
  researchSession: ResearchSession;
  onPlanUpdate?: (plan: AccountPlan) => void;
  className?: string;
}

interface EditingState {
  field: string;
  value: any;
  originalValue: any;
  hasChanges: boolean;
  error?: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

export const AccountPlanDisplay: React.FC<AccountPlanDisplayProps> = ({
  researchSession,
  onPlanUpdate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [editingStates, setEditingStates] = useState<Map<string, EditingState>>(new Map());
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [plan, setPlan] = useState<AccountPlan | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    if (researchSession.accountPlan) {
      setPlan(researchSession.accountPlan);
    }
  }, [researchSession]);

  // Animation classes
  const fadeInClass = 'animate-fadeIn';
  const slideInClass = 'animate-slideIn';
  const pulseClass = 'animate-pulse';

  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: FileText, color: 'from-blue-500 to-purple-600', gradient: 'from-blue-500/20 to-purple-600/20' },
    { id: 'products', label: 'Products', icon: Target, color: 'from-emerald-500 to-teal-600', gradient: 'from-emerald-500/20 to-teal-600/20' },
    { id: 'leadership', label: 'Leadership', icon: Users, color: 'from-violet-500 to-purple-600', gradient: 'from-violet-500/20 to-purple-600/20' },
    { id: 'swot', label: 'SWOT', icon: Lightbulb, color: 'from-orange-500 to-red-500', gradient: 'from-orange-500/20 to-red-500/20' },
    { id: 'diagram', label: 'Diagram', icon: BarChart3, color: 'from-pink-500 to-rose-600', gradient: 'from-pink-500/20 to-rose-600/20' },
    { id: 'export', label: 'Export', icon: Download, color: 'from-green-500 to-emerald-600', gradient: 'from-green-500/20 to-emerald-600/20' }
  ];

  const handleEdit = (field: string) => {
    if (!plan) return;

    const currentValue = plan[field as keyof AccountPlan];
    const editingState: EditingState = {
      field,
      value: currentValue,
      originalValue: currentValue,
      hasChanges: false
    };

    setEditingStates(prev => new Map(prev).set(field, editingState));
  };

  const handleSave = (field: string) => {
    const editingState = editingStates.get(field);
    if (!editingState || !plan) return;

    let newValue = editingState.value;

    // Parse JSON if it looks like an array or object
    if (typeof editingState.value === 'string' &&
        (editingState.value.trim().startsWith('[') || editingState.value.trim().startsWith('{'))) {
      try {
        newValue = JSON.parse(editingState.value);
      } catch (e) {
        console.error('Invalid JSON:', e);
        // Show error feedback
        setEditingStates(prev => new Map(prev).set(field, {
          ...editingState,
          error: 'Invalid JSON format'
        }));
        return;
      }
    }

    const updatedPlan = { ...plan, [field]: newValue };

    // Validate the updated plan
    const validation = AccountPlanSchema.safeParse(updatedPlan);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      // Show validation error
      setEditingStates(prev => new Map(prev).set(field, {
        ...editingState,
        error: validation.error.issues[0]?.message || 'Invalid data format'
      }));
      return;
    }

    setPlan(updatedPlan);
    onPlanUpdate?.(updatedPlan);

    // Remove editing state
    setEditingStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(field);
      return newMap;
    });

    // Show success feedback
    setCopiedSection(`Updated ${field}`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCancel = (field: string) => {
    // Remove editing state
    setEditingStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(field);
      return newMap;
    });
  };

  const handleEditChange = (field: string, value: string) => {
    const editingState = editingStates.get(field);
    if (!editingState) return;

    const hasChanges = JSON.stringify(value) !== JSON.stringify(editingState.originalValue);

    setEditingStates(prev => new Map(prev).set(field, {
      ...editingState,
      value,
      hasChanges
    }));
  };

  const handleExport = (format: ExportFormat) => {
    if (!plan || !researchSession) return;

    try {
      const exportOptions = {
        format,
        includeSources: true,
        includeNotes: true,
        fileName: `${researchSession.companyName.replace(/\s+/g, '_')}_account_plan`
      };

      ExportUtils.exportAccountPlan(plan, researchSession, exportOptions);

      // Show success feedback
      setCopiedSection(`Exported as ${format.toUpperCase()}`);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Export error:', error);
      setCopiedSection('Export failed');
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const copyToClipboard = (text: string, section?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section ? `Copied ${section}` : 'Copied to clipboard');
      setTimeout(() => setCopiedSection(null), 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
      setCopiedSection('Copy failed');
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  const renderEditableField = (field: string, fieldLabel: string, value: any, type: 'text' | 'json' = 'text',
    placeholder?: string, icon?: React.ElementType, showIcon: boolean = true) => {
    const editingState = editingStates.get(field);
    const isEditing = editingState !== undefined;

    return (
      <div className={`group relative ${fadeInClass}`}>
        {/* Edit button */}
        {!isEditing && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => handleEdit(field)}
              className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-110 shadow-lg shadow-purple-500/25"
              title={`Edit ${fieldLabel}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${
          isEditing
            ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300 shadow-xl scale-[1.02]'
            : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {showIcon && icon && (
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                  {React.createElement(icon, { className: 'w-5 h-5 text-white' })}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">{fieldLabel}</h4>
                {!isEditing && (
                  <p className="text-xs text-gray-500">Click to edit</p>
                )}
              </div>
            </div>

            {/* Edit mode indicators */}
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(field)}
                  disabled={!editingState.hasChanges}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    editingState.hasChanges
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transform hover:scale-105'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingState.hasChanges ? (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Saved
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCancel(field)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-4">
              {type === 'text' ? (
                <textarea
                  value={editingState.value}
                  onChange={(e) => handleEditChange(field, e.target.value)}
                  placeholder={placeholder || `Enter ${fieldLabel}...`}
                  className="w-full p-4 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-white/80 backdrop-blur-sm"
                  rows={6}
                  style={{ minHeight: '120px' }}
                />
              ) : (
                <textarea
                  value={editingState.value}
                  onChange={(e) => handleEditChange(field, e.target.value)}
                  placeholder={`Enter ${fieldLabel} as JSON...`}
                  className="w-full p-4 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none bg-white/80 backdrop-blur-sm"
                  rows={8}
                />
              )}

              {/* Error display */}
              {editingState.error && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700 font-medium">
                      {editingState.error}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              {/* Value display */}
              {type === 'text' && typeof value === 'string' ? (
                <div className="text-gray-700 whitespace-pre-wrap pr-12">
                  {value || (
                    <span className="text-gray-400 italic">{placeholder || `No ${fieldLabel} specified`}</span>
                  )}
                </div>
              ) : (
                <div className="bg-gray-900/10 p-4 rounded-xl overflow-x-auto pr-12">
                  <pre className="text-sm text-gray-700 font-mono">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              )}

              {/* Quick copy button */}
              {!isEditing && (
                <button
                  onClick={() => copyToClipboard(
                    typeof value === 'string' ? value : JSON.stringify(value, null, 2),
                    fieldLabel
                  )}
                  className="absolute top-2 right-2 p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                  title={`Copy ${fieldLabel}`}
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Success indicator */}
        {copiedSection && copiedSection.includes(fieldLabel) && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-full shadow-lg shadow-green-500/25 animate-bounce">
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              {copiedSection}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => {
    if (!plan) return null;

    return (
      <div className="space-y-6">
        {renderEditableField('company_overview', 'Company Overview', plan.company_overview, 'text',
          'Enter comprehensive company overview...', FileText, true)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderEditableField('mission_and_vision', 'Mission & Vision', plan.mission_and_vision, 'text',
          'Enter company mission and vision...', Target, true)}

        {renderEditableField('target_market', 'Target Market', plan.target_market, 'text',
          'Describe the target market and customer segments...', Users, true)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderEditableField('business_model', 'Business Model', plan.business_model, 'text',
          'How does this company make money?', TrendingUp, true)}

        {renderEditableField('unique_value_proposition', 'Value Proposition', plan.unique_value_proposition, 'text',
          'What makes this company unique?', Zap, true)}
      </div>

      {renderEditableField('market_position_summary', 'Market Position', plan.market_position_summary, 'text',
        'How does this company position itself in the market?', Award, true)}
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Products & Services</h3>
            <p className="text-sm text-gray-600">Innovative offerings and capabilities</p>
          </div>
        </div>

        <button
          onClick={() => handleEdit('key_products_and_services')}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-medium shadow-lg shadow-emerald-500/25"
        >
          <Edit2 className="w-4 h-4" />
          Edit Products
        </button>
      </div>

      {plan.key_products_and_services.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h4>
          <p className="text-gray-500">Research products and services to populate this section</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plan.key_products_and_services.map((product, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {/* Product header */}
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-bold text-gray-900 text-lg">{product.name}</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyToClipboard(
                      `${product.name}: ${product.features || ''} ${product.pricing || ''}`,
                      `${product.name} details`
                    )}
                    className="p-2 bg-white/80 hover:bg-white text-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Copy product details"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Product details */}
              {product.features && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Features</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.features}</p>
                </div>
              )}

              {product.pricing && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Pricing</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.pricing}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notable Clients */}
      {plan.notable_clients && plan.notable_clients.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Notable Clients</h3>
              <p className="text-sm text-gray-600">Trusted partners and customers</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {plan.notable_clients.map((client, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-300/30 text-blue-700 rounded-full text-sm font-medium hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-200 transform hover:scale-105"
              >
                {client}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Articles */}
      {plan.recent_articles && plan.recent_articles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Articles</h3>
              <p className="text-sm text-gray-600">Latest news and insights</p>
            </div>
          </div>

          <div className="space-y-3">
            {plan.recent_articles.map((article, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:shadow-xl transition-all duration-300"
              >
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed">{article}</p>
                  <button
                    onClick={() => copyToClipboard(article, `Article ${index + 1}`)}
                    className="text-xs text-purple-600 hover:text-purple-800 transition-colors mt-2"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLeadership = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Leadership Team</h3>
            <p className="text-sm text-gray-600">Key executives and decision makers</p>
          </div>
        </div>

        <button
          onClick={() => handleEdit('leadership_and_key_people')}
          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-medium shadow-lg shadow-violet-500/25"
        >
          <Edit2 className="w-4 h-4" />
          Edit Leadership
        </button>
      </div>

      {plan.leadership_and_key_people.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Leadership Data</h4>
          <p className="text-gray-500">Research team information to populate this section</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plan.leadership_and_key_people.map((leader, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {/* Leader avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {leader.name ? leader.name.charAt(0) : 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{leader.name || 'Unknown Name'}</h4>
                  <p className="text-violet-600 text-sm font-medium">{leader.role || 'Unknown Role'}</p>
                </div>
              </div>

              {/* Leader details */}
              {leader.details && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{leader.details}</p>
                </div>
              )}

              {/* Sources */}
              {leader.source_urls && leader.source_urls.length > 0 && (
                <div className="text-xs text-gray-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3 h-3" />
                    <span>Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {leader.source_urls.slice(0, 2).map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline truncate"
                        title={url}
                      >
                        Source {idx + 1}
                      </a>
                    ))}
                    {leader.source_urls.length > 2 && (
                      <span className="text-gray-400">
                        +{leader.source_urls.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => copyToClipboard(
                    `${leader.name || 'Unknown'}: ${leader.role || 'Unknown'} - ${leader.details || ''}`,
                    'Leadership info'
                  )}
                  className="px-3 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-lg transition-colors text-xs"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    if (leader.source_urls && leader.source_urls.length > 0) {
                      window.open(leader.source_urls[0], '_blank');
                    }
                  }}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg transition-colors text-xs"
                >
                  Source
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Competitors */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl shadow-lg shadow-red-500/25">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Competitive Landscape</h3>
            <p className="text-sm text-gray-600">Key market competitors</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {plan.competitors.length === 0 ? (
            <p className="text-gray-400 italic text-center py-8">
              No competitors identified yet
            </p>
          ) : (
            plan.competitors.map((competitor, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-300/30 text-red-700 rounded-full text-sm font-medium hover:from-red-500/30 hover:to-orange-500/30 transition-all duration-200 transform hover:scale-105"
              >
                {competitor}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSWOT = () => {
    if (!plan || !plan.swot_analysis) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No SWOT Analysis</h4>
          <p className="text-gray-500">Complete research to generate SWOT analysis</p>
        </div>
      );
    }

    const { strengths, weaknesses, opportunities, threats } = plan.swot_analysis;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg shadow-green-500/25 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-green-900">Strengths</h4>
          </div>
          <ul className="space-y-3">
            {strengths.length === 0 ? (
              <li className="text-gray-400 italic text-sm">No strengths identified</li>
            ) : (
              strengths.map((strength, index) => (
                <li key={index} className="text-green-800 flex items-start gap-3 animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-green-700">{strength}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 shadow-lg shadow-red-500/25 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-red-900">Weaknesses</h4>
          </div>
          <ul className="space-y-3">
            {weaknesses.length === 0 ? (
              <li className="text-gray-400 italic text-sm">No weaknesses identified</li>
            ) : (
              weaknesses.map((weakness, index) => (
                <li key={index} className="text-red-800 flex items-start gap-3 animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <span className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-red-700">{weakness}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-blue-900">Opportunities</h4>
          </div>
          <ul className="space-y-3">
            {opportunities.length === 0 ? (
              <li className="text-gray-400 italic text-sm">No opportunities identified</li>
            ) : (
              opportunities.map((opportunity, index) => (
                <li key={index} className="text-blue-800 flex items-start gap-3 animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-blue-700">{opportunity}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-purple-900">Threats</h4>
          </div>
          <ul className="space-y-3">
            {threats.length === 0 ? (
              <li className="text-gray-400 italic text-sm">No threats identified</li>
            ) : (
              threats.map((threat, index) => (
                <li key={index} className="text-purple-800 flex items-start gap-3 animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-purple-700">{threat}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderDiagram = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-lg shadow-pink-500/25">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Company Structure</h3>
            <p className="text-sm text-gray-600">Visual organization and relationships</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diagram Display */}
          {plan.mermaid_diagram ? (
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6 rounded-xl">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <p className="text-white/90 text-sm">Interactive diagram would render here</p>
                </div>

                <pre className="text-sm text-green-400 font-mono text-center bg-black/50 p-4 rounded-lg overflow-x-auto max-h-64">
                  {plan.mermaid_diagram}
                </pre>
              </div>

              {/* Diagram Controls */}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => copyToClipboard(plan.mermaid_diagram, 'Mermaid diagram')}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => handleEdit('mermaid_diagram')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">No Diagram Yet</h4>
              <p className="text-gray-600">Diagram will be generated once research is complete</p>
            </div>
          )}

          {/* Diagram Description */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
            <h4 className="text-gray-900 font-medium mb-2">About Diagrams</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Interactive visualizations show company structure</p>
              <p>• Demonstrates relationships between products, markets, and teams</p>
              <p>• Helpful for understanding organizational hierarchy</p>
              <p> • Updates automatically as research evolves</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExport = () => (
    <div className="space-y-6">
      <div className="flex justify-center items-center mb-6">
        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/25">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Export Options</h3>
          <p className="text-sm text-gray-600">Save your account plan in multiple formats</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['json', 'csv', 'pdf', 'markdown'] as ExportFormat).map((format) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            className={`p-6 bg-gradient-to-r ${tabs.find(t => t.id === format)?.color || 'from-gray-500'} to-gray-600} text-white rounded-2xl hover:from-700 transition-all duration-200 transform hover:scale-105 flex flex-col items-center justify-center gap-3 shadow-lg`}
            disabled={!plan}
          >
            <div className={`p-3 bg-white/20 rounded-xl mb-2`}>
              {format === 'json' && <FileText className="w-6 h-6" />}
              {format === 'csv' && <BarChart3 className="w-6 h-6" />}
              {format === 'pdf' && <FileText className="w-6 h-6" />}
              {format === 'markdown' && <FileText className="w-6 h-6" />}
            </div>
            <span className="text-sm font-medium capitalize">{format}</span>
          </button>
        ))}
      </div>

      {/* Recent exports */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-bold text-gray-900">Quick Export</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleExport('json')}
            className="p-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 text-sm"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">JSON</span>
            </div>
            <p className="text-xs text-gray-500">Complete data with metadata</p>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="p-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 text-sm"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium">CSV</span>
            </div>
            <p className="text-xs text-gray-500">Spreadsheet compatible</p>
          </button>

          <button
            onClick={() => {
              // Simple PDF generation
              const printContent = document.createElement('div');
              printContent.innerHTML = `
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  h1 { color: #1f2937b; }
                  .company-name { font-size: 24px; color: #333; margin-bottom: 10px; }
                  .section { margin: 20px 0; }
                  .product { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
                </style>
                <body>
                  <h1 class="company-name">${plan?.company_overview || 'Company'}</h1>
                  <div class="section">
                    <h2>Products & Services</h2>
                    ${plan?.key_products_and_services.map(p =>
                      `<div class="product">
                        <strong>${p.name}</strong>
                        ${p.features ? `<p>Features: ${p.features}</p>` : ''}
                        ${p.pricing ? `<p>Pricing: ${p.pricing}</p>` : ''}
                      </div>`
                    ).join('')}
                  </div>
                  <div class="section">
                    <h2>Leadership</h2>
                    ${plan?.leadership_and_key_people.map(l =>
                      <div class="leader">
                        <strong>${l.name || 'Unknown'}</strong>
                        <em>${l.role || 'Unknown'}</em>
                      </div>
                    ).join('')}
                  </div>
                </body>
              `;

              const printWindow = window.open('', '_blank');
              printWindow.document.write(printContent);
              printWindow.document.close();
            }}
            className="p-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 text-sm"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">PDF</span>
            </div>
            <p className="text-xs text-gray-500">Print-ready document</p>
          </button>

          <button
            onClick={() => handleExport('markdown')}
            className="p-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 text-sm"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-medium">Markdown</span>
            </div>
            <p className="text-xs text-gray-500">Documentation format</p>
          </button>
        </div>
      </div>
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
      case 'export':
        return renderExport();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl shadow-purple-500/25">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Account Plan</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{researchSession.companyName}</span>
                <span className="text-gray-400">•</span>
                <span>{new Date(researchSession.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-green-500/25"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>

            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className={`px-4 py-2 ${
                showRawJson
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } rounded-xl transition-colors flex items-center gap-2`}
            >
              {showRawJson ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {showRawJson ? 'Hide Raw' : 'Show Raw'}
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-xl scale-105`
                    : 'text-gray-600 hover:bg-gray-100'
                } ${fadeInClass}`}
              >
                <Icon className="w-5 h-5" />
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

export default AccountPlanDisplay;