import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SupportWidget from "@/components/SupportWidget";

import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import ARTryOn from "@/pages/ARTryOn";
import CartPage from "@/pages/CartPage";
import Auth from "@/pages/Auth";
import Account from "@/pages/Account";
import CheckoutResult from "@/pages/CheckoutResult";
import Technology from "@/pages/Technology";
import Admin from "@/pages/Admin";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/technology" element={<Technology />} />
              <Route path="/ar-try-on" element={<ARTryOn />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/checkout/success" element={<CheckoutResult outcome="success" />} />
              <Route path="/checkout/cancel" element={<CheckoutResult outcome="cancel" />} />
              <Route path="*" element={<Home />} />
            </Routes>
            <CartDrawer />
            <SupportWidget />
            <Footer />
            <Toaster
              theme="light"
              position="top-right"
              toastOptions={{
                style: {
                  background: "#FFFFFF",
                  border: "1px solid #E5E5EA",
                  color: "#1D1D1F",
                  boxShadow: "0 12px 40px -12px rgba(0,0,0,0.18)",
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
