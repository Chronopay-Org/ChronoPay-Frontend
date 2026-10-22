import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("renders bold text", () => {
    expect(renderMarkdown("**bold**")).toContain("<strong>bold</strong>");
  });

  it("renders italic text", () => {
    expect(renderMarkdown("*italic*")).toContain("<em>italic</em>");
  });

  it("renders strikethrough text", () => {
    expect(renderMarkdown("~~strikethrough~~")).toContain("<del>strikethrough</del>");
  });

  it("renders a link", () => {
    const result = renderMarkdown("[text](https://example.com)");
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain(">text</a>");
  });

  it("renders inline code", () => {
    expect(renderMarkdown("`code`")).toContain("<code");
    expect(renderMarkdown("`code`")).toContain(">code</code>");
  });

  it("renders a code block", () => {
    const result = renderMarkdown("```\nconst x = 1;\n```");
    expect(result).toContain("<pre");
    expect(result).toContain("<code>");
    expect(result).toContain("const x = 1;");
  });

  it("renders headers", () => {
    expect(renderMarkdown("# H1")).toContain('<h1 class="notes-h1">H1</h1>');
    expect(renderMarkdown("## H2")).toContain('<h2 class="notes-h2">H2</h2>');
    expect(renderMarkdown("###### H6")).toContain('<h6 class="notes-h6">H6</h6>');
  });

  it("renders unordered list items", () => {
    const result = renderMarkdown("- item 1\n- item 2");
    expect(result).toContain("<li>item 1</li>");
    expect(result).toContain("<li>item 2</li>");
  });

  it("wraps list items in ul tags", () => {
    const result = renderMarkdown("- a\n- b");
    expect(result).toContain("<ul>");
    expect(result).toContain("</ul>");
  });

  it("renders ordered list items", () => {
    const result = renderMarkdown("1. first\n2. second");
    expect(result).toContain("<li>first</li>");
    expect(result).toContain("<li>second</li>");
    expect(result).toContain("<ol>");
  });

  it("renders paragraphs for plain text", () => {
    expect(renderMarkdown("hello world")).toContain("<p>hello world</p>");
  });

  it("separates paragraphs with newlines", () => {
    const result = renderMarkdown("para one\n\npara two");
    expect(result).toContain("<p>para one</p>");
    expect(result).toContain("<p>para two</p>");
  });

  it("escapes HTML in input", () => {
    const result = renderMarkdown("<script>alert('xss')</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("returns empty string for empty input", () => {
    expect(renderMarkdown("")).toBe("");
    expect(renderMarkdown("   ")).toBe("");
  });

  describe("link sanitization and escaping", () => {
    it("renders javascript:, data:, and vbscript: links without executable hrefs", () => {
      const cases = [
        "[x](javascript:alert(1))",
        "[x](JaVaScRiPt:alert(1))",
        "[x]( data:text/html,<script>alert(1)</script>)",
        "[x](javascript:...)",
        "[x](&NewLine;javascript:alert(1))",
        "[x](&#x6a;&#x61;vascript:alert(1))",
        "[x](javascript&colon;alert(1))",
        "[x](vbscript:msgbox(1))",
      ];

      for (const input of cases) {
        const result = renderMarkdown(input);
        expect(result).not.toContain("href");
        expect(result).not.toContain("<a ");
        expect(result).toContain("x");
      }
    });

    it("renders inline code with single level of escaping", () => {
      const result = renderMarkdown("`a<b`");
      expect(result).toContain('<code class="notes-inline-code">a&lt;b</code>');
      expect(result).not.toContain("&amp;lt;");
    });

    it("preserves query strings without corrupting ampersands in href", () => {
      const result = renderMarkdown("[q](https://x.test/?a=1&b=2)");
      expect(result).toContain('href="https://x.test/?a=1&b=2"');
      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('target="_blank"');
    });

    it("allows http, https, and mailto schemes", () => {
      expect(renderMarkdown("[web](http://example.com)")).toContain('href="http://example.com"');
      expect(renderMarkdown("[secure](https://example.com)")).toContain('href="https://example.com"');
      expect(renderMarkdown("[mail](mailto:user@example.com)")).toContain('href="mailto:user@example.com"');
    });

    it("prevents attribute injection from link text and retains rel attributes", () => {
      const result = renderMarkdown('[" onfocus="alert(1)](https://example.com)');
      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('&quot; onfocus=&quot;alert(1)');
    });
  });
});
