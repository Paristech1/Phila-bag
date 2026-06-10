# PhilaBag — Security Review & Hardening Report

**Date:** 2026-06-10
**Scope:** Full static site (HTML/CSS/JS) in this repository, deployed on Netlify
**Branch:** `claude/site-vulnerability-scan-alsgbr`
**Author:** Automated security review (Claude Code)

This document is written to *teach*, not just to record. Each section explains not only
*what* we found and changed, but *why* we made each decision and what we weighed against
the alternatives. If you read it top to bottom you should come away understanding how to
think about the security of a static website, not just what buttons we pushed.

---

## 1. Executive summary

PhilaBag is a **static brochure website**: hand-written HTML pages, one stylesheet, a
small vanilla-JS file, and a few third-party social-media embeds (Facebook, Instagram,
TikTok). It is hosted on **Netlify**, and the contact forms use **Netlify Forms**. There
is **no backend, no database, no login, and no server-side code that we control.**

That architecture matters enormously, because **most classic web vulnerabilities simply
cannot exist here.** There is no SQL to inject into, no session to hijack, no server
endpoint to exploit, no secrets stored in the code. The scan confirmed this: **we found
no exploitable vulnerabilities.**

What we *did* find were **hardening gaps** — missing safety nets that don't represent an
active break-in path today, but that a professional site should have because they shrink
the blast radius if something *else* ever goes wrong (a future code change, a compromised
third-party script, a malicious ad network, an attacker who tricks a browser). Think of
these as seatbelts and smoke detectors rather than patching a hole a burglar is currently
climbing through.

We patched all of them without changing how the site looks or behaves.

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| F1 | No HTTP security headers / no Content-Security-Policy | Medium | ✅ Patched |
| F2 | Insecure `http://` link to Eventbrite | Low | ✅ Patched |
| F3 | `target="_blank"` links missing `rel="noopener noreferrer"` | Low | ✅ Patched |
| F4 | `.DS_Store` files committed to the repo | Low / Info | ✅ Patched |
| — | Contact form posture, email exposure, third-party SRI | Info | Reviewed, see §5 |

---

## 2. Methodology — how the review was done

### 2.1 Start with a threat model, not a checklist

Before searching for bugs, we asked: *what could an attacker actually do to this site, and
what would they gain?* For a static site the realistic threats are:

1. **Client-side script injection (XSS):** can an attacker get their JavaScript to run in a
   visitor's browser on our domain? That requires the site to take untrusted input and
   write it into the page unsafely.
2. **Supply-chain / third-party risk:** we load scripts from Facebook, Instagram, TikTok,
   and Google. If any of those were compromised, or if a future XSS existed, what could the
   malicious code reach?
3. **Clickjacking:** can an attacker embed our site invisibly inside theirs and trick users
   into clicking things?
4. **Transport / network attacks:** is anything served or linked over plain `http://`,
   where a network attacker could tamper with it?
5. **Information disclosure:** are any secrets, internal paths, or stray files exposed?
6. **Link hygiene / phishing pivots:** `target="_blank"` reverse-tabnabbing, open redirects.

This framing tells us where to spend effort. There is no point hunting for SQL injection on
a site with no SQL.

### 2.2 What we actually searched for

- **Injection sinks:** grepped the JS for the dangerous DOM functions that turn data into
  executable markup — `innerHTML`, `outerHTML`, `document.write`, `eval`, `insertAdjacentHTML`,
  and inline event-handler attributes (`onclick`, `onerror`, `onload`). **Result: none of
  these are used with untrusted input.** The only DOM writes are `classList` toggles and a
  `style.transform` driven by hard-coded values. This is the single most important finding:
  there is no XSS sink.
- **Secrets:** searched tracked files for `.env`, `.pem`, `.key`, `secret`, `credential`,
  API tokens. **Result: none.** `package.json` only defines `npx serve` scripts and pulls in
  no dependencies, so there is no vulnerable-dependency surface either.
- **Transport:** searched for `http://` URLs and mixed content. **Result: one** insecure
  link (F2).
- **Headers / config:** looked for `netlify.toml`, `_headers`, `vercel.json`, or `<meta
  http-equiv>` security directives. **Result: none existed** (F1).
- **Third-party trust:** inventoried every external origin the site loads (scripts, fonts,
  iframes) so any future policy wouldn't break them. (This inventory became the CSP
  allowlist — see §4.1.)
- **Link hygiene:** found `target="_blank"` anchors missing `rel="noopener"` (F3).
- **Stray files:** found committed macOS `.DS_Store` metadata (F4).

### 2.3 Tooling

This was a manual source review using file search and pattern matching (ripgrep-style
greps) across the repository, plus reasoning about the deployment platform. No automated
scanner was run against a live URL, because the meaningful issues here live in the source
and the deploy configuration, not in runtime behavior.

---

## 3. Findings in detail

### F1 — No HTTP security headers / no Content-Security-Policy (Medium)

**What:** The site sent **none** of the standard browser-protection headers. There was no
`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Strict-Transport-Security`, or `Permissions-Policy`. No `netlify.toml` or `_headers` file
existed to set them.

**Why it matters (the real-world attack):**

- **Clickjacking:** Without `X-Frame-Options`/`frame-ancestors`, any other website can load
  PhilaBag inside an invisible `<iframe>` over their own page and trick a visitor into
  clicking your buttons/links while they think they're clicking something else.
- **No CSP = no blast-radius control.** A Content-Security-Policy is a browser-enforced
  allowlist of *where code, styles, frames, and connections are allowed to come from*. The
  site loads third-party JavaScript from Facebook, Instagram, and TikTok. If one of those
  scripts were ever compromised (it has happened to major providers), or if a future code
  change accidentally introduced an XSS hole, there was **nothing** stopping injected code
  from beaconing your visitors' data to an attacker's server or loading more malware. CSP is
  the seatbelt: it doesn't prevent the crash, it limits the damage.
- **MIME sniffing, referrer leakage, downgrade attacks:** the other headers each close a
  smaller, well-understood gap (see §4.2).

This is the highest-value finding because a single config file closes all of these at once.

### F2 — Insecure `http://` link to Eventbrite (Low) — `index.html:61`

**What:** The "Fathers Deserve Healing" event button linked to
`http://eventbrite.com/...` (plain HTTP).

**Why it matters:** A visitor who clicks an `http://` link makes an unencrypted first
request. A network attacker (hostile Wi-Fi, compromised router) can intercept that request
and redirect the user to a **phishing clone** of Eventbrite before the HTTPS upgrade ever
happens. It also looks unprofessional and can trigger browser "Not Secure" warnings.

### F3 — `target="_blank"` links missing `rel="noopener noreferrer"` (Low)

**Locations:** the Instagram/TikTok embed boilerplate anchors in `index.html` and
`news.html` (six links total).

**Why it matters (reverse tabnabbing):** When you open a link with `target="_blank"`, the
newly opened page receives a JavaScript reference back to your page via `window.opener`.
Without `rel="noopener"`, that other page can do `window.opener.location = "evil-phishing-
site"` and **silently navigate your original tab** to a malicious look-alike while the user
is looking at the new tab. `noreferrer` additionally stops the URL being leaked in the
Referer header. Modern browsers default to `noopener` for `target="_blank"`, so this is
low-risk today, but adding it explicitly protects older browsers and is the documented best
practice. (Your footer social icons already did this correctly — we matched that pattern.)

### F4 — `.DS_Store` files committed to the repo (Low / Informational)

**What:** `.DS_Store` and `images/.DS_Store` (macOS Finder metadata) were tracked in git and
therefore deployed to the live site.

**Why it matters:** `.DS_Store` files leak a **listing of filenames** in a directory —
including files you may not have linked publicly. Attackers routinely scan for them to map a
site's structure. They're also pure noise in version control. Low impact here, but there's
no reason to ship them.

---

## 4. What we changed, and why we chose each route

### 4.1 The Content-Security-Policy (the hard part) — `netlify.toml`

This was the only change with real "could I break the site?" risk, so it got the most
thought. Here is the policy we shipped and the reasoning behind every decision.

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'self';
form-action 'self';
img-src 'self' data: https:;
font-src 'self' https://fonts.gstatic.com data:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
script-src 'self' 'unsafe-inline' https://connect.facebook.net https://www.instagram.com https://www.tiktok.com;
frame-src 'self' https://www.facebook.com https://web.facebook.com https://staticxx.facebook.com https://www.instagram.com https://www.tiktok.com;
connect-src 'self' https://connect.facebook.net https://www.facebook.com https://graph.facebook.com https://www.instagram.com https://www.tiktok.com;
upgrade-insecure-requests
```

**The key insight that makes this safe: CSP does not apply inside cross-origin iframes.**
When the Instagram/TikTok/Facebook scripts run, they replace their placeholder blockquotes
with `<iframe>`s pointing at *their own* domains. Everything *inside* those iframes (their
images, their scripts, their styles, loaded from `*.cdninstagram.com`, `*.fbcdn.net`,
`*.tiktokcdn.com`, etc.) is governed by **their** CSP, not ours. So our policy only has to
allow two things for embeds to work:
1. their **embed script** to load in our page → `script-src`, and
2. their **iframe** to be embedded → `frame-src`.

That's why you don't see a giant list of provider CDN domains in our policy — we don't need
them. This is the difference between a CSP that breaks embeds and one that doesn't.

**Per-directive decisions and the principle behind them.** Our guiding rule was: *be strict
on the directives that enable code execution or data theft; be relaxed on the ones that
don't.*

- `default-src 'self'` — the backstop: anything not explicitly listed may only load from our
  own origin.
- `script-src 'self' 'unsafe-inline' <fb/ig/tiktok>` — only our own scripts plus the three
  named embed providers may execute. **Why `'unsafe-inline'`?** The site has two small inline
  `<script>` blocks (the contact-form submit handlers in `index.html` and `contact.html`).
  The stricter alternative is to compute a SHA-256 hash of each script and allowlist the
  hash instead. We chose `'unsafe-inline'` deliberately for two reasons: (1) your explicit
  priority was *do not break functionality*, and `'unsafe-inline'` guarantees both our inline
  scripts and any inline injection the embed SDKs perform keep working; (2) the residual risk
  of `'unsafe-inline'` is *script injection*, but we **verified there is no untrusted-input
  DOM sink anywhere on the site**, so there is no realistic path to inject a script in the
  first place. The marginal security cost is therefore low. **This is the one knowingly-soft
  spot, and §6 explains how to harden it later with hashes.**
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — `'unsafe-inline'` here is
  **unavoidable**: the pages use 150+ inline `style="..."` attributes. Removing all of them
  to use nonces/hashes would be a large, risky refactor far outside a security pass, and
  inline *styles* are a much weaker vector than inline *scripts*. `fonts.googleapis.com` is
  the Google Fonts stylesheet.
- `font-src 'self' https://fonts.gstatic.com data:` — the actual font files come from
  `fonts.gstatic.com`.
- `img-src 'self' data: https:` — **deliberately permissive.** Allowing any HTTPS image
  guarantees no embed thumbnail or future image can ever be blocked, while still forbidding
  `http:` images (which would be mixed content). Images can't execute code, so a wide
  `img-src` is a low-risk trade that buys a lot of breakage-proofing. This is a concrete
  example of the "relax the low-risk directives" principle.
- `frame-src` — the allowlist of iframe origins the embeds actually create (Facebook web +
  static subdomains, Instagram, TikTok), plus `'self'` for the same-origin PDF viewer on
  `impact-report.html`.
- `connect-src` — restricts where `fetch`/XHR/beacons may send data (the real exfiltration
  channel), so we keep this *tight*: our own origin (the Netlify form POST goes to `/`) plus
  the provider endpoints the SDKs talk to.
- `object-src 'none'` — blocks legacy `<object>`/`<embed>` plugin vectors entirely. The PDF
  uses an `<iframe>`, not `<object>`, so this is free.
- `base-uri 'self'` — stops an injected `<base>` tag from silently re-pointing every relative
  URL on the page to an attacker's domain.
- `form-action 'self'` — forms may only submit to our own origin (where Netlify intercepts
  them). Stops an injected form from posting credentials elsewhere.
- `frame-ancestors 'self'` — the modern anti-clickjacking control; only our own origin may
  frame our pages.
- `upgrade-insecure-requests` — auto-upgrades any stray `http://` subresource to `https://`.

**Why a single enforced policy for all pages (vs. report-only, vs. per-page tiering)?** You
chose a single enforced policy, and it fits this site: only `index.html` and `news.html`
carry the social embeds, but applying the same embed-friendly policy everywhere costs
nothing (the extra allowlist entries simply go unused on the other seven pages) and keeps
the configuration in one place that's easy to reason about. We did *not* use *Report-Only*
mode because Report-Only enforces nothing — it would only monitor, leaving the gap open.

### 4.2 The other security headers — `netlify.toml`

These five carry **no breakage risk** and each closes a specific gap:

- **`X-Frame-Options: SAMEORIGIN`** — clickjacking protection for older browsers that don't
  honor `frame-ancestors`. Belt-and-suspenders with the CSP directive.
- **`X-Content-Type-Options: nosniff`** — stops browsers from "guessing" that, say, a text
  file is actually JavaScript and executing it.
- **`Referrer-Policy: strict-origin-when-cross-origin`** — when a visitor clicks out to a
  third party, send only your domain, never the full path/query. Prevents leaking which page
  they were on.
- **`Strict-Transport-Security: max-age=31536000; includeSubDomains`** — tells the browser
  to *only ever* use HTTPS for this domain for the next year, defeating downgrade attacks.
- **`Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=()`** —
  proactively disables powerful browser APIs the site never uses, so injected/embedded code
  can't quietly request them.

**Why `netlify.toml` rather than `<meta http-equiv>` tags?** Three reasons: (1) several of
these protections — HSTS and `frame-ancestors`/`X-Frame-Options` — **cannot** be set from a
`<meta>` tag at all; they must be real HTTP response headers. (2) One config file covers all
nine pages; meta tags would have to be copy-pasted into every page and kept in sync. (3) On
Netlify, `netlify.toml` is the native, well-supported mechanism. (`_headers` would work too;
we chose `netlify.toml` because it lets us document each header inline.)

### 4.3 The smaller fixes

- **F2 — Eventbrite link:** changed `http://eventbrite.com/...` → `https://www.eventbrite.com/...`
  in `index.html`. One-line, no behavior change.
- **F3 — `rel="noopener noreferrer"`:** added to the six embed anchors in `index.html` and
  `news.html`. These are ordinary links inside the provider boilerplate; adding `rel` has
  zero effect on whether the embeds render.
- **F4 — `.DS_Store`:** untracked with `git rm --cached` (the files stay on disk, they're
  just no longer in git/deploys) and added `.DS_Store` / `**/.DS_Store` to `.gitignore` so
  they can't sneak back in. (The old `.gitignore` contained only an unused `Phila-bag/`
  entry, which we replaced with meaningful rules.)

---

## 5. What was NOT a problem (and why)

Being explicit about what we *cleared* is as useful as the findings:

- **No SQL injection / no server-side code:** there is no backend in this repo to attack.
- **No XSS sink:** the JavaScript never writes untrusted input into the DOM via
  `innerHTML`/`eval`/`document.write`/inline handlers. This is what makes the CSP
  `'unsafe-inline'` trade-off acceptable.
- **No secrets / no vulnerable dependencies:** no `.env`, keys, or tokens are committed, and
  `package.json` installs nothing (only `npx serve` scripts), so there is no dependency CVE
  surface.
- **Contact forms:** good posture already. They use Netlify Forms with a **honeypot**
  (`bot-field`) for spam, and a visible "don't include sensitive info" notice. There's no
  CSRF token, which is *fine* for a public, unauthenticated contact form (there's no
  authenticated action to forge). `form-action 'self'` now hardens this further.
- **Email exposure:** `philabagnp@gmail.com` is in plaintext on the contact page. This is a
  minor scraping/spam trade-off inherent to publishing a contact address, not a
  vulnerability. Left as-is intentionally.
- **Third-party scripts without SRI:** the Facebook/Instagram/TikTok loaders can't use
  Subresource Integrity hashes because they're intentionally dynamic (the provider updates
  them). The correct mitigation for these is exactly the CSP allowlist we added, not SRI.

---

## 6. Residual risk & recommended future hardening

None of these are urgent; they're the next rungs on the ladder if you want to keep tightening.

1. **Replace `script-src 'unsafe-inline'` with hashes.** Move the two inline form scripts to
   `script.js`, *or* compute their `sha256-…` hashes and list those in `script-src` (dropping
   `'unsafe-inline'`). This is the single biggest CSP upgrade. Test the embeds afterward — if
   a provider SDK injects an inline script you'll need to add its hash or restore
   `'unsafe-inline'`.
2. **Tighten `img-src`** from `https:` to an explicit allowlist once you've confirmed exactly
   which image origins the embeds use in production.
3. **HSTS preload:** once you're confident the site is HTTPS-only forever, bump HSTS to
   `max-age=63072000; includeSubDomains; preload` and submit to hstspreload.org.
4. **CSP reporting:** add a `report-to`/`report-uri` endpoint to collect violation reports,
   so you learn about problems (or attacks) in the field.
5. **Reduce inline styles over time** so `style-src 'unsafe-inline'` can eventually be dropped
   too.

---

## 7. Verification checklist

**Local (already done before pushing):**
- [x] All nine HTML pages still serve and parse; no broken local asset references.
- [x] Edits were limited to one link + six `rel` attributes; form and embed markup otherwise
      unchanged.
- [x] `netlify.toml` is valid TOML.
- [ ] *Note:* a local `serve`/`http.server` does **not** apply Netlify headers — that's
      expected; verify them after deploy.

**Post-deploy (please run once Netlify publishes the branch):**
1. `curl -I https://<your-site>/` → confirm `Content-Security-Policy`, `X-Frame-Options`,
   `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and
   `Permissions-Policy` are all present. (Or paste the URL into https://securityheaders.com.)
2. **Most important:** open `index.html` and `news.html`, open the browser console, and
   confirm the **Instagram, TikTok, and Facebook embeds render** with **no CSP violation
   errors** in the console.
3. Submit both contact forms (homepage + `contact.html`) → success message appears and the
   entry shows up in the Netlify Forms dashboard.
4. Confirm the Inter/Outfit Google Fonts still load, all pages are styled correctly, and the
   PDF viewer on `impact-report.html` displays.

**If an embed regresses (documented fallback — change only the one relevant directive):**
- An embed *iframe* fails to appear → add its origin to `frame-src`.
- An embed *image/thumbnail* is blocked → `img-src` already allows all HTTPS, so this
  shouldn't happen; if it does, confirm the image is HTTPS.
- A provider script throws a CSP error mentioning `eval` (the Facebook SDK occasionally
  needs it) → add `'unsafe-eval'` to `script-src`.
- A provider script is blocked outright → add its origin to `script-src`.

---

## 8. Summary of changed files

| File | Change |
|------|--------|
| `netlify.toml` | **New.** CSP + 5 security headers for all routes. |
| `SECURITY_REVIEW.md` | **New.** This report. |
| `index.html` | Eventbrite link → HTTPS; `rel="noopener noreferrer"` on 3 embed links. |
| `news.html` | `rel="noopener noreferrer"` on 3 embed links. |
| `.gitignore` | Replaced unused rule with `.DS_Store` ignore rules. |
| `.DS_Store`, `images/.DS_Store` | Untracked (removed from git, kept on disk). |

No visual or behavioral change to the site. All protections are additive.
