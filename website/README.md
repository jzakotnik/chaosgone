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
├── nginx/chaosgone.de.conf  plain HTTP server block (caching, gzip, security headers); certbot adds HTTPS
└── legal-templates/         German Impressum / Datenschutz templates (NOT deployed, see below)
```

## Deploy to chaosgone.de in five steps

The pages are generated for `https://chaosgone.de` (canonical, hreflang, Open Graph, sitemap). For another domain run
`python3 website/tools/generate.py https://your-domain.tld` and use that name in the nginx file and certbot call.

1. **DNS:** point an A record (and an AAAA record if the server has IPv6) of `chaosgone.de` and `www.chaosgone.de`
   to the server. Wait until `dig +short chaosgone.de` returns it; certbot needs this.
2. **nginx:** on the server, with the file `website/nginx/chaosgone.de.conf` copied over:
   ```bash
   sudo cp chaosgone.de.conf /etc/nginx/sites-available/chaosgone.de
   sudo ln -s /etc/nginx/sites-available/chaosgone.de /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
   The file serves `/var/www/html` on port 80 for `chaosgone.de` and `www.chaosgone.de`.
3. **Copy the site** (dry run first, then for real; it never deletes anything on the server):
   ```bash
   website/deploy.sh user@your-server
   website/deploy.sh user@your-server --go          # use WEBROOT=/var/www/chaosgone for another folder
   ```
   Without the script: `rsync -avz website/public/ user@your-server:/var/www/html/`. The script refuses to run
   while the placeholder domain `chaosgone.example` is in the files, or while the footer links to legal pages that
   are missing or not filled in.
4. **Check over HTTP:** `curl -I http://chaosgone.de/` should return `200`.
5. **HTTPS:** certbot edits the server block (adds port 443, the certificate and the redirect from http):
   ```bash
   sudo certbot --nginx -d chaosgone.de -d www.chaosgone.de
   sudo certbot renew --dry-run        # checks that automatic renewal works
   ```
   Afterwards, once everything works over HTTPS, you may add the line
   `add_header Strict-Transport-Security "max-age=31536000" always;` to the server block (HSTS makes browsers
   refuse plain http for a year, so only add it when you are sure).

Both `chaosgone.de` and `www.chaosgone.de` are served; the pages point search engines to `https://chaosgone.de`
with a canonical link. If you prefer a hard redirect from `www`, add a second `server` block with
`return 301 https://chaosgone.de$request_uri;` for `www.chaosgone.de` after certbot has issued the certificate.

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
purely private and non-commercial. A donation link (the Ko-fi hint) is a reason to take this seriously; whether it
applies to you is your call (this is not legal advice). `legal-templates/` has short German templates for a
cookie-free static page. To use them:

1. Fill in the `[placeholders]` and copy the files to `public/impressum.html` and `public/datenschutz.html`.
2. Regenerate with the footer links: `python3 website/tools/generate.py --legal`.
3. `deploy.sh` then checks that both files exist and contain no placeholders.

Note that the Datenschutz template says the site loads nothing from other servers. Linking to GitHub and Ko-fi only
leaves the site when a visitor clicks; embedding a Ko-fi widget or button script would change that and the text.

## What was checked

HTML validated with `html-validate`; all internal links and assets resolve; no horizontal scroll from 320 px
to 1280 px; the page weighs about 230 KB in 11 requests. `nginx/chaosgone.de.conf` was tested with nginx 1.24
(only port and root adapted, no IPv6 in the test environment): syntax, headers, the strict Content-Security-Policy
(no violations in a browser), gzip, caching, the custom 404 page and the `/de` to `/de/` redirect. Not checked:
certbot, Lighthouse scores and link previews on real platforms.
