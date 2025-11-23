'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, MessageCircle, X, CheckCircle, AlertCircle } from 'lucide-react';
import { voiceRecognition, VoiceCallbacks } from '@/lib/voiceRecognition';
import { VoiceStatus } from '@/types/accountPlan';
import { researchAgent, ResearchProgress, ResearchCallbacks } from '@/lib/researchAgent';
import { tavilyClient } from '@/lib/tavilyClient';
import { ChatMessage } from '@/types/accountPlan';

interface ChatInterfaceProps {
  onResearchComplete?: (session: any) => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onResearchComplete,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState<ResearchProgress | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>({ isSupported: false, isListening: false, isSpeaking: false });
  const [showVoicePermission, setShowVoicePermission] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize voice status
  useEffect(() => {
    const status = voiceRecognition.getStatus();
    setVoiceStatus(status);
  }, []);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when not researching
  useEffect(() => {
    if (!isResearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isResearching]);

  const handleVoiceInput = () => {
    if (!voiceStatus.isSupported) {
      setShowVoicePermission(true);
      return;
    }

    if (isListening) {
      voiceRecognition.stopListening();
      return;
    }

    const voiceCallbacks: VoiceCallbacks = {
      onStart: () => {
        setIsListening(true);
        setVoiceStatus(prev => ({ ...prev, isListening: true }));
        addMessage('system', 'Listening... Speak clearly about the company you want to research.');
      },
      onResult: (text: string) => {
        setInputText(text);
        setIsListening(false);
        setVoiceStatus(prev => ({ ...prev, isListening: false }));
        // Auto-submit after voice input
        setTimeout(() => handleSubmit(), 500);
      },
      onEnd: () => {
        setIsListening(false);
        setVoiceStatus(prev => ({ ...prev, isListening: false }));
      },
      onError: (error: string) => {
        setIsListening(false);
        setVoiceStatus(prev => ({ ...prev, isListening: false, error }));
        addMessage('system', `Voice error: ${error}`);
      }
    };

    voiceRecognition.startListening(voiceCallbacks);
  };

  const speakResponse = async (text: string) => {
    if (!voiceStatus.isSupported) return;

    try {
      setIsSpeaking(true);
      setVoiceStatus(prev => ({ ...prev, isSpeaking: true }));

      await voiceRecognition.speak(text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (error: string) => {
          setIsSpeaking(false);
          console.error('Speech error:', error);
        }
      });
    } catch (error) {
      console.error('Failed to speak:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    voiceRecognition.stopSpeaking();
    setIsSpeaking(false);
    setVoiceStatus(prev => ({ ...prev, isSpeaking: false }));
  };

  const addMessage = (type: ChatMessage['type'], content: string, isVoice: boolean = false) => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      isVoice
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSubmit = async () => {
    const companyName = inputText.trim();
    if (!companyName) return;

    // Add user message
    addMessage('user', companyName, isListening);
    setInputText('');

    // Start research
    setIsResearching(true);
    addMessage('system', `Starting research for ${companyName}...`);

    const researchCallbacks: ResearchCallbacks = {
      onProgress: (progress: ResearchProgress) => {
        setResearchProgress(progress);
        if (progress.message !== researchProgress?.message) {
          addMessage('system', progress.message);
        }
      },
      onComplete: (session) => {
        setIsResearching(false);
        setResearchProgress(null);
        addMessage('assistant', `Research completed for ${companyName}! Account plan has been generated.`);

        // Speak completion message if voice was used for input
        if (voiceStatus.isSupported && isListening) {
          setTimeout(() => {
            speakResponse(`Research completed for ${companyName}. The account plan is ready for review.`);
          }, 1000);
        }

        onResearchComplete?.(session);
      },
      onError: (error: string) => {
        setIsResearching(false);
        setResearchProgress(null);
        addMessage('system', `Research failed: ${error}`);

        if (voiceStatus.isSupported && isListening) {
          setTimeout(() => {
            speakResponse(`Research failed. ${error}`);
          }, 1000);
        }
      }
    };

    try {
      await researchAgent.startResearch(companyName, researchCallbacks);
    } catch (error) {
      console.error('Research error:', error);
      addMessage('system', `Research error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsResearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRequestMicrophonePermission = async () => {
    const granted = await voiceRecognition.requestMicrophonePermission();
    if (granted) {
      setShowVoicePermission(false);
      const status = voiceRecognition.getStatus();
      setVoiceStatus(status);
      addMessage('system', 'Microphone permission granted. You can now use voice input.');
    } else {
      addMessage('system', 'Microphone permission denied. Voice input will not be available.');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Company Research Assistant</h2>
          </div>
          <div className="flex items-center gap-3">
            {tavilyClient.isDemoMode() && (
              <div className="flex items-center gap-1 text-xs bg-yellow-500/20 px-2 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                DEMO MODE
              </div>
            )}
            {voiceStatus.isSupported && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${voiceStatus.isSupported ? 'bg-green-400' : 'bg-red-400'}`} />
                Voice {voiceStatus.isSupported ? 'Ready' : 'Unavailable'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Welcome to Company Research</h3>
            <p className="text-sm mb-4">Enter a company name to start researching and generating an account plan.</p>
            {voiceStatus.isSupported && (
              <p className="text-sm text-blue-600">💬 You can also click the microphone to use voice input!</p>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white ml-auto'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-700 text-sm'
                  : 'bg-gray-800 text-white'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.isVoice && (
                    <div className="flex items-center gap-1 mt-1 opacity-75">
                      <Mic className="w-3 h-3" />
                      <span className="text-xs">Voice input</span>
                    </div>
                  )}
                </div>
                {message.type === 'assistant' && voiceStatus.isSupported && !isSpeaking && (
                  <button
                    onClick={() => speakResponse(message.content)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Speak response"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                )}
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Stop speaking"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Research Progress */}
        {isResearching && researchProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">{researchProgress.step}</p>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${researchProgress.progress}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-blue-700 font-medium">
                {researchProgress.progress}%
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isResearching ? "Research in progress..." : "Enter company name..."}
              disabled={isResearching || isListening}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            {voiceStatus.isSupported && (
              <button
                onClick={handleVoiceInput}
                disabled={isResearching}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : voiceStatus.error
                    ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isResearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Voice Status Indicators */}
        {voiceStatus.error && (
          <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <X className="w-3 h-3" />
            {voiceStatus.error}
          </div>
        )}

        {isListening && (
          <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
            <Mic className="w-3 h-3 animate-pulse" />
            Listening... Speak clearly
          </div>
        )}

        {isSpeaking && (
          <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            Speaking...
          </div>
        )}
      </div>

      {/* Voice Permission Modal */}
      {showVoicePermission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <Mic className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold">Enable Voice Input</h3>
            </div>
            <p className="text-gray-600 mb-6">
              To use voice input, you need to grant microphone permission. This allows the app to listen to your voice commands and convert them to text.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRequestMicrophonePermission}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Grant Permission
              </button>
              <button
                onClick={() => setShowVoicePermission(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Use Text Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};