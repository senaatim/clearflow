'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Send, MessageCircle, Clock, CheckCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supportApi, handleApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface SupportMessage {
  id: string;
  content: string;
  senderRole: 'user' | 'admin';
  senderName: string;
  createdAt: string;
  isRead: boolean;
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDate(messages: SupportMessage[]) {
  const groups: { date: string; messages: SupportMessage[] }[] = [];
  for (const msg of messages) {
    const label = formatDate(msg.createdAt);
    const existing = groups.find((g) => g.date === label);
    if (existing) {
      existing.messages.push(msg);
    } else {
      groups.push({ date: label, messages: [msg] });
    }
  }
  return groups;
}

export default function SupportPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadMessages = async () => {
    try {
      const res = await supportApi.getMyMessages();
      setMessages(res.data.messages || []);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // Poll every 8 seconds for new messages
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setSendError('');

    // Optimistic update
    const optimistic: SupportMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderRole: 'user',
      senderName: `${user?.firstName} ${user?.lastName}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');

    try {
      await supportApi.sendMessage(content);
      await loadMessages(); // Refresh to get server-confirmed message
    } catch (err) {
      setSendError(handleApiError(err));
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setNewMessage(content); // Restore input
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-full">
      <Header title="Support" subtitle="Chat with the ClearFlow team" />

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto gap-0">

        {/* Info banner */}
        <div className="mx-4 mt-4 px-4 py-3 bg-accent-primary/5 border border-accent-primary/20 rounded-xl flex items-start gap-3">
          <MessageCircle className="w-4 h-4 text-accent-primary mt-0.5 shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Our support team typically responds within a few hours during business hours (Mon–Fri, 9am–5pm WAT). For urgent issues, email us at <span className="text-accent-primary">support@clearflow.ng</span>
          </p>
        </div>

        {/* Chat window */}
        <Card className="mx-4 mt-4 flex-1 flex flex-col overflow-hidden" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 320px)' }}>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-40 flex-col gap-3">
                <AlertCircle className="w-8 h-8 text-accent-danger" />
                <p className="text-sm text-text-secondary">{error}</p>
                <button
                  onClick={loadMessages}
                  className="text-xs text-accent-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-accent-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-accent-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">No messages yet</p>
                  <p className="text-xs text-text-secondary mt-1">Send us a message and we'll get back to you shortly.</p>
                </div>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.date}>
                  {/* Date divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-text-muted px-2">{group.date}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-3">
                    {group.messages.map((msg) => {
                      const isOwn = msg.senderRole === 'user';
                      return (
                        <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                          {!isOwn && (
                            <div className="w-7 h-7 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary text-xs font-bold mr-2 mt-1 shrink-0">
                              CF
                            </div>
                          )}
                          <div className={cn('max-w-[75%] space-y-1', isOwn && 'items-end flex flex-col')}>
                            {!isOwn && (
                              <span className="text-xs text-text-muted px-1">ClearFlow Support</span>
                            )}
                            <div
                              className={cn(
                                'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                                isOwn
                                  ? 'bg-accent-primary text-background-primary rounded-br-sm'
                                  : 'bg-background-tertiary text-text-primary rounded-bl-sm'
                              )}
                            >
                              {msg.content}
                            </div>
                            <div className={cn('flex items-center gap-1 px-1', isOwn && 'justify-end')}>
                              <Clock className="w-3 h-3 text-text-muted" />
                              <span className="text-[10px] text-text-muted">{formatTime(msg.createdAt)}</span>
                              {isOwn && <CheckCheck className={cn('w-3 h-3', msg.isRead ? 'text-accent-primary' : 'text-text-muted')} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border p-3">
            {sendError && (
              <p className="text-xs text-accent-danger mb-2 px-1">{sendError}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="flex-1 resize-none bg-background-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-colors min-h-[42px] max-h-32"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending}
                className="w-10 h-10 rounded-xl bg-accent-primary text-background-primary flex items-center justify-center hover:bg-accent-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </Card>

        <div className="mx-4 mt-3 mb-6">
          <p className="text-xs text-text-muted text-center">
            Messages are monitored by the ClearFlow team. For account issues, include your email address.
          </p>
        </div>
      </div>
    </div>
  );
}
