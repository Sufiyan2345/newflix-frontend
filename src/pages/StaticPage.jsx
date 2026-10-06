import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer, { HelpCenterFooter } from '../components/Footer';
import { HelpCenterHeader, LegalFooter } from '../components/HelpCenterChrome';
import { API } from '../api';
import { CONTENT, HELP_SLUGS, hasContent } from '../utils/legalContent';
import { SpeedTestPanel } from '../components/SpeedTestPanel';
import { openCookiePreferences } from '../utils/cookiePreferences';
import { COUNTRIES, getCountry, setCountry } from '../utils/countries';

// Every page the footer links to: the FAQ, the Help Center and its articles, and
// the legal / corporate pages. The real netflix.com footer has 14 links and all
// of them land somewhere â€” before this, "Media Center" showed the about page and
// "Account" was missing from the footer entirely.

// ---------------------------------------------------------------------------
// A tiny markdown subset, so the SAME renderer draws both the built-in copy and
// whatever an admin types into Admin â†’ Site Settings â†’ Static Pages. Every rule
// is optional, so a plain-paragraph entry still renders correctly.
//
//   ## / ###  headings      - / 1.  list items     >  callout box
//   **bold**  *italic*      [label](/p/slug)        ---  rule
// ---------------------------------------------------------------------------
// The image alternative must allow the optional `"<width>"` title slot AND stay
// ahead of the plain-link alternative, or `![...](src "369")` is split at the
// space and the title ends up glued onto the src. `\S+?` for the path (not
// `[^)]+`) for the same reason as ONLY_IMAGE below.
const INLINE = /(!\[[^\]]*\]\(\S+?(?:\s+"\d+(?:\.\d+)?")?\)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;

// A paragraph whose entire text is one image is a FIGURE, not a line of prose -
// node/41049 opens "Understand your billing date" with a screenshot that way.
// An empty alt is the inline-list-icon form ("![](/icon-globe.png)Your billing
// date may be..."), so only the standalone case is promoted to a block.
//
// The optional title slot carries the reference's rendered WIDTH in px. The
// served node/41049 tags that screenshot width="369.36" even though the file
// itself is 720px wide, so the figure has to honour the authored display size
// rather than just the intrinsic one.
//
// The path group excludes whitespace, not just ")": with a greedy `[^)]+` the
// "369" was absorbed into the src and became part of the URL.
const ONLY_IMAGE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"(\d+(?:\.\d+)?)")?\)$/;

// The /p/cookie-preferences URL still exists (footer links, in-copy links and
// hand-typed addresses all land here), but the reference has no cookie PAGE —
// the label raises the Privacy Preference Center dialog. So this route mounts
// the same dialog over a short landing paragraph, which also gives the address
// bar something to describe if the dialog is dismissed.
function CookiePreferencesPage() {
  useEffect(() => { openCookiePreferences(); }, []);
  return (
    <>
      <p className="sp-more">
        Cookie settings live in the Privacy Preference Center. Use the button
        below to open it again.
      </p>
      <p>
        <button type="button" className="btn-red" onClick={() => openCookiePreferences()}>
          Open Privacy Preference Center
        </button>
      </p>
    </>
  );
}

// The "Notices" box on /legal/notices is a Sprinklr collapsible section, not a
// plain <ul>. On the live page it is a 1px #DBDBDB rounded box on #F8F8FA with a
// bold summary row; the caret is a 12px triangle that rotates 90deg open, and the
// panel below carries its own 1px top rule and 0.8rem padding. Each entry is its
// own <ul> on the reference, which is what spaces the rows so far apart.
function NoticesPanel({ items }) {
  const [open, setOpen] = useState(true);
  if (!items?.length) return null;
  return (
    <div className="np-panel">
      <button
        type="button"
        className="np-summary"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          className={`np-caret${open ? ' is-open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 14 14"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M3.307.272a.931.931 0 00.001 1.316L8.718 7l-5.41 5.41a.93.93 0 001.313 1.318h.001l6.07-6.07a.931.931 0 000-1.316L4.623.272a.931.931 0 00-1.316 0z" />
        </svg>
        <span className="np-summary-text">Notices</span>
      </button>
      {open && (
        <div className="np-detail">
          {items.map((n) => (
            <ul className="np-list" key={n.label}>
              <li>
                <a href={n.href} target="_blank" rel="noopener noreferrer">{n.label}</a>
              </li>
            </ul>
          ))}
        </div>
      )}
    </div>
  );
}

// The "Currently viewing information for" country box that sits between the
// breadcrumb and the article title on help.netflix.com/en/node/134094.
//
// The reference runs a react-select, so this is a listbox that behaves like one
// rather than a native <select>: a 220x38 control showing the current country,
// a rule and a chevron on the right, and a filterable menu of all 249 countries
// that opens on click. Keyboard support follows the same contract - Enter/Space
// or ArrowDown open it, typing filters, the arrows move the active option,
// Enter picks it, Escape closes.
function CountrySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(([name]) => name.toLowerCase().includes(q));
  }, [query]);

  // Close on an outside click or Escape, and drop focus so the keyboard never
  // ends up driving a menu that is no longer on screen.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Keep the highlighted row inside the filtered list.
  useEffect(() => {
    if (active >= matches.length) setActive(Math.max(0, matches.length - 1));
  }, [matches, active]);

  // Follow the active option as the arrow keys move through a 249-row list.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector('.is-active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openMenu = () => {
    setOpen(true);
    setQuery('');
    setActive(Math.max(0, COUNTRIES.findIndex(([name]) => name === value)));
    // The search input has to take focus for the control to be typeable into.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commit = (name) => {
    onChange(name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); openMenu(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[active]) commit(matches[active][0]);
    }
  };

  return (
    <div className="hc-country-row">
      <label className="hc-country-label" id="hc-country-label" htmlFor="hc-country-input">
        Currently viewing information for:
      </label>
      <div className="hc-country" ref={rootRef}>
        <div
          className={`hc-country-control${open ? ' is-open' : ''}`}
          onClick={openMenu}
          onKeyDown={onKeyDown}
        >
          <input
            id="hc-country-input"
            ref={inputRef}
            className="hc-country-input"
            // The visible value is painted by the sibling span; the input only
            // ever holds the filter text, so it is hidden from the accessibility
            // tree and the label names the combobox instead.
            role="combobox"
            aria-expanded={open}
            aria-controls="hc-country-list"
            aria-labelledby="hc-country-label"
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck="false"
            value={open ? query : ''}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onFocus={() => { if (!open) openMenu(); }}
          />
          <span className="hc-country-value">{open && query ? query : value}</span>
          <span className="hc-country-indicator" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" focusable="false">
              <path
                d="M5.5 8L10 13L14.5 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        {open && (
          <ul className="hc-country-menu" id="hc-country-list" role="listbox" ref={listRef}>
            {matches.length === 0 && <li className="hc-country-empty">No countries found</li>}
            {matches.map(([name, code], i) => (
              <li
                key={code}
                role="option"
                aria-selected={name === value}
                className={`hc-country-option${i === active ? ' is-active' : ''}${name === value ? ' is-selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(name)}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ArticleFeedback() {
  const [answer, setAnswer] = useState('');
  return (
    <div className="hc-feedback">
      <span>Was this article helpful?</span>
      <button type="button" onClick={() => setAnswer('Thanks for your feedback.')}>Yes</button>
      <button type="button" onClick={() => setAnswer('Thanks for your feedback.')}>No</button>
      {answer && <span className="hc-feedback-response" role="status">{answer}</span>}
    </div>
  );
}

// The plain Help Center articles: same two-column shell as the FAQ and the
// supported-devices article (title above .pane-wrapper, prose left, "Related
// Articles" right, "Was this article helpful?" under the prose), but with no
// page-specific extras - no country selector, no images, no collapsible body.
// Kept as a set so adding the next article is one line rather than a fourth
// boolean threaded through the isHelpDocument / render-branch checks below.
const PLAIN_HELP_ARTICLES = new Set([
  'profiles',            // help.netflix.com/en/node/10421
  'billing-and-payments', // help.netflix.com/en/node/41049
  'downloads',           // help.netflix.com/en/node/54816
]);

// Articles that carry the "Currently viewing information for:" country box above
// the title, plus the gate line under it. The reference shows this pair on
// node/10421 (profiles), node/41049 (billing) and node/54816 (downloads) - all
// three open with "A country must be selected to view content in this article."
// - alongside the corporate-information article that already had the box.
// node/412 and node/470 have neither, which is why they are not in here.
const COUNTRY_GATED_ARTICLES = new Set([
  'profiles',
  'billing-and-payments',
  'downloads',
]);

const ARTICLE_IMAGES = {
  intro: '/what_is_netflix_1_en.png',
  'TV Shows & Movies': '/what_is_netflix_2_en.png',
  'Supported Devices': '/what_is_netflix_3_en.png',
  'Plans and Pricing': '/what_is_netflix_4_en.png',
  'Get Started': '/what_is_netflix_5_en.png',
};

// An in-page jump ("#privacy-section-b-...") moves to its heading and rewrites
// the address bar, matching the reference's cross-reference links.
//
// The order here is load-bearing: the scroll runs BEFORE the URL is rewritten.
// history.replaceState() to a fragment first makes Chrome treat the jump as a
// pending fragment navigation and the scrollIntoView that follows is swallowed,
// leaving the reader at the top of a 17,000px document. The scroll is also
// `instant` rather than smooth, because a smooth glide over that distance never
// visibly moves, and `auto` would inherit the app's global
// `scroll-behavior: smooth` anyway.
const jumpToAnchor = (event, href) => {
  event.preventDefault();
  const el = document.getElementById(href.slice(1));
  if (!el) return;
  el.scrollIntoView({ behavior: 'instant', block: 'start' });
  window.history.replaceState(null, '', href);
};

const renderInline = (text, key) => {
  // Split on the markers above, then walk the parts keeping a running index so
  // React keys stay stable without needing a full parser.
  let i = 0;
  return String(text).split(INLINE).filter(Boolean).map((part) => {
    const k = `${key}-${i++}`;
    // Images are matched before links in INLINE, so a "!" can never be left
    // behind as stray text. The reference draws its 16px list glyphs as real
    // inline <img>s, vertically centred on the line, not as list markers.
    const img = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      return <img key={k} className="sp-inline-img" src={img[2]} alt={img[1]} />;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      // Internal destinations go through the router; real external links
      // (TMDB in the Legal Notices page) get rel/target so they are safe.
      if (href.startsWith('/')) return <Link key={k} to={href}>{link[1]}</Link>;
      if (href.startsWith('#')) {
        return <a key={k} href={href} onClick={(e) => jumpToAnchor(e, href)}>{link[1]}</a>;
      }
      return <a key={k} href={href} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    }
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={k}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={k}>{part.slice(1, -1)}</em>;
    return <span key={k}>{part}</span>;
  });
};

// Body text -> blocks. Consecutive `-` / `1.` lines become ONE list, which is
// what makes a written bullet list render as a list instead of six paragraphs.
const LIST_ITEM = /^(\s*)(?:([-*])|(\d+)\.)\s+(.*)$/;

const parseBlocks = (body = '') => {
  const lines = String(body).split('\n');
  const blocks = [];
  let para = [];
  let list = null;

  const flushPara = () => {
    if (!para.length) return;
    blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push(list);
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (!line.trim()) {
      // A blank line only ends the list if the run of bullets is really over.
      // The statement separates its bullets with blank lines (so each one reads
      // as its own paragraph in the source), and treating that as a break would
      // turn a 93-bullet list into 93 single-item lists. So: look ahead to the
      // next line with content and keep the list open if it is still a bullet.
      flushPara();
      let j = i;
      while (j < lines.length && !lines[j].trim()) j++;
      const next = j < lines.length ? lines[j].trimEnd() : '';
      const continuesList = LIST_ITEM.test(next);
      if (!continuesList) flushList();
      continue;
    }

    const h = line.match(/^(#{2,3})(?:\s+(.*))?$/);
    if (h) {
      flushPara(); flushList();
      // A bare "##" is a HEADING WITH NO TEXT. The reference's corporate article
      // uses two of them as pure vertical spacers, so they are kept as an
      // (empty) heading block and drawn as a bare 40px gap rather than dropped -
      // dropping them would pull the following section up by 40px.
      blocks.push({ type: h[1].length === 2 ? 'h2' : 'h3', text: h[2] || '' });
      continue;
    }
    // "::" opens an address block: the run of lines up to the next blank line
    // is one paragraph of hard-broken lines inside a padded wrapper, which is
    // how the reference renders a registered postal address.
    if (line.trim() === '::') {
      flushPara(); flushList();
      const parts = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim()) { parts.push(lines[j].trimEnd()); j++; }
      blocks.push({ type: 'addr', lines: parts });
      i = j - 1;
      continue;
    }
    const li = line.match(LIST_ITEM);
    if (li) {
      flushPara();
      // `1.` makes an ordered list and `-` a bullet list.
      const type = li[3] ? 'ol' : 'ul';
      // Leading indent is two spaces per level. The reference nests a second
      // tier of bullets under a parent (e.g. the device/network information
      // breakdown), so an item is a node with its own `children` rather than a
      // bare string.
      const level = Math.floor(li[1].replace(/\t/g, '  ').length / 2);
      const item = { text: li[4], children: [], depth: level };

      // An INDENTED marker is always a child of the item above it, whatever
      // marker it happens to use. Opening a new list block on the style change
      // is only correct at level 0 - that is what was splitting node/54816's
      // "To download a TV show or movie:" steps into three broken lists
      // (2, 1 and 3 items) because the two sub-bullets under steps 2 and 3 are
      // "- " markers inside a "1. " list. The reference has two ordered lists
      // of three steps, with sub-bullets hanging off steps 2 and 3.
      if (level > 0 && list && list.items.length) {
        // Walk down to the item at the level directly above this one, so a run
        // of siblings nests under the correct parent.
        let parent = list.items[list.items.length - 1];
        while (parent.depth >= level) {
          const next = parent.children[parent.children.length - 1];
          if (!next) break;
          parent = next;
        }
        parent.children.push(item);
        continue;
      }

      // At the top level, switching marker style genuinely opens a new list.
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push(item);
      continue;
    }
    const note = line.match(/^>\s?(.*)$/);
    if (note) {
      flushPara(); flushList();
      blocks.push({ type: 'note', text: note[1] });
      continue;
    }
    if (/^(---|\*\*\*)$/.test(line.trim())) {
      flushPara(); flushList();
      blocks.push({ type: 'hr' });
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return blocks;
};

const anchorSlug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Three headings in the reference appear TWICE - "The Categories of Personal
// Information We Collect", "How We Use Your Personal Information" and "Who We
// Disclose Personal Information To" head both Section A and the Netflix Games
// disclosures. A bare slug would put the same id on two elements, so the second
// copy gets a -2 suffix.
//
// Ids are keyed by BLOCK INDEX, not by heading text: the rail and the article
// walk the same parsed blocks in the same order, so one lookup each keeps them
// in step. (Keying by text and consuming it with shift() broke on re-render -
// the map was already drained, so every heading fell back to the plain slug and
// the duplicates came back.)
const buildAnchorIds = (blocks, prefix) => {
  const used = new Map();
  const byIndex = new Map();
  blocks.forEach((b, i) => {
    if (b.type !== 'h2' && b.type !== 'h3') return;
    const base = `${prefix}-${anchorSlug(b.text)}`;
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    byIndex.set(i, n > 1 ? `${base}-${n}` : base);
  });
  return byIndex;
};

// The real rail is a two-level tree: each `##` section owns the `###` headings
// that follow it, so "Section A" can expand to reveal its subsections.
//
// "Contacting Us" is a `###` that appears BEFORE any `##`, so it would be
// orphaned by a plain "attach h3 to the open h2" walk. The reference lists it
// as a top-level rail entry with no disclosure arrow, so a heading that owns no
// section is promoted to the top level instead of being dropped.
const buildPrivacyTree = (blocks, anchorIds) => {
  const nodes = [];
  let current = null;
  // "Contacting Us" is a `###` that arrives before any `##`, so it is buffered
  // here and spliced in ahead of the first section once that section opens.
  const pending = [];

  blocks.forEach((b, i) => {
    if (b.type === 'h2') {
      current = { text: b.text, id: anchorIds.get(i) ?? null, children: [] };
      nodes.push(current);
      // Anything buffered before this heading belongs to no section - flush it
      // as its own top-level entry (this is the "Contacting Us" case).
      while (pending.length) {
        nodes.splice(nodes.indexOf(current), 0, pending.shift());
      }
      return;
    }
    if (b.type !== 'h3') return;
    const node = { text: b.text, id: anchorIds.get(i) ?? null, children: [] };
    if (current) current.children.push(node);
    else pending.push(node);
  });
  while (pending.length) nodes.push(pending.shift());

  return nodes;
};

// The reference rail is position:sticky top:100px with max-height:825px and
// overflow:auto, highlights the entry you are currently reading with a solid
// black pill, and auto-expands the section that owns the active heading.
function PrivacyTree({ nodes, onNavigate }) {
  const ownerOf = useMemo(() => {
    const map = new Map();
    nodes.forEach((n) => {
      map.set(n.id, n.id);
      n.children.forEach((c) => map.set(c.id, n.id));
    });
    return map;
  }, [nodes]);

  const allIds = useMemo(() => {
    const out = [];
    nodes.forEach((n) => { out.push(n.id); n.children.forEach((c) => out.push(c.id)); });
    return out;
  }, [nodes]);

  const [open, setOpen] = useState(() => new Set());
  const [active, setActive] = useState('');

  // Only entries that actually own a sub-list can be expanded. "Contacting Us",
  // "Section C" and "Section F" have no children on the reference, so they
  // carry no arrow and no aria-expanded.
  const expandableRef = useRef(new Set());
  expandableRef.current = useMemo(
    () => new Set(nodes.filter((n) => n.children.length > 0).map((n) => n.id)),
    [nodes],
  );

  // Scrollspy: the last heading whose top has passed the threshold owns the
  // highlight, and its parent section auto-expands. The id list is read through a
  // ref so the listener is attached exactly once instead of on every render.
  const idsRef = useRef(allIds);
  idsRef.current = allIds;
  const ownerRef = useRef(ownerOf);
  ownerRef.current = ownerOf;

  useEffect(() => {
    const onScroll = () => {
      const ids = idsRef.current;
      if (!ids.length) return;
      let current = '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        // headings are in document order, so the first one still below the line
        // ends the search
        if (el.getBoundingClientRect().top > 140) break;
        current = id;
      }
      setActive((prev) => (prev === current ? prev : current));
      // Exactly one section is open: the one that owns the heading being read.
      // A childless entry ("Contacting Us", "Section C", "Section F") owns no
      // sub-list, so the correct state there is nothing open at all - without
      // this the section opened further down stayed open after scrolling back up.
      const owner = ownerRef.current.get(current);
      const next = owner && expandableRef.current.has(owner) ? new Set([owner]) : new Set();
      setOpen((prev) => (
        prev.size === next.size && [...next].every((o) => prev.has(o)) ? prev : next
      ));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // The drawer (below 900px) closes as soon as a section is chosen, which is
  // the one behaviour that differs from the two-column rail.
  //
  // Two details matter here, both found by measuring rather than guessing:
  //
  // 1. The jump is INSTANT, like the reference's plain `href="#id"` anchor. The
  //    document is ~17,000px tall, so the furthest section sits 12,000px down,
  //    and a smooth glide over that distance never visibly moves. `instant` is
  //    spelled out because the app sets `scroll-behavior: smooth` on <html>,
  //    which makes the default `auto` smooth too.
  // 2. The scroll has to happen BEFORE the URL is rewritten. Calling
  //    history.replaceState() to a fragment first makes Chrome treat the jump as
  //    a pending fragment navigation, and the scrollIntoView that follows is
  //    swallowed - the page just sits at the top.
  const jump = (event, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    el.scrollIntoView({ behavior: 'instant', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setActive(id);
    onNavigate?.();
  };

  return (
    <ul className="hc-tree">
      {nodes.map((node) => {
        const isOpen = open.has(node.id);
        const hasChildren = node.children.length > 0;
        return (
          <li className="hc-tree-group" key={node.id}>
            <a
              href={`#${node.id}`}
              className={`hc-tree-link${active === node.id ? ' is-active' : ''}`}
              onClick={(e) => jump(e, node.id)}
              {...(hasChildren ? { 'aria-expanded': isOpen } : {})}
            >
              {node.text}
              {hasChildren && (
                <span className={`hc-tree-caret${isOpen ? ' open' : ''}`} aria-hidden="true" />
              )}
            </a>
            {node.children.length > 0 && (
              <ul className={`hc-tree-sub${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
                {node.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      className={`hc-tree-link hc-tree-child${active === child.id ? ' is-active' : ''}`}
                      onClick={(e) => jump(e, child.id)}
                    >
                      {child.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Every bullet in the statement opens with a term the reference sets in bold -
// "Personal details:", "Payment details:", "Usage information:" - and only then
// continues in regular weight. The copy stores those as plain text, so the
// lead-in is picked out here rather than hand-marking 93 bullets.
// A lead-in is a short run up to the first colon; a longer first clause is just
// a sentence that happens to contain one, and is left unbolded.
const BULLET_LEADIN = /^([^:]{1,80}):(\s)/;

// The lead-in guess is a heuristic that happens to be right for the Privacy
// Statement, where every bullet opens with a term followed by a colon. It is
// wrong for node/41049, whose bullets use "**Taxes** -" (explicitly marked) and
// whose "Third-party:" / "Package:" items are NOT bold in the source. So callers
// that mark their own bold can turn the guess off.
const renderBullet = (text, key, leadBold = true) => {
  const match = leadBold ? BULLET_LEADIN.exec(String(text)) : null;
  if (!match) return renderInline(text, key);
  const lead = match[0].slice(0, -1);          // "Personal details:"
  const rest = String(text).slice(match[0].length);
  return (
    <>
      <strong>{renderInline(lead, `${key}-lead`)}</strong>
      {renderInline(rest, `${key}-rest`)}
    </>
  );
};

// Renders one list item and, if it has any, a nested list beneath it. The
// reference indents its second tier with a plain <ul>, so this is a real
// nested list rather than a flattened run of bullets.
const ListItem = ({ item, keyBase, leadBold }) => (
  <li>
    {renderBullet(item.text, keyBase, leadBold)}
    {item.children.length > 0 && (
      <ul className="sp-list sp-list-nested">
        {item.children.map((child, k) => (
          <ListItem item={child} key={`${keyBase}-${k}`} keyBase={`${keyBase}-${k}`} leadBold={leadBold} />
        ))}
      </ul>
    )}
  </li>
);

const Blocks = ({
  body, blocks: preParsed, articleImages = false, anchorPrefix = '', anchorIds = null, plainHeadings = false,
  leadBold = true,
}) => {
  const parsed = useMemo(() => preParsed ?? parseBlocks(body), [preParsed, body]);
  // When the caller supplies the id map (the privacy page), a heading takes the
  // id the rail links to. It is looked up by block index, so it resolves the
  // same on every render and a repeated heading keeps its -2 suffix.
  const headingId = (text, i) => {
    if (!anchorPrefix) return undefined;
    return anchorIds?.get(i) ?? `${anchorPrefix}-${anchorSlug(text)}`;
  };
  return (
    <>
      {parsed.map((b, i) => {
        const image = b.type === 'h2' ? ARTICLE_IMAGES[b.text] : null;
        // A paragraph that is nothing but an image renders as a block figure,
        // which is how the reference leads a panel with a screenshot.
        const figure = b.type === 'p' ? ONLY_IMAGE.exec(b.text) : null;
        return (
          <Fragment key={i}>
            {articleImages && i === 0 && (
              <img className="hc-article-image" src={ARTICLE_IMAGES.intro} alt="Netflix on an internet-connected device" />
            )}
            {/* The legal-document article marks a section heading up as
                <h2><u><span>…</span></u></h2> - the underline is a <u> element,
                not a text-decoration, so it inherits the font's own offset and
                weight, which keeps that rule pixel-identical.
                plainHeadings opts out for the articles whose real markup is a
                bare <h2><span>…</span></h2> with no <u>: the FAQ, the
                supported-devices article and corporate-information. */}
            {b.type === 'h2' && (
              b.text
                ? <h2 className="sp-h2" id={headingId(b.text, i)}>
                    {plainHeadings ? renderInline(b.text, i) : <u>{renderInline(b.text, i)}</u>}
                  </h2>
                : <div className="sp-h2-spacer" aria-hidden="true" />
            )}
            {b.type === 'h3' && <h3 className="sp-h3" id={headingId(b.text, i)}>{renderInline(b.text, i)}</h3>}
            {b.type === 'note' && <div className="sp-note">{renderInline(b.text, i)}</div>}
            {b.type === 'hr' && <hr className="sp-hr" />}
            {b.type === 'ul' && (
              <ul className="sp-list">
                {b.items.map((it, j) => (
                  <ListItem key={j} item={it} keyBase={`${i}-${j}`} leadBold={leadBold} />
                ))}
              </ul>
            )}
            {b.type === 'ol' && (
              <ol className="sp-list sp-ol">
                {b.items.map((it, j) => (
                  <ListItem key={j} item={it} keyBase={`${i}-${j}`} leadBold={leadBold} />
                ))}
              </ol>
            )}
            {figure && (
              <img
                className="sp-figure"
                src={figure[2]}
                alt={figure[1]}
                // width/height are set from the authored display size so the box
                // is reserved before the image decodes, instead of the layout
                // jumping when it lands.
                width={figure[3] || undefined}
                style={figure[3] ? { width: `${figure[3]}px` } : undefined}
                loading="lazy"
              />
            )}
            {b.type === 'p' && !figure && <p className="sp-p">{renderInline(b.text, i)}</p>}
            {b.type === 'addr' && (
              <div className={`sp-address${!parsed.slice(i + 1).some((n) => n.type === 'addr') ? ' is-last' : ''}`}>
                <p className="sp-p">
                  {b.lines.map((line, k) => (
                    <Fragment key={k}>
                      {k > 0 && <br />}
                      {renderInline(line, `${i}-${k}`)}
                    </Fragment>
                  ))}
                </p>
              </div>
            )}

            {articleImages && image && (
              <img className="hc-article-image" src={image} alt={b.text} loading="lazy" />
            )}
          </Fragment>
        );
      })}
    </>
  );
};

// The real FAQ is a list of expandable rows rather than a wall of headings, so
// that page gets an accordion. It is built from the same block parser by
// pairing each `###` question with the paragraph that follows it.
function FaqAccordion({ body }) {
  const items = useMemo(() => {
    const out = [];
    parseBlocks(body).forEach((b) => {
      if (b.type === 'h3') out.push({ q: b.text, a: '' });
      else if (b.type === 'p' && out.length) out[out.length - 1].a += `${out[out.length - 1].a ? ' ' : ''}${b.text}`;
    });
    return out;
  }, [body]);
  const [open, setOpen] = useState(0);

  if (!items.length) return <Blocks body={body} />;

  return (
    <div className="sp-accordion">
      {items.map((it, i) => (
        <div className={`sp-accordion-item${open === i ? ' open' : ''}`} key={i}>
          <button
            type="button"
            className="sp-accordion-q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            {renderInline(it.q, `q${i}`)}
            <span className="sp-accordion-sign" aria-hidden="true">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div className="sp-accordion-a">
              <Blocks body={it.a} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// node/470 and node/41049 draw their option sections with the same Sprinklr
// "collapsible section" widget, and it is a BOX, not a flat ruled row. Read off
// the served markup, each one is:
//
//   outer   1px solid #DBDBDB, 4px radius, #F8F8FA fill, full width, 0.8rem gap
//   label   flex row, 0.4rem padding, bold, with a 12px triangle 5px from the
//           top that rotates a quarter turn when open, then the text indented
//           a further 0.8rem
//   panel   1px #DBDBDB top rule, 0.8rem padding, and `display:none` until the
//           section is opened - so every panel ships CLOSED
//
// The reference drives it with a hidden checkbox stretched over its own label
// (CSS `:has(:checked)`); a <button> with aria-expanded gives the same geometry
// and state without a form, which is what this uses.
//
// The open set is a Set of keys rather than a single index: unlike the FAQ
// accordion, which allows only one panel at a time, the reference lets a reader
// open as many as they like, because these pages are "choose the option that
// best matches" and the options are meant to be compared.
function CollapsibleSection({ title, children, open, onToggle, id }) {
  const panelId = `${id}-panel`;
  return (
    <div className={`hc-collapsible${open ? ' is-open' : ''}`}>
      <h3 className="hc-collapsible-head">
        <button
          type="button"
          className="hc-collapsible-btn"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {/* A solid 12px triangle, not a chevron: it points right when closed
              and down when open. Decorative - aria-expanded carries the state. */}
          <svg className="hc-collapsible-caret" width="12" height="12" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
            <path d="M3.307.272a.931.931 0 00.001 1.316L8.718 7l-5.41 5.41a.93.93 0 001.313 1.318h.001l6.07-6.07a.931.931 0 000-1.316L4.623.272a.931.931 0 00-1.316 0z" />
          </svg>
          <span>{title}</span>
        </button>
      </h3>
      {open && <div className="hc-collapsible-panel" id={panelId}>{children}</div>}
    </div>
  );
}

// node/470's article: a single run of collapsible options under one intro line.
// node/41049 instead groups its options under section headings - see
// <ArticleSections /> - so this is the flat variant, kept for the pages that
// really do have one.
function CollapsibleOptions({ options, baseId = 'opt' }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (i) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <div className="hc-collapsibles">
      {options.map((opt, i) => (
        <CollapsibleSection
          key={opt.title}
          id={`${baseId}-${i}`}
          title={opt.title}
          open={open.has(i)}
          onToggle={() => toggle(i)}
        >
          <Blocks body={opt.body} />
          {/* node/470's fourth option nests one level further: it opens into
              per-device groups, collapsible in exactly the same way. The key is
              read as `groups` because that is what the content declares -
              checking `childOptions` here meant this branch never ran. */}
          {opt.groups?.map((g, k) => (
            <CollapsibleSection
              key={g.title}
              id={`${baseId}-${i}-${k}`}
              title={g.title}
              open={open.has(`${i}-${k}`)}
              onToggle={() => toggle(`${i}-${k}`)}
            >
              <Blocks body={g.body} />
            </CollapsibleSection>
          ))}
        </CollapsibleSection>
      ))}
    </div>
  );
}

// node/41049. Three `##` sections, each an icon + heading, optional intro
// paragraph, and its own run of boxed disclosures. The section heading is a
// 32px/1.3 600-weight line with a 60x60 editorial icon set to its left - not
// the 24px underlined heading the legal and FAQ articles use - so it gets its
// own class rather than borrowing .sp-h2.
//
// Every disclosure starts closed, which is what the reference serves
// (`display:none` on the detail pane until the box is ticked).
function ArticleSections({ sections }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (k) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  });

  return (
    <div className="hc-sections">
      {sections.map((section, si) => (
        <section className="hc-section" key={section.heading}>
          <h2 className="hc-section-head">
            {section.icon && <img className="hc-section-icon" src={`/${section.icon}`} alt="" />}
            <span>{section.heading}</span>
          </h2>
          {section.intro && <p className="sp-p hc-section-intro">{section.intro}</p>}
          <div className="hc-collapsibles">
            {section.options.map((opt, oi) => {
              const key = `${si}-${oi}`;
              return (
                <CollapsibleSection
                  key={opt.title}
                  id={`hc-billing-${key}`}
                  title={opt.title}
                  open={open.has(key)}
                  onToggle={() => toggle(key)}
                >
                  {/* This article marks its own bold run-in leads, so the shared
                      colon heuristic is switched off here. */}
                  <Blocks body={opt.body} leadBold={false} />
                </CollapsibleSection>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// The Help Center landing page: the real one is a grid of topic categories, each
// listing its articles.
function HelpIndex({ groups }) {
  return (
    <>
      <h1 className="sp-title">Help Center</h1>
      <p className="sp-lede">
        Browse by topic, or check the <Link to="/p/faq">FAQ</Link> for the quickest answer.
      </p>
      <div className="sp-index">
        {groups.map((g) => (
          <section className="sp-index-card" key={g.title}>
            <h2 className="sp-index-h">{g.title}</h2>
            <ul className="sp-index-list">
              {g.items.map((i) => (
                <li key={i.to}><Link to={i.to}>{i.label}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}


// Renders every page the footer links to. The built-in copy in
// utils/legalContent.js is the default; an admin edit in Admin → Site Settings
// still overrides it (SRS §6.10), and it renders through the same block parser.
export default function StaticPage() {
  const { slug } = useParams();
  const built = CONTENT[slug] || null;
  // Held separately from `built` so an admin edit can win without pretending to
  // be one of the built-in pages.
  const [override, setOverride] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setOverride(null);
    // /p/faq draws its heading from CONTENT['what-is-netflix'] rather than from
    // its own entry, so the tab has to follow the heading. Left as built.title it
    // read "Frequently Asked Questions" above a page whose H1 said "What is
    // Netflix?" - and "StreamFlix" is not the brand this site uses either, so it
    // is matched to the masthead instead.
    const title = override?.title || (slug === 'faq' ? CONTENT['what-is-netflix']?.title : built?.title) || slug;
    document.title = `${title} | Newflix`;
    API.get('/settings')
      .then(({ data }) => {
        const sp = (data.settings?.staticPages || []).find((p) => p.slug === slug);
        if (sp && (sp.title || sp.content)) {
          setOverride({ title: sp.title || built?.title || slug, body: sp.content || '' });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const title = override?.title || built?.title || 'Page Not Found';
  const isFaqArticle = slug === 'faq' && !override;
  // The footer's "Ways to Watch" link opens the Help Center's supported-devices
  // article (node/14361). It is drawn by the same two-column article layout as
  // the FAQ - prose on the left, a "Related Articles" card on the right - but
  // with the copy in legalContent.js rather than the FAQ's own body, and with
  // un-underlined headings, which is how that article sets its section titles.
  const isDevicesArticle = slug === 'ways-to-watch' && !override;
  // help.netflix.com/en/node/134094. Same Help Center article shell as the FAQ
  // and the supported-devices article, with one extra row above the title: the
  // "Currently viewing information for" country selector.
  const isCorporateArticle = slug === 'corporate-information' && !override;
  // help.netflix.com/en/node/470. Same Help Center article shell as the FAQ and
  // the supported-devices article (title above .pane-wrapper, prose left,
  // "Related Articles" right, "Was this article helpful?" under the prose) -
  // but its body is a set of collapsible option sections rather than flat prose,
  // so it renders <SignInOptions /> instead of a single <Blocks> run.
  const isSignInArticle = slug === 'sign-in-help' && !override;
  // profiles / billing-and-payments / downloads - see PLAIN_HELP_ARTICLES above.
  const isPlainHelpArticle = !override && PLAIN_HELP_ARTICLES.has(slug);
  // Profiles / Billing / Downloads join the corporate-information article in
  // showing the country box above the title and the gate line under it.
  const isCountryGated = isCorporateArticle
    || (!override && COUNTRY_GATED_ARTICLES.has(slug));
  // node/470 writes its body as one flat run of collapsible option sections;
  // node/41049 groups its own under `## ` headings, which travel on `sections`
  // instead. A page opts in purely by carrying the matching array in its
  // content, which is why both are keyed off `built` rather than off the slug.
  const hasCollapsibleOptions = (isSignInArticle || isPlainHelpArticle) && built?.options?.length > 0;
  // node/41049 is the only article that carries `sections` today; the guard keeps
  // an admin override that drops the array from rendering an empty shell.
  const hasArticleSections = !override && Array.isArray(built?.sections) && built.sections.length > 0;
  // help.netflix.com/en/node/54816. Its four section headings are <h3> at
  // 1.4rem/1.3 - the reference has no <h2> in this article at all - so the copy is
  // written with "### " and the h3 needs this article's own metrics. Scoped by
  // class rather than by rewriting the shared .sp-h3, which the sign-in device
  // panels and the privacy document both rely on at 18px.
  const isDownloadsArticle = slug === 'downloads' && !override;
  const isPrivacyPage = slug === 'privacy';
  // /legal/notices is the same black-header + white-document shell as Privacy
  // (body class "page-article legal-document"), but it has NO section rail: its
  // .pane-wrapper holds only the prose column, so it renders single-width.
  const isNoticesPage = slug === 'legal-notices';
  // /legal/termsofuse is that same shell too - black header, white document,
  // Print toolbar, LegalFooter - and it is also single-width: its .pane-wrapper
  // holds only the prose column, with no section rail.
  const isTermsPage = slug === 'terms';
  const isLegalDoc = isPrivacyPage || isNoticesPage || isTermsPage;
  const isHelpDocument = isFaqArticle || isDevicesArticle || isCorporateArticle || isSignInArticle || isPlainHelpArticle || isLegalDoc;
  const article = CONTENT['what-is-netflix'];
  const body = isFaqArticle ? article.body : (override ? override.body : (built?.body || ''));
  // An admin override replaces the whole page, so it also drops the built-in
  // Related Articles strip rather than pairing edited copy with default links.
  // /p/faq carries no `related` of its own - the real FAQ page's rail belongs to
  // the "What is Netflix?" article it embeds, so that is where it is read from.
  const related = override || isPrivacyPage
    ? []
    : (isFaqArticle ? article.related : (built?.related || []));
  const interactive = override ? null : (built?.interactive || null);
  const index = override ? null : (built?.index || null);
  // Memoized: PrivacyTree's scrollspy effect depends on this list's identity, and
  // a fresh array every render would tear down and re-add the listener each time.
  // The body is parsed ONCE and the resulting blocks plus the index-keyed id map
  // are shared by the rail and the article, so the two can never disagree.
  const privacyDoc = useMemo(() => {
    if (!isPrivacyPage || override) return null;
    const parsed = parseBlocks(body);
    return { blocks: parsed, anchorIds: buildAnchorIds(parsed, 'privacy') };
  }, [isPrivacyPage, override, body]);
  const privacySections = useMemo(
    () => (privacyDoc ? buildPrivacyTree(privacyDoc.blocks, privacyDoc.anchorIds) : []),
    [privacyDoc],
  );
  const isHelp = HELP_SLUGS.has(slug);
  const missing = !built && !override;
  // Below 900px the section rail becomes a drawer behind a hamburger, matching
  // the reference. It is open state only - there is nothing to remember across
  // a route change, and the rail re-derives everything from `privacySections`.
  const [railOpen, setRailOpen] = useState(false);
  useEffect(() => { setRailOpen(false); }, [slug]);

  // The country the corporate article is being read for. The reference resolves
  // it from the reader's region; here it is remembered across visits, and the
  // page re-reads it if another tab changes it.
  const [country, setCountryState] = useState(getCountry);
  useEffect(() => {
    const onChange = (e) => setCountryState(e.detail);
    window.addEventListener('sf-country-changed', onChange);
    return () => window.removeEventListener('sf-country-changed', onChange);
  }, []);
  const chooseCountry = (name) => {
    setCountryState(name);
    setCountry(name);
  };

  // Escape closes the drawer, and the page behind it must not scroll while it
  // is open. Both are inert above 900px, where the rail is a normal column.
  useEffect(() => {
    if (!railOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setRailOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [railOpen]);

  return (
    <div className={`static-page${isHelpDocument ? ' hc-page' : ''}`}>
      {isHelpDocument ? <HelpCenterHeader /> : <Navbar />}
      <main className={`sp-shell${isHelpDocument ? ' hc-shell' : ''}${isLegalDoc ? ' hc-privacy-shell' : ''}`}>
        {isHelpDocument ? (
          <div className="hc-toolbar">
            <nav className="sp-crumbs hc-crumbs" aria-label="Breadcrumb">
              {/* The live page draws a 16px inline SVG arrow, not the "←"
                  character, so the glyph sits 4px off the label
                  (.breadcrumb a .breadcrumb-arrow{margin-right:4px}). */}
              <Link to="/p/help-center">
                <svg className="hc-crumb-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.81 8.74697H13.9966V7.24697H4.81095L7.52932 4.52961L6.46886 3.46875L2.46959 7.46654C2.32891 7.60716 2.24985 7.79791 2.24982 7.99683C2.24978 8.19574 2.32876 8.38652 2.46939 8.5272L6.46866 12.528L7.52952 11.4675L4.81 8.74697Z" fill="currentColor" />
                </svg>
                <span>Back to Help Home</span>
              </Link>
            </nav>
            {isLegalDoc && (
              <div className="hc-toolbar-actions">
                {/* Only rendered as a control below 900px, where the rail is a
                    drawer; above that the rail is always on screen. The Legal
                    Notices page has no rail, so the hamburger stays hidden there
                    and the Print button is the only control in this group. */}
                <button
                  type="button"
                  className="hc-rail-toggle"
                  aria-expanded={railOpen}
                  aria-controls="hc-privacy-rail"
                  aria-label={railOpen ? 'Close section menu' : 'Open section menu'}
                  onClick={() => setRailOpen((v) => !v)}
                >
                  <span aria-hidden="true" />
                </button>
                <button type="button" className="hc-print" onClick={() => window.print()}>
                  {/* The reference's own printer path, at its native 24x24. */}
                  <svg className="hc-print-ico" width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                      <path d="M19,8 L5,8 C3.34,8 2,9.34 2,11 L2,17 L6,17 L6,21 L18,21 L18,17 L22,17 L22,11 C22,9.34 20.66,8 19,8 Z M16,19 L8,19 L8,14 L16,14 L16,19 Z M19,12 C18.45,12 18,11.55 18,11 C18,10.45 18.45,10 19,10 C19.55,10 20,10.45 20,11 C20,11.55 19.55,12 19,12 Z M18,3 L6,3 L6,7 L18,7 L18,3 Z" fill="currentColor" fillRule="nonzero" />
                    </g>
                  </svg>
                  {/* .hidden-mobile drops the label below 600px on the live page. */}
                  <span className="hc-print-label">Print</span>
                </button>
              </div>
            )}
          </div>
        ) : isHelp && (
          <nav className="sp-crumbs" aria-label="Breadcrumb">
            <Link to="/p/help-center">Help Center</Link>
            <span aria-hidden="true">/</span>
            <Link to="/p/help-center">Back to Help Home</Link>
          </nav>
        )}

        {missing && (
          <>
            <h1 className="sp-title">Page Not Found</h1>
            <p className="sp-p">
              This page does not exist. Try the <Link to="/p/help-center">Help Center</Link>,
              the <Link to="/p/faq">FAQ</Link>, or head back to <Link to="/browse">Browse</Link>.
            </p>
          </>
        )}

        {!missing && index && <HelpIndex groups={index} />}

        {!missing && !index && (
          <>
            {isNoticesPage || isTermsPage ? (
              /* Single-column document: no rail on this page, so the prose runs
                 the full container width. Headings are <h3> (sprinklr h3 ->
                 margin-top:40px), which is what Blocks emits for a "###" line. */
              <div className="hc-legal hc-legal-single">
                <article className="hc-article hc-privacy-article">
                  <h1 className="sp-title">{title}</h1>
                  <Blocks body={body} />
                  {!isTermsPage && <NoticesPanel items={built?.notices} />}
                  {built?.lastUpdated && (
                    <p className="sp-p np-last-updated">
                      <strong>Last Updated:</strong> {built.lastUpdated}
                    </p>
                  )}
                </article>
              </div>
            ) : isPrivacyPage ? (
              <div className="hc-legal">
                {/* The real page puts the sidebar and the article side by side
                    inside .pane-wrapper: a 68% right column of prose and a 32%
                    left rail of section links. Below 900px the rail leaves the
                    flow and becomes the drawer the hamburger opens. */}
                {railOpen && (
                  <button
                    type="button"
                    className="hc-rail-scrim"
                    aria-label="Close section menu"
                    onClick={() => setRailOpen(false)}
                  />
                )}
                <aside
                  className={`hc-legal-rail${railOpen ? ' is-open' : ''}`}
                  id="hc-privacy-rail"
                >
                  <div className="hc-rail-inner">
                    <nav className="hc-privacy-toc" aria-label="Privacy statement sections">
                      <PrivacyTree nodes={privacySections} onNavigate={() => setRailOpen(false)} />
                    </nav>
                  </div>
                </aside>
                <article className="hc-article hc-privacy-article">
                  <h1 className="sp-title">{title}</h1>
                  <Blocks
                    body={body}
                    blocks={privacyDoc?.blocks}
                    anchorPrefix="privacy"
                    anchorIds={privacyDoc?.anchorIds}
                  />
                </article>
              </div>
            ) : isFaqArticle || isDevicesArticle || isCorporateArticle || isSignInArticle || isPlainHelpArticle ? (
              /* The Help Center article layout, measured off the live page. The
                 h1 is a SIBLING of the two panes, not the first thing in the
                 prose column: on the reference it spans the 68% column and
                 sits above .pane-wrapper, which is what leaves the rail starting
                 beside the opening paragraph rather than beside the title. */
              <>
                {isCountryGated && <CountrySelector value={country} onChange={chooseCountry} />}
                <h1 className="sp-title hc-doc-title">{isFaqArticle ? article.title : title}</h1>
                {/* The gate line the reference prints directly under the title on
                    every country-gated article. It is 16px regular weight and
                    sits on the 16px paragraph gap, not a heading. */}
                {isCountryGated && (
                  <p className="hc-country-gate">A country must be selected to view content in this article.</p>
                )}
                <div className="hc-layout">
                  <article className={`hc-article${isDownloadsArticle ? ' hc-article-downloads' : ''}`}>
                    {hasArticleSections ? (
                      /* node/41049 groups everything under three icon-bearing
                         section headings; the article body itself is empty, so
                         nothing is rendered above them. */
                      <ArticleSections sections={built.sections} />
                    ) : hasCollapsibleOptions ? (
                      <>
                        {/* The intro line is an ordinary body paragraph, NOT
                            .sp-lede: that class is #b3b3b3, the muted grey the
                            dark /p/ page uses, and it would be near-invisible on
                            the white article. <Blocks> gives the .sp-p metrics
                            the rest of the article already uses. */}
                        <Blocks body={body} />
                        <CollapsibleOptions options={built.options} />
                      </>
                    ) : (
                      /* The Sprinklr markup is <h2 class="export-block__parent">
                         <span>Heading</span></h2> on THIS article - there is no
                         <u> around the span, so "Get Started" renders with no
                         rule under it. Only the legal-document article carries
                         the underlined form. plainHeadings opts the FAQ, the
                         supported-devices article and the corporate-information
                         article out of the <u>; leaving it off here is what put
                         a line under "Get Started" that the reference does not
                         have.
                         leadBold is off for node/54816: its bullets open with
                         "iPhone, iPad, Android, or Fire devices:" and
                         "Chromebook:", and the shared colon heuristic was
                         bolding those run-ins when the reference leaves them
                         regular - only the spr-ui-ref words ("My Netflix",
                         "Downloads", "Play") are bold there. */
                      <Blocks
                        body={body}
                        articleImages={isFaqArticle}
                        plainHeadings={isFaqArticle || isDevicesArticle || isCorporateArticle}
                        leadBold={!isDownloadsArticle}
                      />
                    )}
                    <ArticleFeedback />
                  </article>
                  <aside className="hc-related" aria-label="Related articles">
                    <h2>Related Articles</h2>
                    <ul>
                      {related.map((item) => {
                        const RelatedLink = item.href ? 'a' : Link;
                        const linkProps = item.href
                          ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                          : { to: item.to };
                        return (
                          <li key={item.label}>
                            <RelatedLink {...linkProps}>
                              {/* The reference's own 24x24 document glyph, drawn as
                                  two filled rules inside a stroked page outline. */}
                              <svg className="hc-related-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                                <rect x="8" y="7" width="8" height="2" fill="currentColor" />
                                <rect x="8" y="11" width="5" height="2" fill="currentColor" />
                                <path
                                  fillRule="evenodd" clipRule="evenodd"
                                  d="M18 4H6V20H18V4ZM4 2V22H20V2H4Z"
                                  fill="currentColor"
                                />
                              </svg>
                              <span>{item.label}</span>
                            </RelatedLink>
                          </li>
                        );
                      })}
                    </ul>
                  </aside>
                </div>
              </>
            ) : (
              <>
                <h1 className="sp-title">{title}</h1>
                {interactive === 'speed' && <SpeedTestPanel />}
                {interactive === 'cookies' && <CookiePreferencesPage />}
                {slug === 'faq' && !override ? <FaqAccordion body={body} /> : <Blocks body={body} />}

                {related.length > 0 && (
                  <section className="sp-related">
                    <h2 className="sp-h2">Related Articles</h2>
                    <div className="sp-related-grid">
                      {related.map((r) => {
                        // An entry may point off-site with `href` instead of
                        // `to` (the gift-card article). Rendering that as a
                        // router <Link> gave it an undefined `to` and an
                        // undefined key, so React warned and the click went
                        // nowhere. Key off the label, which is always present.
                        const Card = r.href ? 'a' : Link;
                        const cardProps = r.href
                          ? { href: r.href, target: '_blank', rel: 'noopener noreferrer' }
                          : { to: r.to };
                        return (
                          <Card key={r.label} {...cardProps} className="sp-related-card">{r.label}</Card>
                        );
                      })}
                    </div>
                  </section>
                )}

                {isHelp && (
                  <p className="sp-more">
                    Need more help? <Link to="/p/contact">Contact Us</Link>
                  </p>
                )}
              </>
            )}
          </>
        )}

        {!isHelpDocument && <Link to="/browse" className="btn-red sp-back">Back to Browse</Link>}
      </main>
        {isLegalDoc ? <LegalFooter /> : (isHelpDocument ? <HelpCenterFooter /> : <Footer />)}
    </div>
  );
}

