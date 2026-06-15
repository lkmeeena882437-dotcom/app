import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Auth() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "login") {
        await login(email, password);
        toast.success("Welcome back.");
      } else {
        await register(name, email, password);
        toast.success("Account created.");
      }
      const to = loc.state?.from || "/account";
      nav(to);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <main className="bg-[#050505] pt-28 pb-24 min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border border-[#00F0FF]/40 grid place-items-center">
            <Sparkles className="w-5 h-5 text-[#00F0FF]"/>
          </div>
          <h1 className="display text-4xl mt-4">{tab === "login" ? "Welcome back" : "Create your Oculux"}</h1>
          <p className="text-white/60 mt-2 text-sm">
            {tab === "login" ? "Sign in to track orders and saved frames." : "Personal vault for your orders, fittings & AR profiles."}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 p-1 rounded-full border border-white/10">
          <button data-testid={AUTH.loginTab} onClick={() => setTab("login")} className={`py-2.5 rounded-full text-sm ${tab==="login"?"bg-white text-black":"text-white/70"}`}>Sign in</button>
          <button data-testid={AUTH.registerTab} onClick={() => setTab("register")} className={`py-2.5 rounded-full text-sm ${tab==="register"?"bg-white text-black":"text-white/70"}`}>Create account</button>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {tab === "register" && (
            <div>
              <label className="overline">Name</label>
              <input data-testid={AUTH.nameInput} required value={name} onChange={(e)=>setName(e.target.value)} className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00F0FF]/60" placeholder="Ada Lovelace"/>
            </div>
          )}
          <div>
            <label className="overline">Email</label>
            <input data-testid={AUTH.emailInput} required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00F0FF]/60" placeholder="you@oculux.com"/>
          </div>
          <div>
            <label className="overline">Password</label>
            <input data-testid={AUTH.passwordInput} required type="password" minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00F0FF]/60" placeholder="••••••••"/>
          </div>
          <button data-testid={AUTH.submitButton} disabled={busy} className="btn-glow w-full bg-white text-black rounded-full py-4 font-medium">
            {busy ? "Please wait…" : (tab === "login" ? "Sign in" : "Create account")}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-white/40">
          By continuing you agree to our <Link to="#" className="text-white/70">Terms</Link> & <Link to="#" className="text-white/70">Privacy</Link>.
        </p>
      </div>
    </main>
  );
}
