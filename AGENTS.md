# Thruk website maintenance

## Scope and sources

- This repository is the public VitePress website for www.thruk.org
- Requires `THRUK_SOURCE` to point to a Thruk repository root. Usually this is a clone of https://github.com/sni/thruk
- Canonical monitoring docs live in `$THRUK_SOURCE/docs`. Edit them there, not in the website's generated copy.
- Documentation preview from the Thruk checkout delegates here through `THRUK_ORG_SRC`. Do not add a second VitePress config, npm manifest or docs-build workflow to Thruk.
- Public website pages live in `src/pages/`, release highlights in `src/whatsnew/`, and the screenshot gallery in `src/screenshots/`.
- `scripts/build_site.mjs` validates and stages sources into `.build/`. VitePress writes `.vitepress/dist/`.
- Website and Markdown-rendering checks belong in this repository's `scripts/` and `test/`. Thruk owns only its Perl tests under `t/`; do not put JavaScript checks in its docs tree.

## Rules

- Do not edit generated output, caches or `node_modules/`.
- Do not add useless or trivial tests.
- Ask before adding new dependencies.

## Content and compatibility

- Write clear STE80-style Markdown: short sentences, active voice, one idea per sentence.
- Preserve technical facts, commands, examples, warnings, historical release details and complete source data.
- Do not reintroduce AsciiDoc, Jekyll, Liquid
- Use supported VitePress containers: `info`, `tip`, `warning`, `danger` or `details`. `important`, `note` and `caution` render incorrectly.
- Fence code and configuration examples. Require a page title and check rendered links and anchors.
- Preserve public `.html` URLs with `cleanUrls: false`. Keep legacy anchors when changing headings.
- Version hints use coloured `Badge` components without a trailing dot. Deprecation hints use warning badges.

## Changelog and release metadata

- Read revision history from `$THRUK_SOURCE/Changes`. Do not maintain a website copy.
- Omit the file-description preamble. Keep every release and every change.
- Move each entry's calendar date beside its version, without time or timezone. Preserve the original calendar day.
- Give the date `ignore-header` so it does not appear in the right-hand outline.
- Remove the entry header and exactly ten leading spaces from change lines. Preserve nested indentation and remaining text.
- Keep legacy version anchors and link to a matching What's New page only when one exists.
- Release metadata comes from `.env`. Show the same Stable / Nightly / Next release plan on the homepage and download page.
- There is no news feed. Do not restore feed links or generation.

## Branding and navigation

- Thruk's main colour is blue. Support light and dark mode, with a lighter homepage glow in light mode.
- Copy logos from `$THRUK_SOURCE/themes/themes-available/`. Do not keep duplicate canonical artwork here.
- Use `Light/images/thruk.svg` for the shared homepage symbol, and each theme's `logo.svg` for the navigation wordmark.
- Keep theme-aware favicons. Showcase logos on fixed light and dark panels with borders and separate download links.
- Homepage feature icons are monochrome and sit in the cards' top-right corners.
- Keep search on the right and breadcrumbs on content pages.
- Define Downloads and Development menus once in `scripts/nav.mts`. Reuse them in the corresponding sidebars.
- Top menu labels link to their first item. Keep a keyboard-accessible dropdown toggle as well.
- Sidebars contain only internal links. Do not list Livestatus samples; use Naemon's Livestatus reference instead.
- Offer both SVG and canonical theme PNG downloads on the logo page.
- Keep Agents, Node Control and Business Process in the top Documentation menu.
- Keep plugin guides together under Plugins and views. Label REST API Examples distinctly from REST API.
- Use responsive boxed previews for screenshots and release highlights.

## Images and accessibility

- Check source, rendered pages, CSS and examples before deleting an image. A reference in a documentation example still counts.
- Linked content images open in a native closable dialog. Preserve fallback links, downloads, modified clicks and external-link behaviour.
- Size popup images explicitly so SVGs enlarge rather than falling back to a small intrinsic size. Preserve logo background contrast.
- Prefer existing VitePress features and platform APIs. Do not add a dependency for a few lines of code.

## Verification

Use Node.js 20 or later. Export the source path for builds and tests:

```sh
export THRUK_SOURCE=/src/thruk
npm ci
npm run docs:build
npm test
git diff --check
git diff --cached --check
```

