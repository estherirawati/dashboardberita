import React, { useState, useEffect, useMemo } from "react";
import { 
  FileDown, 
  Search, 
  SlidersHorizontal, 
  LogIn, 
  LogOut, 
  Sparkles, 
  Newspaper, 
  Users, 
  Zap, 
  ShieldAlert, 
  RefreshCw, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  TrendingDown
} from "lucide-react";
import { auth, loginWithGoogle, logoutUser, firestoreService, db } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { INITIAL_INSTAGRAM_POSTS, CATEGORY_DETAILS } from "./data";
import { InstagramPost, Announcement } from "./types";
import { MetricsOverview } from "./components/MetricsOverview";
import { PerformanceCharts } from "./components/PerformanceCharts";
import { NoticeBoard } from "./components/NoticeBoard";
import { EditorialPanel } from "./components/EditorialPanel";
import { RecommendationPanel } from "./components/RecommendationPanel";
import { NotificationCenter } from "./components/NotificationCenter";
import { ContentRecommendation } from "./types";
import { jsPDF } from "jspdf";

export default function App() {
  // Authentication states
  const [currUser, setCurrUser] = useState<User | null>(null);
  const [currSimEditor, setCurrSimEditor] = useState<{ id: string; name: string; email: string } | null>({
    id: "sim_esther",
    name: "Esther Irawati (Redaktur Utama)",
    email: "esther.irawati@gmail.com"
  }); // Seeded by default for 1-click convenience inside sandbox iframe

  // Application data states
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentRecommendations, setCurrentRecommendations] = useState<ContentRecommendation[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>("post_2"); // Default first selected post
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  // Filter/sorting states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [sortBy, setSortBy] = useState<string>("Terpopuler"); // Terpopuler, Terbaru, Keterlibatan

  // Viral notification state
  const [dismissedViralCount, setDismissedViralCount] = useState<number>(0);
  const [showSimNotice, setShowSimNotice] = useState(true);

  // 1. Subscribe to Firebase Auth and Firestore on start
  useEffect(() => {
    // Auth subscription
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrUser(user);
      if (user) {
        // Disable simulation profile if user logs in with real Google credentials
        setCurrSimEditor(null);
      }
    });

    // Subscriptions to Firestore data
    let unsubscribePosts: (() => void) | undefined;
    let unsubscribeAnnounce: (() => void) | undefined;

    const setupDatabaseSubscription = async () => {
      setIsLoading(true);
      try {
        // Test/seed the '/posts' collection if empty
        const postColRef = collection(db, "posts");
        const snapshot = await getDocs(postColRef);
        
        if (snapshot.empty) {
          console.log("Database Firestore kosong, memicu bootstrapping data awal Beritajatim...");
          setIsBootstrapping(true);
          const batch = writeBatch(db);
          INITIAL_INSTAGRAM_POSTS.forEach((p) => {
            const docRef = doc(db, "posts", p.id);
            batch.set(docRef, p);
          });
          await batch.commit();
          setIsBootstrapping(false);
          console.log("Bootstrapping data sukses.");
        }

        // Real-time listener for posts
        unsubscribePosts = await firestoreService.getPostsAndSync((updatedPosts) => {
          setPosts(updatedPosts);
          setIsLoading(false);
        });

        // Real-time listener for announcements
        unsubscribeAnnounce = await firestoreService.getAnnouncementsAndSync((updatedAnnouncements) => {
          setAnnouncements(updatedAnnouncements);
        });

      } catch (err) {
        console.error("Gagal melakukan penyelarasan database Firestore:", err);
        // Fallback to static data if anything fails or rules block operations before login
        setPosts(INITIAL_INSTAGRAM_POSTS);
        setIsLoading(false);
      }
    };

    setupDatabaseSubscription();

    return () => {
      unsubscribeAuth();
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeAnnounce) unsubscribeAnnounce();
    };
  }, []);

  // 2. Clear Sim Profile toggle
  const handleToggleSimProfile = () => {
    if (currSimEditor) {
      setCurrSimEditor(null);
    } else {
      setCurrSimEditor({
        id: "sim_esther",
        name: "Esther Irawati (Redaktur Utama)",
        email: "esther.irawati@gmail.com"
      });
      // Logout real google profile if any
      logoutUser();
    }
  };

  // 3. Handle real Google Login
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Gagal Google Login:", err);
    }
  };

  // 4. Calculate active viral posts
  const viralPostsList = useMemo(() => {
    // Post is viral if: likes > 800 or engagementRate > 10%
    return posts.filter(p => p.likes >= 10 && (p.isViral || p.likes > 800 || p.engagementRate > 10));
  }, [posts]);

  const rawViralCount = viralPostsList.length;
  const activeViralCount = Math.max(0, rawViralCount - dismissedViralCount);

  const handleClearViralAlerts = () => {
    setDismissedViralCount(rawViralCount);
  };

  // Reset metrics if elements are added
  useEffect(() => {
    if (rawViralCount < dismissedViralCount) {
      setDismissedViralCount(rawViralCount);
    }
  }, [rawViralCount, dismissedViralCount]);

  // 5. filter & sort posts (likes < 10 are strictly filtered as per guidelines)
  const filteredAndSortedPosts = useMemo(() => {
    let result = posts.filter(p => p.likes >= 10); // STIPULATION: Ignore posts with likes < 10

    // Search filter
    if (searchTerm.trim() !== "") {
      result = result.filter(p => 
        p.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "Semua") {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Evaluation status filter
    if (statusFilter !== "Semua") {
      result = result.filter(p => p.statusEvaluasi === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "Terpopuler") {
        return b.likes - a.likes;
      } else if (sortBy === "Terbaru") {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else if (sortBy === "Keterlibatan") {
        return b.engagementRate - a.engagementRate;
      }
      return 0;
    });

    return result;
  }, [posts, searchTerm, categoryFilter, statusFilter, sortBy]);

  // 6. Selected post reference
  const selectedPost = useMemo(() => {
    return posts.find(p => p.id === selectedPostId) || null;
  }, [posts, selectedPostId]);

  // 7. Calculate aggregate category data dynamically for chart and PDF
  const categorySummaryData = useMemo(() => {
    const dataMap: Record<string, { category: string; count: number; totalLikes: number; totalER: number }> = {};
    posts.filter(p => p.likes >= 10).forEach((post) => {
      if (!dataMap[post.category]) {
        dataMap[post.category] = {
          category: post.category,
          count: 0,
          totalLikes: 0,
          totalER: 0
        };
      }
      dataMap[post.category].count += 1;
      dataMap[post.category].totalLikes += post.likes;
      dataMap[post.category].totalER += post.engagementRate;
    });

    return Object.values(dataMap).map(item => ({
      category: item.category,
      count: item.count,
      avgLikes: item.totalLikes / item.count,
      avgEngagement: item.totalER / item.count
    }));
  }, [posts]);

  // 8. jsPDF report exporter (A4 custom layout designed for professional print style)
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Header banner decoration
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 40, "F");

    // Title inside banner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("LAPORAN EVALUASI & METRIK INSTAGRAM BERITAJATIM", 15, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text("Fokus Regional Jawa Timur - Akurasi, Disiplin Verifikasi, Independensi Jurnalistik", 15, 25);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString("id-ID")} WIB`, 15, 31);

    // Section 1: Executive Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("I. KOMPILASI RINGKASAN METRIK UTAMA", 15, 52);

    const validPostsList = posts.filter(p => p.likes >= 10);
    const totalLikesSum = validPostsList.reduce((acc, p) => acc + p.likes, 0);
    const totalCommentsSum = validPostsList.reduce((acc, p) => acc + p.comments, 0);
    const averageErSum = validPostsList.length > 0 
      ? (validPostsList.reduce((acc, p) => acc + p.engagementRate, 0) / validPostsList.length).toFixed(2)
      : "0";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`* Total Posting Terpantau (> 10 Likes): ${validPostsList.length} postingan`, 18, 59);
    doc.text(`* Jumlah Suka (Likes) Diperoleh: ${totalLikesSum.toLocaleString("id-ID")} Suku`, 18, 65);
    doc.text(`* Jumlah Respon Komentar Tim: ${totalCommentsSum.toLocaleString("id-ID")} Komentar`, 18, 71);
    doc.text(`* Rata-rata Keterlibatan Publik (Engagement Rate): ${averageErSum}%`, 18, 77);

    // Section 2: Table of category comparison
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("II. ANALISIS SEGMENTASI KINERJA KATEGORI BERITA", 15, 90);

    // Table Header
    doc.setFillColor(51, 65, 85); // slate-700
    doc.rect(15, 95, 180, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Kategori Berita", 18, 100);
    doc.text("Frekuensi Post", 65, 100);
    doc.text("Rerata Suka", 108, 100);
    doc.text("Rerata ER (%)", 155, 100);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    
    let y = 109;
    categorySummaryData.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, y - 5, 180, 7, "F");
      }
      doc.text(item.category, 18, y);
      doc.text(`${item.count} Post`, 65, y);
      doc.text(`${Math.round(item.avgLikes)} Suka`, 108, y);
      doc.text(`${item.avgEngagement.toFixed(2)}%`, 155, y);
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 2, 195, y + 2);
      y += 7;
    });

    // Section 3: Viral Alert list
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68); // Red
    doc.text("III. LAPORAN ALERT VIRAL & TINDAK LANJUT VERIFIKASI", 15, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    y += 6;

    if (viralPostsList.length === 0) {
      doc.text("Tidak ada berita yang mencapai batas viralitas (>800 Likes) minggu ini.", 18, y);
    } else {
      viralPostsList.slice(0, 3).forEach((post) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`[${post.category}] - ${post.likes} Suka, ER: ${post.engagementRate}%`, 18, y);
        y += 4.5;
        doc.setFont("helvetica", "normal");
        const captionTrunc = post.caption.length > 95 ? post.caption.substring(0, 92) + "..." : post.caption;
        doc.text(`"${captionTrunc}"`, 18, y);
        y += 4.5;
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 116, 139);
        doc.text(`Status: ${post.statusEvaluasi} - Verifikasi: ${post.verified ? "TERVERIFIKASI ✓" : "BELUM TERVERIFIKASI"}`, 18, y);
        y += 7;
      });
      if (viralPostsList.length > 3) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(`* Dan ${viralPostsList.length - 3} postingan viral lainnya diarsip di sistem...`, 18, y);
      }
    }

    // Custom Signature footer at bottom of sheet
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 275, 195, 275);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("PEDOMAN REDAKSI BERITAJATIM", 15, 281);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Laporan ini sah diedarkan secara internal untuk evaluasi mingguan tim liputan Surabaya.", 15, 285);

    // Save
    doc.save(`Laporan_Instagram_Beritajatim_${new Date().toISOString().split("T")[0]}.pdf`);
  };  return (
    <div id="app-root-container" className="bg-[#FAF9F6] min-h-screen text-[#1A1A1A] font-sans antialiased pb-12 flex flex-col">
      
      {/* 1. Header & Brand Navigation - Classic Editorial Headline style */}
      <header id="main-header" className="bg-white border-b-2 border-black text-[#1A1A1A] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline space-x-4">
            <div>
              <h1 className="text-3xl font-serif font-black tracking-tighter text-[#1A1A1A] hover:text-[#C41E3A] transition-colors leading-none select-none cursor-pointer">
                BERITAJATIM<span className="text-[#C41E3A]">.COM</span>
              </h1>
              <p className="text-[9px] text-black/50 font-mono tracking-widest uppercase font-bold mt-1.5 leading-none">
                Akurasi &bull; Disiplin Verifikasi &bull; Independen &bull; Instatren
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            
            {/* Real-time Notification Center */}
            <NotificationCenter 
              posts={posts} 
              recs={currentRecommendations} 
              onSelectPost={(id) => setSelectedPostId(id)}
            />
            
            {/* Quick Demo Simulator Toggle Banner info */}
            {showSimNotice && (
              <div className="hidden lg:flex items-center bg-[#FAF6EE] border border-amber-800/10 rounded-none px-3 py-1.5 text-[10px] max-w-xs leading-normal font-serif italic text-amber-900 shadow-sm">
                <span>
                  <strong>Sandbox Redaksi:</strong> Anda memonitor aktivitas siber real-time tim Liputan Surabaya.
                </span>
              </div>
            )}

            {/* Simulated Editor Account Indicator */}
            {currSimEditor ? (
              <div id="sim-editor-profile" className="flex items-center space-x-3 bg-slate-100 border border-black/10 rounded-none py-1.5 px-3">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <div className="text-left font-mono">
                  <p className="text-[8px] text-black/40 font-bold uppercase leading-none">Simulasi Redaktur</p>
                  <p className="text-[10px] font-bold text-slate-800 truncate leading-tight mt-0.5">{currSimEditor.name}</p>
                </div>
                <button
                  id="btn-toggle-sim"
                  onClick={handleToggleSimProfile}
                  className="px-2 py-1 text-[9px] uppercase tracking-wider font-bold border border-black/20 hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  Ganti
                </button>
              </div>
            ) : currUser ? (
              <div id="pria-user-profile" className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-none py-1.5 px-3">
                <div className="h-6 w-6 bg-[#C41E3A] rounded-none flex items-center justify-center font-bold text-xs text-white">
                  {currUser.displayName?.substring(0, 1) || "U"}
                </div>
                <div className="text-left font-mono">
                  <p className="text-[8px] text-[#C41E3A] font-bold uppercase leading-none">Google Redaksi</p>
                  <p className="text-[10px] font-bold text-slate-900 truncate leading-tight mt-0.5">{currUser.displayName || currUser.email}</p>
                </div>
                <button
                  id="btn-logout"
                  onClick={() => { logoutUser(); setCurrSimEditor(null); }}
                  className="p-1 text-black/50 hover:text-[#C41E3A] cursor-pointer transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 font-mono">
                <button
                  id="btn-guest-sim-login"
                  onClick={handleToggleSimProfile}
                  className="text-[10px] tracking-wider font-bold uppercase py-2 px-3 border border-black hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Masuk Simulasi
                </button>
                <button
                  id="btn-google-login"
                  onClick={handleGoogleLogin}
                  className="text-[10px] tracking-wider font-bold uppercase py-2 px-3 bg-[#C41E3A] text-white hover:bg-[#A3142C] transition-colors cursor-pointer"
                >
                  Google Login
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* 2. Headline Lead - Classic News Sheet style */}
      <div id="brand-jumbotron" className="bg-[#1A1A1A] text-white border-b-4 border-[#C41E3A] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3.5 md:max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#C41E3A] text-[9px] font-mono font-bold uppercase tracking-widest text-white rounded-none">
                Komitmen Redaksi
              </span>
              <span className="h-1 w-1 bg-white rounded-full"></span>
              <p className="text-[10px] font-mono uppercase font-bold text-white/50 tracking-wider">PRESISI Jurnalistik Jawa Timur</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif italic tracking-tight text-white leading-tight">
              Akurasi &amp; Disiplin Verifikasi Di Atas Segala Batasan Viralitas
            </h2>
            <p className="text-xs text-white/70 leading-relaxed font-sans font-light">
              Beritajatim.com berdiri teguh di Surabaya untuk mengawal pergerakan berita Jawa Timur yang valid dan bebas dari bias clickbait. Dashboard intelijen siber ini memonitor performa postingan Instagram Beritajatim, mengevaluasi naskah dengan bantuan <strong>Gemini AI</strong>, menyaring postingan di bawah batasan 10 Likes, serta menjamin keakuratan liputan yang cepat dan independen.
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <button
              id="btn-export-pdf-report"
              onClick={handleExportPDF}
              className="bg-[#C41E3A] hover:bg-[#A3142C] text-white px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-widest shadow-sm rounded-none transition-colors flex items-center space-x-2 cursor-pointer border border-[#C41E3A]"
            >
              <FileDown className="h-4 w-4" />
              <span>Ekspor PDF Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-6 flex-1 w-full">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="py-20 text-center space-y-4 bg-white border border-black/10 rounded-none shadow-sm flex flex-col items-center justify-center">
            <RefreshCw className="h-8 w-8 text-black/20 animate-spin" />
            <p className="text-xs uppercase tracking-wider font-mono font-bold text-black/40">Menghubungkan ke database real-time Firestore...</p>
          </div>
        )}

        {isBootstrapping && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-center font-mono rounded-none uppercase tracking-wider">
            Mempersiapkan basis data awal Instagram Beritajatim di Firestore. Harap tunggu sebentar...
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">
            
            {/* Aggregate Metrics Header Row */}
            <MetricsOverview 
              posts={posts.filter(p => p.likes >= 10)} 
              viralCount={activeViralCount} 
              onClearViralAlerts={handleClearViralAlerts} 
            />

            {/* Performance Charts Row */}
            <PerformanceCharts posts={posts.filter(p => p.likes >= 10)} />

            {/* Smart AI Content Recommendation Section */}
            <RecommendationPanel 
              posts={posts}
              currUser={currUser}
              currSimEditor={currSimEditor}
              onNewRecommendationGenerated={(recs) => setCurrentRecommendations(recs)}
            />

            {/* Bottom Collaboration & Posts Table Row - Flex / Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle Column: Posts table with filters & search */}
              <div className="lg:col-span-2 bg-white rounded-none border border-black/15 shadow-sm p-6 space-y-4">
                
                <div className="border-b border-black/10 pb-3">
                  <h3 className="text-lg font-serif italic font-bold text-slate-900">Pemantau Aliran Konten Siber</h3>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-black/40 font-mono mt-0.5">Analisis tren & kualifikasi verifikasi jurnalis</p>
                </div>

                {/* Search & filters head */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF9F6] p-4 rounded-none border border-black/10">
                  
                  {/* Keyword search input */}
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 text-black/30 absolute left-3 top-2.5" />
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Cari caption berita beritajatim..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-black/15 rounded-none text-xs font-sans text-[#1A1A1A] focus:outline-none focus:border-[#C41E3A] placeholder-black/30"
                    />
                  </div>

                  {/* Filters dropdowns row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    
                    {/* Category Filter */}
                    <div>
                      <select
                        id="filter-category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="text-[11px] p-2 bg-white border border-black/15 rounded-none font-sans focus:outline-none focus:border-black text-[#1A1A1A] font-bold cursor-pointer"
                      >
                        <option value="Semua">Semua Kategori</option>
                        <option value="Politik">Politik & Pilkada</option>
                        <option value="Surabaya">Surabaya Metropolis</option>
                        <option value="Sidoarjo">Sidoarjo local</option>
                        <option value="Olahraga">Olahraga Jatim</option>
                        <option value="Kriminal">Hukum & Kriminal</option>
                        <option value="Ekonomi">Ekonomi - Bisnis</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <select
                        id="filter-status-eval"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-[11px] p-2 bg-white border border-black/15 rounded-none font-sans focus:outline-none focus:border-black text-[#1A1A1A] font-bold cursor-pointer"
                      >
                        <option value="Semua">Semua Evaluasi</option>
                        <option value="Belum Dievaluasi">Belum Dievaluasi</option>
                        <option value="Perlu Verifikasi">Perlu Verifikasi</option>
                        <option value="Layak Tayang">Layak Tayang</option>
                        <option value="Sensasional">Sensasional (Remis)</option>
                        <option value="Arsip">Arsip</option>
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div>
                      <select
                        id="sort-posts"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-[11px] p-2 bg-black text-white border-none rounded-none font-sans focus:outline-none font-extrabold cursor-pointer"
                      >
                        <option value="Terpopuler">Teraktif (Likes)</option>
                        <option value="Terbaru">Teranyar</option>
                        <option value="Keterlibatan">Engagement (ER)</option>
                      </select>
                    </div>

                  </div>

                </div>

                {/* Posts Table List */}
                <div className="overflow-x-auto border border-black/10">
                  <table id="posts-monitoring-table" className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black/15 text-[10px] font-mono font-bold text-black/60 select-none uppercase tracking-wider">
                        <th className="py-3 px-4">Detail Berita &amp; Caption</th>
                        <th className="py-3 px-3">Kategori</th>
                        <th className="py-3 px-3 text-right">Performa</th>
                        <th className="py-3 px-3 text-center">Status Jurnal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredAndSortedPosts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-black/40 font-serif italic text-sm">
                            Tidak ditemukan berita yang memenuhi parameter pencarian atau di atas limit 10 Suka.
                          </td>
                        </tr>
                      ) : (
                        filteredAndSortedPosts.map((post) => {
                          const isCurrentlySelected = selectedPostId === post.id;
                          const isViralAlert = post.likes > 800 || post.engagementRate > 10;
                          
                          return (
                            <tr 
                              key={post.id}
                              id={`post-row-${post.id}`}
                              onClick={() => setSelectedPostId(post.id)}
                              className={`group cursor-pointer transition-all duration-150 relative ${
                                isCurrentlySelected 
                                  ? "bg-[#C41E3A]/5 border-l-4 border-l-[#C41E3A]" 
                                  : "hover:bg-slate-50/70"
                              }`}
                            >
                              {/* Caption details with title indicator */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1.5 max-w-[320px] md:max-w-[450px]">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] text-black/40 font-mono font-bold uppercase tracking-wider">
                                      {new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                                    </span>
                                    {isViralAlert && (
                                      <span className="px-1.5 py-0.2 bg-red-100 text-[#C41E3A] text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-0.5">
                                        <Zap className="h-2.5 w-2.5 fill-[#C41E3A] stroke-none" /> Viral
                                      </span>
                                    )}
                                    {post.integritasScore !== undefined && (
                                      <span className={`text-[9px] font-mono px-1.5 py-0.2 font-bold uppercase tracking-wider border ${
                                        post.integritasScore >= 80 
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-500/20" 
                                          : "bg-red-50 text-[#C41E3A] border-[#C41E3A]/20"
                                      }`}>
                                        AI: {post.integritasScore}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[#1A1A1A] line-clamp-2 md:line-clamp-1 leading-relaxed font-sans text-xs">
                                    {post.caption}
                                  </p>
                                </div>
                              </td>

                              {/* Category pill */}
                              <td className="py-3.5 px-3">
                                <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono font-bold uppercase tracking-wider ${
                                  post.category === "Politik" ? "bg-slate-200 text-slate-800" :
                                  post.category === "Surabaya" ? "bg-slate-200 text-slate-800" :
                                  post.category === "Sidoarjo" ? "bg-slate-200 text-slate-800" :
                                  post.category === "Olahraga" ? "bg-slate-200 text-slate-800" :
                                  post.category === "Kriminal" ? "bg-slate-200 text-slate-800" : "bg-slate-200 text-slate-800"
                                }`}>
                                  {post.category}
                                </span>
                              </td>

                              {/* Metrics count */}
                              <td className="py-3.5 px-3 text-right">
                                <div className="space-y-0.5 font-mono">
                                  <div className="font-extrabold text-[#1A1A1A] text-xs">
                                    {post.likes} <span className="font-normal text-[9px] text-[#A1A1A1] uppercase">likes</span>
                                  </div>
                                  <div className="text-[10px] text-black/50 font-bold">{post.engagementRate}% ER</div>
                                </div>
                              </td>

                              {/* Status Evaluasi pill */}
                              <td className="py-3.5 px-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono font-bold uppercase tracking-wider ${
                                    post.statusEvaluasi === "Layak Tayang" ? "bg-emerald-100 text-emerald-900" :
                                    post.statusEvaluasi === "Perlu Verifikasi" ? "bg-red-100 text-[#C41E3A]" :
                                    post.statusEvaluasi === "Sensasional" ? "bg-amber-100 text-amber-900" :
                                    post.statusEvaluasi === "Arsip" ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {post.statusEvaluasi}
                                  </span>
                                  <span className="text-[8px] font-mono text-black/30">
                                    {post.verified ? "VERIFIED ✓" : "UNVERIFIED"}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Info board warning likes below 10 */}
                <div className="p-4 bg-[#FAF6EE] rounded-none border border-amber-800/10 text-[10px] text-amber-900 font-serif flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                  <span>
                    &bull; <strong>Saringan Redaktur:</strong> Postingan Instagram dengan interaksi di bawah <strong>10 Likes</strong> diabaikan secara mutlak demi menjaga akurasi pemantauan tren utama wilayah Jawa Timur.
                  </span>
                  <a href="https://www.instagram.com/beritajatim/" target="_blank" rel="noopener noreferrer" className="text-[#C41E3A] hover:underline font-extrabold uppercase font-mono tracking-wider flex items-center gap-1 shrink-0">
                    Kunjungi IG <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

              </div>

              {/* Right Column: Editorial Collaboration Room */}
              <div className="space-y-6">
                
                {/* Real-time Notice Board */}
                <NoticeBoard 
                  announcements={announcements} 
                  currUser={currUser}
                  currSimEditor={currSimEditor}
                />

                {/* Collaborative and details Panel */}
                {selectedPost ? (
                  <EditorialPanel
                    post={selectedPost}
                    onClose={() => setSelectedPostId(null)}
                    currUser={currUser}
                    currSimEditor={currSimEditor}
                  />
                ) : (
                  <div className="bg-white p-8 rounded-none border border-black/15 shadow-sm text-center py-20 space-y-4 border-dashed">
                    <HelpCircle className="h-8 w-8 text-[#A1A1A1] mx-auto text-black/20" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-serif italic font-bold text-[#1A1A1A]">Pilih Postingan Instagram</h4>
                      <p className="text-[10px] text-[#A1A1A1] max-w-[280px] mx-auto leading-normal">
                        Silakan klik baris berita di tabel pemantauan untuk melakukan cek akurasi AI Gemini, merubah status verifikasi naskah, atau meninggalkan catatan koordinasi tim Liputan Jawa Timur.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
