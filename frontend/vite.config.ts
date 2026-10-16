import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { spawn } from "node:child_process";
import path from "node:path";
import net from "node:net";

function ensureBackendRunning() {
  const backendDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)), "backend");
  const checkAndStart = () => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket
      .once("connect", () => {
        socket.destroy();
      })
      .once("error", () => {
        socket.destroy();
        const child = spawn(process.execPath, ["server.js"], {
          cwd: backendDir,
          stdio: "ignore",
          detached: true,
          windowsHide: true,
        });
        child.unref();
      })
      .once("timeout", () => {
        socket.destroy();
      })
      .connect(5000, "127.0.0.1");
  };

  return {
    name: "ensure-backend-server",
    apply: "serve" as const,
    configureServer() {
      checkAndStart();
      const timer = setInterval(checkAndStart, 5000);
      timer.unref?.();
    },
  };
}

export default defineConfig({
  plugins: [react(), ensureBackendRunning()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
