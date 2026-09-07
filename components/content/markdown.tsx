import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Raw HTML is disabled and the default URL sanitizer rejects unsafe protocols. */
export function MarkdownContent({ content }: { content: string }) {
  return <div className="story-prose"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
    h1: ({ children }) => <h2>{children}</h2>,
    a: ({ href, children }) => <a href={href} rel="noopener noreferrer">{children}</a>,
    table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
  }}>{content}</ReactMarkdown></div>;
}
