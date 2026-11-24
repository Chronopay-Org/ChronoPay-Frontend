"use client";

export interface HighlightMatchProps {
  text: string;
  query: string;
}

/**
 * Renders a label with the matching portion of the query highlighted
 * (case-insensitive, safe with regex metacharacters).
 */
export function HighlightMatch({ text, query }: HighlightMatchProps) {
  if (!query) return <>{text}</>;

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-cyan-300 font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
