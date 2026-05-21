import React, { useEffect } from "react";
import { AppProvider, useAppContext } from "./context/AppContext.jsx";
import { ErrorBoundary } from "./components/shared/ErrorBoundary.jsx";
import { Toast } from "./components/shared/Toast.jsx";
import { Sidebar } from "./components/Layout/Sidebar.jsx";
import { Header } from "./components/Layout/Header.jsx";
import { Dashboard } from "./components/Dashboard/Dashboard.jsx";
import { History } from "./components/History/History.jsx";
import { Analytics } from "./components/Analytics/Analytics.jsx";
import { Settings } from "./components/Settings/Settings.jsx";
import { SettingsApp } from "./components/Settings/SettingsApp.jsx";
import { Accounts } from "./components/Accounts/Accounts.jsx";

function AppContent() {
  const {
    activeTab,
    updateModalOpen,
    setUpdateModalOpen,
    updateInfo,
    handleOpenExternal,
    loadAppVersion,
    toast,
    hideToast,
  } = useAppContext();

  useEffect(() => {
    loadAppVersion();
  }, [loadAppVersion]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "history":
        return <History />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      case "settings-app":
        return <SettingsApp />;
      case "accounts":
        return <Accounts />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden no-drag-region">
        <Header />

        <div className="flex-1 p-8 overflow-y-auto min-h-0 relative">
          {renderContent()}
        </div>
      </main>

      {/* UPDATE MODAL */}
      {updateModalOpen && updateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl relative">
            <button
              onClick={() => setUpdateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-2xl animate-bounce">
                🚀
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-200">
                  Pembaruan Versi Tersedia!
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Versi baru aplikasi telah dirilis di GitHub.
                </p>
              </div>
              <div className="flex gap-4 text-xs font-semibold py-2 px-4 bg-slate-950 rounded-xl border border-slate-850">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[10px]">
                    Versi Saat Ini
                  </span>
                  <span className="text-slate-300 font-mono">
                    {updateInfo.currentVersion}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-800 self-center"></div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[10px]">
                    Versi Terbaru
                  </span>
                  <span className="text-emerald-400 font-extrabold font-mono">
                    {updateInfo.latestVersion}
                  </span>
                </div>
              </div>
              {updateInfo.releaseNotes && (
                <div className="w-full text-left text-xs bg-slate-950/60 border border-slate-850/60 rounded-xl p-3.5 max-h-36 overflow-y-auto text-slate-400 leading-relaxed">
                  <strong className="text-slate-350 text-[11px] block mb-1">
                    Catatan Rilis:
                  </strong>
                  <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-400">
                    {updateInfo.releaseNotes}
                  </pre>
                </div>
              )}
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => {
                    handleOpenExternal(updateInfo.downloadUrl);
                    setUpdateModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  📥 Unduh & Perbarui
                </button>
                <button
                  onClick={() => setUpdateModalOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold uppercase transition-all duration-300"
                >
                  Nanti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST FEEDBACK NOTIFICATION */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
