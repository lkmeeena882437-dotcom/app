import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "oculux_cart_v1";

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]); // [{product, quantity}]
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (_) {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product, quantity = 1) => {
    setItems((cur) => {
      const idx = cur.findIndex((x) => x.product.id === product.id);
      if (idx >= 0) {
        const next = [...cur];
        next[idx] = { ...next[idx], quantity: Math.min(10, next[idx].quantity + quantity) };
        return next;
      }
      return [...cur, { product, quantity }];
    });
    setOpen(true);
  };
  const remove = (id) => setItems((c) => c.filter((x) => x.product.id !== id));
  const setQty = (id, q) =>
    setItems((c) => c.map((x) => (x.product.id === id ? { ...x, quantity: Math.max(1, Math.min(10, q)) } : x)));
  const clear = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((s, x) => s + x.product.price * x.quantity, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((s, x) => s + x.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, subtotal, count, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
