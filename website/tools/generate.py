#!/usr/bin/env python3
"""Generates website/public/index.html (English) and website/public/de/index.html (German) from one template.

The generated HTML is committed. Run this after changing the copy or to use another domain:
    python3 website/tools/generate.py https://your-domain.tld
"""
import json
import sys
from datetime import date
from pathlib import Path

# Public base URL used in canonical links, hreflang, Open Graph and the sitemap.
# Usage: python3 website/tools/generate.py [https://your-domain.tld] [--legal]
#   --legal  adds footer links to /impressum.html and /datenschutz.html (see website/README.md)
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
LEGAL = "--legal" in sys.argv
DOMAIN = (ARGS[0] if ARGS else "https://chaosgone.de").rstrip("/")
KOFI = "https://ko-fi.com/jzakotnik"
REPO = "https://github.com/jzakotnik/chaosgone"
OUT = Path(__file__).resolve().parent.parent / "public"
LASTMOD = date.today().isoformat()

COPY = {
    "en": {
        "lang": "en", "locale": "en_US", "path": "/", "other_path": "/de/", "other_label": "Deutsch", "other_lang": "de",
        "title": "ChaosGone – Free open-source basement inventory app",
        "description": "Organize your basement: photograph your stuff, let AI describe it and find anything in seconds. Free, open source, self-hosted on a Raspberry Pi.",
        "keywords": "basement inventory app, home inventory, storage box organizer, organize basement, self-hosted inventory, open source, Raspberry Pi, photo recognition, Claude API",
        "og_image": "/img/og-en.png", "og_alt": "ChaosGone – order in the basement",
        "skip": "Skip to content", "home_label": "ChaosGone home", "lang_label": "Language",
        "badges": ["Free", "Open source (MIT)", "Runs on a Raspberry Pi"],
        "h1": "Stop searching your <em>basement</em>.",
        "lead": "ChaosGone is a free, open-source inventory app. Photograph your things, let AI describe them, and find anything again in seconds.",
        "cta_gh": "View on GitHub", "cta_how": "How it works",
        "ph_alt": ["Search results for “schraube” in the ChaosGone app", "Home screen of the ChaosGone app with colourful box tiles", "A collection of dowels and screws with a contents list"],
        "p_kicker": "The problem", "p_h2": "You own it. You just can't <em>find</em> it.",
        "p_text": "The 8 mm drill bit, the bike tube, the spare bulbs: they are somewhere in the basement. After an hour of digging through boxes you buy a new one. Again.",
        "pains": [("cart", "Bought twice", "Things you already own, bought again because you couldn't find them."),
                  ("clock", "An hour lost", "Digging through boxes for something that takes a minute to use."),
                  ("boxes", "No overview", "Nobody knows what is in which box. Not even you.")],
        "h_kicker": "How it works", "h_h2": "Three steps. No spreadsheet.",
        "steps": [("camera", "Photograph", "Snap each thing with your phone, or a whole tin of dowels as one collection. Got hundreds? Import them in one batch."),
                  ("sparkles", "Let AI describe", "Claude writes the name, a description and a contents list. You review and correct it whenever you like."),
                  ("search", "Find in seconds", "One search box. Typos, plurals and half words just work, in German and English.")],
        "f_kicker": "Features", "f_h2": "Built for a real basement",
        "tiles": [("orange", "grid", "Box tiles", "A handful of big, thumb-friendly tiles: bicycle, tools, sports."),
                  ("yellow", "search", "Smart search", "Fuzzy and German-aware. Free and local; ask Claude only when you want to."),
                  ("steel", "layers", "Collections", "Assortments become lists: dowels, screws and washers, sorted by kind."),
                  ("blue", "images", "Batch import", "Hundreds of photos in one go. Review the results at your own pace."),
                  ("green", "barcode", "Barcode scan", "Scan EAN codes with your phone camera."),
                  ("red", "home", "Yours by design", "A SQLite file and a photo folder at home. No account, no lock-in.")],
        "o_kicker": "Free &amp; open source", "o_h2": "Runs on a Raspberry Pi. Costs nothing.",
        "checks": ["MIT licensed: use it, change it, share it.",
                   "No account, no subscription, no tracking.",
                   "Hosts on a Raspberry Pi, any Linux box or in Docker.",
                   "Your data is one SQLite file plus a photo folder: back it up with a simple copy.",
                   "The optional AI features use your own Claude API key. You pay only for what you use."],
        "term_title": "Install on your Pi", "term_comment": "# add your API key", "term_hint": "# then open http://raspihome:3500",
        "q_kicker": "FAQ", "q_h2": "Good to know",
        "faq": [("Is it really free?", "Yes. ChaosGone is MIT-licensed open source: no account, no subscription, no ads. The only cost is optional: photo recognition uses the Claude API with your own key, and you pay Anthropic for what you use."),
                ("What do I need to run it?", "A Raspberry Pi with a 64-bit OS, any Linux machine, or Docker. Setup is a handful of commands with pm2 or Docker; the README walks you through it."),
                ("Do my photos leave my network?", "Photos are stored on your own machine. Only when you use a Claude feature (identify, batch import, regenerate) is the downscaled photo sent to Anthropic's API. The normal search never calls the API; the optional AI search sends the inventory as text, without photos."),
                ("Does it work without AI?", "Yes. You can add items by hand and search them. Only photo recognition and the AI search need an API key."),
                ("Which languages does it speak?", "The interface is in German and English, and Claude writes descriptions in the language you selected.")],
        "fin_h2": "Tame your basement chaos.", "fin_text": "Grab the code, put it on a Raspberry Pi and finally know where everything is.",
        "fin_docs": "Read the docs",
        "coffee": "Like it? Buy me a coffee on",
        "foot": "ChaosGone is free and open source under the MIT licence.", "foot_nav": [("Source code", REPO), ("Report an issue", REPO + "/issues"), ("Documentation", REPO + "#readme")],
        "disclaimer": "ChaosGone is an independent project and is not affiliated with or endorsed by Anthropic. Claude is a trademark of Anthropic.",
        "app_desc": "Free, open-source basement inventory app: photograph your things, let AI describe them and find anything in seconds. Self-hosted on a Raspberry Pi.",
    },
    "de": {
        "lang": "de", "locale": "de_DE", "path": "/de/", "other_path": "/", "other_label": "English", "other_lang": "en",
        "title": "ChaosGone – Kostenlose Open-Source-App für Ordnung im Keller",
        "description": "Ordnung im Keller: Dinge fotografieren, von KI beschreiben lassen und in Sekunden wiederfinden. Kostenlos, Open Source, läuft auf dem Raspberry Pi.",
        "keywords": "Keller Inventar App, Inventar zuhause, Kellerordnung, Lagerkisten organisieren, Selfhosting, Open Source, Raspberry Pi, Fotoerkennung, Claude API",
        "og_image": "/img/og-de.png", "og_alt": "ChaosGone – Ordnung im Keller",
        "skip": "Zum Inhalt springen", "home_label": "ChaosGone Startseite", "lang_label": "Sprache",
        "badges": ["Kostenlos", "Open Source (MIT)", "Läuft auf dem Raspberry Pi"],
        "h1": "Schluss mit Suchen im <em>Keller</em>.",
        "lead": "ChaosGone ist eine kostenlose Open-Source-App fürs Kellerinventar. Dinge fotografieren, von KI beschreiben lassen und in Sekunden wiederfinden.",
        "cta_gh": "Auf GitHub ansehen", "cta_how": "So funktioniert's",
        "ph_alt": ["Suchergebnisse für „schraube“ in der ChaosGone-App", "Startseite der ChaosGone-App mit bunten Kisten-Kacheln", "Eine Sammlung aus Dübeln und Schrauben mit Inhaltsliste"],
        "p_kicker": "Das Problem", "p_h2": "Du hast es. Du <em>findest</em> es nur nicht.",
        "p_text": "Der 8-mm-Bohrer, der Fahrradschlauch, die Ersatzbirnen: irgendwo im Keller. Nach einer Stunde Kistenwühlen kaufst du es neu. Schon wieder.",
        "pains": [("cart", "Doppelt gekauft", "Dinge, die du längst besitzt, aber nicht gefunden hast."),
                  ("clock", "Eine Stunde weg", "Kisten durchwühlen für etwas, das eine Minute dauert."),
                  ("boxes", "Kein Überblick", "Niemand weiß, was in welcher Kiste liegt. Du auch nicht.")],
        "h_kicker": "So funktioniert's", "h_h2": "Drei Schritte. Keine Tabelle.",
        "steps": [("camera", "Fotografieren", "Jedes Teil mit dem Handy knipsen, oder eine ganze Dose Dübel als Sammlung. Hunderte Fotos? Alle in einem Rutsch importieren."),
                  ("sparkles", "KI beschreibt", "Claude schreibt Namen, Beschreibung und Inhaltsliste. Du prüfst und korrigierst, wann du magst."),
                  ("search", "In Sekunden finden", "Ein Suchfeld. Tippfehler, Mehrzahl und halbe Wörter sind kein Problem, auf Deutsch und Englisch.")],
        "f_kicker": "Funktionen", "f_h2": "Gebaut für einen echten Keller",
        "tiles": [("orange", "grid", "Kisten-Kacheln", "Eine Handvoll großer Kacheln für den Daumen: Fahrrad, Werkzeug, Sport."),
                  ("yellow", "search", "Clevere Suche", "Fehlertolerant und deutschsprachig. Kostenlos und lokal; Claude nur, wenn du willst."),
                  ("steel", "layers", "Sammlungen", "Sortimente werden zu Listen: Dübel, Schrauben und Scheiben nach Sorte."),
                  ("blue", "images", "Stapel-Import", "Hunderte Fotos auf einmal. Die Ergebnisse prüfst du in deinem Tempo."),
                  ("green", "barcode", "Barcode-Scan", "EAN-Codes mit der Handykamera scannen."),
                  ("red", "home", "Deine Daten", "Eine SQLite-Datei und ein Fotoordner bei dir zu Hause. Kein Konto, kein Lock-in.")],
        "o_kicker": "Kostenlos &amp; Open Source", "o_h2": "Läuft auf dem Raspberry Pi. Kostet nichts.",
        "checks": ["MIT-Lizenz: nutzen, ändern, weitergeben.",
                   "Kein Konto, kein Abo, kein Tracking.",
                   "Läuft auf dem Raspberry Pi, jedem Linux-Rechner oder in Docker.",
                   "Deine Daten sind eine SQLite-Datei plus ein Fotoordner: ein einfaches Kopieren genügt als Backup.",
                   "Die optionalen KI-Funktionen nutzen deinen eigenen Claude-API-Schlüssel. Du zahlst nur, was du verbrauchst."],
        "term_title": "Auf dem Pi installieren", "term_comment": "# API-Schlüssel eintragen", "term_hint": "# danach http://raspihome:3500 öffnen",
        "q_kicker": "FAQ", "q_h2": "Gut zu wissen",
        "faq": [("Ist das wirklich kostenlos?", "Ja. ChaosGone ist Open Source unter der MIT-Lizenz: kein Konto, kein Abo, keine Werbung. Kosten entstehen nur optional: Die Fotoerkennung nutzt die Claude-API mit deinem eigenen Schlüssel, und du zahlst Anthropic nur für die Nutzung."),
                ("Was brauche ich zum Betrieb?", "Einen Raspberry Pi mit 64-Bit-System, einen beliebigen Linux-Rechner oder Docker. Die Einrichtung sind ein paar Befehle mit pm2 oder Docker; das README führt dich durch."),
                ("Verlassen meine Fotos mein Netz?", "Die Fotos liegen auf deinem eigenen Rechner. Nur wenn du eine Claude-Funktion nutzt (Erkennen, Stapel-Import, Neu erzeugen), wird das verkleinerte Foto an die API von Anthropic geschickt. Die normale Suche ruft die API nie auf; die optionale KI-Suche schickt das Inventar als Text, ohne Fotos."),
                ("Geht es auch ohne KI?", "Ja. Du kannst Teile von Hand erfassen und durchsuchen. Nur Fotoerkennung und KI-Suche brauchen einen API-Schlüssel."),
                ("Welche Sprachen gibt es?", "Die Oberfläche gibt es auf Deutsch und Englisch, und Claude schreibt die Beschreibungen in der gewählten Sprache.")],
        "fin_h2": "Zähme das Kellerchaos.", "fin_text": "Hol dir den Code, setz ihn auf einen Raspberry Pi und weißt endlich, wo alles liegt.",
        "fin_docs": "Dokumentation lesen",
        "coffee": "Gefällt dir ChaosGone? Spendier mir einen Kaffee auf",
        "foot": "ChaosGone ist kostenlos und Open Source unter der MIT-Lizenz.", "foot_nav": [("Quellcode", REPO), ("Problem melden", REPO + "/issues"), ("Dokumentation", REPO + "#readme")],
        "disclaimer": "ChaosGone ist ein unabhängiges Projekt und steht in keiner Verbindung zu Anthropic. Claude ist eine Marke von Anthropic.",
        "app_desc": "Kostenlose Open-Source-App fürs Kellerinventar: Dinge fotografieren, von KI beschreiben lassen und in Sekunden wiederfinden. Selbst gehostet auf dem Raspberry Pi.",
    },
}

def icon(name, cls="icon"):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="/img/icons.svg#{name}"/></svg>'

def esc(s):  # attribute-safe
    return s.replace("&", "&amp;").replace('"', "&quot;")

def page(c):
    url = DOMAIN + c["path"]
    alt_url = DOMAIN + c["other_path"]
    en_url, de_url = DOMAIN + "/", DOMAIN + "/de/"
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "SoftwareApplication", "@id": DOMAIN + "/#app", "name": "ChaosGone", "url": url,
             "description": c["app_desc"], "applicationCategory": "UtilitiesApplication",
             "operatingSystem": "Linux, Raspberry Pi OS, Docker", "isAccessibleForFree": True,
             "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
             "license": "https://opensource.org/licenses/MIT", "sameAs": [REPO], "image": DOMAIN + c["og_image"],
             "inLanguage": ["de", "en"], "author": {"@type": "Person", "name": "Jure Zakotnik"}},
            {"@type": "FAQPage", "mainEntity": [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in c["faq"]]},
        ],
    }
    badges = "".join(f"<li>{b}</li>" for b in c["badges"])
    phones = "".join(
        f'<figure class="phone"><img src="/img/{src}.webp" width="520" height="1067" alt="{esc(alt)}" {"fetchpriority=\"high\"" if i == 1 else "loading=\"eager\""}></figure>'
        for i, (src, alt) in enumerate(zip(["app-search", "app-home", "app-collection"], c["ph_alt"])))
    pains = "".join(f'<li>{icon(i)}<strong>{t}</strong><span>{d}</span></li>' for i, t, d in c["pains"])
    steps = "".join(f'<li class="step"><span class="num" aria-hidden="true">{n}</span>{icon(i)}<h3>{t}</h3><p>{d}</p></li>'
                    for n, (i, t, d) in enumerate(c["steps"], 1))
    tiles = "".join(f'<li class="tile t-{col}">{icon(i)}<h3>{t}</h3><p>{d}</p></li>' for col, i, t, d in c["tiles"])
    checks = "".join(f'<li>{icon("check")}<span>{x}</span></li>' for x in c["checks"])
    faq = "".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in c["faq"])
    nav = list(c["foot_nav"]) + ([("Impressum", "/impressum.html"), ("Datenschutz", "/datenschutz.html")] if LEGAL else [])
    foot_nav = "".join(f'<a href="{u}">{t}</a>' for t, u in nav)
    term = (f'<span class="p">$</span> git clone {REPO}.git\n<span class="p">$</span> cd chaosgone &amp;&amp; npm install\n'
            f'<span class="p">$</span> cp .env.example .env.local  <span class="c">{c["term_comment"]}</span>\n'
            f'<span class="p">$</span> npm run build &amp;&amp; pm2 start ecosystem.config.cjs\n<span class="c">{c["term_hint"]}</span>')
    return f'''<!DOCTYPE html>
<html lang="{c["lang"]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{c["title"]}</title>
<meta name="description" content="{esc(c["description"])}">
<meta name="keywords" content="{esc(c["keywords"])}">
<meta name="author" content="Jure Zakotnik">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#2b3138">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{en_url}">
<link rel="alternate" hreflang="de" href="{de_url}">
<link rel="alternate" hreflang="x-default" href="{en_url}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChaosGone">
<meta property="og:locale" content="{c["locale"]}">
<meta property="og:locale:alternate" content="{"de_DE" if c["lang"] == "en" else "en_US"}">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(c["title"])}">
<meta property="og:description" content="{esc(c["description"])}">
<meta property="og:image" content="{DOMAIN}{c["og_image"]}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(c["og_alt"])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(c["title"])}">
<meta name="twitter:description" content="{esc(c["description"])}">
<meta name="twitter:image" content="{DOMAIN}{c["og_image"]}">
<link rel="preload" href="/fonts/stardos-stencil-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/barlow-condensed-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip" href="#main">{c["skip"]}</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="{c["path"]}" aria-label="{c["home_label"]}"><img src="/icon-192.png" width="40" height="40" alt=""><span>ChaosGone</span></a>
    <div class="header-actions">
      <div class="lang" role="group" aria-label="{c["lang_label"]}">
        <span aria-current="true">{c["lang"]}</span><a href="{c["other_path"]}" hreflang="{c["other_lang"]}" lang="{c["other_lang"]}">{c["other_lang"]}</a>
      </div>
      <a class="btn btn--sm btn--ghost" href="{REPO}" aria-label="GitHub">{icon("github")}<span class="gh-label">GitHub</span></a>
    </div>
  </div>
  <div class="hazard"></div>
</header>

<main id="main">
  <section class="hero">
    <div class="wrap">
      <div>
        <ul class="badges">{badges}</ul>
        <h1>{c["h1"]}</h1>
        <p class="lead">{c["lead"]}</p>
        <div class="cta">
          <a class="btn" href="{REPO}">{icon("github")}{c["cta_gh"]}</a>
          <a class="btn btn--ghost" href="#how">{c["cta_how"]}{icon("arrow")}</a>
        </div>
      </div>
      <div class="phones">{phones}</div>
    </div>
  </section>

  <section class="problem" aria-labelledby="problem">
    <div class="wrap">
      <div class="section-head">
        <p class="kicker">{c["p_kicker"]}</p>
        <h2 id="problem">{c["p_h2"]}</h2>
        <p>{c["p_text"]}</p>
      </div>
      <ul class="pains">{pains}</ul>
    </div>
  </section>

  <section id="how" aria-labelledby="how-h">
    <div class="wrap">
      <div class="section-head"><p class="kicker">{c["h_kicker"]}</p><h2 id="how-h">{c["h_h2"]}</h2></div>
      <ol class="steps">{steps}</ol>
    </div>
  </section>

  <section id="features" class="tight" aria-labelledby="features-h">
    <div class="wrap">
      <div class="section-head"><p class="kicker">{c["f_kicker"]}</p><h2 id="features-h">{c["f_h2"]}</h2></div>
      <ul class="tiles">{tiles}</ul>
    </div>
  </section>

  <section class="oss" id="open-source" aria-labelledby="oss-h">
    <div class="wrap">
      <div>
        <p class="kicker">{c["o_kicker"]}</p>
        <h2 id="oss-h">{c["o_h2"]}</h2>
        <ul class="checks">{checks}</ul>
      </div>
      <div>
        <p class="terminal-title">{c["term_title"]}</p>
        <pre><code>{term}</code></pre>
      </div>
    </div>
  </section>

  <section id="faq" aria-labelledby="faq-h">
    <div class="wrap">
      <div class="section-head"><p class="kicker">{c["q_kicker"]}</p><h2 id="faq-h">{c["q_h2"]}</h2></div>
      <div class="faq">{faq}</div>
    </div>
  </section>

  <section class="final tight" aria-labelledby="final-h">
    <div class="wrap">
      <h2 id="final-h">{c["fin_h2"]}</h2>
      <p>{c["fin_text"]}</p>
      <div class="cta">
        <a class="btn" href="{REPO}">{icon("github")}{c["cta_gh"]}</a>
        <a class="btn btn--ghost" href="{REPO}#readme">{c["fin_docs"]}</a>
      </div>
      <p class="coffee">{icon("coffee")}<span>{c["coffee"]} <a href="{KOFI}" rel="noopener">ko-fi.com/jzakotnik</a></span></p>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="hazard"></div>
  <div class="wrap">
    <div>
      <p>{c["foot"]}</p>
      <small>{c["disclaimer"]}</small>
    </div>
    <nav aria-label="Footer">{foot_nav}<a href="{c["other_path"]}" hreflang="{c["other_lang"]}" lang="{c["other_lang"]}">{c["other_label"]}</a></nav>
  </div>
</footer>
</body>
</html>
'''

def main():
    (OUT / "de").mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(page(COPY["en"]), encoding="utf-8")
    (OUT / "de" / "index.html").write_text(page(COPY["de"]), encoding="utf-8")
    manifest = {"name": "ChaosGone", "short_name": "ChaosGone", "start_url": "/", "display": "browser",
                "background_color": "#e1dfd9", "theme_color": "#2b3138",
                "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
                          {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}]}
    (OUT / "site.webmanifest").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")
    (OUT / "sitemap.xml").write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>{DOMAIN}/</loc>
    <lastmod>{LASTMOD}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="{DOMAIN}/"/>
    <xhtml:link rel="alternate" hreflang="de" href="{DOMAIN}/de/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{DOMAIN}/"/>
  </url>
  <url>
    <loc>{DOMAIN}/de/</loc>
    <lastmod>{LASTMOD}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="{DOMAIN}/"/>
    <xhtml:link rel="alternate" hreflang="de" href="{DOMAIN}/de/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{DOMAIN}/"/>
  </url>
</urlset>
''', encoding="utf-8")
    (OUT / "404.html").write_text('''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 – ChaosGone</title><meta name="robots" content="noindex"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/css/site.css"></head>
<body><main class="wrap notfound">
<h1>404</h1><p class="lead">Lost in the basement? This page is not here. / Diese Seite gibt es nicht.</p>
<p><a class="btn" href="/">ChaosGone</a></p></main></body></html>
''', encoding="utf-8")
    print(f"generated for {DOMAIN}")

if __name__ == "__main__":
    main()
