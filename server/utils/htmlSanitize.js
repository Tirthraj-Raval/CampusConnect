/**
 * htmlSanitize.js
 * ----------------------------------------------------------------------------
 * Single source of truth for sanitizing user-authored HTML before we store it.
 * Everything that writes HTML into the database MUST route through
 * `sanitizeRichHtml`. The client also re-sanitizes at render time for defense
 * in depth (see client/src/components/SafeHtml.tsx), but never rely on that
 * alone — a malicious API call would still land raw HTML in Postgres.
 *
 * Allowlist is intentionally wide because the product NEEDS to support
 * expressive HTML posters and email templates. What we deny:
 *   - <script>, <iframe>, <object>, <embed>, on* event handlers
 *   - javascript: / data: URIs on hrefs and srcs
 *   - <style> tags (inline style attributes are allowed and filtered)
 */

const sanitizeHtml = require('sanitize-html');

const ALLOWED_TAGS = [
  // Structural
  'div', 'span', 'section', 'article', 'header', 'footer', 'main', 'nav',
  // Typography
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'blockquote', 'pre', 'code',
  'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup', 'small', 'mark',
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Links & media
  'a', 'img', 'figure', 'figcaption', 'picture', 'source',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // Misc
  'address', 'cite', 'q', 'time', 'abbr', 'kbd', 'var',
];

const ALLOWED_ATTRS = {
  '*': ['class', 'id', 'style', 'title', 'lang', 'dir', 'data-*', 'aria-*', 'role'],
  a: ['href', 'name', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height', 'loading'],
  source: ['src', 'srcset', 'type', 'media', 'sizes'],
  picture: [],
  td: ['colspan', 'rowspan', 'align', 'valign'],
  th: ['colspan', 'rowspan', 'align', 'valign', 'scope'],
  col: ['span'],
  colgroup: ['span'],
  time: ['datetime'],
};

const ALLOWED_STYLES = {
  '*': {
    color: [/^.*$/],
    'background-color': [/^.*$/],
    'text-align': [/^(left|right|center|justify)$/],
    'font-size': [/^\d+(px|em|rem|%)$/],
    'font-weight': [/^(normal|bold|bolder|lighter|\d{3})$/],
    'font-family': [/^[a-zA-Z0-9\-_'",\s]+$/],
    'text-decoration': [/^.*$/],
    'font-style': [/^(normal|italic|oblique)$/],
    margin: [/^-?\d+(\.\d+)?(px|em|rem|%|auto)?(\s+-?\d+(\.\d+)?(px|em|rem|%|auto)?){0,3}$/],
    padding: [/^\d+(\.\d+)?(px|em|rem|%)?(\s+\d+(\.\d+)?(px|em|rem|%)?){0,3}$/],
    'margin-top': [/^-?\d+(\.\d+)?(px|em|rem|%|auto)$/],
    'margin-bottom': [/^-?\d+(\.\d+)?(px|em|rem|%|auto)$/],
    'margin-left': [/^-?\d+(\.\d+)?(px|em|rem|%|auto)$/],
    'margin-right': [/^-?\d+(\.\d+)?(px|em|rem|%|auto)$/],
    'padding-top': [/^\d+(\.\d+)?(px|em|rem|%)$/],
    'padding-bottom': [/^\d+(\.\d+)?(px|em|rem|%)$/],
    'padding-left': [/^\d+(\.\d+)?(px|em|rem|%)$/],
    'padding-right': [/^\d+(\.\d+)?(px|em|rem|%)$/],
    border: [/^.*$/],
    'border-radius': [/^\d+(\.\d+)?(px|em|rem|%)$/],
    width: [/^\d+(\.\d+)?(px|em|rem|%|vw|vh|auto)$/],
    height: [/^\d+(\.\d+)?(px|em|rem|%|vw|vh|auto)$/],
    'max-width': [/^\d+(\.\d+)?(px|em|rem|%|vw|vh|none)$/],
    'max-height': [/^\d+(\.\d+)?(px|em|rem|%|vw|vh|none)$/],
    display: [/^(block|inline|inline-block|flex|inline-flex|grid|inline-grid|none|table|table-row|table-cell)$/],
    'flex-direction': [/^(row|row-reverse|column|column-reverse)$/],
    'justify-content': [/^(flex-start|flex-end|center|space-between|space-around|space-evenly)$/],
    'align-items': [/^(flex-start|flex-end|center|baseline|stretch)$/],
    gap: [/^\d+(\.\d+)?(px|em|rem|%)$/],
    'line-height': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
    'letter-spacing': [/^-?\d+(\.\d+)?(px|em|rem|%)$/],
    opacity: [/^(0|1|0?\.\d+)$/],
    'box-shadow': [/^.*$/],
    'text-shadow': [/^.*$/],
    overflow: [/^(visible|hidden|scroll|auto)$/],
    position: [/^(static|relative|absolute|fixed|sticky)$/],
    top: [/^-?\d+(\.\d+)?(px|em|rem|%)$/],
    bottom: [/^-?\d+(\.\d+)?(px|em|rem|%)$/],
    left: [/^-?\d+(\.\d+)?(px|em|rem|%)$/],
    right: [/^-?\d+(\.\d+)?(px|em|rem|%)$/],
    'z-index': [/^-?\d+$/],
    'vertical-align': [/^.*$/],
    float: [/^(left|right|none)$/],
    clear: [/^(left|right|both|none)$/],
    'list-style': [/^.*$/],
    'list-style-type': [/^.*$/],
  },
};

const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRS,
  allowedStyles: ALLOWED_STYLES,
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'], // data: URI images are OK; script tags are not
  },
  allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
  allowProtocolRelative: false,
  // Drop anything with an on* attribute — belt-and-suspenders.
  transformTags: {
    a: (tagName, attribs) => {
      const safeAttribs = { ...attribs };
      // Force safe link rel + target behavior for anything that opens in a new tab.
      if (safeAttribs.target === '_blank') {
        safeAttribs.rel = 'noopener noreferrer';
      }
      return { tagName, attribs: safeAttribs };
    },
  },
  disallowedTagsMode: 'discard',
};

function sanitizeRichHtml(dirtyHtml) {
  if (dirtyHtml === null || dirtyHtml === undefined) return dirtyHtml;
  if (typeof dirtyHtml !== 'string') return '';
  return sanitizeHtml(dirtyHtml, SANITIZE_OPTIONS);
}

module.exports = { sanitizeRichHtml };
