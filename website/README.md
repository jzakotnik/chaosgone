# ChaosGone landing page

A static, one-page website (English at `/`, German at `/de/`) for hosting on any web server. No build step on
the server, no JavaScript, no external requests: the fonts are self-hosted and everything is served from one origin.

```
website/
├── public/                  <- this is what goes into /var/www/html
│   ├── index.html           English page
│   ├── de/index.html        German page
│   ├── css/site.css         styles (same workshop look as the app)
│   ├── fonts/               Barlow, Barlow Condensed, Stardos Stencil (SIL OFL, licence texts included)
│   ├── img/                 app screenshots (WebP), icon sprite, link-preview images
│   ├── favicon.ico, icon.svg, apple-touch-icon.png, icon-*.png, site.webmanifest
│   ├── robots.txt, sitemap.xml, 404.html
├── tools/generate.py        regenerates both pages, sitemap and robots.txt from one template
├── deploy.sh                rsync to your server (dry run by default)
├── nginx.example.conf       server block with caching, gzip and security headers
└── legal-templates/         German Impressum / Datenschutz templates (NOT deployed, see below)
```

## Deploy in five steps

1. **Set your domain.** The pages contain absolute URLs (canonical, hreflang, Open Graph, sitemap). Regenerate them:
   ```bash
   python3 website/tools/generate.py https://your-domain.tld
   ```
2. **DNS:** point an A (and AAAA) record of your domain to the server.
3. **nginx:** copy `nginx.example.conf` to `/etc/nginx/sites-available/`, set `server_name`, enable it, then
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. **Copy the files** (dry run first, then for real; it never deletes anything on the server):
   ```bash
   website/deploy.sh user@your-server
   website/deploy.sh user@your-server --go          # use WEBROOT=/var/www/chaosgone for another folder
   ```
   Without the script: `rsync -avz website/public/ user@your-server:/var/www/html/`. The script refuses to run
   while the placeholder domain `chaosgone.example` is still in the files.
5. **HTTPS:** `sudo certbot --nginx -d your-domain.tld -d www.your-domain.tld`

## After it is live

- Open `https://your-domain.tld/` and `/de/`, check the sitemap at `/sitemap.xml`.
- Add the site to **Google Search Console** and **Bing Webmaster Tools**, verify the domain and submit the sitemap.
- Check the link preview with the sharing debuggers of the platforms you care about (Facebook, LinkedIn, Slack).
  They cache aggressively; use their "re-scrape" buttons after changes.
- On GitHub set the repository **description**, **topics** (for example `inventory`, `home-inventory`,
  `self-hosted`, `raspberry-pi`, `nextjs`, `sqlite`, `claude`) and the **website URL**, and upload
  `public/img/og-en.png` as the **social preview** (Settings → General). This also helps search and sharing.

## Changing things

- **Copy and structure:** edit `tools/generate.py` (both languages sit side by side), run it with your domain,
  commit the result.
- **Look:** `public/css/site.css` (design tokens at the top).
- **Screenshots:** the images in `img/` are WebP versions of `docs/screenshots/`. To refresh one:
  `node -e "require('sharp')('docs/screenshots/home.png').resize({width:520}).webp({quality:82}).toFile('website/public/img/app-home.webp')"`
  from the repository root.
- **Link-preview images** (`img/og-*.png`, 1200×630) were rendered from an HTML card with the same fonts; replace
  them with any 1200×630 image.

## Legal pages (Germany)

A public website operated from Germany usually needs an **Impressum** and a **Datenschutzerklärung** unless it is
purely private and non-commercial; whether that applies to you is your call (this is not legal advice).
`legal-templates/` has short German templates for a cookie-free static page. To use them: fill in the
`[placeholders]`, copy them to `public/impressum.html` and `public/datenschutz.html`, add the links to
`foot_nav` in `tools/generate.py` and regenerate.

## What was checked

HTML validated with `html-validate`; all internal links and assets resolve; no horizontal scroll from 320 px
to 1280 px; with the strict Content-Security-Policy of `nginx.example.conf` there are no violations; the page
weighs about 230 KB in 11 requests. Not checked: the nginx file itself (run `nginx -t`), Lighthouse scores and
link previews on real platforms.
