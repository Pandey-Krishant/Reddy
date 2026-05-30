"use client";

import { useState } from "react";
import Image from "next/image";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim() || !confirm.trim()) {
      setError("All fields are required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/local/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Registration failed");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      <style>{`
        body {
          background-color: #0d010e !important;
          background-image:
            radial-gradient(circle at 50% -20%, rgba(4,245,255,0.15), transparent 80%),
            url("https://www.transparenttextures.com/patterns/carbon-fibre.png") !important;
          color: white !important;
        }
      `}</style>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Logo */}
        <div className="mb-4">
          <Image
            src="/logo.jpg"
            alt="Reddywin Logo"
            width={96}
            height={96}
            className="object-contain mx-auto rounded-full drop-shadow-[0_0_25px_rgba(220,38,38,0.7)]"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="font-heading font-black text-2xl italic tracking-tighter mb-1">
          Create Account
        </h1>
        <p className="text-[11px] text-gray-400 max-w-xs mx-auto mb-6 leading-snug">
          Register to start playing on Reddy Win
        </p>

        {success ? (
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-6 mb-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-check text-emerald-400 text-2xl" />
              </div>
              <p className="font-heading font-black text-emerald-300 uppercase tracking-widest text-sm mb-1">
                Account Created!
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Your account has been registered. Contact admin via Telegram to get your balance topped up.
              </p>
              <a
                href="/"
                className="w-full inline-flex items-center justify-center btn-primary font-heading font-black py-3 rounded-2xl text-sm uppercase tracking-[0.2em]"
              >
                Go to Login
              </a>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Username */}
              <div className="text-left">
                <label
                  className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1 mb-2 block"
                  htmlFor="reg-username"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="reg-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  className="w-full glass-input rounded-2xl px-6 py-4 text-sm outline-none text-white placeholder:text-gray-600"
                />
              </div>

              {/* Password */}
              <div className="text-left">
                <label
                  className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1 mb-2 block"
                  htmlFor="reg-password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    id="reg-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full glass-input rounded-2xl pl-6 pr-10 py-4 text-sm outline-none text-white placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    <i className={`fa-regular ${showPass ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="text-left">
                <label
                  className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1 mb-2 block"
                  htmlFor="reg-confirm"
                >
                  Confirm Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  id="reg-confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full glass-input rounded-2xl px-6 py-4 text-sm outline-none text-white placeholder:text-gray-600"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-[11px] text-rose-300 font-semibold text-left">
                  <i className="fa-solid fa-triangle-exclamation mr-1.5" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full btn-primary font-heading font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] mt-4"
              >
                CREATE ACCOUNT
              </button>
            </form>

            <p className="mt-6 text-gray-500 text-[11px] font-medium">
              Already have an account?{" "}
              <a href="/" className="text-[#04f5ff] font-black uppercase tracking-widest hover:underline">
                Login
              </a>
            </p>

            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-left">
              <p className="text-[10px] text-amber-300 font-semibold">
                <i className="fa-solid fa-circle-info mr-1.5" />
                After registering, contact admin on Telegram to get your balance added.
              </p>
              <a
                href="https://t.me/Reddy_win"
                target="_blank"
                rel="noopener"
                className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-amber-400 font-black uppercase tracking-widest hover:underline"
              >
                <i className="fab fa-telegram-plane" /> @Reddy_win
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
