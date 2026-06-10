/**
 * HalShield — Loading Overlay Component.
 * Full-screen loading animation during analysis with neural network visual.
 */
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function LoadingOverlay({ message = 'Analyzing...', subtext = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(6,6,12,0.9)] backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        {/* Animated shield */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 rounded-full border-2 border-[rgba(124,92,252,0.3)]"
            style={{
              borderTopColor: 'var(--color-accent)',
              borderRightColor: 'rgba(6,182,212,0.5)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-10 h-10 text-[var(--color-accent)]" />
          </div>
          <div className="absolute inset-0 rounded-full blur-2xl opacity-30 bg-[var(--color-accent)]" />
        </div>

        {/* Text */}
        <div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg font-semibold text-[var(--color-text-primary)]"
          >
            {message}
          </motion.p>
          {subtext && (
            <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">{subtext}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 rounded-full bg-[rgba(55,55,90,0.45)] overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1/2 h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
