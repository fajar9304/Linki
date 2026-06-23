"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// Mock data representing database items for resilient client demo
const MOCK_CREATOR = {
  username: "sarah_skincare",
  displayName: "Sarah Skincare Reviews",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
  bio: "TikTok Affiliate (50k followers) ✨ Racun Skincare Terbukti Bikin Glowing! Klik link di bawah untuk langsung checkout di aplikasi Shopee/Tokopedia.",
  themeConfig: {
    backgroundColor: "#F0F3F7",
    cardColor: "#FFFFFF",
    primaryColor: "#00AA5B",
    primaryLightColor: "#E5F7EE",
  }
};

const MOCK_CATEGORIES = [
  { id: "all", name: "Semua Kategori" },
  { id: "skincare", name: "Skincare Glowing" },
  { id: "ootd", name: "OOTD Kampus" },
  { id: "promo", name: "Promo Terbaik" }
];

const MOCK_PRODUCTS = [
  {
    id: "prod-1",
    title: "Sunscreen Azarine Hydrasoothe Gel SPF 45",
    imageUrl: "/assets/skincare.png",
    price: 65000,
    originalPrice: 75000,
    discount: "13% Off",
    isActive: true,
    affiliateUrl: "https://shopee.co.id/product/123/456",
    categories: ["skincare", "promo"],
    createdAt: "2026-06-23T10:00:00.000Z"
  },
  {
    id: "prod-2",
    title: "Tote Bag Canvas Aesthetics Minimalist",
    imageUrl: "/assets/fashion.png",
    price: 110000,
    originalPrice: 159000,
    discount: "30% Off",
    isActive: true,
    affiliateUrl: "https://tokopedia.com/product/789/101",
    categories: ["ootd"],
    createdAt: "2026-06-23T09:00:00.000Z"
  },
  {
    id: "prod-3",
    title: "CeraVe Moisturizing Cream 454g Dry Skin",
    imageUrl: "/assets/skincare.png",
    price: 289000,
    originalPrice: 320000,
    discount: "9% Off",
    isActive: true,
    affiliateUrl: "https://shopee.co.id/product/555/666",
    categories: ["skincare"],
    createdAt: "2026-06-23T08:00:00.000Z"
  },
  {
    id: "prod-4",
    title: "OOTD Oversized Linen Shirt Casual Cozy",
    imageUrl: "/assets/fashion.png",
    price: 95000,
    originalPrice: 135000,
    discount: "29% Off",
    isActive: true,
    affiliateUrl: "https://tokopedia.com/product/333/444",
    categories: ["ootd", "promo"],
    createdAt: "2026-06-23T07:00:00.000Z"
  }
];

export default function CreatorPublicPage() {
  const params = useParams();
  const rawUsername = params?.username as string;
  const username = rawUsername || MOCK_CREATOR.username;

  // States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [creator, setCreator] = useState(MOCK_CREATOR);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "price-desc" | "price-asc">("latest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Attempt to load from real API if active, otherwise fallback to mock
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setIsLoading(true);
        // We will query backend API. If it fails, fallback silently to mock
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/creator/${username}`);
        if (response.ok) {
          const resData = await response.json();
          if (resData.creator) {
            const theme = resData.creator.themeConfig || {};
            setCreator({
              username: resData.creator.username,
              displayName: theme.displayName || resData.creator.username,
              avatarUrl: theme.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
              bio: theme.bio || "Selamat datang di halaman bio link saya!",
              themeConfig: {
                backgroundColor: theme.backgroundColor || "#F0F3F7",
                cardColor: theme.cardColor || "#FFFFFF",
                primaryColor: theme.primaryColor || "#00AA5B",
                primaryLightColor: theme.primaryLightColor || "#E5F7EE",
              }
            });
          }
          if (resData.categories) setCategories([{ id: "all", name: "Semua Kategori" }, ...resData.categories]);
          if (resData.products) setProducts(resData.products);
        }
      } catch (e) {
        console.log("Using dynamic mock data for preview (Offline mode)");
      } finally {
        setIsLoading(false);
      }
    };

    if (rawUsername) {
      fetchCreatorData();
    }
  }, [rawUsername, username]);

  // Filtering & Sorting Logic
  const sortedAndFilteredProducts = [...products]
    .filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.categories.includes(selectedCategory);
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase());
      return product.isActive && matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }
      if (sortBy === "price-desc") {
        return b.price - a.price;
      }
      if (sortBy === "oldest") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      }
      // default: latest
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const handleProductClick = (productId: string) => {
    // Navigate via our backend True Deep Linking Engine to force open native app
    const apiRedirectUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/r/${username}/${productId}`;
    window.open(apiRedirectUrl, "_blank");
  };

  const themeStyles = {
    "--color-tokped-bg": creator.themeConfig?.backgroundColor || "#F0F3F7",
    "--color-tokped-primary": creator.themeConfig?.primaryColor || "#00AA5B",
    "--color-tokped-primary-light": creator.themeConfig?.primaryLightColor || "#E5F7EE",
    "--color-tokped-card": creator.themeConfig?.cardColor || "#FFFFFF",
  } as React.CSSProperties;

  return (
    <div style={themeStyles} className="bg-tokped-bg min-h-screen pb-16 font-sans text-tokped-dark">
      {/* Creator Profile Header */}
      <div className="bg-tokped-card border-b border-tokped-border px-4 py-8 shadow-sm">
        <div className="mx-auto max-w-md flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img
              src={creator.avatarUrl}
              alt={creator.displayName}
              className="h-20 w-20 rounded-full border-2 border-tokped-primary object-cover shadow-md"
            />
            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white bg-tokped-primary flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          
          <h1 className="text-xl font-bold text-tokped-dark">@{username}</h1>
          <p className="mt-1 text-sm font-semibold text-tokped-muted">{creator.displayName}</p>
          <p className="mt-3 text-sm leading-relaxed text-tokped-muted max-w-sm px-4">
            {creator.bio}
          </p>
        </div>
      </div>

      {/* Main Product Feed Section */}
      <div className="mx-auto max-w-md px-4 mt-6">
        {/* Search Bar Component */}
        <div className="relative mb-5">
          <input
            type="text"
            placeholder="Cari produk rekomendasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-tokped-border bg-tokped-card py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-tokped-primary focus:ring-1 focus:ring-tokped-primary"
          />
          <svg
            className="absolute left-3.5 top-3.5 h-4 w-4 text-tokped-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Swipeable Categories Tab List */}
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-none flex gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-tokped-primary text-white shadow-sm"
                  : "bg-tokped-card border border-tokped-border text-tokped-muted hover:border-tokped-primary hover:text-tokped-primary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort and Count Summary Row */}
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-tokped-muted">
            {sortedAndFilteredProducts.length} Rekomendasi Produk
          </span>
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="bg-tokped-card border border-tokped-border rounded-lg text-[10px] font-bold px-2.5 py-1.5 flex items-center gap-1.5 text-tokped-dark hover:border-tokped-primary cursor-pointer shadow-sm transition-all"
            >
              {/* Active Icon based on sortBy */}
              {sortBy === "latest" && (
                <svg className="h-3.5 w-3.5 text-tokped-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {sortBy === "oldest" && (
                <svg className="h-3.5 w-3.5 text-tokped-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {sortBy === "price-desc" && (
                <svg className="h-3.5 w-3.5 text-tokped-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              )}
              {sortBy === "price-asc" && (
                <svg className="h-3.5 w-3.5 text-tokped-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4l4 4m0 0l-4 4m4-4H13" />
                </svg>
              )}
              <span>
                {sortBy === "latest" && "Terbaru"}
                {sortBy === "oldest" && "Terlama"}
                {sortBy === "price-desc" && "Harga: Termahal"}
                {sortBy === "price-asc" && "Harga: Termurah"}
              </span>
              <svg className="h-3 w-3 text-tokped-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isSortOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>
                
                {/* Dropdown Menu Box */}
                <div className="absolute right-0 mt-1.5 w-40 bg-white border border-tokped-border rounded-xl shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setSortBy("latest");
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${sortBy === "latest" ? "text-tokped-primary bg-[#E5F7EE]" : "text-tokped-dark"}`}
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0 text-tokped-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Terbaru</span>
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("oldest");
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${sortBy === "oldest" ? "text-tokped-primary bg-[#E5F7EE]" : "text-tokped-dark"}`}
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0 text-tokped-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Terlama</span>
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("price-desc");
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${sortBy === "price-desc" ? "text-tokped-primary bg-[#E5F7EE]" : "text-tokped-dark"}`}
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0 text-tokped-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span>Harga: Termahal</span>
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("price-asc");
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${sortBy === "price-asc" ? "text-tokped-primary bg-[#E5F7EE]" : "text-tokped-dark"}`}
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0 text-tokped-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4l4 4m0 0l-4 4m4-4H13" />
                    </svg>
                    <span>Harga: Termurah</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product List Grid */}
        {sortedAndFilteredProducts.length === 0 ? (
          <div className="bg-tokped-card border border-tokped-border rounded-2xl py-12 px-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-tokped-muted mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-bold text-tokped-dark">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-tokped-muted mt-1">Coba gunakan kata kunci pencarian atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {sortedAndFilteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-tokped-card border border-tokped-border rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md cursor-pointer transition-all duration-300 transform active:scale-[0.98]"
              >
                {/* Product Image */}
                <div className="relative bg-slate-100 aspect-square w-full">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.discount && (
                    <span className="absolute top-2.5 left-2.5 bg-tokped-danger text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      {product.discount}
                    </span>
                  )}
                </div>

                {/* Product Detail Container */}
                <div className="p-3 flex flex-col flex-grow justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-tokped-dark line-clamp-2 leading-relaxed min-h-[36px]">
                      {product.title}
                    </h3>
                    
                    <div className="mt-2.5 flex flex-col">
                      <span className="text-sm font-extrabold text-tokped-orange">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-tokped-muted line-through mt-0.5">
                          Rp {product.originalPrice.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Buy Button CTA */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product.id);
                    }}
                    className="w-full cursor-pointer mt-4 bg-tokped-primary text-white text-xs font-bold py-2 rounded-lg hover:brightness-95 active:brightness-90 transition-all flex items-center justify-center gap-1"
                  >
                    <span>Beli Sekarang</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Powered by Linki Watermark */}
      <div className="mt-12 text-center">
        <a href="#" className="inline-flex items-center gap-1.5 text-xs text-tokped-muted hover:text-tokped-primary transition-colors">
          <span className="font-semibold">Powered by</span>
          <span className="bg-tokped-primary text-white font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wide">LINKI</span>
        </a>
      </div>
    </div>
  );
}
