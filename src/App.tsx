import { useState, useEffect } from "react";
import Papa from "papaparse";
import "./App.css";

interface Ders {
  Sınıf: string;
  Ders: string;
  Hoca: string;
  Saat: string;
}

export default function App() {
  const [dersler, setDersler] = useState<Ders[]>([]);
  const [seciliSinif, setSeciliSinif] = useState<string | null>(null);
  const [modalAcik, setModalAcik] = useState(false);
  const [loading, setLoading] = useState(false);

  // İlk açılışta CSV fetch
  useEffect(() => {
    fetchDersler();
  }, []);

  const fetchDersler = async () => {
    setLoading(true);
    try {
      const url =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvjmZv4KBVS3ExQ2Dhsc_18xHrMfzuAHk5afjdel9MXqLGjuxtU1rvs3VnpmjIxzj7Ngh-F49xa99t/pub?output=csv";
      const res = await fetch(url);
      const text = await res.text();

      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true }).data as any[];

      const data: Ders[] = parsed.map((d) => ({
        Sınıf: d["Sınıf"]?.trim().toUpperCase(),
        Ders: d["Ders"]?.trim(),
        Hoca: d["Hoca"]?.trim(),
        Saat: d["Saat"]?.trim(),
      }));

      setDersler(data);
    } catch (err) {
      console.error("CSV fetch hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sınıfları sayısal sıraya göre sırala
  const siniflar = Array.from(new Set(dersler.map((d) => d.Sınıf))).sort(
    (a, b) => {
      const na = parseInt(a?.match(/\d+/)?.[0] || "0", 10);
      const nb = parseInt(b?.match(/\d+/)?.[0] || "0", 10);
      if (na === nb) return a!.localeCompare(b!);
      return na - nb;
    }
  );

  // Sınıf seç → eski dersleri sıfırla, sonra seçilen sınıfı ayarla
  const secSinif = (sinif: string) => {
    setSeciliSinif(null);   // eski veriyi temizle
    setTimeout(() => {       // UI hemen temizlenmiş olacak
      setSeciliSinif(sinif.trim().toUpperCase());
    }, 50); // çok kısa bir gecikme, F5 hissi
    setModalAcik(false);
  };

  const gorunenDersler = seciliSinif
    ? dersler.filter((d) => d.Sınıf === seciliSinif)
    : [];

  return (
    <div className="page">
      <div className="app">
        <h1 className="baslik">📚 Haftalık Ders Programı</h1>

        <button className="sec-btn" onClick={() => setModalAcik(true)}>
          {seciliSinif ? seciliSinif : "Sınıf Seç"}
        </button>

        {modalAcik && (
          <div className="modal-backdrop" onClick={() => setModalAcik(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Sınıf Seç</h2>
              <ul>
                {siniflar.map((s) => (
                  <li key={s} onClick={() => secSinif(s)}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {loading && <div style={{ marginTop: 10 }}>📡 Veriler yükleniyor...</div>}

        {seciliSinif && !loading && (
          <div className="ders-listesi">
            <h2>{seciliSinif} Sınıfı</h2>
            <ul>
              {gorunenDersler.map((d, i) => (
                <li key={i} className="ders-item">
                  <span className="ders-name">{d.Ders}</span>
                  <span className="ders-info">
                    {d.Hoca} - {d.Saat}
                  </span>
                </li>
              ))}
              {gorunenDersler.length === 0 && (
                <li className="ders-item">Bu sınıf için ders bulunamadı.</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
