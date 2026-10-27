import React, { useState } from 'react';
import { X, Smartphone, Terminal, Shield, CheckCircle2, ChevronRight, Copy, Check } from 'lucide-react';

interface AndroidDeviceGuideModalProps {
  onClose: () => void;
}

export const AndroidDeviceGuideModal: React.FC<AndroidDeviceGuideModalProps> = ({ onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200/80 p-5 md:p-6 shadow-2xl space-y-5 healthcast-card">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/80">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Android Physical Device & APK Guide</h2>
              <p className="text-xs text-slate-500">Run ReVoice Audio on actual hardware without an emulator</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Running on Physical Android Device Instantly */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-teal-800 flex items-center gap-2">
            <span>Method 1: Direct Physical Android Phone Testing (Instant WebAPK/PWA)</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Because ReVoice Audio is engineered as an installable Progressive Web Application with sandboxed IndexedDB local storage and Web Audio 16-bit PCM WAV recording, you can run it directly on any physical Android smartphone (Samsung, Pixel, Motorola, Xiaomi, OnePlus) immediately:
          </p>

          <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <li className="leading-relaxed">
              Open <strong>Google Chrome</strong> on your physical Android smartphone.
            </li>
            <li className="leading-relaxed">
              Navigate to the application URL (or your local IP address <code className="font-mono text-teal-800 font-semibold">http://192.168.x.x:3000</code> over shared Wi-Fi).
            </li>
            <li className="leading-relaxed">
              Tap the <strong>"Install App"</strong> button in the top bar (or tap Chrome menu <span className="font-semibold text-slate-900">⋮ &gt; "Install app" / "Add to Home screen"</span>).
            </li>
            <li className="leading-relaxed">
              Android will generate an official sandboxed <strong>WebAPK</strong> and place the ReVoice Audio icon on your home screen and app drawer.
            </li>
            <li className="leading-relaxed">
              Launch it from the home screen: it opens in full-screen standalone mode without any browser URL bar, accesses the hardware microphone, and stores WAV audio in the app’s internal sandbox.
            </li>
          </ol>
        </div>

        {/* Section 2: Building a Standalone Android Debug APK using Capacitor */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h3 className="text-sm font-bold text-teal-800 flex items-center gap-2">
            <span>Method 2: Building a Standalone Debug APK (.apk) via Capacitor</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            To bundle ReVoice Audio into a native Android Studio project and compile a debug APK (<code className="font-mono text-teal-800 font-semibold">app-debug.apk</code>) to sideload or distribute:
          </p>

          <div className="space-y-2.5">
            <div className="text-xs text-slate-700 font-bold">1. Install Capacitor in the project root:</div>
            <div className="relative bg-slate-900 rounded-xl p-3 font-mono text-xs text-emerald-400 border border-slate-800">
              <code>npm install @capacitor/core @capacitor/cli @capacitor/android</code>
              <button
                type="button"
                onClick={() => copyCode('npm install @capacitor/core @capacitor/cli @capacitor/android', 1)}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-xs text-slate-700 font-bold">2. Initialize Capacitor and create production build:</div>
            <div className="relative bg-slate-900 rounded-xl p-3 font-mono text-xs text-emerald-400 border border-slate-800">
              <code>npx cap init "ReVoice Audio" org.revoice.audio --web-dir dist<br />npm run build<br />npx cap add android</code>
              <button
                type="button"
                onClick={() => copyCode('npx cap init "ReVoice Audio" org.revoice.audio --web-dir dist\nnpm run build\nnpx cap add android', 2)}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-xs text-slate-700 font-bold">3. Add Android Microphone Permission to <code className="text-teal-900">android/app/src/main/AndroidManifest.xml</code>:</div>
            <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-teal-300 border border-slate-800">
              &lt;uses-permission android:name="android.permission.RECORD_AUDIO" /&gt;<br />
              &lt;uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" /&gt;
            </div>

            <div className="text-xs text-slate-700 font-bold">4. Build the Debug APK using Gradle:</div>
            <div className="relative bg-slate-900 rounded-xl p-3 font-mono text-xs text-emerald-400 border border-slate-800">
              <code>cd android && ./gradlew assembleDebug</code>
              <button
                type="button"
                onClick={() => copyCode('cd android && ./gradlew assembleDebug', 3)}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              The compiled APK will be at: <code className="font-mono text-teal-800 font-semibold">android/app/build/outputs/apk/debug/app-debug.apk</code>.
              Connect your physical phone with USB debugging enabled and run <code className="font-mono text-slate-900">adb install app-debug.apk</code>!
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
