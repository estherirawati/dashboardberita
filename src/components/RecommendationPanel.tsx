import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Layers, Compass, BarChart3, ArrowRight, Share2, AlertCircle, Lightbulb, CheckCircle2 } from "lucide-react";
import { InstagramPost, ContentRecommendation, RecommendationResponse } from "../types";
import { firestoreService } from "../firebase";

interface RecommendationPanelProps {
  posts: InstagramPost[];
  currUser: any;
  currSimEditor: { id: string; name: string; email: string } | null;
  onNewRecommendationGenerated?: (recs: ContentRecommendation[]) => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  posts,
  currUser,
  currSimEditor,
  onNewRecommendationGenerated
}) => {
  const [recData, setRecData] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [appliedIndices, setAppliedIndices] = useState<Record<number, boolean>>({});

  const activeUserId = currUser?.uid || currSimEditor?.id || "";
  const activeUsername = currUser?.displayName || currSimEditor?.name || "Redaktur Jatim";
  const activeEmail = currUser?.email || currSimEditor?.email || "";

  // Fetch recommendations from API
  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ posts }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server rekomendasi");
      }

      const data = await response.json();
      setRecData(data);
      setAppliedIndices({}); // Reset applied states on renew

      // Notify parent about new recommendations to trigger system notifications
      if (onNewRecommendationGenerated && data.recommendations) {
        onNewRecommendationGenerated(data.recommendations);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal meminta rekomendasi cerdas dari asisten AI kami.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (posts && posts.length > 0) {
      fetchRecommendations();
    }
  }, [posts.length]); // Re-fetch only if number of posts changes or manually clicked

  // Create an announcement based on the recommendation
  const handleApplyToMemo = async (rec: ContentRecommendation, index: number) => {
    if (!activeUserId) return;

    try {
      const announcementId = `announce_ai_${Date.now()}`;
      const memoTitle = `[AI REKOMENDASI] ${rec.title}`;
      const memoContent = `ISU REKOMENDASI KONTEN CERDAS AI\n\n- Kategori: ${rec.category}\n- Estimasi Capaian: ${rec.potentialReach} (Tingkat Keyakinan: ${rec.confidence})\n- Rencana Format: ${rec.format}\n\nURAIAN ALASAN:\n${rec.reason}\n\nLANGKAH TAKTIS MAJU REKTUR:\n${rec.actionableSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n\nKoordinasi oleh: ${activeUsername}`;

      await firestoreService.addAnnouncement(announcementId, {
        id: announcementId,
        userId: activeUserId,
        username: `${activeUsername} (via Smart AI)`,
        userEmail: activeEmail,
        title: memoTitle,
        content: memoContent,
        important: true,
        createdAt: new Date().toISOString()
      });

      setAppliedIndices(prev => ({
        ...prev,
        [index]: true
      }));

    } catch (err) {
      console.error("Gagal menyematkan rekomendasi ke memo:", err);
    }
  };

  return (
    <div id="ai-recommendations-bento" className="bg-white border-2 border-black p-6 rounded-none relative">
      
      {/* Newspaper Accent Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-5 border-black/15 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[#C41E3A]">
            <Sparkles className="h-5 w-5 fill-[#C41E3A] stroke-none" />
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono border-b border-[#C41E3A] pb-0.5">Beritajatim.com AI Desk</span>
          </div>
          <h3 className="text-xl font-serif font-extrabold tracking-tight text-[#1A1A1A]">
            Agenda Redaksi Cerdas Jawa Timur
          </h3>
          <p className="text-[10px] text-black/50 font-mono uppercase tracking-wider font-bold">
            Riset Performa Konten Otomatis &amp; Pemetaan Sudut Pandang Liputan Masa Depan
          </p>
        </div>

        <button
          id="btn-retrigger-analytics"
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-widest font-bold px-3 py-2 border-2 border-black bg-[#FAF9F6] text-black hover:bg-black hover:text-white transition-all cursor-pointer rounded-none disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Presisi Analisis..." : "Muat Ulang Analisis Cerdas"}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center space-y-4 bg-[#FAF9F6] border border-black/10 flex flex-col items-center justify-center border-dashed">
          <div className="relative">
            <RefreshCw className="h-8 w-8 text-[#C41E3A] animate-spin" />
            <Sparkles className="h-4 w-4 text-emerald-650 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">Memformulasikan Rekomendasi Taktis...</p>
            <p className="text-[10px] text-black/50 font-serif italic max-w-sm">
              Mengevaluasi {posts.length} postingan Instagram, menghitung deviasi keterlibatan per kategori, dan memetakan sudut pandang jurnalistik berdasarkan trend regional...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 border border-[#C41E3A]/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#C41E3A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900 font-sans">Gagal Meremasi Data Rekomendasi</p>
            <p className="text-[10px] text-slate-600 font-mono leading-relaxed">{error}</p>
            <button
              onClick={fetchRecommendations}
              className="mt-2 text-[9px] uppercase font-bold text-[#C41E3A] hover:underline"
            >
              Coba Ulang Sekarang
            </button>
          </div>
        </div>
      ) : recData ? (
        <div className="space-y-6">
          
          {/* Executive Briefing Block */}
          <div className="p-4 bg-[#FAF6EE] border-l-4 border-l-[#C41E3A] border-y border-r border-black/10">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Compass className="h-4 w-4 text-[#C41E3A]" />
              <h4 className="text-[10px] uppercase font-bold font-mono tracking-wider text-[#C41E3A]">
                Taklimat Utama Redaktur Jatim ({recData.isAiPowered ? "AI Gemini" : "Evaluasi Server"})
              </h4>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-sans font-normal italic">
              &quot;{recData.executiveBriefing}&quot;
            </p>
          </div>

          {/* Recommendations Triad Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recData.recommendations.map((rec, idx) => {
              const isExpanded = expandedIndex === idx;
              
              // Resolve category color highlights
              let catBorderColor = "border-l-[#C41E3A]";
              let catBgLight = "bg-red-50/20";
              if (rec.category === "Sidoarjo") {
                catBorderColor = "border-l-amber-600";
                catBgLight = "bg-amber-50/20";
              } else if (rec.category === "Surabaya") {
                catBorderColor = "border-l-emerald-600";
                catBgLight = "bg-emerald-50/20";
              } else if (rec.category === "Politik") {
                catBorderColor = "border-l-blue-600";
                catBgLight = "bg-blue-50/20";
              } else if (rec.category === "Olahraga") {
                catBorderColor = "border-l-pink-600";
                catBgLight = "bg-pink-50/20";
              } else if (rec.category === "Ekonomi") {
                catBorderColor = "border-l-purple-600";
                catBgLight = "bg-purple-50/20";
              }

              return (
                <div 
                  key={idx}
                  id={`rec-card-${idx}`}
                  className={`border border-black/15 bg-white flex flex-col justify-between transition-all duration-200 outline-none select-none ${
                    isExpanded ? "ring-2 ring-black border-transparent shadow" : "hover:border-black/30"
                  }`}
                >
                  <div className="p-4 space-y-3">
                    
                    {/* Header line with category and parameters */}
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                        {rec.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono">
                        <span className="text-black/40 font-bold">ER Potential:</span>
                        <span className="text-emerald-700 font-extrabold">{rec.potentialReach}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 
                      onClick={() => setExpandedIndex(idx)}
                      className="text-xs font-serif font-extrabold tracking-tight text-slate-900 leading-tight hover:text-[#C41E3A] cursor-pointer"
                    >
                      {rec.title}
                    </h4>

                    {/* Justification of recommendation */}
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                      {rec.reason}
                    </p>

                    {/* Actionable Steps checklist inside expanded item */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-dashed border-black/10 space-y-2 pb-1.5">
                        <span className="text-[9px] font-mono tracking-wider uppercase font-bold text-black/40 block">Program Kerja &amp; Angler Liputan:</span>
                        <ul className="space-y-1.5">
                          {rec.actionableSteps.map((step, sIdx) => (
                            <li key={sIdx} className="text-[10px] text-slate-755 leading-normal flex items-start gap-1.5">
                              <span className="text-[#C41E3A] font-extrabold mt-0.5 shrink-0">&bull;</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3.5 bg-slate-50 p-2.5 border border-black/5 font-mono">
                          <p className="text-[8px] uppercase tracking-wide text-black/40 font-bold leading-none">Format Visual Instagram:</p>
                          <p className="text-[10px] font-extrabold text-[#1A1A1A] mt-1 leading-snug">{rec.format}</p>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Actions Bar Footer */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-black/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setExpandedIndex(idx)}
                      className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#1A1A1A] hover:underline"
                    >
                      {isExpanded ? "Tutup Rencana" : "Ulas Rencana Liputan ➔"}
                    </button>

                    {activeUserId ? (
                      <button
                        onClick={() => handleApplyToMemo(rec, idx)}
                        disabled={appliedIndices[idx]}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 text-[9px] uppercase tracking-wider font-mono font-bold cursor-pointer transition-all ${
                          appliedIndices[idx] 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-white text-[#C41E3A] border border-black/15 hover:border-black hover:bg-black hover:text-white"
                        }`}
                      >
                        {appliedIndices[idx] ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 inline-block font-bold text-emerald-700" />
                            <span>Tersimpan</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-2.5 w-2.5 inline-block" />
                            <span>Memo Tim</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[8px] font-mono text-black/30">Login untk sematkan</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>
      ) : (
        <div className="py-12 bg-slate-50 text-center text-xs font-serif italic text-black/50 border border-black/5">
          Muat data di dashboard terlebih dahulu untuk memformulasikan saran liputan siber...
        </div>
      )}

    </div>
  );
};
