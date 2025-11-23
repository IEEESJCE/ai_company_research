'use client';

import React, { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { AccountPlanDisplay } from '@/components/AccountPlanDisplay';
import { ResearchSession, AccountPlan } from '@/types/accountPlan';
import { Sparkles, Brain, Zap, Target, TrendingUp, Users, Award } from 'lucide-react';

export default function Home() {
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleResearchComplete = (session: ResearchSession) => {
    setCurrentSession(session);
  };

  const handlePlanUpdate = (updatedPlan: AccountPlan) => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        accountPlan: updatedPlan,
        updatedAt: new Date(),
      });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing AI Research Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-indigo-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-150"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Left Panel - Enhanced Chat Interface */}
        <div className="w-full md:w-1/2 lg:w-2/5 h-full">
          <ChatInterface
            onResearchComplete={handleResearchComplete}
            className="h-full"
          />
        </div>

        {/* Right Panel - Account Plan Display */}
        <div className="hidden md:block md:w-1/2 lg:w-3/5 h-full">
          {currentSession ? (
            <AccountPlanDisplay
              researchSession={currentSession}
              onPlanUpdate={handlePlanUpdate}
              className="h-full"
            />
          ) : (
            <div className="flex flex-col h-full bg-white/10 backdrop-blur-lg border-l border-white/20">
              <div className="p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white mb-2">Account Plan Dashboard</h2>
                <p className="text-white/80">Start a research session to generate comprehensive account plans</p>
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-2xl mx-auto">
                  {/* Animated logo/icon */}
                  <div className="mb-8 relative">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
                      <Brain className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-2 -left-2">
                      <Zap className="w-6 h-6 text-blue-400 animate-pulse delay-75" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-white mb-4">
                    AI-Powered Research Assistant
                  </h3>
                  <p className="text-white/90 text-lg mb-8 leading-relaxed">
                    Experience the future of company research with our conversational AI that adapts to your unique needs
                  </p>

                  {/* Feature cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300">
                      <Target className="w-8 h-8 text-purple-400 mb-3" />
                      <h4 className="text-white font-semibold mb-2">Precision Research</h4>
                      <p className="text-white/80 text-sm">Multi-source data collection with real-time verification</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300">
                      <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
                      <h4 className="text-white font-semibold mb-2">SWOT Intelligence</h4>
                      <p className="text-white/80 text-sm">Advanced competitive analysis and market insights</p>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300">
                      <Users className="w-8 h-8 text-indigo-400 mb-3" />
                      <h4 className="text-white font-semibold mb-2">Adaptive AI</h4>
                      <p className="text-white/80 text-sm">Learns from your conversation style and preferences</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300">
                      <Award className="w-8 h-8 text-pink-400 mb-3" />
                      <h4 className="text-white font-semibold mb-2">Smart Editing</h4>
                      <p className="text-white/80 text-sm">Intuitive section-wise editing with real-time validation</p>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 shadow-2xl">
                    <p className="text-white font-medium mb-2">Ready to begin?</p>
                    <p className="text-white/90 text-sm mb-4">Enter a company name in the chat interface to start your research journey</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white/80 text-sm">AI Assistant is ready to help</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Mobile overlay for account plan */}
        {currentSession && (
          <div className="md:hidden fixed inset-0 bg-white z-50">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600">
                <h2 className="text-lg font-semibold text-white">Account Plan</h2>
                <button
                  onClick={() => setCurrentSession(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AccountPlanDisplay
                  researchSession={currentSession}
                  onPlanUpdate={handlePlanUpdate}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
