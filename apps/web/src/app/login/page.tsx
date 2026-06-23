"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !password) {
      setError("Semua kolom harus diisi");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal masuk. Periksa kembali data Anda.");
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan pada server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-tokped-bg min-h-screen flex items-center justify-center font-sans px-4 py-12">
      <div className="bg-white border border-tokped-border w-full max-w-md rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <span className="bg-tokped-primary text-white font-extrabold px-4 py-1.5 rounded-xl text-2xl tracking-wide inline-block shadow-sm">
            LINKI
          </span>
          <h2 className="text-xl font-extrabold text-tokped-dark mt-4">Masuk ke Akun Anda</h2>
          <p className="text-sm text-tokped-muted mt-1.5">Kelola tautan dan lihat performa analitik dengan mudah</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 bg-[#FFF0F0] border border-[#FFD9D9] text-tokped-danger text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-tokped-dark mb-1.5">Email atau Username</label>
            <input
              type="text"
              placeholder="Masukkan email atau username"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              className="w-full rounded-xl border border-tokped-border px-4 py-3 text-sm outline-none transition-all focus:border-tokped-primary focus:ring-1 focus:ring-tokped-primary"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-tokped-dark mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Masukkan password minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-tokped-border px-4 py-3 text-sm outline-none transition-all focus:border-tokped-primary focus:ring-1 focus:ring-tokped-primary"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer mt-4 bg-tokped-primary text-white font-extrabold py-3.5 rounded-xl hover:bg-[#00944F] active:bg-[#008044] disabled:opacity-50 transition-all flex items-center justify-center text-sm shadow-sm"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Masuk Sekarang"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center border-t border-tokped-border pt-5">
          <p className="text-xs text-tokped-muted">
            Belum punya akun Linki?{" "}
            <Link href="/register" className="text-tokped-primary font-bold hover:underline">
              Daftar Gratis
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
