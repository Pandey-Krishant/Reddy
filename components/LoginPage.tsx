"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Auto-login support: if autologin=1 is in the URL, submit the form
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("autologin") === "1") {
        const u = params.get("u") || "";
        const p = params.get("p") || "";
        if (u) setUsername(u);
        if (p) setPassword(p);

        if (u && p) {
          setTimeout(() => {
            const form = document.getElementById(
              "login-form"
            ) as HTMLFormElement | null;
            form?.submit();
          }, 400);
        }
      }
    } catch {
      // Silent fail – normal login still works.
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      {/* Logo, Title, Form */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Logo */}
        <div className="mb-4">
          <Image
            src="https://puntingtossbook.com/assets/ptb_logo.png"
            alt="Punting Toss Book Logo"
            width={96}
            height={96}
            className="object-contain mx-auto drop-shadow-[0_0_25px_rgba(4,245,255,0.6)]"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="font-heading font-black text-2xl italic tracking-tighter mb-1">
          Reddy Win Toss Book

        </h1>
        <p className="text-[11px] text-gray-400 max-w-xs mx-auto mb-3 leading-snug">
          Asia&apos;s No. 1 Gaming Platform since 2023
        </p>

        {/* Login Form */}
        <div className="w-full max-w-sm">
          <form
            id="login-form"
            className="space-y-4"
            action="/api/proxy/login"
            method="post"
          >
            {/* Username */}
            <div className="text-left">
              <label
                className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1 mb-2 block"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username or Email"
                autoComplete="username"
                className="w-full glass-input rounded-2xl px-6 py-4 text-sm outline-none text-white placeholder:text-gray-600"
              />
            </div>

            {/* Password */}
            <div className="text-left">
              <div className="flex justify-between items-center mb-2">
                <label
                  className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1 block"
                  htmlFor="password"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full glass-input rounded-2xl pl-6 pr-10 py-4 text-sm outline-none text-white placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i
                    className={`fa-regular ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    } text-sm`}
                  />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full btn-primary font-heading font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] mt-4"
            >
              LOGIN
            </button>
          </form>

          {/* Social Links & Footer Text */}
          <div className="mt-8 sm:mt-12 md:mt-16 flex flex-col items-center space-y-3">
            {/* Footer Text */}
            <div className="text-center">
              <p className="text-gray-500 text-[11px] font-medium">
                Wanna Try Our Platform?
                <a
                  href="/api/proxy/auth?u=demo1&p=demo123&autologin=1"
                  className="text-[#04f5ff] font-black uppercase tracking-widest ml-1 hover:underline"
                >
                  Try Demo
                </a>
              </p>
              <p className="text-gray-500 text-[11px] font-medium">
                New to the Book?
                <a
                  href="https://t.me/ptbnewbranch"
                  target="_blank"
                  rel="noopener"
                  className="text-[#04f5ff] font-black uppercase tracking-widest ml-1 hover:underline"
                >
                  Get New ID
                </a>
              </p>
              <p className="text-gray-500 text-[11px] font-medium">
                Need help?
                <a
                  href="https://t.me/puntingtossbookcustomercare"
                  target="_blank"
                  rel="noopener"
                  className="text-[#04f5ff] font-semibold ml-1 hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex justify-center gap-2.5">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/profile.php?id=61555582344429"
                target="_blank"
                rel="noopener"
                className="social-btn w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#1877F2]"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f text-base" />
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/puntingtossbook/"
                target="_blank"
                rel="noopener"
                className="social-btn w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram text-base" />
              </a>

              {/* Telegram */}
              <a
                href="https://t.me/+rYAxEWE13LU5OGM1"
                target="_blank"
                rel="noopener"
                className="social-btn w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#229ED9]"
                aria-label="Telegram"
              >
                <i className="fab fa-telegram-plane text-base" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
