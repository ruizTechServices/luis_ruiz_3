import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Node/WASM decoder and its worker helper out of Turbopack's bundle.
  // It is imported only by the owner upload route, after byte and duration limits.
  serverExternalPackages: ["mpg123-decoder"],
  async redirects() {
    // Keep saved links from luis_ruiz_2 useful. Destination routes enforce auth.
    return [
      { source: "/gio_dash", destination: "/dashboard", permanent: true },
      { source: "/gio_dash/blog", destination: "/dashboard/write", permanent: true },
      { source: "/gio_dash/blog/new", destination: "/dashboard/write/new", permanent: true },
      { source: "/gio_dash/blog/:id/edit", destination: "/dashboard/write/:id", permanent: true },
      { source: "/gio_dash/projects", destination: "/admin/projects", permanent: true },
      { source: "/gio_dash/leads", destination: "/dashboard/leads", permanent: true },
      { source: "/gio_dash/money", destination: "/dashboard/money", permanent: true },
      { source: "/gio_dash/notes", destination: "/dashboard/decisions", permanent: true },
      { source: "/gio_dash/systems", destination: "/dashboard/links", permanent: true },
      { source: "/gio_dash/photos", destination: "/dashboard/media", permanent: true },
      { source: "/gio_dash/photos/upload", destination: "/dashboard/media", permanent: true },
      { source: "/signup", destination: "/login", permanent: true },
      { source: "/favicon.ico", destination: "/logo-lr.png", permanent: true },
      { source: "/images/logo_lr.png", destination: "/logo-lr.png", permanent: true },
      { source: "/images/luis_ruizLogo.png", destination: "/logo-lr.png", permanent: true },
      { source: "/images/gioWater.jpg", destination: "/images/gio-water.jpg", permanent: true },
    ];
  },
};

export default nextConfig;
