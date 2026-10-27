import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const iOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iOSDevice);

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 transition active:scale-95 shadow-xs"
        title="Install Android Web APK or Home Screen App"
      >
        <Smartphone className="w-3.5 h-3.5 text-teal-600" />
        <span>Install App</span>
      </button>

      {/* iOS Safari Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-teal-100 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Install ReVoice Audio</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Install <strong>ReVoice Audio</strong> on your mobile home screen for offline audio recording:
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1.5 text-xs text-slate-600">
              <li>Tap the <strong>Share</strong> button in your browser.</li>
              <li>Select <strong>Add to Home Screen</strong>.</li>
              <li>Launch from your home screen with offline microphone access.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20 transition active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
