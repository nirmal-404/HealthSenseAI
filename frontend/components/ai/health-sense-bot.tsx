'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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

const initialBotMessage: Message = {
  id: '1',
  role: 'bot',
  content: "Hello! I'm your HealthSense AI assistant. Describe your symptoms (e.g., 'I have a headache since 2 days'), and I'll help analyze them.",
};

export default function HealthSenseBot() {
  const { user, isAuthenticated } = useAuth();
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
    if (isOpen && view === 'history') {
      loadHistory();
    }
  }, [isOpen, view]);

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

  if (!isAuthenticated) return null;

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

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <Card className="mb-4 w-[350px] sm:w-[400px] h-[500px] shadow-2xl flex flex-col overflow-hidden border-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
          <CardHeader className="bg-teal-600 text-white p-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">HealthSense Bot</CardTitle>
                <CardDescription className="text-[10px] text-teal-100 uppercase tracking-widest font-semibold">AI Symptom Checker</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 hover:bg-white/10 text-white", view === 'history' && "bg-white/20")}
                onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
              >
                {view === 'chat' ? <History className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-white" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {view === 'chat' ? (
              messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                  {/* ... existing message rendering ... */}
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-teal-600 text-white rounded-tr-none" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>

                  {msg.type === 'follow-up' && (
                    <form onSubmit={handleFollowUpSubmit} className="mt-4 w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                      {msg.data.map((q: string, i: number) => (
                        <div key={i} className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500">{q}</label>
                          <Input 
                            placeholder="Your answer..." 
                            className="bg-white dark:bg-slate-950" 
                            onChange={(e) => setAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                            required
                          />
                        </div>
                      ))}
                      <Button type="submit" size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                        Submit Answers
                      </Button>
                    </form>
                  )}

                  {msg.type === 'feedback' && (
                    <div className="mt-4 w-full space-y-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-teal-100 dark:border-teal-900/30 shadow-sm animate-in zoom-in-95 duration-500">
                      {/* ... existing feedback component ... */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosis</span>
                        </div>
                        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full", getUrgencyColor(msg.data.urgencyLevel))}>
                          {msg.data.urgencyLevel} Urgency
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-1">
                            {msg.data.overallSeverity === 'severe' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-teal-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Overall Severity: <span className="capitalize">{msg.data.overallSeverity}</span></p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs leading-relaxed italic text-slate-600 dark:text-slate-400">
                          "{msg.data.aiSuggestions}"
                        </div>

                        {msg.data.recommendedSpecialties?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Recommended Specialists</p>
                            <div className="flex flex-wrap gap-1">
                              {msg.data.recommendedSpecialties.map((s: string, i: number) => (
                                <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2">
                        <Info className="w-3 h-3" />
                        <span>This is an AI assessment, not a formal diagnosis.</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Previous Assessments</h3>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] text-teal-600" onClick={() => setView('chat')}>
                    <Plus className="w-3 h-3 mr-1" /> New Assessment
                  </Button>
                </div>
                
                {isFetchingHistory ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                    <p className="text-xs text-slate-400">Loading your history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                    <Info className="w-8 h-8 text-slate-200" />
                    <p className="text-xs text-slate-500">No assessments yet. <br/> Start a new chat to get analyzed!</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <Card key={item._id} className="p-4 border-none bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => {
                        setMessages([
                          { id: Date.now().toString(), role: 'bot', content: `Re-evaluating assessment from ${new Date(item.createdAt).toLocaleDateString()}:`, type: 'feedback', data: item }
                        ]);
                        setIsViewingHistoryItem(true);
                        setView('chat');
                    }}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs font-semibold line-clamp-1">"{item.rawInput}"</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                             {item.symptoms.slice(0, 2).map((s:any, idx:number) => (
                               <span key={idx} className="text-[9px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{s.name}</span>
                             ))}
                          </div>
                        </div>
                        <span className={cn("text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full", getUrgencyColor(item.urgencyLevel))}>
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
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                </div>
              </div>
            )}
          </CardContent>

          {view === 'chat' && (
            <CardFooter className="p-4 pt-0">
              {isViewingHistoryItem ? (
                <Button 
                   onClick={resetChat} 
                   className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 rounded-2xl gap-2 font-bold"
                >
                  <Plus className="w-5 h-5" /> Start New Consultation
                </Button>
              ) : (
                <div className="w-full relative">
                  <Input
                    placeholder="Type your symptoms..."
                    className="pr-12 py-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-teal-600 shadow-inner"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading || followUpQuestions.length > 0}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg"
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim() || followUpQuestions.length > 0}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      )}

      {/* Bubble Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-slate-900 hover:bg-slate-800 scale-90" : "bg-teal-600 hover:bg-teal-700 scale-100"
        )}
      >
        {isOpen ? <ChevronDown className="w-8 h-8 text-white" /> : <MessageSquare className="w-8 h-8 text-white" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500 border-2 border-white dark:border-slate-950"></span>
          </span>
        )}
      </Button>
    </div>
  );
}
