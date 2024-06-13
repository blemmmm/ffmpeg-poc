import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function crossOriginIsolationMiddleware(_, response, next) {
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
}

const crossOriginIsolation = () => {
  return {
    name: "cross-origin-isolation",
    configureServer: (server) => {
      server.middlewares.use(crossOriginIsolationMiddleware);
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(crossOriginIsolationMiddleware);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), crossOriginIsolation()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
