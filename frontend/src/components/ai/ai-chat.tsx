'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Plus, Trash2, MessageSquare, ChevronLeft } from 'lucide-react';
import { aiApi, handleApiError } from '@/lib/api-client';

// Lightweight inline markdown: **bold**, *italic*
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part || null;
      })}
    </>
  );
}

// Renders assistant markdown: headings, bullet lists, bold/italic, paragraphs
function MarkdownMessage({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, blockIndex) => {
        if (!block.trim()) return null;

        const headingMatch = block.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const cn = level === 1 ? 'text-base font-bold' : 'text-sm font-semibold';
          return <p key={blockIndex} className={cn}>{renderInline(headingMatch[2])}</p>;
        }

        const allLines = block.split('\n');
        const nonEmpty = allLines.filter(l => l.trim());
        if (nonEmpty.length > 0 && nonEmpty.every(l => /^[\-*]\s/.test(l.trim()))) {
          return (
            <ul key={blockIndex} className="list-disc list-inside space-y-0.5 pl-1">
              {nonEmpty.map((item, i) => (
                <li key={i}>{renderInline(item.replace(/^[\-*]\s+/, '').trim())}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex}>
            {allLines.map((line, i) => (
              <span key={i}>
                {renderInline(line)}
                {i < allLines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

interface AIChatProps {
  context?: Record<string, unknown>;
  placeholder?: string;
  title?: string;
}

const SUGGESTED_QUESTIONS = [
  "What stocks should I consider for long-term growth?",
  "How can I diversify my portfolio?",
  "What's the current market sentiment?",
  "Explain dollar-cost averaging",
  "What are the risks of tech stocks?",
];

export function AIChat({ context, placeholder = "Ask about investments, stocks, or market trends...", title = "AI Investment Advisor" }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await aiApi.listConversations(30);
      setConversations(res.data);
    } catch {
      // silent
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadConversation = async (id: string) => {
    try {
      const res = await aiApi.getConversation(id);
      const conv = res.data;
      setConversationId(conv.id);
      setMessages(
        conv.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        }))
      );
      setSidebarOpen(false);
    } catch {
      // silent
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) {
        startNewConversation();
      }
    } catch {
      // silent
    }
  };

  const handleSubmit = async (question?: string) => {
    const messageText = question || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiApi.askQuestion(messageText, context, conversationId ?? undefined);
      const data = response.data;

      if (!conversationId) {
        setConversationId(data.conversationId);
        await fetchConversations();
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${handleApiError(err)}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[600px] bg-[#141922] border border-gray-800 rounded-xl overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 overflow-hidden border-r border-gray-800 flex flex-col bg-[#0f1419]`}>
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-white text-sm font-medium">Conversations</span>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={startNewConversation}
          className="mx-3 mt-3 mb-2 flex items-center gap-2 px-3 py-2 bg-[#00ffaa]/10 border border-[#00ffaa]/30 rounded-lg text-[#00ffaa] text-sm hover:bg-[#00ffaa]/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {loadingConversations ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm group flex items-start gap-2 transition-colors ${
                  conversationId === conv.id
                    ? 'bg-[#00ffaa]/10 text-white border border-[#00ffaa]/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-800 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Conversation history"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#0a0e14]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{title}</h3>
            <p className="text-gray-400 text-xs">Powered by AI</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={startNewConversation}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00ffaa] transition-colors px-2 py-1 rounded-lg hover:bg-[#00ffaa]/10"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#00ffaa]/20 to-[#00d4ff]/20 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-[#00ffaa]" />
              </div>
              <h4 className="text-white font-semibold mb-2">How can I help you today?</h4>
              <p className="text-gray-400 text-sm mb-6 max-w-md">
                Ask me about stocks, investment strategies, market trends, or portfolio management.
              </p>
              <div className="w-full max-w-md space-y-2">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Try asking:</p>
                {SUGGESTED_QUESTIONS.slice(0, 3).map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(question)}
                    className="w-full text-left px-4 py-3 bg-[#0a0e14] border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-[#00ffaa]/50 hover:text-white transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-[#0a0e14]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#00ffaa] text-[#0a0e14]'
                        : 'bg-[#0a0e14] border border-gray-700 text-gray-200'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-[#0a0e14]/60' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#0a0e14]" />
                  </div>
                  <div className="bg-[#0a0e14] border border-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-4 py-2 border-t border-gray-800/50">
          <p className="text-gray-500 text-xs text-center">
            AI responses are for informational purposes only. Always consult a financial advisor.
          </p>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1 bg-[#0a0e14] border border-gray-700 rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffaa] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-[#0a0e14]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
