import type { MDXComponents } from 'mdx/types'

// This file is required to use MDX in `app` directory.
export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        // Allows customizing built-in components, e.g. to add styling.
        h1: ({ children }) => <h1 className="text-display-l font-sans tracking-tight text-[var(--color-charcoal)] mt-12 mb-6">{children}</h1>,
        h2: ({ children }) => <h2 className="text-display-m font-sans tracking-tight text-[var(--color-charcoal)] mt-10 mb-4">{children}</h2>,
        p: ({ children }) => <p className="text-body text-[var(--color-charcoal)] leading-relaxed mb-6 opacity-90">{children}</p>,
        a: ({ href, children }) => <a href={href} className="text-body text-[var(--color-charcoal)] underline underline-offset-4 decoration-[var(--color-border)] hover:opacity-60 transition-opacity cursor-none">{children}</a>,
        code: ({ children }) => <code className="text-code bg-[rgba(28,28,28,0.06)] px-1.5 py-0.5 rounded-sm">{children}</code>,
        pre: ({ children }) => <pre className="bg-[#111111] text-white p-6 rounded-lg overflow-x-auto text-[0.85rem] font-mono leading-relaxed mb-8">{children}</pre>,
        ul: ({ children }) => <ul className="list-disc list-inside text-body text-[var(--color-charcoal)] leading-relaxed mb-6 space-y-2 opacity-90">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside text-body text-[var(--color-charcoal)] leading-relaxed mb-6 space-y-2 opacity-90">{children}</ol>,
        ...components,
    }
}
