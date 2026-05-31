"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

/* ─────────────────────────── Types ─────────────────────────────── */
interface UserData  { _id:string; username:string; balance:number; exposure:number; createdAt:string; }
interface BetData   { _id:string; username:string; matchId:number; matchTitle:string; teamA:string; teamB:string; selectedTeam:string; amount:number; status:"pending"|"won"|"lost"|"cancelled"; placedAt:string; }
interface Notice    { text:string; color:"rose"|"amber"|"emerald"|"violet"|"sky"; order:number; }
interface AdminMatch {
  _id?:string; title:string; team_a:string; team_b:string;
  close_time_label:string; close_time_ms:number;
  status:"active"|"suspended"|"resulted";
  toss_winner:string|null; match_winner:string|null; order:number;
}
interface ProxyMatch { id:number; title:string; team_a:string; team_b:string; close_time_label:string; close_time_ms:number; }
interface SiteConfig { welcome_text:string; notices:Notice[]; matches:AdminMatch[]; achievements:Achievement[]; rules_text:string; }

interface Achievement { _id?:string; title:string; body:string; emoji:string; color:"gold"|"emerald"|"sky"|"rose"|"violet"; order:number; }
const ACHIEVEMENT_COLORS:Achievement["color"][] = ["gold","emerald","sky","rose","violet"];
const ACH_COLOR_LABELS:Record<Achievement["color"],string> = { gold:"🥇 Gold", emerald:"🟢 Emerald", sky:"🔵 Sky", rose:"🔴 Rose", violet:"🟣 Violet" };
const emptyAchievement = ():Achievement => ({ title:"", body:"", emoji:"🏆", color:"gold", order:0 });

const NOTICE_COLORS:Notice["color"][] = ["rose","amber","emerald","violet","sky"];
const COLOR_LABELS:Record<Notice["color"],string> = { rose:"🔴 Rose",amber:"🟡 Amber",emerald:"🟢 Emerald",violet:"🟣 Violet",sky:"🔵 Sky" };
const TABS = ["Matches","Live Matches","Notices","Banner","Achievements","Rules","Users","Bets"] as const;
type Tab = typeof TABS[number];
const GRADIENTS = ["bg-slate-900","bg-gradient-to-r from-slate-900 to-slate-800","bg-gradient-to-r from-slate-900 to-indigo-950","bg-gradient-to-r from-slate-900 to-sky-950","bg-gradient-to-r from-slate-900 to-emerald-950"];

const emptyMatch = ():AdminMatch => ({ title:"",team_a:"",team_b:"",close_time_label:"",close_time_ms:Date.now()+3600000,status:"active",toss_winner:null,match_winner:null,order:0 });

/* ── Card Preview ── */
function CardPreview({ m, idx }:{ m:AdminMatch|ProxyMatch; idx:number }) {
  const bg = GRADIENTS[idx % GRADIENTS.length];
  const am = m as AdminMatch;
  const isSuspended = am.status === "suspended";
  const isResulted  = am.status === "resulted";
  return (
    <div className={`w-full overflow-hidden rounded-2xl shadow-lg bg-white ${isSuspended?"opacity-60":""}`}>
      <div className={`relative overflow-hidden ${bg} px-3 pt-2 pb-2.5`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"/>
        {isSuspended && <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center"><span className="text-red-400 font-black text-xs uppercase tracking-widest border border-red-400 px-3 py-1 rounded-full">SUSPENDED</span></div>}
        <div className="relative z-10 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-300 line-clamp-1">{m.title}</span>
            {isResulted && <span className="text-[8px] text-emerald-300 font-bold shrink-0">✓ DONE</span>}
          </div>
          <div className="grid text-white" style={{gridTemplateColumns:"1fr auto 1fr"}}>
            <div className="text-center pr-2">
              <p className="text-xs font-black italic uppercase leading-tight">{m.team_a}</p>
              {am.toss_winner === m.team_a && <span className="text-[8px] text-yellow-300 font-bold">🏆 TOSS</span>}
              {am.match_winner === m.team_a && <span className="text-[8px] text-emerald-300 font-bold">🥇 WIN</span>}
            </div>
            <div className="flex flex-col items-center gap-0.5 px-1">
              <span className="bg-white/10 rounded-full px-2 py-0.5 text-[8px] font-black uppercase italic">VS</span>
              <span className="text-[7px] text-yellow-300 whitespace-nowrap">{m.close_time_label}</span>
            </div>
            <div className="text-center pl-2">
              <p className="text-xs font-black italic uppercase leading-tight">{m.team_b}</p>
              {am.toss_winner === m.team_b && <span className="text-[8px] text-yellow-300 font-bold">🏆 TOSS</span>}
              {am.match_winner === m.team_b && <span className="text-[8px] text-emerald-300 font-bold">🥇 WIN</span>}
            </div>
          </div>
        </div>
      </div>
      <div className={`flex items-center justify-center py-1 ${isSuspended?"bg-red-500":"bg-[#facc15]"}`}>
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-900">
          {isSuspended ? "SUSPENDED" : `TOSS BET CLOSE TIME : ${m.close_time_label}`}
        </span>
      </div>
    </div>
  );
}

/* ── Match Form ── */
function MatchForm({ form, setForm, onSave, onCancel, saving, isEdit }:{
  form:AdminMatch; setForm:(f:AdminMatch)=>void; onSave:()=>void; onCancel:()=>void; saving:boolean; isEdit:boolean;
}) {
  const dtVal = new Date(form.close_time_ms - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-5">
      <h3 className="text-sm font-black text-white uppercase tracking-widest">{isEdit?"Edit Match":"New Match"}</h3>

      {/* Basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="label">League / Title</label>
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. T20 BLAST 2026" className="inp"/>
        </div>
        <div>
          <label className="label">Team A</label>
          <input value={form.team_a} onChange={e=>setForm({...form,team_a:e.target.value})} placeholder="e.g. INDIA" className="inp"/>
        </div>
        <div>
          <label className="label">Team B</label>
          <input value={form.team_b} onChange={e=>setForm({...form,team_b:e.target.value})} placeholder="e.g. AUSTRALIA" className="inp"/>
        </div>
        <div>
          <label className="label">Close Time Label</label>
          <input value={form.close_time_label} onChange={e=>setForm({...form,close_time_label:e.target.value})} placeholder="e.g. 6:30 pm" className="inp"/>
        </div>
        <div>
          <label className="label">Close Time (datetime)</label>
          <input type="datetime-local" value={dtVal} onChange={e=>setForm({...form,close_time_ms:new Date(e.target.value).getTime()})} className="inp"/>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="label mb-2">Match Status</label>
        <div className="flex gap-2 flex-wrap">
          {(["active","suspended","resulted"] as const).map(s=>(
            <button key={s} onClick={()=>setForm({...form,status:s})}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.status===s ? s==="active"?"bg-emerald-500 text-white":s==="suspended"?"bg-red-500 text-white":"bg-violet-500 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
              {s==="active"?"✅ Active":s==="suspended"?"🚫 Suspended":"🏁 Resulted"}
            </button>
          ))}
        </div>
      </div>

      {/* Toss winner */}
      <div>
        <label className="label mb-2">🏆 Toss Winner</label>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setForm({...form,toss_winner:null})} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${!form.toss_winner?"bg-slate-500 text-white":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>None</button>
          {[form.team_a,form.team_b].filter(Boolean).map(t=>(
            <button key={t} onClick={()=>setForm({...form,toss_winner:t})}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${form.toss_winner===t?"bg-yellow-500 text-slate-900":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
              🏆 {t}
            </button>
          ))}
        </div>
      </div>

      {/* Match winner */}
      <div>
        <label className="label mb-2">🥇 Match Winner</label>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setForm({...form,match_winner:null})} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${!form.match_winner?"bg-slate-500 text-white":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>None</button>
          {[form.team_a,form.team_b].filter(Boolean).map(t=>(
            <button key={t} onClick={()=>setForm({...form,match_winner:t})}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${form.match_winner===t?"bg-emerald-500 text-white":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
              🥇 {t}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <p className="label mb-2">Preview</p>
        <div className="max-w-xs"><CardPreview m={form} idx={0}/></div>
      </div>

      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50">
          {saving?"Saving…":"Save Match"}
        </button>
        <button onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest">Cancel</button>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("Matches");
  const [users, setUsers] = useState<UserData[]>([]);
  const [bets, setBets] = useState<BetData[]>([]);
  const [config, setConfig] = useState<SiteConfig>({ welcome_text:"", notices:[], matches:[], achievements:[], rules_text:"" });
  const [proxyMatches, setProxyMatches] = useState<ProxyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  /* Users */
  const [editUserId, setEditUserId] = useState<string|null>(null);
  const [editBalance, setEditBalance] = useState("");

  /* Admin match form */
  const [matchForm, setMatchForm] = useState<AdminMatch>(emptyMatch());
  const [editMatchIdx, setEditMatchIdx] = useState<number|null>(null);

  /* Proxy match quick-edit */
  const [proxyEditId, setProxyEditId] = useState<number|null>(null);
  const [proxyForm, setProxyForm] = useState<AdminMatch>(emptyMatch());

  /* Achievement form */
  const [achForm, setAchForm] = useState<Achievement>(emptyAchievement());
  const [editAchIdx, setEditAchIdx] = useState<number|null>(null);
  const [noticeForm, setNoticeForm] = useState<Notice>({ text:"",color:"amber",order:0 });
  const [editNoticeIdx, setEditNoticeIdx] = useState<number|null>(null);

  function showToast(msg:string) { setToast(msg); setTimeout(()=>setToast(""),2500); }

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const [adminRes,cfgRes,proxyRes] = await Promise.all([
        fetch("/api/local/admin"),
        fetch("/api/local/siteconfig"),
        fetch("/api/proxy/dashboard",{credentials:"include",headers:{"X-Requested-With":"XMLHttpRequest",Accept:"application/json"}}),
      ]);
      if (adminRes.status===401) { window.location.href="/"; return; }
      const ad = await adminRes.json();
      const cf = await cfgRes.json();
      setUsers(ad.users||[]);
      setBets(ad.bets||[]);
      setConfig({ welcome_text:cf.welcome_text||"", notices:cf.notices||[], matches:cf.matches||[], achievements:cf.achievements||[], rules_text:cf.rules_text||"" });
      if (proxyRes.ok) {
        const pd = await proxyRes.json();
        setProxyMatches((pd.contests||[]).map((c:Record<string,unknown>)=>({
          id:Number(c.id), title:String(c.title||c.match_title||""), team_a:String(c.team_a||""), team_b:String(c.team_b||""),
          close_time_label:String(c.close_time_label||""), close_time_ms:Number(c.close_time_ms||0),
        })));
      }
    } catch { showToast("Failed to load"); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  async function saveConfig(patch:Partial<SiteConfig>) {
    setSaving(true);
    try {
      const res = await fetch("/api/local/siteconfig",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(patch) });
      if (res.ok) { showToast("Saved ✓"); await load(); } else showToast("Save failed");
    } catch { showToast("Network error"); }
    finally { setSaving(false); }
  }

  /* Admin match CRUD */
  function saveAdminMatch() {
    if (!matchForm.title||!matchForm.team_a||!matchForm.team_b||!matchForm.close_time_label) { showToast("Fill all fields"); return; }
    const updated=[...config.matches];
    if (editMatchIdx!==null && editMatchIdx>=0) updated[editMatchIdx]=matchForm;
    else updated.push({...matchForm,order:updated.length});
    setConfig(c=>({...c,matches:updated}));
    saveConfig({matches:updated});
    setEditMatchIdx(null); setMatchForm(emptyMatch());
  }
  function deleteAdminMatch(i:number) {
    const updated=config.matches.filter((_,idx)=>idx!==i);
    setConfig(c=>({...c,matches:updated})); saveConfig({matches:updated});
  }
  function quickUpdateAdminMatch(i:number, patch:Partial<AdminMatch>) {
    const updated=config.matches.map((m,idx)=>idx===i?{...m,...patch}:m);
    setConfig(c=>({...c,matches:updated})); saveConfig({matches:updated});
  }

  /* Proxy match overlay — stored as admin match with same id */
  function startProxyEdit(pm:ProxyMatch) {
    const existing = config.matches.find(m=>String(m._id)===String(pm.id)||m.title===pm.title&&m.team_a===pm.team_a);
    setProxyForm(existing ? {...existing} : { ...emptyMatch(), title:pm.title, team_a:pm.team_a, team_b:pm.team_b, close_time_label:pm.close_time_label, close_time_ms:pm.close_time_ms });
    setProxyEditId(pm.id);
  }
  function saveProxyMatch() {
    const updated=[...config.matches];
    const existingIdx=updated.findIndex(m=>m.title===proxyForm.title&&m.team_a===proxyForm.team_a);
    if (existingIdx>=0) updated[existingIdx]=proxyForm;
    else updated.push({...proxyForm,order:updated.length});
    setConfig(c=>({...c,matches:updated})); saveConfig({matches:updated});
    setProxyEditId(null); setProxyForm(emptyMatch());
  }

  /* Notice CRUD */
  function saveNotice() {
    if (!noticeForm.text.trim()) { showToast("Text required"); return; }
    const updated=[...config.notices];
    if (editNoticeIdx!==null&&editNoticeIdx>=0) updated[editNoticeIdx]=noticeForm;
    else updated.push({...noticeForm,order:updated.length});
    setConfig(c=>({...c,notices:updated})); saveConfig({notices:updated});
    setEditNoticeIdx(null); setNoticeForm({text:"",color:"amber",order:0});
  }

  /* User/Bet */
  async function handleUpdateBalance(userId:string) {
    const bal=parseInt(editBalance,10); if(isNaN(bal)) return;
    const res=await fetch("/api/local/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,newBalance:bal})});
    if(res.ok){setEditUserId(null);showToast("Balance updated ✓");load();}else showToast("Failed");
  }
  async function handleResolveBet(betId:string,status:BetData["status"]) {
    const res=await fetch("/api/local/admin",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({betId,status})});
    if(res.ok){showToast(`Marked ${status} ✓`);load();}else showToast("Failed");
  }
  /* Achievement CRUD */
  function saveAchievement() {
    if (!achForm.title.trim()||!achForm.body.trim()) { showToast("Title and body required"); return; }
    const updated=[...config.achievements];
    if (editAchIdx!==null&&editAchIdx>=0) updated[editAchIdx]=achForm;
    else updated.push({...achForm,order:updated.length});
    setConfig(c=>({...c,achievements:updated})); saveConfig({achievements:updated});
    setEditAchIdx(null); setAchForm(emptyAchievement());
  }
  function deleteAchievement(i:number) {
    const updated=config.achievements.filter((_,idx)=>idx!==i);
    setConfig(c=>({...c,achievements:updated})); saveConfig({achievements:updated});
  }

  async function handleLogout() { await fetch("/api/local/logout"); window.location.href="/"; }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white text-sm font-bold animate-pulse">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" style={{fontFamily:"Roboto,sans-serif"}}>
      <style>{`.label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:4px}.inp{width:100%;background:#0f172a;border:1px solid #475569;border-radius:.75rem;padding:.625rem .75rem;font-size:.875rem;color:#fff;outline:none}.inp:focus{border-color:#04f5ff}`}</style>

      {toast&&<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-5 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-widest">{toast}</div>}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="Logo" width={36} height={36} className="rounded-full"/>
          <div><h1 className="text-sm font-black text-white uppercase tracking-widest">Admin Panel</h1><p className="text-[10px] text-slate-500">Site Management</p></div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard" className="text-[10px] text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">View Site</a>
          <button onClick={handleLogout} className="text-[10px] bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg font-bold text-white">Sign Out</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 flex gap-1 overflow-x-auto">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${tab===t?"border-[#04f5ff] text-[#04f5ff]":"border-transparent text-slate-500 hover:text-slate-300"}`}>{t}</button>
        ))}
      </div>

      <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

        {/* ══ MATCHES TAB ══ */}
        {tab==="Matches"&&(
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-widest">My Matches <span className="text-slate-500 text-sm font-normal">({config.matches.length})</span></h2>
              <button onClick={()=>{setEditMatchIdx(-1);setMatchForm(emptyMatch());}} className="bg-[#04f5ff] text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90">+ Add Match</button>
            </div>

            {editMatchIdx!==null&&(
              <MatchForm form={matchForm} setForm={setMatchForm} onSave={saveAdminMatch} onCancel={()=>{setEditMatchIdx(null);setMatchForm(emptyMatch());}} saving={saving} isEdit={editMatchIdx>=0}/>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.matches.length===0&&<div className="col-span-3 text-center py-12 text-slate-500 text-sm">No matches yet. Click + Add Match.</div>}
              {config.matches.map((m,i)=>(
                <div key={i}>
                  <CardPreview m={m} idx={i}/>
                  {/* Quick actions */}
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1.5">
                      <button onClick={()=>{setEditMatchIdx(i);setMatchForm({...m});}} className="flex-1 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 rounded-lg py-1.5 text-[10px] font-bold uppercase">Edit</button>
                      <button onClick={()=>quickUpdateAdminMatch(i,{status:m.status==="suspended"?"active":"suspended"})}
                        className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase ${m.status==="suspended"?"bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30":"bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}>
                        {m.status==="suspended"?"Activate":"Suspend"}
                      </button>
                      <button onClick={()=>deleteAdminMatch(i)} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg px-3 py-1.5 text-[10px] font-bold">✕</button>
                    </div>
                    {/* Toss quick-set */}
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest shrink-0">Toss:</span>
                      <button onClick={()=>quickUpdateAdminMatch(i,{toss_winner:m.team_a})} className={`flex-1 rounded-lg py-1 text-[9px] font-bold uppercase ${m.toss_winner===m.team_a?"bg-yellow-500 text-slate-900":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>{m.team_a||"A"}</button>
                      <button onClick={()=>quickUpdateAdminMatch(i,{toss_winner:m.team_b})} className={`flex-1 rounded-lg py-1 text-[9px] font-bold uppercase ${m.toss_winner===m.team_b?"bg-yellow-500 text-slate-900":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>{m.team_b||"B"}</button>
                      <button onClick={()=>quickUpdateAdminMatch(i,{toss_winner:null})} className="px-2 rounded-lg py-1 text-[9px] text-slate-500 hover:text-slate-300 bg-slate-800">✕</button>
                    </div>
                    {/* Winner quick-set */}
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest shrink-0">Win:</span>
                      <button onClick={()=>quickUpdateAdminMatch(i,{match_winner:m.team_a,status:"resulted"})} className={`flex-1 rounded-lg py-1 text-[9px] font-bold uppercase ${m.match_winner===m.team_a?"bg-emerald-500 text-white":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>{m.team_a||"A"}</button>
                      <button onClick={()=>quickUpdateAdminMatch(i,{match_winner:m.team_b,status:"resulted"})} className={`flex-1 rounded-lg py-1 text-[9px] font-bold uppercase ${m.match_winner===m.team_b?"bg-emerald-500 text-white":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>{m.team_b||"B"}</button>
                      <button onClick={()=>quickUpdateAdminMatch(i,{match_winner:null})} className="px-2 rounded-lg py-1 text-[9px] text-slate-500 hover:text-slate-300 bg-slate-800">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ LIVE MATCHES TAB (proxy matches from original site) ══ */}
        {tab==="Live Matches"&&(
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Live Matches <span className="text-slate-500 text-sm font-normal">({proxyMatches.length} from source)</span></h2>
              <p className="text-[10px] text-slate-500">Click Edit to set toss/winner/suspend on any live match</p>
            </div>

            {/* Proxy match edit form */}
            {proxyEditId!==null&&(
              <MatchForm form={proxyForm} setForm={setProxyForm} onSave={saveProxyMatch} onCancel={()=>{setProxyEditId(null);setProxyForm(emptyMatch());}} saving={saving} isEdit={true}/>
            )}

            {proxyMatches.length===0&&<div className="text-center py-12 text-slate-500 text-sm">No live matches loaded. Check proxy connection.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proxyMatches.map((pm,i)=>{
                const override=config.matches.find(m=>m.title===pm.title&&m.team_a===pm.team_a);
                const display:AdminMatch = override ? override : {...emptyMatch(),...pm,status:"active"};
                return (
                  <div key={pm.id}>
                    <CardPreview m={display} idx={i}/>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1.5">
                        <button onClick={()=>startProxyEdit(pm)} className="flex-1 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 rounded-lg py-1.5 text-[10px] font-bold uppercase">Edit / Override</button>
                        <button onClick={()=>{
                          const newStatus: AdminMatch["status"] = display.status==="suspended"?"active":"suspended";
                          if(override){
                            const idx=config.matches.findIndex(m=>m.title===pm.title&&m.team_a===pm.team_a);
                            quickUpdateAdminMatch(idx,{status:newStatus});
                          } else {
                            const updated:AdminMatch[]=[...config.matches,{...emptyMatch(),...pm,status:newStatus,order:config.matches.length}];
                            setConfig(c=>({...c,matches:updated})); saveConfig({matches:updated});
                          }
                        }} className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase ${display.status==="suspended"?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400"}`}>
                          {display.status==="suspended"?"Activate":"Suspend"}
                        </button>
                      </div>
                      {/* Toss quick-set */}
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest shrink-0">Toss:</span>
                        {[pm.team_a,pm.team_b].map(t=>(
                          <button key={t} onClick={()=>{
                            if(override){const idx=config.matches.findIndex(m=>m.title===pm.title&&m.team_a===pm.team_a);quickUpdateAdminMatch(idx,{toss_winner:t});}
                            else{const updated:AdminMatch[]=[...config.matches,{...emptyMatch(),...pm,toss_winner:t,order:config.matches.length}];setConfig(c=>({...c,matches:updated}));saveConfig({matches:updated});}
                          }} className={`flex-1 rounded-lg py-1 text-[9px] font-bold uppercase ${display.toss_winner===t?"bg-yellow-500 text-slate-900":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>{t}</button>
                        ))}
                      </div>
                      {/* Winner quick-set */}
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest shrink-0">Win:</span>
                        {[pm.team_a,pm.team_b].map(t=>(
                          <button key={t} onClick={()=>{
                            if(override){const idx=config.matches.findIndex(m=>m.title===pm.title&&m.team_a===pm.team_a);quickUpdateAdminMatch(idx,{match_winner:t,status:"resulted"});}
                            else{const updated:AdminMatch[]=[...config.matches,{...emptyMatch(),...pm,match_winner:t,status:"resulted" as const,order:config.matches.length}];setConfig(c=>({...c,matches:updated}));saveConfig({matches:updated});}
                          }} className={`flex-1 rounded-lg py-1 text-[9px] font-bold uppercase ${display.match_winner===t?"bg-emerald-500 text-white":"bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ NOTICES TAB ══ */}
        {tab==="Notices"&&(
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Notice Strip</h2>
              <button onClick={()=>{setEditNoticeIdx(-1);setNoticeForm({text:"",color:"amber",order:0});}} className="bg-[#04f5ff] text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90">+ Add Notice</button>
            </div>
            {editNoticeIdx!==null&&(
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{editNoticeIdx>=0?"Edit":"New"} Notice</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="label">Text</label><input value={noticeForm.text} onChange={e=>setNoticeForm(f=>({...f,text:e.target.value}))} placeholder="e.g. INDIA VS AUS TOSS BET ON" className="inp"/></div>
                  <div><label className="label">Color</label>
                    <select value={noticeForm.color} onChange={e=>setNoticeForm(f=>({...f,color:e.target.value as Notice["color"]}))} className="inp">
                      {NOTICE_COLORS.map(c=><option key={c} value={c}>{COLOR_LABELS[c]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveNotice} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50">{saving?"Saving…":"Save"}</button>
                  <button onClick={()=>setEditNoticeIdx(null)} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {config.notices.length===0&&<div className="text-center py-12 text-slate-500 text-sm">No notices yet.</div>}
              {config.notices.map((n,i)=>{
                const cm:Record<Notice["color"],string>={rose:"bg-rose-950/95 border-rose-500/40 text-rose-100",amber:"bg-amber-950/95 border-amber-500/40 text-amber-100",emerald:"bg-emerald-950/95 border-emerald-500/40 text-emerald-100",violet:"bg-violet-950/95 border-violet-500/40 text-violet-100",sky:"bg-sky-950/95 border-sky-500/40 text-sky-100"};
                return (
                  <div key={i} className="flex items-center gap-3 bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <div className={`inline-flex items-center rounded-lg border px-3 py-1 text-[10px] font-semibold flex-1 ${cm[n.color]}`}>{n.text}</div>
                    <span className="text-[10px] text-slate-500 capitalize">{n.color}</span>
                    <button onClick={()=>{setEditNoticeIdx(i);setNoticeForm({...n});}} className="text-sky-400 hover:text-sky-300 text-[10px] font-bold uppercase">Edit</button>
                    <button onClick={()=>{const u=config.notices.filter((_,idx)=>idx!==i);setConfig(c=>({...c,notices:u}));saveConfig({notices:u});}} className="text-rose-400 hover:text-rose-300 text-[10px] font-bold">✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ BANNER TAB ══ */}
        {tab==="Banner"&&(
          <div className="space-y-6">
            <h2 className="text-lg font-black text-white uppercase tracking-widest">Welcome Banner</h2>
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
              <label className="label">Scrolling Text</label>
              <textarea value={config.welcome_text} onChange={e=>setConfig(c=>({...c,welcome_text:e.target.value}))} rows={3} className="inp resize-none"/>
              <div className="rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 py-3 overflow-hidden">
                <div className="overflow-hidden px-4 whitespace-nowrap text-slate-900 text-[13px] font-medium">
                  <span className="inline-flex items-center pr-16">{config.welcome_text}</span>
                  <span className="inline-flex items-center pr-16 opacity-60">{config.welcome_text}</span>
                </div>
              </div>
              <button onClick={()=>saveConfig({welcome_text:config.welcome_text})} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50">{saving?"Saving…":"Save Banner"}</button>
            </div>
          </div>
        )}

        {/* ══ USERS TAB ══ */}
        {tab==="Users"&&(
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white uppercase tracking-widest">Users ({users.length})</h2>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-700/50 text-slate-400 text-[11px] uppercase tracking-widest">
                    <tr><th className="px-4 py-3">Username</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Exposure</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {users.map(u=>(
                      <tr key={u._id} className="hover:bg-slate-700/20">
                        <td className="px-4 py-3 font-bold text-white">{u.username}</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{editUserId===u._id?<input type="number" value={editBalance} onChange={e=>setEditBalance(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 w-24 text-white text-sm"/>:`${u.balance} Rs.`}</td>
                        <td className="px-4 py-3 text-amber-400 font-bold">{u.exposure} Rs.</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{editUserId===u._id?<div className="flex gap-2"><button onClick={()=>handleUpdateBalance(u._id)} className="text-emerald-400 text-xs font-bold">Save</button><button onClick={()=>setEditUserId(null)} className="text-slate-400 text-xs">Cancel</button></div>:<button onClick={()=>{setEditUserId(u._id);setEditBalance(u.balance.toString());}} className="text-sky-400 hover:text-sky-300 text-xs font-bold">Edit Balance</button>}</td>
                      </tr>
                    ))}
                    {users.length===0&&<tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ BETS TAB ══ */}
        {tab==="Bets"&&(
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white uppercase tracking-widest">All Bets ({bets.length})</h2>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-700/50 text-slate-400 text-[11px] uppercase tracking-widest">
                    <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Match</th><th className="px-4 py-3">Pick</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Placed</th><th className="px-4 py-3">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {bets.map(b=>(
                      <tr key={b._id} className="hover:bg-slate-700/20">
                        <td className="px-4 py-3 font-bold text-white">{b.username}</td>
                        <td className="px-4 py-3"><div className="text-[10px] text-slate-400">{b.matchTitle}</div><div className="text-white text-xs font-semibold">{b.teamA} vs {b.teamB}</div></td>
                        <td className="px-4 py-3 font-bold text-sky-400 text-xs">{b.selectedTeam}</td>
                        <td className="px-4 py-3 font-bold text-emerald-400">{b.amount} Rs.</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${b.status==="pending"?"bg-amber-500/20 text-amber-400":b.status==="won"?"bg-emerald-500/20 text-emerald-400":b.status==="lost"?"bg-rose-500/20 text-rose-400":"bg-slate-500/20 text-slate-400"}`}>{b.status}</span></td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{new Date(b.placedAt).toLocaleString()}</td>
                        <td className="px-4 py-3">{b.status==="pending"?<div className="flex gap-1.5"><button onClick={()=>handleResolveBet(b._id,"won")} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[10px] font-bold">Won</button><button onClick={()=>handleResolveBet(b._id,"lost")} className="px-2 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded text-[10px] font-bold">Lost</button><button onClick={()=>handleResolveBet(b._id,"cancelled")} className="px-2 py-1 bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 rounded text-[10px] font-bold">Cancel</button></div>:<button onClick={()=>handleResolveBet(b._id,"pending")} className="px-2 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded text-[10px] font-bold">Revert</button>}</td>
                      </tr>
                    ))}
                    {bets.length===0&&<tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No bets</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ ACHIEVEMENTS TAB ══ */}
        {tab==="Achievements"&&(
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Achievement Posts</h2>
              <button onClick={()=>{setEditAchIdx(-1);setAchForm(emptyAchievement());}} className="bg-[#04f5ff] text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90">+ Add Post</button>
            </div>

            {editAchIdx!==null&&(
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{editAchIdx>=0?"Edit":"New"} Achievement Post</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="label">Title</label><input value={achForm.title} onChange={e=>setAchForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Big Win Alert!" className="inp"/></div>
                  <div className="flex gap-2">
                    <div className="flex-1"><label className="label">Emoji</label><input value={achForm.emoji} onChange={e=>setAchForm(f=>({...f,emoji:e.target.value}))} placeholder="🏆" className="inp text-center text-xl"/></div>
                    <div className="flex-1"><label className="label">Color</label>
                      <select value={achForm.color} onChange={e=>setAchForm(f=>({...f,color:e.target.value as Achievement["color"]}))} className="inp">
                        {ACHIEVEMENT_COLORS.map(c=><option key={c} value={c}>{ACH_COLOR_LABELS[c]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2"><label className="label">Body / Message</label>
                    <textarea value={achForm.body} onChange={e=>setAchForm(f=>({...f,body:e.target.value}))} rows={4} placeholder="Write the achievement post content here..." className="inp resize-none"/>
                  </div>
                </div>
                {/* Preview */}
                <div className="bg-gradient-to-br from-yellow-950/80 to-amber-950/80 border border-yellow-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{achForm.emoji||"🏆"}</span>
                    <h3 className="font-heading font-black text-sm uppercase tracking-widest text-yellow-300">{achForm.title||"Title"}</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{achForm.body||"Body text..."}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveAchievement} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50">{saving?"Saving…":"Save Post"}</button>
                  <button onClick={()=>setEditAchIdx(null)} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {config.achievements.length===0&&<div className="text-center py-12 text-slate-500 text-sm">No achievement posts yet.</div>}
              {config.achievements.map((a,i)=>(
                <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-start gap-4">
                  <span className="text-2xl shrink-0">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm uppercase tracking-widest">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.body}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={()=>{setEditAchIdx(i);setAchForm({...a});}} className="text-sky-400 hover:text-sky-300 text-[10px] font-bold uppercase">Edit</button>
                    <button onClick={()=>deleteAchievement(i)} className="text-rose-400 hover:text-rose-300 text-[10px] font-bold">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ RULES TAB ══ */}
        {tab==="Rules"&&(
          <div className="space-y-6">
            <h2 className="text-lg font-black text-white uppercase tracking-widest">Rules Page Content</h2>
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
              <div>
                <label className="label mb-2">Rules Text (one rule per line)</label>
                <textarea value={config.rules_text} onChange={e=>setConfig(c=>({...c,rules_text:e.target.value}))}
                  rows={14} placeholder={"1. Minimum bet amount is 100 Rs.\n2. Minimum withdrawal is 500 Rs.\n3. ..."}
                  className="inp resize-none font-mono text-xs leading-relaxed"/>
              </div>
              {/* Preview */}
              <div>
                <p className="label mb-2">Preview</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {config.rules_text.split("\n").filter(l=>l.trim()).map((line,i)=>(
                    <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl px-3 py-2">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#04f5ff]/20 text-[#04f5ff] text-[9px] font-black flex items-center justify-center mt-0.5">{i+1}</span>
                      <p className="text-xs text-slate-300">{line.replace(/^\d+\.\s*/,"")}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={()=>saveConfig({rules_text:config.rules_text})} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50">{saving?"Saving…":"Save Rules"}</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
