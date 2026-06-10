/**
 * HalShield — Result Page (Full Report View).
 * Premium 3-panel layout matching workspace aesthetic.
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Shield, AlertTriangle, CheckCircle, HelpCircle,
  FileText, BookOpen, Lightbulb, PenLine, Sparkles, Activity, Eye,
  Printer, Cpu, TrendingUp, Brain
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';

const COLORS = {
  SUPPORTED: { bg: 'rgba(34,197,94,0.06)', border: '#22c55e', text: '#22c55e' },
  HALLUCINATED: { bg: 'rgba(239,68,68,0.06)', border: '#ef4444', text: '#ef4444' },
  UNCERTAIN: { bg: 'rgba(250,204,21,0.06)', border: '#facc15', text: '#facc15' },
};

function CircularProgressGauge({ score, title, color, valueText, size = 110 }) {
  const r = (size / 2) - 8;
  const c = 2 * Math.PI * r;
  const strokeOffset = c * (1 - score);
  return (
    <div className="relative flex flex-col items-center select-none py-1">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={strokeOffset} transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 5px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-xl font-black font-mono tracking-tight" style={{ color }}>
          {valueText}
        </span>
        <span className="text-[8px] font-black uppercase tracking-widest text-[#94a3b8]/40 mt-0.5">
          {title}
        </span>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Prefer navigation state, fallback to localStorage for sidebar access
  let rawResults = state?.results;
  if (!rawResults) {
    try {
      const stored = JSON.parse(localStorage.getItem('halshield_last_results') || '{}');
      rawResults = stored.results;
    } catch (e) {}
  }
  const resultsList = Array.isArray(rawResults) ? rawResults : (rawResults ? [rawResults] : []);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedClaim, setSelectedClaim] = useState(0);

  if (resultsList.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <Shield className="w-14 h-14 text-[#94a3b8]/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#f8fafc] mb-2">No results found</h3>
            <p className="text-xs text-[#94a3b8] mb-6">Run an analysis first to view the report.</p>
            <button onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-none bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all cursor-pointer">
              Go to Workspace
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const cur = resultsList[activeTab];
  const { claims = [], overall_score = 0, risk_level = 'low', evidence_sources = [], rag_chunks = [],
    corrected_answer, model_used = 'GPT', num_claims = 0, num_hallucinated = 0, num_supported = 0, num_uncertain = 0 } = cur;
  const activeClaim = claims[selectedClaim] || null;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(resultsList, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `halshield_report.json`; a.click();
  };

  const chartData = claims.map((c, i) => ({
    name: `S${i + 1}`,
    Entailment: c.nli_scores?.entailment || 0,
    Contradiction: c.nli_scores?.contradiction || 0,
  }));

  const comparisonData = resultsList.map(r => ({
    model: r.model_used || 'GPT',
    'Risk %': Math.round(r.overall_score * 100),
    Hallucinated: r.num_hallucinated,
    Supported: r.num_supported,
  }));

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 overflow-x-hidden print:p-0">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Brain className="w-6 h-6 text-[#7c3aed]" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">Verification Report</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-none text-xs font-bold text-[#94a3b8] border border-white/10 hover:border-[#7c3aed] hover:text-[#f8fafc] transition-all cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> Workspace
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-none text-xs font-bold text-[#94a3b8] border border-white/10 hover:border-[#a78bfa] transition-all cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={exportJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-none text-xs font-bold text-white bg-gradient-to-r from-[#7c3aed] to-[#9178ff] hover:shadow-[0_4px_16px_rgba(124,58,237,0.3)] transition-all cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>
        </div>

        {/* Model Tabs */}
        {resultsList.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-none bg-box-darker border border-border w-fit print:hidden">
            {resultsList.map((res, idx) => (
              <button key={idx} onClick={() => { setActiveTab(idx); setSelectedClaim(0); }}
                className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer flex items-center gap-2
                  ${activeTab === idx
                    ? 'bg-gradient-to-r from-[#7c3aed] to-[#9061f9] text-white shadow-[0_3px_12px_rgba(124,58,237,0.25)]'
                    : 'text-text-secondary/60 hover:text-text-primary hover:bg-surface'}`}>
                <Sparkles className="w-3 h-3" /> {res.model_used} ({Math.round(res.overall_score * 100)}%)
              </button>
            ))}
          </div>
        )}

        {/* Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Hallucination Score', value: `${Math.round(overall_score * 100)}%`, color: overall_score < 0.3 ? '#22c55e' : overall_score < 0.6 ? '#facc15' : '#ef4444', icon: AlertTriangle },
            { label: 'Confidence', value: `${Math.round((1 - overall_score) * 100)}%`, color: '#7c3aed', icon: Shield },
            { label: 'Risk Level', value: risk_level?.toUpperCase(), color: risk_level === 'high' ? '#ef4444' : risk_level === 'medium' ? '#facc15' : '#22c55e', icon: TrendingUp },
            { label: 'Supported', value: num_supported, color: '#22c55e', icon: CheckCircle },
            { label: 'Contradicted', value: num_hallucinated, color: '#ef4444', icon: AlertTriangle },
            { label: 'Unverified', value: num_uncertain, color: '#facc15', icon: HelpCircle },
          ].map((card, i) => (
            <GlassCard key={i} hover={false} className="p-3.5 text-center">
              <card.icon className="w-4 h-4 mx-auto mb-1.5 opacity-70" style={{ color: card.color }} />
              <div className="text-xl font-black font-mono leading-none" style={{ color: card.color }}>{card.value}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]/40 mt-1.5">{card.label}</div>
            </GlassCard>
          ))}
        </div>

        {/* Main Stacked Layout — Top section then content below */}
        <div className="flex flex-col gap-5">

          {/* Top Row: Gauges + Evidence + Heatmap (side-by-side on desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <GlassCard hover={false} className="p-5 flex flex-col items-center">
              {/* Gauges Side by Side */}
              <div className="grid grid-cols-2 gap-4 w-full border-b border-white/5 pb-4">
                <CircularProgressGauge score={overall_score} title="Hallucination" color="#ef4444" valueText={`${Math.round(overall_score * 100)}%`} />
                <CircularProgressGauge score={1 - overall_score} title="Confidence" color="#22c55e" valueText={`${Math.round((1 - overall_score) * 100)}%`} />
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2 w-full text-center">
                <div className="p-2 rounded-none bg-[#22c55e]/5 border border-[#22c55e]/15">
                  <div className="text-sm font-extrabold text-[#22c55e] font-mono">{num_supported}</div>
                  <div className="text-[8px] font-bold text-[#94a3b8]/40 uppercase">Factual</div>
                </div>
                <div className="p-2 rounded-none bg-[#facc15]/5 border border-[#facc15]/15">
                  <div className="text-sm font-extrabold text-[#facc15] font-mono">{num_uncertain}</div>
                  <div className="text-[8px] font-bold text-[#94a3b8]/40 uppercase">Uncertain</div>
                </div>
                <div className="p-2 rounded-none bg-[#ef4444]/5 border border-[#ef4444]/15">
                  <div className="text-sm font-extrabold text-[#ef4444] font-mono">{num_hallucinated}</div>
                  <div className="text-[8px] font-bold text-[#94a3b8]/40 uppercase">False</div>
                </div>
              </div>
              <div className="text-[10px] text-[#94a3b8]/50 mt-3">{num_claims} claims • Model: {model_used}</div>
            </GlassCard>

            {rag_chunks.length > 0 && (
              <GlassCard hover={false} className="p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-text-secondary/60 mb-3 uppercase tracking-[0.1em]">
                  <BookOpen className="w-3.5 h-3.5 text-[#06b6d4]" /> Evidence Sources
                </h3>
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {rag_chunks.map((c, i) => (
                    <div key={i} className="p-3 rounded-none bg-box-darker border border-border">
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className="font-bold text-[#06b6d4] truncate max-w-[120px]">📄 {c.source}</span>
                        {c.score != null && (
                          <span className="font-mono font-bold text-[#22c55e] bg-[#22c55e]/10 px-1.5 py-0.5 rounded">{Math.round(c.score * 100)}%</span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary/80 leading-relaxed line-clamp-3">"{c.text}"</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Heatmap */}
            {claims.length > 0 && (
              <GlassCard hover={false} className="p-4">
                <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-[#94a3b8]/50 mb-2 uppercase tracking-[0.1em]">
                  <Activity className="w-3.5 h-3.5 text-[#7c3aed]" /> Heatmap
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {claims.map((c, idx) => {
                    const cfg = COLORS[c.label] || COLORS.UNCERTAIN;
                    return (
                      <button key={idx} onClick={() => setSelectedClaim(idx)}
                        className={`w-7 h-7 rounded-none text-[10px] font-black flex items-center justify-center transition-all cursor-pointer border
                          ${idx === selectedClaim ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`}
                        style={{ backgroundColor: cfg.border, color: '#050816' }}>
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Full-Width Content Sections */}
          <div className="space-y-5">
            {/* Sentence Highlighting */}
            <GlassCard hover={false} className="p-4 sm:p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-text-secondary/60 mb-3 uppercase tracking-[0.1em]">
                <FileText className="w-3.5 h-3.5 text-[#7c3aed]" /> Sentence-Level Factuality
              </h3>
              <div className="p-4 rounded-none bg-box-darker border border-border text-sm leading-[1.8] select-text">
                {claims.map((claim, idx) => {
                  const cfg = COLORS[claim.label] || COLORS.UNCERTAIN;
                  const isSel = idx === selectedClaim;
                  return (
                    <span key={idx} onClick={() => setSelectedClaim(idx)}
                      className={`inline px-0.5 rounded-sm cursor-pointer transition-all border-b-2
                        ${isSel ? 'bg-white/[0.05] font-semibold' : 'hover:bg-white/[0.02]'}`}
                      style={{ borderBottomColor: cfg.border, color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {claim.text}{' '}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-text-secondary/50">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#22c55e]" />Supported</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#facc15]" />Uncertain</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#ef4444]" />Hallucinated</div>
              </div>
            </GlassCard>

            {/* Claim Inspector */}
            {activeClaim && (
              <GlassCard hover={false} className="p-4 sm:p-5">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-text-secondary/60 uppercase tracking-[0.1em]">
                    <Eye className="w-3.5 h-3.5 text-[#a78bfa]" /> Claim #{selectedClaim + 1}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border"
                    style={{ color: (COLORS[activeClaim.label] || COLORS.UNCERTAIN).text,
                      borderColor: (COLORS[activeClaim.label] || COLORS.UNCERTAIN).border,
                      backgroundColor: (COLORS[activeClaim.label] || COLORS.UNCERTAIN).bg }}>
                    {activeClaim.label}
                  </span>
                  <span className="text-xs font-bold font-mono ml-auto"
                    style={{ color: (COLORS[activeClaim.label] || COLORS.UNCERTAIN).text }}>
                    {Math.round(activeClaim.hallucination_score * 100)}%
                  </span>
                </div>
                <p className="text-xs text-text-primary font-mono p-2.5 rounded-none bg-box-darker border border-border mb-3">
                  "{activeClaim.text}"
                </p>
                {activeClaim.nli_scores && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {Object.entries(activeClaim.nli_scores).map(([k, v]) => {
                      const barCol = k === 'entailment' ? '#22c55e' : k === 'contradiction' ? '#ef4444' : '#facc15';
                      return (
                        <div key={k} className="p-2 rounded-none bg-box-darker border border-border">
                          <div className="flex justify-between text-[10px] font-bold text-text-secondary/55 mb-1 uppercase">
                            <span>{k}</span><span className="font-mono">{Math.round(v * 100)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${v * 100}%`, backgroundColor: barCol }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {activeClaim.explanation && (
                  <div className="p-2.5 rounded-none bg-box-darker border border-border text-[11px] text-text-secondary/80">
                    <Lightbulb className="w-3 h-3 text-[#facc15] inline mr-1" />
                    {activeClaim.explanation}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Charts */}
            {chartData.length > 1 && (
              <GlassCard hover={false} className="p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-[#94a3b8]/50 mb-3 uppercase tracking-[0.1em]">
                  <Activity className="w-3.5 h-3.5 text-[#a78bfa]" /> NLI Verification Curve
                </h3>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gCon" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} domain={[0, 1]} />
                      <Tooltip contentStyle={{ background: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f8fafc', fontSize: 11 }} />
                      <Area type="monotone" dataKey="Entailment" stroke="#22c55e" fillOpacity={1} fill="url(#gEnt)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Contradiction" stroke="#ef4444" fillOpacity={1} fill="url(#gCon)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}

            {/* Multi-LLM Comparison */}
            {resultsList.length > 1 && (
              <GlassCard hover={false} className="p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-[#94a3b8]/50 mb-3 uppercase tracking-[0.1em]">
                  <Sparkles className="w-3.5 h-3.5 text-[#06b6d4]" /> Multi-LLM Comparison
                </h3>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="model" stroke="#94a3b8" tickLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f8fafc', fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Risk %" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Hallucinated" fill="#ef4444" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Supported" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}

            {/* Corrected Answer */}
            {corrected_answer?.changes?.length > 0 && (
              <GlassCard hover={false} className="p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-text-secondary/60 mb-3 uppercase tracking-[0.1em]">
                  <PenLine className="w-3.5 h-3.5 text-[#22c55e]" /> Auto-Corrections
                </h3>
                <div className="space-y-3">
                  {corrected_answer.changes.map((ch, i) => (
                    <div key={i} className="rounded-none border border-border overflow-hidden">
                      <div className="p-3 bg-red-500/[0.01] border-l-2 border-l-[#ef4444]">
                        <span className="text-[9px] font-black uppercase text-[#ef4444] block mb-0.5">Original</span>
                        <p className="text-xs text-text-secondary/60 line-through font-mono">{ch.original}</p>
                      </div>
                      <div className="p-3 bg-green-500/[0.01] border-l-2 border-l-[#22c55e] border-t border-border">
                        <span className="text-[9px] font-black uppercase text-[#22c55e] block mb-0.5">Correction</span>
                        <p className="text-xs text-text-primary font-semibold font-mono">{ch.correction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}


            {/* ─── 1. NLI RESULTS ─── */}
            <GlassCard hover={false} className="p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-text-secondary/60 mb-4 uppercase tracking-[0.1em]">
                <Brain className="w-3.5 h-3.5 text-[#7c3aed]" /> NLI Results
              </h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="border-b border-border text-text-secondary/55 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-3 w-12">#</th>
                      <th className="py-2.5 px-3">Claim / Statement</th>
                      <th className="py-2.5 px-3 w-28 text-center">NLI Prediction</th>
                      <th className="py-2.5 px-3 w-20 text-center">Confidence</th>
                      <th className="py-2.5 px-3 w-40 text-right">Evidence Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-semibold">
                    {claims.map((claim, idx) => {
                      const isContradiction = claim.label === 'HALLUCINATED';
                      const isSupported = claim.label === 'SUPPORTED';
                      return (
                        <tr key={idx} className="hover:bg-surface transition-colors">
                          <td className="py-3 px-3 font-mono text-white/30">{idx + 1}</td>
                          <td className="py-3 px-3 text-text-primary font-medium truncate max-w-xs">{claim.text}</td>
                          <td className="py-3 px-3 text-center">
                            <span style={{ color: isContradiction ? '#ef4444' : isSupported ? '#22c55e' : '#facc15' }}>
                              {isContradiction ? 'Contradiction' : isSupported ? 'Entailment' : 'Neutral'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-text-secondary/80">
                            {claim.hallucination_score.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right text-[#06b6d4] font-mono hover:underline truncate max-w-[130px]">
                            {claim.evidence_source}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* ─── 2. EVIDENCE CHUNKS ─── */}
            <GlassCard hover={false} className="p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-text-secondary/60 mb-4 uppercase tracking-[0.1em]">
                <BookOpen className="w-3.5 h-3.5 text-[#06b6d4]" /> Evidence Chunks
              </h3>
              <div className="space-y-3">
                {claims.map((claim, idx) => (
                  <div key={idx} className="p-3.5 rounded-none bg-box-subtle border border-border text-[11px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[#06b6d4] font-bold">Claim #{idx + 1} Grounded Evidence</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border"
                        style={{ color: (COLORS[claim.label] || COLORS.UNCERTAIN).text,
                          borderColor: (COLORS[claim.label] || COLORS.UNCERTAIN).border,
                          backgroundColor: (COLORS[claim.label] || COLORS.UNCERTAIN).bg }}>
                        {claim.label}
                      </span>
                    </div>
                    <p className="text-text-secondary italic leading-relaxed">"{claim.explanation}"</p>
                    <div className="text-[10px] font-mono text-[#7c3aed] mt-2 font-bold">
                      Source: {claim.evidence_source}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* ─── 3. SIMILARITY SCORES ─── */}
            <GlassCard hover={false} className="p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-text-secondary/60 mb-4 uppercase tracking-[0.1em]">
                <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" /> Similarity Scores
              </h3>
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEntDetail" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0.0}/></linearGradient>
                      <linearGradient id="colorConDetail" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} domain={[0, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10 }} />
                    <Area type="monotone" name="Entailment" dataKey="Entailment" stroke="#22c55e" fillOpacity={1} fill="url(#colorEntDetail)" />
                    <Area type="monotone" name="Contradiction" dataKey="Contradiction" stroke="#ef4444" fillOpacity={1} fill="url(#colorConDetail)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Per-claim similarity bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {claims.map((claim, idx) => {
                  const ent = claim.nli_scores?.entailment || 0;
                  const con = claim.nli_scores?.contradiction || 0;
                  const neu = claim.nli_scores?.neutral || 0;
                  return (
                    <div key={idx} className="p-3 rounded-none bg-box-darker border border-border">
                      <div className="text-[10px] font-bold text-text-primary mb-2 truncate">S{idx + 1}: {claim.text}</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="w-20 text-text-secondary/50 font-bold">Entailment</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${ent * 100}%` }} />
                          </div>
                          <span className="font-mono text-[#22c55e] w-8 text-right">{Math.round(ent * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="w-20 text-text-secondary/50 font-bold">Neutral</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-[#facc15]" style={{ width: `${neu * 100}%` }} />
                          </div>
                          <span className="font-mono text-[#facc15] w-8 text-right">{Math.round(neu * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="w-20 text-text-secondary/50 font-bold">Contradiction</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-[#ef4444]" style={{ width: `${con * 100}%` }} />
                          </div>
                          <span className="font-mono text-[#ef4444] w-8 text-right">{Math.round(con * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* ─── 4. EXPLAINABILITY ─── */}
            <GlassCard hover={false} className="p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-text-secondary/60 mb-4 uppercase tracking-[0.1em]">
                <Lightbulb className="w-3.5 h-3.5 text-[#facc15]" /> Explainability
              </h3>
              <div className="space-y-3">
                {claims.map((claim, idx) => {
                  const cfg = COLORS[claim.label] || COLORS.UNCERTAIN;
                  return (
                    <div key={idx} className="p-4 rounded-none border border-border bg-box-subtle text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-text-primary">Claim #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px]" style={{ color: cfg.text }}>{Math.round(claim.hallucination_score * 100)}%</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border"
                            style={{ color: cfg.text, borderColor: cfg.border, backgroundColor: cfg.bg }}>
                            {cfg.text ? claim.label : 'UNCERTAIN'}
                          </span>
                        </div>
                      </div>
                      <p className="text-text-primary/80 font-mono text-[11px] p-2.5 rounded-none bg-box-darker border border-border mb-2.5">
                        "{claim.text}"
                      </p>
                      <div className="flex items-start gap-1.5">
                        <Lightbulb className="w-3 h-3 text-[#facc15] mt-0.5 flex-shrink-0" />
                        <p className="text-text-secondary leading-relaxed">{claim.explanation}</p>
                      </div>
                      <div className="text-[10px] font-mono text-[#06b6d4] mt-2 font-bold">
                        Evidence: {claim.evidence_source}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
