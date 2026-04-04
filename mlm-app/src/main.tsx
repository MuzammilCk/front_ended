import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { ScrollProvider } from "./lib/scroll";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ScrollProvider>
      <App />
    </ScrollProvider>
  </BrowserRouter>,
);
