const ESCAPE_HTML = /[&<>"']/g;
const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

function escapeHtml(text: string): string {
  return text.replace(ESCAPE_HTML, (ch) => ESCAPE_MAP[ch]);
}

const INLINE_RULES: Array<{
  pattern: RegExp;
  replacement: (match: string, ...groups: string[]) => string;
}> = [
  { pattern: /\*\*(\S(?:(?!\*\*)[\s\S])*\S|\S)\*\*/g, replacement: (_, content) => `<strong>${content}</strong>` },
  { pattern: /\*(\S(?:(?!\*)[\s\S])*\S|\S)\*/g, replacement: (_, content) => `<em>${content}</em>` },
  { pattern: /~~(\S(?:(?!~~)[\s\S])*\S|\S)~~/g, replacement: (_, content) => `<del>${content}</del>` },
  { pattern: /`([^`]+)`/g, replacement: (_, code) => `<code class="notes-inline-code">${escapeHtml(code)}</code>` },
  { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: (_, text, url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${text}</a>` },
];

function inline(text: string): string {
  let result = text;
  for (const { pattern, replacement } of INLINE_RULES) {
    result = result.replace(pattern, replacement as never);
  }
  return result;
}

function processBlock(block: string): string {
  const trimmed = block.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("#")) {
    const level = trimmed.match(/^#{1,6}/)?.[0].length ?? 1;
    const content = trimmed.replace(/^#+\s*/, "");
    return `<h${level} class="notes-h${level}">${inline(escapeHtml(content))}</h${level}>`;
  }

  return `<p>${inline(escapeHtml(trimmed))}</p>`;
}

function isListItem(line: string): "ul" | "ol" | null {
  if (/^[-*]\s/.test(line)) return "ul";
  if (/^\d+\.\s/.test(line)) return "ol";
  return null;
}

function listItemContent(line: string): string {
  const ulMatch = line.match(/^[-*]\s+(.+)$/);
  if (ulMatch) return ulMatch[1];
  const olMatch = line.match(/^\d+\.\s+(.+)$/);
  return olMatch ? olMatch[1] : line;
}

export function renderMarkdown(text: string): string {
  if (!text.trim()) return "";

  const blocks: string[] = [];
  let i = 0;
  const lines = text.split("\n");
  const total = lines.length;

  while (i < total) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < total && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      const code = codeLines.join("\n");
      blocks.push(`<pre class="notes-code"><code>${escapeHtml(code)}</code></pre>`);
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const liType = isListItem(line);
    if (liType) {
      const items: string[] = [];
      const type = liType;

      const valueMatch = line.match(/^(\d+)\.\s/);
      const startValue = valueMatch ? valueMatch[1] : null;
      items.push(listItemContent(line));
      i++;

      while (i < total) {
        const next = lines[i];
        const nextLi = isListItem(next);
        if (nextLi && nextLi === type) {
          items.push(listItemContent(next));
          i++;
        } else if (nextLi && nextLi !== type) {
          break;
        } else if (next.trim() === "") {
          break;
        } else {
          break;
        }
      }

      const tag = type === "ul" ? "ul" : "ol";
      const attrs = type === "ol" && startValue && startValue !== "1"
        ? ` start="${startValue}"`
        : "";
      const lis = items
        .map((content) => `<li>${inline(escapeHtml(content.trim()))}</li>`)
        .join("\n");
      blocks.push(`<${tag}${attrs}>\n${lis}\n</${tag}>`);
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#{1,6}/)?.[0].length ?? 1;
      const content = line.replace(/^#+\s*/, "");
      blocks.push(`<h${level} class="notes-h${level}">${inline(escapeHtml(content))}</h${level}>`);
      i++;
      continue;
    }

    const paraLines: string[] = [line];
    i++;
    while (i < total) {
      const next = lines[i];
      if (next.trim() === "" || isListItem(next) || next.trim().startsWith("```") || /^#{1,6}\s/.test(next)) {
        break;
      }
      paraLines.push(next);
      i++;
    }
    blocks.push(`<p>${inline(escapeHtml(paraLines.join(" ").trim()))}</p>`);
  }

  return blocks.join("\n");
}
