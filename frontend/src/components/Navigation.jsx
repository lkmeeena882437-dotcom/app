import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Sparkles } from "lucide-react";
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
        scrolled ? "glass" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" data-testid={NAV.logo} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full border border-[#00F0FF]/40 grid place-items-center glow-cyan">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <span className="display text-xl tracking-tight">OCULUX</span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.id}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-white" : "text-white/60 hover:text-white"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={user ? "/account" : "/auth"}
            data-testid={NAV.accountLink}
            className="hidden sm:flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <User className="w-4 h-4" />
            <span>{user ? user.name.split(" ")[0] : "Sign in"}</span>
          </Link>
          <button
            data-testid={NAV.cartButton}
            onClick={() => setOpen(true)}
            className="relative w-10 h-10 grid place-items-center rounded-full border border-white/10 hover:border-[#00F0FF]/50 transition-colors"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {count > 0 && (
              <span
                data-testid={NAV.cartCount}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] bg-[#00F0FF] text-black grid place-items-center font-medium"
              >
                {count}
              </span>
            )}
          </button>
          <button
            data-testid={NAV.mobileMenuToggle}
            onClick={() => setMobileOpen((s) => !s)}
            className="md:hidden w-10 h-10 grid place-items-center rounded-full border border-white/10"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/5 px-6 py-6 space-y-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className="block text-base text-white/80 hover:text-white"
              data-testid={`mobile-${l.id}`}
            >
              {l.label}
            </NavLink>
          ))}
          <Link to={user ? "/account" : "/auth"} className="block text-base text-white/80">
            {user ? "My account" : "Sign in"}
          </Link>
        </div>
      )}
    </header>
  );
}
