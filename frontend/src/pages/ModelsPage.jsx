import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, Award, Activity, ShieldAlert, Sparkles, CheckCircle, 
  HelpCircle, Server, BarChart2, Info, Check, Zap, Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { getSettings } from '../services/api';

export default function ModelsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConf = async () => {
      try {
        const res = await getSettings();
        setConfig(res.data);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConf();
  }, []);

  const benchmarkData = [
    { name: 'DeBERTa-v3-base', Accuracy: 92.4, Latency: 120, 'VRAM (MB)': 800 },
    { name: 'BART-Large-MNLI', Accuracy: 89.1, Latency: 180, 'VRAM (MB)': 1600 },
    { name: 'RoBERTa-large', Accuracy: 87.5, Latency: 165, 'VRAM (MB)': 1400 },
  ];

  const models = [
    {
      name: 'cross-encoder/nli-deberta-v3-base',
      label: 'DeBERTa v3 Base (Cross-Encoder)',
      description: 'Default high-accuracy classifier. Evaluates claims by comparing representations directly step-by-step.',
      params: '86M parameters',
      latency: '~120ms / sentence',
      accuracy: '92.4% MNLI',
      status: config?.nli_model === 'cross-encoder/nli-deberta-v3-base' ? 'Active' : 'Standby',
      color: '#7c3aed'
    },
    {
      name: 'facebook/bart-large-mnli',
      label: 'BART Large MNLI (Bi-Encoder)',
      description: 'Robust zero-shot inference pipeline. Slower than DeBERTa but excels at long-context entailment tasks.',
      params: '407M parameters',
      latency: '~180ms / sentence',
      accuracy: '89.1% MNLI',
      status: config?.nli_model === 'facebook/bart-large-mnli' ? 'Active' : 'Standby',
      color: '#06b6d4'
    },
    {
      name: 'roberta-large-mnli',
      label: 'RoBERTa Large MNLI',
      description: 'Legacy zero-shot entailment model. Standard baseline, optimized for general semantic coherence checks.',
      params: '355M parameters',
      latency: '~165ms / sentence',
      accuracy: '87.5% MNLI',
      status: config?.nli_model === 'roberta-large-mnli' ? 'Active' : 'Standby',
      color: '#facc15'
    }
  ];

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-1 py-1">
        
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-[#f8fafc] flex items-center gap-2">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-[#7c3aed]" /> Verification Engines & Models
          </h2>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Compare model metrics, parameters, and active configuration settings of NLI cross-encoders.
          </p>
        </motion.div>

        {/* Top Active Models Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Active NLI Model */}
          <GlassCard className="p-6 border-l-4 border-l-[#7c3aed]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded border border-[#7c3aed]/20">
                  Active NLI engine
                </span>
                <h3 className="text-base font-bold text-[#f8fafc] mt-2 font-mono truncate max-w-xs sm:max-w-sm">
                  {config?.nli_model || 'cross-encoder/nli-deberta-v3-base'}
                </h3>
              </div>
              <div className="w-9 h-9 rounded-none bg-[#7c3aed]/10 flex items-center justify-center text-[#7c3aed]">
                <Cpu className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
              This cross-encoder model parses raw sentences and matches them against database evidence sources. 
              Outputs probabilistic values of Contradiction, Entailment, and Neutrality.
            </p>
            <div className="flex flex-wrap gap-4 text-[10px] text-[#94a3b8] font-bold">
              <span>ACCURACY: <span className="text-[#22c55e]">92.4%</span></span>
              <span>•</span>
              <span>LATENCY: <span className="text-[#06b6d4]">~120ms</span></span>
              <span>•</span>
              <span>HARDWARE: <span className="text-[#facc15]">CPU (Local)</span></span>
            </div>
          </GlassCard>

          {/* Active Embedding Model */}
          <GlassCard className="p-6 border-l-4 border-l-[#06b6d4]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#06b6d4] bg-[#06b6d4]/10 px-2 py-0.5 rounded border border-[#06b6d4]/20">
                  Active embedding engine
                </span>
                <h3 className="text-base font-bold text-[#f8fafc] mt-2 font-mono truncate max-w-xs sm:max-w-sm">
                  {config?.embedding_model || 'all-MiniLM-L6-v2'}
                </h3>
              </div>
              <div className="w-9 h-9 rounded-none bg-[#06b6d4]/10 flex items-center justify-center text-[#06b6d4]">
                <Layers className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
              Generates dense vector representations of reference texts. Encodes paragraphs into 384-dimensional floating-point vectors for index matching.
            </p>
            <div className="flex flex-wrap gap-4 text-[10px] text-[#94a3b8] font-bold">
              <span>DIMENSIONALITY: <span className="text-[#06b6d4]">384-dim</span></span>
              <span>•</span>
              <span>METRIC: <span className="text-[#22c55e]">Cosine Similarity</span></span>
              <span>•</span>
              <span>ENGINE: <span className="text-[#7c3aed]">HuggingFace Sentence-Transformers</span></span>
            </div>
          </GlassCard>
        </div>

        {/* Model Grid list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Models list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-[#facc15]" /> Model Registry Catalog
            </h3>
            
            {models.map((model) => (
              <GlassCard key={model.name} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-extrabold text-[#f8fafc]">{model.label}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border
                      ${model.status === 'Active' 
                        ? 'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10' 
                        : 'text-[#94a3b8]/60 border-white/5 bg-white/[0.02]'}`}>
                      {model.status}
                    </span>
                  </div>
                  
                  <span className="block font-mono text-[9px] text-[#94a3b8]/50 mb-2 truncate">{model.name}</span>
                  <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">{model.description}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] border-t border-white/5 pt-3">
                  <div>
                    <span className="block text-[8px] text-[#94a3b8]/40">Parameters</span>
                    <span className="font-mono text-[#f8fafc] font-bold">{model.params}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-[#94a3b8]/40">Inference Rate</span>
                    <span className="font-mono text-[#06b6d4] font-bold">{model.latency}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-[#94a3b8]/40">Benchmark Acc</span>
                    <span className="font-mono text-[#22c55e] font-bold">{model.accuracy}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Model Benchmarks chart */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">
              <BarChart2 className="w-4 h-4 text-[#7c3aed]" /> Performance Benchmarks
            </h3>
            
            <GlassCard className="p-5 flex flex-col justify-between h-[396px]">
              <div>
                <h4 className="text-xs font-extrabold text-[#f8fafc] mb-1 uppercase tracking-wider">Latency vs Accuracy</h4>
                <p className="text-[10px] text-[#94a3b8] leading-relaxed mb-4">
                  DeBERTa models show excellent accuracy/speed ratios for claim matching.
                </p>
              </div>

              <div className="w-full h-[260px] text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={benchmarkData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} tick={{ fontSize: 9 }} />
                    <YAxis stroke="#94a3b8" tickLine={false} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="Accuracy" fill="#22c55e" radius={[4, 4, 0, 0]} name="Accuracy %" />
                    <Bar dataKey="Latency" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Latency (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
