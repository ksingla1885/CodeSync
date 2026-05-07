'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, Lock, User, Eye, EyeOff, Key,
  ArrowRight, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';

const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000').replace(/\/$/, '');

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-white/40 mb-1.5">
      {children}
    </label>
  );
}

function TextInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />}
      <input
        {...props}
        className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white
          placeholder-white/20 focus:outline-none focus:border-white/25 focus:bg-white/[0.06]
          transition-all py-2.5 pr-4 ${Icon ? 'pl-9' : 'pl-4'}`}
      />
    </div>
  );
}

function PasswordInput({ id, value, onChange, placeholder = 'Password', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
      <input
        id={id} type={show ? 'text' : 'password'}
        value={value} onChange={onChange} placeholder={placeholder} {...rest}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white
          placeholder-white/20 focus:outline-none focus:border-white/25 focus:bg-white/[0.06]
          transition-all py-2.5 pl-9 pr-10"
      />
      <button type="button" tabIndex={-1}
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function AlertBox({ type, message }) {
  if (!message) return null;
  const styles = {
    error:   'bg-red-500/[0.06] border-red-500/20 text-red-400',
    success: 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-400',
  };
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div className={`flex items-start gap-2.5 p-3 border rounded-lg text-xs animate-scale-in ${styles[type]}`}>
      <Icon size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SubmitBtn({ loading, children }) {
  return (
    <button type="submit" disabled={loading}
      className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white
        text-black text-sm font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : <>{children}<ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></>
      }
    </button>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-white/[0.07]" />
      <span className="text-xs text-white/25">{label}</span>
      <div className="flex-1 h-px bg-white/[0.07]" />
    </div>
  );
}

function BackBtn({ onClick, label = '← Go back' }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-xs text-white/25 hover:text-white/50 transition-colors py-1 text-center">
      {label}
    </button>
  );
}

// ─── Sign-in panel ────────────────────────────────────────────────────────────
// Supports: password login  OR  OTP login
function SignInPanel() {
  const router = useRouter();
  const [mode, setMode]         = useState('password'); // 'password' | 'otp'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode]         = useState('');
  const [otpStep, setOtpStep]   = useState(1);           // 1=email, 2=code
  const [loading, setLoading]   = useState(false);
  const [alert, setAlert]       = useState({ type: '', msg: '' });

  const reset = (m) => { setMode(m); setAlert({ type: '', msg: '' }); setPassword(''); setCode(''); setOtpStep(1); };
  const persist = (user) => { localStorage.setItem('user', JSON.stringify(user)); router.push('/dashboard'); };

  // Password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault(); setLoading(true); setAlert({ type: '', msg: '' });
    try {
      const res  = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) persist(data.user);
      else setAlert({ type: 'error', msg: data.error || data.message || 'Login failed.' });
    } catch { setAlert({ type: 'error', msg: 'Cannot reach server.' }); }
    finally { setLoading(false); }
  };

  // OTP – request
  const handleRequestOtp = async (e) => {
    e.preventDefault(); setLoading(true); setAlert({ type: '', msg: '' });
    try {
      const res  = await fetch(`${SERVER_URL}/api/auth/request-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) { setOtpStep(2); setAlert({ type: 'success', msg: 'Code sent! Check your inbox.' }); }
      else setAlert({ type: 'error', msg: data.error || data.message || 'Failed to send code.' });
    } catch { setAlert({ type: 'error', msg: 'Cannot reach server.' }); }
    finally { setLoading(false); }
  };

  // OTP – verify
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setLoading(true); setAlert({ type: '', msg: '' });
    try {
      const res  = await fetch(`${SERVER_URL}/api/auth/verify-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) persist(data.user);
      else setAlert({ type: 'error', msg: data.error || data.message || 'Invalid code.' });
    } catch { setAlert({ type: 'error', msg: 'Connection error.' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <AlertBox type={alert.type} message={alert.msg} />

      {/* ── Password mode ── */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <Label htmlFor="si-email">Email</Label>
            <TextInput id="si-email" icon={Mail} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
          </div>
          <div>
            <Label htmlFor="si-pass">Password</Label>
            <PasswordInput id="si-pass" value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password" required />
          </div>
          <SubmitBtn loading={loading}>Sign in</SubmitBtn>
        </form>
      )}

      {/* ── OTP mode – step 1 ── */}
      {mode === 'otp' && otpStep === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <Label htmlFor="otp-si-email">Email</Label>
            <TextInput id="otp-si-email" icon={Mail} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
          </div>
          <SubmitBtn loading={loading}>Send one-time code</SubmitBtn>
        </form>
      )}

      {/* ── OTP mode – step 2 ── */}
      {mode === 'otp' && otpStep === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <Label htmlFor="otp-si-code">6-digit code</Label>
            <TextInput id="otp-si-code" icon={Key} type="text" inputMode="numeric"
              placeholder="000000" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus required />
            <p className="mt-2 text-xs text-white/30">Sent to <span className="text-white/50">{email}</span></p>
          </div>
          <SubmitBtn loading={loading}>Verify & sign in</SubmitBtn>
          <BackBtn onClick={() => { setOtpStep(1); setCode(''); setAlert({ type: '', msg: '' }); }} label="← Different email" />
        </form>
      )}

      <Divider label="or" />

      {mode === 'password'
        ? <button type="button" onClick={() => reset('otp')}
            className="w-full py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all flex items-center justify-center gap-2">
            <Key size={14} /> Sign in with email code
          </button>
        : <button type="button" onClick={() => reset('password')}
            className="w-full py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all flex items-center justify-center gap-2">
            <Lock size={14} /> Sign in with password
          </button>
      }
    </div>
  );
}

// ─── Sign-up panel ────────────────────────────────────────────────────────────
// Step 1: name + email + password  →  send OTP
// Step 2: enter OTP  →  POST /api/auth/register  →  account created
function SignUpPanel() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode]         = useState('');
  const [step, setStep]         = useState(1); // 1=details, 2=otp
  const [loading, setLoading]   = useState(false);
  const [alert, setAlert]       = useState({ type: '', msg: '' });

  const persist = (user) => {
    localStorage.setItem('user', JSON.stringify({ ...user, name: user.name || name }));
    router.push('/dashboard');
  };

  // Step 1 → send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault(); setLoading(true); setAlert({ type: '', msg: '' });
    try {
      const res  = await fetch(`${SERVER_URL}/api/auth/request-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) { setStep(2); setAlert({ type: 'success', msg: 'Verification code sent to your inbox.' }); }
      else setAlert({ type: 'error', msg: data.error || data.message || 'Failed to send code.' });
    } catch { setAlert({ type: 'error', msg: 'Cannot reach server.' }); }
    finally { setLoading(false); }
  };

  // Step 2 → verify OTP + create account
  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setAlert({ type: '', msg: '' });
    try {
      const res  = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, code }),
      });
      const data = await res.json();
      if (res.ok) persist(data.user);
      else setAlert({ type: 'error', msg: data.error || data.message || 'Registration failed.' });
    } catch { setAlert({ type: 'error', msg: 'Connection error.' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <AlertBox type={alert.type} message={alert.msg} />

      {/* ── Step 1: Details ── */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <Label htmlFor="su-name">Full name</Label>
            <TextInput id="su-name" icon={User} type="text" placeholder="Jane Doe"
              value={name} onChange={e => setName(e.target.value)} autoFocus required />
          </div>
          <div>
            <Label htmlFor="su-email">Email</Label>
            <TextInput id="su-email" icon={Mail} type="email" placeholder="jane@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="su-pass">Password</Label>
            <PasswordInput id="su-pass" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters" autoComplete="new-password" minLength={8} required />
            <p className="mt-1.5 text-xs text-white/25">Must be at least 8 characters</p>
          </div>
          <SubmitBtn loading={loading}>Continue — send verification code</SubmitBtn>
          <p className="text-center text-xs text-white/20">
            By signing up, you agree to our{' '}
            <span className="text-white/40 hover:underline cursor-pointer">Terms</span> &amp;{' '}
            <span className="text-white/40 hover:underline cursor-pointer">Privacy Policy</span>.
          </p>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs text-white/40 space-y-0.5">
            <p>Creating account for</p>
            <p className="font-medium text-white/70">{email}</p>
          </div>
          <div>
            <Label htmlFor="su-code">Verification code</Label>
            <TextInput id="su-code" icon={Key} type="text" inputMode="numeric"
              placeholder="000000" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus required />
            <p className="mt-1.5 text-xs text-white/25">Enter the 6-digit code sent to your inbox</p>
          </div>
          <SubmitBtn loading={loading}>Create account</SubmitBtn>
          <BackBtn onClick={() => { setStep(1); setCode(''); setAlert({ type: '', msg: '' }); }} label="← Edit details" />
        </form>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState('signin');

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      {/* Nav */}
      <nav className="h-14 border-b border-white/[0.06] flex items-center px-6 md:px-12 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
            <span className="text-black font-bold text-xs leading-none">C</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">CodeSync</span>
        </Link>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left branding panel */}
        <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 border-r border-white/[0.06] p-12">
          <div />
          <div className="space-y-8">
            <p className="text-xl font-semibold tracking-tight leading-snug text-white/70">
              "The fastest way to code together — without the chaos."
            </p>
            <ul className="space-y-4">
              {[
                ['Real-time sync',      'Conflict-free editing via Yjs CRDTs'],
                ['Shared cursors',      'See exactly where your team is'],
                ['Docker execution',    'Run code in sandboxed containers'],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white/60">{title}</p>
                    <p className="text-xs text-white/25">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/20">© 2026 CodeSync</p>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-xl font-semibold tracking-tight mb-1">
                {tab === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-white/35">
                {tab === 'signin'
                  ? 'Sign in with your password or a one-time email code.'
                  : 'Fill in your details — we\'ll verify your email with a code.'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06] mb-6">
              {[['signin', 'Sign in'], ['signup', 'Sign up']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                    tab === key ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Panel — key forces full remount on tab switch */}
            {tab === 'signin' ? <SignInPanel key="signin" /> : <SignUpPanel key="signup" />}

            {/* Footer link */}
            <p className="mt-7 text-center text-xs text-white/25">
              {tab === 'signin' ? (
                <>New here?{' '}
                  <button onClick={() => setTab('signup')}
                    className="text-white/50 hover:text-white underline underline-offset-2 transition-colors">
                    Create an account
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => setTab('signin')}
                    className="text-white/50 hover:text-white underline underline-offset-2 transition-colors">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
