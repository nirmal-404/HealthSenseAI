'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, X, MessageSquare, Loader2, AlertTriangle, CheckCircle2, 
  Info, ChevronDown, History, Plus, Sparkles, TrendingUp, FileDown,
  Brain, Heart, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
  type?: 'text' | 'follow-up' | 'analysis';
  data?: any;
}

type HealthSenseBotProps = {
  mode?: 'popup' | 'embedded';
  className?: string;
};

const initialBotMessage: Message = {
  id: '1',
  role: 'bot',
  content: "Hello! I'm your HealthSense AI assistant. Describe your symptoms (e.g., 'I have a headache since 2 days'), and I'll help analyze them.",
};

export default function HealthSenseBot({ mode = 'popup', className }: HealthSenseBotProps) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAiAssistancePage = pathname.startsWith('/patient/ai-assistance');
  const isPopupMode = mode === 'popup';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [view, setView] = useState<'chat' | 'history' | 'analysis'>('chat');
  const [history, setHistory] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'actions'>('summary');
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([initialBotMessage]);
  }, []);

  useEffect(() => {
    if (scrollRef.current && view === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, view]);

  useEffect(() => {
    if ((isOpen || !isPopupMode) && view === 'history') {
      loadHistory();
    }
  }, [isOpen, isPopupMode, view]);

  const loadHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const response = await api.get('/ai/history');
      setHistory(response.data.data);
    } catch (err) {
      toast.error('Failed to load history.');
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const resetChat = () => {
    setMessages([initialBotMessage]);
    setInputValue('');
    setCurrentCheckId(null);
    setFollowUpQuestions([]);
    setAnswers({});
    setView('chat');
    setActiveTab('summary');
    setCurrentAnalysis(null);
  };

  if (loading || !isAuthenticated || isAuthPage) return null;
  if (isPopupMode && isAiAssistancePage) return null;

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/symptom-check', {
        rawInput: userMessage.content,
      });

      const checkData = response.data.data;
      setCurrentCheckId(checkData._id);
      setCurrentAnalysis(checkData);

      if (checkData.followUpQuestions && checkData.followUpQuestions.length > 0) {
        setFollowUpQuestions(checkData.followUpQuestions);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'bot',
            content: "I've analyzed your symptoms. Please answer the follow-up questions:",
            type: 'follow-up',
            data: checkData.followUpQuestions,
          },
        ]);
      } else {
        displayAnalysis(checkData);
      }
    } catch (err: any) {
      toast.error('AI assistant error. Try again.');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: "Error encountered. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCheckId) return;

    const formattedAnswers = Object.entries(answers).map(([question, answer]) => ({
      question,
      answer,
    }));

    setIsLoading(true);
    try {
      const response = await api.post(`/ai/symptom-check/${currentCheckId}/answer`, {
        followUpAnswers: formattedAnswers,
      });

      displayAnalysis(response.data.data);
      setFollowUpQuestions([]);
      setAnswers({});
    } catch (err: any) {
      toast.error('Failed to submit answers.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayAnalysis = (data: any) => {
    setCurrentAnalysis(data);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'bot',
        content: "Analysis Complete",
        type: 'analysis',
        data: data,
      },
    ]);
    setView('analysis');
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getUrgencyBg = (level: string) => {
    switch (level) {
      case 'emergency': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  const AnalysisView = () => {
    if (!currentAnalysis) return null;

    return (
      <div className="space-y-6">
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Analysis Results</h2>
              <p className="text-sm text-slate-500 mt-1">Based on your symptoms</p>
            </div>
            <span className={cn('rounded-full px-3 py-1 text-xs font-bold uppercase', getUrgencyColor(currentAnalysis.urgencyLevel))}>
              {currentAnalysis.urgencyLevel}
            </span>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            <Brain className="inline-block mr-2 h-4 w-4" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'detailed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            <Heart className="inline-block mr-2 h-4 w-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'actions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            <Zap className="inline-block mr-2 h-4 w-4" />
            Actions
          </button>
        </div>

        <div className={cn('rounded-lg border p-4', getUrgencyBg(currentAnalysis.urgencyLevel))}>
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Severity</p>
                <div className="flex items-center gap-2">
                  {currentAnalysis.overallSeverity === 'severe' ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  <span className="font-semibold text-slate-900 capitalize">{currentAnalysis.overallSeverity}</span>
                </div>
              </div>

              <div className="rounded-lg bg-white/70 p-3 border border-slate-200">
                <p className="text-sm leading-relaxed text-slate-700">
                  <Sparkles className="inline-block mr-2 h-4 w-4 text-blue-600" />
                  {currentAnalysis.aiSuggestions}
                </p>
              </div>

              {currentAnalysis.recommendedSpecialties?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Specialists</p>
                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis.recommendedSpecialties.map((specialty: string, i: number) => (
                      <span key={i} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'detailed' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-white/70 p-3 border border-slate-200">
                <p className="text-sm text-slate-700 font-medium mb-2">Symptoms:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  {currentAnalysis.symptoms?.map((s: any, i: number) => (
                    <li key={i}>{s.name || s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-white/70 p-3 border border-slate-200 flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Next Steps</p>
                  <p className="text-xs text-slate-600 mt-1">Consult with healthcare professionals.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">AI assessment only - consult healthcare professionals.</p>
        </div>
      </div>
    );
  };

  const chatWindow = (
    <Card
      className={cn(
        'flex flex-col overflow-hidden bg-white shadow-2xl border-0',
        isPopupMode ? 'mb-4 h-[600px] w-[400px]' : 'h-full w-full shadow-lg'
      )}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/20 p-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-base">HealthSense AI</h1>
            <p className="text-xs text-blue-100">Health analysis powered by AI</p>
          </div>
        </div>
        {isPopupMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/10"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {view === 'chat' ? (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-xs rounded-2xl rounded-tr-none bg-blue-600 px-4 py-2 text-white text-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-xs space-y-2">
                      <div className="rounded-2xl rounded-tl-none bg-white border border-slate-200 px-4 py-2 text-slate-900 text-sm shadow-sm">
                        {msg.content}
                      </div>

                      {msg.type === 'follow-up' && (
                        <form onSubmit={handleFollowUpSubmit} className="mt-3 space-y-3 bg-white rounded-lg p-3 border border-slate-200">
                          {msg.data.map((q: string, i: number) => (
                            <div key={i} className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700">{q}</label>
                              <Input
                                placeholder="Your answer..."
                                className="text-sm"
                                onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
                                required
                              />
                            </div>
                          ))}
                          <Button type="submit" size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Submit
                          </Button>
                        </form>
                      )}

                      {msg.type === 'analysis' && <AnalysisView />}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-none bg-white border border-slate-200 px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">Analyzing...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">History</h3>
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => {
                  resetChat();
                  setView('chat');
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> New
              </Button>
            </div>

            {isFetchingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mb-2 mx-auto" />
                <p className="text-xs text-slate-500">Loading...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No assessments yet</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item._id}
                  className="p-3 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    setCurrentAnalysis(item);
                    setView('chat');
                    setMessages([
                      {
                        id: Date.now().toString(),
                        role: 'bot',
                        content: 'Assessment',
                        type: 'analysis',
                        data: item,
                      },
                    ]);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm font-medium text-slate-900 line-clamp-1 mt-1">"{item.rawInput}"</p>
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-1 rounded-full flex-shrink-0', getUrgencyColor(item.urgencyLevel))}>
                      {item.urgencyLevel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>

      {view === 'chat' && !currentAnalysis && (
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="relative">
            <Input
              placeholder="Ask your health question..."
              className="rounded-full border-slate-300 bg-slate-100 pr-12 py-6"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => void handleSend()}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentAnalysis && view === 'chat' && (
        <div className="border-t border-slate-200 bg-white p-4 flex gap-2">
          <Button
            onClick={resetChat}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" /> New
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-slate-300 rounded-full"
            onClick={() => setView('history')}
          >
            <History className="h-4 w-4 mr-2" /> History
          </Button>
        </div>
      )}
    </Card>
  );

  if (!isPopupMode) {
    return <div className={cn('h-full w-full', className)}>{chatWindow}</div>;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen ? chatWindow : null}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300',
          isOpen ? 'scale-90 bg-slate-900 hover:bg-slate-800' : 'scale-100 bg-blue-600 hover:bg-blue-700'
        )}
      >
        {isOpen ? <ChevronDown className="h-6 w-6 text-white" /> : <MessageSquare className="h-6 w-6 text-white" />}
        {!isOpen && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-blue-400 opacity-75"></span>
          </span>
        )}
      </Button>
    </div>
  );
}