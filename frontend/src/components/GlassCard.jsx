/**
 * HalShield — GlassCard Component.
 * Cursor/Linear-style glassmorphism card.
 */
import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  delay = 0,
  hover = true,
  glow = false,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -1, transition: { duration: 0.2 } } : undefined}
      className={`
        relative overflow-hidden rounded-none
        bg-surface backdrop-blur-xl
        border border-border
        transition-all duration-300
        ${hover ? 'hover:border-border-light hover:bg-surface-solid/80' : ''}
        ${glow ? 'shadow-[0_0_20px_rgba(124,58,237,0.12)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}
