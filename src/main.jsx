import { DB } from "./db";
import ReactDOM from "react-dom/client";
import { useState, useEffect, useCallback, useRef } from "react";

// ─── State is now backed by Supabase (see src/db.js) ───────────
// STORE kept for loggedInWorker session only
const STORE = { loggedInWorker: null };

// ─── Helpers ──────────────────────────────────────────────────────
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const formatDate = (s) => { const [y,m,d] = s.split("-"); return `${y}年${+m}月${+d}日`; };
const weekday = (s) => ["日","月","火","水","木","金","土"][new Date(s).getDay()];
const getMonthOptions = () => {
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    months.push({ value: val, label: `${d.getFullYear()}年${d.getMonth()+1}月` });
  }
  return months;
};

// ─── Icons ────────────────────────────────────────────────────────
const Icon = ({ d: path, size = 20, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {typeof path === "string" ? <path d={path} /> : path}
  </svg>
);

const Icons = {
  hardHat: <Icon d={<><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 15V6a2 2 0 0 1 4 0v9"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/></>} size={24} />,
  clipboard: <Icon d={<><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></>} />,
  users: <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />,
  check: <Icon d={<polyline points="20 6 9 17 4 12"/>} sw={2.5} />,
  arrowLeft: <Icon d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>} />,
  chevronRight: <Icon d={<polyline points="9 18 15 12 9 6"/>} size={18} />,
  chevronDown: <Icon d={<polyline points="6 9 12 15 18 9"/>} size={14} sw={2.5} />,
  filter: <Icon d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>} size={18} />,
  download: <Icon d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} size={18} />,
  settings: <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />,
  plus: <Icon d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} size={18} />,
  trash: <Icon d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>} size={16} />,
  user: <Icon d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  logOut: <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} size={18} />,
  car: <Icon d={<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.4A2 2 0 0 0 13.8 6H10"/><path d="M6 17H4a2 2 0 0 1-2-2v-3c0-.9.7-1.7 1.5-1.9L6 10l2.7-3.4A2 2 0 0 1 10.2 6H14"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>} size={18} />,
  lock: <Icon d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} size={18} />,
};

// ─── Shared Styles ────────────────────────────────────────────────
const FONT = "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif";
const BRAND = {
  name: "WAY合同会社",
  system: "WAY合同会社 出勤管理システム",
  logoSrc: "/way-logo.png",
};
const THEME = {
  midnight: "#040b14",
  navy: "#071525",
  navy2: "#0a1c30",
  panel: "#0c2138",
  panel2: "#102a46",
  line: "rgba(226, 184, 89, 0.18)",
  lineStrong: "rgba(226, 184, 89, 0.36)",
  gold: "#d8aa4a",
  gold2: "#f0cf78",
  goldDark: "#a97720",
  text: "#f8fafc",
  textSoft: "#d7e1ec",
  muted: "#8fa3b8",
  muted2: "#60758c",
  danger: "#ef4444",
  success: "#34d399",
  blue: "#5fb3e6",
};

const formatDbError = (prefix, error) => {
  const message = error?.message || error?.details || error?.hint || "";
  const code = error?.code ? ` / ${error.code}` : "";
  if (/row-level security|permission denied|42501/i.test(message + code)) {
    return `${prefix} SupabaseのRLS/権限で拒否されています。workersテーブルにSELECT/INSERT許可を追加してください。${code}`;
  }
  if (/invalid api key|jwt|apikey/i.test(message)) {
    return `${prefix} SupabaseのAPIキー設定を確認してください。`;
  }
  if (/failed to fetch|network|invalid url|supabaseurl|your_url/i.test(message)) {
    return `${prefix} SupabaseのURLまたはVercel環境変数を確認してください。`;
  }
  return message ? `${prefix} ${message}${code}` : prefix;
};

const inputBase = {
  width: "100%", padding: "15px 16px", borderRadius: 8, fontSize: 15,
  background: "rgba(7, 21, 37, 0.88)", border: `1.5px solid ${THEME.line}`,
  color: THEME.text, outline: "none", fontFamily: FONT, transition: "border 0.2s, box-shadow 0.2s, background 0.2s",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};
const selectBase = {
  ...inputBase, appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(240,207,120,0.9)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
};
const adminFilterSelect = {
  padding: "10px 30px 10px 12px", borderRadius: 8, fontSize: 13,
  background: "rgba(7, 21, 37, 0.92)", border: `1px solid ${THEME.line}`,
  color: THEME.textSoft, fontFamily: FONT, appearance: "none", cursor: "pointer",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(240,207,120,0.9)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
};
const tdStyle = {
  padding: "9px 8px", fontSize: 13, color: THEME.textSoft,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap');
  @keyframes fadeDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { width: 100%; max-width: 100vw; overflow-x: hidden; }
  body { margin: 0; background: ${THEME.midnight}; color: ${THEME.text}; }
  input, select, textarea, button { box-sizing: border-box !important; max-width: 100% !important; font-size: 16px !important; }
  input[type="date"], input[type="number"] { min-width: 0 !important; -webkit-appearance: none !important; appearance: none !important; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
  ::-webkit-scrollbar-thumb { background: rgba(216,170,74,0.32); border-radius: 3px; }
  input::placeholder, textarea::placeholder { color: rgba(215,225,236,0.45); }
  option { background: ${THEME.navy}; color: ${THEME.text}; }
  input:focus, select:focus, textarea:focus { border-color: rgba(240,207,120,0.72) !important; box-shadow: 0 0 0 3px rgba(216,170,74,0.12) !important; }
  button { -webkit-tap-highlight-color: transparent; }
  .way-screen {
    min-height: 100vh;
    background:
      radial-gradient(circle at 16% -10%, rgba(240,207,120,0.22), transparent 32%),
      radial-gradient(circle at 100% 12%, rgba(95,179,230,0.12), transparent 28%),
      linear-gradient(145deg, ${THEME.midnight} 0%, ${THEME.navy} 48%, #03101e 100%);
    color: ${THEME.text};
    position: relative;
    overflow-x: hidden;
  }
  .way-screen::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.28;
    background-image:
      linear-gradient(120deg, transparent 0%, transparent 36%, rgba(240,207,120,0.20) 36.2%, transparent 37.2%),
      linear-gradient(120deg, transparent 0%, transparent 61%, rgba(240,207,120,0.12) 61.15%, transparent 62%),
      repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 96px),
      repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 96px);
  }
  .way-layer { position: relative; z-index: 1; }
  .way-scroll { scrollbar-color: rgba(216,170,74,0.45) rgba(255,255,255,0.04); }
  .way-table-wrap table { width: 100%; }
  .way-table-wrap th, .way-table-wrap td { white-space: nowrap; }
  @media (max-width: 720px) {
    .way-login-shell { padding: 28px 16px !important; justify-content: flex-start !important; }
    .way-login-card { max-width: 100% !important; }
    .way-brand-title { font-size: 24px !important; line-height: 1.25 !important; }
    .way-admin-stats { display: grid !important; grid-template-columns: repeat(3, minmax(140px, 1fr)) !important; }
    .way-header-title { font-size: 16px !important; }
    .way-admin-main { padding-left: 14px !important; padding-right: 14px !important; }
    .way-filterbar { overflow-x: auto !important; flex-wrap: nowrap !important; padding-bottom: 6px !important; }
    .way-tabs { overflow-x: auto !important; padding-bottom: 4px !important; }
  }
`;

function LogoMark({ size = 58, compact = false }) {
  const [logoOk, setLogoOk] = useState(true);
  return (
    <div style={{
      width: size, height: size, borderRadius: compact ? 8 : 12,
      background: "linear-gradient(145deg, rgba(240,207,120,0.24), rgba(216,170,74,0.08))",
      border: `1px solid ${THEME.lineStrong}`,
      boxShadow: "0 16px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: THEME.gold2, flexShrink: 0, overflow: "hidden",
    }}>
      {logoOk ? (
        <img
          src={BRAND.logoSrc}
          alt={`${BRAND.name} ロゴ`}
          onError={() => setLogoOk(false)}
          style={{ width: "78%", height: "78%", objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: compact ? 12 : 15, fontWeight: 800, letterSpacing: 0 }}>WAY</span>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("splash");
  const [records, setRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loggedInWorker, setLoggedInWorker] = useState(STORE.loggedInWorker);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workerLoadError, setWorkerLoadError] = useState("");

  const loadWorkers = async () => {
    try {
      const nextWorkers = await DB.getWorkers();
      setWorkers(nextWorkers);
      setWorkerLoadError("");
      return nextWorkers;
    } catch (error) {
      console.error("workers reload error:", error);
      setWorkerLoadError(formatDbError("作業員マスタを読み込めませんでした。", error));
      return null;
    }
  };

  const reload = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    const [wResult, sResult, rResult] = await Promise.allSettled([DB.getWorkers(), DB.getSites(), DB.getRecords()]);
    if (wResult.status === "fulfilled") setWorkers(wResult.value);
    if (sResult.status === "fulfilled") setSites(sResult.value);
    if (rResult.status === "fulfilled") setRecords(rResult.value);

    if (wResult.status === "rejected") {
      console.error("workers reload error:", wResult.reason);
      setWorkerLoadError(formatDbError("作業員マスタを読み込めませんでした。", wResult.reason));
    } else {
      setWorkerLoadError("");
    }
    if (sResult.status === "rejected") console.warn("sites reload error:", sResult.reason);
    if (rResult.status === "rejected") console.warn("records reload error:", rResult.reason);
    if (showLoading) setLoading(false);
    return {
      workers: wResult.status === "fulfilled" ? wResult.value : workers,
      sites: sResult.status === "fulfilled" ? sResult.value : sites,
      records: rResult.status === "fulfilled" ? rResult.value : records,
    };
  };
  useEffect(() => { reload({ showLoading: true }); }, []);

  const syncWorkers = async (w) => { setWorkers(w); };
  const syncSites = async (s) => { setSites(s); };

  const addRecord = async (rec) => {
    const dup = await DB.checkDuplicate(rec.name, rec.date);
    if (dup) return "duplicate";
    // quantity値ごとのラベル (-6 = 夜勤)
    const label = rec.quantity === -2 ? "休日"
      : rec.quantity === -1 ? "休工（天候）"
      : rec.quantity === -3 ? "休工（現場都合）"
      : rec.quantity === -4 ? "予定欠勤"
      : rec.quantity === -5 ? "打合せ"
      : rec.quantity === -6 ? "夜勤"
      : "";
    const isWorkQty = rec.quantity > 0 || rec.quantity === -6;
    await DB.addRecord({
      worker_name: rec.name, date: rec.date,
      site_name: (rec.quantity < 0 && rec.quantity !== -5 && rec.quantity !== -6) ? (rec.site || label) : rec.site,
      quantity: rec.quantity,
      content: (rec.quantity < 0 && rec.quantity !== -5 && rec.quantity !== -6) ? (rec.content || label) : rec.content,
      distance: Number(rec.distance) || 0,
      overtime: isWorkQty ? (Number(rec.overtime) || 0) : 0,
      note: rec.note || "",
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    reload();
    return "ok";
  };

  // 一括登録
  const addBulkRecords = async (workerNames, date, quantity, overwrite = false) => {
    const label = quantity === -2 ? "休日"
      : quantity === -1 ? "休工（天候）"
      : quantity === -3 ? "休工（現場都合）"
      : quantity === -4 ? "予定欠勤"
      : quantity === -5 ? "打合せ"
      : quantity === -6 ? "夜勤"
      : "";
    let added = 0, skipped = 0, overwritten = 0;
    for (const name of workerNames) {
      try {
        const dup = await DB.checkDuplicate(name, date);
        if (dup && !overwrite) { skipped++; continue; }
        if (dup && overwrite) {
          const existing = records.find(r => r.worker_name === name && r.date === date);
          if (existing) await DB.delRecord(existing.id);
          overwritten++;
        }
        await DB.addRecord({
          worker_name: name, date, site_name: label,
          quantity, content: label, distance: 0, note: "",
        });
        added++;
      } catch (e) {
        console.error("bulk add error:", name, e);
        skipped++;
      }
    }
    await reload();
    return { added, skipped, overwritten };
  };

  const handleLogin = (name) => { STORE.loggedInWorker = name; setLoggedInWorker(name); setMode("worker"); };
  const handleLogout = () => { STORE.loggedInWorker = null; setLoggedInWorker(null); setMode("splash"); reload(); };

  if (loading && mode === "splash") return <div className="way-screen" style={{display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}><div className="way-layer" style={{textAlign:"center",color:THEME.gold2,fontSize:14,fontWeight:700,letterSpacing:"0.08em"}}>読み込み中...</div><style>{CSS}</style></div>;
  if (mode === "splash") return <SplashScreen onSelect={setMode} workers={workers} onLogin={handleLogin} onRefresh={loadWorkers} workerLoadError={workerLoadError} />;
  if (mode === "settings") return <SettingsPage onBack={async () => { await reload(); setMode("splash"); }} workers={workers} sites={sites} onUpdateWorkers={syncWorkers} onUpdateSites={syncSites} />;
  if (mode === "worker") return <WorkerView onBack={handleLogout} onSubmit={addRecord} submitted={submitted} workerName={loggedInWorker} sites={sites} onGoAdmin={() => { reload(); setMode("admin"); }} />;
  return <AdminView onBack={() => setMode("splash")} records={records} workers={workers} sites={sites} onRefresh={reload} onBulkAdd={addBulkRecords} />;
}

// ─── Splash / Role Select ─────────────────────────────────────────
function SplashScreen({ onSelect, workers, onLogin, onRefresh, workerLoadError }) {
  return (
    <div className="way-screen way-login-shell" style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: FONT, padding: "36px 22px",
    }}>
      <div className="way-layer way-login-card" style={{
        width: "100%", maxWidth: 420, padding: "30px 24px 24px", borderRadius: 8,
        background: "linear-gradient(180deg, rgba(12,33,56,0.92), rgba(4,11,20,0.88))",
        border: `1px solid ${THEME.line}`,
        boxShadow: "0 24px 80px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.07)",
        animation: "fadeUp 0.55s ease-out",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 28 }}>
          <LogoMark size={74} />
          <h1 className="way-brand-title" style={{ color: THEME.text, fontSize: 28, fontWeight: 800, margin: "18px 0 6px", letterSpacing: 0, lineHeight: 1.32 }}>
            <span style={{ display: "block" }}>{BRAND.name}</span>
            <span style={{ display: "block" }}>出勤管理システム</span>
          </h1>
          <p style={{ color: THEME.gold2, fontSize: 12, margin: 0, letterSpacing: "0.14em", fontWeight: 700 }}>INTERNAL ATTENDANCE SYSTEM</p>
          <p style={{ color: THEME.muted, fontSize: 13, margin: "14px 0 0", lineHeight: 1.7 }}>現場作業の出勤入力と管理を、スマートに。</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        <WorkerLoginCard workers={workers} onLogin={onLogin} onRefresh={onRefresh} workerLoadError={workerLoadError} />
        <RoleCard icon={Icons.users} title="事務員" desc="記録一覧・集計ダッシュボード" color={THEME.blue} onClick={() => onSelect("admin")} delay="0.25s" />
        <RoleCard icon={Icons.settings} title="設定" desc="作業員・現場マスタ管理" color={THEME.gold} onClick={() => onSelect("settings")} delay="0.4s" />
        </div>
      </div>
      <style>{CSS}</style>
    </div>
  );
}

function WorkerLoginCard({ workers, onLogin, onRefresh, workerLoadError }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [hover, setHover] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selected && !workers.includes(selected)) setSelected("");
  }, [selected, workers]);

  const refreshWorkers = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => { setOpen(true); refreshWorkers(); }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "center", gap: 16, padding: "20px 22px",
          background: hover ? "rgba(216,170,74,0.12)" : "rgba(7,21,37,0.78)",
          border: `1px solid ${hover ? THEME.lineStrong : "rgba(255,255,255,0.08)"}`,
          borderRadius: 8, cursor: "pointer", transition: "all 0.25s",
          animation: "fadeUp 0.5s ease-out 0.15s both",
          transform: hover ? "translateY(-2px)" : "none",
          boxShadow: hover ? "0 16px 38px rgba(216,170,74,0.12)" : "0 1px 0 rgba(255,255,255,0.04) inset",
        }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(216,170,74,0.14)", color: THEME.gold2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${THEME.line}` }}>
          {Icons.clipboard}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ color: THEME.text, fontSize: 18, fontWeight: 800 }}>作業員ログイン</div>
          <div style={{ color: THEME.muted, fontSize: 13, marginTop: 2 }}>名前を選択して出勤入力</div>
        </div>
        <span style={{ marginLeft: "auto", color: THEME.gold2, opacity: hover ? 1 : 0.55, transition: "all 0.25s", transform: hover ? "translateX(3px)" : "none", display: "flex" }}>
          {Icons.chevronRight}
        </span>
      </button>
    );
  }

  return (
    <div style={{
      padding: "22px", borderRadius: 8,
      background: "rgba(7,21,37,0.88)", border: `1px solid ${THEME.line}`,
      animation: "fadeIn 0.3s ease-out",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(216,170,74,0.14)", color: THEME.gold2, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${THEME.line}` }}>
          {Icons.user}
        </div>
        <div>
          <div style={{ color: THEME.text, fontSize: 16, fontWeight: 800 }}>作業員ログイン</div>
          <div style={{ color: THEME.muted, fontSize: 12 }}>名前を選択してください</div>
        </div>
      </div>

      <div className="way-scroll" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto", marginBottom: 16 }}>
        {refreshing && (
          <div style={{ padding: "14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: THEME.gold2, fontSize: 13, fontWeight: 700, textAlign: "center" }}>
            作業員マスタを更新中...
          </div>
        )}
        {!refreshing && workerLoadError && (
          <div style={{ padding: "14px", borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#fca5a5", fontSize: 13, lineHeight: 1.6, fontWeight: 700 }}>
            {workerLoadError}
          </div>
        )}
        {!refreshing && !workerLoadError && workers.length === 0 && (
          <div style={{ padding: "14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: THEME.muted, fontSize: 13, lineHeight: 1.6 }}>
            作業員がまだ読み込まれていません。設定で登録後、下の更新ボタンを押してください。
          </div>
        )}
        {workers.map((w) => (
          <button key={w} onClick={() => setSelected(w)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            borderRadius: 8, border: selected === w ? `1.5px solid ${THEME.gold}` : "1.5px solid rgba(255,255,255,0.08)",
            background: selected === w ? "rgba(216,170,74,0.14)" : "rgba(255,255,255,0.04)",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: selected === w ? "rgba(216,170,74,0.22)" : "rgba(255,255,255,0.06)",
              color: selected === w ? THEME.gold2 : THEME.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, transition: "all 0.15s",
            }}>{w.charAt(0)}</div>
            <span style={{ color: selected === w ? THEME.text : THEME.textSoft, fontSize: 14, fontWeight: selected === w ? 700 : 500 }}>
              {w}
            </span>
            {selected === w && <span style={{ marginLeft: "auto", color: THEME.gold2, display: "flex" }}>{Icons.check}</span>}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setOpen(false)} style={{
          flex: 1, padding: "13px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)", color: THEME.textSoft, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: FONT,
        }}>戻る</button>
        {!selected && (
          <button onClick={refreshWorkers} disabled={refreshing} style={{
            flex: 1.2, padding: "13px", borderRadius: 8, border: `1px solid ${THEME.line}`,
            background: "rgba(216,170,74,0.10)", color: THEME.gold2, cursor: refreshing ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 800, fontFamily: FONT,
          }}>更新</button>
        )}
        <button onClick={() => selected && onLogin(selected)} disabled={!selected || refreshing} style={{
          flex: 2, padding: "13px", borderRadius: 8, border: "none", cursor: selected && !refreshing ? "pointer" : "not-allowed",
          background: selected && !refreshing ? `linear-gradient(135deg, ${THEME.gold2}, ${THEME.gold})` : "rgba(255,255,255,0.08)",
          color: selected ? "#08111d" : THEME.muted2, fontSize: 14, fontWeight: 800, fontFamily: FONT,
          boxShadow: selected && !refreshing ? "0 10px 28px rgba(216,170,74,0.25)" : "none",
        }}>ログイン</button>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, color, onClick, delay }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 16, padding: "20px 22px",
        background: hover ? "rgba(255,255,255,0.08)" : "rgba(7,21,37,0.64)",
        border: `1px solid ${hover ? color + "66" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 8, cursor: "pointer", transition: "all 0.25s",
        animation: `fadeUp 0.5s ease-out ${delay} both`,
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? `0 16px 38px ${color}18` : "0 1px 0 rgba(255,255,255,0.04) inset",
      }}>
      <div style={{ width: 48, height: 48, borderRadius: 8, background: `${color}18`, color, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ textAlign: "left" }}>
        <div style={{ color: THEME.text, fontSize: 18, fontWeight: 800 }}>{title}</div>
        <div style={{ color: THEME.muted, fontSize: 13, marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{ marginLeft: "auto", color, opacity: hover ? 1 : 0.4, transition: "all 0.25s", transform: hover ? "translateX(3px)" : "none", display: "flex" }}>
        {Icons.chevronRight}
      </span>
    </button>
  );
}

// ─── Worker View ──────────────────────────────────────────────────
function WorkerView({ onBack, onSubmit, submitted, workerName, sites, onGoAdmin }) {
  const [form, setForm] = useState({ date: today(), site: "", quantity: 1, content: "", distance: "", overtime: "", note: "" });
  const [dupError, setDupError] = useState(false);
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => { setForm((p) => ({ ...p, [k]: typeof e === "object" ? e.target.value : e })); setDupError(false); };

  const handleSubmit = async () => {
    if (form.quantity > 0 && !form.site) return;
    if (form.quantity === -5 && !form.site) return;
    if (form.quantity === -6 && !form.site) return;
    if (sending) return;
    setSending(true);
    const result = await onSubmit({ ...form, name: workerName });
    if (result === "duplicate") {
      setDupError(true);
      setSending(false);
      return;
    }
    setForm((p) => ({ ...p, site: "", content: "", distance: "", overtime: "", note: "", quantity: 1 }));
    setSending(false);
  };

  const valid = !sending && (
    (form.quantity > 0 && form.site) ||
    form.quantity === 0 ||
    (form.quantity === -5 && form.site) ||
    (form.quantity === -6 && form.site) ||
    (form.quantity < 0 && form.quantity !== -5 && form.quantity !== -6)
  );

  const isMeeting = form.quantity === -5;
  const isNight = form.quantity === -6;
  const isOffDay = form.quantity < 0 && form.quantity !== -5 && form.quantity !== -6;

  return (
    <div className="way-screen" style={{ fontFamily: FONT }}>
      {/* Header */}
      <div className="way-layer" style={{
        background: "rgba(4,11,20,0.82)", borderBottom: `1px solid ${THEME.line}`,
        padding: "13px 18px", display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)",
      }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: THEME.gold2, cursor: "pointer", padding: 9, display: "flex" }}>
          {Icons.logOut}
        </button>
        <LogoMark size={38} compact />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="way-header-title" style={{ color: THEME.text, fontSize: 17, fontWeight: 800, margin: 0 }}>{BRAND.name}</h2>
          <div style={{ color: THEME.muted, fontSize: 11, marginTop: 2 }}>出勤入力</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(216,170,74,0.13)", padding: "7px 12px", borderRadius: 8,
          border: `1px solid ${THEME.line}`,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, background: "rgba(216,170,74,0.24)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: THEME.gold2, fontSize: 12, fontWeight: 800,
          }}>{workerName.charAt(0)}</div>
          <span style={{ color: THEME.text, fontSize: 13, fontWeight: 700 }}>{workerName}</span>
        </div>
      </div>

      {/* Success toast */}
      {submitted && (
        <div style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #35d49d, #0fa36c)", color: "#03110d", padding: "12px 28px", borderRadius: 8,
          fontSize: 14, fontWeight: 600, zIndex: 100, boxShadow: "0 8px 32px rgba(16,185,129,0.3)",
          display: "flex", alignItems: "center", gap: 8, animation: "fadeDown 0.3s ease-out",
        }}>
          {Icons.check} 送信完了しました
        </div>
      )}

      <div className="way-layer" style={{ padding: "24px 18px 40px", maxWidth: 500, margin: "0 auto" }}>
        {/* Date Card */}
        <div style={{
          padding: "17px 18px", borderRadius: 8, marginBottom: 24,
          background: "linear-gradient(135deg, rgba(16,42,70,0.92), rgba(7,21,37,0.92))", border: `1px solid ${THEME.line}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 18px 45px rgba(0,0,0,0.20)",
        }}>
          <div>
            <div style={{ color: THEME.gold2, fontSize: 11, fontWeight: 700, marginBottom: 4, letterSpacing: "0.08em" }}>DATE</div>
            <div style={{ color: THEME.text, fontSize: 18, fontWeight: 800 }}>{formatDate(form.date)}（{weekday(form.date)}）</div>
          </div>
          <input type="date" value={form.date} onChange={set("date")} style={{
            ...inputBase, width: "auto", minWidth: 145, padding: "10px 12px", fontSize: 13, borderRadius: 8,
          }} />
        </div>

        <Field label="出勤区分" required>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              {v:1,l:"1日"},{v:0.5,l:"半日"},{v:0,l:"欠勤"},
              {v:-4,l:"予定欠"},{v:"kyuko",l:"休工"},{v:-2,l:"休日"},
              {v:-5,l:"打合せ"},{v:-6,l:"夜勤"},
            ].map((o) => {
              const isKyuko = o.v === "kyuko";
              const isActive = isKyuko ? (form.quantity === -1 || form.quantity === -3) : form.quantity === o.v;
              const accentColor = isKyuko ? "#8b5cf6"
                : o.v === -2 ? "#6b7280"
                : o.v === -4 ? "#f97316"
                : o.v === -5 ? "#0ea5e9"
                : o.v === -6 ? "#1e40af"
                : "#e99625";
              return (
                <button key={String(o.v)} onClick={() => {
                  if (isKyuko) { set("quantity")(-1); }
                  else { set("quantity")(o.v); }
                }} style={{
                  padding: "15px 4px", borderRadius: 8, cursor: "pointer",
                  fontSize: 15, fontWeight: 700, transition: "all 0.2s", fontFamily: FONT,
                  border: isActive ? `2px solid ${accentColor}` : "2px solid rgba(255,255,255,0.08)",
                  background: isActive ? `${accentColor}20` : "rgba(255,255,255,0.045)",
                  color: isActive ? accentColor : THEME.textSoft,
                }}>
                  {o.l}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 休工サブ選択 */}
        {(form.quantity === -1 || form.quantity === -3) && (
          <Field label="休工の理由">
            <div style={{ display: "flex", gap: 10 }}>
              {[{v:-1,l:"天候（雨など）",icon:"🌧️",c:"#8b5cf6"},{v:-3,l:"現場都合",icon:"🚧",c:"#ea8c1c"}].map((o) => (
                <button key={o.v} onClick={() => set("quantity")(o.v)} style={{
                  flex: 1, padding: "14px 12px", borderRadius: 8, cursor: "pointer",
                  fontSize: 14, fontWeight: 700, transition: "all 0.2s", fontFamily: FONT,
                  border: form.quantity === o.v ? `2px solid ${o.c}` : "2px solid rgba(255,255,255,0.08)",
                  background: form.quantity === o.v ? `${o.c}20` : "rgba(255,255,255,0.045)",
                  color: form.quantity === o.v ? o.c : THEME.textSoft,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {o.icon} {o.l}
                </button>
              ))}
            </div>
          </Field>
        )}

        {isOffDay ? (
          <div style={{
            padding: "16px 20px", borderRadius: 8, marginBottom: 20,
            background: form.quantity === -1 ? "rgba(139,92,246,0.12)" : form.quantity === -3 ? "rgba(234,140,28,0.12)" : form.quantity === -4 ? "rgba(249,115,22,0.12)" : "rgba(107,114,128,0.12)",
            border: `1px solid ${form.quantity === -1 ? "rgba(139,92,246,0.25)" : form.quantity === -3 ? "rgba(234,140,28,0.25)" : form.quantity === -4 ? "rgba(249,115,22,0.25)" : "rgba(107,114,128,0.25)"}`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{form.quantity === -1 ? "🌧️" : form.quantity === -3 ? "🚧" : form.quantity === -4 ? "📝" : "📅"}</div>
            <div style={{ color: form.quantity === -1 ? "#8b5cf6" : form.quantity === -3 ? "#ea8c1c" : form.quantity === -4 ? "#f97316" : "#6b7280", fontSize: 15, fontWeight: 700 }}>
              {form.quantity === -1 ? "休工（天候）" : form.quantity === -3 ? "休工（現場都合）" : form.quantity === -4 ? "予定欠勤" : "休日（指定休み）"}
            </div>
            <div style={{ color: THEME.muted, fontSize: 12, marginTop: 4 }}>現場名・作業内容の入力は不要です</div>
          </div>
        ) : isMeeting ? (
          <>
            <div style={{
              padding: "16px 20px", borderRadius: 8, marginBottom: 20,
              background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>⭐</div>
              <div style={{ color: "#0ea5e9", fontSize: 15, fontWeight: 700 }}>打合せ</div>
              <div style={{ color: THEME.muted, fontSize: 12, marginTop: 4 }}>現場名を選択し、作業内容を入力してください</div>
            </div>
            <Field label="現場名" required>
              <select value={form.site} onChange={set("site")} style={selectBase}>
                <option value="">選択してください</option>
                {sites.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="作業内容">
              <input type="text" value={form.content} onChange={set("content")} placeholder="例：施工打合せ、見積り確認" style={inputBase} />
            </Field>
            <Field label="車の距離数（km）">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd" }}>{Icons.car}</span>
                <input type="number" value={form.distance} onChange={set("distance")} placeholder="0" style={{ ...inputBase, paddingLeft: 42 }} />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd", fontSize: 14 }}>km</span>
              </div>
            </Field>
          </>
        ) : isNight ? (
          <>
            <div style={{
              padding: "16px 20px", borderRadius: 8, marginBottom: 20,
              background: "rgba(30,64,175,0.18)", border: "1px solid rgba(95,179,230,0.25)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🌙</div>
              <div style={{ color: "#1e40af", fontSize: 15, fontWeight: 700 }}>夜勤</div>
              <div style={{ color: THEME.muted, fontSize: 12, marginTop: 4 }}>現場名を選択し、作業内容を入力してください（1人工としてカウントします）</div>
            </div>
            <Field label="現場名" required>
              <select value={form.site} onChange={set("site")} style={selectBase}>
                <option value="">選択してください</option>
                {sites.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="作業内容">
              <input type="text" value={form.content} onChange={set("content")} placeholder="例：夜間工事、夜間警備" style={inputBase} />
            </Field>
            <Field label="車の距離数（km）">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd" }}>{Icons.car}</span>
                <input type="number" value={form.distance} onChange={set("distance")} placeholder="0" style={{ ...inputBase, paddingLeft: 42 }} />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd", fontSize: 14 }}>km</span>
              </div>
            </Field>
            <Field label="残業時間（任意）">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd", fontSize: 17 }}>⏱</span>
                <input type="number" inputMode="decimal" step="0.5" min="0" value={form.overtime} onChange={set("overtime")} placeholder="0" style={{ ...inputBase, paddingLeft: 42 }} />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd", fontSize: 14 }}>時間</span>
              </div>
            </Field>
          </>
        ) : (
          <>
            <Field label="現場名" required>
              <select value={form.site} onChange={set("site")} style={selectBase}>
                <option value="">選択してください</option>
                {sites.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="作業内容">
              <input type="text" value={form.content} onChange={set("content")} placeholder="例：型枠組立、鉄筋組立" style={inputBase} />
            </Field>
            <Field label="車の距離数（km）">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd" }}>{Icons.car}</span>
                <input type="number" value={form.distance} onChange={set("distance")} placeholder="0" style={{ ...inputBase, paddingLeft: 42 }} />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd", fontSize: 14 }}>km</span>
              </div>
            </Field>
            <Field label="残業時間（任意）">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd", fontSize: 17 }}>⏱</span>
                <input type="number" inputMode="decimal" step="0.5" min="0" value={form.overtime} onChange={set("overtime")} placeholder="0" style={{ ...inputBase, paddingLeft: 42 }} />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#b0b5bd", fontSize: 14 }}>時間</span>
              </div>
            </Field>
          </>
        )}

        <Field label="備考">
          <textarea value={form.note} onChange={set("note")} placeholder="連絡事項があれば記入" rows={3} style={{ ...inputBase, resize: "vertical", minHeight: 80 }} />
        </Field>

        {dupError && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", fontSize: 14, fontWeight: 700, textAlign: "center", marginTop: 8 }}>
            ⚠️ {formatDate(form.date)}はすでに入力済みです。<br/><span style={{ fontSize: 12, fontWeight: 400, color: THEME.muted }}>修正が必要な場合は事務員にご連絡ください。</span>
          </div>
        )}
        <button onClick={handleSubmit} disabled={!valid} style={{
          width: "100%", padding: "18px", borderRadius: 8, border: "none", fontFamily: FONT,
          cursor: valid ? "pointer" : "not-allowed",
          background: valid ? `linear-gradient(135deg, ${THEME.gold2}, ${THEME.gold})` : "rgba(255,255,255,0.08)",
          color: valid ? "#071525" : THEME.muted2, fontSize: 16, fontWeight: 800,
          marginTop: 8, transition: "all 0.3s",
          boxShadow: valid ? "0 14px 36px rgba(216,170,74,0.30)" : "none",
        }}>{sending ? "送信中..." : "出勤を送信する"}</button>

        <button onClick={onGoAdmin} style={{
          width: "100%", padding: "15px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.045)", color: THEME.textSoft, fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: FONT, marginTop: 12,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>{Icons.clipboard} 出勤表管理へ</button>
      </div>
      <style>{CSS}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, color: THEME.textSoft, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        {label}
        {required && <span style={{ color: THEME.gold2, fontSize: 11 }}>必須</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Admin View ───────────────────────────────────────────────────
function AdminView({ onBack, records, workers, sites, onRefresh, onBulkAdd }) {
  const [filterWorker, setFilterWorker] = useState("all");
  const [filterSite, setFilterSite] = useState("all");
  const [filterMonth, setFilterMonth] = useState(() => today().slice(0, 7));
  const [filterDate, setFilterDate] = useState("all");
  const [tab, setTab] = useState("calendar");

  const filtered = records.filter((r) => {
    if (filterWorker !== "all" && r.worker_name !== filterWorker) return false;
    if (filterSite !== "all" && r.site_name !== filterSite) return false;
    if (r.date.slice(0, 7) !== filterMonth) return false;
    return true;
  });

  const listFiltered = filterDate === "all" ? filtered : filtered.filter(r => r.date === filterDate);

  const uniqueWorkers = [...new Set(records.map((r) => r.worker_name))].sort();
  const uniqueSites = [...new Set(records.map((r) => r.site_name))].sort();
  const uniqueDates = [...new Set(filtered.map(r => r.date))].sort().reverse();

  const workerSummary = {};
  filtered.forEach((r) => {
    // 夜勤(-6)は1人工としてカウント、打合せ(-5)はカウントしない
    const qty = r.quantity === -6 ? 1 : r.quantity;
    if (qty <= 0) return;
    if (!workerSummary[r.worker_name]) workerSummary[r.worker_name] = { days: 0, distance: 0, overtime: 0, sites: new Set() };
    workerSummary[r.worker_name].days += qty;
    workerSummary[r.worker_name].distance += Number(r.distance) || 0;
    workerSummary[r.worker_name].overtime += Number(r.overtime) || 0;
    workerSummary[r.worker_name].sites.add(r.site_name);
  });

  const siteSummary = {};
  filtered.forEach((r) => {
    const qty = r.quantity === -6 ? 1 : r.quantity;
    if (qty <= 0) return;
    if (!siteSummary[r.site_name]) siteSummary[r.site_name] = { days: 0, workers: new Set() };
    siteSummary[r.site_name].days += qty;
    siteSummary[r.site_name].workers.add(r.worker_name);
  });

  // のべ人工数：夜勤は1人工、打合せは0
  const totalManDays = filtered.reduce((s, r) => {
    if (r.quantity === -6) return s + 1;
    return s + (r.quantity > 0 ? r.quantity : 0);
  }, 0);
  const totalDistance = Math.round(filtered.reduce((s, r) => {
    const qty = r.quantity === -6 ? 1 : r.quantity;
    return s + (qty > 0 ? (Number(r.distance) || 0) : 0);
  }, 0) * 10) / 10;
  const workingDays = new Set(filtered.filter(r => r.quantity > 0 || r.quantity === -6).map(r => r.date)).size;
  const totalOvertime = Math.round(filtered.reduce((s, r) => s + (Number(r.overtime) || 0), 0) * 10) / 10;

  const exportCSV = () => {
    const header = "名前,日付,曜日,現場名,出勤区分,作業内容,車距離(km),残業(時間),備考\n";
    const qLabel = (q) => q === 1 ? "1日" : q === 0.5 ? "半日" : q === 0 ? "欠勤" : q === -4 ? "予定欠勤" : q === -1 ? "休工(天候)" : q === -3 ? "休工(現場都合)" : q === -2 ? "休日" : q === -5 ? "打合せ" : q === -6 ? "夜勤" : q;
    const rows = filtered.map(r =>
      `${r.worker_name||""},${r.date},${weekday(r.date)},${r.site_name||""},${qLabel(r.quantity)},${r.content||""},${r.distance||0},${r.overtime||0},${(r.note||"").replace(/,/g, "；")}`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `出勤表_${filterMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "calendar", label: "出勤表" },
    { id: "summary", label: "作業員集計" },
    { id: "invoice", label: "現場別" },
    { id: "list", label: "一覧" },
    { id: "bulk", label: "一括登録" },
  ];

  return (
    <div className="way-screen" style={{ fontFamily: FONT }}>
      <div className="way-layer" style={{
        background: "rgba(4,11,20,0.84)", borderBottom: `1px solid ${THEME.line}`,
        padding: "13px 20px", display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)",
      }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: THEME.gold2, cursor: "pointer", padding: 9, display: "flex" }}>
          {Icons.arrowLeft}
        </button>
        <LogoMark size={38} compact />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="way-header-title" style={{ color: THEME.text, fontSize: 18, fontWeight: 800, margin: 0 }}>ダッシュボード</h2>
          <div style={{ color: THEME.muted, fontSize: 11, marginTop: 2 }}>{BRAND.system}</div>
        </div>
        <button onClick={exportCSV} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(216,170,74,0.14)", color: THEME.gold2, border: `1px solid ${THEME.lineStrong}`,
          padding: "9px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: FONT,
        }}>{Icons.download} CSV出力</button>
      </div>

      <div className="way-layer way-admin-main" style={{ padding: "22px 20px 0", maxWidth: 1180, margin: "0 auto" }}>
        <div className="way-admin-stats way-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 2 }}>
          <StatCard label="のべ人工数" value={totalManDays} unit="人工" color={THEME.gold2} large />
          <StatCard label="稼働日数" value={workingDays} unit="日" color={THEME.blue} />
          <StatCard label="総残業時間" value={totalOvertime} unit="時間" color="#f59e0b" />
          <StatCard label="総走行距離" value={totalDistance} unit="km" color="#b7c6d6" />
        </div>
      </div>

      <div className="way-layer way-admin-main way-filterbar" style={{ padding: "16px 20px", maxWidth: 1180, margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: THEME.gold2, display: "flex", alignItems: "center" }}>{Icons.filter}</span>
        <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setFilterDate("all"); }} style={adminFilterSelect}>
          {getMonthOptions().map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={filterWorker} onChange={(e) => setFilterWorker(e.target.value)} style={adminFilterSelect}>
          <option value="all">全作業員</option>
          {uniqueWorkers.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} style={adminFilterSelect}>
          <option value="all">全現場</option>
          {uniqueSites.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {tab === "list" && (
          <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ ...adminFilterSelect, borderColor: filterDate !== "all" ? THEME.lineStrong : undefined }}>
            <option value="all">全日付</option>
            {uniqueDates.map((d) => <option key={d} value={d}>{d.slice(5)}（{weekday(d)}）</option>)}
          </select>
        )}
      </div>

      <div className="way-layer way-admin-main way-tabs" style={{ padding: "0 20px", maxWidth: 1180, margin: "0 auto 16px", display: "flex", gap: 6, overflowX: "auto" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "11px 16px", borderRadius: 8, border: `1px solid ${tab === t.id ? THEME.lineStrong : "rgba(255,255,255,0.08)"}`, cursor: "pointer",
            fontSize: 13, fontWeight: 700, transition: "all 0.2s", fontFamily: FONT, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
            background: tab === t.id ? "rgba(216,170,74,0.15)" : "rgba(255,255,255,0.035)",
            color: tab === t.id ? THEME.gold2 : THEME.textSoft,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="way-layer way-admin-main" style={{ padding: "0 20px 40px", maxWidth: 1180, margin: "0 auto" }}>
        {tab === "calendar" && <CalendarTable records={filtered} allRecords={records} workers={workers} filterMonth={filterMonth} />}
        {tab === "list" && <ListView records={listFiltered} sites={sites} onRefresh={onRefresh} />}
        {tab === "summary" && <SummaryView data={workerSummary} records={filtered} filterMonth={filterMonth} />}
        {tab === "invoice" && <InvoiceView data={siteSummary} records={filtered} />}
        {tab === "bulk" && <BulkRegister workers={workers} onBulkAdd={onBulkAdd} />}
      </div>
      <style>{CSS}</style>
    </div>
  );
}

// ─── Calendar Cross Table ─────────────────────────────────────────
function CalendarTable({ records, allRecords, workers, filterMonth }) {
  const [yr, mo] = filterMonth.split("-").map(Number);
  const dim = new Date(yr, mo, 0).getDate();
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  const getDow = (d) => new Date(yr, mo - 1, d).getDay();
  const dl = ["日","月","火","水","木","金","土"];

  const lk = {};
  const ot = {};
  records.forEach(r => {
    const d = parseInt(r.date.split("-")[2]);
    const wn = r.worker_name || r.name;
    if (!lk[wn]) lk[wn] = {};
    if (r.quantity < 0) {
      lk[wn][d] = r.quantity;
    } else {
      lk[wn][d] = (lk[wn][d] || 0) + r.quantity;
    }
    const otv = Number(r.overtime) || 0;
    if (otv > 0) {
      if (!ot[wn]) ot[wn] = {};
      ot[wn][d] = (ot[wn][d] || 0) + otv;
    }
  });
  const active = workers.filter(w => lk[w]);

  const workerFirstDate = {};
  (allRecords || records).forEach(r => {
    const wn = r.worker_name || r.name;
    if (!workerFirstDate[wn] || r.date < workerFirstDate[wn]) {
      workerFirstDate[wn] = r.date;
    }
  });

  const todayStr = today();
  const [todayY, todayM, todayD] = todayStr.split("-").map(Number);
  const isCurrentMonth = yr === todayY && mo === todayM;
  const isPast = (d) => {
    if (!isCurrentMonth) return yr < todayY || (yr === todayY && mo < todayM);
    return d < todayD;
  };

  const thBase = { padding: "9px 5px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 700, color: THEME.muted };
  const cdBase = { padding: "9px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: THEME.textSoft, fontSize: 13 };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, color: THEME.muted, fontSize: 12 }}>
        <span style={{ color: THEME.textSoft, fontWeight: 700 }}>{yr}年{mo}月 出勤表</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span><span style={{ color: "#10b981", fontWeight: 700 }}>◯</span> 1日</span>
          <span><span style={{ color: "#f59e0b", fontWeight: 700 }}>△</span> 半日</span>
          <span><span style={{ color: "#ef4444", fontWeight: 700 }}>✕</span> 欠勤</span>
          <span><span style={{ color: "#f97316", fontWeight: 700 }}>予</span> 予定欠</span>
          <span><span style={{ color: "#8b5cf6", fontWeight: 700 }}>雨</span> 休工</span>
          <span><span style={{ color: "#ea8c1c", fontWeight: 700 }}>止</span> 現場都合</span>
          <span><span style={{ color: "#6b7280", fontWeight: 700 }}>休</span> 休日</span>
          <span><span style={{ color: "#0ea5e9", fontWeight: 700 }}>⭐</span> 打合せ</span>
          <span><span style={{ color: "#1e40af", fontWeight: 700 }}>夜</span> 夜勤</span>
          <span><span style={{ color: "#f59e0b", fontWeight: 700 }}>残◯</span> 残業(h)</span>
          <span><span style={{ color: "#ef4444", fontWeight: 700 }}>未</span> 未入力</span>
        </span>
      </div>
      <div className="way-table-wrap way-scroll" style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${THEME.line}`, background: "rgba(7,21,37,0.82)", boxShadow: "0 20px 50px rgba(0,0,0,0.20)" }}>
        <table style={{ borderCollapse: "collapse", minWidth: "100%", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thBase, position: "sticky", left: 0, zIndex: 2, minWidth: 90, background: THEME.panel, textAlign: "left", paddingLeft: 12 }}>名前</th>
              {days.map(d => {
                const w = getDow(d);
                return (
                  <th key={d} style={{ ...thBase, minWidth: 32, background: w === 0 ? "rgba(239,68,68,0.12)" : w === 6 ? "rgba(95,179,230,0.12)" : "rgba(16,42,70,0.88)" }}>
                    <div style={{ color: w === 0 ? "rgba(239,68,68,0.6)" : w === 6 ? "rgba(78,168,222,0.6)" : "#9ca3af", fontWeight: 600, lineHeight: 1.2 }}>{d}</div>
                    <div style={{ color: w === 0 ? "rgba(239,68,68,0.4)" : w === 6 ? "rgba(78,168,222,0.4)" : "#d1d5db", fontSize: 10 }}>{dl[w]}</div>
                  </th>
                );
              })}
              <th style={{ ...thBase, minWidth: 44, background: THEME.panel }}>合計</th>
            </tr>
          </thead>
          <tbody>
            {active.map(name => {
              const dm = lk[name] || {};
              // 合計：夜勤は1人工、打合せは0
              const tot = Object.values(dm).reduce((a, b) => {
                if (b === -6) return a + 1;
                return a + (b > 0 ? b : 0);
              }, 0);
              const firstDateStr = workerFirstDate[name];
              const firstDay = firstDateStr ? (() => {
                const [fy, fm, fd] = firstDateStr.split("-").map(Number);
                if (fy < yr || (fy === yr && fm < mo)) return 1;
                if (fy === yr && fm === mo) return fd;
                return 99;
              })() : 99;
              return (
                <tr key={name}>
                  <td style={{ ...cdBase, position: "sticky", left: 0, zIndex: 1, background: THEME.navy2, fontWeight: 700, color: THEME.text, whiteSpace: "nowrap", paddingLeft: 12 }}>{name}</td>
                  {days.map(d => {
                    const val = dm[d]; const w = getDow(d); const hol = w === 0 || w === 6;
                    const hasRecord = d in dm;
                    const otVal = (ot[name] || {})[d] || 0;
                    let sym = "", clr = "#e5e7eb", fs = 14;
                    if (val === -2) { sym = "休"; clr = "#6b7280"; fs = 11; }
                    else if (val === -1) { sym = "雨"; clr = "#8b5cf6"; fs = 11; }
                    else if (val === -3) { sym = "止"; clr = "#ea8c1c"; fs = 11; }
                    else if (val === -4) { sym = "予"; clr = "#f97316"; fs = 11; }
                    else if (val === -5) { sym = "⭐"; clr = "#0ea5e9"; fs = 13; }
                    else if (val === -6) { sym = "夜"; clr = "#1e40af"; fs = 11; }
                    else if (val >= 1) { sym = "◯"; clr = "#10b981"; }
                    else if (val === 0.5) { sym = "△"; clr = "#f59e0b"; }
                    else if (hasRecord && val === 0) { sym = "✕"; clr = "#ef4444"; }
                    else if (isPast(d) && !hol && d >= firstDay) { sym = "未"; clr = "#ef4444"; fs = 11; }
                    const otLabel = otVal % 1 === 0 ? otVal : otVal.toFixed(1);
                    return (
                      <td key={d} style={{ ...cdBase, textAlign: "center", background: hol ? "rgba(255,255,255,0.035)" : "transparent", padding: "6px 4px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
                          <span style={{ fontWeight: 800, fontSize: fs, color: clr }}>{sym}</span>
                          {otVal > 0 && (
                            <span style={{ marginTop: 2, fontSize: 9, fontWeight: 800, color: "#f59e0b", lineHeight: 1, whiteSpace: "nowrap" }}>残{otLabel}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ ...cdBase, textAlign: "center", fontWeight: 800, fontSize: 14, color: THEME.gold2 }}>{tot}</td>
                </tr>
              );
            })}
            <tr>
              <td style={{ ...cdBase, position: "sticky", left: 0, zIndex: 1, background: THEME.panel, fontWeight: 800, color: THEME.muted, fontSize: 11, paddingLeft: 12 }}>日計</td>
              {days.map(d => {
                const dt = active.reduce((s, n) => {
                  const v = (lk[n] || {})[d];
                  if (v === -6) return s + 1;
                  return s + (v > 0 ? v : 0);
                }, 0);
                return <td key={d} style={{ ...cdBase, textAlign: "center", fontWeight: 700, fontSize: 11, color: dt > 0 ? THEME.gold2 : "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.035)" }}>{dt > 0 ? dt : ""}</td>;
              })}
              <td style={{ ...cdBase, textAlign: "center", fontWeight: 800, fontSize: 14, color: THEME.gold2, background: "rgba(255,255,255,0.035)" }}>
                {active.reduce((s, n) => s + Object.values(lk[n] || {}).reduce((a, b) => {
                  if (b === -6) return a + 1;
                  return a + (b > 0 ? b : 0);
                }, 0), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {active.length === 0 && <EmptyState />}
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────
function SettingsPage({ onBack, workers, sites, onUpdateWorkers, onUpdateSites }) {
  const mergeItem = (items, item) => [...new Set([...items, item])];
  const refreshWorkers = async () => {
    try { onUpdateWorkers(await DB.getWorkers()); } catch (error) { console.error("refresh workers error:", error); }
  };
  const refreshSites = async () => {
    try { onUpdateSites(await DB.getSites()); } catch (error) { console.error("refresh sites error:", error); }
  };

  return (
    <div className="way-screen" style={{ fontFamily: FONT }}>
      <div className="way-layer" style={{ background: "rgba(4,11,20,0.84)", borderBottom: `1px solid ${THEME.line}`, padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: THEME.gold2, cursor: "pointer", padding: 9, display: "flex" }}>{Icons.arrowLeft}</button>
        <LogoMark size={38} compact />
        <div>
          <h2 className="way-header-title" style={{ color: THEME.text, fontSize: 18, fontWeight: 800, margin: 0 }}>設定</h2>
          <div style={{ color: THEME.muted, fontSize: 11, marginTop: 2 }}>{BRAND.system}</div>
        </div>
      </div>
      <div className="way-layer" style={{ padding: "24px 18px 40px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ padding: "16px 18px", borderRadius: 8, background: "linear-gradient(135deg, rgba(16,42,70,0.92), rgba(7,21,37,0.92))", border: `1px solid ${THEME.line}`, display: "flex", alignItems: "center", gap: 12, marginBottom: 24, boxShadow: "0 18px 45px rgba(0,0,0,0.20)" }}>
          <span style={{ color: THEME.gold2 }}>{Icons.settings}</span>
          <div>
            <div style={{ color: THEME.text, fontSize: 15, fontWeight: 800 }}>マスタ設定</div>
            <div style={{ color: THEME.muted, fontSize: 12 }}>作業員や現場の追加・削除ができます</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <MasterList title="作業員マスタ" items={workers} onAdd={async(n)=>{await DB.addWorker(n);onUpdateWorkers(mergeItem(workers,n));await refreshWorkers();}} onDelete={async(n)=>{await DB.delWorker(n);onUpdateWorkers(workers.filter(w=>w!==n));await refreshWorkers();}} color={THEME.gold2} placeholder="新しい作業員の名前" icon={Icons.user} />
          <MasterList title="現場マスタ" items={sites} onAdd={async(n)=>{await DB.addSite(n);onUpdateSites(mergeItem(sites,n));await refreshSites();}} onDelete={async(n)=>{await DB.delSite(n);onUpdateSites(sites.filter(s=>s!==n));await refreshSites();}} color={THEME.blue} placeholder="新しい現場名" icon={<Icon d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />} />
        </div>
      </div>
      <style>{CSS}</style>
    </div>
  );
}

function MasterList({ title, items, onAdd, onDelete, color, placeholder, icon }) {
  const [newItem, setNewItem] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    const trimmed = newItem.trim();
    if (!trimmed || items.includes(trimmed)) return;
    setSaving(true);
    setError("");
    try {
      await onAdd(trimmed);
      setNewItem("");
    } catch (err) {
      console.error("master add error:", err);
      setError(formatDbError("登録に失敗しました。", err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (confirmDelete === item) {
      setSaving(true);
      setError("");
      try {
        await onDelete(item);
        setConfirmDelete(null);
      } catch (err) {
        console.error("master delete error:", err);
        setError(formatDbError("削除に失敗しました。", err));
      } finally {
        setSaving(false);
      }
    } else {
      setConfirmDelete(item);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div style={{
      padding: "18px", borderRadius: 8,
      background: "rgba(7,21,37,0.82)", border: `1px solid ${THEME.line}`,
      boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ color }}>{icon}</span>
        <h3 style={{ color: THEME.text, fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h3>
        <span style={{ marginLeft: 8, padding: "3px 10px", borderRadius: 8, background: `${color}18`, color, fontSize: 12, fontWeight: 700 }}>{items.length}件</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input type="text" value={newItem} onChange={(e) => { setNewItem(e.target.value); setError(""); }} placeholder={placeholder} onKeyDown={(e) => e.key === "Enter" && handleAdd()} style={{ ...inputBase, flex: 1, padding: "12px 14px", fontSize: 14, borderRadius: 10 }} />
        <button onClick={handleAdd} disabled={!newItem.trim() || saving} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "12px 18px", borderRadius: 8,
          border: "none", cursor: newItem.trim() && !saving ? "pointer" : "not-allowed", fontFamily: FONT,
          background: newItem.trim() && !saving ? color : "rgba(255,255,255,0.08)", color: newItem.trim() && !saving ? "#071525" : THEME.muted2,
          fontSize: 14, fontWeight: 800, transition: "all 0.2s", whiteSpace: "nowrap",
        }}>{Icons.plus} {saving ? "登録中" : "追加"}</button>
      </div>
      {error && (
        <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#fca5a5", fontSize: 12, lineHeight: 1.6, fontWeight: 700, marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, i) => (
          <div key={item} style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animation: `fadeIn 0.2s ease-out` }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, marginRight: 12, background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ color: THEME.textSoft, fontSize: 14, flex: 1 }}>{item}</span>
            <button onClick={() => handleDelete(item)} disabled={saving} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7,
              border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, fontFamily: FONT, transition: "all 0.2s",
              background: confirmDelete === item ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.05)", color: confirmDelete === item ? "#fca5a5" : THEME.muted,
            }}>{Icons.trash}{confirmDelete === item ? "確認" : "削除"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared Sub-Components ────────────────────────────────────────
function StatCard({ label, value, unit, color, large }) {
  return (
    <div style={{
      flex: large ? "1.3 0 170px" : "1 0 150px", padding: large ? "18px 20px" : "16px 18px", borderRadius: 8,
      background: large ? "linear-gradient(135deg, rgba(216,170,74,0.16), rgba(7,21,37,0.86))" : "rgba(7,21,37,0.82)",
      border: large ? `1px solid ${THEME.lineStrong}` : `1px solid ${THEME.line}`,
      boxShadow: "0 18px 45px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
    }}>
      <div style={{ color: THEME.muted, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ color, fontSize: large ? 34 : 28, fontWeight: 800, lineHeight: 1 }}>{value}</span>
        <span style={{ color: THEME.textSoft, fontSize: 13, fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  );
}

function ListView({ records, sites, onRefresh }) {
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [delConfirm, setDelConfirm] = useState(null);

  const startEdit = (r) => {
    setEditId(r.id);
    setEditForm({ date: r.date, site_name: r.site_name || r.site, quantity: r.quantity, content: r.content, distance: r.distance || 0, overtime: r.overtime || 0, note: r.note || "" });
  };
  const cancelEdit = () => { setEditId(null); setEditForm({}); };
  const saveEdit = async () => {
    await DB.updateRecord(editId, editForm);
    setEditId(null); setEditForm({});
    if (onRefresh) onRefresh();
  };
  const handleDelete = async (id) => {
    if (delConfirm === id) { await DB.delRecord(id); setDelConfirm(null); if (onRefresh) onRefresh(); }
    else { setDelConfirm(id); setTimeout(() => setDelConfirm(null), 3000); }
  };
  const ef = (k) => (e) => setEditForm(p => ({ ...p, [k]: typeof e === "object" ? e.target.value : e }));

  if (!records.length) return <EmptyState />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {records.map((r) => (
        <div key={r.id} style={{
          borderRadius: 8, overflow: "hidden",
          background: "rgba(7,21,37,0.82)", border: editId === r.id ? `1.5px solid ${THEME.blue}` : `1px solid ${THEME.line}`,
          padding: editId === r.id ? 0 : "16px 18px",
          boxShadow: "0 14px 36px rgba(0,0,0,0.16)",
        }}>
          {editId === r.id ? (
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ color: THEME.blue, fontSize: 13, fontWeight: 800 }}>✏️ 編集中：{r.worker_name || r.name}</div>
              <div><label style={{ fontSize: 11, color: THEME.muted, display: "block", marginBottom: 4 }}>日付</label><input type="date" value={editForm.date} onChange={ef("date")} style={{ ...inputBase, display: "block", width: "100%", padding: "9px 10px", fontSize: 16, WebkitAppearance: "none", appearance: "none" }} /></div>
              <div><label style={{ fontSize: 11, color: THEME.muted, display: "block", marginBottom: 4 }}>出勤区分</label><select value={editForm.quantity} onChange={(e) => setEditForm(p => ({ ...p, quantity: Number(e.target.value) }))} style={{ ...selectBase, display: "block", width: "100%", padding: "9px 10px", fontSize: 14 }}><option value={1}>1日</option><option value={0.5}>半日</option><option value={0}>欠勤</option><option value={-4}>予定欠勤</option><option value={-1}>休工（天候）</option><option value={-3}>休工（現場都合）</option><option value={-2}>休日</option><option value={-5}>打合せ</option><option value={-6}>夜勤</option></select></div>
              <div><label style={{ fontSize: 11, color: THEME.muted, display: "block", marginBottom: 4 }}>現場</label><select value={editForm.site_name} onChange={ef("site_name")} style={{ ...selectBase, display: "block", width: "100%", padding: "9px 10px", fontSize: 14 }}>{(sites||[]).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label style={{ fontSize: 11, color: THEME.muted, display: "block", marginBottom: 4 }}>作業内容</label><input type="text" value={editForm.content} onChange={ef("content")} style={{ ...inputBase, display: "block", width: "100%", padding: "9px 10px", fontSize: 14 }} /></div>
              <div><label style={{ fontSize: 11, color: THEME.muted, display: "block", marginBottom: 4 }}>距離(km)</label><input type="number" value={editForm.distance} onChange={ef("distance")} style={{ ...inputBase, display: "block", width: "100%", padding: "9px 10px", fontSize: 16, WebkitAppearance: "none", appearance: "none" }} /></div>
              <div><label style={{ fontSize: 11, color: THEME.muted, display: "block", marginBottom: 4 }}>残業(h)</label><input type="number" step="0.5" min="0" value={editForm.overtime} onChange={ef("overtime")} style={{ ...inputBase, display: "block", width: "100%", padding: "9px 10px", fontSize: 16, WebkitAppearance: "none", appearance: "none" }} /></div>
              <div><label style={{ fontSize: 11, color: THEME.muted, display: "block", marginBottom: 4 }}>備考</label><input type="text" value={editForm.note} onChange={ef("note")} style={{ ...inputBase, display: "block", width: "100%", padding: "9px 10px", fontSize: 14 }} /></div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={cancelEdit} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: THEME.textSoft, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>キャンセル</button>
                <button onClick={saveEdit} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: `linear-gradient(135deg,${THEME.gold2},${THEME.gold})`, color: "#071525", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>保存する</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "linear-gradient(135deg, rgba(216,170,74,0.22), rgba(216,170,74,0.08))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: THEME.gold2, fontSize: 14, fontWeight: 800,
                  }}>{(r.worker_name||r.name||"").charAt(0)}</div>
                  <div>
                    <div style={{ color: THEME.text, fontSize: 14, fontWeight: 700 }}>{r.worker_name||r.name}</div>
                    <div style={{ color: THEME.muted, fontSize: 12 }}>{formatDate(r.date)}（{weekday(r.date)}）</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    padding: "4px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: r.quantity === 1 ? "#10b98118" : r.quantity === 0.5 ? "#f59e0b18" : r.quantity === -2 ? "#6b728018" : r.quantity === -1 ? "#8b5cf618" : r.quantity === -3 ? "#ea8c1c18" : r.quantity === -4 ? "#f9731618" : r.quantity === -5 ? "#0ea5e918" : r.quantity === -6 ? "#1e40af18" : "#ef444418",
                    color: r.quantity === 1 ? "#10b981" : r.quantity === 0.5 ? "#f59e0b" : r.quantity === -2 ? "#6b7280" : r.quantity === -1 ? "#8b5cf6" : r.quantity === -3 ? "#ea8c1c" : r.quantity === -4 ? "#f97316" : r.quantity === -5 ? "#0ea5e9" : r.quantity === -6 ? "#1e40af" : "#ef4444",
                  }}>{r.quantity === 1 ? "1日" : r.quantity === 0.5 ? "半日" : r.quantity === -2 ? "休日" : r.quantity === -1 ? "休工(天候)" : r.quantity === -3 ? "休工(現場)" : r.quantity === -4 ? "予定欠" : r.quantity === -5 ? "打合せ" : r.quantity === -6 ? "夜勤" : "欠勤"}</div>
                  <button onClick={() => startEdit(r)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, cursor: "pointer", color: THEME.blue, padding: 5, display: "flex" }}><Icon d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} size={16} /></button>
                  <button onClick={() => handleDelete(r.id)} style={{ background: delConfirm === r.id ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: delConfirm === r.id ? "#fca5a5" : THEME.muted, padding: 5, borderRadius: 7, display: "flex" }}>{Icons.trash}</button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13 }}>
                <span style={{ color: THEME.blue }}>📍 {r.site_name||r.site}</span>
                <span style={{ color: THEME.textSoft }}>🔧 {r.content}</span>
                {r.distance > 0 && <span style={{ color: THEME.textSoft }}>🚗 {r.distance}km</span>}
                {Number(r.overtime) > 0 && <span style={{ color: "#f59e0b", fontWeight: 700 }}>⏱ 残業{r.overtime}h</span>}
                {r.note && <span style={{ color: THEME.textSoft }}>📝 {r.note}</span>}
              </div>
              {delConfirm === r.id && <div style={{ marginTop: 8, fontSize: 12, color: "#fca5a5", fontWeight: 700 }}>もう一度押すと削除されます</div>}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function SummaryView({ data, records, filterMonth }) {
  const entries = Object.entries(data).sort((a, b) => b[1].days - a[1].days);
  if (!entries.length) return <EmptyState />;
  const [expanded, setExpanded] = useState(null);

  const [year, month] = filterMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDow = (day) => new Date(year, month - 1, day).getDay();
  const isHoliday = (day) => { const d = getDow(day); return d === 0 || d === 6; };
  const dowLabel = (day) => ["日","月","火","水","木","金","土"][getDow(day)];

  const getWorkerDayMap = (name) => {
    const map = {};
    records.filter(r => (r.worker_name||r.name) === name).forEach(r => {
      const day = parseInt(r.date.split("-")[2]);
      map[day] = r.quantity < 0 ? r.quantity : (map[day] || 0) + r.quantity;
    });
    return map;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: THEME.muted, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
        <span style={{ color: THEME.textSoft, fontWeight: 800 }}>作業員ごとの出勤集計</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><span style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>◯</span>1日</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>△</span>半日</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><span style={{ color: "#0ea5e9", fontWeight: 700, fontSize: 13 }}>⭐</span>打合せ</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><span style={{ color: "#1e40af", fontWeight: 700, fontSize: 13 }}>夜</span>夜勤</span>
        </span>
      </div>

      {entries.map(([name, info]) => {
        const isOpen = expanded === name;
        const dayMap = isOpen ? getWorkerDayMap(name) : {};
        return (
          <div key={name} style={{ borderRadius: 8, overflow: "hidden", background: "rgba(7,21,37,0.82)", border: `1px solid ${THEME.line}`, boxShadow: "0 14px 36px rgba(0,0,0,0.14)" }}>
            <button onClick={() => setExpanded(isOpen ? null : name)} style={{
              width: "100%", padding: "16px 20px", border: "none", cursor: "pointer",
              background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, rgba(216,170,74,0.22), rgba(216,170,74,0.08))", display: "flex", alignItems: "center", justifyContent: "center", color: THEME.gold2, fontSize: 14, fontWeight: 800 }}>{name.charAt(0)}</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: THEME.text, fontSize: 15, fontWeight: 800 }}>{name}</div>
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: THEME.muted, marginTop: 3 }}>
                    <span>残業 <span style={{ color: "#f59e0b", fontWeight: 700 }}>{Math.round((info.overtime || 0) * 10) / 10}h</span></span>
                    <span>走行 <span style={{ color: "#b7c6d6", fontWeight: 700 }}>{Math.round(info.distance * 10) / 10}km</span></span>
                    <span>現場 <span style={{ color: THEME.blue, fontWeight: 700 }}>{info.sites.size}件</span></span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: THEME.gold2, textAlign: "right" }}>
                  {info.days}<span style={{ fontSize: 13, fontWeight: 600, color: THEME.muted, marginLeft: 4 }}>日</span>
                </div>
                <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: THEME.gold2, display: "flex" }}>{Icons.chevronDown}</div>
              </div>
            </button>
            {isOpen && (
              <div style={{ padding: "0 12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(28px, 1fr))", gap: 3, marginTop: 12, padding: "0 4px" }}>
                  {days.map((day) => {
                    const val = dayMap[day];
                    const isSun = getDow(day) === 0;
                    const isSat = getDow(day) === 6;
                    let symbol = "", symColor = "rgba(255,255,255,0.16)", bg = "rgba(255,255,255,0.035)";
                    if (val >= 1) { symbol = "◯"; symColor = "#10b981"; bg = "rgba(16,185,129,0.08)"; }
                    else if (val === 0.5) { symbol = "△"; symColor = "#f59e0b"; bg = "rgba(245,158,11,0.08)"; }
                    else if (val === -5) { symbol = "⭐"; symColor = "#0ea5e9"; bg = "rgba(14,165,233,0.08)"; }
                    else if (val === -6) { symbol = "夜"; symColor = "#1e40af"; bg = "rgba(30,64,175,0.08)"; }
                    return (
                      <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0 6px", borderRadius: 6, background: bg, border: `1px solid ${val ? symColor + "30" : "rgba(255,255,255,0.05)"}` }}>
                        <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1, color: isSun ? "rgba(239,68,68,0.5)" : isSat ? "rgba(78,168,222,0.5)" : "#b0b5bd", marginBottom: 2 }}>{day}</span>
                        <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1, color: isSun ? "rgba(239,68,68,0.35)" : isSat ? "rgba(78,168,222,0.35)" : "#d1d5db", marginBottom: 3 }}>{dowLabel(day)}</span>
                        <span style={{ fontSize: val === -6 ? 9 : 14, fontWeight: 800, lineHeight: 1, color: symColor }}>{symbol}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, padding: "0 4px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[...info.sites].map((s) => (
                    <span key={s} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "rgba(95,179,230,0.10)", color: THEME.blue, border: "1px solid rgba(95,179,230,0.20)" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InvoiceView({ data, records }) {
  const entries = Object.entries(data).sort((a, b) => b[1].days - a[1].days);
  if (!entries.length) return <EmptyState />;
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ color: THEME.muted, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>現場別の出勤状況 — 請求書の人工数と照合してください</div>
      {entries.map(([site, info]) => {
        const isOpen = expanded === site;
        const siteRecords = records.filter((r) => (r.site_name||r.site) === site).sort((a, b) => a.date.localeCompare(b.date));
        return (
          <div key={site} style={{ borderRadius: 8, overflow: "hidden", background: "rgba(7,21,37,0.82)", border: `1px solid ${THEME.line}`, boxShadow: "0 14px 36px rgba(0,0,0,0.14)" }}>
            <button onClick={() => setExpanded(isOpen ? null : site)} style={{
              width: "100%", padding: "18px 20px", border: "none", cursor: "pointer",
              background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: THEME.blue, fontSize: 15, fontWeight: 800 }}>{site}</div>
                <div style={{ color: THEME.muted, fontSize: 12, marginTop: 4 }}>{info.workers.size}名 · {[...info.workers].join("、")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: THEME.gold2 }}>{info.days}<span style={{ fontSize: 12, fontWeight: 600, color: THEME.muted, marginLeft: 3 }}>人工</span></div>
                <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginTop: 4, color: THEME.gold2, display: "flex", justifyContent: "flex-end" }}>{Icons.chevronDown}</div>
              </div>
            </button>
            {isOpen && (
              <div className="way-table-wrap way-scroll" style={{ padding: "0 20px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                  <thead>
                    <tr>
                      {["日付","名前","出勤区分","作業内容","距離","残業"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px", fontSize: 11, fontWeight: 700, color: THEME.muted, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {siteRecords.map((r) => (
                      <tr key={r.id}>
                        <td style={tdStyle}>{r.date.slice(5)}({weekday(r.date)})</td>
                        <td style={tdStyle}>{r.worker_name||r.name}</td>
                        <td style={{ ...tdStyle, color: r.quantity === 1 ? "#10b981" : r.quantity === 0.5 ? "#f59e0b" : r.quantity === -1 ? "#8b5cf6" : r.quantity === -3 ? "#ea8c1c" : r.quantity === -4 ? "#f97316" : r.quantity === -2 ? "#6b7280" : r.quantity === -5 ? "#0ea5e9" : r.quantity === -6 ? "#1e40af" : "#ef4444", fontWeight: 600 }}>{r.quantity === -1 ? "休工(天候)" : r.quantity === -3 ? "休工(現場)" : r.quantity === -2 ? "休日" : r.quantity === -4 ? "予定欠" : r.quantity === -5 ? "打合せ" : r.quantity === -6 ? "夜勤" : r.quantity}</td>
                        <td style={tdStyle}>{r.content}</td>
                        <td style={tdStyle}>{r.distance || "-"}</td>
                        <td style={{ ...tdStyle, color: Number(r.overtime) > 0 ? "#f59e0b" : THEME.muted, fontWeight: Number(r.overtime) > 0 ? 700 : 400 }}>{Number(r.overtime) > 0 ? `${r.overtime}h` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Bulk Register ────────────────────────────────────────────────
function BulkRegister({ workers, onBulkAdd }) {
  const [date, setDate] = useState(today());
  const [type, setType] = useState(-2);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  const toggleWorker = (w) => {
    setSelectAll(false);
    setSelectedWorkers(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  };
  const handleSelectAll = () => { setSelectAll(true); setSelectedWorkers([]); };

  const handleSubmit = async () => {
    if (sending) return;
    setSending(true); setResult(null);
    const targets = selectAll ? workers : selectedWorkers;
    if (targets.length === 0) { setSending(false); return; }
    const res = await onBulkAdd(targets, date, type, overwrite);
    setResult(res); setSending(false);
  };

  const label = type === -2 ? "休日" : type === -1 ? "休工（天候）" : type === -3 ? "休工（現場都合）" : type === -4 ? "予定欠勤" : type === -5 ? "打合せ" : type === -6 ? "夜勤" : "";
  const color = type === -2 ? "#6b7280" : type === -1 ? "#8b5cf6" : type === -3 ? "#ea8c1c" : type === -4 ? "#f97316" : type === -5 ? "#0ea5e9" : type === -6 ? "#1e40af" : "#6b7280";
  const targetNames = selectAll ? workers : selectedWorkers;
  const canSubmit = !sending && targetNames.length > 0;

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ padding: "16px 18px", borderRadius: 8, marginBottom: 24, background: "linear-gradient(135deg, rgba(16,42,70,0.92), rgba(7,21,37,0.92))", border: `1px solid ${THEME.line}`, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>📋</span>
        <div>
          <div style={{ color: THEME.text, fontSize: 15, fontWeight: 800 }}>一括登録</div>
          <div style={{ color: THEME.muted, fontSize: 12 }}>全員または選択した作業員に休日・休工・打合せ・夜勤を一括で登録できます</div>
        </div>
      </div>

      <Field label="日付" required>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputBase} />
      </Field>

      <Field label="種別" required>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            {v:-2,l:"休日",icon:"📅",c:"#6b7280"},
            {v:-4,l:"予定欠勤",icon:"📝",c:"#f97316"},
            {v:-1,l:"休工(天候)",icon:"🌧️",c:"#8b5cf6"},
            {v:-3,l:"休工(現場)",icon:"🚧",c:"#ea8c1c"},
            {v:-5,l:"打合せ",icon:"⭐",c:"#0ea5e9"},
            {v:-6,l:"夜勤",icon:"🌙",c:"#1e40af"},
          ].map((o) => (
            <button key={o.v} onClick={() => setType(o.v)} style={{
              padding: "14px 8px", borderRadius: 8, cursor: "pointer",
              fontSize: 14, fontWeight: 700, transition: "all 0.2s", fontFamily: FONT,
              border: type === o.v ? `2px solid ${o.c}` : "2px solid rgba(255,255,255,0.08)",
              background: type === o.v ? `${o.c}20` : "rgba(255,255,255,0.045)",
              color: type === o.v ? o.c : THEME.textSoft,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap",
            }}>{o.icon} {o.l}</button>
          ))}
        </div>
      </Field>

      <Field label="対象作業員" required>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={handleSelectAll} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            borderRadius: 8, border: selectAll ? `1.5px solid ${color}` : "1.5px solid rgba(255,255,255,0.08)",
            background: selectAll ? `${color}16` : "rgba(255,255,255,0.045)", cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: selectAll ? color : "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#071525", fontSize: 12, transition: "all 0.15s", fontWeight: 800 }}>{selectAll ? "✓" : ""}</div>
            <span style={{ color: selectAll ? THEME.text : THEME.textSoft, fontSize: 14, fontWeight: selectAll ? 700 : 500 }}>全員（{workers.length}名）</span>
          </button>
          <div className="way-scroll" style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {workers.map((w) => {
              const checked = selectAll || selectedWorkers.includes(w);
              return (
                <button key={w} onClick={() => toggleWorker(w)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                  borderRadius: 8, border: checked && !selectAll ? `1.5px solid ${color}` : "1.5px solid rgba(255,255,255,0.07)",
                  background: checked && !selectAll ? `${color}14` : "rgba(255,255,255,0.035)", cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: checked ? color : "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#071525", fontSize: 12, transition: "all 0.15s", fontWeight: 800 }}>{checked ? "✓" : ""}</div>
                  <span style={{ color: THEME.textSoft, fontSize: 14 }}>{w}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Field>

      <div style={{ padding: "14px 18px", borderRadius: 8, marginBottom: 16, background: `${color}12`, border: `1px solid ${color}30`, fontSize: 13, color: THEME.textSoft }}>
        <strong>{formatDate(date)}（{weekday(date)}）</strong>に
        <strong style={{ color }}> {label} </strong>を
        <strong>{selectAll ? `全員（${workers.length}名）` : `${selectedWorkers.length}名`}</strong>
        に登録します
      </div>

      {result && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 16,
          background: result.added > 0 ? "#10b98118" : "#f59e0b18",
          border: `1px solid ${result.added > 0 ? "#10b98130" : "#f59e0b30"}`,
          fontSize: 14, fontWeight: 600, textAlign: "center",
          color: result.added > 0 ? "#10b981" : "#f59e0b",
        }}>
          {result.added > 0 && `✅ ${result.added}名を登録しました`}
          {result.skipped > 0 && ` ⚠️ ${result.skipped}名はすでに入力済みのためスキップ`}
        </div>
      )}

      <button onClick={handleSubmit} disabled={!canSubmit} style={{
        width: "100%", padding: "17px", borderRadius: 8, border: "none", fontFamily: FONT,
        cursor: canSubmit ? "pointer" : "not-allowed",
        background: canSubmit ? `linear-gradient(135deg, ${color}, ${type === -2 ? "#4b5563" : type === -3 ? "#b45309" : type === -4 ? "#c2410c" : type === -5 ? "#0284c7" : type === -6 ? "#1e3a8a" : "#6d28d9"})` : "rgba(255,255,255,0.08)",
        color: canSubmit ? "#fff" : THEME.muted2, fontSize: 16, fontWeight: 800,
        transition: "all 0.3s", boxShadow: canSubmit ? `0 8px 32px ${color}40` : "none",
      }}>{sending ? "登録中..." : `${label}を一括登録する`}</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: THEME.muted, fontSize: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      該当するデータがありません
    </div>
  );
}


// ─── Mount ───
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
