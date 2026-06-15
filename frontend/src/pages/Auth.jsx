import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";
import { Sparkles, Shield, Smartphone } from "lucide-react";

export default function Auth() {
  const { login, requestOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState("otp"); // otp | admin
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone"); // phone | verify
  const [devOtp, setDevOtp] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const sendOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await requestOtp(phone, name);
      setDevOtp(r.dev_otp || "");
      setStep("verify");
      if (r.dev_otp) toast.success(`DEV OTP: ${r.dev_otp}`); // MOCKED
      else toast.success("OTP sent");
    } catch (e) { toast.error(e?.response?.data?.detail || "Could not send OTP"); }
    finally { setBusy(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await verifyOtp(phone, code, name);
      toast.success(`Welcome${name?", "+name.split(" ")[0]:""}.`);
      nav(loc.state?.from || (u?.is_admin ? "/admin" : "/account"));
    } catch (e) { toast.error(e?.response?.data?.detail || "Invalid OTP"); }
    finally { setBusy(false); }
  };

  const adminLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success("Welcome back.");
      nav(loc.state?.from || (u?.is_admin ? "/admin" : "/account"));
    } catch (e) { toast.error(e?.response?.data?.detail || "Invalid credentials"); }
    finally { setBusy(false); }
  };

  const inputCls = "w-full bg-white border border-[#E5E5EA] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F]";

  return (
    <main className="bg-white pt-28 pb-24 min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full silver-border grid place-items-center bg-white">
            <Sparkles className="w-5 h-5 text-[#1D1D1F]"/>
          </div>
          <h1 className="display text-4xl mt-4">Welcome to OculuxVision</h1>
          <p className="ink-mute mt-2 text-sm">Sign in to track orders, save frames and manage your AR profile.</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 p-1 rounded-full border border-[#E5E5EA] bg-[#F5F5F7]">
          <button data-testid="auth-tab-mobile" onClick={() => { setMode("otp"); setStep("phone"); }} className={`py-2.5 rounded-full text-sm inline-flex items-center justify-center gap-2 ${mode==="otp"?"bg-[#1D1D1F] text-white":"ink-mute"}`}>
            <Smartphone className="w-4 h-4"/> Mobile + OTP
          </button>
          <button data-testid="auth-tab-admin" onClick={() => setMode("admin")} className={`py-2.5 rounded-full text-sm inline-flex items-center justify-center gap-2 ${mode==="admin"?"bg-[#1D1D1F] text-white":"ink-mute"}`}>
            <Shield className="w-4 h-4"/> Admin
          </button>
        </div>

        {mode === "otp" && step === "phone" && (
          <form onSubmit={sendOtp} className="mt-8 space-y-4">
            <div>
              <label className="overline">Mobile number</label>
              <input data-testid="auth-phone-input" required type="tel" pattern="[+0-9\s\-]{10,15}" value={phone} onChange={(e)=>setPhone(e.target.value)} className={"mt-2 "+inputCls} placeholder="+91 98xxx xxxxx"/>
            </div>
            <div>
              <label className="overline">Name (optional)</label>
              <input data-testid="auth-name-input" value={name} onChange={(e)=>setName(e.target.value)} className={"mt-2 "+inputCls} placeholder="Ada"/>
            </div>
            <button data-testid="auth-send-otp" disabled={busy} className="btn-ink w-full">{busy ? "Sending…" : "Send OTP"}</button>
            <p className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <strong>DEV mode:</strong> OTP is MOCKED and shown to you on screen. Real SMS via Twilio can be wired later.
            </p>
          </form>
        )}

        {mode === "otp" && step === "verify" && (
          <form onSubmit={submitOtp} className="mt-8 space-y-4">
            <div>
              <p className="text-sm ink-mute">We sent a 6-digit code to <span className="ink">{phone}</span>.</p>
              {devOtp && (
                <p data-testid="auth-dev-otp" className="mt-2 text-xs mono inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-900 border border-yellow-200">DEV OTP → {devOtp}</p>
              )}
            </div>
            <div>
              <label className="overline">6-digit code</label>
              <input data-testid="auth-otp-input" required value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} className={"mt-2 "+inputCls+" mono tracking-[0.5em] text-center text-lg"} maxLength={6} inputMode="numeric"/>
            </div>
            <button data-testid="auth-verify-otp" disabled={busy || code.length !== 6} className="btn-ink w-full">{busy ? "Verifying…" : "Verify & continue"}</button>
            <button type="button" onClick={() => setStep("phone")} className="w-full text-sm ink-mute hover:text-[#0A0A0B]">← Use a different number</button>
          </form>
        )}

        {mode === "admin" && (
          <form onSubmit={adminLogin} className="mt-8 space-y-4">
            <div>
              <label className="overline">Admin email</label>
              <input data-testid={AUTH.emailInput} required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className={"mt-2 "+inputCls} placeholder="admin@oculux.com"/>
            </div>
            <div>
              <label className="overline">Password</label>
              <input required type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className={"mt-2 "+inputCls} placeholder="••••••••"/>
            </div>
            <button data-testid="auth-admin-submit" disabled={busy} className="btn-ink w-full">{busy ? "Please wait…" : "Sign in"}</button>
          </form>
        )}

        <p className="mt-8 text-center text-xs ink-faint">
          By continuing you agree to our <Link to="#" className="ink-soft">Terms</Link> & <Link to="#" className="ink-soft">Privacy</Link>.
        </p>
      </div>
    </main>
  );
}
