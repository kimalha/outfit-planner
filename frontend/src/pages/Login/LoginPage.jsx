import React, { useState } from "react";
import api from "../../utils/api";
import { MailIcon, LockIcon, EyeIcon } from "../../components/Common/Icons";

export default function LoginPage({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await api.post("/api/auth/login", {
        email: email,
        password: pw
      });
      
      // Simpan token untuk sesi user
      localStorage.setItem("token", response.data.token);
      alert("Login Berhasil!");
      onLogin(); // Pindah ke halaman utama
    } catch (error) {
      alert("Login gagal: Cek email atau password.");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 px-8">
      <div className="w-full max-w-xs flex flex-col items-center">
        {/* Logo area */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center border-2 border-blue-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Outfit.in</h1>
            <p className="text-sm text-gray-500 mt-1">Ayo atur gayamu hari ini.</p>
          </div>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-3 shadow-sm focus-within:border-blue-400 transition-colors">
            <MailIcon />
            <input
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
              placeholder="Masukkan Surel Anda"
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
              value={pw}
              onChange={e => setPw(e.target.value)}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}><EyeIcon /></button>
          </div>
          <button
            onClick={handleLogin}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-full py-3.5 text-sm transition-all shadow-lg shadow-blue-200"
          >
            Masuk
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Belum punya akun? <span onClick={onGoToRegister} className="text-blue-600 font-medium cursor-pointer">Daftar</span>
          </p>
        </div>
      </div>
    </div>
  );
}
