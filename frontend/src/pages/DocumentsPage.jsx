import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Database, Settings, Trash2, ShieldAlert,
  Server, ShieldCheck, Activity, AlertTriangle, ArrowRight, BookOpen, RefreshCw
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { uploadDocument, getSettings, resetSystemDatabase } from '../services/api';

export default function DocumentsPage() {
  const fileRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Load uploaded documents list from localStorage and settings from API
  useEffect(() => {
    const savedDocs = localStorage.getItem('halshield_uploaded_docs');
    if (savedDocs) {
      setDocs(JSON.parse(savedDocs));
    } else {
      // Default sample docs if empty
      const defaults = [
        { id: 101, filename: 'sample_financial_report.pdf', size: 1042452, chunks: 48, status: 'processed', date: '2026-06-08T12:00:00.000Z' },
        { id: 102, filename: 'tesla_annual_wiki.txt', size: 28412, chunks: 8, status: 'processed', date: '2026-06-08T14:30:00.000Z' }
      ];
      setDocs(defaults);
      localStorage.setItem('halshield_uploaded_docs', JSON.stringify(defaults));
    }

    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const res = await uploadDocument(file);
      const newDoc = {
        id: res.data.document_id || Date.now(),
        filename: res.data.filename || file.name,
        size: file.size,
        chunks: res.data.chunk_count || 12,
        status: res.data.status || 'processed',
        date: new Date().toISOString()
      };
      
      const updatedDocs = [newDoc, ...docs.filter(d => d.filename !== newDoc.filename)];
      setDocs(updatedDocs);
      localStorage.setItem('halshield_uploaded_docs', JSON.stringify(updatedDocs));
      setSuccess(`Successfully uploaded and indexed "${newDoc.filename}" into FAISS Vector Store.`);
      
      // Dispatch event to update dashboard/RAG states
      window.dispatchEvent(new CustomEvent('new-document-uploaded'));
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = (id) => {
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated);
    localStorage.setItem('halshield_uploaded_docs', JSON.stringify(updated));
    setSuccess('Document entry removed from local catalog. Note: Reset database below to completely flush FAISS vectors.');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleClearAll = async () => {
    setClearing(true);
    setError('');
    setSuccess('');
    try {
      await resetSystemDatabase();
      setDocs([]);
      localStorage.setItem('halshield_uploaded_docs', JSON.stringify([]));
      setSuccess('System Reset successful: All uploaded documents and vector index databases cleared.');
      setConfirmDeleteAll(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed.');
    } finally {
      setClearing(false);
    }
  };

  const totalSize = docs.reduce((sum, d) => sum + d.size, 0);
  const totalChunks = docs.reduce((sum, d) => sum + d.chunks, 0);

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-1 py-1">
        
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-[#f8fafc] flex items-center gap-2">
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-[#7c3aed]" /> RAG Document Manager
          </h2>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Index custom knowledge bases to verify LLM outputs with facts from reference materials.
          </p>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-none bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-xs sm:text-sm flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-none bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-xs sm:text-sm flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid: Upload + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Upload Card */}
          <GlassCard className="p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-3 uppercase tracking-wider">
                <Upload className="w-4 h-4 text-[#06b6d4]" /> Index New Documents
              </h3>
              <p className="text-xs text-[#94a3b8] mb-5 leading-relaxed">
                Upload raw research files, product sheets, or contract terms. HalShield tokenizes the documents,
                generates vector embeddings, and indexes them in a local FAISS store for context-augmented NLI evaluation.
              </p>
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
              className={`border border-dashed rounded-none p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px]
                ${dragOver ? 'border-[#7c3aed] bg-[#7c3aed]/5' : 'border-white/10 hover:border-white/20 bg-white/[0.01]'}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3 text-xs text-[#94a3b8]">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-[#7c3aed] rounded-full animate-spin" />
                  <span>Uploading & Vectorizing Document Chunks...</span>
                </div>
              ) : (
                <>
                  <FileText className="w-8 h-8 text-[#94a3b8]/40 mb-2 animate-pulse" />
                  <p className="text-xs text-[#f8fafc] font-semibold">Drag & drop files here, or click to browse</p>
                  <p className="text-[10px] text-[#94a3b8]/60 mt-1">Supports PDF, DOCX, TXT files (Max 50MB)</p>
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
          </GlassCard>

          {/* RAG Stats Info */}
          <GlassCard className="p-6 flex flex-col justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">
                <Server className="w-4 h-4 text-[#7c3aed]" /> RAG Parameters
              </h3>
              
              <div className="space-y-4 text-xs font-medium">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#94a3b8]">Total Indexed Files:</span>
                  <span className="font-mono text-[#f8fafc] font-bold">{docs.length}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#94a3b8]">Total Vector Chunks:</span>
                  <span className="font-mono text-[#f8fafc] font-bold">{totalChunks}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#94a3b8]">Chunk Size Limit:</span>
                  <span className="font-mono text-[#06b6d4] font-bold">
                    {settings?.chunk_size ? `${settings.chunk_size} words` : '500 words'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#94a3b8]">Chunk Overlap:</span>
                  <span className="font-mono text-[#facc15] font-bold">
                    {settings?.chunk_overlap ? `${settings.chunk_overlap} words` : '100 words'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#94a3b8]">Top-K Retrieval count:</span>
                  <span className="font-mono text-[#7c3aed] font-bold">
                    {settings?.top_k_results ? `${settings.top_k_results} results` : '5 results'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-none text-[10px] text-[#94a3b8] leading-relaxed mt-4">
              <span className="font-bold text-[#facc15] block mb-0.5">Vector Store Tech</span>
              Embeddings encoded via <span className="font-mono text-[#f8fafc]">all-MiniLM-L6-v2</span>. Matches search queries using inner-product cosine similarity in localized <span className="font-mono text-[#f8fafc]">FAISS</span> indexing tree.
            </div>
          </GlassCard>

        </div>

        {/* Index Table */}
        <GlassCard className="p-6 mb-8 w-full min-w-0">
          <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-[#22c55e]" /> Vector Index Catalog
          </h3>
          {docs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="border-b border-white/10 text-[#94a3b8] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Filename</th>
                    <th className="py-3 px-3 w-28 text-center">Chunks Indexed</th>
                    <th className="py-3 px-3 w-28 text-right">File Size</th>
                    <th className="py-3 px-3 w-32 text-center">Index Status</th>
                    <th className="py-3 px-3 w-36 text-right">Processed Time</th>
                    <th className="py-3 px-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#f8fafc] truncate max-w-xs sm:max-w-md">
                        📄 {d.filename}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#06b6d4]">
                        {d.chunks}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#94a3b8]">
                        {(d.size / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#94a3b8]">
                        {new Date(d.date).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => deleteDocument(d.id)}
                          className="p-1 rounded text-[#94a3b8]/40 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-[#94a3b8]/30 mx-auto mb-3" />
              <p className="text-xs text-[#94a3b8]">No reference documents indexed in the system.</p>
              <p className="text-[10px] text-[#94a3b8]/60 mt-1">Upload a file above to construct a local factual vector context.</p>
            </div>
          )}
        </GlassCard>

        {/* Danger zone */}
        <GlassCard className="p-6 border-l-4 border-l-[#ef4444] bg-[#ef4444]/[0.01]">
          <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#ef4444] mb-3 uppercase tracking-wider">
            <Trash2 className="w-4 h-4" /> Reset Document Database & Vector Indexes
          </h3>
          <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
            Resetting the system will completely clear the local SQLite database logs, remove reference uploads,
            and purge all FAISS vector collections. This action cannot be undone.
          </p>

          {!confirmDeleteAll ? (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="px-4 py-2.5 rounded-none border border-[#ef4444] text-[#ef4444] text-xs font-bold hover:bg-[#ef4444]/10 transition-all cursor-pointer"
            >
              Clear Vector Database
            </button>
          ) : (
            <div className="p-4 rounded-none bg-[#ef4444]/5 border border-[#ef4444]/25 flex flex-wrap gap-4 items-center justify-between">
              <div className="text-xs text-[#ef4444] font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Wipe all index data files and vectors? This resets the entire workspace.</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteAll(false)}
                  className="px-3.5 py-1.5 rounded-none bg-white/5 border border-white/10 text-[#94a3b8] text-xs font-bold hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="px-3.5 py-1.5 rounded-none bg-[#ef4444] text-white text-xs font-bold hover:bg-[#dc2626] transition-all cursor-pointer flex items-center gap-2"
                >
                  {clearing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Wipe FAISS Vectors</span>
                </button>
              </div>
            </div>
          )}
        </GlassCard>

      </div>
    </DashboardLayout>
  );
}
