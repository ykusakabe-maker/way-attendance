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

const inputBase = {
  width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15,
  background: "#ffffff", border: "1.5px solid #e0e2e6",
  color: "#1f2937", outline: "none", fontFamily: FONT, transition: "border 0.2s",
};
const selectBase = {
  ...inputBase, appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
};
const adminFilterSelect = {
  padding: "8px 28px 8px 12px", borderRadius: 8, fontSize: 13,
  background: "#ffffff", border: "1px solid #e5e7eb",
  color: "#4b5563", fontFamily: FONT, appearance: "none", cursor: "pointer",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.25)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
};
const tdStyle = {
  padding: "8px 8px", fontSize: 13, color: "#6b7280",
  borderBottom: "1px solid #f0f1f3",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap');
  @keyframes fadeDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { width: 100%; max-width: 100vw; overflow-x: hidden; }
  input, select, textarea, button { box-sizing: border-box !important; max-width: 100% !important; font-size: 16px !important; }
  input[type="date"], input[type="number"] { min-width: 0 !important; -webkit-appearance: none !important; appearance: none !important; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
  input:focus, select:focus, textarea:focus { border-color: rgba(233,150,37,0.5) !important; }
`;

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("splash");
  const [records, setRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loggedInWorker, setLoggedInWorker] = useState(STORE.loggedInWorker);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const [w, s, r] = await Promise.all([DB.getWorkers(), DB.getSites(), DB.getRecords()]);
    setWorkers(w); setSites(s); setRecords(r);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

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
    await DB.addRecord({
      worker_name: rec.name, date: rec.date,
      site_name: (rec.quantity < 0 && rec.quantity !== -5 && rec.quantity !== -6) ? (rec.site || label) : rec.site,
      quantity: rec.quantity,
      content: (rec.quantity < 0 && rec.quantity !== -5 && rec.quantity !== -6) ? (rec.content || label) : rec.content,
      distance: Number(rec.distance) || 0,
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

  if (loading && mode === "splash") return <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}><div style={{textAlign:"center",color:"#9ca3af",fontSize:14}}>読み込み中...</div></div>;
  if (mode === "splash") return <SplashScreen onSelect={setMode} workers={workers} onLogin={handleLogin} />;
  if (mode === "settings") return <SettingsPage onBack={() => { reload(); setMode("splash"); }} workers={workers} sites={sites} onUpdateWorkers={syncWorkers} onUpdateSites={syncSites} />;
  if (mode === "worker") return <WorkerView onBack={handleLogout} onSubmit={addRecord} submitted={submitted} workerName={loggedInWorker} sites={sites} onGoAdmin={() => { reload(); setMode("admin"); }} />;
  return <AdminView onBack={() => setMode("splash")} records={records} workers={workers} sites={sites} onRefresh={reload} onBulkAdd={addBulkRecords} />;
}

// ─── Splash / Role Select ─────────────────────────────────────────
function SplashScreen({ onSelect, workers, onLogin }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f0f4f8 0%, #e8edf4 40%, #dfe6f0 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: FONT, padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `repeating-linear-gradient(0deg, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 60px),
          repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 60px)`,
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(233,150,37,0.08) 0%, transparent 70%)",
        top: "-100px", right: "-100px",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, animation: "fadeDown 0.6s ease-out" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "linear-gradient(135deg, #e99625 0%, #d4791a 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(233,150,37,0.25)", color: "#fff",
        }}>{Icons.hardHat}</div>
        <div>
          <h1 style={{ color: "#1f2937", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>出勤管理<span style={{ fontSize: 18, fontWeight: 600, color: "#6b7280", marginLeft: 6 }}>【友生工業】</span></h1>
          <p style={{ color: "#9ca3af", fontSize: 12, margin: 0, letterSpacing: "0.15em", fontWeight: 500 }}>ATTENDANCE SYSTEM</p>
        </div>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 40, textAlign: "center" }}>建設業向け 出勤表管理システム</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 340, zIndex: 1 }}>
        <WorkerLoginCard workers={workers} onLogin={onLogin} />
        <RoleCard icon={Icons.users} title="事務員" desc="出勤表の確認・管理" color="#4ea8de" onClick={() => onSelect("admin")} delay="0.25s" />
        <RoleCard icon={Icons.settings} title="設定" desc="作業員・現場の追加・削除" color="#a78bfa" onClick={() => onSelect("settings")} delay="0.4s" />
      </div>
      <style>{CSS}</style>
    </div>
  );
}

function WorkerLoginCard({ workers, onLogin }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [hover, setHover] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
          background: hover ? "rgba(0,0,0,0.03)" : "#ffffff",
          border: `1px solid ${hover ? "#e9962560" : "rgba(0,0,0,0.03)"}`,
          borderRadius: 16, cursor: "pointer", transition: "all 0.25s",
          animation: "fadeUp 0.5s ease-out 0.15s both",
          transform: hover ? "translateY(-2px)" : "none",
          boxShadow: hover ? "0 12px 40px #e9962518" : "none",
        }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#e9962518", color: "#e99625", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {Icons.clipboard}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ color: "#1f2937", fontSize: 18, fontWeight: 700 }}>作業員</div>
          <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>ログインして出勤入力</div>
        </div>
        <span style={{ marginLeft: "auto", color: "#e99625", opacity: hover ? 1 : 0.4, transition: "all 0.25s", transform: hover ? "translateX(3px)" : "none", display: "flex" }}>
          {Icons.chevronRight}
        </span>
      </button>
    );
  }

  return (
    <div style={{
      padding: "24px", borderRadius: 16,
      background: "#ffffff", border: "1px solid #e0e2e6",
      animation: "fadeIn 0.3s ease-out",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#e9962518", color: "#e99625", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {Icons.user}
        </div>
        <div>
          <div style={{ color: "#1f2937", fontSize: 16, fontWeight: 700 }}>作業員ログイン</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>名前を選択してログイン</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto", marginBottom: 16 }}>
        {workers.map((w) => (
          <button key={w} onClick={() => setSelected(w)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            borderRadius: 10, border: selected === w ? "1.5px solid #e99625" : "1.5px solid #edeef0",
            background: selected === w ? "#e9962510" : "#f9fafb",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: selected === w ? "#e9962530" : "#f0f1f3",
              color: selected === w ? "#e99625" : "#9ca3af",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, transition: "all 0.15s",
            }}>{w.charAt(0)}</div>
            <span style={{ color: selected === w ? "#fff" : "#6b7280", fontSize: 14, fontWeight: selected === w ? 600 : 400 }}>
              {w}
            </span>
            {selected === w && <span style={{ marginLeft: "auto", color: "#e99625", display: "flex" }}>{Icons.check}</span>}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setOpen(false)} style={{
          flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #e0e2e6",
          background: "transparent", color: "#9ca3af", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: FONT,
        }}>戻る</button>
        <button onClick={() => selected && onLogin(selected)} disabled={!selected} style={{
          flex: 2, padding: "12px", borderRadius: 10, border: "none", cursor: selected ? "pointer" : "not-allowed",
          background: selected ? "linear-gradient(135deg, #e99625, #d4791a)" : "#f0f1f3",
          color: selected ? "#fff" : "#b0b5bd", fontSize: 14, fontWeight: 700, fontFamily: FONT,
          boxShadow: selected ? "0 6px 24px rgba(233,150,37,0.25)" : "none",
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
        display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
        background: hover ? "rgba(0,0,0,0.03)" : "#ffffff",
        border: `1px solid ${hover ? color + "60" : "rgba(0,0,0,0.03)"}`,
        borderRadius: 16, cursor: "pointer", transition: "all 0.25s",
        animation: `fadeUp 0.5s ease-out ${delay} both`,
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? `0 12px 40px ${color}18` : "none",
      }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ textAlign: "left" }}>
        <div style={{ color: "#1f2937", fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{ marginLeft: "auto", color, opacity: hover ? 1 : 0.4, transition: "all 0.25s", transform: hover ? "translateX(3px)" : "none", display: "flex" }}>
        {Icons.chevronRight}
      </span>
    </button>
  );
}

// ─── Worker View ──────────────────────────────────────────────────
function WorkerView({ onBack, onSubmit, submitted, workerName, sites, onGoAdmin }) {
  const [form, setForm] = useState({ date: today(), site: "", quantity: 1, content: "", distance: "", note: "" });
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
    setForm((p) => ({ ...p, site: "", content: "", distance: "", note: "", quantity: 1 }));
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
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: FONT }}>
      {/* Header */}
      <div style={{
        background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
        padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 4, display: "flex" }}>
          {Icons.logOut}
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: "#1f2937", fontSize: 16, fontWeight: 700, margin: 0 }}>出勤入力</h2>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#e9962510", padding: "6px 14px", borderRadius: 20,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, background: "#e9962530",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#e99625", fontSize: 12, fontWeight: 700,
          }}>{workerName.charAt(0)}</div>
          <span style={{ color: "#e99625", fontSize: 13, fontWeight: 600 }}>{workerName}</span>
        </div>
      </div>

      {/* Success toast */}
      {submitted && (
        <div style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          background: "#10b981", color: "#1f2937", padding: "12px 28px", borderRadius: 12,
          fontSize: 14, fontWeight: 600, zIndex: 100, boxShadow: "0 8px 32px rgba(16,185,129,0.3)",
          display: "flex", alignItems: "center", gap: 8, animation: "fadeDown 0.3s ease-out",
        }}>
          {Icons.check} 送信完了しました
        </div>
      )}

      <div style={{ padding: "24px 20px", maxWidth: 480, margin: "0 auto" }}>
        {/* Date Card */}
        <div style={{
          padding: "16px 20px", borderRadius: 14, marginBottom: 24,
          background: "rgba(78,168,222,0.06)", border: "1px solid rgba(78,168,222,0.12)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 500, marginBottom: 4 }}>日付</div>
            <div style={{ color: "#1f2937", fontSize: 18, fontWeight: 700 }}>{formatDate(form.date)}（{weekday(form.date)}）</div>
          </div>
          <input type="date" value={form.date} onChange={set("date")} style={{
            ...inputBase, width: "auto", padding: "8px 12px", fontSize: 13, borderRadius: 8,
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
                  padding: "14px 4px", borderRadius: 12, cursor: "pointer",
                  fontSize: 15, fontWeight: 700, transition: "all 0.2s", fontFamily: FONT,
                  border: isActive ? `2px solid ${accentColor}` : "2px solid #e5e7eb",
                  background: isActive ? `${accentColor}18` : "#f9fafb",
                  color: isActive ? accentColor : "#9ca3af",
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
                  flex: 1, padding: "14px 12px", borderRadius: 12, cursor: "pointer",
                  fontSize: 14, fontWeight: 700, transition: "all 0.2s", fontFamily: FONT,
                  border: form.quantity === o.v ? `2px solid ${o.c}` : "2px solid #e5e7eb",
                  background: form.quantity === o.v ? `${o.c}15` : "#f9fafb",
                  color: form.quantity === o.v ? o.c : "#9ca3af",
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
            padding: "16px 20px", borderRadius: 14, marginBottom: 20,
            background: form.quantity === -1 ? "rgba(139,92,246,0.06)" : form.quantity === -3 ? "rgba(234,140,28,0.06)" : form.quantity === -4 ? "rgba(249,115,22,0.06)" : "rgba(107,114,128,0.06)",
            border: `1px solid ${form.quantity === -1 ? "rgba(139,92,246,0.15)" : form.quantity === -3 ? "rgba(234,140,28,0.15)" : form.quantity === -4 ? "rgba(249,115,22,0.15)" : "rgba(107,114,128,0.15)"}`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{form.quantity === -1 ? "🌧️" : form.quantity === -3 ? "🚧" : form.quantity === -4 ? "📝" : "📅"}</div>
            <div style={{ color: form.quantity === -1 ? "#8b5cf6" : form.quantity === -3 ? "#ea8c1c" : form.quantity === -4 ? "#f97316" : "#6b7280", fontSize: 15, fontWeight: 700 }}>
              {form.quantity === -1 ? "休工（天候）" : form.quantity === -3 ? "休工（現場都合）" : form.quantity === -4 ? "予定欠勤" : "休日（指定休み）"}
            </div>
            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>現場名・作業内容の入力は不要です</div>
          </div>
        ) : isMeeting ? (
          <>
            <div style={{
              padding: "16px 20px", borderRadius: 14, marginBottom: 20,
              background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>⭐</div>
              <div style={{ color: "#0ea5e9", fontSize: 15, fontWeight: 700 }}>打合せ</div>
              <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>現場名を選択し、作業内容を入力してください</div>
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
              padding: "16px 20px", borderRadius: 14, marginBottom: 20,
              background: "rgba(30,64,175,0.06)", border: "1px solid rgba(30,64,175,0.15)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🌙</div>
              <div style={{ color: "#1e40af", fontSize: 15, fontWeight: 700 }}>夜勤</div>
              <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>現場名を選択し、作業内容を入力してください（1人工としてカウントします）</div>
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
          </>
        )}

        <Field label="備考">
          <textarea value={form.note} onChange={set("note")} placeholder="連絡事項があれば記入" rows={3} style={{ ...inputBase, resize: "vertical", minHeight: 80 }} />
        </Field>

        {dupError && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14, fontWeight: 600, textAlign: "center", marginTop: 8 }}>
            ⚠️ {formatDate(form.date)}はすでに入力済みです。<br/><span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>修正が必要な場合は事務員にご連絡ください。</span>
          </div>
        )}
        <button onClick={handleSubmit} disabled={!valid} style={{
          width: "100%", padding: "16px", borderRadius: 14, border: "none", fontFamily: FONT,
          cursor: valid ? "pointer" : "not-allowed",
          background: valid ? "linear-gradient(135deg, #e99625, #d4791a)" : "#f0f1f3",
          color: valid ? "#fff" : "#b0b5bd", fontSize: 16, fontWeight: 700,
          marginTop: 8, transition: "all 0.3s",
          boxShadow: valid ? "0 8px 32px rgba(233,150,37,0.25)" : "none",
        }}>{sending ? "送信中..." : "出勤を送信する"}</button>

        <button onClick={onGoAdmin} style={{
          width: "100%", padding: "14px", borderRadius: 14, border: "1px solid #e5e7eb",
          background: "#fff", color: "#6b7280", fontSize: 14, fontWeight: 600,
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
      <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#4b5563", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        {label}
        {required && <span style={{ color: "#e99625", fontSize: 11 }}>必須</span>}
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
    if (!workerSummary[r.worker_name]) workerSummary[r.worker_name] = { days: 0, distance: 0, sites: new Set() };
    workerSummary[r.worker_name].days += qty;
    workerSummary[r.worker_name].distance += Number(r.distance) || 0;
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

  const exportCSV = () => {
    const header = "名前,日付,曜日,現場名,出勤区分,作業内容,車距離(km),備考\n";
    const qLabel = (q) => q === 1 ? "1日" : q === 0.5 ? "半日" : q === 0 ? "欠勤" : q === -4 ? "予定欠勤" : q === -1 ? "休工(天候)" : q === -3 ? "休工(現場都合)" : q === -2 ? "休日" : q === -5 ? "打合せ" : q === -6 ? "夜勤" : q;
    const rows = filtered.map(r =>
      `${r.worker_name||""},${r.date},${weekday(r.date)},${r.site_name||""},${qLabel(r.quantity)},${r.content||""},${r.distance||0},${(r.note||"").replace(/,/g, "；")}`
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
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: FONT }}>
      <div style={{
        background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
        padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 4, display: "flex" }}>
          {Icons.arrowLeft}
        </button>
        <h2 style={{ color: "#1f2937", fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>出勤表管理</h2>
        <button onClick={exportCSV} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#4ea8de18", color: "#4ea8de", border: "1px solid #4ea8de30",
          padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: FONT,
        }}>{Icons.download} CSV出力</button>
      </div>

      <div style={{ padding: "20px 20px 0", display: "flex", gap: 10, overflowX: "auto" }}>
        <StatCard label="のべ人工数" value={totalManDays} unit="人工" color="#e99625" large />
        <StatCard label="稼働日数" value={workingDays} unit="日" color="#4ea8de" />
        <StatCard label="総走行距離" value={totalDistance} unit="km" color="#a78bfa" />
      </div>

      <div style={{ padding: "16px 20px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "#b0b5bd", display: "flex", alignItems: "center" }}>{Icons.filter}</span>
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
          <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ ...adminFilterSelect, borderColor: filterDate !== "all" ? "#e9962540" : undefined }}>
            <option value="all">全日付</option>
            {uniqueDates.map((d) => <option key={d} value={d}>{d.slice(5)}（{weekday(d)}）</option>)}
          </select>
        )}
      </div>

      <div style={{ padding: "0 20px", display: "flex", gap: 2, marginBottom: 16, overflowX: "auto" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, transition: "all 0.2s", fontFamily: FONT, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
            background: tab === t.id ? "rgba(78,168,222,0.15)" : "transparent",
            color: tab === t.id ? "#4ea8de" : "#9ca3af",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px 40px" }}>
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
  records.forEach(r => {
    const d = parseInt(r.date.split("-")[2]);
    const wn = r.worker_name || r.name;
    if (!lk[wn]) lk[wn] = {};
    if (r.quantity < 0) {
      lk[wn][d] = r.quantity;
    } else {
      lk[wn][d] = (lk[wn][d] || 0) + r.quantity;
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

  const thBase = { padding: "8px 4px", textAlign: "center", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#9ca3af" };
  const cdBase = { padding: "8px 6px", borderBottom: "1px solid #f0f1f3", color: "#6b7280", fontSize: 13 };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, color: "#9ca3af", fontSize: 12 }}>
        <span>{yr}年{mo}月 出勤表</span>
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
          <span><span style={{ color: "#ef4444", fontWeight: 700 }}>未</span> 未入力</span>
        </span>
      </div>
      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #edeef0" }}>
        <table style={{ borderCollapse: "collapse", minWidth: "100%", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thBase, position: "sticky", left: 0, zIndex: 2, minWidth: 90, background: "#f8f9fa", textAlign: "left", paddingLeft: 12 }}>名前</th>
              {days.map(d => {
                const w = getDow(d);
                return (
                  <th key={d} style={{ ...thBase, minWidth: 32, background: w === 0 ? "rgba(239,68,68,0.06)" : w === 6 ? "rgba(78,168,222,0.06)" : "#131e30" }}>
                    <div style={{ color: w === 0 ? "rgba(239,68,68,0.6)" : w === 6 ? "rgba(78,168,222,0.6)" : "#9ca3af", fontWeight: 600, lineHeight: 1.2 }}>{d}</div>
                    <div style={{ color: w === 0 ? "rgba(239,68,68,0.4)" : w === 6 ? "rgba(78,168,222,0.4)" : "#d1d5db", fontSize: 10 }}>{dl[w]}</div>
                  </th>
                );
              })}
              <th style={{ ...thBase, minWidth: 44, background: "#f8f9fa" }}>合計</th>
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
                  <td style={{ ...cdBase, position: "sticky", left: 0, zIndex: 1, background: "#ffffff", fontWeight: 600, color: "#374151", whiteSpace: "nowrap", paddingLeft: 12 }}>{name}</td>
                  {days.map(d => {
                    const val = dm[d]; const w = getDow(d); const hol = w === 0 || w === 6;
                    const hasRecord = d in dm;
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
                    return <td key={d} style={{ ...cdBase, textAlign: "center", fontWeight: 800, fontSize: fs, color: clr, background: hol ? "#fafafa" : "transparent" }}>{sym}</td>;
                  })}
                  <td style={{ ...cdBase, textAlign: "center", fontWeight: 800, fontSize: 14, color: "#e99625" }}>{tot}</td>
                </tr>
              );
            })}
            <tr>
              <td style={{ ...cdBase, position: "sticky", left: 0, zIndex: 1, background: "#f8f9fa", fontWeight: 700, color: "#9ca3af", fontSize: 11, paddingLeft: 12 }}>日計</td>
              {days.map(d => {
                const dt = active.reduce((s, n) => {
                  const v = (lk[n] || {})[d];
                  if (v === -6) return s + 1;
                  return s + (v > 0 ? v : 0);
                }, 0);
                return <td key={d} style={{ ...cdBase, textAlign: "center", fontWeight: 700, fontSize: 11, color: dt > 0 ? "#e99625" : "#f0f1f3", background: "#f3f4f6" }}>{dt > 0 ? dt : ""}</td>;
              })}
              <td style={{ ...cdBase, textAlign: "center", fontWeight: 800, fontSize: 14, color: "#e99625", background: "#f3f4f6" }}>
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
  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: FONT }}>
      <div style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 4, display: "flex" }}>{Icons.arrowLeft}</button>
        <h2 style={{ color: "#1f2937", fontSize: 18, fontWeight: 700, margin: 0 }}>設定</h2>
      </div>
      <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.12)", display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <span style={{ color: "#a78bfa" }}>{Icons.settings}</span>
          <div>
            <div style={{ color: "#1f2937", fontSize: 15, fontWeight: 700 }}>マスタ設定</div>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>作業員や現場の追加・削除ができます</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <MasterList title="作業員マスタ" items={workers} onAdd={async(n)=>{await DB.addWorker(n);onUpdateWorkers(await DB.getWorkers());}} onDelete={async(n)=>{await DB.delWorker(n);onUpdateWorkers(await DB.getWorkers());}} color="#e99625" placeholder="新しい作業員の名前" icon={Icons.user} />
          <MasterList title="現場マスタ" items={sites} onAdd={async(n)=>{await DB.addSite(n);onUpdateSites(await DB.getSites());}} onDelete={async(n)=>{await DB.delSite(n);onUpdateSites(await DB.getSites());}} color="#4ea8de" placeholder="新しい現場名" icon={<Icon d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />} />
        </div>
      </div>
      <style>{CSS}</style>
    </div>
  );
}

function MasterList({ title, items, onAdd, onDelete, color, placeholder, icon }) {
  const [newItem, setNewItem] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAdd = async () => {
    const trimmed = newItem.trim();
    if (!trimmed || items.includes(trimmed)) return;
    await onAdd(trimmed);
    setNewItem("");
  };

  const handleDelete = async (item) => {
    if (confirmDelete === item) {
      await onDelete(item);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(item);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ color }}>{icon}</span>
        <h3 style={{ color: "#1f2937", fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
        <span style={{ marginLeft: 8, padding: "2px 10px", borderRadius: 10, background: `${color}15`, color, fontSize: 12, fontWeight: 600 }}>{items.length}件</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === "Enter" && handleAdd()} style={{ ...inputBase, flex: 1, padding: "12px 14px", fontSize: 14, borderRadius: 10 }} />
        <button onClick={handleAdd} disabled={!newItem.trim()} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "12px 20px", borderRadius: 10,
          border: "none", cursor: newItem.trim() ? "pointer" : "not-allowed", fontFamily: FONT,
          background: newItem.trim() ? color : "#ffffff", color: newItem.trim() ? "#fff" : "#d1d5db",
          fontSize: 14, fontWeight: 600, transition: "all 0.2s", whiteSpace: "nowrap",
        }}>{Icons.plus} 追加</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, i) => (
          <div key={item} style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "#f9fafb", border: "1px solid #f0f1f3", animation: `fadeIn 0.2s ease-out` }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, marginRight: 12, background: `${color}12`, color: `${color}90`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ color: "#4b5563", fontSize: 14, flex: 1 }}>{item}</span>
            <button onClick={() => handleDelete(item)} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7,
              border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: FONT, transition: "all 0.2s",
              background: confirmDelete === item ? "#ef444420" : "#f9fafb", color: confirmDelete === item ? "#ef4444" : "#b0b5bd",
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
      flex: large ? "1.3 0 140px" : "1 0 110px", padding: large ? "18px 20px" : "16px 18px", borderRadius: 14,
      background: large ? `${color}08` : "#f9fafb", border: large ? `1px solid ${color}20` : "1px solid #edeef0",
    }}>
      <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ color, fontSize: large ? 34 : 28, fontWeight: 800, lineHeight: 1 }}>{value}</span>
        <span style={{ color: "#9ca3af", fontSize: 13, fontWeight: 500 }}>{unit}</span>
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
    setEditForm({ date: r.date, site_name: r.site_name || r.site, quantity: r.quantity, content: r.content, distance: r.distance || 0, note: r.note || "" });
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
          borderRadius: 14, overflow: "hidden",
          background: "#ffffff", border: editId === r.id ? "1.5px solid #4ea8de" : "1px solid #edeef0",
          padding: editId === r.id ? 0 : "16px 18px",
        }}>
          {editId === r.id ? (
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ color: "#4ea8de", fontSize: 13, fontWeight: 700 }}>✏️ 編集中：{r.worker_name || r.name}</div>
              <div><label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>日付</label><input type="date" value={editForm.date} onChange={ef("date")} style={{ display: "block", width: "calc(100%)", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e0e2e6", fontSize: 16, fontFamily: FONT, WebkitAppearance: "none", appearance: "none" }} /></div>
              <div><label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>出勤区分</label><select value={editForm.quantity} onChange={(e) => setEditForm(p => ({ ...p, quantity: Number(e.target.value) }))} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e0e2e6", fontSize: 14, fontFamily: FONT }}><option value={1}>1日</option><option value={0.5}>半日</option><option value={0}>欠勤</option><option value={-4}>予定欠勤</option><option value={-1}>休工（天候）</option><option value={-3}>休工（現場都合）</option><option value={-2}>休日</option><option value={-5}>打合せ</option><option value={-6}>夜勤</option></select></div>
              <div><label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>現場</label><select value={editForm.site_name} onChange={ef("site_name")} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e0e2e6", fontSize: 14, fontFamily: FONT }}>{(sites||[]).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>作業内容</label><input type="text" value={editForm.content} onChange={ef("content")} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e0e2e6", fontSize: 14, fontFamily: FONT }} /></div>
              <div><label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>距離(km)</label><input type="number" value={editForm.distance} onChange={ef("distance")} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e0e2e6", fontSize: 16, fontFamily: FONT, WebkitAppearance: "none", appearance: "none" }} /></div>
              <div><label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>備考</label><input type="text" value={editForm.note} onChange={ef("note")} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e0e2e6", fontSize: 14, fontFamily: FONT }} /></div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={cancelEdit} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>キャンセル</button>
                <button onClick={saveEdit} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "linear-gradient(135deg,#4ea8de,#3b82f6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>保存する</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "linear-gradient(135deg, #e9962520, #d4791a15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#e99625", fontSize: 14, fontWeight: 700,
                  }}>{(r.worker_name||r.name||"").charAt(0)}</div>
                  <div>
                    <div style={{ color: "#1f2937", fontSize: 14, fontWeight: 600 }}>{r.worker_name||r.name}</div>
                    <div style={{ color: "#9ca3af", fontSize: 12 }}>{formatDate(r.date)}（{weekday(r.date)}）</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    padding: "4px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: r.quantity === 1 ? "#10b98118" : r.quantity === 0.5 ? "#f59e0b18" : r.quantity === -2 ? "#6b728018" : r.quantity === -1 ? "#8b5cf618" : r.quantity === -3 ? "#ea8c1c18" : r.quantity === -4 ? "#f9731618" : r.quantity === -5 ? "#0ea5e918" : r.quantity === -6 ? "#1e40af18" : "#ef444418",
                    color: r.quantity === 1 ? "#10b981" : r.quantity === 0.5 ? "#f59e0b" : r.quantity === -2 ? "#6b7280" : r.quantity === -1 ? "#8b5cf6" : r.quantity === -3 ? "#ea8c1c" : r.quantity === -4 ? "#f97316" : r.quantity === -5 ? "#0ea5e9" : r.quantity === -6 ? "#1e40af" : "#ef4444",
                  }}>{r.quantity === 1 ? "1日" : r.quantity === 0.5 ? "半日" : r.quantity === -2 ? "休日" : r.quantity === -1 ? "休工(天候)" : r.quantity === -3 ? "休工(現場)" : r.quantity === -4 ? "予定欠" : r.quantity === -5 ? "打合せ" : r.quantity === -6 ? "夜勤" : "欠勤"}</div>
                  <button onClick={() => startEdit(r)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ea8de", padding: 4, display: "flex" }}><Icon d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} size={16} /></button>
                  <button onClick={() => handleDelete(r.id)} style={{ background: delConfirm === r.id ? "#fee2e2" : "none", border: "none", cursor: "pointer", color: delConfirm === r.id ? "#ef4444" : "#d1d5db", padding: 4, borderRadius: 6, display: "flex" }}>{Icons.trash}</button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13 }}>
                <span style={{ color: "#4ea8de" }}>📍 {r.site_name||r.site}</span>
                <span style={{ color: "#9ca3af" }}>🔧 {r.content}</span>
                {r.distance > 0 && <span style={{ color: "#9ca3af" }}>🚗 {r.distance}km</span>}
                {r.note && <span style={{ color: "#9ca3af" }}>📝 {r.note}</span>}
              </div>
              {delConfirm === r.id && <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444", fontWeight: 600 }}>もう一度押すと削除されます</div>}
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#9ca3af", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
        <span>作業員ごとの出勤集計</span>
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
          <div key={name} style={{ borderRadius: 14, overflow: "hidden", background: "#ffffff", border: "1px solid #edeef0" }}>
            <button onClick={() => setExpanded(isOpen ? null : name)} style={{
              width: "100%", padding: "16px 20px", border: "none", cursor: "pointer",
              background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #e9962520, #d4791a15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e99625", fontSize: 14, fontWeight: 700 }}>{name.charAt(0)}</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#1f2937", fontSize: 15, fontWeight: 700 }}>{name}</div>
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                    <span>走行 <span style={{ color: "#a78bfa", fontWeight: 600 }}>{Math.round(info.distance * 10) / 10}km</span></span>
                    <span>現場 <span style={{ color: "#4ea8de", fontWeight: 600 }}>{info.sites.size}件</span></span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#e99625", textAlign: "right" }}>
                  {info.days}<span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af", marginLeft: 4 }}>日</span>
                </div>
                <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "#b0b5bd", display: "flex" }}>{Icons.chevronDown}</div>
              </div>
            </button>
            {isOpen && (
              <div style={{ padding: "0 12px 16px", borderTop: "1px solid #f0f1f3" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(28px, 1fr))", gap: 3, marginTop: 12, padding: "0 4px" }}>
                  {days.map((day) => {
                    const val = dayMap[day];
                    const isSun = getDow(day) === 0;
                    const isSat = getDow(day) === 6;
                    let symbol = "", symColor = "rgba(0,0,0,0.03)", bg = "#fafafa";
                    if (val >= 1) { symbol = "◯"; symColor = "#10b981"; bg = "rgba(16,185,129,0.08)"; }
                    else if (val === 0.5) { symbol = "△"; symColor = "#f59e0b"; bg = "rgba(245,158,11,0.08)"; }
                    else if (val === -5) { symbol = "⭐"; symColor = "#0ea5e9"; bg = "rgba(14,165,233,0.08)"; }
                    else if (val === -6) { symbol = "夜"; symColor = "#1e40af"; bg = "rgba(30,64,175,0.08)"; }
                    return (
                      <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0 6px", borderRadius: 6, background: bg, border: `1px solid ${val ? symColor + "20" : "#f9fafb"}` }}>
                        <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1, color: isSun ? "rgba(239,68,68,0.5)" : isSat ? "rgba(78,168,222,0.5)" : "#b0b5bd", marginBottom: 2 }}>{day}</span>
                        <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1, color: isSun ? "rgba(239,68,68,0.35)" : isSat ? "rgba(78,168,222,0.35)" : "#d1d5db", marginBottom: 3 }}>{dowLabel(day)}</span>
                        <span style={{ fontSize: val === -6 ? 9 : 14, fontWeight: 800, lineHeight: 1, color: symColor }}>{symbol}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, padding: "0 4px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[...info.sites].map((s) => (
                    <span key={s} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: "rgba(78,168,222,0.08)", color: "rgba(78,168,222,0.7)", border: "1px solid rgba(78,168,222,0.12)" }}>{s}</span>
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
      <div style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>現場別の出勤状況 — 請求書の人工数と照合してください</div>
      {entries.map(([site, info]) => {
        const isOpen = expanded === site;
        const siteRecords = records.filter((r) => (r.site_name||r.site) === site).sort((a, b) => a.date.localeCompare(b.date));
        return (
          <div key={site} style={{ borderRadius: 14, overflow: "hidden", background: "#ffffff", border: "1px solid #edeef0" }}>
            <button onClick={() => setExpanded(isOpen ? null : site)} style={{
              width: "100%", padding: "18px 20px", border: "none", cursor: "pointer",
              background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "#4ea8de", fontSize: 15, fontWeight: 700 }}>{site}</div>
                <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{info.workers.size}名 · {[...info.workers].join("、")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#e99625" }}>{info.days}<span style={{ fontSize: 12, fontWeight: 500, color: "#b0b5bd", marginLeft: 3 }}>人工</span></div>
                <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginTop: 4, color: "#b0b5bd", display: "flex", justifyContent: "flex-end" }}>{Icons.chevronDown}</div>
              </div>
            </button>
            {isOpen && (
              <div style={{ padding: "0 20px 18px", borderTop: "1px solid #f0f1f3" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                  <thead>
                    <tr>
                      {["日付","名前","出勤区分","作業内容","距離"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px", fontSize: 11, fontWeight: 600, color: "#b0b5bd", borderBottom: "1px solid #edeef0" }}>{h}</th>
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
    <div style={{ maxWidth: 480 }}>
      <div style={{ padding: "16px 20px", borderRadius: 14, marginBottom: 24, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.12)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>📋</span>
        <div>
          <div style={{ color: "#1f2937", fontSize: 15, fontWeight: 700 }}>一括登録</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>全員または選択した作業員に休日・休工・打合せ・夜勤を一括で登録できます</div>
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
              padding: "14px 8px", borderRadius: 12, cursor: "pointer",
              fontSize: 14, fontWeight: 700, transition: "all 0.2s", fontFamily: FONT,
              border: type === o.v ? `2px solid ${o.c}` : "2px solid #e5e7eb",
              background: type === o.v ? `${o.c}15` : "#f9fafb",
              color: type === o.v ? o.c : "#9ca3af",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap",
            }}>{o.icon} {o.l}</button>
          ))}
        </div>
      </Field>

      <Field label="対象作業員" required>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={handleSelectAll} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            borderRadius: 10, border: selectAll ? `1.5px solid ${color}` : "1.5px solid #edeef0",
            background: selectAll ? `${color}10` : "#f9fafb", cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: selectAll ? color : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, transition: "all 0.15s" }}>{selectAll ? "✓" : ""}</div>
            <span style={{ color: selectAll ? "#1f2937" : "#6b7280", fontSize: 14, fontWeight: selectAll ? 600 : 400 }}>全員（{workers.length}名）</span>
          </button>
          <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {workers.map((w) => {
              const checked = selectAll || selectedWorkers.includes(w);
              return (
                <button key={w} onClick={() => toggleWorker(w)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                  borderRadius: 10, border: checked && !selectAll ? `1.5px solid ${color}` : "1.5px solid #f0f1f3",
                  background: checked && !selectAll ? `${color}08` : "#fafafa", cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: checked ? color : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, transition: "all 0.15s" }}>{checked ? "✓" : ""}</div>
                  <span style={{ color: "#4b5563", fontSize: 14 }}>{w}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Field>

      <div style={{ padding: "14px 18px", borderRadius: 12, marginBottom: 16, background: `${color}08`, border: `1px solid ${color}20`, fontSize: 13, color: "#4b5563" }}>
        <strong>{formatDate(date)}（{weekday(date)}）</strong>に
        <strong style={{ color }}> {label} </strong>を
        <strong>{selectAll ? `全員（${workers.length}名）` : `${selectedWorkers.length}名`}</strong>
        に登録します
      </div>

      {result && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 16,
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
        width: "100%", padding: "16px", borderRadius: 14, border: "none", fontFamily: FONT,
        cursor: canSubmit ? "pointer" : "not-allowed",
        background: canSubmit ? `linear-gradient(135deg, ${color}, ${type === -2 ? "#4b5563" : type === -3 ? "#b45309" : type === -4 ? "#c2410c" : type === -5 ? "#0284c7" : type === -6 ? "#1e3a8a" : "#6d28d9"})` : "#f0f1f3",
        color: canSubmit ? "#fff" : "#b0b5bd", fontSize: 16, fontWeight: 700,
        transition: "all 0.3s", boxShadow: canSubmit ? `0 8px 32px ${color}40` : "none",
      }}>{sending ? "登録中..." : `${label}を一括登録する`}</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#b0b5bd", fontSize: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      該当するデータがありません
    </div>
  );
}


// ─── Mount ───
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
