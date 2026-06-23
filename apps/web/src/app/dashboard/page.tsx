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

  // Form States
  const [urlInput, setUrlInput] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [newCatName, setNewCatName] = useState("");

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
          // Map DB response categories relation to string array of category IDs
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
          affiliateUrl: urlInput, // Using originalUrl as fallback or user-supplied link
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
        
        // Refresh analytics in case schema operations need updating
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

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
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

        {/* Main Grid Work Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Middle: Add Product Form & Product List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Form: Add New Tautan */}
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
                      className="flex-grow rounded-lg border border-tokped-border px-3 py-2.5 text-sm outline-none focus:border-tokped-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleScrape}
                      disabled={isScraping || !urlInput}
                      className="bg-tokped-primary text-white font-bold rounded-lg px-4 py-2 text-xs hover:bg-[#00944F] disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
                    >
                      {isScraping ? "Mengambil..." : "Ambil Data"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-tokped-muted mb-1.5">Nama Produk</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Sunscreen Glowing SPF 50"
                      className="w-full rounded-lg border border-tokped-border px-3 py-2 text-sm outline-none focus:border-tokped-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tokped-muted mb-1.5">Tautan Gambar</label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="/assets/skincare.png"
                      className="w-full rounded-lg border border-tokped-border px-3 py-2 text-sm outline-none focus:border-tokped-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-tokped-muted mb-1.5">Harga Rekomendasi (Rp)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-tokped-border px-3 py-2 text-sm outline-none focus:border-tokped-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-tokped-muted mb-2">Pilih Kategori Produk</label>
                  <div className="flex flex-wrap gap-2">
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
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                          selectedCats.includes(cat.id)
                            ? "bg-tokped-primary-light border-tokped-primary text-tokped-primary"
                            : "bg-white border-tokped-border text-tokped-muted hover:border-tokped-primary"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full cursor-pointer mt-4 bg-tokped-primary text-white font-extrabold rounded-lg py-3 hover:bg-[#00944F] disabled:opacity-50 transition-all text-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan & Pasang Tautan"}
                </button>

              </form>
            </div>

            {/* List Tautan */}
            <div className="bg-white shadow-sm border border-tokped-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-tokped-border">
                <h2 className="text-base font-bold text-tokped-dark">Manajemen Tautan Afiliasi</h2>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-tokped-muted">Belum ada tautan produk. Tambahkan di atas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-tokped-border bg-slate-50">
                        <th className="px-6 py-3.5 text-xs font-bold text-tokped-muted uppercase tracking-wider">Produk</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-tokped-muted uppercase tracking-wider">Harga</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-tokped-muted uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-tokped-muted uppercase tracking-wider text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tokped-border">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={p.imageUrl} alt={p.title} className="h-10 w-10 object-cover rounded-lg bg-slate-100 border border-tokped-border" />
                              <div className="max-w-[200px] md:max-w-[260px]">
                                <p className="text-xs font-bold truncate text-tokped-dark">{p.title}</p>
                                <a
                                  href={p.affiliateUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-mono text-tokped-primary hover:underline block truncate mt-1"
                                >
                                  {p.affiliateUrl}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-extrabold text-tokped-dark">Rp {p.price.toLocaleString("id-ID")}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleActive(p.id, p.isActive)}
                              className={`px-3 py-1 cursor-pointer rounded-full text-[10px] font-bold transition-all ${
                                p.isActive
                                  ? "bg-tokped-primary-light text-tokped-primary"
                                  : "bg-tokped-danger-light text-tokped-danger"
                              }`}
                            >
                              {p.isActive ? "Aktif" : "Non-aktif"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-tokped-danger hover:underline text-xs font-bold active:scale-95 transition-all cursor-pointer"
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

          {/* Right Section: Manage Categories & Top Products */}
          <div className="space-y-6">
            
            {/* Manage Categories Card */}
            <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-6">
              <h2 className="text-base font-bold mb-4 text-tokped-dark">Kelola Kategori</h2>
              
              <form onSubmit={handleAddCategory} className="mb-5 flex gap-2">
                <input
                  type="text"
                  placeholder="Nama kategori baru..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-grow rounded-lg border border-tokped-border px-3 py-2 text-xs outline-none focus:border-tokped-primary"
                  required
                />
                <button
                  type="submit"
                  className="bg-tokped-primary text-white font-bold rounded-lg px-4 py-2 text-xs hover:bg-[#00944F] transition-all cursor-pointer"
                >
                  Tambah
                </button>
              </form>

              {categories.length === 0 ? (
                <p className="text-xs text-tokped-muted text-center py-4">Belum ada kategori kustom.</p>
              ) : (
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-bold text-tokped-muted uppercase tracking-wider mb-1">Daftar Kategori Anda</label>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between bg-tokped-bg border border-tokped-border rounded-lg px-3 py-2 text-xs font-semibold"
                    >
                      <span>{cat.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-tokped-danger hover:text-red-700 font-bold text-[10px] cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance/Top Products list */}
            <div className="bg-white shadow-sm border border-tokped-border rounded-2xl p-6">
              <h2 className="text-base font-bold mb-4 text-tokped-dark">Performa Tautan Teratas</h2>
              
              {analytics.topProducts.length === 0 ? (
                <p className="text-xs text-tokped-muted text-center py-4">Belum ada data analitik klik.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.topProducts.map((tp, idx) => (
                    <div key={tp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 max-w-[70%]">
                        <span className="text-xs font-bold text-tokped-muted font-mono">{idx + 1}.</span>
                        <span className="text-xs font-bold truncate text-tokped-dark">{tp.title}</span>
                      </div>
                      <span className="text-xs font-extrabold text-tokped-orange">{tp.clicks} klik</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
