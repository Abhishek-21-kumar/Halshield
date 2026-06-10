/**
 * HalShield — Settings Page.
 * Configuration adjustments for NLI models, chunk parameters, thresholds, and vector reset.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, AlertOctagon, Sliders, Server, Save, CheckCircle, RotateCcw } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { getSettings, updateSettings, resetSystemDatabase } from '../services/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [purging, setPurging] = useState(false);

  // Settings States
  const [config, setConfig] = useState({
    hallucination_threshold: 0.6,
    medium_threshold: 0.3,
    nli_model: 'cross-encoder/nli-deberta-v3-base',
    embedding_model: 'all-MiniLM-L6-v2',
    chunk_size: 500,
    chunk_overlap: 100,
    top_k_results: 5,
    available_models: []
  });

  useEffect(() => {
    const fetchConf = async () => {
      try {
        const res = await getSettings();
        setConfig(res.data);
      } catch (err) {
        setError('Failed to fetch settings from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchConf();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name.endsWith('threshold') || name.startsWith('top_k') || name.includes('chunk') 
      ? parseFloat(value) 
      : value
    });
    setSuccess('');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const res = await updateSettings({
        hallucination_threshold: config.hallucination_threshold,
        medium_threshold: config.medium_threshold,
        chunk_size: config.chunk_size,
        chunk_overlap: config.chunk_overlap,
        top_k_results: config.top_k_results
      });
      setConfig(res.data);
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save configuration settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSystem = async () => {
    setPurging(true);
    setSuccess('');
    setError('');
    try {
      await resetSystemDatabase();
      setSuccess('System cleared: Evaluation records and vectorstore FAISS indexes purged.');
      setShowConfirmReset(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed.');
    } finally {
      setPurging(false);
    }
  };

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
      <div className="w-full max-w-4xl mx-auto px-1 py-1">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-[#f8fafc] flex items-center gap-2">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-[#7c3aed]" /> System Configuration
          </h2>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">Adjust NLI detection indices, threshold bounds, and document chunking specifications</p>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-none bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-xs sm:text-sm flex items-center gap-2 font-semibold font-sans">
              <CheckCircle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-none bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-xs sm:text-sm flex items-center gap-2 font-semibold font-sans">
              <AlertOctagon className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSave} className="space-y-6 sm:space-y-8 w-full">
          
          {/* Card 1: NLI thresholds */}
          <GlassCard className="p-5 sm:p-6 w-full">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-6 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-[#7c3aed]" /> Verification Thresholds
            </h3>

            <div className="space-y-6">
              {/* Hallucination threshold slider */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="font-semibold text-[#94a3b8]">Hallucination Target Limit</span>
                  <span className="font-mono font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/30 px-2 py-0.5 rounded-none">
                    &gt;= {config.hallucination_threshold}
                  </span>
                </div>
                <p className="text-[10px] text-[#94a3b8]/60 mb-3">Claims equal to or above this score are flagged as fully hallucinated (Red).</p>
                <input
                  type="range"
                  name="hallucination_threshold"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={config.hallucination_threshold}
                  onChange={handleChange}
                  className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>

              {/* Medium threshold slider */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="font-semibold text-[#94a3b8]">Neutral Uncertainty Bounds</span>
                  <span className="font-mono font-bold text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/30 px-2 py-0.5 rounded-none">
                    &gt;= {config.medium_threshold}
                  </span>
                </div>
                <p className="text-[10px] text-[#94a3b8]/60 mb-3">Claims above this value (but below the hallucination limit) are flagged as uncertain/neutral (Yellow).</p>
                <input
                  type="range"
                  name="medium_threshold"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={config.medium_threshold}
                  onChange={handleChange}
                  className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>
            </div>
          </GlassCard>

          {/* Card 2: RAG Settings */}
          <GlassCard className="p-5 sm:p-6 w-full">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-6 uppercase tracking-wider">
              <Server className="w-4 h-4 text-[#06b6d4]" /> RAG Chunker & Vector Search
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Chunk Size */}
              <div>
                <label className="block text-[10px] font-extrabold text-text-secondary/50 uppercase tracking-wider mb-2">Chunk Size (Words)</label>
                <input
                  type="number"
                  name="chunk_size"
                  value={config.chunk_size}
                  onChange={handleChange}
                  min="100"
                  max="2000"
                  step="50"
                  className="w-full h-11 px-3 rounded-none bg-box-darker border border-border text-xs sm:text-sm font-mono text-text-primary placeholder-text-secondary/35 outline-none focus:border-[#06b6d4] transition-all"
                />
              </div>

              {/* Chunk Overlap */}
              <div>
                <label className="block text-[10px] font-extrabold text-text-secondary/50 uppercase tracking-wider mb-2">Chunk Overlap</label>
                <input
                  type="number"
                  name="chunk_overlap"
                  value={config.chunk_overlap}
                  onChange={handleChange}
                  min="0"
                  max="500"
                  step="10"
                  className="w-full h-11 px-3 rounded-none bg-box-darker border border-border text-xs sm:text-sm font-mono text-text-primary placeholder-text-secondary/35 outline-none focus:border-[#06b6d4] transition-all"
                />
              </div>

              {/* Top K */}
              <div>
                <label className="block text-[10px] font-extrabold text-text-secondary/50 uppercase tracking-wider mb-2">Search Results (Top K)</label>
                <input
                  type="number"
                  name="top_k_results"
                  value={config.top_k_results}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="w-full h-11 px-3 rounded-none bg-box-darker border border-border text-xs sm:text-sm font-mono text-text-primary placeholder-text-secondary/35 outline-none focus:border-[#06b6d4] transition-all"
                />
              </div>
            </div>

            {/* Model specifications displays */}
            <div className="mt-6 border-t border-border pt-6 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-text-secondary">Active HuggingFace NLI Model:</span>
                <span className="font-mono text-text-secondary">{config.nli_model}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-text-secondary">Active Vector Embeddings model:</span>
                <span className="font-mono text-text-secondary">{config.embedding_model}</span>
              </div>
            </div>
          </GlassCard>

          {/* Form Save Action Buttons */}
          <div className="flex justify-end gap-3 print:hidden">
            <button
              type="submit"
              disabled={saving}
              className={`
                px-6 h-12 rounded-none text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all
                ${saving 
                  ? 'bg-[#7c3aed]/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:brightness-110'
                }
              `}
            >
              <Save className="w-4 h-4 flex-shrink-0" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>

        {/* Card 3: Danger Zone */}
        <div className="mt-12 sm:mt-16">
          <GlassCard className="p-5 sm:p-6 border-l-4 border-l-[#ef4444] bg-[#ef4444]/[0.01]">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-3 uppercase tracking-wider text-[#ef4444]">
              <RotateCcw className="w-4 h-4" /> System Reset (Danger Zone)
            </h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
              Clearing the database will permanently delete your hallucination verification records, clear uploaded source documents, and flush the FAISS local indices. This action is irreversible.
            </p>
            
            {!showConfirmReset ? (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="px-5 py-3 rounded-none border border-[#ef4444] text-[#ef4444] text-xs font-bold hover:bg-[#ef4444]/10 transition-all cursor-pointer"
              >
                Clear Database Content
              </button>
            ) : (
              <div className="p-4 rounded-none bg-[#ef4444]/5 border border-[#ef4444]/25 flex flex-wrap gap-4 items-center justify-between">
                <div className="text-xs text-[#ef4444] font-bold">
                  Are you absolutely sure? This will purge all audits and reference vectors.
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-4 py-2 rounded-none bg-white/5 border border-white/10 text-[#94a3b8] text-xs font-bold hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSystem}
                    disabled={purging}
                    className="px-4 py-2 rounded-none bg-[#ef4444] text-white text-xs font-bold hover:bg-[#dc2626] transition-all cursor-pointer flex items-center gap-2"
                  >
                    {purging && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    <span>Confirm Wipe</span>
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
