import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import { LanguageProvider } from "@/context/LanguageContext";
import { RegionProvider } from "@/context/RegionContext";
import { AuthProvider } from "@/context/AuthContext";
import "@/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <RegionProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </RegionProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
