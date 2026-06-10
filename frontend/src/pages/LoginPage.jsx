/**
 * HalShield — Login Page.
 * Clean, spacious login/signup with animated background and glassmorphism card.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { loginUser, registerUser } from '../services/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        await registerUser(form.email, form.password, form.name || 'User');
      } else {
        await loginUser(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050816] px-4">
      <AnimatedBackground variant="full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* ─── Logo & Branding ─── */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-none bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] mb-5 shadow-[0_0_50px_rgba(124,58,237,0.35)]">
            <Shield className="w-9 h-9 text-white" strokeWidth={1.8} />
          </div>
          <h1
            className="text-[32px] font-extrabold tracking-tight bg-clip-text text-transparent animate-gradient leading-tight"
            style={{
              backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #9061f9 40%, #06b6d4 100%)',
              backgroundSize: '200% 200%',
            }}
          >
            HalShield
          </h1>
          <p className="mt-2.5 text-[13px] text-[#94a3b8]/75 tracking-wide">
            LLM Hallucination Detection & Fact Verification
          </p>
        </motion.div>

        {/* ─── Form Card ─── */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="glass-card overflow-hidden"
        >
          {/* Top gradient accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#7c3aed]/50 to-transparent" />

          <div className="px-8 pt-7 pb-8">
            {/* ─── Tab Toggle ─── */}
            <div className="flex rounded-none bg-black/40 p-[4px] mb-7 border border-white/5">
              {['Login', 'Sign Up'].map((label, i) => {
                const active = i === 0 ? !isSignup : isSignup;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setIsSignup(i === 1); setError(''); }}
                    className={`
                      flex-1 py-2 rounded-none text-[13px] font-bold
                      transition-all duration-300 cursor-pointer
                      ${active
                        ? 'bg-gradient-to-r from-[#7c3aed] to-[#9061f9] text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)]'
                        : 'text-[#94a3b8]/40 hover:text-[#94a3b8]/70'
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ─── Error ─── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mb-5 p-3.5 rounded-none bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[13px] font-semibold leading-snug"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Form ─── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name (signup only) */}
              <AnimatePresence>
                {isSignup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <InputField
                      label="Full Name"
                      icon={<User className="w-[15px] h-[15px]" />}
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label="Email Address"
                icon={<Mail className="w-[15px] h-[15px]" />}
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />

              <InputField
                label="Password"
                icon={<Lock className="w-[15px] h-[15px]" />}
                name="password"
                type={showPw ? 'text' : 'password'}
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="text-[#94a3b8]/40 hover:text-[#94a3b8] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <AnimatePresence>
                {isSignup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <InputField
                      label="Confirm Password"
                      icon={<Lock className="w-[15px] h-[15px]" />}
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── Submit Button ─── */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.015, y: -1 } : undefined}
                whileTap={!loading ? { scale: 0.985 } : undefined}
                className={`
                  w-full py-3.5 mt-2 rounded-none font-bold text-[13px] text-white
                  flex items-center justify-center gap-2.5
                  transition-all duration-300 cursor-pointer
                  ${loading
                    ? 'opacity-50 cursor-not-allowed bg-[#7c3aed]/50'
                    : 'bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:shadow-[0_6px_28px_rgba(124,58,237,0.45)]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <div className="w-[16px] h-[16px] border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-[15px] h-[15px]" />
                  </>
                )}
              </motion.button>
            </form>

            {/* ─── Forgot Password ─── */}
            {!isSignup && (
              <p className="mt-5 text-center">
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#94a3b8]/40 hover:text-[#7c3aed] transition-colors cursor-pointer"
                >
                  Forgot your password?
                </button>
              </p>
            )}
          </div>

          {/* ─── Card Footer ─── */}
          <div className="px-8 py-4 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#94a3b8]/35">
              <Sparkles className="w-3.5 h-3.5 text-[#facc15]" />
              <span>Powered by DeBERTa NLI · RAG · FAISS</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Reusable Input Field sub-component (local to this file)
   ───────────────────────────────────────────────────────── */
function InputField({ label, icon, suffix, ...inputProps }) {
  return (
    <div>
      <label className="block text-[11px] font-extrabold text-[#94a3b8]/50 uppercase tracking-[0.08em] mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]/40 pointer-events-none" style={{ zIndex: 1 }}>
          {icon}
        </div>
        <input
          {...inputProps}
          autoComplete="off"
          className="w-full rounded-none border border-white/10 text-white placeholder-white/25 outline-none focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all duration-200"
          style={{
            height: 44,
            paddingLeft: 40,
            paddingRight: suffix ? 44 : 16,
            fontSize: 13,
            background: 'rgba(0,0,0,0.25)',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        {suffix && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ zIndex: 1 }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}
