/**
 * HalShield — Redesigned NLI Verification Workspace matching reference image.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Upload, FileText, Sparkles, Zap, X, CheckCircle,
  Shield, AlertTriangle, HelpCircle, BookOpen, Activity,
  TrendingUp, Brain, Eye, Cpu, Info, ArrowRight, CornerDownRight,
  Copy, Share2, Download, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { analyze, uploadDocument, getSettings } from '../services/api';

const LLM_MODELS = [
  { value: 'GPT', label: 'GPT-4', icon: '🟢', desc: 'OpenAI' },
  { value: 'Llama', label: 'Llama 3', icon: '🟣', desc: 'Meta' },
  { value: 'Gemini', label: 'Gemini 1.5', icon: '🔵', desc: 'Google' },
  { value: 'Mistral', label: 'Mistral Large', icon: '🟠', desc: 'Mistral AI' },
];

const COLORS = {
  SUPPORTED: { bg: 'rgba(34,197,94,0.1)', border: '#22c55e', text: '#22c55e' },
  HALLUCINATED: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#ef4444' },
  UNCERTAIN: { bg: 'rgba(250,204,21,0.1)', border: '#facc15', text: '#facc15' },
};

const MOCK_FRANCE_DEMO = [
  {
    model_used: 'GPT-4',
    overall_score: 0.82,
    risk_level: 'high',
    num_claims: 4,
    num_supported: 1,
    num_uncertain: 2,
    num_hallucinated: 1,
    claims: [
      {
        index: 0,
        text: 'The capital of France is Berlin.',
        label: 'HALLUCINATED',
        hallucination_score: 0.92,
        color: 'red',
        explanation: 'Paris is the capital and most populous city of France, contradicting the claim that it is Berlin.',
        evidence_source: 'France_Travel_Guide.pdf (p.1)',
        nli_scores: { entailment: 0.05, neutral: 0.03, contradiction: 0.92 }
      },
      {
        index: 1,
        text: 'It is the largest city in Germany',
        label: 'SUPPORTED',
        hallucination_score: 0.16,
        color: 'green',
        explanation: 'Berlin is the capital and largest city of Germany by both area and population.',
        evidence_source: 'France_Travel_Guide.pdf (p.2)',
        nli_scores: { entailment: 0.84, neutral: 0.10, contradiction: 0.06 }
      },
      {
        index: 2,
        text: 'and known for its rich history,',
        label: 'UNCERTAIN',
        hallucination_score: 0.55,
        color: 'yellow',
        explanation: 'Subjective descriptive statement. No strong matching vector chunk retrieved from context files.',
        evidence_source: 'No strong match found',
        nli_scores: { entailment: 0.30, neutral: 0.55, contradiction: 0.15 }
      },
      {
        index: 3,
        text: 'architecture, and cultural diversity.',
        label: 'UNCERTAIN',
        hallucination_score: 0.48,
        color: 'yellow',
        explanation: 'Subjective descriptive statement. No strong matching vector chunk retrieved from context files.',
        evidence_source: 'No strong match found',
        nli_scores: { entailment: 0.35, neutral: 0.48, contradiction: 0.17 }
      }
    ],
    rag_chunks: [
      { source: 'France_Travel_Guide.pdf', score: 0.93, page: 1, text: 'Paris is the capital and most populous city of France...' },
      { source: 'Encyclopedia_France.pdf', score: 0.87, page: 3, text: 'France is a country whose capital is Paris...' },
      { source: 'World_Geography.txt', score: 0.76, text: 'France is located in Western Europe...' }
    ]
  }
];

// Circular SVG Progress Ring Gauge
function CircularGauge({ score, title, color, subtitle, size = 120 }) {
  const pct = Math.round(score * 100);
  const r = (size / 2) - 10;
  const c = 2 * Math.PI * r;
  const strokeOffset = c * (1 - score);

  return (
    <div className="flex flex-col items-center select-none py-1">
      <div className="text-[11px] font-bold text-[#94a3b8]/60 mb-2 uppercase tracking-wide">
        {title}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
          <circle 
            cx={size/2} 
            cy={size/2} 
            r={r} 
            fill="none" 
            stroke={color} 
            strokeWidth="7" 
            strokeLinecap="round"
            strokeDasharray={c} 
            strokeDashoffset={strokeOffset} 
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color}55)` }} 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-black font-mono tracking-tight text-[#f8fafc]">
            {pct}%
          </span>
          <span className="text-[10px] font-extrabold uppercase mt-0.5" style={{ color }}>
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MainPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  
  // Default values set to match screenshot demo
  const [question, setQuestion] = useState('What is the capital of France?');
  const [answer, setAnswer] = useState('The capital of France is Berlin. It is the largest city in Germany and known for its rich history, architecture, and cultural diversity.');
  const [selectedModels, setSelectedModels] = useState(['GPT']);
  const [file, setFile] = useState({ name: 'France_Travel_Guide.pdf', size: 2411724 });
  const [fileUploaded, setFileUploaded] = useState(true);
  const [uploadedDocId, setUploadedDocId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [sysSettings, setSysSettings] = useState(null);

  // Live results initialized to France demo
  const [liveResults, setLiveResults] = useState(MOCK_FRANCE_DEMO);
  const [activeModelTab, setActiveModelTab] = useState(0);
  const [selectedClaim, setSelectedClaim] = useState(0);
  
  // Sentence list expand state
  const [expandedClaim, setExpandedClaim] = useState(null);



  // Fetch settings parameters
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        setSysSettings(res.data);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();

    // Persist initial demo data so Detailed Analysis page works from sidebar
    if (!localStorage.getItem('halshield_last_results')) {
      try {
        localStorage.setItem('halshield_last_results', JSON.stringify({
          results: MOCK_FRANCE_DEMO,
          question: 'What is the capital of France?',
          answer: 'The capital of France is Berlin. It is the largest city in Germany and known for its rich history, architecture, and cultural diversity.',
          models: ['GPT']
        }));
      } catch(e) {}
    }
  }, []);

  // Custom event listener for "New Analysis"
  useEffect(() => {
    const handleNewAnalysis = () => {
      setQuestion('');
      setAnswer('');
      setFile(null);
      setFileUploaded(false);
      setUploadedDocId(null);
      setLiveResults(null);
      setError('');
      setSelectedClaim(0);
      setExpandedClaim(null);
    };
    window.addEventListener('new-analysis', handleNewAnalysis);
    return () => window.removeEventListener('new-analysis', handleNewAnalysis);
  }, []);

  const handleFileSelect = async (f) => {
    if (!f) return;
    setFile(f);
    setUploading(true);
    setError('');
    try {
      const res = await uploadDocument(f);
      setUploadedDocId(res.data.document_id);
      setFileUploaded(true);
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.detail || err.message));
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const toggleModel = (val) => {
    if (selectedModels.includes(val)) {
      if (selectedModels.length > 1) setSelectedModels(selectedModels.filter(m => m !== val));
    } else {
      setSelectedModels([...selectedModels, val]);
    }
  };

  const handleAnalyze = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Please provide both a question and an LLM response.');
      return;
    }
    setLoading(true);
    setError('');
    setLiveResults(null);
    setExpandedClaim(null);
    try {
      const promises = selectedModels.map(m =>
        analyze({ question: question.trim(), answer: answer.trim(), model: m, document_id: uploadedDocId })
      );
      const responses = await Promise.all(promises);
      const data = responses.map(r => r.data);
      setLiveResults(data);
      setActiveModelTab(0);
      setSelectedClaim(0);
      // Persist results for Detailed Analysis page access via sidebar
      try { localStorage.setItem('halshield_last_results', JSON.stringify({ results: data, question: question.trim(), answer: answer.trim(), models: selectedModels })); } catch(e) {}
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const openFullResults = () => {
    if (liveResults) {
      navigate('/results', { state: { results: liveResults, question, answer, models: selectedModels } });
    }
  };

  const handleCopyAnalysis = () => {
    if (!activeResult) return;
    const summaryText = `HalShield Verification Report\nQuestion: ${question}\nRisk Score: ${Math.round(activeResult.overall_score * 100)}%\nRisk Level: ${activeResult.risk_level.toUpperCase()}\nClaims: ${activeResult.num_claims} total (${activeResult.num_supported} supported, ${activeResult.num_hallucinated} hallucinated)`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareResults = () => {
    if (!activeResult) return;
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!liveResults) return;
    const blob = new Blob([JSON.stringify(liveResults, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `halshield_report_${Date.now()}.json`;
    a.click();
  };

  const activeResult = liveResults?.[activeModelTab];
  const claims = activeResult?.claims || [];
  const activeClaim = claims[selectedClaim] || null;



  // Stacked distribution bar percentages
  const totalClaims = activeResult?.num_claims || 1;
  const pctSupported = activeResult ? ((activeResult.num_supported || 0) / totalClaims) * 100 : 0;
  const pctUncertain = activeResult ? ((activeResult.num_uncertain || 0) / totalClaims) * 100 : 0;
  const pctContradicted = activeResult ? ((activeResult.num_hallucinated || 0) / totalClaims) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 flex flex-col gap-6">

        {/* ─── Main Workspace Grid (65% Center | 35% Right) ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-[65%_35%] gap-6 w-full min-w-0">

          {/* ═══ CENTER ANALYSIS WORKSPACE (55% / 65% width) ═══ */}
          <div className="flex flex-col gap-6 min-w-0">
            
            {/* 1 INPUT SECTION */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-[11px] font-black">
                  1
                </span>
                <span className="font-extrabold text-[12.5px] text-[#f8fafc] uppercase tracking-wider">
                  Input Section
                </span>
              </div>

              <GlassCard className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column inputs */}
                  <div className="flex flex-col gap-5">
                    
                    {/* Prompt/Question */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#94a3b8]">
                        <span>Question / Prompt</span>
                        <HelpCircle className="w-3.5 h-3.5 text-[#94a3b8]/40" />
                      </div>
                      <div className="relative">
                        <textarea
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="What prompt or query did you send to the LLM?"
                          rows={3}
                          className="glass-input px-3.5 py-2.5 text-xs font-mono placeholder-[#94a3b8]/20 min-h-[76px] leading-relaxed resize-y"
                        />
                        <span className="absolute bottom-1.5 right-2 text-[9px] font-mono text-[#94a3b8]/30">
                          {question.length}/2000
                        </span>
                      </div>
                    </div>

                    {/* LLM Response */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#94a3b8]">
                        <Zap className="w-3.5 h-3.5 text-[#facc15]" />
                        <span>LLM Response to Verify</span>
                      </div>
                      <div className="relative">
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Paste LLM output response claims to audit..."
                          rows={6}
                          className="glass-input px-3.5 py-2.5 text-xs font-mono placeholder-[#94a3b8]/20 min-h-[140px] leading-relaxed resize-y"
                        />
                        <span className="absolute bottom-1.5 right-2 text-[9px] font-mono text-[#94a3b8]/30">
                          {answer.length}/8000
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Right Column configs */}
                  <div className="flex flex-col gap-5 justify-between">
                    
                    {/* Reference Document */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#94a3b8]">
                        <span>Reference Document (Optional)</span>
                        <Info className="w-3.5 h-3.5 text-[#94a3b8]/40" />
                      </div>
                      
                      <div
                        onClick={() => fileRef.current?.click()}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
                        }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        className={`border border-dashed rounded-none p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[100px]
                          ${dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-border-light bg-surface'}`}
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center gap-2 text-[10px] text-text-secondary/60">
                            <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                            <span>Parsing context files...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-text-secondary/40 mb-1" />
                            <p className="text-[10px] text-text-primary font-semibold">Drag & drop your file here</p>
                            <p className="text-[9.5px] text-[#94a3b8]/40 mt-0.5">or click to browse</p>
                            <p className="text-[8.5px] text-[#94a3b8]/30 mt-0.5 font-bold">Supports PDF, DOCX, TXT (Max 50MB)</p>
                          </>
                        )}
                        <input
                          ref={fileRef}
                          type="file"
                          accept=".pdf,.docx,.txt"
                          className="hidden"
                          onChange={(e) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); }}
                        />
                      </div>

                      {/* Uploaded File Badge style */}
                      {fileUploaded && file && (
                        <div className="flex items-center justify-between p-2 rounded-none bg-box-subtle border border-border mt-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-text-primary font-bold truncate max-w-[150px]">{file.name}</span>
                              <span className="text-[9px] text-text-secondary/40">PDF • {(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                            <button
                              onClick={() => {
                                setFile(null);
                                setFileUploaded(false);
                                setUploadedDocId(null);
                              }}
                              className="text-white/20 hover:text-white/50 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Model Selector Grid */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#94a3b8]">
                        <span>Select LLM Model(s)</span>
                        <Info className="w-3.5 h-3.5 text-[#94a3b8]/40" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {LLM_MODELS.map((m) => {
                          const isSel = selectedModels.includes(m.value);
                          return (
                            <button
                              key={m.value}
                              type="button"
                              onClick={() => toggleModel(m.value)}
                              className={`flex items-center gap-2 p-2 rounded-none text-[11px] font-bold transition-all border text-left cursor-pointer
                                ${isSel
                                  ? 'border-accent/50 bg-accent/10 text-text-primary shadow-sm'
                                  : 'border-border text-text-secondary/50 hover:border-border-light'}`}
                            >
                              <span className="text-xs">{m.icon}</span>
                              <div className="leading-tight">
                                <div className="text-[10px]">{m.label}</div>
                                <div className="text-[8.5px] text-[#94a3b8]/30 font-normal">{m.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-none bg-red-500/10 border border-red-500/40 text-red-400 text-xs flex items-center gap-2 mt-4 font-mono">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Analyze button at card bottom */}
                <div className="border-t border-border pt-4 mt-5">
                  <motion.button
                    onClick={handleAnalyze}
                    disabled={loading || !question.trim() || !answer.trim()}
                    whileHover={!(loading || !question.trim() || !answer.trim()) ? { y: -1 } : undefined}
                    whileTap={!(loading || !question.trim() || !answer.trim()) ? { scale: 0.99 } : undefined}
                    className={`
                      w-full py-3 rounded-none font-extrabold text-[12.5px] text-white
                      flex items-center justify-center gap-2 transition-all cursor-pointer relative overflow-hidden select-none
                      ${(loading || !question.trim() || !answer.trim())
                        ? 'opacity-40 bg-surface border border-border text-text-secondary/30 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#7c3aed] via-[#9061f9] to-[#06b6d4] shadow-[0_4px_25px_rgba(124,58,237,0.25)]'
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Verifying Hallucinations...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze Hallucinations</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </GlassCard>
            </div>

            {/* 2 SENTENCE-LEVEL ANALYSIS */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-[11px] font-black">
                  2
                </span>
                <span className="font-extrabold text-[12.5px] text-[#f8fafc] uppercase tracking-wider">
                  Sentence-Level Analysis
                </span>
              </div>

              <GlassCard className="p-4 flex flex-col gap-2">
                {!loading && !activeResult ? (
                  <div className="p-8 text-center text-xs text-text-secondary/40">
                    No active analysis results. Run an analysis above.
                  </div>
                ) : loading ? (
                  <div className="space-y-3 p-4">
                    <div className="h-5 skeleton" />
                    <div className="h-5 skeleton w-5/6" />
                  </div>
                ) : (
                  claims.map((claim, idx) => {
                     const cfg = COLORS[claim.label] || COLORS.UNCERTAIN;
                     const isExpanded = expandedClaim === idx;
                     
                     return (
                       <div key={idx} className="border border-border rounded-none bg-box-subtle overflow-hidden">
                         <div 
                           onClick={() => {
                             setExpandedClaim(isExpanded ? null : idx);
                             setSelectedClaim(idx);
                           }}
                           className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-surface transition-colors"
                         >
                           <div className="flex items-center gap-3.5 min-w-0">
                             {/* Ring number badge */}
                             <span 
                               className="w-6 h-6 rounded-full border flex items-center justify-center text-[10.5px] font-black font-mono flex-shrink-0"
                               style={{ color: cfg.text, borderColor: cfg.border }}
                             >
                               {idx + 1}
                             </span>
                             
                             <span className="text-xs font-semibold text-text-primary truncate pr-2">
                               {claim.text}
                             </span>
                           </div>

                           <div className="flex items-center gap-3 flex-shrink-0">
                             <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border"
                               style={{ color: cfg.text, borderColor: `${cfg.border}22`, backgroundColor: cfg.bg }}>
                               {claim.label}
                             </span>
                             <span className="font-mono text-xs font-bold text-text-secondary/60 w-8 text-right">
                               {(claim.hallucination_score).toFixed(2)}
                             </span>
                             {isExpanded ? <ChevronUp className="w-4 h-4 text-text-secondary/40" /> : <ChevronDown className="w-4 h-4 text-text-secondary/40" />}
                           </div>
                         </div>

                         {/* Expanded details */}
                         <AnimatePresence>
                           {isExpanded && (
                             <motion.div
                               initial={{ height: 0 }}
                               animate={{ height: 'auto' }}
                               exit={{ height: 0 }}
                               className="border-t border-border bg-box-darker text-[11px] leading-relaxed text-text-secondary/80 px-4 py-3.5 space-y-2"
                             >
                               <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#facc15]">
                                 <Info className="w-3.5 h-3.5" />
                                 <span>Verification Detail Reasoning</span>
                               </div>
                               <p className="font-mono text-text-primary/70">"{claim.explanation}"</p>
                               <div className="text-[10px] font-mono text-[#06b6d4] mt-1.5 font-bold">
                                 Grounded Source: {claim.evidence_source}
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                     );
                   })
                 )}
               </GlassCard>
            </div>



          </div>

          {/* ═══ RIGHT LIVE VERIFICATION PANEL (30% / 65% width) ═══ */}
          <div className="flex flex-col gap-6 min-w-0">
            <GlassCard className="p-6 flex flex-col gap-5 justify-between">
              
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 border-b border-border pb-3.5 mb-4">
                  <Shield className="w-4 h-4 text-[#06b6d4]" />
                  <span className="font-extrabold text-[12.5px] text-text-primary uppercase tracking-wider">
                    Live Verification Panel
                  </span>
                </div>

                {/* Gauges Side by Side */}
                {activeResult && (
                  <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
                    <CircularGauge 
                      title="Hallucination Score" 
                      score={activeResult.overall_score} 
                      color="#ef4444" 
                      subtitle="High Risk" 
                    />
                    <CircularGauge 
                      title="Confidence Score" 
                      score={1 - activeResult.overall_score} 
                      color="#22c55e" 
                      subtitle="Good" 
                    />
                  </div>
                )}

                {/* Risk & NLI Cards row */}
                {activeResult && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {/* Risk Level card */}
                    <div className="p-3.5 rounded-none border border-border bg-box-subtle flex flex-col gap-1 select-none">
                      <div className="text-[8.5px] font-extrabold uppercase text-text-secondary/40 tracking-wider">Risk Level</div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-[#ef4444]/30 text-[#ef4444] bg-[#ef4444]/10 w-fit mt-1">
                        🔴 High Risk
                      </span>
                      <div className="text-[9.5px] text-text-secondary/50 mt-1 font-semibold">High probability of hallucination detected.</div>
                    </div>

                    {/* NLI Overall card */}
                    <div className="p-3.5 rounded-none border border-border bg-box-subtle flex flex-col gap-1 select-none">
                      <div className="text-[8.5px] font-extrabold uppercase text-text-secondary/40 tracking-wider">NLI Overall Result</div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-[#ef4444]/30 text-[#ef4444] bg-[#ef4444]/10 w-fit mt-1">
                        CONTRADICTION
                      </span>
                      <div className="text-[9.5px] text-text-secondary/50 mt-1 font-semibold">Model strongly contradicts the claim.</div>
                    </div>
                  </div>
                )}

                {/* Claim Distribution Bar */}
                {activeResult && (
                  <div className="flex flex-col gap-2 mt-4 select-none">
                    <div className="text-[10px] font-extrabold uppercase tracking-wide text-text-secondary/50">
                      Claim Status Distribution
                    </div>
                    {/* Stacked bar */}
                    <div className="h-2 w-full rounded-full bg-surface overflow-hidden flex">
                      <div className="h-full bg-[#22c55e]" style={{ width: `${pctSupported}%` }} />
                      <div className="h-full bg-[#facc15]" style={{ width: `${pctUncertain}%` }} />
                      <div className="h-full bg-[#ef4444]" style={{ width: `${pctContradicted}%` }} />
                    </div>
                    {/* Labels below */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary/50 mt-0.5">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />{activeResult.num_supported} Supported ({Math.round(pctSupported)}%)</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />{activeResult.num_uncertain} Unverified ({Math.round(pctUncertain)}%)</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />{activeResult.num_hallucinated} Contradicted ({Math.round(pctContradicted)}%)</span>
                    </div>
                  </div>
                )}

                {/* Verification Details list */}
                {activeResult && (
                  <div className="p-4 rounded-none border border-border bg-box-subtle mt-5">
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-text-secondary uppercase tracking-wider mb-3">
                      <span>Verification Details</span>
                    </div>
                    <div className="space-y-2 text-[11px] font-semibold text-text-secondary">
                      <div className="flex justify-between border-b border-border pb-1">
                        <span>NLI Model</span><span className="font-mono text-text-primary">DeBERTa-v3-Large</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1">
                        <span>RAG Retrieval</span><span className="font-mono text-text-primary">FAISS (Top-5)</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1">
                        <span>Chunking</span><span className="font-mono text-text-primary">Recursive Character</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1">
                        <span>Similarity Threshold</span><span className="font-mono text-text-primary">{sysSettings?.hallucination_threshold || '0.75'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Analysis Time</span><span className="font-mono text-[#facc15]">4.2s</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4 TOP RETRIEVED SOURCES */}
                {activeResult && (
                  <div className="flex flex-col gap-3 mt-6">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-[11px] font-black">
                        4
                      </span>
                      <span className="font-extrabold text-[12.5px] text-text-primary uppercase tracking-wider">
                        Top Retrieved Sources
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {activeResult.rag_chunks.map((c, i) => {
                        const isPdf = c.source.endsWith('.pdf');
                        return (
                          <div key={i} className="p-3.5 rounded-none bg-box-subtle border border-border text-[11px] flex flex-col gap-1 leading-normal font-sans">
                            <div className="flex items-center justify-between font-mono mb-1 text-[10px] font-bold">
                              <span className="text-text-primary font-black flex items-center gap-1.5">
                                <FileText className={`w-3.5 h-3.5 ${isPdf ? 'text-[#ef4444]' : 'text-[#06b6d4]'}`} />
                                {c.source}
                              </span>
                              <span className="text-text-secondary/50">
                                {c.page ? `Page ${c.page} • ` : ''}Score: {c.score}
                              </span>
                            </div>
                            <p className="text-text-secondary italic">"{c.text}"</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons Row */}
              <div className="border-t border-border pt-4 mt-6 flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleShareResults}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-none text-[11px] font-bold border border-border hover:border-border-light text-text-primary bg-surface hover:bg-surface-solid transition-all cursor-pointer"
                  >
                    {shared ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{shared ? 'Shared' : 'Share Results'}</span>
                  </button>

                  <button
                    onClick={handleCopyAnalysis}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-none text-[11px] font-bold border border-border hover:border-border-light text-text-primary bg-surface hover:bg-surface-solid transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Analysis'}</span>
                  </button>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-none text-[11px] font-extrabold text-[#a78bfa] border border-[#7c3aed]/40 bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report</span>
                </button>
              </div>

            </GlassCard>
          </div>

        </div>

        {/* Footer */}
        <footer className="text-center text-[10px] text-[#94a3b8]/30 py-4 font-mono">
          © 2025 HalShield AI • All rights reserved.
        </footer>

      </div>
    </DashboardLayout>
  );
}
