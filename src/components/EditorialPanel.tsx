import React, { useState, useEffect } from "react";
import { 
  X, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Briefcase, 
  Activity, 
  User, 
  Trash2, 
  Check, 
  HelpCircle,
  Clock,
  ShieldAlert
} from "lucide-react";
import { InstagramPost, EditorialNote } from "../types";
import { firestoreService } from "../firebase";

interface EditorialPanelProps {
  post: InstagramPost;
  onClose: () => void;
  currUser: any;
  currSimEditor: { id: string; name: string; email: string } | null;
}

export const EditorialPanel: React.FC<EditorialPanelProps> = ({
  post,
  onClose,
  currUser,
  currSimEditor
}) => {
  const [notes, setNotes] = useState<EditorialNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const activeUserId = currUser?.uid || currSimEditor?.id || "";
  const activeUsername = currUser?.displayName || currSimEditor?.name || "Editor Beritajatim";
  const activeEmail = currUser?.email || currSimEditor?.email || "";

  // 1. Subscribe to real-time notes for this post
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      unsubscribe = await firestoreService.getNotesAndSync(post.id, (notesList) => {
        setNotes(notesList);
      });
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [post.id]);

  // 2. Add an editorial note/comment
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeUserId) return;

    setIsSubmittingNote(true);
    try {
      const noteId = `note_${Date.now()}`;
      await firestoreService.addNote(post.id, noteId, {
        id: noteId,
        postId: post.id,
        userId: activeUserId,
        username: activeUsername,
        userEmail: activeEmail,
        content: newNoteContent.trim(),
        createdAt: new Date().toISOString()
      });
      setNewNoteContent("");
    } catch (err) {
      console.error("Gagal menambahkan catatan redaksi:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // 3. Delete note
  const handleDeleteNote = async (noteId: string) => {
    try {
      await firestoreService.deleteNote(post.id, noteId);
    } catch (err) {
      console.error("Gagal menghapus catatan redaksi:", err);
    }
  };

  // 4. Update statusEvaluasi
  const handleStatusChange = async (newStatus: any) => {
    try {
      await firestoreService.updatePost(post.id, {
        statusEvaluasi: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Gagal memperbarui status post:", err);
    }
  };

  // 5. Toggle verification status
  const handleToggleVerified = async () => {
    try {
      await firestoreService.updatePost(post.id, {
        verified: !post.verified,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Gagal memperbarui status verifikasi:", err);
    }
  };

  // 6. Invoke Server-Side Gemini Content Evaluation for Redaksi
  const handleAiEvaluation = async () => {
    setIsEvaluatingAi(true);
    setEvaluationError("");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: post.caption,
          category: post.category,
          likes: post.likes,
          comments: post.comments
         })
      });

      if (!res.ok) {
        throw new Error("Respons server evaluasi tidak berhasil.");
      }

      const data = await res.json();
      
      // Update the post with Gemini results directly in Firestore
      await firestoreService.updatePost(post.id, {
        integritasScore: data.integritasScore,
        analisisVerifikasi: data.analisisVerifikasi,
        saranTindakLanjut: data.saranTindakLanjut,
        statusSensasional: data.statusSensasional,
        statusEvaluasi: data.integritasScore < 75 ? "Perlu Verifikasi" : post.statusEvaluasi,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Kesalahan evaluasi jurnalisme AI:", err);
      setEvaluationError(err.message || "Gagal mendapat respons analitis AI.");
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  return (
    <div id={`editorial-panel-${post.id}`} className="bg-white rounded-none border border-black/15 shadow-md divide-y divide-black/10 overflow-hidden h-full flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 bg-[#1A1A1A] text-white flex items-center justify-between border-b-2 border-[#C41E3A]">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-[#C41E3A]" />
          <div>
            <h4 className="text-xs uppercase font-bold tracking-widest font-mono text-white">Ruang Evaluasi Berita</h4>
            <p className="text-[9px] text-white/50 font-mono font-bold uppercase">{post.id}</p>
          </div>
        </div>
        <button 
          id="btn-close-editorial"
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-none text-white/75 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content Area: Split in details list and notes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* Caption & Metadata */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-2">
            <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-none">
              {post.category}
            </span>
            <span className="text-[10px] text-black/40 font-mono font-bold">
              EST. JANGKAUAN: {post.views.toLocaleString()}
            </span>
          </div>
          
          <div className="relative pl-4 border-l-2 border-[#C41E3A]">
            <p className="text-xs text-slate-800 leading-relaxed font-serif italic">
              "{post.caption}"
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 border border-black/5 font-mono text-[10px]">
            <div className="border-r border-black/5 py-1">
              <span className="text-black/40 uppercase block text-[8px] font-bold">Likes</span>
              <span className="font-bold text-slate-800 text-xs">{post.likes}</span>
            </div>
            <div className="border-r border-black/5 py-1">
              <span className="text-black/40 uppercase block text-[8px] font-bold">Komentar</span>
              <span className="font-bold text-slate-800 text-xs">{post.comments}</span>
            </div>
            <div className="py-1">
              <span className="text-black/40 uppercase block text-[8px] font-bold">Keterlibatan</span>
              <span className="font-bold text-[#C41E3A] text-xs">{post.engagementRate}%</span>
            </div>
          </div>
        </div>

        {/* Operational Status Selectors */}
        <div className="grid grid-cols-2 gap-3 bg-[#FBFBFA] border border-black/10 rounded-none p-3">
          <div>
            <label className="block text-[8px] font-bold text-black/50 uppercase tracking-widest font-mono mb-1">Status Evaluasi</label>
            <select
              id="select-eval-status"
              value={post.statusEvaluasi}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs w-full p-2 bg-white border border-black/10 rounded-none font-sans focus:outline-none focus:border-[#C41E3A] text-slate-850 font-bold"
            >
              <option value="Belum Dievaluasi">Belum Dievaluasi</option>
              <option value="Perlu Verifikasi">Perlu Verifikasi</option>
              <option value="Layak Tayang">Layak Tayang</option>
              <option value="Sensasional">Sensasional (Remis)</option>
              <option value="Arsip">Arsip Redaksi</option>
            </select>
          </div>
          <div>
            <label className="block text-[8px] font-bold text-black/50 uppercase tracking-widest font-mono mb-1">Disiplin Jurnalistik</label>
            <button
              id="btn-toggle-verified"
              onClick={handleToggleVerified}
              className={`text-[9px] uppercase tracking-wider font-mono font-bold w-full p-2.5 border rounded-none cursor-pointer leading-none flex items-center justify-center gap-1.5 transition-all text-center h-[34px] ${
                post.verified 
                  ? "bg-emerald-50 border-emerald-500/20 text-emerald-800 hover:bg-emerald-100" 
                  : "bg-red-50 border-[#C41E3A]/20 text-[#C41E3A] hover:bg-red-100"
              }`}
            >
              {post.verified ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Verified ✓</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-[#C41E3A]" />
                  <span>Unverified</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Gemini AI Editorial Assistant */}
        <div className="border border-amber-800/10 bg-[#FAF6EE] rounded-none p-4.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-amber-800" />
              <div>
                <h5 className="text-xs font-serif font-bold text-amber-950">Disiplin Cek AI (Gemini)</h5>
                <p className="text-[9px] uppercase tracking-wider font-bold text-amber-700/70 font-mono">Verifikasi Kredibilitas</p>
              </div>
            </div>
            
            <button
              id="btn-trigger-ai"
              onClick={handleAiEvaluation}
              disabled={isEvaluatingAi}
              className="text-[9px] font-mono uppercase tracking-widest px-3 py-2 bg-black hover:bg-[#C41E3A] text-white rounded-none font-bold transition-colors disabled:bg-slate-300 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isEvaluatingAi ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Evaluasi</span>
                </>
              )}
            </button>
          </div>

          {evaluationError && (
            <p className="text-[10px] text-[#C41E3A] font-bold font-mono">
              Error: {evaluationError}
            </p>
          )}

          {post.integritasScore !== undefined ? (
            <div className="space-y-3.5 pt-3 border-t border-amber-800/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-amber-950/70 font-bold uppercase tracking-wider text-[9px] font-mono">Index Akurasi:</span>
                <span className={`px-2 py-0.5 rounded-none text-[10px] font-mono font-bold ${
                  post.integritasScore >= 85 
                    ? "bg-emerald-100 text-emerald-800" 
                    : post.integritasScore >= 70 
                    ? "bg-yellow-150 bg-yellow-55 border border-yellow-200 text-yellow-800"
                    : "bg-red-100 text-[#C41E3A]"
                }`}>
                  {post.integritasScore}/100
                </span>
              </div>

              {post.statusSensasional && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-950/70 font-bold uppercase tracking-wider text-[9px] font-mono">Tone Gaya Bahasa:</span>
                  <span className="font-extrabold text-slate-900 font-sans">{post.statusSensasional}</span>
                </div>
              )}

              <div className="space-y-1 bg-white p-3 rounded-none border border-black/5">
                <span className="text-[9px] font-mono font-bold text-amber-900 uppercase tracking-widest block">ANALISIS CAPTION &amp; BIAS:</span>
                <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                  {post.analisisVerifikasi}
                </p>
              </div>

              <div className="space-y-1 bg-white p-3 rounded-none border border-black/5">
                <span className="text-[9px] font-mono font-bold text-emerald-850 text-emerald-800 uppercase tracking-widest block">SARAN TINDAK LANJUT PELIPUTAN:</span>
                <p className="text-[11px] text-slate-705 text-slate-700 leading-relaxed font-sans">
                  {post.saranTindakLanjut}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 bg-white p-3.5 rounded-none border border-dashed border-black/15 text-center font-sans font-light leading-relaxed">
              Tim redaksi memegang teguh akurasi independen. Gunakan evaluasi AI Gemini untuk mengukur skor integritas naskah secara objektif sebelum dideliver untuk cetak liputan investigasi.
            </div>
          )}
        </div>

        {/* Real-time Collaboration Notes / Discuss Sub-panel */}
        <div className="space-y-3.5 pt-1">
          <div className="flex items-center space-x-2 border-b border-black/5 pb-2">
            <MessageSquare className="h-4 w-4 text-black/55" />
            <h5 className="text-[10px] uppercase font-bold tracking-wider font-mono text-black/50">Evaluasi Ruang Siber ({notes.length})</h5>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {notes.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-4 font-serif italic">
                Belum ada tim mencatat diskusi. Berikan catatan redaksi tim liputan di bawah.
              </p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="p-3 bg-slate-50 rounded-none border border-black/5 space-y-1 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                      <User className="h-3 w-3 text-black/40" />
                      <span className="font-extrabold">{note.username}</span> 
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#A1A1A1]">
                      <span>
                        {new Date(note.createdAt).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })} WIB
                      </span>
                      {activeUserId === note.userId && (
                        <button
                          id={`delete-note-${note.id}`}
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-0.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus Tanggapan"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap font-light">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Note Input Box */}
      {activeUserId ? (
        <form onSubmit={handleAddNote} className="p-3 bg-slate-50/50 flex gap-2 border-t border-black/10">
          <input
            id="input-new-note"
            type="text"
            required
            placeholder="Tulis tanggapan / perintah investigasi..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="flex-1 text-xs p-2.5 bg-white border border-black/10 rounded-none focus:outline-none focus:border-[#C41E3A] font-sans text-slate-800"
          />
          <button
            id="btn-send-note"
            type="submit"
            disabled={isSubmittingNote}
            className="p-2.5 bg-[#1A1A1A] hover:bg-[#C41E3A] text-white rounded-none transition-colors cursor-pointer h-9.5 w-9.5 flex items-center justify-center shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      ) : (
        <div className="p-3.5 bg-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-center font-mono border-t border-black/10">
          Log masuk redaksi diperlukan untuk diskusi.
        </div>
      )}
    </div>
  );
};

