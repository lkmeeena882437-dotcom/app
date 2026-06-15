import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Sparkles, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { NAV } from "@/constants/testIds";

const links = [
  { to: "/shop", label: "Shop", id: NAV.shopLink },
  { to: "/technology", label: "Technology", id: NAV.techLink },
  { to: "/ar-try-on", label: "AR Try-On", id: NAV.arLink },
];

export default function Navigation() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-light" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" data-testid={NAV.logo} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full silver-border grid place-items-center bg-white">
            <Sparkles className="w-4 h-4 text-[#1D1D1F]" />
          </div>
          <span className="display text-xl tracking-tight ink">OCULUX</span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.id}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-[#0A0A0B]" : "text-[#6E6E73] hover:text-[#0A0A0B]"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user?.is_admin && (
            <Link to="/admin" data-testid="nav-admin-chip" className="hidden sm:inline-flex items-center gap-2 text-xs mono uppercase tracking-widest text-[#1D1D1F] px-3 py-1.5 rounded-full border border-[#E5E5EA] hover:border-[#1D1D1F]">
              <Shield className="w-3 h-3" /> Admin
            </Link>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            data-testid={NAV.accountLink}
            className="hidden sm:flex items-center gap-2 text-sm ink-mute hover:text-[#0A0A0B] transition-colors"
          >
            <User className="w-4 h-4" />
            <span>{user ? user.name.split(" ")[0] : "Sign in"}</span>
          </Link>
          <button
            data-testid={NAV.cartButton}
            onClick={() => setOpen(true)}
            className="relative w-10 h-10 grid place-items-center rounded-full border border-[#E5E5EA] hover:border-[#1D1D1F] transition-colors bg-white"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-4 h-4 text-[#1D1D1F]" />
            {count > 0 && (
              <span
                data-testid={NAV.cartCount}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] bg-[#1D1D1F] text-white grid place-items-center font-medium"
              >
                {count}
              </span>
            )}
          </button>
          <button
            data-testid={NAV.mobileMenuToggle}
            onClick={() => setMobileOpen((s) => !s)}
            className="md:hidden w-10 h-10 grid place-items-center rounded-full border border-[#E5E5EA] bg-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden glass-light border-t border-black/5 px-6 py-6 space-y-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className="block text-base text-[#1D1D1F]"
              data-testid={`mobile-${l.id}`}
            >
              {l.label}
            </NavLink>
          ))}
          <Link to={user ? "/account" : "/auth"} className="block text-base text-[#1D1D1F]">
            {user ? "My account" : "Sign in"}
          </Link>
          {user?.is_admin && (
            <Link to="/admin" className="block text-base text-[#1D1D1F]">Admin</Link>
          )}
        </div>
      )}
    </header>
  );
}
