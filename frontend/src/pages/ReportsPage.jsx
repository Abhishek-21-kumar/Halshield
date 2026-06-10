/**
 * HalShield — Reports Page.
 * Generate, view, and export hallucination verification reports
 * with aggregated insights and downloadable summaries.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  FileText, Download, Shield, AlertTriangle, CheckCircle,
  HelpCircle, TrendingUp, Calendar, Filter, Printer,
  BarChart3, Eye, Brain, Activity, Sparkles
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { getHistory, getDashboardData } from '../services/api';

const PIE_COLORS = ['#22c55e', '#facc15', '#ef4444'];
const RISK_COLOR = { low: '#22c55e', medium: '#facc15', high: '#ef4444' };

export default function ReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [selectedModel, setSelectedModel] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      try {
        const [h, d] = await Promise.all([getHistory(), getDashboardData()]);
        setHistory(h.data || []);
        setDashboard(d.data);
      } catch (err) {
        console.error('Reports load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter history by date range
  const filteredHistory = history.filter(item => {
    const matchesModel = selectedModel === 'ALL' || item.model_used === selectedModel;
    if (!matchesModel) return false;
    if (dateRange === 'all') return true;
    if (!item.created_at) return false;
    const d = new Date(item.created_at);
    const now = new Date();
    if (dateRange === '7d') return (now - d) < 7 * 86400000;
    if (dateRange === '30d') return (now - d) < 30 * 86400000;
    if (dateRange === '90d') return (now - d) < 90 * 86400000;
    return true;
  });

  // Computed aggregates
  const totalAnalyses = filteredHistory.length;
  const avgRisk = totalAnalyses > 0
    ? filteredHistory.reduce((sum, i) => sum + (i.overall_score || 0), 0) / totalAnalyses
    : 0;
  const totalHallucinations = filteredHistory.reduce((s, i) => s + (i.num_hallucinated || 0), 0);
  const totalSupported = filteredHistory.reduce((s, i) => s + (i.num_supported || 0), 0);
  const totalClaims = filteredHistory.reduce((s, i) => s + (i.num_claims || 0), 0);

  const riskCounts = { low: 0, medium: 0, high: 0 };
  filteredHistory.forEach(i => { if (i.risk_level) riskCounts[i.risk_level]++; });
  const riskPieData = Object.entries(riskCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }));

  const modelCounts = {};
  filteredHistory.forEach(i => { const m = i.model_used || 'Unknown'; modelCounts[m] = (modelCounts[m] || 0) + 1; });
  const modelBarData = Object.entries(modelCounts).map(([k, v]) => ({ model: k, count: v }));

  const factualityRate = totalClaims > 0 ? Math.round((totalSupported / totalClaims) * 100) : 0;
  const hallucinationRate = totalClaims > 0 ? Math.round((totalHallucinations / totalClaims) * 100) : 0;

  const exportReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      date_range: dateRange,
      model_filter: selectedModel,
      summary: {
        total_analyses: totalAnalyses,
        average_risk: Math.round(avgRisk * 100),
        total_claims_verified: totalClaims,
        total_hallucinations: totalHallucinations,
        total_supported: totalSupported,
        factuality_rate: factualityRate,
        hallucination_rate: hallucinationRate,
        risk_distribution: riskCounts,
        model_usage: modelCounts,
      },
      records: filteredHistory,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `halshield_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
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
      <div className="w-full min-w-0 overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Brain className="w-6 h-6 text-[#7c3aed]" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#06b6d4]">
                Verification Reports
              </span>
            </h2>
            <p className="text-[11px] text-[#94a3b8] mt-1 font-semibold">
              Aggregated hallucination analytics & exportable summaries
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-none text-xs font-bold text-[#94a3b8] border border-white/10 hover:border-[#a78bfa] transition-all cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 rounded-none text-xs font-bold text-white bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:shadow-[0_4px_16px_rgba(124,58,237,0.3)] transition-all cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#94a3b8]/40 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" /> Filters
            </div>

            {/* Date Range */}
            <div className="flex rounded-none bg-black/40 border border-white/5 overflow-hidden">
              {[
                { v: 'all', l: 'All Time' },
                { v: '7d', l: '7 Days' },
                { v: '30d', l: '30 Days' },
                { v: '90d', l: '90 Days' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setDateRange(opt.v)}
                  className={`px-3 py-2 text-[10px] font-bold transition-all cursor-pointer
                    ${dateRange === opt.v
                      ? 'bg-[#7c3aed] text-white'
                      : 'text-[#94a3b8] hover:bg-white/5'
                    }`}>
                  {opt.l}
                </button>
              ))}
            </div>

            {/* Model Filter */}
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
              className="h-9 px-3 rounded-none bg-black/40 border border-white/5 text-[10px] font-bold text-[#f8fafc] outline-none focus:border-[#7c3aed] transition-all cursor-pointer">
              <option value="ALL">All Models</option>
              <option value="GPT">GPT-4</option>
              <option value="Gemini">Gemini</option>
              <option value="Llama">Llama</option>
              <option value="Mistral">Mistral</option>
            </select>

            <span className="text-[10px] text-[#94a3b8]/40 ml-auto font-mono">
              {totalAnalyses} records matched
            </span>
          </div>
        </GlassCard>

        {/* Summary Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total Analyses', value: totalAnalyses, icon: Activity, color: '#7c3aed' },
            { label: 'Avg Risk', value: `${Math.round(avgRisk * 100)}%`, icon: TrendingUp, color: avgRisk < 0.3 ? '#22c55e' : avgRisk < 0.6 ? '#facc15' : '#ef4444' },
            { label: 'Claims Verified', value: totalClaims, icon: Shield, color: '#06b6d4' },
            { label: 'Supported', value: totalSupported, icon: CheckCircle, color: '#22c55e' },
            { label: 'Hallucinated', value: totalHallucinations, icon: AlertTriangle, color: '#ef4444' },
            { label: 'Factuality Rate', value: `${factualityRate}%`, icon: Sparkles, color: '#a78bfa' },
          ].map((card, i) => (
            <GlassCard key={i} hover={false} className="p-3.5 text-center">
              <card.icon className="w-4 h-4 mx-auto mb-1.5 opacity-70" style={{ color: card.color }} />
              <div className="text-xl font-black font-mono leading-none" style={{ color: card.color }}>
                {card.value}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]/40 mt-1.5 leading-tight">
                {card.label}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Risk Distribution Pie */}
          <GlassCard className="p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-[#94a3b8]/50 mb-3 uppercase tracking-[0.1em]">
              <Shield className="w-3.5 h-3.5 text-[#06b6d4]" /> Risk Distribution
            </h3>
            {riskPieData.length > 0 ? (
              <>
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                        {riskPieData.map((entry, idx) => (
                          <Cell key={idx} fill={RISK_COLOR[entry.name] || '#7c3aed'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f8fafc', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center flex-wrap gap-4 mt-2">
                  {Object.entries(RISK_COLOR).map(([k, c]) => (
                    <div key={k} className="flex items-center gap-1.5 text-[10px] font-bold text-[#94a3b8] uppercase">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                      <span>{k} ({riskCounts[k]})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-xs text-[#94a3b8]/40">No risk data available</div>
            )}
          </GlassCard>

          {/* Model Usage Bar */}
          <GlassCard className="p-4 sm:p-5 lg:col-span-2">
            <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-[#94a3b8]/50 mb-3 uppercase tracking-[0.1em]">
              <BarChart3 className="w-3.5 h-3.5 text-[#a78bfa]" /> Model Usage Breakdown
            </h3>
            {modelBarData.length > 0 ? (
              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelBarData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="model" stroke="#94a3b8" tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f8fafc', fontSize: 11 }} />
                    <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Analyses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-[#94a3b8]/40">No model data available</div>
            )}
          </GlassCard>
        </div>

        {/* Factuality vs Hallucination Gauge Bar */}
        <GlassCard className="p-4 sm:p-5 mb-6">
          <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-[#94a3b8]/50 mb-4 uppercase tracking-[0.1em]">
            <Eye className="w-3.5 h-3.5 text-[#22c55e]" /> Overall Factuality vs Hallucination
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] mb-1.5">
                <span>Factual ({factualityRate}%)</span>
                <span>Hallucinated ({hallucinationRate}%)</span>
              </div>
              <div className="h-3 rounded-full bg-white/5 overflow-hidden flex border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${factualityRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#22c55e] to-[#34d399]"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${hallucinationRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-[#ef4444] to-[#f87171]"
                />
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-[#22c55e] font-bold">
                  <CheckCircle className="w-3 h-3" /> {totalSupported} claims supported
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#ef4444] font-bold">
                  <AlertTriangle className="w-3 h-3" /> {totalHallucinations} claims contradicted
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Recent Records Table */}
        <GlassCard className="p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-[11px] font-extrabold text-[#94a3b8]/50 mb-4 uppercase tracking-[0.1em]">
            <Calendar className="w-3.5 h-3.5 text-[#facc15]" /> Recent Verification Records
          </h3>
          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[#94a3b8]/40 font-bold uppercase tracking-wider">
                      <th className="text-left py-2.5 px-3">#</th>
                      <th className="text-left py-2.5 px-3">Date</th>
                      <th className="text-left py-2.5 px-3">Prompt</th>
                      <th className="text-left py-2.5 px-3">Model</th>
                      <th className="text-left py-2.5 px-3">Risk %</th>
                      <th className="text-left py-2.5 px-3">Status</th>
                      <th className="text-left py-2.5 px-3">Claims</th>
                      <th className="text-left py-2.5 px-3">Hallucinated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.slice(0, 20).map((r, idx) => {
                      const rc = RISK_COLOR[r.risk_level] || '#7c3aed';
                      return (
                        <tr key={r.id || idx}
                          className="border-b border-white/5 hover:bg-white/[0.01] transition-all cursor-pointer"
                          onClick={() => navigate('/history')}>
                          <td className="py-3 px-3 text-[#94a3b8]/30 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 text-[#94a3b8]/40 whitespace-nowrap">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-3 text-[#f8fafc] max-w-[180px] truncate font-mono">{r.question}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded-none border border-[#7c3aed]/20">
                              {r.model_used}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold" style={{ color: rc }}>
                            {Math.round(r.overall_score * 100)}%
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border"
                              style={{ color: rc, borderColor: rc + '30', backgroundColor: rc + '10' }}>
                              {r.risk_level}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#94a3b8] font-mono">{r.num_claims}</td>
                          <td className="py-3 px-3 font-mono font-bold text-[#ef4444]">{r.num_hallucinated}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-[#94a3b8]/30 mx-auto mb-3" />
              <p className="text-xs text-[#94a3b8]/50">No verification records available. Run analyses to generate reports.</p>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
