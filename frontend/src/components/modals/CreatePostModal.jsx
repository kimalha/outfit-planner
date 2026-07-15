import React, { useState, useEffect, useRef } from "react";
import { usePlanner } from "../../context/PlannerContext";
import { usePosts } from "../../context/PostContext";
import { useProfile } from "../../context/ProfileContext";
import { useOutfit } from "../../context/OutfitContext";

// Icons
const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const FlipCameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

export default function CreatePostModal({ onClose, clothes: propsClothes }) {
  const { profile } = useProfile();
  const { plannerData } = usePlanner();
  const { createPost } = usePosts();
  const { clothes: contextClothes } = useOutfit();

  const clothes = propsClothes || contextClothes;

  const [step, setStep] = useState("choose"); // "choose" | "camera" | "form"
  const [preview, setPreview] = useState(null);
  
  // Form states
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [selectedOutfit, setSelectedOutfit] = useState(null); // { id, name, image_url }
  const [outfitSource, setOutfitSource] = useState("recent"); // "recent" | "catalog"
  const [postDate, setPostDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [postTime, setPostTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Camera stream states
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);

  const cameraRef = useRef();
  const galleryRef = useRef();
  const videoRef = useRef(null);
  const activeStreamRef = useRef(null);

  // Extract recently worn outfits from Planner
  const getRecentlyWornOutfits = () => {
    const worn = [];
    Object.entries(plannerData).forEach(([dateStr, dayData]) => {
      if (dayData.confirmed && dayData.outfits && dayData.outfits.length > 0) {
        dayData.outfits.forEach(outfit => {
          if (!worn.some(w => w.id === outfit.id)) {
            worn.push({
              id: outfit.id,
              name: outfit.name,
              image_url: outfit.image_url,
              category: outfit.category,
              dateStr
            });
          }
        });
      }
    });
    return worn;
  };

  const recentlyWorn = getRecentlyWornOutfits();

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setStep("form");
    };
    reader.readAsDataURL(selected);
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
          width: { ideal: 640 },
          height: { ideal: 640 }
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
      setCameraError("Kamera tidak tersedia atau izin ditolak.");
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
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setPreview(dataUrl);

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
      setCameraStream(null);
    }

    setStep("form");
  };

  const handleCancelCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
      setCameraStream(null);
    }
    setStep("choose");
  };

  const handleSavePost = () => {
    if (!preview) {
      alert("Foto postingan wajib dipilih/diambil!");
      return;
    }
    if (!caption.trim()) {
      alert("Caption tidak boleh kosong!");
      return;
    }

    createPost({
      userId: profile?.id || 'user_1',
      photo: preview,
      caption: caption.trim(),
      outfitId: selectedOutfit ? selectedOutfit.id : null,
      outfitName: selectedOutfit ? selectedOutfit.name : null,
      location: location.trim(),
      createdAt: new Date().toISOString()
    });

    setSubmitSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const outfitList = outfitSource === "recent" ? recentlyWorn : clothes;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white flex flex-col"
        style={{ borderRadius: "28px 28px 0 0", maxHeight: "92%", height: "92%" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-slate-200 cursor-pointer" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {step === "choose" ? "Buat Postingan Baru" : step === "camera" ? "Ambil Foto" : "Detail Postingan"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none hover:bg-slate-200 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {/* STEP 1: Choose photo source */}
          {step === "choose" && (
            <div className="flex flex-col gap-4 pt-5">
              <p className="text-sm text-gray-500 text-center">Pilih cara menambahkan foto postingan</p>

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
                  <p className="text-xs text-gray-500">Upload dari galeri perangkat</p>
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

          {/* STEP 1.5: Live Camera feed */}
          {step === "camera" && (
            <div className="flex flex-col gap-4 pt-4 items-center">
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black border border-slate-200">
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

              {/* Shutter controls */}
              <div className="flex items-center justify-between w-full px-6 mt-2">
                <button
                  type="button"
                  onClick={handleCancelCamera}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors active:scale-95"
                  title="Kembali"
                >
                  <ChevronLeft />
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!!cameraError || !cameraStream}
                  className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-slate-200 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:border-slate-100 active:scale-90 transition-transform shadow-lg shadow-blue-200"
                  title="Ambil Foto"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>

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

          {/* STEP 2: Detail form */}
          {step === "form" && (
            <div className="flex flex-col gap-4 pt-4">
              {/* Photo preview */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setStep("choose"); setPreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white text-base flex items-center justify-center font-bold shadow-md hover:bg-black/80 transition-colors"
                >
                  ↺
                </button>
              </div>

              {/* Caption */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Caption</label>
                <textarea
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors h-24 resize-none"
                  placeholder="Ceritakan tentang outfit atau kegiatan Anda..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
              </div>

              {/* Lokasi */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lokasi (Opsional)</label>
                <input
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors"
                  placeholder="e.g. Jakarta, Indonesia atau Cafe Senja"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              {/* Date & Time of Posting */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Posting</label>
                  <input
                    type="date"
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors"
                    value={postDate}
                    onChange={e => setPostDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu Posting</label>
                  <input
                    type="time"
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors"
                    value={postTime}
                    onChange={e => setPostTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Outfit Link Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tautkan Outfit (Opsional)</label>
                  <div className="flex gap-2 bg-slate-100 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => setOutfitSource("recent")}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        outfitSource === "recent" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      Pernah Dipakai
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutfitSource("catalog")}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        outfitSource === "catalog" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      Dari Katalog
                    </button>
                  </div>
                </div>

                {outfitList.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    {outfitSource === "recent"
                      ? "Belum ada outfit yang dikonfirmasi (Calendar)."
                      : "Katalog pakaian Anda kosong."}
                  </p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {outfitList.map(outfit => {
                      const isSelected = selectedOutfit?.id === outfit.id;
                      return (
                        <div
                          key={outfit.id}
                          onClick={() => setSelectedOutfit(isSelected ? null : outfit)}
                          className={`flex items-center gap-2 p-2 rounded-2xl border cursor-pointer transition-all flex-shrink-0 min-w-[130px] max-w-[170px] ${
                            isSelected
                              ? "bg-blue-50 border-blue-500 text-blue-800"
                              : "bg-slate-50 border-slate-200 text-gray-700 hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={outfit.image_url}
                            alt={outfit.name}
                            className="w-10 h-10 object-cover rounded-xl flex-shrink-0"
                          />
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold truncate leading-tight">{outfit.name}</p>
                            <p className="text-[8px] opacity-75 font-semibold uppercase tracking-wider">{outfit.category}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit button */}
              {submitSuccess ? (
                <div className="w-full mt-4 bg-green-500 text-white font-bold py-4 rounded-full text-sm flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Postingan Berhasil Diunggah!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSavePost}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-full text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  🚀 Bagikan Postingan
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
