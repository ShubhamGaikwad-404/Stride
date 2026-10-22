"use client";
/* eslint-disable react/no-unescaped-entities */
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, BarChart3, Bell, Check, ChevronDown, CircleHelp, Clock3, Dumbbell, Footprints, Heart, Home, Leaf, Menu, Plus, Settings2, Sparkles, Sun, Target, TrendingUp, Utensils, Waves, X } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type Tab = "Today" | "Training" | "Nutrition" | "Progress";
type MealEntry = { title: string; calories: number; protein: number; time: string };
type Log = { date: string; weight?: number; calories?: number; protein?: number; steps?: number; water?: number; sleep?: number; meals?: MealEntry[]; workoutDone?: boolean; mood?: string; energy?: number; soreness?: number; note?: string };
type Measurements = { waist: number; abdomen: number; hips: number; flexedArm: number; relaxedArm: number; thigh: number; forearm: number; calf: number };
const baseTargets = { calories: 2200, protein: 140, carbs: 275, fat: 60, steps: 5000, water: 2500, weight: 69.7 };
const initialMeasurements: Measurements = { waist: 32.5, abdomen: 34, hips: 38.5, flexedArm: 12, relaxedArm: 11.2, thigh: 21, forearm: 10.2, calf: 13.5 };
const days = [
  { day: "MON", name: "Chest + triceps", focus: "Strength", mark: "01", tint: "green" },
  { day: "TUE", name: "Back + biceps", focus: "+ 15–20 min cardio", mark: "02", tint: "blue" },
  { day: "WED", name: "Legs", focus: "Strength", mark: "03", tint: "orange" },
  { day: "THU", name: "Shoulders + abs", focus: "+ 15–20 min cardio", mark: "04", tint: "lavender" },
  { day: "FRI", name: "Arms + upper", focus: "Accessories", mark: "05", tint: "pink" },
  { day: "SAT", name: "Yoga", focus: "7–8 AM · recovery", mark: "06", tint: "yellow" },
  { day: "SUN", name: "Rest day", focus: "A little movement", mark: "07", tint: "gray" },
];
const initialLog: Log = { date: new Date().toISOString().slice(0, 10), weight: 69.7, calories: 0, protein: 0, steps: 0, water: 0, sleep: 0, meals: [] };

function Bar({ value, max, color = "#4b7659" }: { value: number; max: number; color?: string }) { return <div className="bar"><span style={{ width: `${Math.min(100, value / max * 100)}%`, background: color }}/></div>; }

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("Today");
  const [targets, setTargets] = useState(baseTargets);
  const [measurements, setMeasurements] = useState<Measurements>(initialMeasurements);
  const [log, setLog] = useState<Log>(initialLog);
  const [logs, setLogs] = useState<Log[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState<"meal" | "weight" | "steps" | "workout" | "checkin" | "measurements" | "settings" | "auth" | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [syncReady, setSyncReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ title: "", value: "" });
  const [checkin, setCheckin] = useState({ mood: "Steady", energy: 3, soreness: 2 });
  const [mobileNav, setMobileNav] = useState(false);
  const todayWorkout = days[(new Date().getDay() + 6) % 7];
  const weekLabel = useMemo(() => { const today = new Date(); const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase(); }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- Initialize the profile from local storage before enabling persistence. */
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    try {
      const stored = localStorage.getItem("stride-v1");
      if (stored) { const parsed = JSON.parse(stored); if (parsed.targets) setTargets({ ...baseTargets, ...parsed.targets }); if (parsed.measurements) setMeasurements({ ...initialMeasurements, ...parsed.measurements }); if (parsed.log) setLog(parsed.log.date === initialLog.date ? { ...initialLog, ...parsed.log } : { ...initialLog, weight: parsed.log.weight ?? initialLog.weight }); if (parsed.logs) setLogs(parsed.logs); }
    } catch { /* Keep a fresh local profile if saved data is unreadable. */ }
    if (!supabase || !supabaseConfigured) { setHydrated(true); setSyncReady(true); return; }
    void supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (user) {
        const { data: row } = await supabase!.from("user_data").select("profile").eq("user_id", user.id).maybeSingle();
        if (row?.profile) { const profile = row.profile as { targets?: typeof baseTargets; measurements?: Measurements; log?: Log; logs?: Log[] }; if (profile.targets) setTargets({ ...baseTargets, ...profile.targets }); if (profile.measurements) setMeasurements({ ...initialMeasurements, ...profile.measurements }); if (profile.log) setLog({ ...initialLog, ...profile.log }); if (profile.logs) setLogs(profile.logs); }
        setAccount(user.email || "Signed in");
      }
      setHydrated(true); setSyncReady(true);
    }).catch(() => { setHydrated(true); setSyncReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") { setAccount(null); return; }
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => { if (hydrated) localStorage.setItem("stride-v1", JSON.stringify({ targets, measurements, log, logs })); }, [targets, measurements, log, logs, hydrated]);
  useEffect(() => { if (syncReady && account && supabase) { void supabase.auth.getUser().then(({ data }) => { if (data.user) void supabase!.from("user_data").upsert({ user_id: data.user.id, profile: { targets, measurements, log, logs }, updated_at: new Date().toISOString() }); }); } }, [targets, measurements, log, logs, account, syncReady]);

  const remaining = useMemo(() => Math.max(0, targets.calories - (log.calories || 0)), [targets.calories, log.calories]);
  const week = useMemo(() => { const today = new Date(); const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); return Array.from({ length: 7 }, (_, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); return { d: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0,1), n: String(date.getDate()), active: date.toDateString() === today.toDateString(), done: date.toDateString() === today.toDateString() && Boolean(log.workoutDone) }; }); }, [log.workoutDone]);
  function notify(s: string) { setNotice(s); window.setTimeout(() => setNotice(""), 2800); }
  function saveQuick() {
    const n = Number(form.value);
    if (modal === "meal") { const kcal = n || 350, title = form.title.trim() || "Meal or snack"; setLog(v => ({ ...v, calories: (v.calories || 0) + kcal, protein: (v.protein || 0) + Math.round(kcal * .07), meals: [...(v.meals || []), { title, calories: kcal, protein: Math.round(kcal * .07), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }] })); }
    if (modal === "weight" && n > 0) { setLog(v => ({ ...v, weight: n })); setLogs(v => [{ date: new Date().toISOString().slice(0,10), weight: n }, ...v.filter(x => x.date !== new Date().toISOString().slice(0,10))]); }
    if (modal === "steps" && n > 0) setLog(v => ({ ...v, steps: n }));
    if (modal === "checkin") setLog(v => ({ ...v, sleep: n > 0 ? n : v.sleep, mood: checkin.mood, energy: checkin.energy, soreness: checkin.soreness }));
    if (modal === "workout") { setLog(v => ({ ...v, workoutDone: true })); notify("Workout marked complete. Nice work."); } else notify("Saved to your daily log.");
    setModal(null); setForm({ title: "", value: "" });
  }
  function exportData() { const blob = new Blob([JSON.stringify({ targets, measurements, log, logs }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "stride-health-data.json"; a.click(); URL.revokeObjectURL(url); }
  async function sendMagicLink() { if (!supabase || !email.includes("@")) { notify("Enter a valid email address."); return; } const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }); if (error) notify(error.message); else { notify("Check your email for your sign-in link."); setModal(null); } }

  return <main className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <a className="brand" href="#today" onClick={() => setTab("Today")}><span className="brand-mark"><Activity size={20}/></span><span>stride<span className="brand-dot">.</span><small>YOUR HEALTH, IN RHYTHM</small></span></a>
      <div className="profile-mini"><div className="avatar">S</div><div><b>My space</b><span>Personal dashboard</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">YOUR SPACE</div>
      <nav>{([ ["Today", Home], ["Training", Dumbbell], ["Nutrition", Utensils], ["Progress", BarChart3] ] as const).map(([name, Icon]) => <button key={name} className={`nav-item ${tab === name ? "selected" : ""}`} onClick={() => { setTab(name); setMobileNav(false); }}><Icon size={18}/>{name}{name === "Today" && <span className="nav-dot"/>}</button>)}</nav>
      <div className="nav-label plan-label">THIS WEEK <span>WEEK 01</span></div>
      <div className="week-list">{days.map((x, i) => <div className={`week-line ${i === (new Date().getDay() + 6) % 7 ? "current" : ""}`} key={x.day}><span className="week-day">{x.day.slice(0,1)}</span><span>{x.name}</span>{i < (new Date().getDay() + 6) % 7 && <Check size={13} className="done-check"/>}</div>)}</div>
      <div className="sidebar-note"><div className="note-leaf"><Leaf size={17}/></div><b>Small steps add up.</b><p>You're building a rhythm, not