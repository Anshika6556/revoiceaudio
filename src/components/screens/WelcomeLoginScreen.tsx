import React, { useState } from 'react';
import {
  Mic,
  Lock,
  Mail,
  Phone,
  Smartphone,
  User as UserIcon,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { authService, RegisterParams, CURRENT_CONSENT_VERSION } from '../../services/authService';
import { User, Gender, Cohort, UserRole } from '../../types';

interface WelcomeLoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onRegisterSuccess: (user: User) => void;
}

export const WelcomeLoginScreen: React.FC<WelcomeLoginScreenProps> = ({
  onLoginSuccess,
  onRegisterSuccess,
}) => {
  const [roleMode, setRoleMode] = useState<UserRole>('participant');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCohort, setRegCohort] = useState<Cohort>('healthy');
  const [regGender, setRegGender] = useState<Gender>('prefer_not_to_say');
  const [regAge, setRegAge] = useState<string>('');
  const [regPassword, setRegPassword] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [showConsentDetails, setShowConsentDetails] = useState(false);

  // Forgot password form state
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const idClean = loginIdentifier.trim();
    if (!idClean || !loginPassword) {
      setErrorMessage(
        roleMode === 'admin'
          ? 'Please enter both your staff email and password.'
          : 'Please enter both your mobile number (or Participant ID) and password.'
      );
      return;
    }

    setLoading(true);
    try {
      // If roleMode is 'admin', enforce admin verification
      const user = await authService.login(
        idClean,
        loginPassword,
        roleMode === 'admin' ? 'admin' : undefined
      );
      onLoginSuccess(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Invalid credentials. Please verify your mobile number / email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!regName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    const cleanDigits = regPhone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10 || cleanDigits.length > 15) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    const ageNum = regAge ? parseInt(regAge, 10) : undefined;
    if (ageNum !== undefined && (isNaN(ageNum) || ageNum < 18 || ageNum > 120)) {
      setErrorMessage('Please enter a valid adult age (18 or older) for participation.');
      return;
    }

    if (!consentAgreed) {
      setErrorMessage('Please agree to the privacy terms to create your account.');
      return;
    }

    setLoading(true);
    try {
      const params: RegisterParams = {
        name: regName.trim(),
        phone: regPhone.trim(),
        cohort: regCohort,
        role: 'participant',
        gender: regGender,
        age: ageNum,
        password: regPassword,
        consentAgreed: true,
      };
      const user = await authService.register(params);
      onRegisterSuccess(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!recoveryIdentifier.trim() || !recoveryNewPassword) {
      setErrorMessage(
        roleMode === 'admin'
          ? 'Please enter your staff email and new password.'
          : 'Please enter your mobile number and new password.'
      );
      return;
    }
    if (recoveryNewPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(recoveryIdentifier.trim(), recoveryNewPassword);
      setInfoMessage('Password has been successfully reset. Please log in.');
      setAuthMode('login');
      setLoginIdentifier(recoveryIdentifier.trim());
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to reset password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center px-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 shadow-xl shadow-teal-500/20 mb-3 text-white">
          <Mic className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          Re<span className="text-teal-600 font-extrabold">Voice</span> Audio
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-medium">
          Clinical Speech Corpus & Healthcare Acoustic Research
        </p>
      </div>

      {/* Primary Role Switcher: Participant vs Staff / Admin */}
      <div className="flex rounded-2xl bg-slate-200/80 p-1 mb-4 border border-slate-300/80">
        <button
          type="button"
          onClick={() => {
            setRoleMode('participant');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            roleMode === 'participant'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Participant Portal
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleMode('admin');
            setAuthMode('login');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            roleMode === 'admin'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Staff / Admin Portal
        </button>
      </div>

      {/* Secondary Auth Switcher (Only for Participant: Login vs Register) */}
      {roleMode === 'participant' && (
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              authMode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              authMode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create account
          </button>
        </div>
      )}

      {/* Staff Admin Notice */}
      {roleMode === 'admin' && (
        <div className="mb-4 p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-teal-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Authorized Clinical Staff Access</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Restricted to authorized ReVoice dataset administrators and clinical investigators. Access attempts are cryptographically verified and audited.
          </p>
        </div>
      )}

      {/* Error / Info alerts */}
      {errorMessage && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {infoMessage && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 animate-fadeIn">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* SIGN IN VIEW (Participant or Admin) */}
      {(authMode === 'login' || roleMode === 'admin') && (
        <form onSubmit={handleLoginSubmit} className="space-y-4 rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {roleMode === 'admin' ? 'Staff Email' : 'Mobile Number or Participant ID'}
            </label>
            <div className="relative">
              <input
                type={roleMode === 'admin' ? 'email' : 'text'}
                required
                autoComplete={roleMode === 'admin' ? 'email' : 'tel'}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder={roleMode === 'admin' ? 'staff@institution.org' : 'e.g. 9876543210 or SPK_0001'}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              {roleMode === 'admin' ? (
                <Mail className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              ) : (
                <Smartphone className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              {roleMode === 'participant' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot_password')}
                  className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition"
                aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </span>
            ) : (
              <>
                <span>{roleMode === 'admin' ? 'Authenticate Staff Access' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* CREATE ACCOUNT VIEW (Participant Only) */}
      {roleMode === 'participant' && authMode === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5 rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Jordan Miller"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              <UserIcon className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                autoComplete="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              <Phone className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* COHORT TRACK SELECTION (CRITICAL FOR ASSIGNMENT TRACKS) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Research Cohort Track
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRegCohort('healthy')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                  regCohort === 'healthy'
                    ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Healthy Cohort</span>
                  {regCohort === 'healthy' && <CheckSquare className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">Standard speech baseline</p>
              </button>

              <button
                type="button"
                onClick={() => setRegCohort('speech_impaired')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                  regCohort === 'speech_impaired'
                    ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Speech-Impaired</span>
                  {regCohort === 'speech_impaired' && <CheckSquare className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">Acoustic variance track</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition"
                aria-label={showRegPassword ? 'Hide password' : 'Show password'}
              >
                {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Gender (optional)
              </label>
              <select
                value={regGender}
                onChange={(e) => setRegGender(e.target.value as Gender)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Age (optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="18"
                  max="120"
                  value={regAge}
                  onChange={(e) => setRegAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
                <Calendar className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* INFORMED CONSENT & PRIVACY AGREEMENT */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Informed Consent ({CURRENT_CONSENT_VERSION})
              </span>
              <button
                type="button"
                onClick={() => setShowConsentDetails(!showConsentDetails)}
                className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
              >
                <span>{showConsentDetails ? 'Hide' : 'Read terms'}</span>
                {showConsentDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showConsentDetails && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed max-h-40 overflow-y-auto">
                <p className="font-semibold text-slate-800">Audio Recording & Privacy Policy:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Your voice recordings are processed locally for audio research and speech modeling.</li>
                  <li>Recordings are stored safely on your device in secure sandbox storage.</li>
                  <li>Participation is voluntary. You can delete recordings or withdraw anytime.</li>
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => setConsentAgreed(!consentAgreed)}
              className="flex items-start gap-2.5 text-left group w-full cursor-pointer pt-0.5"
            >
              <div className="mt-0.5 text-teal-600 group-hover:text-teal-700 shrink-0">
                {consentAgreed ? (
                  <CheckSquare className="w-4 h-4 fill-teal-600 text-white" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <span className="text-xs text-slate-600 leading-snug">
                I agree to the informed consent terms and local audio recording storage policy.
              </span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !consentAgreed}
              className="w-full min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </span>
              ) : (
                <>
                  <span>Create Account & Assign Prompts</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* PASSWORD RECOVERY VIEW */}
      {authMode === 'forgot_password' && (
        <form onSubmit={handlePasswordRecovery} className="space-y-4 rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xl">
          <div className="text-left">
            <h2 className="text-sm font-bold text-slate-900">Reset Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {roleMode === 'admin'
                ? 'Enter your registered staff email and choose a new password.'
                : 'Enter your registered mobile number and choose a new password.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {roleMode === 'admin' ? 'Staff Email' : 'Mobile Number'}
            </label>
            <input
              type={roleMode === 'admin' ? 'email' : 'tel'}
              required
              value={recoveryIdentifier}
              onChange={(e) => setRecoveryIdentifier(e.target.value)}
              placeholder={roleMode === 'admin' ? 'staff@institution.org' : 'e.g. 9876543210'}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={recoveryNewPassword}
              onChange={(e) => setRecoveryNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
