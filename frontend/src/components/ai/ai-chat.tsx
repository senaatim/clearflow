'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
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

        // Headings: # / ## / ###
        const headingMatch = block.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const cn = level === 1 ? 'text-base font-bold' : 'text-sm font-semibold';
          return <p key={blockIndex} className={cn}>{renderInline(headingMatch[2])}</p>;
        }

        // Pure list block (every non-empty line starts with - or *)
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

        // Regular paragraph (with inline line breaks preserved)
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const response = await aiApi.askQuestion(messageText, context);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
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
    <div className="bg-[#141922] border border-gray-800 rounded-xl flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#0a0e14]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-gray-400 text-sm">Powered by AI</p>
        </div>
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

            {/* Suggested Questions */}
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
  );
}
