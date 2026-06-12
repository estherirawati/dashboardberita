import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Initialize Gemini client on the server side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("Pemberitahuan: GEMINI_API_KEY tidak dikonfigurasi di secrets. Evaluasi AI akan menggunakan fallback analisis lokal.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API endpoint for journalistic content evaluation using Gemini
app.post("/api/evaluate", async (req, res) => {
  const { caption, category, likes, comments } = req.body;

  if (!caption) {
    return res.status(400).json({ error: "Caption postingan wajib dilampirkan" });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Local fallback analysis when API Key is not set or ready
    const len = caption.length;
    const clickbaits = ["klik", "viral", "heboh", "gila", "bikin syok", "ternyata ini", "mengejutkan"];
    const containsClickbait = clickbaits.some(word => caption.toLowerCase().includes(word));
    
    const calculatedScore = containsClickbait ? 72 : 88;
    const statusSensasional = containsClickbait ? "Cukup Sensasional (Clickbait)" : "Objektif dan Faktual";
    
    return res.json({
      integritasScore: calculatedScore,
      analisisVerifikasi: "Saran Verifikasi: Pastikan melakukan wawancara silang (cross-check) dengan narasumber berwenang di Jawa Timur dan mematuhi aturan penulisan inisial bagi pihak yang terduga pelaku kejahatan sesuai Pedoman Pemberitaan Media Siber.",
      saranTindakLanjut: "Rekomendasi Tindak Lanjut: Kembangkan info sekilas ini menjadi liputan komprehensif di portal beritajatim.com dengan menambahkan pendapat pengamat independen dan fakta penunjang kejadian di lapangan.",
      statusSensasional: statusSensasional,
      isAiPowered: false
    });
  }

  try {
    const prompt = `Anda adalah editor senior beritajatim.com, media jurnalistik terkemuka di Surabaya, Jawa Timur yang menjunjung tinggi keakuratan, disiplin verifikasi, independensi, dan objektivitas jurnalistik.

Lakukan analisis jurnalistik yang profesional dan mendalam terhadap postingan Instagram media berikut:
Kategori Berita: ${category || "Umum"}
Metrik Performa: ${likes || 0} Suka, ${comments || 0} Komentar
Caption:
"${caption}"

Berikan penilaian terstruktur berformat JSON yang memuat:
1. integritasScore: Nilai integritas jurnalistik konten ini (skala 1-100) berdasarkan kejujuran, tidak bias, kelengkapan informasi, dan netralitas kalimat.
2. analisisVerifikasi: Rekomendasi verifikasi ketat (dalam Bahasa Indonesia) apa saja yang harus ditekankan (misal: penyeimbangan narasumber, cek dokumen primer, verifikasi fakta di lokasi Surabaya/Jawa Timur).
3. saranTindakLanjut: Ide tindak lanjut jurnalistik taktis (Bahasa Indonesia) untuk mengembangkan unggahan pendek ini menjadi berita mendalam (indepth report/investigasi) di portal web beritajatim.com.
4. statusSensasional: Klasifikasi gaya penulisan caption (apakah "Sangat Sensasional", "Agak Sensasional", "Objektif dan Faktual", atau "Edukatif dan Mendalam").

Harap balas HANYA dengan objek JSON murni sesuai schema yang diinstruksikan.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            integritasScore: { 
              type: Type.INTEGER, 
              description: "Nilai skor integritas dari 1 hingga 100" 
            },
            analisisVerifikasi: { 
              type: Type.STRING, 
              description: "Rekomendasi verifikasi jurnalisme yang kredibel" 
            },
            saranTindakLanjut: { 
              type: Type.STRING, 
              description: "Langkah konkrit peliputan atau tindak lanjut berita mendalam" 
            },
            statusSensasional: { 
              type: Type.STRING, 
              description: "Status gaya tulisan konten" 
            }
          },
          required: ["integritasScore", "analisisVerifikasi", "saranTindakLanjut", "statusSensasional"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Teks respons kosong dari Gemini");
    }

    const evaluationData = JSON.parse(resultText.trim());
    return res.json({
      ...evaluationData,
      isAiPowered: true
    });

  } catch (error) {
    console.error("Gagal melakukan evaluasi dengan Gemini:", error);
    return res.status(500).json({
      error: "Gagal berinteraksi dengan asisten AI evaluasi",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// API endpoint for smart content recommendations using Gemini
app.post("/api/recommendations", async (req, res) => {
  const { posts } = req.body;

  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({ error: "Data postingan tidak valid atau kosong" });
  }

  const ai = getGeminiClient();

  // Dynamic fallback when Gemini is not configured
  if (!ai) {
    const categoryStats: Record<string, { likes: number; count: number; erSum: number }> = {};
    posts.forEach((p: any) => {
      // Clean up inputs
      const cat = p.category || "Umum";
      const lks = typeof p.likes === "number" ? p.likes : 15;
      const er = typeof p.engagementRate === "number" ? p.engagementRate : 5;

      if (!categoryStats[cat]) {
        categoryStats[cat] = { likes: 0, count: 0, erSum: 0 };
      }
      categoryStats[cat].likes += lks;
      categoryStats[cat].count += 1;
      categoryStats[cat].erSum += er;
    });

    const sortedCategories = Object.keys(categoryStats).map(cat => ({
      category: cat,
      avgLikes: categoryStats[cat].likes / categoryStats[cat].count,
      avgER: categoryStats[cat].erSum / categoryStats[cat].count
    })).sort((a, b) => b.avgLikes - a.avgLikes);

    const topCategory = sortedCategories[0]?.category || "Olahraga";
    const secondCategory = sortedCategories[1]?.category || "Surabaya";
    const topCategoryER = (sortedCategories[0]?.avgER || 11.5).toFixed(1);

    return res.json({
      isAiPowered: false,
      executiveBriefing: `Analisis Redaksi Lokal Jatim: Segmentasi jurnalisme bersandar pada data siber. Kategori ${topCategory} menunjukkan nilai ketertarikan tertinggi dengan rata-rata keterlibatan publik yang patut diapresiasi (${topCategoryER}% ER). Tim peliputan Surabaya ditekankan untuk memformulasikan naskah mendalam pada ranah ini, disertai pengawasan ketat terhadap visual reels di wilayah Metropolis Surabaya dan sekitarnya.`,
      recommendations: [
        {
          title: `Eksplorasi Isu Taktis & Investigasi ${topCategory}`,
          category: topCategory,
          potentialReach: "Sangat Tinggi (Viral)",
          confidence: "95%",
          reason: `Grafik performa postingan bertema ${topCategory} membukukan akselerasi Likes serta interaksi tercepat dalam 48 jam terakhir. Penggemar daerah sangat vokal di kolom komentar.`,
          actionableSteps: [
            `Tugaskan reporter lokal Surabaya/Jawa Timur untuk mendapatkan pernyataan eksklusif narasumber primer.`,
            `Sajikan infografis data komparatif yang merangkum rangkaian fakta kunci.`,
            `Gunakan fitur Story Polling untuk meningkatkan interaksi langsung tim redaktur dengan warga siber.`
          ],
          format: "Carousel Slide Komparatif & Story Polling"
        },
        {
          title: `Visualisasi Berita Kritis Perkotaan ${secondCategory}`,
          category: secondCategory,
          potentialReach: "Tinggi",
          confidence: "88%",
          reason: `Pengikut beritajatim merespons tinggi terhadap isu-isu krusial perkotaan di ${secondCategory}. Format audio visual terbukti meningkatkan rasio "Share" berita.`,
          actionableSteps: [
            `Rangkum kronologis kejadian secara obyektif dalam narasi video di bawah 45 detik.`,
            `Hadirkan kutipan langsung (quotes) dari pejabat daerah berwenang untuk mempertahankan prinsip berimbang.`,
            `Integrasikan infografis lokasi kejadian menggunakan pins peta/visual map.`
          ],
          format: "Video Reels Jurnalistik Pendek (<45 detik)"
        },
        {
          title: `Edukasi Hukum & Ketertiban Jatim`,
          category: "Kriminal",
          potentialReach: "Sedang",
          confidence: "78%",
          reason: `Kasus hukum di daerah Wonokromo/Polda Jatim memicu pembagian (shares) tinggi di WhatsApp, menandakan kepedulian audiens yang masif pada keamanan lingkungan mereka.`,
          actionableSteps: [
            `Sajikan ringkasan regulasi hukum dan ancaman pidana pelaku kejahatan siber/fisik secara tajam.`,
            `Ingatkan pembaca mengenai disiplin verifikasi berita palsu (hoaks).`,
            `Sematkan ajakan melaporkan aduan siber kepada pihak berwajib setempat.`
          ],
          format: "Satu Slide Infografis & Ringkasan Teks"
        }
      ]
    });
  }

  try {
    const serializedPosts = posts.map(p => ({
      caption: p.caption ? p.caption.substring(0, 160) + "..." : "",
      likes: p.likes || 0,
      comments: p.comments || 0,
      views: p.views || 0,
      engagementRate: p.engagementRate || 0,
      category: p.category || "Umum"
    }));

    const prompt = `Anda adalah Asisten Analisis Kecerdasan Siber Redaksi beritajatim.com yang berkedudukan di Surabaya, Jawa Timur.
Analisis data performa postingan Instagram berikut ini demi memberikan 3 rekomendasi taktis konten cerdas kepada tim redaktur.

Postingan Sebelumnya (Masing-masing dengan metrics performa):
${JSON.stringify(serializedPosts, null, 2)}

Berdasarkan data performa di atas, berikan analisis tren popularitas dan hasilkan rekomendasi konten terbaik yang berpotensi memiliki interaksi tinggi atau viral di Jawa Timur.
Format respons HARUS berupa objek JSON murni sesuai schema berikut ini:
1. executiveBriefing: Ringkasan narasi yang elegan serta berbobot jurnalisme siber mengenai peluang liputan terhangat dan performa tertinggi.
2. recommendations: Array berisi tepat 3 objek rekomendasi taktis, di mana masing-masing objek memiliki atribut:
   - title: Judul tema/topik liputan taktis yang disarankan (menggunakan istilah humas/jurnalistik berbobot).
   - category: Kategori berita target (Politik, Surabaya, Sidoarjo, Olahraga, Kriminal, atau Ekonomi).
   - potentialReach: Estimasi potensi viralitas (misal: 'Sangat Tinggi (Viral)', 'Tinggi', atau 'Sedang').
   - confidence: Tingkat kepercayaan sistem siber (misal: '94%').
   - reason: Alasan obyektif jurnalisme mengapa ide ini diangkat bersandarkan pada postingan performa tinggi sebelumnya.
   - actionableSteps: Daftar 3 poin langkah praktis yang harus dieksekusi tim reporter di lapangan.
   - format: Format visual yang paling optimal untuk tayangan Instagram.

Waspadai clickbait dan utamakan nilai kebenaran berita! Harap kembalikan HANYA respons JSON murni sesuai spesifikasi.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveBriefing: {
              type: Type.STRING,
              description: "Ringkasan analisis keseluruhan mengenai tren terkini dan saran taktis untuk Kepala Redaksi."
            },
            recommendations: {
              type: Type.ARRAY,
              description: "Daftar rekomendasi topik spesifik untuk memicu interaksi tinggi.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Judul rekomendasi konten taktis (Bahasa Indonesia)"
                  },
                  category: {
                    type: Type.STRING,
                    description: "Kategori target rekomendasi (Politik, Surabaya, Sidoarjo, Olahraga, Kriminal, atau Ekonomi)"
                  },
                  potentialReach: {
                    type: Type.STRING,
                    description: "Potensi jangkauan audiens (e.g., Sangat Tinggi (Viral), Tinggi, Sedang, Rendah)"
                  },
                  confidence: {
                    type: Type.STRING,
                    description: "Tingkat jaminan/keyakinan stat, dalam persen (misal: '92%')"
                  },
                  reason: {
                    type: Type.STRING,
                    description: "Justifikasi atau alasan logis jurnalisme mengapa ide ini direkomendasikan."
                  },
                  actionableSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Langkah-langkah konkrit dan sudut pandang peliputan untuk tim redaksi/reporter."
                  },
                  format: {
                    type: Type.STRING,
                    description: "Format visual yang paling optimal untuk tayangan Instagram."
                  }
                },
                required: ["title", "category", "potentialReach", "confidence", "reason", "actionableSteps", "format"]
              }
            }
          },
          required: ["executiveBriefing", "recommendations"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Teks respons kosong dari Gemini");
    }

    const recommendationData = JSON.parse(resultText.trim());
    return res.json({
      ...recommendationData,
      isAiPowered: true
    });

  } catch (error) {
    console.error("Gagal melakukan rekomendasi dengan Gemini:", error);
    return res.status(500).json({
      error: "Gagal berinteraksi dengan asisten AI rekomendasi",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Bootstaraping fullstack entry point or static build handlers
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // Setup Vite for development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK] Server beritajatim redaksi berjalan pada port ${PORT}`);
  });
}

bootstrap();
