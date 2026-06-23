"use client";

import React, { useState, useEffect } from "react";

// Types
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
  originalPrice?: number;
  isActive: boolean;
  categories: string[]; // Category IDs
  clicksCount: number;
  viewsCount: number;
}

export default function CreatorDashboard() {
  const token = "linki-secret-token"; // Dev token matching backend AuthGuard
  const username = "sarah_skincare";

  // State
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "Semua Kategori", orderIndex: 0 },
    { id: "skincare", name: "Skincare Glowing", orderIndex: 1 },
    { id: "ootd", name: "OOTD Kampus", orderIndex: 2 }
  ]);
  const [products, setProducts] = useState<Product[]>([
    {
      id: "prod-1",
      title: "Sunscreen Azarine Hydrasoothe Gel SPF 45",
      originalUrl: "https://shopee.co.id/product/123/456",
      affiliateUrl: "https://shopee.co.id/product/123/456",
      imageUrl: "/assets/skincare.png",
      price: 65000,
      originalPrice: 75000,
      isActive: true,
      categories: ["skincare"],
      clicksCount: 384,
      viewsCount: 1200
    },
    {
      id: "prod-2",
      title: "Tote Bag Canvas Aesthetics Minimalist",
      originalUrl: "https://tokopedia.com/product/789/101",
      affiliateUrl: "https://tokopedia.com/product/789/101",
      imageUrl: "/assets/fashion.png",
      price: 110000,
      originalPrice: 159000,
      isActive: true,
      categories: ["ootd"],
      clicksCount: 182,
      viewsCount: 950
    }
  ]);

  // Form States
  const [urlInput, setUrlInput] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Scrape Product Details from URL
  const handleScrape = async () => {
    if (!urlInput) return;
    try {
      setIsScraping(true);
      const res = await fetch("http://localhost:5001/products/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ url: urlInput })
      });

      const result = await res.json();
      if (result.success && result.data) {
        setTitle(result.data.title || "");
        setImageUrl(result.data.imageUrl || "");
        setPrice(result.data.price || 0);
      } else {
        alert("Metadata scraping blocked or failed. Please fill details manually.");
        setTitle("");
        setImageUrl("/assets/skincare.png"); // Default mockup fallback
      }
    } catch (e) {
      alert("Backend API offline. Switched to manual input mode.");
      setImageUrl("/assets/skincare.png");
    } finally {
      setIsScraping(false);
    }
  };

  // Add Product link to grid list
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !urlInput) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      title,
      originalUrl: urlInput,
      affiliateUrl: urlInput,
      imageUrl: imageUrl || "/assets/skincare.png",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      isActive: true,
      categories: selectedCats,
      clicksCount: 0,
      viewsCount: 0
    };

    setProducts([newProduct, ...products]);
    resetForm();
  };

  const resetForm = () => {
    setUrlInput("");
    setTitle("");
    setImageUrl("");
    setPrice(0);
    setOriginalPrice(0);
    setSelectedCats([]);
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      orderIndex: categories.length
    };

    setCategories([...categories, newCat]);
    setNewCatName("");
  };

  // Toggle link status
  const toggleActive = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  // Calculations for dashboard metrics
  const totalViews = products.reduce((acc, p) => acc + p.viewsCount, 0);
  const totalClicks = products.reduce((acc, p) => acc + p.clicksCount, 0);
  const averageCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-tokped-bg min-h-screen pb-16 font-sans text-tokped-dark">
      {/* Navbar Dashboard Header */}
      <div className="bg-tokped-card border-b border-tokped-border px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-tokped-primary text-white font-extrabold px-3 py-1 rounded-lg text-lg tracking-wide">
              LINKI
            </span>
            <span className="text-sm font-semibold text-tokped-muted">Dashboard Kreator</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-tokped-primary flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="text-sm font-bold">@{username}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Stats & Link Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Summary Card Section */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-tokped-card shadow-sm border border-tokped-border rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-semibold text-tokped-muted">Total Views</span>
              <span className="text-2xl font-extrabold mt-2 text-tokped-dark">{totalViews.toLocaleString("id-ID")}</span>
            </div>
            <div className="bg-tokped-card shadow-sm border border-tokped-border rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-semibold text-tokped-muted">Total Clicks</span>
              <span className="text-2xl font-extrabold mt-2 text-tokped-orange">{totalClicks.toLocaleString("id-ID")}</span>
            </div>
            <div className="bg-tokped-card shadow-sm border border-tokped-border rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-semibold text-tokped-muted">Click-Through Rate (CTR)</span>
              <span className="text-2xl font-extrabold mt-2 text-tokped-primary">{averageCtr}%</span>
            </div>
          </div>

          {/* Form: Add New Affiliate Link */}
          <div className="bg-tokped-card shadow-sm border border-tokped-border rounded-2xl p-6">
            <h2 className="text-base font-bold mb-4">Tambah Tautan Produk Baru</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-tokped-muted mb-1.5">Tautan Asli E-Commerce (Shopee/Tokopedia)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://shopee.co.id/product/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-grow rounded-lg border border-tokped-border px-3 py-2 text-sm outline-none focus:border-tokped-primary"
                  />
                  <button
                    type="button"
                    onClick={handleScrape}
                    disabled={isScraping}
                    className="bg-tokped-primary text-white font-bold rounded-lg px-4 py-2 text-xs hover:bg-[#00944F] disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
                  >
                    {isScraping ? "Mengambil..." : "Ambil Data"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tokped-muted mb-1.5">Nama Produk</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Sunscreen Glowing Terlaris"
                    className="w-full rounded-lg border border-tokped-border px-3 py-2 text-sm outline-none focus:border-tokped-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tokped-muted mb-1.5">Tautan URL Gambar</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/assets/skincare.png"
                    className="w-full rounded-lg border border-tokped-border px-3 py-2 text-sm outline-none focus:border-tokped-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tokped-muted mb-1.5">Harga Diskon (Rp)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-tokped-border px-3 py-2 text-sm outline-none focus:border-tokped-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tokped-muted mb-1.5">Harga Asli/Coret (Rp) - Opsional</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-tokped-border px-3 py-2 text-sm outline-none focus:border-tokped-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-tokped-muted mb-2">Pilih Kategori Produk</label>
                <div className="flex flex-wrap gap-2.5">
                  {categories.filter(c => c.id !== "all").map(cat => (
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
                className="w-full cursor-pointer mt-4 bg-tokped-primary text-white font-extrabold rounded-lg py-2.5 hover:bg-[#00944F] transition-all"
              >
                Simpan & Pasang Tautan
              </button>

            </form>
          </div>

          {/* Table: Affiliate Link Table List */}
          <div className="bg-tokped-card shadow-sm border border-tokped-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-tokped-border">
              <h2 className="text-base font-bold">Manajemen Tautan Afiliasi</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-tokped-border">
                    <th className="px-6 py-3.5 text-xs font-bold text-tokped-muted uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-tokped-muted uppercase tracking-wider">Harga</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-tokped-muted uppercase tracking-wider">Performa</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-tokped-muted uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tokped-border">
                  {products.map((p) => {
                    const ctr = p.viewsCount > 0 ? ((p.clicksCount / p.viewsCount) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl} alt={p.title} className="h-10 w-10 object-cover rounded-lg bg-slate-100 border border-tokped-border" />
                            <div className="max-w-[200px]">
                              <p className="text-xs font-bold truncate">{p.title}</p>
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
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-[10px] text-tokped-muted">
                            <span>Views: <strong>{p.viewsCount}</strong></span>
                            <span>Clicks: <strong className="text-tokped-orange">{p.clicksCount}</strong></span>
                            <span className="text-tokped-primary font-bold">CTR: {ctr}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleActive(p.id)}
                            className={`px-3 py-1 cursor-pointer rounded-full text-[10px] font-bold transition-all ${
                              p.isActive
                                ? "bg-tokped-primary-light text-tokped-primary"
                                : "bg-tokped-danger-light text-tokped-danger"
                            }`}
                          >
                            {p.isActive ? "Aktif" : "Non-aktif"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Section: Category Management */}
        <div className="space-y-6">
          <div className="bg-tokped-card shadow-sm border border-tokped-border rounded-2xl p-6">
            <h2 className="text-base font-bold mb-4">Kelola Kategori</h2>
            
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
                className="bg-tokped-primary text-white font-bold rounded-lg px-3 py-2 text-xs hover:bg-[#00944F] transition-all cursor-pointer"
              >
                Tambah
              </button>
            </form>

            <div className="space-y-2.5">
              <label className="block text-[10px] font-bold text-tokped-muted uppercase tracking-wider mb-1">Daftar Kategori Anda</label>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between bg-tokped-bg border border-tokped-border rounded-lg px-3.5 py-2.5 text-xs font-semibold"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-tokped-muted font-mono">Index: {cat.orderIndex}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
