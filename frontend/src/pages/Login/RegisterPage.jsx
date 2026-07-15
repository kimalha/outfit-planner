import React, { useState } from "react";
import api from "../../utils/api";
import { UserIcon, MailIcon, LockIcon, EyeIcon } from "../../components/Common/Icons";

export default function RegisterPage({ onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleRegister = async () => {
    try {
      await api.post("/api/auth/register", {
        username,
        email,
        password
      });
      alert("Pendaftaran berhasil! Silakan masuk.");
      onBackToLogin();
    } catch (error) {
      alert("Pendaftaran gagal: " + (error.response?.data?.message || "Cek kembali data Anda."));
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 px-8">
      <div className="w-full max-w-xs flex flex-col items-center">
        {/* Logo area */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center border-2 border-blue-100">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Daftar Akun</h1>
            <p className="text-xs text-gray-500 mt-1">Buat akun untuk atur gayamu.</p>
          </div>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-3 shadow-sm focus-within:border-blue-400 transition-colors">
            <UserIcon />
            <input
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
              placeholder="Nama Pengguna"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-3 shadow-sm focus-within:border-blue-400 transition-colors">
            <MailIcon />
            <input
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
              placeholder="Surel"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-3 shadow-sm focus-within:border-blue-400 transition-colors">
            <LockIcon />
            <input
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
              placeholder="Kata Sandi"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}><EyeIcon /></button>
          </div>
          <button
            onClick={handleRegister}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-full py-3.5 text-sm transition-all shadow-lg shadow-blue-200"
          >
            Daftar
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Sudah punya akun? <span onClick={onBackToLogin} className="text-blue-600 font-medium cursor-pointer">Masuk</span>
          </p>
        </div>
      </div>
    </div>
  );
}
