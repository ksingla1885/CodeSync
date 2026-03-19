'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutGrid, 
  Mail, 
  Key, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        setSuccess('One-time code sent to your email.');
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Connection error. Please check your backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        // Save user info to localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans selection:bg-[#8a2be2]/30 overflow-hidden relative">
      {/* Dynamic Background Aura */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#8a2be2]/15 blur-[160px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#60a5fa]/10 blur-[140px] rounded-full" />
      
      {/* Nav */}
      <nav className="h-24 flex items-center px-10 md:px-24 relative z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#8a2be2] flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.3)] group-hover:scale-110 transition-transform">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">CodeSync</span>
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 pb-32">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <span className="w-2 h-2 rounded-full bg-[#8a2be2] animate-ping" />
              Secure Login
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-[ -0.05em] leading-[0.85] text-white">
              Elevate your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8a2be2] via-white to-white">workflow.</span>
            </h1>
            <p className="text-white/30 text-lg font-medium max-w-sm mx-auto">
              {step === 1 ? 'Enter your email to join the sync.' : `We've sent a 6-digit code to ${email}.`}
            </p>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
            {/* Edge Highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <form onSubmit={step === 1 ? handleRequestCode : handleVerifyCode} className="space-y-8">
               {error && (
                 <div className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/20 rounded-3xl text-red-300 text-sm font-bold animate-modal-in">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    {error}
                 </div>
               )}

               <div className="space-y-4">
                 <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 transition-colors group-focus-within:text-[#8a2be2]">
                       {step === 1 ? <Mail size={24} strokeWidth={1.5} /> : <Key size={24} strokeWidth={1.5} />}
                    </div>
                    <input 
                      autoFocus
                      required
                      type={step === 1 ? "email" : "text"} 
                      placeholder={step === 1 ? "Work Email Address" : "6-Digit Code"}
                      maxLength={step === 2 ? 6 : undefined}
                      value={step === 1 ? email : code}
                      onChange={(e) => step === 1 ? setEmail(e.target.value) : setCode(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] pl-16 pr-6 py-6 text-xl font-bold focus:outline-none focus:border-[#8a2be2]/30 focus:bg-[#8a2be2]/5 transition-all placeholder-white/10 tracking-[ -0.02em]"
                    />
                 </div>
               </div>

               <button 
                  disabled={loading}
                  type="submit"
                  className="w-full relative group cursor-pointer"
               >
                 <div className="absolute -inset-1 bg-gradient-to-r from-[#8a2be2] to-[#c084fc] rounded-[1.5rem] blur-lg opacity-20 group-hover:opacity-40 transition duration-500" />
                 <div className="relative flex items-center justify-center gap-4 px-10 py-6 rounded-[1.5rem] bg-white text-black font-black text-xl transition-all active:scale-[0.97] group-hover:bg-[#8a2be2] group-hover:text-white">
                    {loading ? (
                       <Loader2 className="animate-spin text-inherit focus:border-[#8a2be2]" size={28} />
                    ) : (
                      <>
                        {step === 1 ? 'Get Started' : 'Unlock Now'}
                        <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                 </div>
               </button>
            </form>
            
            {step === 2 && (
              <button 
                className="w-full mt-10 text-white/20 text-xs font-black uppercase tracking-[0.2em] hover:text-[#8a2be2] transition-colors flex items-center justify-center gap-2 cursor-pointer" 
                onClick={() => setStep(1)}
              >
                 <ArrowRight size={14} className="rotate-180" />
                 Edit Email
              </button>
            )}
          </div>
          
          <div className="mt-16 flex items-center justify-center gap-8 opacity-20 grayscale">
             <div className="font-black text-xs tracking-tighter italic">NEXT.JS</div>
             <div className="font-black text-xs tracking-tighter italic">MONGODB</div>
             <div className="font-black text-xs tracking-tighter italic">DOCKER</div>
             <div className="font-black text-xs tracking-tighter italic">YJS</div>
          </div>
        </div>
      </main>
    </div>
  );
}
