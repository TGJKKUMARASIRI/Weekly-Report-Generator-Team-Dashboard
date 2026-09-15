import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Loader2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiService, type ChatMessage } from '../services/aiService';

interface AIChatWidgetProps {
  currentWeek?: string;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({ currentWeek }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello Manager! Ask me anything about team activity, recurring blockers, or project progress for this week.',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const reply = await aiService.sendChatMessage(query, currentWeek);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Failed to generate insights. Please check if your network connection or API setup is active.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What were key blockers this week?',
    'Summarize completed work across teams',
    'Any workload imbalances?',
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-3.5 rounded-full shadow-2xl transition-all duration-200 transform hover:scale-105"
        >
          <Bot className="w-6 h-6" />
          <span className="text-base font-bold tracking-wide">Ask AI Assistant</span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-[90vw] sm:w-[460px] rounded-2xl shadow-2xl flex flex-col h-[620px] transition-all">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <div>
                <h3 className="font-bold text-base leading-tight">Team Activity AI</h3>
                <p className="text-xs text-indigo-100 font-medium">Manager Insights Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Minimize chat"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] text-sm p-3.5 rounded-2xl leading-relaxed font-medium ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200/60 dark:border-gray-600/60 shadow-xs'
                  }`}
                >
                  {m.role === 'user' ? (
                    m.content
                  ) : (
                    <ReactMarkdown
                      components={{
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-5 my-1 space-y-1" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal pl-5 my-1 space-y-1" {...props} />
                        ),
                        li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-indigo-950 dark:text-indigo-200" {...props} />
                        ),
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 py-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing team data...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length < 4 && !loading && (
            <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-800/50">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-xs font-semibold bg-white dark:bg-gray-700 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors shadow-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3.5 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about team progress..."
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-gray-400 font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};