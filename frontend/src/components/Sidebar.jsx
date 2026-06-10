/**
 * HalShield — Redesigned Sidebar matching reference image.
 */
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Scan, LayoutDashboard, Clock, FileText,
  Settings, ChevronLeft, ChevronRight, Database, Cpu, Crown, Info, Eye
} from 'lucide-react';
import { getUser } from '../services/auth';

const NAV = [
  { path: '/',          label: 'Analyze',   icon: Scan },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/results',   label: 'Detailed Analysis', icon: Eye },
  { path: '/history',   label: 'History',   icon: Clock },
  { path: '/reports',   label: 'Reports',   icon: FileText },
  { path: '/documents', label: 'Documents', icon: Database },
  { path: '/models',    label: 'Models',    icon: Cpu },
  { path: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Sidebar({ isOpen, toggleSidebar, isMobile }) {
  const { pathname } = useLocation();
  const user = getUser();

  const content = (
    <div className="h-full flex flex-col justify-between select-none bg-sidebar backdrop-blur-xl border-r border-border py-4 transition-colors duration-300">
      
      {/* Top Section */}
      <div className="flex flex-col flex-1 min-h-0">
        
        {/* Brand Logo & Name */}
        <div className="px-5 pb-5 border-b border-border flex-shrink-0 flex items-center gap-3">
          <div className="w-9 h-9 rounded-none bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.25)] flex-shrink-0">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          {(isOpen || isMobile) && (
            <div className="flex flex-col">
              <span className="font-extrabold text-[15px] text-text-primary leading-tight">
                HalShield
              </span>
              <span className="text-[9.5px] font-bold text-text-secondary/40 uppercase tracking-widest mt-0.5">
                NLI Verification Engine
              </span>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map((link) => {
            const active = pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-none text-[13px] font-bold transition-all duration-200 no-underline group relative
                  ${active
                    ? 'bg-gradient-to-r from-[#7c3aed]/15 to-transparent border-l-2 border-[#7c3aed] text-text-primary'
                    : 'text-text-secondary/60 hover:text-text-primary hover:bg-surface'
                  }
                `}
              >
                <Icon className={`w-[17px] h-[17px] flex-shrink-0 ${active ? 'text-[#7c3aed]' : 'text-text-secondary/40'}`} strokeWidth={2.2} />
                
                {(isOpen || isMobile) ? (
                  <span>{link.label}</span>
                ) : (
                  <div className="absolute left-[calc(100%+8px)] px-2.5 py-1 rounded-none bg-bg-secondary border border-border text-text-primary text-[11px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                    {link.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom status and plan cards */}
      {(isOpen || isMobile) && (
        <div className="px-4 space-y-3 mt-auto">
          {/* Engine Status Card */}
          <div className="p-4 rounded-none border border-border bg-box-subtle flex flex-col gap-2.5">
            <div className="text-[9px] font-black uppercase text-text-secondary/40 tracking-wider">
              Engine Status
            </div>
            
            <div className="space-y-2 text-[11px] font-semibold text-text-secondary">
              <div className="flex justify-between items-center">
                <span>NLI Model</span>
                <span className="text-text-primary font-mono">DeBERTa-v3-Large</span>
              </div>
              <div className="flex justify-between items-center">
                <span>RAG</span>
                <span className="text-text-primary">FAISS Index</span>
              </div>
              <div className="flex justify-between items-center">
                <span>LLM Service</span>
                <span className="flex items-center gap-1 text-[#22c55e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  <span>Online</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Updated</span>
                <span className="text-text-secondary/60">2 min ago</span>
              </div>
            </div>

            <button className="w-full py-1.5 rounded-none border border-border hover:border-border-light text-text-primary text-[10.5px] font-bold flex items-center justify-center gap-1.5 bg-surface hover:bg-surface-solid transition-all cursor-pointer">
              <Info className="w-3.5 h-3.5" />
              <span>System Info</span>
            </button>
          </div>

          {/* Professional Plan Banner */}
          <div className="p-3.5 rounded-none bg-gradient-to-r from-[#7c3aed]/20 to-[#06b6d4]/10 border border-[#7c3aed]/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] flex-shrink-0">
              <Crown className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-text-primary">Professional Plan</div>
              <div className="text-[10px] text-text-secondary/60 mt-0.5">Unlimited analyses</div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse button at bottom */}
      <div className="px-4 pt-3 border-t border-border mt-3">
        <button
          onClick={toggleSidebar}
          className="w-full py-2.5 rounded-none border border-border hover:border-border-light text-text-secondary/50 hover:text-text-primary transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold"
        >
          {isOpen ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

    </div>
  );

  /* ── Mobile drawer ── */
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              onClick={toggleSidebar} className="fixed inset-0 z-40 bg-black md:hidden" />
            <motion.aside
              initial={{ x: -200 }} animate={{ x: 0 }} exit={{ x: -200 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed top-0 bottom-0 left-0 z-50 w-[220px] bg-bg-primary border-r border-border">
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  /* ── Desktop sidebar ── */
  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? '15%' : '64px' }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="hidden md:flex flex-col flex-shrink-0 bg-bg-primary border-r border-border h-screen sticky top-0 overflow-hidden z-30 transition-colors duration-300"
      style={{ minWidth: isOpen ? '15%' : '64px' }}
    >
      {content}
    </motion.aside>
  );
}
