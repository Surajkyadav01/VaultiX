import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserProfile } from '../types';

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await storageService.signInWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during Google authorization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative premium background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-100 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
         initial={{ opacity: 0, y: 15 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, ease: 'easeOut' }}
         className="w-full max-w-md relative z-10"
         id="auth-container"
      >
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-4" id="auth-logo-wrapper">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-sans">
            Vault<span className="text-indigo-600">iX</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            Secure client file workspace for designers, creators, and freelancers.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100/50" id="auth-card">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">
            {isSignUp ? "Welcome" : "Welcome Back"}
          </h2>

          {error && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-6 text-xs text-rose-700 flex items-start gap-2"
               id="auth-error-banner"
            >
              <span className="font-semibold select-none mt-0.5">⚠️</span>
              <p className="leading-relaxed">{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
              {isSignUp 
                ? "Connect your Google Account to create a secure personal portal." 
                : "Sign in with your Google Account to unlock your file vault."}
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 active:bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              id="btn-google-sign-in"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.81-2.6-2.31-4.66-2.31-4.66z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>{isSignUp ? "Sign up with Google" : "Sign in with Google"}</span>
                </>
              )}
            </button>
          </div>

          {/* Toggle Button */}
          <div className="mt-6 text-center text-slate-500 text-xs">
            {isSignUp ? "Already have an account?" : "Need a professional portal?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors underline underline-offset-4 cursor-pointer bg-transparent border-0"
              id="btn-toggle-auth"
            >
              {isSignUp ? "Sign In" : "Create an Account"}
            </button>
          </div>
        </div>

        {/* Bottom Credits / Note */}
        <p className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed">
          Powered by VaultiX Security Engine. Fits small files including PDF, PNG, JPG, JPEG, and TXT under 2.0MB.
        </p>
      </motion.div>
    </div>
  );
}
