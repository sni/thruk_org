# Thruk website

This repository builds [thruk.org](https://www.thruk.org) with VitePress.
The monitoring documentation comes from the Thruk repository.

## Build locally

Use Node.js 20 or later and a separate Thruk checkout with the migrated Markdown documentation.
Set `THRUK_SOURCE` to that checkout's repository root. Builds require this variable; there is no default source path.

```sh
export THRUK_SOURCE=/src/thruk
npm ci
npm run docs:build
```

The build validates the canonical documentation before staging any pages.
It stops on old source formats, broken links, invalid anchors or other documentation-check errors.
It does not fall back to an AsciiDoc renderer.

You can also set the variable for one command:

```sh
THRUK_SOURCE=/src/thruk npm run docs:build
THRUK_SOURCE=/src/thruk npm run docs:dev
```

The checkout must contain the Markdown documentation and the theme logos.
The website owns the Markdown checker in `scripts/docs-check.mjs` and its regression tests in `test/`.
CI checks out `sni/Thruk` separately and sets `THRUK_SOURCE` to that directory.

To preview from the Thruk checkout, run `make -C /src/thruk/docs THRUK_ORG_SRC=/src/thruk_org server`.
That Makefile delegates to this repository's Makefile, sets `THRUK_SOURCE` itself and reuses this website's configuration and dependencies.
If `THRUK_ORG_SRC` is unset, it clones and reuses a temporary `sni/thruk_org` checkout.

## Preview and test

```sh
npm run docs:dev
npm run docs:preview
npm test
```

The development command stages the source before it starts VitePress.
After changes to source files or canonical docs, restart it to stage those changes again.
Run the production build before `docs:preview` or the tests that inspect its output.

For Docker, run `make docker-build` or `make docker-server` with `THRUK_SOURCE` set to an absolute host path.
These targets mount the checkout read-only and set the source path inside the container.

Static output is in `.vitepress/dist/`. Existing `.html` routes do not need server rewrite rules.
Configure the hosting server to serve `404.html` for unknown paths.
Do not publish `.build/`, source files or `node_modules/` as the site output.

## Edit content

- Edit monitoring documentation under `docs/` in the Thruk repository.
- Edit the homepage and other public pages under `src/pages/`.
- Edit release summaries under `src/whatsnew/`.
- Edit the screenshot gallery under `src/screenshots/` and benchmarks in `src/benchmark.md`.
- Keep release metadata in `.env`.
- Edit revision history in `$THRUK_SOURCE/Changes`. The build uses it for the changelog and omits the file-description preamble.

Use Markdown and STE80 prose. Keep instructions short, name the actor and use one term for each thing.
Keep commands, code examples, measurements and historical release facts exact.
Do not add Jekyll templates or AsciiDoc source files.

## Generated files and assets

The build stages content in `.build/`. Do not edit or commit that directory.
Documentation images keep their original download URLs as well as VitePress's generated asset URLs.

Some stock photos are from pexels.com.
Keep source credits when you add or replace images.

The Naglint page documents the local command-line tool. The static site does not run the former PHP upload service.
