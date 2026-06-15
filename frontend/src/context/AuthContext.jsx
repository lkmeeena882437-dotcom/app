import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("oculux_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => { localStorage.removeItem("oculux_token"); })
      .finally(() => setLoading(false));
  }, []);

  // Admin email/password
  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("oculux_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };
  const register = async (name, email, password) => {
    const r = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("oculux_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  // Mobile OTP
  const requestOtp = async (phone, name) => {
    const r = await api.post("/auth/otp/request", { phone, name });
    return r.data; // { sent, phone, dev_otp, mocked }
  };
  const verifyOtp = async (phone, code, name) => {
    const r = await api.post("/auth/otp/verify", { phone, code, name });
    localStorage.setItem("oculux_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem("oculux_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
