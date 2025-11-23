'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Send, MessageCircle, X, CheckCircle, AlertCircle,
  Sparkles, Brain, Zap, Lightbulb, TrendingUp, Target,
  Bot, User, ChevronRight, ThumbsUp, ThumbsDown, MoreHorizontal
} from 'lucide-react';
import { voiceRecognition, VoiceCallbacks } from '@/lib/voiceRecognition';
import { VoiceStatus } from '@/types/accountPlan';
import { researchAgent, ResearchProgress, ResearchCallbacks, ResearchFocus } from '@/lib/researchAgent';
import { tavilyClient } from '@/lib/tavilyClient';
import { ChatMessage, ResearchSession } from '@/types/accountPlan';
import { AIConversationalEngine } from './AIConversationalEngine';

interface ChatInterfaceProps {
  onResearchComplete?: (session: ResearchSession) => void;
  currentSession?: ResearchSession | null;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onResearchComplete,
  currentSession,
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiEngineRef = useRef(new AIConversationalEngine());

  // Initialize voice status and welcome message
  useEffect(() => {
    const status = voiceRecognition.getStatus();
    setVoiceStatus(status);

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: `msg_welcome_${Date.now()}`,
      type: 'assistant',
      content: `🎯 Hello! I'm your AI Research Assistant, and I'm absolutely thrilled to help you explore companies and create comprehensive account plans!

I can help you with:
• Deep company research and analysis
• SWOT assessments and competitive intelligence
• Market positioning and business model analysis
• Leadership and team evaluations
• Interactive editing and data refinement

Just tell me about any company you're curious about, and I'll dive deep into gathering intelligence from multiple sources. Ready to begin our research journey? ✨`,
      timestamp: new Date(),
      isVoice: false
    };
    setMessages([welcomeMessage]);

    // Generate initial suggestions
    setSuggestions([
      "Tell me about Apple",
      "Research Tesla Inc",
      "Analyze Microsoft Corporation",
      "Explore Amazon's business model"
    ]);
  }, []);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when not researching
  useEffect(() => {
    if (!isResearching && !aiThinking && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isResearching, aiThinking]);

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
        addTypingIndicator();
      },
      onResult: (text: string) => {
        setInputText(text);
        setIsListening(false);
        setVoiceStatus(prev => ({ ...prev, isListening: false }));
        removeTypingIndicator();
        // Auto-submit after voice input
        setTimeout(() => handleConversationSubmit(), 500);
      },
      onEnd: () => {
        setIsListening(false);
        setVoiceStatus(prev => ({ ...prev, isListening: false }));
        removeTypingIndicator();
      },
      onError: (error: string) => {
        setIsListening(false);
        setVoiceStatus(prev => ({ ...prev, isListening: false, error }));
        addMessage('system', `Voice error: ${error}`);
      }
    };

    voiceRecognition.startListening(voiceCallbacks);
  };

  const addTypingIndicator = () => {
    const typingMessage: ChatMessage = {
      id: `msg_typing_${Date.now()}`,
      type: 'system',
      content: '🎙️ Listening...',
      timestamp: new Date(),
      isVoice: true
    };
    setMessages(prev => [...prev, typingMessage]);
  };

  const removeTypingIndicator = () => {
    setMessages(prev => prev.filter(msg => !msg.id.includes('typing')));
  };

  const speakResponse = async (text: string) => {
    if (!voiceStatus.isSupported || !text) return;

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
    aiEngineRef.current.addMessage(message);
  };

  const handleConversationSubmit = async () => {
    const userInput = inputText.trim();
    if (!userInput) return;

    // Add user message
    addMessage('user', userInput, isListening);
    setInputText('');
    setShowSuggestions(false);

    // Get AI response
    setAiThinking(true);
    addMessage('system', '🤔 Thinking...');

    setTimeout(() => {
      const aiResponse = aiEngineRef.current.generateResponse(userInput, currentSession);

      // Remove thinking message
      setMessages(prev => prev.filter(msg => !msg.content.includes('Thinking...')));

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        type: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        isVoice: false
      };

      setMessages(prev => [...prev, aiMessage]);
      setSuggestions(aiResponse.suggestions);
      setFollowUpQuestions(aiResponse.followUpQuestions);

      // Auto-speak if user used voice
      if (isListening && voiceStatus.isSupported) {
        setTimeout(() => {
          speakResponse(aiResponse.response);
        }, 1000);
      }

      setAiThinking(false);

      // Start research if needed
      if (aiResponse.shouldContinueResearch) {
        const company = aiEngineRef.current.getConversationState().currentCompany;
        const focusArea = aiResponse.focusArea as ResearchFocus;
        const researchDepth = aiResponse.researchDepth;

        if (researchDepth === 'deeper' && currentSession && currentSession.status === 'complete') {
          // Continue research on existing session
          startDeeperResearchForCompany(currentSession, focusArea);
        } else {
          // Start new research
          startResearchForCompany(company);
        }
      }
    }, 1500);
  };

  const startResearchForCompany = async (companyName: string) => {
    setIsResearching(true);
    addMessage('system', `🚀 Starting comprehensive research for ${companyName}...`);

    const researchCallbacks: ResearchCallbacks = {
      onProgress: (progress: ResearchProgress) => {
        setResearchProgress(progress);
        // Update progress message instead of adding new ones
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.content.includes('Research progress:'));
          const progressMessage: ChatMessage = {
            id: `msg_progress_${Date.now()}`,
            type: 'system',
            content: `📊 Research progress: ${progress.step} (${progress.progress}%)`,
            timestamp: new Date(),
            isVoice: false
          };
          return [...filtered, progressMessage];
        });
      },
      onComplete: (session) => {
        setIsResearching(false);
        setResearchProgress(null);

        const completionMessage: ChatMessage = {
          id: `msg_complete_${Date.now()}`,
          type: 'assistant',
          content: `🎉 Research completed! I've gathered comprehensive data about ${companyName}. The account plan includes:

📈 Company Overview & Business Model
👥 Leadership Team Analysis
🏆 Competitive Landscape
💡 SWOT Assessment
📊 Market Positioning
📋 Structured Account Plan

Would you like me to dig deeper into any specific area, or would you prefer to explore the results?`,
          timestamp: new Date(),
          isVoice: false
        };

        setMessages(prev => [...prev, completionMessage]);

        // Update AI engine state
        aiEngineRef.current.updateConversationState({
          context: 'completed',
          lastResearchTime: Date.now()
        });

        // Update suggestions for post-research
        setSuggestions([
          "Dig deeper into leadership team",
          "Analyze competitors in detail",
          "Review SWOT findings",
          "Export account plan",
          "Edit specific sections"
        ]);

        // Speak completion if voice was used
        if (isListening && voiceStatus.isSupported) {
          setTimeout(() => {
            speakResponse(`Research completed for ${companyName}. The comprehensive account plan is ready for your review.`);
          }, 1000);
        }

        onResearchComplete?.(session);
      },
      onError: (error: string) => {
        setIsResearching(false);
        setResearchProgress(null);

        const errorMessage: ChatMessage = {
          id: `msg_error_${Date.now()}`,
          type: 'assistant',
          content: `❌ I encountered an issue during research: ${error}.

Let me try a different approach or would you like me to research another company? I'm here to help troubleshoot and get you the information you need!`,
          timestamp: new Date(),
          isVoice: false
        };

        setMessages(prev => [...prev, errorMessage]);

        if (isListening && voiceStatus.isSupported) {
          setTimeout(() => {
            speakResponse(`Research encountered an error. Let me help you with an alternative approach.`);
          }, 1000);
        }
      }
    };

    try {
      await researchAgent.startResearch(companyName, researchCallbacks);
    } catch (error) {
      console.error('Research error:', error);
      setMessages(prev => [...prev, {
        id: `msg_error_${Date.now()}`,
        type: 'system',
        content: `Research error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isVoice: false
      }]);
      setIsResearching(false);
      setAiThinking(false);
    }
  };

  const startDeeperResearchForCompany = async (existingSession: ResearchSession, focusArea: ResearchFocus) => {
    setIsResearching(true);
    addMessage('system', `🔍 Starting deeper research for ${existingSession.companyName} - Focus: ${focusArea}...`);

    const researchCallbacks: ResearchCallbacks = {
      onProgress: (progress: ResearchProgress) => {
        setResearchProgress(progress);
        // Update progress message instead of adding new ones
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.content.includes('Deeper research progress:'));
          const progressMessage: ChatMessage = {
            id: `msg_deep_progress_${Date.now()}`,
            type: 'system',
            content: `🔍 Deeper research progress: ${progress.step} (${progress.progress}%)`,
            timestamp: new Date(),
            isVoice: false
          };
          return [...filtered, progressMessage];
        });
      },
      onComplete: (session) => {
        setIsResearching(false);
        setResearchProgress(null);

        const completionMessage: ChatMessage = {
          id: `msg_deep_complete_${Date.now()}`,
          type: 'assistant',
          content: `🎯 Deeper research completed! I've enhanced the analysis of ${existingSession.companyName} with additional insights on **${focusArea}**.

**Enhanced Account Plan Includes:**
📊 Expanded ${focusArea} analysis
🔍 Additional data sources and insights
📈 Updated competitive intelligence
💡 Enhanced strategic recommendations
🎯 Deeper market position assessment

The account plan has been significantly enriched with comprehensive ${focusArea} intelligence. Would you like to:
• Explore another area in depth?
• Review the enhanced findings?
• Export the comprehensive analysis?`,
          timestamp: new Date(),
          isVoice: false
        };

        setMessages(prev => [...prev, completionMessage]);

        // Update AI engine state
        aiEngineRef.current.updateConversationState({
          context: 'completed',
          lastResearchTime: Date.now()
        });

        // Update suggestions for post-deeper-research
        setSuggestions([
          "Dig deeper into leadership team",
          "Analyze competitors in detail",
          "Review financial performance",
          "Explore market positioning",
          "Assess product innovations",
          "Export enhanced account plan",
          "Review SWOT findings"
        ]);

        // Speak completion if voice was used
        if (isListening && voiceStatus.isSupported) {
          setTimeout(() => {
            speakResponse(`Deeper research completed for ${existingSession.companyName}. The enhanced account plan with additional ${focusArea} insights is ready for your review.`);
          }, 1000);
        }

        onResearchComplete?.(session);
      },
      onError: (error: string) => {
        setIsResearching(false);
        setResearchProgress(null);

        const errorMessage: ChatMessage = {
          id: `msg_deep_error_${Date.now()}`,
          type: 'assistant',
          content: `❌ I encountered an issue during deeper research: ${error}.

Let me try a different approach or would you like me to focus on a different area? I'm here to help you get the comprehensive insights you need!`,
          timestamp: new Date(),
          isVoice: false
        };

        setMessages(prev => [...prev, errorMessage]);

        if (isListening && voiceStatus.isSupported) {
          setTimeout(() => {
            speakResponse(`Deeper research encountered an error. Let me help you with an alternative approach.`);
          }, 1000);
        }
      }
    };

    try {
      await researchAgent.continueResearch(existingSession, focusArea, researchCallbacks);
    } catch (error) {
      console.error('Deeper research error:', error);
      setMessages(prev => [...prev, {
        id: `msg_deep_error_${Date.now()}`,
        type: 'system',
        content: `Deeper research error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isVoice: false
      }]);
      setIsResearching(false);
      setAiThinking(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFollowUpQuestion = (question: string) => {
    setInputText(question);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConversationSubmit();
    }
  };

  const handleRequestMicrophonePermission = async () => {
    const granted = await voiceRecognition.requestMicrophonePermission();
    if (granted) {
      setShowVoicePermission(false);
      const status = voiceRecognition.getStatus();
      setVoiceStatus(status);
      addMessage('assistant', '🎤 Microphone permission granted! You can now use voice input. Just click the microphone button and speak naturally.');
    } else {
      addMessage('assistant', 'No worries! You can still use text input, and I'll be just as helpful. The conversation continues!');
    }
  };

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'user': return <User className="w-4 h-4" />;
      case 'assistant': return <Bot className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-gray-900 to-black text-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 relative overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 animate-pulse"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Research Assistant</h2>
              <p className="text-xs text-white/80">Conversational Business Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Current research indicator */}
            {currentSession?.status === 'complete' && (
              <div className="flex items-center gap-1 text-xs bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                {currentSession.companyName} Ready
              </div>
            )}

            {/* Demo mode indicator */}
            {tavilyClient.isDemoMode() && (
              <div className="flex items-center gap-1 text-xs bg-yellow-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                <AlertCircle className="w-3 h-3" />
                DEMO MODE
              </div>
            )}

            {/* Voice status */}
            {voiceStatus.isSupported && (
              <div className="flex items-center gap-2 text-sm backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${voiceStatus.isSupported ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                <span className="text-white/80">Voice {voiceStatus.isSupported ? 'Ready' : 'Unavailable'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div className={`max-w-[85%] group relative ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              {/* Message bubble */}
              <div
                className={`p-4 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : message.type === 'system'
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 border border-gray-700'
                    : 'bg-gradient-to-r from-gray-800/90 to-gray-900/90 text-white border border-gray-700 shadow-lg'
                } backdrop-blur-sm`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-white/20' : 'bg-purple-500/20'
                  }`}>
                    {getMessageIcon(message.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {/* Voice indicator */}
                    {message.isVoice && (
                      <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                        <Mic className="w-3 h-3" />
                        <span>Voice input</span>
                      </div>
                    )}
                  </div>

                  {/* Voice controls */}
                  {message.type === 'assistant' && voiceStatus.isSupported && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isSpeaking ? (
                        <button
                          onClick={() => speakResponse(message.content)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                          title="Speak response"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={stopSpeaking}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                          title="Stop speaking"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Research Progress */}
        {isResearching && researchProgress && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-2xl p-4 backdrop-blur-sm animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-10 h-10 border-2 border-purple-400 border-b-transparent rounded-full animate-spin animation-delay-75"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-2">{researchProgress.step}</p>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${researchProgress.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {researchProgress.progress}%
              </div>
            </div>
          </div>
        )}

        {/* AI Thinking */}
        {aiThinking && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-purple-400 animate-pulse">
              <Brain className="w-5 h-5" />
              <span className="text-sm">AI is thinking...</span>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && !isResearching && !aiThinking && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Try these suggestions:</span>
            </div>
            <div className="grid gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 transform hover:scale-[1.02] border border-white/10 text-sm text-white/90 hover:text-white"
                >
                  <div className="flex items-center justify-between">
                    <span>{suggestion}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && !isResearching && !aiThinking && currentSession?.status === 'complete' && (
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">Next steps:</span>
            </div>
            <div className="grid gap-2">
              {followUpQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleFollowUpQuestion(question)}
                  className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 transform hover:scale-[1.02] border border-white/10 text-sm text-white/90 hover:text-white"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gradient-to-t from-black to-gray-900">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isResearching
                  ? "Research in progress..."
                  : aiThinking
                  ? "AI is thinking..."
                  : "Ask me about any company or business topic..."
              }
              disabled={isResearching || aiThinking || isListening}
              className="w-full p-4 pr-14 bg-gray-800/50 border border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
              rows={1}
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />

            {/* Voice button */}
            {voiceStatus.isSupported && (
              <button
                onClick={handleVoiceInput}
                disabled={isResearching || aiThinking}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all duration-200 ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25'
                    : voiceStatus.error
                    ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/25 hover:scale-105'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleConversationSubmit}
            disabled={!inputText.trim() || isResearching || aiThinking}
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/25 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {aiThinking ? '...' : 'Send'}
          </button>
        </div>

        {/* Status indicators */}
        <div className="flex justify-between items-center mt-3 text-xs">
          <div className="flex gap-4">
            {isListening && (
              <div className="flex items-center gap-1 text-red-400 animate-pulse">
                <Mic className="w-3 h-3" />
                <span>Listening... Speak clearly</span>
              </div>
            )}

            {isSpeaking && (
              <div className="flex items-center gap-1 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Speaking...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>AI-Powered Research</span>
          </div>
        </div>
      </div>

      {/* Voice Permission Modal */}
      {showVoicePermission && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-purple-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Mic className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Enable Voice Input</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Enable voice input to have natural conversations with your AI assistant. I'll listen to your questions and respond with insights about companies and business intelligence.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRequestMicrophonePermission}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Enable Voice
              </button>
              <button
                onClick={() => setShowVoicePermission(false)}
                className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                Text Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};