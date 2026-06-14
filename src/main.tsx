import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n"; // Khởi tạo i18next trước khi render app
import App from "./App";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
