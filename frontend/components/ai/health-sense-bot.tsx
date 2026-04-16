'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Send, X, MessageSquare, Loader2, Activity, AlertTriangle, CheckCircle2, Info, ChevronDown, History, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
  type?: 'text' | 'follow-up' | 'feedback';
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

  useEffect(() => {
    setMessages([initialBotMessage]);
  }, []);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [history, setHistory] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isViewingHistoryItem, setIsViewingHistoryItem] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);



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
    setIsViewingHistoryItem(false);
    setView('chat');
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
      if (followUpQuestions.length > 0 && currentCheckId) {
        // We are answering follow-up questions
        // This is a bit simplified, usually you'd want to handle them one by one or as a block
        // For simplicity in a chat bubble, let's treat the text input as the answer to the current question context if we had one, 
        // but the API expects a block of answers.
        // Let's stick to the API flow of "Initial input" -> "List of questions" -> "Answer all".
      } else {
        // Initial symptom check
        const response = await api.post('/ai/symptom-check', {
          rawInput: userMessage.content,
        });

        const checkData = response.data.data;
        setCurrentCheckId(checkData._id);

        if (checkData.followUpQuestions && checkData.followUpQuestions.length > 0) {
          setFollowUpQuestions(checkData.followUpQuestions);
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: 'bot',
              content: "I've analyzed your symptoms. To provide a better assessment, please answer these follow-up questions:",
              type: 'follow-up',
              data: checkData.followUpQuestions,
            },
          ]);
        } else {
          // No follow up, show feedback directly
          displayFeedback(checkData);
        }
      }
    } catch (err: any) {
      toast.error('AI assistant is currently unavailable.');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: "I'm sorry, I encountered an error. Please try again later.",
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

      displayFeedback(response.data.data);
      setFollowUpQuestions([]);
      setAnswers({});
    } catch (err: any) {
      toast.error('Failed to submit answers.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayFeedback = (data: any) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'bot',
        content: "Here is my assessment based on the information provided:",
        type: 'feedback',
        data: data,
      },
    ]);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'text-red-600 bg-red-100 dark:bg-red-950/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-950/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30';
      default: return 'text-green-600 bg-green-100 dark:bg-green-950/30';
    }
  };

  const chatWindow = (
    <Card
      className={cn(
        'flex flex-col overflow-hidden border-none bg-white shadow-2xl',
        isPopupMode
          ? 'mb-4 h-[500px] w-[350px] animate-in slide-in-from-bottom-5 duration-300 sm:w-[400px]'
          : 'h-full min-h-[520px] w-full border border-[#dce5f2] shadow-[0_18px_44px_rgba(45,90,180,0.12)]',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-[#3559d5] p-4 text-white">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/20 p-1.5">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight">HealthSense Bot</CardTitle>
            <CardDescription className="text-[10px] font-semibold uppercase tracking-widest text-blue-100">
              AI Symptom Checker
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 text-white hover:bg-white/10', view === 'history' && 'bg-white/20')}
            onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
          >
            {view === 'chat' ? <History className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
          {isPopupMode ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[#fbfdff] p-4">
        {view === 'chat' ? (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl p-3 text-sm shadow-sm',
                  msg.role === 'user'
                    ? 'rounded-tr-none bg-[#3559d5] text-white'
                    : 'rounded-tl-none bg-[#edf2ff] text-[#1d2944]',
                )}
              >
                {msg.content}
              </div>

              {msg.type === 'follow-up' && (
                <form onSubmit={handleFollowUpSubmit} className="mt-4 w-full space-y-4 rounded-xl border border-[#dce5f2] bg-white p-4">
                  {msg.data.map((q: string, i: number) => (
                    <div key={i} className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500">{q}</label>
                      <Input
                        placeholder="Your answer..."
                        className="bg-[#f7faff]"
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
                        required
                      />
                    </div>
                  ))}
                  <Button type="submit" size="sm" className="w-full bg-[#3559d5] text-white hover:bg-[#2d4db9]">
                    Submit Answers
                  </Button>
                </form>
              )}

              {msg.type === 'feedback' && (
                <div className="mt-4 w-full space-y-4 rounded-xl border border-[#dce5f2] bg-white p-4 shadow-sm animate-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#3559d5]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosis</span>
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', getUrgencyColor(msg.data.urgencyLevel))}>
                      {msg.data.urgencyLevel} Urgency
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        {msg.data.overallSeverity === 'severe' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-[#3559d5]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Overall Severity: <span className="capitalize">{msg.data.overallSeverity}</span>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#f4f7ff] p-3 text-xs italic leading-relaxed text-slate-600">
                      "{msg.data.aiSuggestions}"
                    </div>

                    {msg.data.recommendedSpecialties?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Recommended Specialists</p>
                        <div className="flex flex-wrap gap-1">
                          {msg.data.recommendedSpecialties.map((s: string, i: number) => (
                            <span key={i} className="rounded-md bg-[#edf2ff] px-2 py-0.5 text-[10px] text-[#2f58db]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 border-t border-[#ecf2ff] pt-2 text-[10px] text-slate-400">
                    <Info className="h-3 w-3" />
                    <span>This is an AI assessment, not a formal diagnosis.</span>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="space-y-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Previous Assessments</h3>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-[#3559d5]" onClick={() => setView('chat')}>
                <Plus className="mr-1 h-3 w-3" /> New Assessment
              </Button>
            </div>

            {isFetchingHistory ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#3559d5]" />
                <p className="text-xs text-slate-400">Loading your history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-10 text-center">
                <Info className="h-8 w-8 text-slate-200" />
                <p className="text-xs text-slate-500">
                  No assessments yet. <br /> Start a new chat to get analyzed!
                </p>
              </div>
            ) : (
              history.map((item) => (
                <Card
                  key={item._id}
                  className="cursor-pointer border border-[#dce5f2] bg-white p-4 transition-colors hover:bg-[#f4f8ff]"
                  onClick={() => {
                    setMessages([
                      {
                        id: Date.now().toString(),
                        role: 'bot',
                        content: `Re-evaluating assessment from ${new Date(item.createdAt).toLocaleDateString()}:`,
                        type: 'feedback',
                        data: item,
                      },
                    ]);
                    setIsViewingHistoryItem(true);
                    setView('chat');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                      <p className="line-clamp-1 text-xs font-semibold">"{item.rawInput}"</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.symptoms.slice(0, 2).map((s: any, idx: number) => (
                          <span key={idx} className="rounded border border-[#dce5f2] bg-[#f7faff] px-1.5 py-0.5 text-[9px]">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase', getUrgencyColor(item.urgencyLevel))}>
                      {item.urgencyLevel}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        {isLoading && view === 'chat' && (
          <div className="flex justify-start">
            <div className="animate-pulse rounded-2xl rounded-tl-none bg-[#edf2ff] p-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#3559d5]" />
            </div>
          </div>
        )}
      </CardContent>

      {view === 'chat' && (
        <CardFooter className="p-4 pt-0">
          {isViewingHistoryItem ? (
            <Button onClick={resetChat} className="w-full gap-2 rounded-2xl bg-[#3559d5] py-6 font-bold text-white hover:bg-[#2d4db9]">
              <Plus className="h-5 w-5" /> Start New Consultation
            </Button>
          ) : (
            <div className="relative w-full">
              <Input
                placeholder="Type your symptoms..."
                className="rounded-2xl border-[#dce5f2] bg-[#f7faff] py-6 pr-12 shadow-inner focus-visible:ring-[#3559d5]"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={isLoading || followUpQuestions.length > 0}
              />
              <Button
                size="icon"
                className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl bg-[#3559d5] text-white shadow-lg hover:bg-[#2d4db9]"
                onClick={() => void handleSend()}
                disabled={isLoading || !inputValue.trim() || followUpQuestions.length > 0}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
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
          'flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300',
          isOpen ? 'scale-90 bg-slate-900 hover:bg-slate-800' : 'scale-100 bg-[#3559d5] hover:bg-[#2d4db9]',
        )}
      >
        {isOpen ? <ChevronDown className="h-8 w-8 text-white" /> : <MessageSquare className="h-8 w-8 text-white" />}
        {!isOpen && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-blue-400"></span>
          </span>
        )}
      </Button>
    </div>
  );
}
