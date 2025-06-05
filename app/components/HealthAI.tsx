'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Brain, Search, AlertCircle, Lightbulb } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { useToast } from './ui/ToastNotification';

interface HealthMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
  sources?: string[];
  category?: 'nutrition' | 'exercise' | 'wellness' | 'research' | 'general';
}

interface HealthAIProps {
  onClose?: () => void;
}

export default function HealthAI({ onClose }: HealthAIProps) {
  const [messages, setMessages] = useState<HealthMessage[]>([
    {
      id: 'welcome',
      content: "Hello! I'm your AI health assistant. I can help you with:\n\n• Nutrition and diet questions\n• Exercise and fitness advice\n• Wellness and lifestyle tips\n• Interpreting health research\n• General health information\n\nWhat would you like to know about your health today?",
      isUser: false,
      timestamp: Date.now(),
      category: 'general'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError, ToastContainer } = useToast();

  const quickQuestions = [
    "What foods help reduce inflammation?",
    "How much protein do I need daily?", 
    "Best exercises for core strength?",
    "How to improve sleep quality?",
    "Benefits of intermittent fasting?",
    "How to stay motivated for fitness?"
  ];

  useEffect(() => {
    checkApiConfiguration();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkApiConfiguration = async () => {
    try {
      const configured = await geminiService.isConfigured();
      setIsConfigured(configured);
    } catch (error) {
      console.error('Failed to check API configuration:', error);
      setIsConfigured(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const categorizeQuestion = (question: string): HealthMessage['category'] => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('nutrition') || lowerQuestion.includes('diet') || 
        lowerQuestion.includes('food') || lowerQuestion.includes('eating')) {
      return 'nutrition';
    }
    if (lowerQuestion.includes('exercise') || lowerQuestion.includes('workout') || 
        lowerQuestion.includes('fitness') || lowerQuestion.includes('training')) {
      return 'exercise';
    }
    if (lowerQuestion.includes('sleep') || lowerQuestion.includes('stress') || 
        lowerQuestion.includes('meditation') || lowerQuestion.includes('wellness')) {
      return 'wellness';
    }
    if (lowerQuestion.includes('research') || lowerQuestion.includes('study') || 
        lowerQuestion.includes('studies')) {
      return 'research';
    }
    
    return 'general';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    if (!isConfigured) {
      showError('AI not configured', 'Please add your Gemini API key in Settings');
      return;
    }

    const userMessage: HealthMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: Date.now(),
      category: categorizeQuestion(inputMessage)
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateHealthResponse(userMessage.content, userMessage.category);
      
      const assistantMessage: HealthMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        isUser: false,
        timestamp: Date.now(),
        category: userMessage.category,
        sources: aiResponse.sources
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      const errorMessage: HealthMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble accessing health information right now. Please ensure your API key is configured correctly in Settings, or try again later.",
        isUser: false,
        timestamp: Date.now(),
        category: 'general'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateHealthResponse = async (question: string, category?: string): Promise<{content: string, sources: string[]}> => {
    const prompt = `
You are a knowledgeable health and wellness AI assistant. Please provide accurate, evidence-based information about health topics. Always include important disclaimers when appropriate.

User Question: "${question}"
Category: ${category || 'general'}

Please provide a comprehensive but concise response that includes:

1. A clear, informative answer to the question
2. Evidence-based recommendations when applicable
3. Important safety considerations or disclaimers
4. Actionable advice when relevant
5. Mention of when to consult healthcare professionals

Guidelines:
- Base responses on established scientific knowledge
- Include appropriate medical disclaimers
- Be encouraging but realistic
- Suggest consulting healthcare providers for personal medical advice
- Provide practical, actionable information
- Keep responses focused and well-structured

Format your response as JSON:
{
  "content": "Your detailed response here",
  "sources": ["List of general knowledge sources or research areas mentioned"]
}

Important: Always remind users that this is general information and not personal medical advice.
`;

    try {
      // Get the ingredient details method from geminiService which handles the AI initialization
      const response = await geminiService.getIngredientDetails(`Health Question: ${question}\n\nPrompt: ${prompt}`);
      
      if (response && typeof response === 'object') {
        return {
          content: response.content || "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.",
          sources: response.sources || []
        };
      }

      // Fallback response
      return {
        content: "I apologize, but I'm having trouble processing your question right now. Please try again or rephrase your question.",
        sources: []
      };

    } catch (error) {
      console.error('AI response generation failed:', error);
      throw error;
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'nutrition': return '🍎';
      case 'exercise': return '💪';
      case 'wellness': return '🧘';
      case 'research': return '🔬';
      default: return '🤖';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'nutrition': return 'border-l-green-500';
      case 'exercise': return 'border-l-blue-500';
      case 'wellness': return 'border-l-purple-500';
      case 'research': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  if (!isConfigured) {
    return (
      <div className="health-card p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-warning" />
          <h3 className="text-lg font-semibold mb-2">AI Assistant Not Available</h3>
          <p className="text-base-content/60 mb-4">
            To use the AI health assistant, please add your Gemini API key in Settings.
          </p>
          <button
            onClick={() => window.location.href = '/settings?tab=preferences'}
            className="btn btn-primary"
          >
            Configure API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="health-card p-0 h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Health AI Assistant</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg border-l-4 ${
                  message.isUser
                    ? 'bg-primary text-primary-content ml-auto'
                    : `bg-base-200 ${getCategoryColor(message.category)}`
                }`}
              >
                {!message.isUser && (
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <span>{getCategoryIcon(message.category)}</span>
                    <span className="font-medium capitalize">
                      {message.category || 'Health Assistant'}
                    </span>
                  </div>
                )}
                
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-base-300">
                    <div className="text-xs text-base-content/60">
                      <Search className="w-3 h-3 inline mr-1" />
                      Related areas: {message.sources.join(', ')}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-base-content/50 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-base-200 p-3 rounded-lg border-l-4 border-l-primary">
                <div className="flex items-center gap-2">
                  <span className="loading loading-dots loading-sm"></span>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-b bg-base-100">
            <div className="mb-2 flex items-center gap-2 text-sm text-base-content/60">
              <Lightbulb className="w-4 h-4" />
              Quick questions to get started:
            </div>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="btn btn-outline btn-xs"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about nutrition, exercise, wellness, or health research..."
              className="textarea textarea-bordered flex-1 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn btn-primary"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-xs text-base-content/50 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            This provides general health information only. Consult healthcare professionals for medical advice.
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
} 