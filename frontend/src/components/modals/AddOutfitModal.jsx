import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useCategories } from "../../context/CategoryContext";
import { useOutfit } from "../../context/OutfitContext";
import { useNotifications } from "../../context/NotificationContext";
import { CameraIcon, FlipCameraIcon, ChevronLeft } from "../Common/Icons";

export default function AddOutfitModal({ onClose, onSuccess }) {
  const { clothingCategories } = useCategories();
  const { addOutfit } = useOutfit();
  const { addNotification } = useNotifications();

  const [step, setStep] = useState("choose"); // "choose" | "camera" | "form"
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const [name, setName]       = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading]   = useState(false);

  // Set kategori default ke item pertama saat clothingCategories berubah
  useEffect(() => {
    if (clothingCategories.length > 0 && !category) {
      setCategory(clothingCategories[0].name);
    }
  }, [clothingCategories, category]);

  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);

  const cameraRef = useRef();
  const galleryRef = useRef();
  const videoRef = useRef(null);
  const activeStreamRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStep("form");
  };

  const handleCameraClick = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setStep("camera");
    } else {
      cameraRef.current?.click();
    }
  };

  const startCamera = async (mode = facingMode) => {
    try {
      setCameraError(null);
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
      }
      
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStreamRef.current = stream;
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Gagal mengakses kamera:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        activeStreamRef.current = stream;
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (fallbackErr) {
        setCameraError("Kamera tidak tersedia atau izin ditolak.");
      }
    }
  };

  useEffect(() => {
    if (step === "camera") {
      startCamera(facingMode);
    } else {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
        setCameraStream(null);
      }
    }

    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
      }
    };
  }, [step, facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Gagal memproses gambar!");
        return;
      }

      const capturedFile = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      setFile(capturedFile);
      setPreview(URL.createObjectURL(capturedFile));

      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
        setCameraStream(null);
      }

      setStep("form");
    }, "image/jpeg", 0.9);
  };

  const handleCancelCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
      setCameraStream(null);
    }
    setStep("choose");
  };

  const handleSave = async () => {
    if (!name.trim()) { alert("Nama pakaian wajib diisi!"); return; }
    if (!file)        { alert("Gambar wajib dipilih!"); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("image", file);
      await addOutfit(formData);
      alert("✅ Pakaian berhasil disimpan ke lemari!");
      addNotification("Outfit berhasil ditambahkan.");
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      alert("Gagal menyimpan: " + (err.response?.data?.message || "Cek koneksi server."));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      {/* Sheet panel */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white flex flex-col"
        style={{ borderRadius: "28px 28px 0 0", maxHeight: "92%" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-gray-900">
            {step === "choose" ? "Tambah Pakaian Baru" : step === "camera" ? "Ambil Foto Pakaian" : "Detail Pakaian"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-8">

          {/* STEP 1 — pilih sumber */}
          {step === "choose" && (
            <div className="flex flex-col gap-4 pt-5">
              <p className="text-sm text-gray-500 text-center">Pilih cara menambahkan gambar pakaian</p>

              {/* Kamera */}
              <button
                type="button"
                onClick={handleCameraClick}
                className="flex flex-col items-center gap-3 bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 cursor-pointer active:scale-95 transition-transform hover:bg-blue-100 w-full"
              >
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <CameraIcon />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-700">Ambil Foto</p>
                  <p className="text-xs text-blue-500">Gunakan kamera perangkat</p>
                </div>
              </button>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Galeri */}
              <label className="flex flex-col items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 cursor-pointer active:scale-95 transition-transform hover:bg-slate-100">
                <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center shadow-lg shadow-slate-200">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">Pilih dari Galeri</p>
                  <p className="text-xs text-gray-500">Upload dari penyimpanan</p>
                </div>
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}

          {/* STEP 1.5 — Kamera stream */}
          {step === "camera" && (
            <div className="flex flex-col gap-4 pt-4 items-center">
              {/* Video container */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-slate-200">
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                      <line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                    <p className="text-sm font-semibold text-red-400">{cameraError}</p>
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-xs transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                  />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between w-full px-6 mt-2">
                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={handleCancelCamera}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors active:scale-95"
                  title="Kembali"
                >
                  <ChevronLeft />
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!!cameraError || !cameraStream}
                  className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-slate-200 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:border-slate-100 active:scale-90 transition-transform shadow-lg shadow-blue-200"
                  title="Ambil Foto"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>

                {/* Switch Camera Button */}
                <button
                  type="button"
                  onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
                  disabled={!!cameraError}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors active:scale-95"
                  title="Putar Kamera"
                >
                  <FlipCameraIcon />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — form + preview */}
          {step === "form" && (
            <div className="flex flex-col gap-4 pt-4">

              {/* Preview */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setStep("choose"); setPreview(null); setFile(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center font-bold"
                >
                  ↺
                </button>
              </div>

              {/* Nama Pakaian */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Pakaian</label>
                <input
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors"
                  placeholder="contoh: Kaos Putih Polos"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              {/* Kategori — Dinamis dari CategoryContext */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</label>
                {clothingCategories.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Memuat kategori...</p>
                ) : clothingCategories.length <= 6 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {clothingCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={`py-2.5 rounded-2xl text-sm font-semibold transition-all border ${
                          category === cat.name
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                            : "bg-slate-50 text-gray-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <select
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {clothingCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Simpan */}
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity="0.3"/>
                      <path d="M21 12a9 9 0 0 1-9 9"/>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "💕 Simpan ke Lemari"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
