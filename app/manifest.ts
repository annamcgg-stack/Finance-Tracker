import type { MetadataRoute } from "next";
import { PWA_CONFIG, PWA_ICON_PATHS } from "@/lib/pwa/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PWA_CONFIG.name,
    short_name: PWA_CONFIG.shortName,
    description: PWA_CONFIG.description,
    start_url: PWA_CONFIG.startUrl,
    scope: PWA_CONFIG.scope,
    display: PWA_CONFIG.display,
    orientation: PWA_CONFIG.orientation,
    background_color: PWA_CONFIG.backgroundColor,
    theme_color: PWA_CONFIG.themeColor,
    categories: ["finance", "productivity"],
    icons: [
      {
        src: PWA_ICON_PATHS.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: PWA_ICON_PATHS.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_PATHS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_PATHS.maskable512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    prefer_related_applications: false,
  };
}
