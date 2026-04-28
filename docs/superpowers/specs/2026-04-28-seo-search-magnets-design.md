# SEO Search Magnets (Public Pages Only)

Date: 2026-04-28

## Objective

Make SkillForge pages reliably discoverable and indexable by Google and social crawlers, while preventing indexing of private dashboard surfaces.

Scope:
- Main website: `skillforgedigital.com.ng`
- Portal: `portal.skillforgedigital.com.ng`

Non-goals:
- Indexing any authenticated dashboards or private student/staff content.

## Indexing Policy

### Portal (portal.skillforgedigital.com.ng)

**Index allowed (public):**
- `/`
- `/trainee-login/`
- `/trainee-registration/`
- `/trainee-login/forgot-password.html`
- `/trainee-login/reset-password.html`
- `/staffs/` (approved)
- `/staffs/login/`
- `/staffs/registration/`
- `/staffs/login/forgot-password.html`
- `/staffs/login/reset-password.html`
- `/verify/`
- `/404.html` (optional: exclude from sitemap)

**Index blocked (private):**
- `/trainee-dashboard/**`
- `/staffs/director/**`
- `/staffs/hod/**`
- `/staffs/specialist/**`
- `/staffs/marketing/**`
- `/staffs/support/**`
- any other authenticated pages containing user data

Enforcement layers:
1) `robots.txt`: disallow private patterns.
2) `sitemap.xml`: include only index-allowed URLs.
3) `meta robots` on private pages: `noindex,nofollow`.

### Main website (skillforgedigital.com.ng)

**Index allowed:**
- All public marketing pages and academy pages.

Hard requirements:
- Correct canonical URLs.
- No broken internal links.
- Consistent Open Graph + Twitter cards on key pages (home, tracks, academy landing, contact).

## “Search Magnet” Requirements

### 1) Canonical + Metadata Consistency

Portal public pages:
- Every indexed page includes:
  - `<title>` unique and descriptive
  - `<meta name="description">` unique and descriptive
  - `<link rel="canonical" href="...">`
  - `og:title`, `og:description`, `og:image`, `og:url`
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`

Main site pages:
- Canonical must match real URL structure (`/academy/` not `/academic/`).

### 2) Sitemaps

Portal sitemap:
- Only index-allowed public pages.
- Use non-trailing-slash URLs when hosting uses `trailingSlash: false`.
- Exclude `/404.html` from sitemap (optional but recommended).

Main site sitemap:
- Include key marketing pages and academy/certification/track pages.
- Exclude any test pages.

### 3) Robots.txt

Portal robots:
- Allow crawling of public pages.
- Disallow private dashboard paths.
- Reference portal sitemap.

Main site robots:
- Allow crawling.
- Reference sitemap.

### 4) Structured Data (JSON-LD)

Portal home:
- `WebSite` with `SearchAction` pointing to `/verify/`.
- Include `image` (share preview image) and `sameAs` (brand social links if available).

Main site home:
- `Organization` and/or `WebSite` structured data:
  - `name`, `url`, `logo` (brand-logo)
  - `sameAs` social profiles

## Broken Link / SEO Quality Fixes (Main Site)

Fixes required for strong indexing:
- Replace or implement `/verify/` if referenced by footer links.
- Fix `#tracks` anchors (either add the anchor or link to `/tracks/`).
- Replace invalid canonical URLs (`/academic/` → `/academy/`).
- Replace any replacement-character artifacts (`�` → `©`) that can reduce quality signals.

## Acceptance Criteria

- Googlebot can crawl and index portal public pages and main site pages without disallowed content leaks.
- Portal dashboards never appear in Google results (via robots + sitemap + noindex).
- No sitemap entries point to 404s or mismatched trailing slashes.
- Social shares of `portal.skillforgedigital.com.ng` show the selected promo image consistently.

