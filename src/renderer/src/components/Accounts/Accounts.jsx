import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import {
  PLATFORMS,
  PLATFORM_NAMES,
  PLATFORM_DOMAINS,
} from "../../utils/constants.js";

export function Accounts() {
  const {
    cookiesStatus,
    activeSetupPlatform,
    setActiveSetupPlatform,
    cookieInput,
    setCookieInput,
    setupStep,
    setSetupStep,
    handleSaveCookie,
    handleDeleteCookie,
    handleOpenExternal,
    showToast,
  } = useAppContext();

  const platforms = [
    {
      id: PLATFORMS.INSTAGRAM,
      name: PLATFORM_NAMES[PLATFORMS.INSTAGRAM],
      domain: PLATFORM_DOMAINS[PLATFORMS.INSTAGRAM],
      color: "from-pink-600 to-rose-600",
      icon: (
        <svg
          className="w-6 h-6 text-pink-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      id: PLATFORMS.TWITTER,
      name: PLATFORM_NAMES[PLATFORMS.TWITTER],
      domain: PLATFORM_DOMAINS[PLATFORMS.TWITTER],
      color: "from-slate-700 to-slate-900",
      icon: (
        <svg
          className="w-6 h-6 text-slate-300"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: PLATFORMS.THREADS,
      name: PLATFORM_NAMES[PLATFORMS.THREADS],
      domain: PLATFORM_DOMAINS[PLATFORMS.THREADS],
      color: "from-zinc-800 to-zinc-950",
      icon: (
        <svg
          className="w-6 h-6 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9m4.5-1.206a8.959 8.959 0 0 1-4.5 1.206"
          />
        </svg>
      ),
    },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCookieInput(evt.target.result);
        showToast("File cookie berhasil dibaca!", "success");
      };
      reader.readAsText(file);
    }
  };

  const handleSaveCookieClick = async () => {
    const result = await handleSaveCookie();
    if (result.success) {
      showToast("Akun berhasil terhubung!", "success");
    } else {
      showToast(result.error || "Gagal menghubungkan akun", "error");
    }
  };

  const handleDeleteCookieClick = async (platform) => {
    const result = await handleDeleteCookie(platform);
    if (result.success) {
      showToast("Sesi berhasil diputus", "success");
    } else {
      showToast(result.error || "Gagal memutus sesi", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
          Kelola Akun & Kuki Sesi
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Hubungkan akun sosial media Anda secara aman menggunakan cookie sesi
          browser.
        </p>
      </div>

      {/* Grid 2 Column */}
      <div className="grid grid-cols-5 gap-6">
        {/* LEFT COLUMN: PLATFORMS STATUS (2/5 size) */}
        <div className="col-span-2 flex flex-col gap-4">
          {platforms.map((platform) => {
            const isConnected = cookiesStatus[platform.id];
            return (
              <div
                key={platform.id}
                onClick={() => {
                  setActiveSetupPlatform(platform.id);
                  setSetupStep(1);
                }}
                className={`bg-slate-900/40 backdrop-blur-md border rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:border-slate-700/80 shadow-lg relative overflow-hidden
                  ${
                    activeSetupPlatform === platform.id
                      ? "border-indigo-500/50 shadow-indigo-500/5 bg-slate-900/60"
                      : "border-slate-800/80"
                  }
                `}
              >
                {/* Status bar marker */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-[4px] 
                  ${isConnected ? "bg-emerald-500" : "bg-slate-700"}
                `}
                ></div>

                <div className="flex justify-between items-center pl-2">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="text-md font-bold text-slate-100">
                        {platform.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {platform.domain}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border tracking-wider select-none uppercase shadow-glow
                    ${
                      isConnected
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5"
                        : "text-amber-500 bg-amber-500/5 border-amber-500/10 shadow-none"
                    }
                  `}
                  >
                    {isConnected ? "Aktif" : "Setup Baru"}
                  </span>
                </div>

                <div className="flex gap-2 pl-2 mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSetupPlatform(platform.id);
                      setSetupStep(1);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 border
                      ${
                        activeSetupPlatform === platform.id
                          ? "bg-indigo-600 border-indigo-400/20 text-white shadow-md"
                          : "bg-slate-950/50 hover:bg-slate-900 border-slate-800 text-slate-300"
                      }
                    `}
                  >
                    Konfigurasi Sesi
                  </button>

                  {isConnected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCookieClick(platform.id);
                      }}
                      className="py-2 px-3 text-xs font-bold rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-rose-400 transition-all duration-300"
                      title="Hapus Sesi / Log Out"
                    >
                      Putus Sesi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE SETUP GUIDE (3/5 size) */}
        <div className="col-span-3 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-7 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[500px]">
          {/* Neon background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Guide Navigation Step Bar */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
                  Setup Wizard
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  Koneksi Akun{" "}
                  {activeSetupPlatform.charAt(0).toUpperCase() +
                    activeSetupPlatform.slice(1)}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-indigo-400 select-none">
                Langkah {setupStep} dari 3
              </span>
            </div>

            {/* Progress step markers */}
            <div className="flex items-center gap-2 mt-1.5">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div
                    onClick={() => setSetupStep(step)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-300 border
                      ${
                        setupStep === step
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400/20 text-white shadow-glow shadow-indigo-500/10"
                          : setupStep > step
                            ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400 font-black"
                            : "bg-slate-950/80 border-slate-800 text-slate-500"
                      }
                    `}
                  >
                    {setupStep > step ? "✓" : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-[2px] transition-all duration-500
                      ${setupStep > step ? "bg-emerald-800" : "bg-slate-800"}
                    `}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Contents */}
          <div className="flex-1 flex flex-col justify-center py-6">
            {setupStep === 1 && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                  <h4 className="text-sm font-bold text-indigo-300">
                    Langkah 1: Pasang Ekstensi Browser Exporter
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Playwright memerlukan kuki otentikasi sesi Anda dalam format
                    file teks (Netscape). Pasang ekstensi kuki terpercaya untuk
                    Chrome atau Edge agar Anda dapat mengekspornya dengan mudah.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    Rekomendasi Ekstensi Teraman & Tercepat:
                  </span>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex justify-between items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Get cookies.txt locally
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Mendukung ekspor kuki format Netscape (teks) secara
                        instan 1-klik.
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleOpenExternal(
                          "https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc",
                        )
                      }
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98] shadow-md border border-indigo-400/20"
                    >
                      Pasang di Chrome
                    </button>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-indigo-300">
                    Langkah 2: Dapatkan Cookie Netscape
                  </h4>

                  <ol className="text-xs text-slate-400 space-y-2.5 list-decimal pl-4.5 leading-relaxed">
                    <li>
                      Buka tab baru di browser Anda dan kunjungi situs resmi:
                      <button
                        onClick={() =>
                          handleOpenExternal(
                            activeSetupPlatform === "instagram"
                              ? "https://www.instagram.com"
                              : activeSetupPlatform === "twitter"
                                ? "https://x.com"
                                : "https://www.threads.net",
                          )
                        }
                        className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold inline-block ml-1"
                      >
                        {activeSetupPlatform === "instagram"
                          ? "instagram.com"
                          : activeSetupPlatform === "twitter"
                            ? "x.com"
                            : "threads.net"}{" "}
                        ↗
                      </button>
                    </li>
                    <li>
                      Pastikan Anda sudah <strong>masuk / login</strong> ke akun
                      sosial media Anda secara sukses di browser tersebut.
                    </li>
                    <li>
                      Klik ikon ekstensi{" "}
                      <strong>Get cookies.txt locally</strong>, lalu klik tombol{" "}
                      <strong>Export As 📥</strong> pada menu yang muncul.
                    </li>
                    <li>
                      Simpan file tersebut ke komputer Anda{" "}
                      <strong>tanpa mengubah nama filenya</strong> (biarkan
                      berformat .txt), lalu unggah atau tempel pada langkah
                      selanjutnya.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Langkah 3: Unggah atau Tempel Isi Cookie Netscape
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tempelkan data teks hasil ekspor dari ekstensi browser Anda
                    ke dalam kotak input di bawah.
                  </p>
                </div>

                {/* File Upload Zone */}
                <div className="relative border border-dashed border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 bg-slate-950/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📄</span>
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">
                        Punya file cookie .txt?
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Unggah langsung berkas teks cookie Anda di sini.
                      </span>
                    </div>
                  </div>

                  <label className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98] cursor-pointer">
                    Pilih File
                    <input
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                <textarea
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  placeholder="# Netscape HTTP Cookie File&#10;# This file is generated by Cookie-Editor&#10;.instagram.com	TRUE	/	TRUE	1791888888	sessionid	123456789..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 h-28 resize-none placeholder-slate-800"
                />
              </div>
            )}
          </div>

          {/* Wizard Footer Controls */}
          <div className="flex justify-between items-center border-t border-slate-800/50 pt-5">
            <button
              disabled={setupStep === 1}
              onClick={() => setSetupStep((prev) => prev - 1)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 select-none border
                ${
                  setupStep === 1
                    ? "bg-slate-950/20 border-slate-950/40 text-slate-600 cursor-not-allowed opacity-30"
                    : "bg-slate-950/40 hover:bg-slate-800/20 text-slate-300 border-slate-800"
                }
              `}
            >
              ← Kembali
            </button>

            {setupStep < 3 ? (
              <button
                onClick={() => setSetupStep((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/20 transition-all duration-300 active:scale-[0.98] shadow-md shadow-indigo-500/10"
              >
                Langkah Berikutnya →
              </button>
            ) : (
              <button
                onClick={handleSaveCookieClick}
                disabled={!cookieInput.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-300 flex items-center gap-1.5 border
                  ${
                    !cookieInput.trim()
                      ? "bg-slate-800 border-slate-700/50 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400/20 active:scale-[0.98] shadow-md shadow-emerald-500/15"
                  }
                `}
              >
                ⚡ Hubungkan Akun Sekarang
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informative Tips Footer Bar */}
      <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-5 flex gap-4 text-xs leading-relaxed text-slate-400 shadow-sm relative overflow-hidden">
        <span className="text-lg select-none">🔒</span>
        <div>
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
            Keamanan & Privasi Data Sesi
          </h4>
          Data kuki Anda disimpan secara terenkripsi sandi di dalam direktori
          penyimpanan internal yang aman di komputer lokal Anda. Data kuki{" "}
          <strong>
            tidak pernah dikirimkan ke server mana pun selain langsung ke domain
            sosial media tujuan
          </strong>{" "}
          untuk memverifikasi proses login browser otomatisasi.
        </div>
      </div>
    </div>
  );
}
