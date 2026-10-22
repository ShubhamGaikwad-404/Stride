"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type Day = { date: string; weight: string; steps: string; water: string; sleep: string; mood: string; workout: string; note: string; calories: string; protein: string };
type Store = { days: Record<string, Day>; targets: { calories: number; protein: number; steps: number; water: number }; meals: Record<string, { name: string; calories: number; protein: number }[]> };
const dateKey = () => new Date().toLocaleDateString("en-CA");
const freshDay = (): Day => ({ date: dateKey(), weight: "", steps: "", water: "", sleep: "", mood: "", workout: "", note: "", calories: "", protein: "" });
const initial: Store = { days: {}, targets: { calories: 2200, protein: 140, steps: 5000, water: 8 }, meals: {} };
const weekPlan = ["Chest + triceps", "Back + biceps", "Legs", "Shoulders + abs", "Arms + upper body", "Yoga or easy recovery", "Rest"];
const prettyDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

export default function Home() {
  const [store, setStore] = useState<Store>(initial);
  const [day, setDay] = useState<Day>(freshDay);
  const [tab, setTab] = useState<"today" | "plan" | "progress">("today");
  const [mealName, setMealName] = useState("");
  const [mealKcal, setMealKcal] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stride-simple-v1");
      if (raw) window.setTimeout(() => setStore({ ...initial, ...JSON.parse(raw) }), 0);
    } catch { /* Start fresh if local data is unreadable. */ }
  }, []);
  useEffect(() => { window.setTimeout(() => setDay({ ...freshDay(), ...(store.days[dateKey()] || {}) }), 0); }, [store]);
  useEffect(() => { if (supabase) supabase.auth.getUser().then(({ data }) => setUser(data.user?.email ?? null)); }, []);
  const meals = store.meals[dateKey()] || [];
  const totals = useMemo(() => meals.reduce((a, m) => ({ calories: a.calories + m.calories, protein: a.protein + m.protein }), { calories: Number(day.calories) || 0, protein: Number(day.protein) || 0 }), [meals, day.calories, day.protein]);
  const todayWorkout = weekPlan[(new Date().getDay() + 6) % 7];
  const save = (next: Store, message = "Saved for today") => {
    setStore(next);
    localStorage.setItem("stride-simple-v1", JSON.stringify(next));
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };
  const edit = (key: keyof Day, value: string) => {
    const nextDay = { ...day, [key]: value };
    const next = { ...store, days: { ...store.days, [dateKey()]: nextDay } };
    setDay(nextDay);
    setStore(next);
    localStorage.setItem("stride-simple-v1", JSON.stringify(next));
  };
  const addMeal = () => {
    if (!mealName.trim()) return;
    const next = { ...store, meals: { ...store.meals, [dateKey()]: [...meals, { name: mealName.trim(), calories: Number(mealKcal) || 0, protein: Number(mealProtein) || 0 }] } };
    save(next, "Meal added"); setMealName(""); setMealKcal(""); setMealProtein("");
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "stride-data.json"; a.click(); URL.revokeObjectURL(a.href);
  };
  const signIn = async () => {
    if (!supabase || !email) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setNotice(error ? error.message : "Check your email for a sign-in link");
  };
  const sync = async () => {
    if (!supabase) { setNotice("Add Supabase keys to enable cloud sync"); return; }
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setAuthOpen(true); return; }
    const { error } = await supabase.from("user_data").upsert({ user_id: data.user.id, data: store, updated_at: new Date().toISOString() });
    setNotice(error ? "Cloud sync needs the Supabase setup in README" : "Synced to your account");
  };

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#today"><span className="brand-mark">s</span> stride</a><button className="quiet-button" onClick={download} aria-label="Download your data">Export</button></header>
    <nav className="tabs" aria-label="Main navigation">{(["today", "plan", "progress"] as const).map(t => <button key={t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>{t === "today" ? "Today" : t === "plan" ? "My week" : "Progress"}</button>)}</nav>

    {tab === "today" && <>
      <section className="welcome"><p className="eyebrow">{prettyDate}</p><h1>One day at a time.</h1><p>Small check-ins are enough. Pick up where you are.</p></section>
      <section className="focus-card"><div><p className="eyebrow">TODAY&apos;S MOVEMENT</p><h2>{todayWorkout}</h2><p>{todayWorkout === "Rest" ? "Take a proper rest day." : todayWorkout === "Yoga or easy recovery" ? "Keep it easy and enjoy your practice." : "Start light. You can build from here."}</p></div><button className={day.workout ? "check checked" : "check"} onClick={() => edit("workout", day.workout ? "" : todayWorkout)}>{day.workout ? "Done ✓" : "Mark done"}</button></section>
      <section className="section-head"><div><p className="eyebrow">YOUR DAILY CHECK-IN</p><h2>Keep it simple</h2></div><button className="text-button" onClick={sync}>Sync</button></section>
      <section className="check-grid">
        <article className="check-card"><div className="card-icon peach">↗</div><div className="card-top"><h3>Steps</h3><span>of {store.targets.steps.toLocaleString()}</span></div><strong>{Number(day.steps || 0).toLocaleString()}</strong><div className="progress-track"><i style={{ width: `${Math.min(100, (Number(day.steps) / store.targets.steps) * 100)}%` }} /></div><label className="inline-input"><input aria-label="Steps today" inputMode="numeric" placeholder="Add today's steps" value={day.steps} onChange={e => edit("steps", e.target.value)} /><span>steps</span></label></article>
        <article className="check-card"><div className="card-icon blue">◉</div><div className="card-top"><h3>Water</h3><span>of {store.targets.water} glasses</span></div><strong>{Number(day.water || 0)} <small>glasses</small></strong><div className="water-buttons">{Array.from({ length: Math.min(8, store.targets.water) }, (_, i) => <button key={i} aria-label={`Set ${i + 1} glasses`} className={Number(day.water) > i ? "water-dot filled" : "water-dot"} onClick={() => edit("water", String(i + 1))} />)}</div></article>
        <article className="check-card"><div className="card-icon green">◷</div><div className="card-top"><h3>Sleep</h3><span>last night</span></div><label className="big-input"><input aria-label="Sleep hours" type="number" min="0" max="24" step="0.5" placeholder="—" value={day.sleep} onChange={e => edit("sleep", e.target.value)} /><small>hours</small></label><p className="hint">A rough estimate is fine.</p></article>
        <article className="check-card"><div className="card-icon lilac">♡</div><div className="card-top"><h3>How are you?</h3></div><div className="moods">{["Low", "Okay", "Good"].map(m => <button key={m} className={day.mood === m ? "mood selected" : "mood"} onClick={() => edit("mood", m)}>{m === "Low" ? "☁" : m === "Okay" ? "◡" : "☀"}<span>{m}</span></button>)}</div></article>
      </section>
      <section className="food-section"><div className="section-head compact"><div><p className="eyebrow">NO NEED TO COUNT EVERYTHING</p><h2>Food, if useful</h2></div><span className="soft-pill">{totals.protein}g protein</span></div><div className="food-summary"><div><strong>{totals.calories.toLocaleString()}</strong><span> / {store.targets.calories} kcal</span></div><p>{totals.calories >= store.targets.calories ? "Daily target reached" : `${Math.max(0, store.targets.calories - totals.calories)} kcal to your starting target`}</p></div><div className="food-progress"><i style={{ width: `${Math.min(100, totals.calories / store.targets.calories * 100)}%` }} /></div>
        <div className="meal-form"><input aria-label="Meal name" placeholder="Meal or snack (e.g. paneer bhurji)" value={mealName} onChange={e => setMealName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMeal()} /><input aria-label="Meal calories" inputMode="numeric" placeholder="kcal" value={mealKcal} onChange={e => setMealKcal(e.target.value)} /><input aria-label="Meal protein" inputMode="numeric" placeholder="protein g" value={mealProtein} onChange={e => setMealProtein(e.target.value)} /><button onClick={addMeal}>Add</button></div>
        {meals.length > 0 && <ul className="meal-list">{meals.map((m, i) => <li key={`${m.name}-${i}`}><span>{m.name}</span><span>{m.calories} kcal · {m.protein}g protein</span><button aria-label={`Remove ${m.name}`} onClick={() => save({ ...store, meals: { ...store.meals, [dateKey()]: meals.filter((_, j) => i !== j) } }, "Meal removed")}>×</button></li>)}</ul>}
      </section>
      <details className="optional"><summary>Optional: log bodyweight or a note</summary><div className="optional-grid"><label>Weight<input type="number" step="0.1" placeholder="kg" value={day.weight} onChange={e => edit("weight", e.target.value)} /></label><label>Quick note<input placeholder="Energy, soreness, anything…" value={day.note} onChange={e => edit("note", e.target.value)} /></label></div></details>
      <footer className="sync-note"><span>✓ Your check-ins save on this device automatically.</span><button onClick={() => setAuthOpen(!authOpen)}>{user ? user : "Optional cloud backup"}</button></footer>
      {authOpen && <section className="auth-box"><p>{supabaseConfigured ? "Email yourself a secure sign-in link to back up your data." : "Cloud backup is optional. Add your Supabase keys and follow the README to enable it."}</p>{supabaseConfigured && <div className="meal-form"><input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /><button onClick={signIn}>Email me a link</button></div>}</section>}
    </>}

    {tab === "plan" && <><section className="welcome"><p className="eyebrow">A GENTLE START</p><h1>Your week, at a glance.</h1><p>Follow the rhythm, or adapt it to your energy.</p></section><section className="plan-list">{weekPlan.map((item, i) => <article key={item} className="plan-row"><span className="day-number">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</span><div><h3>{item}</h3><p>{i < 5 ? i === 1 || i === 3 ? "Lift + optional easy 15–20 min cardio" : "Strength training · 75–90 min" : i === 5 ? "One yoga day · 7–8 AM" : "Rest and recover"}</p></div>{i === (new Date().getDay() + 6) % 7 && <span className="today-tag">Today</span>}</article>)}</section><div className="gentle-note"><strong>First two weeks back</strong><p>Use 2 working sets per exercise and finish with 3–4 reps still in reserve. Rest 2–3 min on main lifts, 60–120 sec on smaller movements. Add a little weight after you can complete the top of your rep range with good form.</p></div><div className="gentle-note"><strong>Daily movement</strong><p>Start near 5,000 steps. Increase gradually toward 6–7k if it feels manageable; lifting stays the priority.</p></div></>}

    {tab === "progress" && <><section className="welcome"><p className="eyebrow">ZOOM OUT</p><h1>Progress takes time.</h1><p>Look for trends across weeks, not changes from one day.</p></section><section className="check-grid progress-grid"><article className="check-card"><p className="eyebrow">LATEST WEIGHT</p><strong>{day.weight || "—"}<small> {day.weight ? "kg" : "Log on Today"}</small></strong></article><article className="check-card"><p className="eyebrow">CHECK-INS</p><strong>{Object.keys(store.days).length}<small> days logged</small></strong></article><article className="check-card"><p className="eyebrow">STARTING CALORIES</p><strong>{store.targets.calories}<small> kcal / day</small></strong></article><article className="check-card"><p className="eyebrow">STARTING PROTEIN</p><strong>{store.targets.protein}<small> g / day</small></strong></article></section><section className="gentle-note"><strong>Adjust slowly</strong><p>Use 7-day average weight and 2–3 weeks of trends before changing your targets. These calorie and macro numbers are editable starting estimates, not medical advice.</p></section><section className="target-card"><h2>Starting targets</h2><div className="target-grid">{([["calories", "Calories", "kcal"], ["protein", "Protein", "g"], ["steps", "Steps", "steps"], ["water", "Water", "glasses"]] as const).map(([key, name, unit]) => <label key={key}>{name}<div><input type="number" value={store.targets[key]} onChange={e => save({ ...store, targets: { ...store.targets, [key]: Number(e.target.value) || 0 } })} /><small>{unit}</small></div></label>)}</div></section><button className="export-wide" onClick={download}>Download my data</button></>}
    {notice && <div className="toast" role="status">{notice}</div>}
    <p className="disclaimer">A personal tracker, not medical advice. Use what helps and leave what doesn&apos;t.</p>
  </main>;
}

