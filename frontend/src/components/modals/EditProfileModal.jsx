import React, { useState, useEffect, useRef } from "react";
import { useProfile } from "../../context/ProfileContext";
import { updateProfileApi } from "../../services/profileService";
import { validateProfile } from "../../utils/validation";

const FlipCameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

export default function EditProfileModal({ onClose }) {
  const { profile, updateProfileLocal } = useProfile();
  
  // Form states
  const [fullname, setFullname] = useState(profile.fullname || "");
  const [username, setUsername] = useState(profile.username || "");
  const [email, setEmail] = useState(profile.email || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [birthdate, setBirthdate] = useState(profile.birthdate || "");
  const [gender, setGender] = useState(profile.gender || "Laki-laki");
  const [location, setLocation] = useState(profile.location || "");
  
  // Avatar & upload states
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  
  // UI states
  const [step, setStep] = useState("form"); // "form" | "camera"
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Camera refs & states
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);
  
  const cameraRef = useRef();
  const galleryRef = useRef();
  const videoRef = useRef(null);
  const activeStreamRef = useRef(null);

  // Handle file picker selection
  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setAvatarFile(selected);
    setAvatarPreview(URL.createObjectURL(selected));
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
          width: { ideal: 400 },
          height: { ideal: 400 }
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
    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 400;

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

      const capturedFile = new File([blob], `avatar_${Date.now()}.jpg`, { type: "image/jpeg" });
      setAvatarFile(capturedFile);
      setAvatarPreview(URL.createObjectURL(capturedFile));

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
    setStep("form");
  };

  const handleSave = async () => {
    const formData = {
      fullname,
      username,
      email,
      bio,
      phone,
      birthdate,
      gender,
      location
    };
    
    // Validate inputs
    const validation = validateProfile(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const response = await updateProfileApi(formData, avatarFile);
      if (response.success) {
        // Update global context state
        updateProfileLocal(response.user);
        alert("✅ Profil berhasil diperbarui!");
        onClose();
      } else {
        alert(response.message || "Gagal memperbarui profil.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {step === "camera" ? "Ambil Foto Profil" : "Edit Profile"}
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
          
          {step === "camera" ? (
            <div className="flex flex-col gap-4 pt-4 items-center">
              {/* Video container */}
              <div className="relative w-full aspect-square rounded-full overflow-hidden bg-black border border-slate-200 max-w-[280px]">
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white">
                    <p className="text-xs font-semibold text-red-400">{cameraError}</p>
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
                <button
                  type="button"
                  onClick={handleCancelCamera}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors active:scale-95"
                >
                  <ChevronLeft />
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!!cameraError || !cameraStream}
                  className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-slate-200 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 active:scale-90 transition-transform"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>

                <button
                  type="button"
                  onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
                  disabled={!!cameraError}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
                >
                  <FlipCameraIcon />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pt-4">
              
              {/* Avatar Selector */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full ring-4 ring-blue-500 ring-offset-2 overflow-hidden bg-slate-55 flex items-center justify-center">
                    <img src={avatarPreview} alt="avatar preview" className="w-20 h-20 object-cover" />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Galeri
                  </button>
                </div>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Form Fields */}
              <div className="flex flex-col gap-3">
                
                {/* Nama Lengkap */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullname}
                    onChange={e => setFullname(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className={`bg-slate-50 border rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors ${
                      errors.fullname ? "border-red-400 focus:border-red-400" : "border-slate-200"
                    }`}
                  />
                  {errors.fullname && <p className="text-[10px] text-red-500 font-semibold">{errors.fullname}</p>}
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className={`bg-slate-50 border rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors ${
                      errors.username ? "border-red-400 focus:border-red-400" : "border-slate-200"
                    }`}
                  />
                  {errors.username && <p className="text-[10px] text-red-500 font-semibold">{errors.username}</p>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Email / Gmail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contoh@gmail.com"
                    className={`bg-slate-50 border rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors ${
                      errors.email ? "border-red-400 focus:border-red-400" : "border-slate-200"
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Bio / Deskripsi</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Masukkan bio singkat"
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                {/* Nomor Telepon (Opsional) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nomor Telepon (Opsional)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Hanya angka (e.g. 0812345678)"
                    className={`bg-slate-50 border rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors ${
                      errors.phone ? "border-red-400 focus:border-red-400" : "border-slate-200"
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone}</p>}
                </div>

                {/* Grid 2 Column: Tanggal Lahir & Jenis Kelamin */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Tanggal Lahir */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={e => setBirthdate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>

                  {/* Jenis Kelamin */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Jenis Kelamin</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Lokasi / Kota (Opsional)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Jakarta, Indonesia"
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-full border border-slate-200 text-sm font-bold text-gray-500 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSave}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
