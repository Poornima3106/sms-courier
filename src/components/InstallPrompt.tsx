'use client';

import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed & opened as app)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA service worker registration skipped:', err);
      });
    }

    // Capture PWA beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt (Chrome/Edge/Android)
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Open helpful visual installation guide modal
      setShowModal(true);
    }
  };

  if (isStandalone) {
    return (
      <div
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold"
        title="Running in Standalone Application Mode"
      >
        <Check className="w-3.5 h-3.5 text-emerald-300" />
        <span>App Active</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#E5B84B] hover:bg-[#D4A738] text-[#5B0E1B] text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer animate-pulse select-none border border-[#FFE899]"
        title="Install as an application on your Desktop or Phone"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* Install Guide Modal (For iOS or manual instructions) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E0D12] text-gray-900 dark:text-gray-100 rounded-3xl shadow-2xl border border-[#EFE4D3] dark:border-[#3A1B23] w-full max-w-md overflow-hidden p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7A1626] text-[#E5B84B] flex items-center justify-center font-bold">
                  📲
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#7A1626] dark:text-[#E5B84B]">
                    Install SMS Courier App
                  </h3>
                  <p className="text-[11px] text-gray-500">Run as a standalone app on Desktop or Phone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Tabs/Content */}
            {isIos ? (
              <div className="space-y-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Follow these 2 quick steps in Safari to add to your iPhone / iPad Home Screen:
                </p>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                  <Share2 className="w-5 h-5 text-[#7A1626] dark:text-[#E5B84B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">1. Tap the Share Button</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Tap the square Share icon with the arrow pointing up at the bottom of Safari.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                  <PlusSquare className="w-5 h-5 text-[#7A1626] dark:text-[#E5B84B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">2. Tap &ldquo;Add to Home Screen&rdquo;</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Scroll down the share sheet and select &ldquo;Add to Home Screen&rdquo; then tap &ldquo;Add&rdquo;.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Desktop Instructions */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#140A0D] border border-gray-200 dark:border-gray-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#7A1626] dark:text-[#E5B84B]">
                    <Monitor className="w-4 h-4" />
                    <span>On Windows Desktop (Chrome / Edge):</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 pl-6">
                    Click the <strong>Install App icon (⊕ or 💻)</strong> on the right side of the browser address bar, or click browser menu (<strong>⋮</strong>) &rarr; <strong>Apps &rarr; Install this site as an app</strong>.
                  </p>
                </div>

                {/* Android Instructions */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#140A0D] border border-gray-200 dark:border-gray-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#7A1626] dark:text-[#E5B84B]">
                    <Smartphone className="w-4 h-4" />
                    <span>On Android (Chrome / Samsung Internet):</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 pl-6">
                    Tap the <strong>three dots menu (⋮)</strong> at top right &rarr; select <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white text-xs font-semibold cursor-pointer shadow-md transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
