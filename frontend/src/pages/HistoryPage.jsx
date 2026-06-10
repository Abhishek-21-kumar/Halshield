/**
 * HalShield — History Page.
 * Browses all past hallucination verification runs with filtering and search capabilities.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Search, Shield, Calendar, AlertOctagon, ArrowRight, Eye, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { getHistory, getAnalysisRecord } from '../services/api';

const RISK_BADGES = {
  low: { text: 'Low Risk', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  medium: { text: 'Medium Risk', color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  high: { text: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModel, setFilterModel] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [fetchingRecordId, setFetchingRecordId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getHistory();
        setHistory(res.data || []);
      } catch (err) {
        console.error('Failed to load history list:', err);
        setError('Could not retrieve audit history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleInspect = async (id) => {
    setFetchingRecordId(id);
    setError('');
    try {
      const res = await getAnalysisRecord(id);
      navigate('/results', { state: { results: res.data } });
    } catch (err) {
      setError('Failed to fetch evaluation audit details.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setFetchingRecordId(null);
    }
  };

  // Filter Logic
  const filteredItems = history.filter(item => {
    const matchesSearch = 
      (item.question && item.question.toLowerCase().includes(search.toLowerCase())) ||
      (item.answer && item.answer.toLowerCase().includes(search.toLowerCase()));
      
    const matchesModel = filterModel === 'ALL' || item.model_used === filterModel;
    const matchesRisk = filterRisk === 'ALL' || item.risk_level === filterRisk.toLowerCase();
    
    return matchesSearch && matchesModel && matchesRisk;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-1 py-1">
        
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#7c3aed]" /> Verification Archives
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-semibold">Browse, search, and deep-inspect previous hallucination analyses</p>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 rounded-none bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-xs sm:text-sm font-semibold flex items-center gap-2">
            <AlertOctagon className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter controls panel */}
        <GlassCard className="p-4 sm:p-5 mb-8 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/40 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search prompt or output content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-none bg-box-darker border border-border text-xs sm:text-sm text-text-primary placeholder-text-secondary/35 outline-none focus:border-accent transition-all"
              />
            </div>

            {/* Model Filter */}
            <div>
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="w-full h-11 px-3 rounded-none bg-box-darker border border-border text-xs sm:text-sm text-text-primary outline-none focus:border-accent transition-all cursor-pointer font-semibold"
              >
                <option value="ALL">All Models</option>
                <option value="GPT">GPT-4</option>
                <option value="Gemini">Gemini</option>
                <option value="Llama">Llama</option>
                <option value="Mistral">Mistral</option>
              </select>
            </div>

            {/* Risk Filter */}
            <div>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full h-11 px-3 rounded-none bg-box-darker border border-border text-xs sm:text-sm text-text-primary outline-none focus:border-accent transition-all cursor-pointer font-semibold"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>

          </div>
        </GlassCard>

        {/* History List */}
        <div className="space-y-4 w-full">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const badge = RISK_BADGES[item.risk_level] || RISK_BADGES.low;
              const isChecking = fetchingRecordId === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, ease: 'easeOut' }}
                >
                  <GlassCard
                    onClick={() => !isChecking && handleInspect(item.id)}
                    className="p-4 sm:p-5 w-full cursor-pointer flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 border-l-4"
                    style={{ borderLeftColor: badge.color }}
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-extrabold text-text-secondary/50 bg-surface px-2 py-0.5 rounded-none font-mono border border-border">
                          AUDIT #{item.id}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-secondary/60">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded-none border border-[#7c3aed]/20">
                          {item.model_used || 'GPT'}
                        </span>
                      </div>

                      {/* Question Snippet */}
                      <p className="text-xs sm:text-sm font-semibold text-text-primary truncate font-mono">
                        {item.question}
                      </p>
                      
                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-[10px] text-text-secondary/50 font-bold uppercase tracking-wider">
                        <span>Claims: <span className="text-text-secondary font-mono">{item.num_claims}</span></span>
                        <span>Hallucinated: <span className="text-[#ef4444] font-mono">{item.num_hallucinated}</span></span>
                      </div>
                    </div>

                    {/* Right column: score badges */}
                    <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t border-border sm:border-0 pt-3 sm:pt-0">
                      <div className="text-right sm:pr-4">
                        <div className="text-lg font-black font-mono" style={{ color: badge.color }}>
                          {Math.round(item.overall_score * 100)}%
                        </div>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wide mt-1 inline-block"
                          style={{ color: badge.color, borderColor: badge.color + '30', backgroundColor: badge.bg }}>
                          {badge.text}
                        </span>
                      </div>
                      
                      <button
                        disabled={isChecking}
                        className="p-2.5 rounded-none border border-border text-text-secondary/60 hover:text-text-primary hover:border-accent hover:bg-accent/10 transition-all flex items-center justify-center cursor-pointer"
                      >
                        {isChecking ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                  </GlassCard>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-20">
              <Shield className="w-12 h-12 text-[#94a3b8]/30 mx-auto mb-3" />
              <p className="text-xs text-[#94a3b8]">No verification runs match the active filters.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
