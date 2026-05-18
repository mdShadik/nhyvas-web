import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nhyvas",
    short_name: "Nhyvas",
    description: "Nhyvas App",
    start_url: "/",
    display: "standalone",
    background_color: "#12052e",
    theme_color: "#12052e",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}