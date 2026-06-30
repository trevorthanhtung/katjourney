import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/bricolage-grotesque";
import "./styles.css";
import "./i18n";
import { startNotificationService } from "./utils/notifications";
import { MotionConfig } from "framer-motion";

startNotificationService();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>
);
