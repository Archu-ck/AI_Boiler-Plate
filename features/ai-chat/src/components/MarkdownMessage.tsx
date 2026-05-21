"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function MarkdownMessage({ content }: { content: string }) {
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
            <div className="relative group my-4 rounded-md overflow-hidden bg-[#1e1e1e]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs text-gray-400">
                <span className="font-mono">{language}</span>
                <button
                  onClick={() => handleCopy(codeString)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  {copiedCode === codeString ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copiedCode === codeString ? 'Copied!' : 'Copy code'}</span>
                </button>
              </div>
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus as any}
                language={language}
                PreTag="div"
                className="!m-0 !bg-transparent text-sm"
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code {...props} className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 font-mono text-sm text-pink-500">
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
}
