"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  orderIndex: number;
}

interface Product {
  id: string;
  title: string;
  originalUrl: string;
  affiliateUrl: string;
  imageUrl: string;
  price: number;
  isActive: boolean;
  categories: string[]; // Category IDs
}

interface Analytics {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  topProducts: Array<{ id: string; title: string; clicks: number }>;
}

export default function CreatorDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  // DB Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalViews: 0,
    totalClicks: 0,
    ctr: 0,
    topProducts: [],
  });

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Form States - Product
  const [urlInput, setUrlInput] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [newCatName, setNewCatName] = useState("");

  // Form States - Profile & Theme
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#F0F3F7");
  const [primaryColor, setPrimaryColor] = useState("#00AA5B");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"links" | "categories" | "profile" | "analytics">("links");
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  // Check auth and load data
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUserStr = localStorage.getItem("user");

    if (!savedToken || !savedUserStr) {
      router.push("/login");
      return;
    }

    const savedUser = JSON.parse(savedUserStr);
    setToken(savedToken);
    setUsername(savedUser.username);

    // Initialize profile form states from themeConfig
    const theme = savedUser.themeConfig || {};
    setDisplayName(theme.displayName || savedUser.username);
    setBio(theme.bio || "");
    setAvatarUrl(theme.avatarUrl || "");
    setBackgroundColor(theme.backgroundColor || "#F0F3F7");
    setPrimaryColor(theme.primaryColor || "#00AA5B");

    // Fetch all dynamic data
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const headers = { Authorization: `Bearer ${savedToken}` };

        // Fetch categories
        const catRes = await fetch(`${apiBaseUrl}/categories`, { headers });
        const catData = await catRes.json();

        // Fetch products
        const prodRes = await fetch(`${apiBaseUrl}/products`, { headers });
        const prodData = await prodRes.json();

        // Fetch analytics
        const analyticRes = await fetch(`${apiBaseUrl}/analytics/summary`, { headers });
        const analyticData = await analyticRes.json();

        if (catRes.ok) setCategories(catData);
        if (prodRes.ok) {
          const formattedProducts = prodData.map((p: any) => ({
            id: p.id,
            title: p.title,
            originalUrl: p.originalUrl,
            affiliateUrl: p.affiliateUrl,
            imageUrl: p.imageUrl,
            price: Number(p.price),
            isActive: p.isActive,
            categories: p.categories?.map((c: any) => c.categoryId) || [],
          }));
          setProducts(formattedProducts);
        }
        if (analyticRes.ok) setAnalytics(analyticData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router, apiBaseUrl]);

  // Handle Web Scraper
  const handleScrape = async () => {
    if (!urlInput || !token) return;
    try {
      setIsScraping(true);
      const res = await fetch(`${apiBaseUrl}/products/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: urlInput }),
      });

      const result = await res.json();
      if (res.ok && result) {
        setTitle(result.title || "");
        setImageUrl(result.imageUrl || "");
        setPrice(result.price || 0);
      } else {
        alert("Gagal mengambil info produk secara otomatis. Isi manual di bawah.");
      }
    } catch (e) {
      alert("Error menghubungi scraper backend.");
    } finally {
      setIsScraping(false);
    }
  };

  // Add Product Link
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !urlInput || !token) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`${apiBaseUrl}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          originalUrl: urlInput,
          affiliateUrl: urlInput,
          imageUrl: imageUrl || "/assets/skincare.png",
          price: Number(price),
          categoryIds: selectedCats,
        }),
      });

      const newProd = await res.json();
      if (res.ok) {
        const formatted = {
          id: newProd.id,
          title: newProd.title,
          originalUrl: newProd.originalUrl,
          affiliateUrl: newProd.affiliateUrl,
          imageUrl: newProd.imageUrl,
          price: Number(newProd.price),
          isActive: newProd.isActive,
          categories: newProd.categories?.map((c: any) => c.categoryId) || [],
        };
        setProducts([formatted, ...products]);
        resetForm();

        const analyticRes = await fetch(`${apiBaseUrl}/analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (analyticRes.ok) setAnalytics(await analyticRes.json());
      } else {
        alert(newProd.message || "Gagal menyimpan produk.");
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi saat menambah produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active product status
  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (res.ok) {
        setProducts(products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
      }
    } catch (err) {
      alert("Gagal memperbarui status produk.");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?") || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      alert("Gagal menghapus produk.");
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !token) return;

    try {
      const res = await fetch(`${apiBaseUrl}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCatName,
          orderIndex: categories.length,
        }),
      });

      const newCat = await res.json();
      if (res.ok) {
        setCategories([...categories, newCat]);
        setNewCatName("");
      } else {
        alert(newCat.message || "Gagal menambahkan kategori.");
      }
    } catch (err) {
      alert("Gagal menghubungi server untuk menambah kategori.");
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Hapus kategori ini? Tautan produk di dalamnya tidak akan terhapus.") || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
      }
    } catch (err) {
      alert("Gagal menghapus kategori.");
    }
  };

  // Update Profile & Theme Config
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setIsSavingProfile(true);
      setProfileSuccess(false);

      // Simple primaryLightColor derivation
      let primaryLightColor = "#E5F7EE";
      if (primaryColor.toUpperCase() === "#FF5722") primaryLightColor = "#FFEBE5";
      else if (primaryColor.toUpperCase() === "#EC4899") primaryLightColor = "#FDF2F8";
      else primaryLightColor = primaryColor + "1A"; // append hex opacity fallback

      const res = await fetch(`${apiBaseUrl}/api/creator/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName,
          bio,
          avatarUrl,
          backgroundColor,
          cardColor: "#FFFFFF",
          primaryColor,
          primaryLightColor,
        }),
      });

      const result = await res.json();
      if (res.ok && result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        alert(result.message || "Gagal memperbarui profil.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan pengaturan profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Apply Theme Presets
  const applyThemePreset = (preset: "tokoped" | "shopee" | "dark") => {
    if (preset === "tokoped") {
      setBackgroundColor("#F0F3F7");
      setPrimaryColor("#00AA5B");
    } else if (preset === "shopee") {
      setBackgroundColor("#FFF5F0");
      setPrimaryColor("#FF5722");
    } else if (preset === "dark") {
      setBackgroundColor("#0F172A");
      setPrimaryColor("#EC4899");
    }
  };

  const resetForm = () => {
    setUrlInput("");
    setTitle("");
    setImageUrl("");
    setPrice(0);
    setSelectedCats([]);
  };

  // Copy Bio Link
  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="bg-tokped-bg min-h-screen flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-tokped-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-tokped-muted font-semibold">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  const publicPageLink = `${typeof window !== "undefined" ? window.location.origin : ""}/${username}`;

  return (
    <div className="bg-tokped-bg min-h-screen pb-16 font-sans text-tokped-dark">
      
      {/* Navbar Dashboard Header */}
      <div className="bg-white border-b border-tokped-border px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-tokped-primary text-white font-extrabold px-3 py-1 rounded-lg text-lg tracking-wide">
              LINKI
            </span>
            <span className="text-sm font-semibold text-tokped-muted hidden sm:inline">Dashboard Kreator</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-tokped-primary flex items-center justify-center text-white font-bold text-sm">
                {username ? username.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-sm font-bold">@{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs border border-tokped-border rounded-lg px-3 py-1.5 hover:bg-tokped-bg active:scale-95 transition-all font-semibold cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        
        {/* Bio Link Sharing Bar */}
        <div className="bg-white border border-tokped-border rounded-2xl p-5 mb-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col text-center md:text-left">
            <span className="text-[10px] font-bold text-tokped-muted uppercase tracking-wider">Tautan Media Sosial Anda</span>
            <a
              href={publicPageLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-extrabold text-tokped-primary hover:underline mt-1 break-all"
            >
              {publicPageLink}
            </a>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex-shrink-0 cursor-pointer w-full md:w-auto bg-tokped-primary hover:bg-[#00944F] text-white font-bold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
          >
            {copySuccess ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Salin Tautan</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex border-b border-tokped-border mb-6 overflow-x-auto scrollbar-none gap-2 bg-white rounded-xl px-2 shadow-sm">
          <button
            onClick={() => setActiveTab("links")}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "links"
                ? "border-tokped-primary text-tokped-primary"
                : "border-transparent text-tokped-muted hover:text-tokped-primary"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>🔗 Kelola Link</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "categories"
                ? "border-tokped-primary text-tokped-primary"
                : "border-transparent text-tokped-muted hover:text-tokped-primary"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>📁 Kategori</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-tokped-primary text-tokped-primary"
                : "border-transparent text-tokped-muted hover:text-tokped-primary"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>🎨 Desain & Profil</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "border-tokped-primary text-tokped-primary"
                : "border-transparent text-tokped-muted hover:text-tokped-primary"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>📈 Analitik Performa</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          
          {/* TAB 1: KELOLA LINK */}
          {activeTab === "links" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form */}
              <div className="lg:col-span-5">
                <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-6">
                  <h2 className="text-base font-bold mb-4 text-tokped-dark">Tambah Tautan Produk Baru</h2>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-tokped-muted mb-1.5">Tautan Asli E-Commerce (Shopee/Tokopedia)</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://shopee.co.id/product/..."
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="flex-grow rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleScrape}
                          disabled={isScraping || !urlInput}
                          className="bg-tokped-primary text-white font-bold rounded-lg px-3 py-2 text-xs hover:bg-[#00944F] disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
                        >
                          {isScraping ? "Mengambil..." : "Ambil Data"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-tokped-muted mb-1">Nama Produk</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Contoh: Sunscreen Glowing SPF 50"
                          className="w-full rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-tokped-muted">Tautan Gambar</label>
                          <button
                            type="button"
                            onClick={() => setIsGuideOpen(true)}
                            className="text-[10px] text-tokped-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            💡 Cara Upload Gambar
                          </button>
                        </div>
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="/assets/skincare.png"
                          className="w-full rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-tokped-muted mb-1">Harga Rekomendasi (Rp)</label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-tokped-muted mb-2">Pilih Kategori Produk</label>
                      {categories.length === 0 ? (
                        <p className="text-[10px] text-tokped-muted">Belum ada kategori. Silakan buat di tab Kategori.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {categories.map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                if (selectedCats.includes(cat.id)) {
                                  setSelectedCats(selectedCats.filter(id => id !== cat.id));
                                } else {
                                  setSelectedCats([...selectedCats, cat.id]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                                selectedCats.includes(cat.id)
                                  ? "bg-tokped-primary-light border-tokped-primary text-tokped-primary"
                                  : "bg-white border-tokped-border text-tokped-muted hover:border-tokped-primary"
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full cursor-pointer mt-2 bg-tokped-primary text-white font-extrabold rounded-lg py-2.5 hover:bg-[#00944F] disabled:opacity-50 transition-all text-xs"
                    >
                      {isSubmitting ? "Menyimpan..." : "Simpan & Pasang Tautan"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Table List */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white shadow-sm border border-tokped-border rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-tokped-border flex items-center justify-between">
                    <h2 className="text-base font-bold text-tokped-dark">Manajemen Tautan Afiliasi</h2>
                    <span className="bg-tokped-primary-light text-tokped-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {products.length} Tautan
                    </span>
                  </div>
                  
                  {products.length === 0 ? (
                    <div className="text-center py-12 px-6">
                      <p className="text-xs text-tokped-muted">Belum ada tautan produk. Silakan tambah produk baru di panel sebelah kiri.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-tokped-border bg-slate-50">
                            <th className="px-4 py-3 text-[10px] font-bold text-tokped-muted uppercase tracking-wider">Produk</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-tokped-muted uppercase tracking-wider">Harga</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-tokped-muted uppercase tracking-wider text-center">Status</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-tokped-muted uppercase tracking-wider text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-tokped-border">
                          {products.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={p.imageUrl}
                                    alt={p.title}
                                    className="h-9 w-9 rounded-lg border border-tokped-border object-cover flex-shrink-0"
                                  />
                                  <div className="max-w-[180px] sm:max-w-[240px]">
                                    <div className="text-xs font-bold text-tokped-dark truncate" title={p.title}>{p.title}</div>
                                    <a
                                      href={p.originalUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-tokped-muted truncate block hover:underline mt-0.5"
                                    >
                                      {p.originalUrl}
                                    </a>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-xs font-extrabold text-tokped-dark">Rp {p.price.toLocaleString("id-ID")}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <button
                                  onClick={() => toggleActive(p.id, p.isActive)}
                                  className={`px-2 py-0.5 cursor-pointer rounded-full text-[9px] font-bold transition-all ${
                                    p.isActive
                                      ? "bg-tokped-primary-light text-tokped-primary"
                                      : "bg-tokped-danger-light text-tokped-danger"
                                  }`}
                                >
                                  {p.isActive ? "Aktif" : "Non-aktif"}
                                </button>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="text-tokped-danger hover:underline text-[10px] font-bold active:scale-95 transition-all cursor-pointer"
                                >
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KELOLA KATEGORI */}
          {activeTab === "categories" && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-6">
                <h2 className="text-base font-bold mb-2 text-tokped-dark">Kelola Kategori</h2>
                <p className="text-xs text-tokped-muted mb-4">Buat kategori produk untuk mempermudah pengunjung menyaring rekomendasi produk Anda di halaman bio.</p>
                
                <form onSubmit={handleAddCategory} className="mb-6 flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama kategori baru (contoh: Racun Skincare, OOTD)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-grow rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-tokped-primary text-white font-bold rounded-lg px-4 py-2 text-xs hover:bg-[#00944F] transition-all cursor-pointer flex-shrink-0"
                  >
                    Tambah Kategori
                  </button>
                </form>

                {categories.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-tokped-border rounded-xl">
                    <p className="text-xs text-tokped-muted">Belum ada kategori kustom. Silakan buat kategori pertama Anda di atas.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-tokped-muted uppercase tracking-wider mb-2">Daftar Kategori Anda ({categories.length})</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between bg-slate-50 border border-tokped-border rounded-lg px-3 py-2 text-xs font-semibold hover:border-tokped-primary transition-all"
                        >
                          <span className="truncate pr-2">{cat.name}</span>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-tokped-danger hover:text-red-700 font-bold text-[10px] cursor-pointer flex-shrink-0"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROFIL & DESAIN */}
          {activeTab === "profile" && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-6">
                <h2 className="text-base font-bold mb-1 text-tokped-dark">Edit Profil & Desain Tema</h2>
                <p className="text-xs text-tokped-muted mb-4">Atur informasi publik Anda dan kustomisasi skema warna halaman bio link Anda agar menarik.</p>
                
                {profileSuccess && (
                  <div className="mb-4 bg-[#EAFBF3] border border-[#C6F2DF] text-tokped-primary text-xs font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Pengaturan berhasil disimpan!</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-tokped-muted mb-1">Nama Tampilan (Display Name)</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Masukkan nama tampilan profil"
                      className="w-full rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-tokped-muted mb-1">Bio Singkat</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tulis bio singkat profil anda..."
                      rows={2}
                      className="w-full rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-tokped-muted">URL Foto Profil (Avatar)</label>
                      <button
                        type="button"
                        onClick={() => setIsGuideOpen(true)}
                        className="text-[10px] text-tokped-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        💡 Panduan Upload ImageKit
                      </button>
                    </div>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-tokped-muted mb-2">Preset Desain Tema</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => applyThemePreset("tokoped")}
                        className="text-[10px] font-bold border border-tokped-border rounded-lg py-2.5 hover:border-tokped-primary transition-all text-center cursor-pointer bg-slate-50"
                      >
                        💚 Tokopedia
                      </button>
                      <button
                        type="button"
                        onClick={() => applyThemePreset("shopee")}
                        className="text-[10px] font-bold border border-tokped-border rounded-lg py-2.5 hover:border-[#FF5722] transition-all text-center cursor-pointer bg-slate-50"
                      >
                        🧡 Shopee
                      </button>
                      <button
                        type="button"
                        onClick={() => applyThemePreset("dark")}
                        className="text-[10px] font-bold border border-tokped-border rounded-lg py-2.5 hover:border-[#EC4899] transition-all text-center cursor-pointer bg-slate-50 text-slate-800"
                      >
                        🖤 Dark Pink
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-tokped-muted mb-1.5">Warna Background</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-7 w-10 border border-tokped-border rounded cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-tokped-muted">{backgroundColor.toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-tokped-muted mb-1.5">Warna Tombol</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-7 w-10 border border-tokped-border rounded cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-tokped-muted">{primaryColor.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full cursor-pointer mt-2 bg-tokped-primary text-white font-bold rounded-lg py-2 hover:bg-[#00944F] disabled:opacity-50 transition-all text-xs"
                  >
                    {isSavingProfile ? "Menyimpan..." : "Simpan Desain & Profil"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: ANALITIK PERFORMA */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-tokped-muted">Total Pengunjung Profil (Views)</span>
                  <span className="text-2xl font-extrabold mt-2 text-tokped-dark">{analytics.totalViews.toLocaleString("id-ID")}</span>
                </div>
                <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-tokped-muted">Total Klik Produk (Clicks)</span>
                  <span className="text-2xl font-extrabold mt-2 text-tokped-orange">{analytics.totalClicks.toLocaleString("id-ID")}</span>
                </div>
                <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-tokped-muted">Rata-Rata CTR (Real)</span>
                  <span className="text-2xl font-extrabold mt-2 text-tokped-primary">{analytics.ctr}%</span>
                </div>
              </div>

              {/* Performance/Top Products list */}
              <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-6">
                <h2 className="text-base font-bold mb-2 text-tokped-dark">Performa Tautan Teratas</h2>
                <p className="text-xs text-tokped-muted mb-4">Daftar produk rekomendasi Anda berdasarkan jumlah klik terbanyak dari pengunjung halaman bio Anda.</p>
                
                {analytics.topProducts.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-tokped-border rounded-xl">
                    <p className="text-xs text-tokped-muted">Belum ada data klik produk terkumpul.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-tokped-muted uppercase tracking-wider mb-1">Peringkat Klik Teratas</label>
                    <div className="divide-y divide-tokped-border bg-slate-50 border border-tokped-border rounded-xl px-4">
                      {analytics.topProducts.map((tp, idx) => (
                        <div key={tp.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-2.5 max-w-[70%]">
                            <span className="text-xs font-mono font-extrabold text-tokped-muted w-5">{idx + 1}.</span>
                            <span className="text-xs font-bold truncate text-tokped-dark" title={tp.title}>{tp.title}</span>
                          </div>
                          <span className="text-xs font-extrabold text-tokped-orange flex-shrink-0">{tp.clicks} klik</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ImageKit Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-tokped-border shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-4 right-4 text-tokped-muted hover:text-tokped-dark cursor-pointer font-bold text-sm"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-tokped-primary text-white text-xs font-extrabold px-2 py-0.5 rounded">LINKI Guide</span>
              <h3 className="text-sm font-extrabold text-tokped-dark">Panduan Upload Gambar Gratis</h3>
            </div>

            <p className="text-xs text-tokped-muted leading-relaxed mb-4">
              Karena LINKI adalah aplikasi minimalis (MVP), kami menyarankan Anda menggunakan layanan hosting gambar gratis yang andal seperti **ImageKit.io** untuk menyimpan foto profil atau gambar produk Anda secara permanen.
            </p>

            <div className="space-y-3.5 mb-6">
              <div className="flex gap-3">
                <span className="h-5 w-5 bg-tokped-primary-light text-tokped-primary text-xs font-extrabold rounded-full flex items-center justify-center flex-shrink-0">1</span>
                <div>
                  <h4 className="text-xs font-bold text-tokped-dark">Buat Akun Gratis</h4>
                  <p className="text-[10px] text-tokped-muted mt-0.5">Daftar secara gratis di website resmi ImageKit.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="h-5 w-5 bg-tokped-primary-light text-tokped-primary text-xs font-extrabold rounded-full flex items-center justify-center flex-shrink-0">2</span>
                <div>
                  <h4 className="text-xs font-bold text-tokped-dark">Unggah Foto/Gambar</h4>
                  <p className="text-[10px] text-tokped-muted mt-0.5">Masuk ke dashboard ImageKit, buka menu **Media Library**, lalu klik tombol **Upload** untuk mengunggah foto profil atau produk Anda.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="h-5 w-5 bg-tokped-primary-light text-tokped-primary text-xs font-extrabold rounded-full flex items-center justify-center flex-shrink-0">3</span>
                <div>
                  <h4 className="text-xs font-bold text-tokped-dark">Salin URL Gambar</h4>
                  <p className="text-[10px] text-tokped-muted mt-0.5">Klik pada gambar yang telah diunggah, lalu klik tombol **"Copy URL"** di bagian kanan atas/samping gambar.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="h-5 w-5 bg-tokped-primary-light text-tokped-primary text-xs font-extrabold rounded-full flex items-center justify-center flex-shrink-0">4</span>
                <div>
                  <h4 className="text-xs font-bold text-tokped-dark">Tempel di LINKI</h4>
                  <p className="text-[10px] text-tokped-muted mt-0.5">Kembali ke dashboard LINKI Anda, lalu tempel (*paste*) link URL tersebut ke dalam kolom input gambar.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href="https://imagekit.io/registration"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-tokped-primary hover:bg-[#00944F] text-white text-center font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Daftar ImageKit ↗
              </a>
              <button
                onClick={() => setIsGuideOpen(false)}
                className="flex-1 border border-tokped-border hover:bg-slate-50 text-tokped-dark text-center font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
