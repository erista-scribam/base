import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { initThemeFromStorage } from "./hooks/useTheme";
import "./styles/globals.css";

initThemeFromStorage();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
