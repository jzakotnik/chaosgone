import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChaosGone",
    short_name: "ChaosGone",
    description: "Basement inventory with photo recognition",
    start_url: "/",
    display: "standalone",
    background_color: "#e1dfd9",
    theme_color: "#2b3138",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
