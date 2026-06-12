import React, { useState } from "react";
import { Pin, Trash2, Megaphone, AlertCircle, Plus, Sparkles, UserCheck } from "lucide-react";
import { Announcement } from "../types";
import { auth, firestoreService } from "../firebase";

interface NoticeBoardProps {
  announcements: Announcement[];
  currUser: any;
  currSimEditor: { id: string; name: string; email: string } | null;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ 
  announcements, 
  currUser,
  currSimEditor
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [important, setImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Determine active profile params
  const activeUserId = currUser?.uid || currSimEditor?.id || "";
  const activeUsername = currUser?.displayName || currSimEditor?.name || "Jurnalis Beritajatim";
  const activeEmail = currUser?.email || currSimEditor?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) return;
    if (!activeUserId) return;

    setIsSubmitting(true);
    try {
      const announcementId = `announce_${Date.now()}`;
      await firestoreService.addAnnouncement(announcementId, {
        id: announcementId,
        userId: activeUserId,
        username: activeUsername,
        userEmail: activeEmail,
        title: title.trim(),
        content: content.trim(),
        important,
        createdAt: new Date().toISOString()
      });
      setTitle("");
      setContent("");
      setImportant(false);
      setShowForm(false);
    } catch (err) {
      console.error("Gagal menambahkan pengumuman:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (announcementId: string) => {
    try {
      await firestoreService.deleteAnnouncement(announcementId);
    } catch (err) {
      console.error("Gagal menghapus pengumuman:", err);
    }
  };

  return (
    <div id="noticeboard-container" className="bg-white p-6 rounded-none border border-black/15 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/10 pb-3 gap-3">
        <div className="flex items-center space-x-2">
          <Megaphone className="h-5 w-5 text-[#C41E3A]" />
          <div>
            <h3 className="text-md font-serif italic font-bold text-[#1A1A1A]">Papan Memo Redaksi</h3>
            <p className="text-[10px] uppercase tracking-wider font-bold text-black/40">Koordinasi Utama Real-Time</p>
          </div>
        </div>
        
        {activeUserId && (
          <button
            id="toggle-announcement-form"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-1 text-[10px] tracking-widest font-bold uppercase px-3 py-1.5 border border-black hover:bg-black hover:text-white rounded-none cursor-pointer transition-colors font-mono"
          >
            <Plus className="h-3 w-3" />
            <span>{showForm ? "Tutup" : "Buat Catatan"}</span>
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-none border border-black/10 space-y-3 animate-fade-in">
          <div>
            <label className="block text-[10px] uppercase font-bold text-black/60 mb-1 font-mono">Judul Koordinasi</label>
            <input
              type="text"
              required
              placeholder="Contoh: Liputan Persiapan Pilkada Jatim di Surabaya"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-black/10 rounded-none focus:outline-none focus:border-[#C41E3A] font-sans text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-black/60 mb-1 font-mono">Pesan Instruksi / Catatan</label>
            <textarea
              required
              rows={3}
              placeholder="Ketik detail koordinasi redaksi di sini untuk tim lapangan atau jurnalis..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-black/10 rounded-none focus:outline-none focus:border-[#C41E3A] font-sans text-slate-800"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
                className="h-3.5 w-3.5 text-[#C41E3A] focus:ring-0 rounded-none"
              />
              <span className="flex items-center gap-1 text-[#C41E3A] font-bold text-[11px] uppercase tracking-wide">
                <AlertCircle className="h-3.5 w-3.5" /> Berita Penting
              </span>
            </label>
            <button
              id="submit-announcement"
              type="submit"
              disabled={isSubmitting}
              className="text-[10px] uppercase tracking-widest px-4 py-2 bg-[#C41E3A] hover:bg-[#A3142C] text-white rounded-none font-bold transition-colors disabled:bg-slate-350 font-mono cursor-pointer h-8"
            >
              {isSubmitting ? "Mengirim..." : "Kirim"}
            </button>
          </div>
        </form>
      )}

      {/* Announcements List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {announcements.length === 0 ? (
          <div className="py-8 text-center text-xs text-black/40 font-serif italic">
            Papan pengumuman kosong. Tim redaksi belum mempublikasikan catatan koordinasi hari ini.
          </div>
        ) : (
          announcements.map((ann) => (
            <div 
              key={ann.id} 
              className={`p-4 rounded-none border-l-4 relative group transition-all duration-200 ${
                ann.important 
                  ? "bg-red-50/40 border-l-[#C41E3A] border-y border-r border-[#C41E3A]/20" 
                  : "bg-slate-50/50 border-l-slate-700 border-y border-r border-black/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1 pr-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Pin className={`h-3 w-3 ${ann.important ? "text-[#C41E3A] fill-[#C41E3A]" : "text-slate-600 fill-slate-600"}`} />
                    <span className={`text-xs font-bold leading-tight font-sans tracking-tight uppercase ${ann.important ? "text-[#C41E3A]" : "text-slate-800"}`}>
                      {ann.title}
                    </span>
                    {ann.important && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-[#C41E3A] text-[9px] font-bold uppercase tracking-widest font-mono">
                        Penting
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-750 font-sans leading-relaxed whitespace-pre-wrap font-light">
                    {ann.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-black/40 pt-2 border-t border-black/5 font-mono">
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-black/40" />
                      <span className="font-bold">{ann.username}</span>
                      <span className="hidden sm:inline">({ann.userEmail})</span>
                    </div>
                    <span>
                      {new Date(ann.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Show Delete Button if current user is owner */}
                {activeUserId === ann.userId && (
                  <button
                    id={`delete-announcement-${ann.id}`}
                    onClick={() => handleDelete(ann.id)}
                    className="p-1 px-1.5 bg-red-100 text-red-600 rounded-none opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-red-200 cursor-pointer"
                    title="Hapus Memo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
