import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import {VitePWA} from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions:{
        enabled:true,
      },
      manifest: {
        name: "Globe Hiring",
        short_name: "Globe Hiring",
        description: "Discover technology companies and explore where they hire around the world.",
        start_url: "/",
        display: "standalone",
        background_color: "#f7f6f2",
        theme_color: "#f7f6f2",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      }
    })
  ],
  resolve:{
    alias:{
      "@":path.resolve(__dirname,"./src")
    }
  },
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
});
