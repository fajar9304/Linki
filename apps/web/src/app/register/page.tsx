"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError("Semua kolom harus diisi");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registrasi gagal. Coba username atau email lain.");
      }

      setSuccess("Registrasi berhasil! Mengalihkan ke halaman masuk...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
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
          <h2 className="text-xl font-extrabold text-tokped-dark mt-4">Buat Akun Kreator</h2>
          <p className="text-sm text-tokped-muted mt-1.5">Mulai bangun link-in-bio modern Anda secara gratis</p>
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

        {/* Success Alert */}
        {success && (
          <div className="mb-5 bg-[#EAFBF3] border border-[#C6F2DF] text-tokped-primary text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-tokped-dark mb-1.5">Username</label>
            <input
              type="text"
              placeholder="Contoh: sarah_reviews"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-tokped-border px-4 py-3 text-sm outline-none transition-all focus:border-tokped-primary focus:ring-1 focus:ring-tokped-primary"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-tokped-dark mb-1.5">Email</label>
            <input
              type="email"
              placeholder="Masukkan alamat email aktif"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div>
            <label className="block text-xs font-bold text-tokped-dark mb-1.5">Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Ulangi password Anda"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              "Daftar Sekarang"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center border-t border-tokped-border pt-5">
          <p className="text-xs text-tokped-muted">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="text-tokped-primary font-bold hover:underline">
              Masuk
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
