import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, FileText, ChevronDown, ChevronUp, CheckSquare, Square, Mail } from 'lucide-react';
import { authService, CURRENT_CONSENT_VERSION } from '../../services/authService';
import { User, ConsentRecord } from '../../types';

interface ConsentScreenProps {
  user: User;
  existingConsent?: ConsentRecord | null;
  onConsentComplete: (accepted: boolean) => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  user,
  existingConsent,
  onConsentComplete,
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(
    existingConsent?.consentStatus === 'accepted'
  );
  const [expandedDoc, setExpandedDoc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!agreedToTerms) {
      setErrorMessage('Please check the agreement box confirming you understand the terms.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await authService.recordConsent(
        user.id,
        [
          'voice_collection_purpose_accepted',
          'local_audio_storage_acknowledged',
          'ai_training_research_permitted',
          'data_retention_and_deletion_rights_understood',
        ],
        'accepted'
      );
      onConsentComplete(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save consent choice.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await authService.recordConsent(user.id, [], 'declined');
      onConsentComplete(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto min-h-screen px-4 py-8 flex flex-col justify-center">
      <div className="rounded-3xl bg-white p-5 md:p-6 border border-slate-200/80 shadow-2xl healthcast-card">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Informed Consent & Ethics</h1>
            <p className="text-xs text-slate-500">
              ReVoice Audio Protocol Version: <span className="font-mono text-teal-700 font-bold">{CURRENT_CONSENT_VERSION}</span>
            </p>
          </div>
        </div>

        {/* Participant Identification Notice */}
        <div className="mt-4 p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs text-slate-700 flex items-center justify-between">
          <span className="text-slate-500">Assigned Participant Code:</span>
          <span className="font-mono font-bold text-teal-900">{user.participantId}</span>
        </div>

        {/* Scrollable Summary of 8 Mandatory Consent Items */}
        <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1 text-xs text-slate-600">
          {/* 1. Purpose */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-bold text-slate-800 mb-1">1. Clinical Voice Collection Purpose</h3>
            <p className="leading-relaxed">
              This application collects sentence-level speech samples to train, benchmark, and evaluate automated speech recognition (ASR) acoustic models and linguistic phoneme research for healthcare systems.
            </p>
          </div>

          {/* 2. Collected Information */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-bold text-slate-800 mb-1">2. Information & Audio Format</h3>
            <p className="leading-relaxed">
              We collect high-fidelity audio recordings of designated phrases (16-bit PCM WAV at 16,000 Hz Mono) and self-reported demographic metadata. Your legal name and email address are never written to recording filenames or public manifests.
            </p>
          </div>

          {/* 3. Intended AI & Research Use */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-bold text-slate-800 mb-1">3. Research & Acoustic Model Training</h3>
            <p className="leading-relaxed">
              Recordings are used strictly for computational speech science, machine learning model fine-tuning, and speech synthesis evaluation.
            </p>
          </div>

          {/* 4. Local Storage Location */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-bold text-slate-800 mb-1">4. Sandboxed Storage Architecture</h3>
            <p className="leading-relaxed">
              Audio files are stored locally on your device in the app’s sandboxed private storage directory (<code className="font-mono text-teal-800 font-semibold">recordings/{user.participantId}/...</code>). No files are uploaded to third parties without your explicit export.
            </p>
          </div>

          {/* 5. Access Control */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-bold text-slate-800 mb-1">5. Access Control</h3>
            <p className="leading-relaxed">
              Only you and authorized research study investigators examining acoustic corpus samples will have access to the recordings.
            </p>
          </div>

          {/* 6. Retention and Deletion */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-bold text-slate-800 mb-1">6. Data Retention & Deletion Policy</h3>
            <p className="leading-relaxed">
              You retain complete ownership over your recordings. You may review, re-record, or permanently delete any individual recording at any time from the “My Audio” interface.
            </p>
          </div>

          {/* 7. Right to Withdraw */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-bold text-slate-800 mb-1">7. Voluntary Participation & Withdrawal</h3>
            <p className="leading-relaxed">
              Participation is voluntary. You may withdraw your consent at any time via Profile Settings. Withdrawing immediately halts all recording and can purge all stored audio files from the device.
            </p>
          </div>

          {/* 8. Contact Information */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-bold text-slate-800 mb-1">8. Research Inquiries & Contact</h3>
            <p className="leading-relaxed flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span>Clinical Team: <a href="mailto:ethics@revoice.audio" className="text-teal-700 underline font-medium">ethics@revoice.audio</a></span>
            </p>
          </div>

          {/* Expand Full Legal Protocol */}
          <button
            type="button"
            onClick={() => setExpandedDoc(!expandedDoc)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-teal-50 hover:bg-teal-100/70 text-xs text-teal-900 font-semibold transition border border-teal-200/60"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>{expandedDoc ? 'Hide Full Clinical Text' : 'View Full Clinical Protocol Document'}</span>
            </span>
            {expandedDoc ? <ChevronUp className="w-4 h-4 text-teal-700" /> : <ChevronDown className="w-4 h-4 text-teal-700" />}
          </button>

          {expandedDoc && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-800">
                Institutional Review & Acoustic Data Protocol (Ref: HC-IRB-2026-A)
              </p>
              <p>
                By granting consent, the participant authorizes the acquisition of digitised acoustic waveforms for machine learning corpus compilation. Recordings are sampled using non-destructive 16-bit linear pulse code modulation (PCM). The participant acknowledges that digital voice signatures carry unique biometric acoustic characteristics, and that data pseudonymization is maintained through participant identification code {user.participantId}.
              </p>
              <p>
                The research project does not sell or distribute personal identifiable data to commercial advertising brokers. Storage security measures follow Android scoped internal sandbox encryption standards.
              </p>
            </div>
          )}
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Explicit Agreement Checkbox */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className="flex items-start gap-3 text-left group w-full cursor-pointer"
          >
            <div className="mt-0.5 text-teal-600 group-hover:text-teal-700">
              {agreedToTerms ? (
                <CheckSquare className="w-5 h-5 fill-teal-600 text-white" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <span className="text-xs text-slate-800 font-medium leading-snug">
              I have read and agree to the clinical speech corpus collection protocol, local audio storage policy, and participant data rights.
            </span>
          </button>
        </div>

        {/* Action Buttons: Accept & Decline */}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-[0.98] border border-slate-200"
          >
            Decline (Recording Disabled)
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading || !agreedToTerms}
            className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white text-xs font-bold shadow-lg shadow-teal-600/25 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Recording Consent...' : 'Accept & Continue'}
          </button>
        </div>

        {/* Warning if declining */}
        {!agreedToTerms && (
          <p className="text-[11px] text-slate-500 text-center mt-3">
            Note: Recording features will be disabled until consent is accepted.
          </p>
        )}
      </div>
    </div>
  );
};
