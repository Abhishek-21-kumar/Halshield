/**
 * HalShield — Dashboard Page.
 * Analytics, history, model comparison, and document uploads.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  LayoutDashboard, TrendingUp, AlertTriangle, FileText,
  Activity, Shield, Clock, Search
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { getDashboardData, getHistory } from '../services/api';

const PIE_COLORS = { low: '#22c55e', medium: '#facc15', high: '#ef4444' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, h] = await Promise.all([getDashboardData(), getHistory()]);
        setData(d.data);
        setHistory(h.data);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: 'Total Analyses', value: data?.total_analyses || 0, icon: Activity, color: '#7c3aed' },
    { label: 'Hallucinations Found', value: data?.total_hallucinations || 0, icon: AlertTriangle, color: '#ef4444' },
    { label: 'Documents Uploaded', value: data?.total_documents || 0, icon: FileText, color: '#06b6d4' },
    { label: 'Avg Risk Score', value: `${Math.round((data?.average_score || 0) * 100)}%`, icon: TrendingUp, color: '#facc15' },
  ];

  const riskData = Object.entries(data?.risk_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const modelData = data?.model_breakdown || [];
  const timeline = data?.timeline || [];

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-1 py-1">
        
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl sm:text-2xl font-black text-[#f8fafc] flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-[#7c3aed]" /> Dashboard Analytics
          </h2>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">Aggregated statistics and verified evaluation history</p>
        </motion.div>

        {/* Responsive Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 w-full">
          {stats.map((s, i) => (
            <GlassCard key={s.label} className="p-5 flex items-center justify-between w-full">
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#f8fafc] font-mono leading-none tracking-tight">
                  {s.value}
                </div>
                <div className="text-[10px] text-[#94a3b8]/60 mt-2.5 font-bold uppercase tracking-wider truncate">
                  {s.label}
                </div>
              </div>
              <div className="w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 w-full">
          
          {/* Timeline Chart Container */}
          <GlassCard className="p-4 sm:p-6 lg:col-span-2 w-full min-w-0">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[#7c3aed]" /> Risk Trend Timeline
            </h3>
            {timeline.length > 0 ? (
              <div className="w-full h-[220px] text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} domain={[0, 1]} />
                    <Tooltip contentStyle={{ background: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                    <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 4 }} activeDot={{ r: 6, fill: '#a78bfa' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-[#94a3b8]/40">
                No evaluations recorded yet. Run your first analysis to plot timelines.
              </div>
            )}
          </GlassCard>

          {/* Risk Pie distribution */}
          <GlassCard className="p-4 sm:p-6 w-full min-w-0">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-[#06b6d4]" /> Risk Classification
            </h3>
            {riskData.length > 0 ? (
              <div className="w-full h-[180px] text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                      {riskData.map((entry) => (
                        <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#7c3aed'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-[#94a3b8]/40">
                No risk data available
              </div>
            )}
            <div className="flex justify-center flex-wrap gap-4 mt-2">
              {Object.entries(PIE_COLORS).map(([k, c]) => (
                <div key={k} className="flex items-center gap-1.5 text-[10px] font-bold text-[#94a3b8] uppercase">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  <span>{k}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Model breakdowns bar chart */}
        {modelData.length > 0 && (
          <GlassCard className="p-4 sm:p-6 mb-8 w-full min-w-0">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-[#a78bfa]" /> LLM Usage Breakdown
            </h3>
            <div className="w-full h-[180px] text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="model" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {/* Quick History List */}
        <GlassCard className="p-4 sm:p-6 w-full min-w-0">
          <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#facc15]" /> Recent Audit History
          </h3>
          {history.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="w-full text-[11px] sm:text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-secondary/55 font-bold uppercase tracking-wider">
                      <th className="text-left py-2.5 px-3">Date</th>
                      <th className="text-left py-2.5 px-3">Prompt Context</th>
                      <th className="text-left py-2.5 px-3">Model</th>
                      <th className="text-left py-2.5 px-3">Risk %</th>
                      <th className="text-left py-2.5 px-3">Status</th>
                      <th className="text-left py-2.5 px-3">Claims</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 5).map((r) => (
                      <tr key={r.id} className="border-b border-border hover:bg-surface transition-all">
                        <td className="py-3 px-3 text-text-secondary/40 whitespace-nowrap">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-3 text-text-primary max-w-[150px] truncate font-mono">
                          {r.question}
                        </td>
                        <td className="py-3 px-3 text-text-secondary font-bold">{r.model_used}</td>
                        <td className="py-3 px-3 font-mono font-bold" style={{ color: r.overall_score < 0.3 ? '#22c55e' : r.overall_score < 0.6 ? '#facc15' : '#ef4444' }}>
                          {Math.round(r.overall_score * 100)}%
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border"
                            style={{
                              color: PIE_COLORS[r.risk_level] || '#7c3aed',
                              borderColor: (PIE_COLORS[r.risk_level] || '#7c3aed') + '30',
                              background: (PIE_COLORS[r.risk_level] || '#7c3aed') + '10'
                            }}
                          >
                            {r.risk_level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#94a3b8]/60 font-mono">{r.num_claims} total</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-[#94a3b8]/40">
              No analyses audited yet. Submit a verification request to log history.
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
