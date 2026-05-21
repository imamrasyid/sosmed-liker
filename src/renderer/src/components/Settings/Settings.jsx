import React from "react";
import { useConfig } from "../../hooks/useConfig.js";
import { useAppContext } from "../../context/AppContext.jsx";
import { USER_AGENTS } from "../../utils/constants.js";

export function Settings() {
  const { config, handleSaveConfig } = useConfig();
  const { showToast } = useAppContext();

  const [localConfig, setLocalConfig] = React.useState(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleConfigChange = async (key, value) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
    const success = await handleSaveConfig(key, value);
    if (success) {
      showToast("Konfigurasi berhasil disimpan", "success");
    } else {
      showToast("Gagal menyimpan konfigurasi", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400 tracking-tight">
          Parameter Automaton Bot
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Konfigurasi dinamis interaksi bot untuk meminimalkan risiko pembatasan
          (ban).
        </p>
      </div>

      {/* Informative tips box */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 flex gap-3 text-xs leading-relaxed text-slate-400 shadow-sm">
        <span className="text-md">💡</span>
        <div>
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
            Tips Keamanan Akun
          </h4>
          Untuk menghindari deteksi bot, sangat disarankan menggunakan jeda acak
          minimal <strong>3-6 detik</strong> dan membatasi pemindaian hingga{" "}
          <strong>20 postingan</strong> per sesi. Gunakan User Agent
          Chrome/Windows untuk kompatibilitas optimal.
        </div>
      </div>

      {/* Slider Controls Wrapper */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col gap-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/2 rounded-full blur-2xl pointer-events-none"></div>

        {/* SECTION 1: Kecepatan & Jeda */}
        <div className="flex flex-col gap-5">
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
            <span>⚡</span> 1. Kecepatan & Jeda Interaksi
          </h3>

          {/* Rentang Jeda */}
          <div className="flex flex-col gap-3.5">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-200">
                  Rentang Jeda Interaksi (Delay Range)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bot akan berdiam sejenak secara acak di rentang waktu ini
                  setelah menyukai postingan.
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-bold rounded-lg">
                {localConfig.minDelay / 1000}s - {localConfig.maxDelay / 1000}s
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Minimum Delay */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>Delay Minimum</span>
                  <span>{localConfig.minDelay / 1000} Detik</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={localConfig.minDelay}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setLocalConfig((prev) => ({ ...prev, minDelay: val }));
                    handleConfigChange("min_delay", val);
                    if (val > localConfig.maxDelay) {
                      setLocalConfig((prev) => ({
                        ...prev,
                        maxDelay: val + 1000,
                      }));
                      handleConfigChange("max_delay", val + 1000);
                    }
                  }}
                  className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Maximum Delay */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>Delay Maksimum</span>
                  <span>{localConfig.maxDelay / 1000} Detik</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="20000"
                  step="1000"
                  value={localConfig.maxDelay}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val < localConfig.minDelay) return;
                    setLocalConfig((prev) => ({ ...prev, maxDelay: val }));
                    handleConfigChange("max_delay", val);
                  }}
                  className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Batas & Pemindaian */}
        <div className="flex flex-col gap-5 border-t border-slate-800/40 pt-5">
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
            <span>🔍</span> 2. Parameter Pemindaian Timeline
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {/* Post Limit */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <div>
                  <span className="font-bold text-slate-200">
                    Post Limit per Profil
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Jumlah postingan baru yang akan dipindai per target.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">
                  {localConfig.limit} Post
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={localConfig.limit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setLocalConfig((prev) => ({ ...prev, limit: val }));
                  handleConfigChange("limit", val);
                  if (localConfig.consecutiveSkipsLimit > val) {
                    setLocalConfig((prev) => ({
                      ...prev,
                      consecutiveSkipsLimit: val,
                    }));
                    handleConfigChange("consecutive_skips_limit", val);
                  }
                }}
                className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Consecutive Skips Limit */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <div>
                  <span className="font-bold text-slate-200">
                    Batas Skip Berurutan
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Berhenti memindai jika menemukan N post sudah disukai
                    berturut-turut.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">
                  {localConfig.consecutiveSkipsLimit} Skips
                </span>
              </div>
              <input
                type="range"
                min="3"
                max={localConfig.limit}
                step="1"
                value={localConfig.consecutiveSkipsLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setLocalConfig((prev) => ({
                    ...prev,
                    consecutiveSkipsLimit: val,
                  }));
                  handleConfigChange("consecutive_skips_limit", val);
                }}
                className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-2">
            {/* Scroll Step (Pixel Distance) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <div>
                  <span className="font-bold text-slate-200">
                    Langkah Gulir (Scroll Step)
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Jarak tinggi gulir piksel browser saat memindai timeline.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">
                  {localConfig.scrollStep}px
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="1500"
                step="100"
                value={localConfig.scrollStep}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setLocalConfig((prev) => ({ ...prev, scrollStep: val }));
                  handleConfigChange("scroll_step", val);
                }}
                className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Max Scroll Attempts */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <div>
                  <span className="font-bold text-slate-200">
                    Maks Gulir Percobaan
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Batas percobaan gulir ketika tidak ada konten baru
                    terdeteksi.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold rounded-lg">
                  {localConfig.maxScrollAttempts} Kali
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={localConfig.maxScrollAttempts}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setLocalConfig((prev) => ({
                    ...prev,
                    maxScrollAttempts: val,
                  }));
                  handleConfigChange("max_scroll_attempts", val);
                }}
                className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Mode Browser & Privasi */}
        <div className="flex flex-col gap-5 border-t border-slate-800/40 pt-5">
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
            <span>🛡️</span> 3. Mode Browser & Keamanan Sesi
          </h3>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-200">
                Headless Mode (Sembunyikan Browser)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Jika aktif, browser otomatisasi akan disembunyikan dan bot
                berjalan di latar belakang.
              </p>
            </div>

            <button
              onClick={() => {
                const nextVal = !localConfig.headless;
                setLocalConfig((prev) => ({ ...prev, headless: nextVal }));
                handleConfigChange("headless", nextVal);
              }}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative border flex items-center px-1
                ${
                  localConfig.headless
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400/20"
                    : "bg-slate-950 border-slate-800"
                }
              `}
            >
              <span
                className={`w-4 h-4 rounded-full transition-all duration-300 shadow-lg
                ${
                  localConfig.headless
                    ? "translate-x-6 bg-white shadow-glow shadow-white/30"
                    : "translate-x-0 bg-slate-600"
                }
              `}
              ></span>
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-800/20 pt-4">
            <span className="text-xs font-bold text-slate-200">
              Browser User-Agent (Anti-Fingerprint)
            </span>
            <p className="text-[11px] text-slate-500">
              Pilih string agen pengguna browser untuk menyamarkan identitas bot
              dari pelacakan server sosial media.
            </p>

            <div className="grid grid-cols-4 gap-3 mt-1.5">
              {[
                { name: USER_AGENTS.DEFAULT, label: "Playwright Default" },
                { name: USER_AGENTS.CHROME_WINDOWS, label: "Chrome / Windows" },
                { name: USER_AGENTS.SAFARI_MACOS, label: "Safari / macOS" },
                { name: USER_AGENTS.FIREFOX_LINUX, label: "Firefox / Linux" },
              ].map((ua) => (
                <button
                  key={ua.name}
                  onClick={() => {
                    setLocalConfig((prev) => ({ ...prev, userAgent: ua.name }));
                    handleConfigChange("browser_user_agent", ua.name);
                  }}
                  className={`px-3 py-2 rounded-xl text-[10.5px] font-bold border transition-all duration-200 text-center
                    ${
                      localConfig.userAgent === ua.name
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 font-extrabold shadow-md shadow-indigo-500/5"
                        : "bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-350"
                    }
                  `}
                >
                  {ua.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
