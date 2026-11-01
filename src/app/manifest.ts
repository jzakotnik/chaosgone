import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ChaosGone",
    short_name: "ChaosGone",
    description: "Ordnung im Keller: Teile fotografieren, von Claude erkennen lassen und wiederfinden.",
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#e1dfd9",
    theme_color: "#2b3138",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Teil erfassen", short_name: "Erfassen", url: "/item/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Stapel-Erfassung", short_name: "Stapel", url: "/batch", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Zu prüfen", short_name: "Prüfen", url: "/review", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
