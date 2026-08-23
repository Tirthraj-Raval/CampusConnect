"use client";

/**
 * SafeHtml
 * ---------------------------------------------------------------------------
 * Every place in the app that used to render user-authored HTML directly via
 * `dangerouslySetInnerHTML={{ __html: value }}` should render through this
 * component instead. Server-side we already sanitize on write, but a small
 * amount of pre-cleanup data exists in the DB and the client sanitizer is
 * cheap defense-in-depth.
 *
 * Wrapping choices:
 *  - `mode="inline"` renders directly into the parent (no extra wrapper).
 *  - `mode="block"` (default) renders inside a <div> so callers can style it.
 *  - `mode="sandbox"` renders inside a same-origin-less <iframe> with `sandbox`
 *    set, for full-page HTML (email posters, custom event pages) where you
 *    want the strongest isolation from the surrounding app.
 */

import { useEffect, useMemo, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";

type SafeHtmlProps = {
  html: string | null | undefined;
  className?: string;
  mode?: "inline" | "block" | "sandbox";
  /** Extra tags to allow beyond the defaults. Use sparingly. */
  extraAllowedTags?: string[];
  /** Extra attributes to allow beyond the defaults. */
  extraAllowedAttrs?: string[];
};

const DEFAULT_ALLOWED_TAGS = [
  "div", "span", "section", "article", "header", "footer", "main", "nav",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "blockquote", "pre", "code",
  "b", "strong", "i", "em", "u", "s", "sub", "sup", "small", "mark",
  "ul", "ol", "li", "dl", "dt", "dd",
  "a", "img", "figure", "figcaption", "picture", "source",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "address", "cite", "q", "time", "abbr", "kbd", "var",
];

const DEFAULT_ALLOWED_ATTRS = [
  "class", "id", "style", "title", "lang", "dir", "role",
  "href", "name", "target", "rel",
  "src", "alt", "width", "height", "loading",
  "srcset", "sizes", "type", "media",
  "colspan", "rowspan", "align", "valign", "scope", "span",
  "datetime",
];

function sanitize(dirty: string, extraTags: string[], extraAttrs: string[]) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [...DEFAULT_ALLOWED_TAGS, ...extraTags],
    ALLOWED_ATTR: [...DEFAULT_ALLOWED_ATTRS, ...extraAttrs],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
    // Strip javascript: and data: schemes; block on* handlers.
    FORBID_ATTR: [
      "onload", "onerror", "onclick", "onmouseover", "onfocus",
      "onblur", "onchange", "oninput", "onsubmit", "onanimationend",
      "onanimationstart", "ontransitionend",
    ],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "textarea", "select", "option"],
  });
}

export default function SafeHtml({
  html,
  className,
  mode = "block",
  extraAllowedTags = [],
  extraAllowedAttrs = [],
}: SafeHtmlProps) {
  const clean = useMemo(() => {
    if (!html) return "";
    return sanitize(html, extraAllowedTags, extraAllowedAttrs);
  }, [html, extraAllowedTags, extraAllowedAttrs]);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (mode !== "sandbox") return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    // Write the sanitized HTML into a fresh document. `sandbox` on the iframe
    // strips scripts and prevents same-origin access to the parent.
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8">
      <style>body{margin:0;padding:16px;font-family:inherit;color:inherit}</style>
      </head><body>${clean}</body></html>`);
    doc.close();
  }, [clean, mode]);

  if (!clean) return null;

  if (mode === "sandbox") {
    return (
      <iframe
        ref={iframeRef}
        className={className}
        sandbox=""
        style={{ width: "100%", border: "none", minHeight: 200 }}
      />
    );
  }

  if (mode === "inline") {
    return <span className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
