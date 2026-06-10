/**
 * HalShield — Navbar Component.
 * Premium navigation bar with branding, nav links, and user menu.
 */
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, LayoutDashboard, Home, LogOut, FileText } from 'lucide-react';
import { getUser, logoutUser } from '../services/auth';

export default function Navbar() {
  const location = useLocation();
  const user = getUser();

  const navLinks = [
    { path: '/', label: 'Analyze', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 glass"
      style={{ background: 'rgba(6,6,12,0.8)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="relative">
            <Shield className="w-7 h-7 text-[var(--color-accent)]" />
            <div className="absolute inset-0 blur-lg opacity-40 bg-[var(--color-accent)]" />
          </div>
          <h1
            className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent animate-gradient"
            style={{
              backgroundImage: 'linear-gradient(135deg, #7c5cfc 0%, #a78bfa 50%, #06b6d4 100%)',
              backgroundSize: '200% 200%',
            }}
          >
            HalShield
          </h1>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[rgba(124,92,252,0.15)] text-[var(--color-accent)] border border-[rgba(124,92,252,0.2)] tracking-wider">
            v2.0
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 no-underline
                  ${isActive
                    ? 'bg-[rgba(124,92,252,0.15)] text-[var(--color-accent)] shadow-[0_0_12px_rgba(124,92,252,0.15)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(30,30,50,0.5)]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-low)] shadow-[0_0_8px_rgba(34,197,94,0.3)] animate-pulse-slow" />
            <span className="text-xs text-[var(--color-text-tertiary)]">API Ready</span>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-cyan)] flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm text-[var(--color-text-secondary)]">
                {user.name}
              </span>
              <button
                onClick={logoutUser}
                className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-high)] hover:bg-[rgba(239,68,68,0.1)] transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
