'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Search,
  MessageSquare,
  Clock,
  User,
  Loader2,
  AlertCircle,
  CheckCheck,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { supportApi, handleApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  totalMessages: number;
}

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
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
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

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversationsError, setConversationsError] = useState('');
  const [messagesError, setMessagesError] = useState('');
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showThread, setShowThread] = useState(false);

  const loadConversations = async () => {
    try {
      const res = await supportApi.getConversations();
      const list: Conversation[] = res.data.conversations || [];
      setConversations(list);
      setFiltered(
        search
          ? list.filter(
              (c) =>
                c.userName.toLowerCase().includes(search.toLowerCase()) ||
                c.userEmail.toLowerCase().includes(search.toLowerCase())
            )
          : list
      );
      setConversationsError('');
    } catch (err) {
      setConversationsError(handleApiError(err));
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (userId: string) => {
    setIsLoadingMessages(true);
    setMessagesError('');
    try {
      await supportApi.markRead(userId);
      const res = await supportApi.getConversation(userId);
      setMessages(res.data.messages || []);
      // Update unread count in conversations list
      setConversations((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      setMessagesError(handleApiError(err));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    loadMessages(selectedUserId);
    const interval = setInterval(() => loadMessages(selectedUserId), 8000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!search) {
      setFiltered(conversations);
    } else {
      setFiltered(
        conversations.filter(
          (c) =>
            c.userName.toLowerCase().includes(search.toLowerCase()) ||
            c.userEmail.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, conversations]);

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    setMessages([]);
    setSendError('');
    setShowThread(true);
  };

  const handleSend = async () => {
    if (!selectedUserId || !reply.trim() || isSending) return;

    const content = reply.trim();
    setIsSending(true);
    setSendError('');

    const optimistic: SupportMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderRole: 'admin',
      senderName: 'ClearFlow Support',
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setReply('');

    try {
      await supportApi.replyToUser(selectedUserId, content);
      await loadMessages(selectedUserId);
    } catch (err) {
      setSendError(handleApiError(err));
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setReply(content);
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

  const selectedConversation = conversations.find((c) => c.userId === selectedUserId);
  const grouped = groupByDate(messages);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <Header
        title="Messages"
        subtitle={totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'User support conversations'}
      />

      <div className="flex-1 flex gap-4 overflow-hidden mt-4">

        {/* Conversations list */}
        <Card className={cn(
          'flex flex-col overflow-hidden w-full lg:w-80 lg:flex-shrink-0',
          showThread ? 'hidden lg:flex' : 'flex'
        )}>
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
              </div>
            ) : conversationsError ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 p-4 text-center">
                <AlertCircle className="w-6 h-6 text-accent-danger" />
                <p className="text-xs text-text-secondary">{conversationsError}</p>
                <button onClick={loadConversations} className="text-xs text-accent-primary hover:underline">
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 p-4 text-center">
                <MessageSquare className="w-8 h-8 text-text-muted" />
                <p className="text-xs text-text-secondary">
                  {search ? 'No users match your search' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectConversation(conv.userId)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-background-tertiary transition-colors',
                    selectedUserId === conv.userId && 'bg-accent-primary/5 border-l-2 border-l-accent-primary'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary text-xs font-bold shrink-0">
                      {getInitials(conv.userName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-text-primary truncate">{conv.userName}</span>
                        <span className="text-[10px] text-text-muted shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{conv.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-text-muted truncate">{conv.userEmail}</span>
                        {conv.unreadCount > 0 && (
                          <Badge variant="positive" className="text-[10px] px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-muted">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
            <button
              onClick={loadConversations}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-background-tertiary transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Conversation thread */}
        <Card className={cn(
          'flex-1 flex flex-col overflow-hidden',
          !showThread ? 'hidden lg:flex' : 'flex'
        )}>
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-text-muted" />
              </div>
              <div>
                <p className="text-text-primary font-medium">Select a conversation</p>
                <p className="text-sm text-text-secondary mt-1">Choose a user from the list to view and reply to their messages.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => setShowThread(false)}
                  className="lg:hidden p-1 -ml-1 mr-1 text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary text-sm font-bold">
                  {selectedConversation ? getInitials(selectedConversation.userName) : <User className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{selectedConversation?.userName}</p>
                  <p className="text-xs text-text-muted">{selectedConversation?.userEmail}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
                  </div>
                ) : messagesError ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <AlertCircle className="w-7 h-7 text-accent-danger" />
                    <p className="text-sm text-text-secondary">{messagesError}</p>
                    <button onClick={() => loadMessages(selectedUserId)} className="text-xs text-accent-primary hover:underline">
                      Try again
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                    <MessageSquare className="w-8 h-8 text-text-muted" />
                    <p className="text-sm text-text-secondary">No messages in this conversation yet.</p>
                  </div>
                ) : (
                  grouped.map((group) => (
                    <div key={group.date}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-text-muted px-2">{group.date}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="space-y-3">
                        {group.messages.map((msg) => {
                          const isAdmin = msg.senderRole === 'admin';
                          return (
                            <div key={msg.id} className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                              {!isAdmin && (
                                <div className="w-7 h-7 rounded-full bg-background-tertiary flex items-center justify-center text-text-secondary text-xs font-bold mr-2 mt-1 shrink-0">
                                  {selectedConversation ? getInitials(selectedConversation.userName)[0] : 'U'}
                                </div>
                              )}
                              <div className={cn('max-w-[70%] space-y-1', isAdmin && 'items-end flex flex-col')}>
                                {!isAdmin && (
                                  <span className="text-xs text-text-muted px-1">{selectedConversation?.userName}</span>
                                )}
                                <div
                                  className={cn(
                                    'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                                    isAdmin
                                      ? 'bg-accent-primary text-background-primary rounded-br-sm'
                                      : 'bg-background-tertiary text-text-primary rounded-bl-sm'
                                  )}
                                >
                                  {msg.content}
                                </div>
                                <div className={cn('flex items-center gap-1 px-1', isAdmin && 'justify-end')}>
                                  <Clock className="w-3 h-3 text-text-muted" />
                                  <span className="text-[10px] text-text-muted">{formatMessageTime(msg.createdAt)}</span>
                                  {isAdmin && <CheckCheck className={cn('w-3 h-3', msg.isRead ? 'text-accent-primary' : 'text-text-muted')} />}
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

              {/* Reply input */}
              <div className="border-t border-border p-3">
                {sendError && (
                  <p className="text-xs text-accent-danger mb-2 px-1">{sendError}</p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a reply... (Enter to send)"
                    rows={1}
                    className="flex-1 resize-none bg-background-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-colors min-h-[42px] max-h-32"
                    onInput={(e) => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = 'auto';
                      t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!reply.trim() || isSending}
                    className="w-10 h-10 rounded-xl bg-accent-primary text-background-primary flex items-center justify-center hover:bg-accent-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>

      </div>
    </div>
  );
}
