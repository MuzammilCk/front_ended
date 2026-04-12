import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { ScrollProvider } from "./lib/scroll";
import "./index.css";
import { CartProvider } from "./context/CartContext";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <ScrollProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ScrollProvider>
    </AuthProvider>
  </BrowserRouter>,
);
