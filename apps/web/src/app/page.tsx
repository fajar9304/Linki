"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="bg-tokped-bg min-h-screen flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-tokped-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs text-tokped-muted font-bold">Mengalihkan...</p>
      </div>
    </div>
  );
}
