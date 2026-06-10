import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Shield, Menu, LogOut, Plus, Sun, Moon, ChevronDown } from 'lucide-react';
import { getUser, logoutUser } from '../services/auth';
import { healthCheck } from '../services/api';
import AnimatedBackground from './AnimatedBackground';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [apiReady, setApiReady] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  // Sync theme class on documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Handle responsive resizing
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Collapse sidebar automatically on mobile routing
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Check API health status occasionally
  useEffect(() => {
    const check = async () => {
      try {
        await healthCheck();
        setApiReady(true);
      } catch {
        setApiReady(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNewAnalysis = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('new-analysis'));
      }, 80);
    } else {
      window.dispatchEvent(new CustomEvent('new-analysis'));
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary overflow-x-hidden font-sans relative transition-colors duration-300">
      <AnimatedBackground variant="dashboard" />

      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 w-[85%]">
        
        {/* Top Header / Custom Navbar */}
        <header className="py-3 px-6 border-b border-border bg-header backdrop-blur-xl sticky top-0 z-30 select-none flex items-center justify-between transition-colors duration-300">
          
          {/* Left: Hamburger & Workspace Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-none border border-border hover:border-border-light hover:bg-surface text-text-secondary hover:text-text-primary transition-all cursor-pointer flex-shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[15px] tracking-tight text-text-primary">
                  NLI Verification Workspace
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 uppercase">
                  v1.0
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-text-secondary/60 mt-0.5 hidden xs:block">
                Detect and analyze hallucinations in LLM responses using NLI, RAG & advanced verification
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Engine Status Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1bdf7d]/10 border border-[#1bdf7d]/20 text-[10.5px] font-bold text-[#1bdf7d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1bdf7d] animate-pulse" />
              <span>Engine Online</span>
            </div>

            {/* New Analysis Button */}
            <button
              onClick={handleNewAnalysis}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-none text-[11px] font-black text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-all cursor-pointer shadow-md shadow-[#7c3aed]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Analysis</span>
            </button>

            {/* Light/Dark Mode Switcher */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-none border border-border hover:bg-surface text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div className="flex items-center gap-1.5 cursor-pointer group">
                <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-[11.5px] font-black shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="text-xs font-bold text-text-primary hidden sm:block truncate max-w-[100px]">
                  {user?.name || 'Abhishek Kumar'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary/60 group-hover:text-text-primary" />
              </div>
              <button
                onClick={logoutUser}
                className="p-1 rounded-none text-text-secondary/30 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer ml-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic page contents with scroll containment */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
