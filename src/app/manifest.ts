import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusOne",
    short_name: "CampusOne",
    description: "AI-powered campus operating system",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6272f1",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}