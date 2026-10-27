# ReVoice Audio — Android Voice Recording Application for Speech Corpus Collection

**ReVoice Audio** is a complete, research-grade Android application developed for collecting sentence-level voice recordings from registered participants. It implements authentication, informed consent tracking, a 3-level sentence corpus, real-time waveform recording, local 16-bit Linear PCM WAV audio encoding, playback review, persistent sandboxed storage, and dataset export.

---

## 1. Technology Stack & Architectural Decisions

### A. Technology Choices
| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Platform Target** | Android WebAPK / PWA & Capacitor Native Wrapper | Allows instant installation on physical Android phones (via WebAPK) or compiling into an Android Studio debug APK (`app-debug.apk`) without changing code. |
| **UI Framework** | React 19 + TypeScript + Tailwind CSS | Component modularity, strict type safety, WCAG AA contrast compliance, responsive Material Design 3 touch targets ($\ge 44 \times 44\text{px}$). |
| **Audio Capture** | Web Audio API (`AudioContext`, `AnalyserNode`, `MediaRecorder`) | Hardware microphone stream gating, acoustic speech echo-cancellation, and real-time frequency-domain waveform visualization. |
| **Audio Format** | **16-bit Linear PCM RIFF/WAV (16,000 Hz, Mono)** | The uncompressed industry standard for ASR (Automated Speech Recognition) pipelines, acoustic phoneme analysis, and models like Whisper, Wav2Vec 2.0, and Mozilla Common Voice. No lossy compression artifacts. |
| **Database** | IndexedDB (`ReVoiceAudioSpeechCorpusDB`, v1) | ACID transactions, indexed queries, zero external dependencies, sandboxed directly on the device. |
| **Storage Abstraction** | `AudioStorageService` (App-Private File Simulation) | Follows Android's internal app-private filesystem pattern (`recordings/{participant_id}/level_{id}/{rec_id}.wav`), storing binary Blobs with strict per-participant ownership isolation. |
| **Authentication** | Web Cryptography API (PBKDF2-SHA256, 100,000 rounds) | Passwords are never stored in plaintext. Uses cryptographically random 16-byte salts and generates readable, collision-resistant IDs (`RV-000123`). |
| **Corpus Packaging** | JSZip | Packages all participant `.wav` files into structured directories alongside `corpus_manifest.csv` and `participant_metadata.json` for researcher handoff. |

---

## 2. Application Architecture & Future Backend Migration Path

ReVoice Audio enforces strict separation of concerns through repository and service abstractions:

```
src/
├── types/                     # Core domain models (User, Consent, Sentence, Recording)
├── services/
│   ├── db.ts                  # Relational IndexedDB engine with schema versioning
│   ├── authService.ts         # PBKDF2 cryptography, session management, unique ID generator
│   ├── audioEncoder.ts        # 16-bit Linear PCM WAV writer and sample rate resampler
│   ├── audioStorageService.ts # Local app-private file storage abstraction & ZIP exporter
│   └── recordingRepository.ts # Domain recording operations, ownership checks, statistics
├── hooks/
│   └── useAudioRecorder.ts    # Hardware mic lifecycle, permission gating, live waveform stream
├── utils/
│   └── formatters.ts          # ID formatting (L1/S01), timecodes (mm:ss.s), file sizes
├── data/
│   └── sampleSentences.ts     # Initial 3-level corpus (Level 1, Level 2, Level 3)
└── components/
    ├── layout/                # Material TopAppBar and thumb-zone BottomNavBar
    ├── screens/               # Dashboard, Sentence Library, My Recordings, Profile, Consent
    └── modals/                # RecordingModal, ReviewModal, RecordingDetailsModal, AndroidGuide
```

### Future Remote Backend Migration Strategy
When transitioning from local storage to a remote cloud backend:
1. **`IAudioStorageService` Interface**: Swap `saveAudio` to upload directly to Google Cloud Storage (GCS) or AWS S3 signed URLs without touching the UI or recording components.
2. **`RecordingRepository`**: Replace IndexedDB transaction calls with REST / GraphQL / gRPC endpoints backed by PostgreSQL or Cloud Firestore.
3. **Authentication**: Transition `AuthService` from local PBKDF2 to Firebase Auth, OAuth2 Bearer tokens, or OIDC while retaining the participant ID mapping.

---

## 3. Database Schema

The local database (`ReVoiceAudioSpeechCorpusDB`) defines 5 stores:

1. **`users`**
   - `id` (string, UUID, Primary Key)
   - `participantId` (string, Unique Index, e.g. `RV-000123`)
   - `name` (string)
   - `email` (string, Unique Index)
   - `gender` ('female' | 'male' | 'non_binary' | 'prefer_not_to_say')
   - `age` (optional number)
   - `passwordHash` (string, PBKDF2-SHA256 hex)
   - `passwordSalt` (string, 16-byte hex salt)
   - `createdAt` (number, Unix timestamp ms)
   - `status` ('active' | 'withdrawn')

2. **`consents`**
   - `id` (string, UUID, Primary Key)
   - `userId` (string, Index)
   - `consentVersion` (string, e.g. `v1.2-2026`)
   - `consentStatus` ('accepted' | 'declined' | 'withdrawn')
   - `agreedTerms` (string[])
   - `timestamp` (number)

3. **`sentences`**
   - `id` (string, Primary Key, e.g. `l1_s01`)
   - `level` (number, Index: 1, 2, or 3)
   - `sentenceNumber` (number)
   - `text` (string)
   - `active` (boolean)

4. **`recordings`**
   - `id` (string, UUID, Primary Key)
   - `userId` (string, Index)
   - `participantId` (string, Index)
   - `sentenceId` (string, Index)
   - `level` (number, Index)
   - `localFilePath` (string, e.g. `recordings/RV-000123/level_1/rec_xxx.wav`)
   - `audioFormat` ('audio/wav')
   - `sampleRate` (number, 16000)
   - `bitDepth` (number, 16)
   - `channelCount` (number, 1)
   - `duration` (number, float seconds)
   - `fileSize` (number, bytes)
   - `timestamp` (number)
   - `storageStatus` ('saved_local' | 'pending_upload' | 'uploaded')
   - `attemptNumber` (number)

5. **`audio_files`** (Sandboxed binary audio blob store)
   - `path` (string, Primary Key)
   - `blob` (Blob, WAV binary payload)
   - `mimeType` ('audio/wav')
   - `createdAt` (number)

---

## 4. How to Run on a Physical Android Device (Without an Emulator)

### Method A: Instant WebAPK Installation (Chrome on Android)
1. Ensure your computer and your physical Android phone are connected to the same local Wi-Fi network.
2. Run `npm run dev` to start the development server on host `0.0.0.0` (port `3000`).
3. On your Android smartphone, open **Google Chrome** and browse to `http://<YOUR_COMPUTER_LOCAL_IP>:3000` (e.g., `http://192.168.1.50:3000`).
4. Tap the **"Install App"** button in the top bar (or tap Chrome's three dots menu **⋮ &gt; "Install app"** / **"Add to Home screen"**).
5. Android compiles a sandboxed **WebAPK** and installs ReVoice Audio onto your app drawer.
6. Launch it from the home screen: it runs in standalone full-screen mode, requests hardware microphone permission, and records speech with native audio hardware integration.

### Method B: Live USB Debugging via Chrome DevTools
1. On your Android phone, enable **Developer Options** and turn on **USB Debugging**.
2. Connect your phone to your computer using a USB cable.
3. In Chrome on your computer, navigate to `chrome://inspect/#devices`.
4. Click **Inspect** under your connected Android device to view live console logs, test microphone audio, and inspect IndexedDB tables and audio blobs on the physical phone.

---

## 5. How to Generate an Android Debug APK (`.apk`) via Capacitor

1. Install Capacitor core, CLI, and Android platform packages:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
2. Initialize Capacitor:
   ```bash
   npx cap init "ReVoice Audio" org.revoiceaudio.app --web-dir dist
   ```
3. Build the production web bundle and create the Android project:
   ```bash
   npm run build
   npx cap add android
   ```
4. Verify Android microphone permission in `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
   ```
5. Compile the debug APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
6. The debug APK is generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
7. Sideload to your physical phone via ADB:
   ```bash
   adb install app-debug.apk
   ```

---

## 6. Testing Guide for All Core Workflows

1. **Registration & Collision-Resistant ID**:
   - Register a new account with Name, Email, Gender, and Age.
   - Confirm that a readable ID (e.g. `RV-000123`) is generated, celebratory confetti fires, and clipboard copy works.
2. **Informed Consent Gating**:
   - The consent screen displays all 8 mandatory research disclosures.
   - If declined, recording actions on sentences show an explicit warning and prompt to accept consent.
   - Once accepted, recording is enabled across all 3 levels.
3. **Non-Linear Recording Progression**:
   - Open Level 3 directly. Record sentence `L3/S01` without recording Level 1 or 2 first.
   - Confirm that all 3 levels are open and distinct sentence count increments by 1.
4. **Recording & Waveform**:
   - Tap the microphone button on any sentence.
   - Observe real-time dynamic frequency waveform bars and timer increments (`00:03.4`).
   - Tap "Stop & Review".
5. **Playback Review & Retakes**:
   - Listen to the take using the scrubber and play/pause controls.
   - Test "Retake Audio": the recorder re-opens, preserving previous attempts without overwriting.
   - Tap "Save Recording": observe success message and automatic 16-bit PCM WAV encoding.
6. **My Recordings & File Specs**:
   - Navigate to "My Audio" to see all saved takes.
   - Filter by Level or search by sentence text.
   - Tap "Info" on any recording to inspect sample rate (16,000 Hz), channels (1 Mono), bit depth (16-bit), and file path (`recordings/RV-000123/level_1/rec_xxx.wav`).
7. **Safe Deletion**:
   - Tap "Delete Recording", confirm the dialog.
   - Verify that the physical audio blob and database record are removed, and the sentence row reverts to "Unrecorded" if no other takes exist.
8. **Corpus Dataset Export**:
   - Tap "Export ZIP" to download a ZIP containing all `.wav` audio files structured in level directories, along with `corpus_manifest.csv` and `participant_metadata.json`.
9. **Persistence**:
   - Close the browser or reload the page.
   - Log back in with either email or `RV-000123`. Verify all recordings and progress remain intact.
