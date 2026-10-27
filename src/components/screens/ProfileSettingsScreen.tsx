import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Shield,
  Lock,
  LogOut,
  Trash2,
  KeyRound,
  Check,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  Users,
  Mic,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User, ConsentRecord, DeletionRequest, DeletionRequestType, Sentence, SentenceLevel, Recording } from '../../types';
import { authService } from '../../services/authService';
import { deletionService } from '../../services/deletionService';
import { formatFileSize, formatDate } from '../../utils/formatters';
import { StorageStats } from '../../services/audioStorageService';

interface ProfileSettingsScreenProps {
  user: User;
  consent: ConsentRecord | null;
  storageStats: StorageStats;
  recordingsCount: number;
  onLogout: () => void;
  onOpenConsentDoc: () => void;
  onPurgeAccount: () => Promise<void>;
  onExportCorpus: () => Promise<void>;
  onShowDeviceGuide?: () => void;
  allSentences?: Sentence[];
  recordings?: Recording[];
  onRecordSentence?: (sentence: Sentence) => void;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  user,
  consent,
  storageStats,
  recordingsCount,
  onLogout,
  onOpenConsentDoc,
  onPurgeAccount,
  onExportCorpus,
  onShowDeviceGuide,
  allSentences = [],
  recordings = [],
  onRecordSentence,
}) => {
  // Password change form state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Deletion & Withdrawal request modal state
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [requestType, setRequestType] = useState<DeletionRequestType>('withdrawal_and_deletion');
  const [requestNotes, setRequestNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Participant's active requests
  const [myRequests, setMyRequests] = useState<DeletionRequest[]>([]);

  // 30 Sentences display in Profile
  const [profileLevelFilter, setProfileLevelFilter] = useState<'all' | SentenceLevel>('all');
  const [profileSearchQuery, setProfileSearchQuery] = useState('');

  // Map recordings by promptId / sentenceId
  const recordingsByPrompt = useMemo(() => {
    const map = new Map<string, Recording[]>();
    for (const rec of recordings) {
      const keys = [rec.promptId, rec.sentenceId].filter(Boolean) as string[];
      for (const k of keys) {
        const list = map.get(k) || [];
        list.push(rec);
        map.set(k, list);
      }
    }
    return map;
  }, [recordings]);

  // Compute all 30 sentences displayed at once
  const displayedSentences = useMemo(() => {
    const sorted = [...allSentences].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.sentenceNumber - b.sentenceNumber;
    });

    return sorted.filter((s) => {
      if (profileLevelFilter !== 'all' && s.level !== profileLevelFilter) return false;
      if (profileSearchQuery.trim()) {
        const q = profileSearchQuery.toLowerCase().trim();
        const pid = (s.promptId || s.id || '').toLowerCase();
        const text = s.text.toLowerCase();
        const notes = (s.instructionNotes || '').toLowerCase();
        if (!pid.includes(q) && !text.includes(q) && !notes.includes(q)) return false;
      }
      return true;
    });
  }, [allSentences, profileLevelFilter, profileSearchQuery]);

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const loadRequests = async () => {
    try {
      const list = await deletionService.getRequests(user.id);
      setMyRequests(list);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Failed to change password.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSubmitDeletionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setSubmissionFeedback(null);

    try {
      await deletionService.submitRequest(user, requestType, requestNotes.trim());
      setSubmissionFeedback('Your request has been submitted successfully. We will notify you about its progress as soon as possible.');
      setShowDeletionModal(false);
      setRequestNotes('');
      await loadRequests();
    } catch (err) {
      console.error(err);
      setSubmissionFeedback('Failed to submit request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Completed
          </span>
        );
      case 'Processing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Processing
          </span>
        );
      case 'Under Review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Under Review
          </span>
        );
      case 'Submitted':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Submitted
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-28 px-4 pt-4">
      {/* Submission Feedback Banner */}
      {submissionFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Request Submitted</p>
            <p className="leading-relaxed">{submissionFeedback}</p>
          </div>
        </div>
      )}

      {/* Participant Identity & Profile Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 healthcast-card space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
            {user.name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 truncate">{user.name}</h1>
              <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200/80">
                {user.participantId}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {user.phone ? `Mobile: ${user.phone}` : user.email}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 font-semibold">
                <Users className="w-3 h-3" />
                <span>{user.cohort === 'speech_impaired' ? 'Speech-Impaired Cohort' : 'Healthy Cohort'}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Registered {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Demographics Details */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Gender:</span>
            <p className="font-bold text-slate-800 capitalize mt-0.5">
              {user.gender.replace(/_/g, ' ')}
            </p>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Age:</span>
            <p className="font-bold text-slate-800 mt-0.5">
              {user.age ? `${user.age} years` : 'Unspecified'}
            </p>
          </div>
        </div>
      </div>

      {/* ALL 30 SENTENCES DISPLAY IN PROFILE */}
      {allSentences.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 healthcast-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Corpus Speech Prompts ({allSentences.length} Total)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  All 30 Visible
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete catalog of 30 clinical sentences with individual recording controls
              </p>
            </div>

            {/* Quick Level Filter Tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setProfileLevelFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  profileLevelFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All 30
              </button>
              {([1, 2, 3] as SentenceLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setProfileLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    profileLevelFilter === lvl
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  L{lvl} (10)
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={profileSearchQuery}
              onChange={(e) => setProfileSearchQuery(e.target.value)}
              placeholder="Search prompt ID (e.g. L1_S01), Hindi text, or notes..."
              className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {profileSearchQuery && (
              <button
                type="button"
                onClick={() => setProfileSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sentences List */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {displayedSentences.map((sentence) => {
              const pid = sentence.promptId || sentence.id;
              const takes = recordingsByPrompt.get(pid) || recordingsByPrompt.get(sentence.id) || [];
              const hasRecorded = takes.length > 0;
              const isRetake = takes.some((r) => r.reviewStatus === 'retake_required');

              return (
                <div
                  key={sentence.id}
                  className={`p-3.5 rounded-2xl border transition space-y-2 ${
                    isRetake
                      ? 'bg-amber-50/30 border-amber-300'
                      : hasRecorded
                      ? 'bg-emerald-50/20 border-emerald-200'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {pid}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Level {sentence.level} • {sentence.category || `Prompt #${sentence.sentenceNumber}`}
                      </span>
                    </div>

                    <div>
                      {isRetake ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          Retake Requested
                        </span>
                      ) : hasRecorded ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{takes.length} take{takes.length === 1 ? '' : 's'} recorded</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Unrecorded</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        "{sentence.text}"
                      </p>
                      {sentence.instructionNotes && (
                        <p className="text-[11px] text-slate-500">
                          ({sentence.instructionNotes})
                        </p>
                      )}
                    </div>

                    {onRecordSentence && (
                      <button
                        type="button"
                        onClick={() => onRecordSentence(sentence)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95 shadow-xs ${
                          isRetake
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                            : hasRecorded
                            ? 'bg-white hover:bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                      >
                        {isRetake ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retake</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" />
                            <span>{hasRecorded ? 'Record Again' : 'Record'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consent & Ethics Protocol Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 healthcast-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Informed Consent & Ethics</h2>
          </div>
          <span
            className={`text-[11px] px-3 py-1 rounded-full font-bold ${
              consent?.consentStatus === 'accepted'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {consent?.consentStatus === 'accepted' ? 'Consent Accepted' : 'Consent Pending'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Version: <span className="font-mono font-semibold">{consent?.consentVersion || 'v1.2-2026'}</span>. Signed on {consent ? formatDate(consent.timestamp) : 'N/A'}. Covering clinical speech recording, 16kHz PCM WAV sandbox storage, and healthcare AI modeling.
        </p>

        <button
          type="button"
          onClick={onOpenConsentDoc}
          className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
        >
          <FileText className="w-4 h-4 text-teal-600" />
          <span>Review Signed Consent Agreement</span>
        </button>
      </div>

      {/* WITHDRAWAL & DATA DELETION REQUESTS SECTION */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 healthcast-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Withdrawal & Data Deletion</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowDeletionModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95"
          >
            Request Deletion
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          You may withdraw consent or request complete erasure of your voice recordings at any time. Requests are tracked in our audit ledger and reviewed by authorized staff.
        </p>

        {/* Existing Requests List */}
        {myRequests.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Your Filed Requests ({myRequests.length})
            </span>

            {myRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">{req.id}</span>
                  {statusBadge(req.status)}
                </div>

                <div className="text-[11px] text-slate-600">
                  Type: <strong className="capitalize">{req.requestType.replace(/_/g, ' ')}</strong> · {req.affectedRecordingsCount} recordings affected
                </div>

                <div className="text-[10px] text-slate-400">
                  Submitted on {formatDate(req.submissionDate)} · Assigned to: {req.assignedStaff}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings & Password */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 healthcast-card space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Account Security</h2>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="flex-1 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <KeyRound className="w-4 h-4 text-slate-600" />
            <span>Change Password</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* DELETION REQUEST MODAL */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request Data Deletion / Withdrawal</h3>
                <p className="text-xs text-slate-500">Participant ID: {user.participantId}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitDeletionRequest} className="space-y-3.5 pt-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Request Type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as DeletionRequestType)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="withdrawal_and_deletion">Full Withdrawal & Audio Erasure</option>
                  <option value="data_deletion_only">Delete Audio Recordings Only</option>
                  <option value="consent_withdrawal">Withdraw Consent for Future Research</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Optional Reason / Notes</label>
                <textarea
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g. Completed participation, personal privacy preference..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Process & Verification Notice:</p>
                <p>
                  Upon submission, your request will enter the administrative queue. Your records will be reviewed and processed without false deletion claims.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeletionModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Change Account Password</h3>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password changed successfully!</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
