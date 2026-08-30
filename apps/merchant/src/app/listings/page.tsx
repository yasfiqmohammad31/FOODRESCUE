"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Edit,
  Edit2,
  Minus,
  PackageOpen,
  PackagePlus,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { discountPercent, formatRupiah, formatTime } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";
import type { Listing, ListingCategory } from "@/types";

export default function MerchantListingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Full Edit Listing Modal State
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<ListingCategory>("MYSTERY_BOX");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editDiscountedPrice, setEditDiscountedPrice] = useState("");
  const [editQuantityTotal, setEditQuantityTotal] = useState("");
  const [editPickupStart, setEditPickupStart] = useState("");
  const [editPickupEnd, setEditPickupEnd] = useState("");
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  // Stock Edit Modal State
  const [editingStockListing, setEditingStockListing] = useState<Listing | null>(null);
  const [stockInput, setStockInput] = useState<number>(0);

  // Delete Confirmation Modal State
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch real-time listings from API
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const data = await merchantApi.getListings();
      if (data && Array.isArray(data)) {
        setListings(data);
      }
    } catch (err) {
      console.warn("Failed to fetch listings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Form State for new listing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ListingCategory>("MYSTERY_BOX");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickupStart, setPickupStart] = useState("");
  const [pickupEnd, setPickupEnd] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleApplyAiPrice = async (id: string, aiPrice: number) => {
    setListings(
      listings.map((l) =>
        l.id === id ? { ...l, discountedPrice: aiPrice, aiSuggestedPrice: null } : l
      )
    );
    try {
      await merchantApi.applyAiPrice(id);
    } catch (e) {
      console.warn("AI Price apply fallback:", e);
    }
    showToast("Harga saran AI berhasil diterapkan!");
  };

  const handleOpenStockModal = (listing: Listing) => {
    setEditingStockListing(listing);
    setStockInput(listing.quantityRemaining);
  };

  const handleSaveStock = async () => {
    if (!editingStockListing) return;
    const validatedStock = Math.max(0, stockInput);
    const targetId = editingStockListing.id;
    setListings(
      listings.map((l) =>
        l.id === targetId
          ? {
              ...l,
              quantityRemaining: validatedStock,
              status: validatedStock <= 0 ? "SOLD_OUT" : "ACTIVE",
            }
          : l
      )
    );
    try {
      await merchantApi.updateStock(targetId, validatedStock);
    } catch (e) {
      console.warn("Stock update fallback:", e);
    }
    setEditingStockListing(null);
    showToast(`Stok "${editingStockListing.title}" diubah menjadi ${validatedStock} porsi.`);
  };

  const handleOpenEditModal = (listing: Listing) => {
    setEditingListing(listing);
    setEditTitle(listing.title || "");
    setEditDescription(listing.description || "");
    setEditCategory(listing.category || "MYSTERY_BOX");
    setEditOriginalPrice((listing.originalPrice ?? 0).toString());
    setEditDiscountedPrice((listing.discountedPrice ?? 0).toString());
    setEditQuantityTotal((listing.quantityTotal ?? 1).toString());

    try {
      const startD = new Date(listing.pickupStart);
      const endD = new Date(listing.pickupEnd);
      setEditPickupStart(startD.toTimeString().slice(0, 5));
      setEditPickupEnd(endD.toTimeString().slice(0, 5));
    } catch {
      setEditPickupStart("18:00");
      setEditPickupEnd("21:00");
    }
    setEditFormErrors({});
  };

  const handleSaveEditListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    const newErrors: Record<string, string> = {};
    if (!editTitle.trim() || editTitle.trim().length < 3) {
      newErrors.title = "Nama paket minimal 3 karakter.";
    }
    if (!editDescription.trim() || editDescription.trim().length < 5) {
      newErrors.description = "Deskripsi paket minimal 5 karakter.";
    }

    const origPriceNum = Number(editOriginalPrice);
    const discPriceNum = Number(editDiscountedPrice);
    const qtyNum = Number(editQuantityTotal);

    if (!origPriceNum || origPriceNum <= 0) {
      newErrors.originalPrice = "Harga normal harus lebih dari Rp 0.";
    }
    if (!discPriceNum || discPriceNum <= 0) {
      newErrors.discountedPrice = "Harga diskon harus lebih dari Rp 0.";
    } else if (discPriceNum >= origPriceNum) {
      newErrors.discountedPrice = "Harga rescue harus lebih rendah dari harga normal.";
    }
    if (!qtyNum || qtyNum < 1) {
      newErrors.quantity = "Minimal 1 porsi.";
    }

    setEditFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const pickupStartIso = new Date(`${todayStr}T${editPickupStart}:00`).toISOString();
    const pickupEndIso = new Date(`${todayStr}T${editPickupEnd}:00`).toISOString();

    const targetId = editingListing.id;
    try {
      const res = await merchantApi.updateListing(targetId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        originalPrice: origPriceNum,
        discountedPrice: discPriceNum,
        quantityTotal: qtyNum,
        pickupStart: pickupStartIso,
        pickupEnd: pickupEndIso,
      });

      if (res.success && res.listing) {
        setListings(listings.map((l) => (l.id === targetId ? res.listing : l)));
      } else {
        setListings(
          listings.map((l) =>
            l.id === targetId
              ? {
                  ...l,
                  title: editTitle.trim(),
                  description: editDescription.trim(),
                  category: editCategory,
                  originalPrice: origPriceNum,
                  discountedPrice: discPriceNum,
                  quantityTotal: qtyNum,
                  pickupStart: pickupStartIso,
                  pickupEnd: pickupEndIso,
                }
              : l
          )
        );
      }
    } catch (err) {
      console.warn("Edit listing fallback:", err);
    }

    setEditingListing(null);
    showToast("Detail paket surplus berhasil diperbarui!");
  };

  const handleConfirmDelete = async () => {
    if (!deletingListing) return;
    const targetId = deletingListing.id;
    setListings(listings.filter((l) => l.id !== targetId));
    try {
      await merchantApi.deleteListing(targetId);
    } catch (e) {
      console.warn("Delete listing fallback:", e);
    }
    showToast(`Listing "${deletingListing.title}" berhasil dihapus.`);
    setDeletingListing(null);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3) {
      newErrors.title = "Nama paket minimal 3 karakter.";
    }

    if (!description.trim() || description.trim().length < 5) {
      newErrors.description = "Deskripsi paket minimal 5 karakter.";
    }

    const origPriceNum = Number(originalPrice);
    const discPriceNum = Number(discountedPrice);
    const qtyNum = Number(quantity);

    if (!origPriceNum || origPriceNum <= 0) {
      newErrors.originalPrice = "Harga normal harus lebih dari Rp 0.";
    }

    if (!discPriceNum || discPriceNum <= 0) {
      newErrors.discountedPrice = "Harga diskon harus lebih dari Rp 0.";
    } else if (discPriceNum >= origPriceNum) {
      newErrors.discountedPrice = "Harga rescue harus lebih rendah dari harga normal.";
    }

    if (!qtyNum || qtyNum < 1) {
      newErrors.quantity = "Minimal 1 porsi.";
    }

    if (pickupStart >= pickupEnd) {
      newErrors.pickupHours = "Jam selesai ambil harus lebih akhir dari jam mulai.";
    }

    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const pickupStartIso = new Date(`${todayStr}T${pickupStart}:00`).toISOString();
    const pickupEndIso = new Date(`${todayStr}T${pickupEnd}:00`).toISOString();

    try {
      const res = await merchantApi.createListing({
        title: title.trim(),
        description: description.trim(),
        category,
        originalPrice: origPriceNum,
        discountedPrice: discPriceNum,
        quantityTotal: qtyNum,
        pickupStart: pickupStartIso,
        pickupEnd: pickupEndIso,
      });

      if (res.success && res.listing) {
        setListings([res.listing, ...listings]);
      } else {
        await fetchListings();
      }
    } catch (e) {
      console.warn("Create listing fallback:", e);
    }

    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setOriginalPrice("");
    setDiscountedPrice("");
    setQuantity("");
    setPickupStart("");
    setPickupEnd("");
    setFormErrors({});
    showToast("Listing baru berhasil dipublikasikan!");
  };

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#1C1917] text-white border border-white/20 px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title Header */}
      <div>
        <h1 className="text-base sm:text-lg font-black text-foreground">
          Kelola Paket Surplus
        </h1>
        <p className="text-xs text-muted-foreground">
          Daftar paket surplus gerai Anda yang dapat direservasi pembeli.
        </p>
      </div>

      {/* Action Button (Separated) */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="w-full gap-1.5 font-black text-xs h-9 rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        <span>Buat Listing Baru</span>
      </Button>

      {/* AI Dynamic Pricing Alert */}
      <div className="rounded-xl border border-primary/20 bg-[#F3EFE6] px-3 py-2 text-foreground shadow-2xs flex items-center gap-2">
        <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground truncate">
          <strong className="text-primary font-bold">AI Pricing:</strong> Penyesuaian diskon otomatis aktif jelang tutup toko.
        </p>
      </div>

      {/* Listings List */}
      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <>
            <MerchantListingCardSkeleton />
            <MerchantListingCardSkeleton />
          </>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card flex flex-col items-center gap-2">
            <PackageOpen className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-xs font-bold text-foreground">Belum Ada Listing Surplus</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Buat paket surplus perdana Anda agar gerai dapat dibuka dan makanan tidak terbuang sia-sia.
            </p>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-xs font-bold rounded-xl bg-primary text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Buat Paket Pertama
            </Button>
          </div>
        ) : (
          listings.map((listing) => {
            const discount = discountPercent(listing.originalPrice, listing.discountedPrice);
            const pickupEnd = formatTime(new Date(listing.pickupEnd));
            const isSoldOut = listing.quantityRemaining <= 0 || listing.status === "SOLD_OUT";

            return (
              <Card
                key={listing.id}
                className="overflow-hidden border border-border bg-card p-2.5 shadow-2xs transition hover:border-primary/40 rounded-2xl flex flex-col gap-2"
              >
                <div className="flex gap-3 items-center">
                  {/* Left Photo Container */}
                  <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-muted">
                    <Image
                      src={listing.photoUrl}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                    {/* Discount Badge */}
                    <div className="absolute top-1 left-1">
                      <span className="inline-flex items-center rounded-md bg-[#E85D04] px-1.5 py-0.5 text-[10px] font-black text-white shadow-2xs tabular-nums">
                        -{discount}%
                      </span>
                    </div>

                    {/* Mystery Box Tag */}
                    {listing.category === "MYSTERY_BOX" && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <span className="flex items-center justify-center gap-0.5 rounded bg-[#F59E0B] px-1 py-0.5 text-[8px] font-black text-[#78350F] shadow-2xs">
                          <PackageOpen className="h-2.5 w-2.5 shrink-0" />
                          <span>Mystery</span>
                        </span>
                      </div>
                    )}

                    {/* Sold Out Overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-20">
                        <span className="rounded bg-destructive px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                          Habis
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Info Section */}
                  <div className="flex flex-1 flex-col justify-between min-w-0 gap-1 py-0.5">
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-bold text-muted-foreground uppercase truncate">
                        {listing.category === "MYSTERY_BOX" ? "Mystery Box" : "Menu Reguler"}
                      </span>
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                          isSoldOut
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isSoldOut ? "Habis" : "Aktif"}
                      </span>
                    </div>

                    <h3
                      className="text-xs sm:text-sm font-black leading-snug text-foreground line-clamp-1"
                      title={listing.title}
                    >
                      {listing.title}
                    </h3>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Ambil s/d {pickupEnd} WIB • Sisa {listing.quantityRemaining} porsi</span>
                    </div>

                    {/* Price & Interactive Actions Row */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/60">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                          {formatRupiah(listing.discountedPrice)}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                          {formatRupiah(listing.originalPrice)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Edit Full Details Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(listing)}
                          className="h-6.5 text-[10px] font-bold rounded-lg px-2 gap-1 border-border text-foreground hover:bg-muted"
                          title="Ubah Detail Paket"
                        >
                          <Edit className="h-2.5 w-2.5 text-foreground" />
                          <span>Edit</span>
                        </Button>

                        {/* Quick Stock Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStockModal(listing)}
                          className="h-6.5 text-[10px] font-bold rounded-lg px-2 gap-1 border-primary text-primary hover:bg-primary/10"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                          <span>Stok</span>
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingListing(listing)}
                          className="h-6.5 w-6.5 p-0 text-destructive hover:bg-destructive/10 rounded-lg"
                          aria-label="Hapus Listing"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Dynamic Price Suggestion */}
                {listing.aiSuggestedPrice && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs flex items-center justify-between gap-2 text-[#78350F]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Bot className="h-3.5 w-3.5 text-[#B45309] shrink-0" />
                      <p className="text-[11px] truncate">
                        Saran AI: Turunkan ke <strong>{formatRupiah(listing.aiSuggestedPrice)}</strong>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApplyAiPrice(listing.id, listing.aiSuggestedPrice!)}
                      className="h-6 text-[10px] font-black bg-[#E85D04] hover:bg-[#E85D04]/90 text-white rounded-lg shrink-0 px-2"
                    >
                      Terapkan
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Full Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black text-foreground">Edit Detail Paket Surplus</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditListing} className="py-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Paket
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className={`h-9 text-xs rounded-xl ${editFormErrors.title ? "border-destructive" : ""}`}
                />
                {editFormErrors.title && (
                  <span className="text-[10px] text-destructive font-semibold mt-1 block">
                    {editFormErrors.title}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Kategori
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ListingCategory)}
                  className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="MYSTERY_BOX">Mystery Box (Paket Kejutan)</option>
                  <option value="REGULAR">Menu Spesifik / Satuan</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Deskripsi Paket
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={2}
                  className={`w-full rounded-xl border bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary ${
                    editFormErrors.description ? "border-destructive" : "border-input"
                  }`}
                />
                {editFormErrors.description && (
                  <span className="text-[10px] text-destructive font-semibold mt-1 block">
                    {editFormErrors.description}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga Normal (Rp)
                  </label>
                  <Input
                    type="number"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(e.target.value)}
                    required
                    className={`h-9 text-xs rounded-xl ${editFormErrors.originalPrice ? "border-destructive" : ""}`}
                  />
                  {editFormErrors.originalPrice && (
                    <span className="text-[10px] text-destructive font-semibold mt-1 block">
                      {editFormErrors.originalPrice}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga Rescue (Diskon)
                  </label>
                  <Input
                    type="number"
                    value={editDiscountedPrice}
                    onChange={(e) => setEditDiscountedPrice(e.target.value)}
                    required
                    className={`h-9 text-xs rounded-xl ${editFormErrors.discountedPrice ? "border-destructive" : ""}`}
                  />
                  {editFormErrors.discountedPrice && (
                    <span className="text-[10px] text-destructive font-semibold mt-1 block">
                      {editFormErrors.discountedPrice}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Total Kuota
                  </label>
                  <Input
                    type="number"
                    value={editQuantityTotal}
                    onChange={(e) => setEditQuantityTotal(e.target.value)}
                    required
                    min={1}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Mulai Ambil
                  </label>
                  <Input
                    type="time"
                    value={editPickupStart}
                    onChange={(e) => setEditPickupStart(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Selesai Ambil
                  </label>
                  <Input
                    type="time"
                    value={editPickupEnd}
                    onChange={(e) => setEditPickupEnd(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingListing(null)}
                  className="flex-1 text-xs font-bold h-9 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-white text-xs font-black h-9 rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Edit Modal */}
      {editingStockListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl border border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-sm font-black text-foreground">Ubah Stok Surplus</h2>
              <button
                type="button"
                onClick={() => setEditingStockListing(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 flex flex-col gap-3">
              <div>
                <span className="text-xs font-bold text-foreground">
                  {editingStockListing.title}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Total kuota awal: {editingStockListing.quantityTotal} porsi
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setStockInput(Math.max(0, stockInput - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground hover:bg-accent transition font-bold"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <Input
                  type="number"
                  min={0}
                  value={stockInput}
                  onChange={(e) => setStockInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-12 w-20 text-center font-black text-lg rounded-xl"
                />

                <button
                  type="button"
                  onClick={() => setStockInput(stockInput + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition font-bold"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setEditingStockListing(null)}
                className="flex-1 text-xs font-bold h-9 rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveStock}
                className="flex-1 bg-primary text-white text-xs font-black h-9 rounded-xl"
              >
                Simpan Stok
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl border border-border">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">Konfirmasi Hapus Listing</h2>
                <span className="text-[11px] text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</span>
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus paket <strong>"{deletingListing.title}"</strong> (Sisa {deletingListing.quantityRemaining} porsi)? Listing tidak akan lagi muncul pada aplikasi konsumen.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeletingListing(null)}
                className="flex-1 text-xs font-bold h-9 rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-destructive text-white hover:bg-destructive/90 text-xs font-black h-9 rounded-xl shadow-xs"
              >
                Ya, Hapus Listing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Listing Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black text-foreground">Buat Listing Surplus Kilat</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="py-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Paket / Makanan Surplus
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Mystery Box Roti & Pastry Hari Ini"
                  required
                  className={`h-9 text-xs rounded-xl ${formErrors.title ? "border-destructive" : ""}`}
                />
                {formErrors.title && (
                  <span className="text-[10px] text-destructive font-semibold mt-1 block">
                    {formErrors.title}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory)}
                  className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="MYSTERY_BOX">Mystery Box (Rekomendasi - Terjual Lebih Cepat)</option>
                  <option value="REGULAR">Menu Spesifik / Satuan</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan perkiraan isi atau jaminan kualitas..."
                  required
                  rows={2}
                  className={`w-full rounded-xl border bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary ${
                    formErrors.description ? "border-destructive" : "border-input"
                  }`}
                />
                {formErrors.description && (
                  <span className="text-[10px] text-destructive font-semibold mt-1 block">
                    {formErrors.description}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga Normal (Rp)
                  </label>
                  <Input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Contoh: 50000"
                    required
                    className={`h-9 text-xs rounded-xl ${formErrors.originalPrice ? "border-destructive" : ""}`}
                  />
                  {formErrors.originalPrice && (
                    <span className="text-[10px] text-destructive font-semibold mt-1 block">
                      {formErrors.originalPrice}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga Rescue (Diskon)
                  </label>
                  <Input
                    type="number"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    placeholder="Contoh: 20000"
                    required
                    className={`h-9 text-xs rounded-xl ${formErrors.discountedPrice ? "border-destructive" : ""}`}
                  />
                  {formErrors.discountedPrice && (
                    <span className="text-[10px] text-destructive font-semibold mt-1 block">
                      {formErrors.discountedPrice}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Jumlah Porsi
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="5"
                    required
                    min={1}
                    className={`h-9 text-xs rounded-xl ${formErrors.quantity ? "border-destructive" : ""}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Mulai Ambil
                  </label>
                  <Input
                    type="time"
                    value={pickupStart}
                    onChange={(e) => setPickupStart(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Selesai Ambil
                  </label>
                  <Input
                    type="time"
                    value={pickupEnd}
                    onChange={(e) => setPickupEnd(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
              {formErrors.quantity && (
                <span className="text-[10px] text-destructive font-semibold block">
                  {formErrors.quantity}
                </span>
              )}
              {formErrors.pickupHours && (
                <span className="text-[10px] text-destructive font-semibold block">
                  {formErrors.pickupHours}
                </span>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormErrors({});
                    setIsModalOpen(false);
                  }}
                  className="flex-1 text-xs font-bold h-9 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-white text-xs font-black h-9 rounded-xl shadow-xs"
                >
                  Publikasikan Paket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MerchantListingCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border bg-card p-2.5 shadow-2xs rounded-2xl flex flex-col gap-2">
      <div className="flex gap-3 items-center">
        <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col justify-between min-w-0 gap-1.5 py-0.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3 w-10 rounded-md" />
          </div>
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
          <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-6.5 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </Card>
  );
}
