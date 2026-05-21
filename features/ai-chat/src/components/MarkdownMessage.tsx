"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState, memo } from 'react';

const MarkdownMessage = memo(function MarkdownMessage({ content }: { content: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';
          const codeString = String(children).replace(/\n$/, '');
          const isInline = !match;
          return !isInline ? (
            <div className="relative my-4 rounded-2xl overflow-hidden bg-white/30 dark:bg-white/30 border border-white/50 dark:border-white/50 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/60 dark:bg-white/60 border-b border-white/30 dark:border-white/30 text-xs text-gray-700 font-semibold select-none">
                <span className="font-mono text-gray-500">{language}</span>
                <button
                  onClick={() => handleCopy(codeString)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {copiedCode === codeString ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span>{copiedCode === codeString ? 'Copied!' : 'Copy code'}</span>
                </button>
              </div>
              <SyntaxHighlighter
                {...props}
                style={prism as any}
                language={language}
                PreTag="div"
                className="!m-0 !bg-transparent text-sm !p-4"
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code {...props} className="bg-black/5 dark:bg-black/5 border border-black/5 rounded px-1.5 py-0.5 font-mono text-xs font-semibold text-pink-600 dark:text-pink-600">
              {children}
            </code>
          );
        },
        p({ children }) {
          return <div className="mb-4 last:mb-0 leading-relaxed text-gray-800 dark:text-gray-200">{children}</div>;
        },
        a({ href, children }) {
          return <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>;
        },
        ul({ children }) {
          return <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>;
        },
        li({ children }) {
          return <li className="text-gray-800 dark:text-gray-200">{children}</li>;
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 dark:text-white">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900 dark:text-white">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-lg font-bold mb-2 mt-4 text-gray-900 dark:text-white">{children}</h3>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

export default MarkdownMessage;
