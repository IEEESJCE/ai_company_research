'use client';

import React, { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { AccountPlanDisplay } from '@/components/AccountPlanDisplay';
import { ResearchSession, AccountPlan } from '@/types/accountPlan';

export default function Home() {
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null);

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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - Chat Interface */}
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
          <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Account Plan</h2>
              <p className="text-sm text-gray-600">Start a research to see the account plan here</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Plan Yet</h3>
                <p className="text-gray-600 mb-6">
                  Enter a company name in the chat interface to start researching and generating a comprehensive account plan.
                </p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">🔍 Research</h4>
                    <p className="text-sm text-blue-700">Multi-source company data collection</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">📊 Analysis</h4>
                    <p className="text-sm text-green-700">SWOT and competitive analysis</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">🎙️ Voice Support</h4>
                    <p className="text-sm text-purple-700">Voice input and output capabilities</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2">📤 Export</h4>
                    <p className="text-sm text-orange-700">Multiple export formats available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay for account plan */}
      {currentSession && (
        <div className="md:hidden fixed inset-0 bg-white z-50">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Account Plan</h2>
              <button
                onClick={() => setCurrentSession(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
}
