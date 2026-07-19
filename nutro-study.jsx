import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Flame,
  Heart,
  Play,
  Pause,
  X,
  Check,
  Sparkles,
  Languages,
  Calculator,
  FlaskConical,
  Landmark,
  BookOpen,
  ChevronLeft,
  Users,
  RotateCcw,
  Award,
  Star,
  Lock,
  Bell,
} from "lucide-react";

/* ---------------------------------------------------------
   NUTRO STUDY — design tokens
   bg:        #171B13  (matte deep olive-black)
   surface:   #20251A
   surface2:  #2A311F
   border:    #343B27
   olive:     #7C8F58   (primary accent)
   oliveSoft: #9AAB78
   amber:     #E3A23D   (streak / points / hybrid lab accent)
   text:      #ECE8DA
   textMuted: #8D9481
   font display/body: Tajawal — font mono (timer): IBM Plex Mono
--------------------------------------------------------- */

const T = {
  bg: "#171B13",
  surface: "#20251A",
  surface2: "#2A311F",
  border: "#343B27",
  olive: "#7C8F58",
  oliveSoft: "#9AAB78",
  amber: "#E3A23D",
  amberSoft: "#F0C27B",
  text: "#ECE8DA",
  textMuted: "#8D9481",
};

const POMODORO_SECONDS = 25 * 60;
const STATE_KEY = "nutro-user-state";
const CHARITY_KEY = "nutro-charity-pool";

const SUBJECTS = [
  {
    id: "english",
    name: "اللغة الإنجليزية",
    icon: Languages,
    tasks: [
      "استمع لمقطع صوتي قصير — 3 دقائق",
      "احفظ 5 مفردات جديدة",
      "حل تمرين قواعد سريع",
    ],
  },
  {
    id: "math",
    name: "الرياضيات",
    icon: Calculator,
    tasks: ["حل 3 مسائل تدريبية", "راجع القانون الأساسي للدرس", "حل اختبار قصير — 5 أسئلة"],
  },
  {
    id: "science",
    name: "العلوم",
    icon: FlaskConical,
    tasks: ["اقرأ ملخص الدرس — صفحة واحدة", "شاهد رسمًا توضيحيًا وارسمه", "أجب عن سؤالين تطبيقيين"],
  },
  {
    id: "social",
    name: "الدراسات",
    icon: Landmark,
    tasks: ["راجع خريطة أو جدولًا زمنيًا", "اقرأ فقرة واحدة بتركيز", "لخّص الدرس في 3 أسطر"],
  },
  {
    id: "arabic",
    name: "اللغة العربية",
    icon: BookOpen,
    tasks: ["اقرأ نصًا قصيرًا بصوت عالٍ", "استخرج 3 قواعد نحوية", "اكتب فقرة تعبير قصيرة"],
  },
  {
    id: "hybridlab",
    name: "مختبر اللغة الهجين",
    icon: Sparkles,
    special: true,
    tasks: [
      "استمع بلكنة أمريكية — 5 دقائق",
      "كرّر جملًا بصوت عالٍ (Shadowing)",
      "سجّل صوتك وقارنه بالنطق الأصلي",
    ],
  },
];

const BADGES = [
  { id: "spark", name: "الشرارة الأولى", desc: "أكمل أول جلسة تركيز", icon: Flame, check: (s) => s.streak >= 1 },
  { id: "three", name: "مثابرة 3 أيام", desc: "حافظ على الشعلة 3 أيام", icon: Flame, check: (s) => s.streak >= 3 },
  { id: "week", name: "أسبوع كامل", desc: "حافظ على الشعلة 7 أيام", icon: Award, check: (s) => s.streak >= 7 },
  { id: "month", name: "شهر التميز", desc: "حافظ على الشعلة 30 يومًا", icon: Award, check: (s) => s.streak >= 30 },
  { id: "hundred", name: "مجتهد 100", desc: "اجمع 100 نقطة نترو", icon: Star, check: (s) => (s.totalEarnedPoints || 0) >= 100 },
  { id: "giver", name: "قلب معطاء", desc: "تبرّع بأول نقاط لك", icon: Heart, check: (s) => s.donated > 0 },
];

function unlockedBadgeIds(s) {
  return BADGES.filter((b) => b.check(s)).map((b) => b.id);
}

const MOTIVATION_QUOTES = [
  "خطوة صغيرة اليوم أفضل من خطة كبيرة مؤجلة.",
  "التركيز لعشرين دقيقة يساوي ساعة من التشتت.",
  "لست بحاجة للمزاج المناسب، فقط ابدأ بمهمة واحدة صغيرة.",
  "كل مهمة تُنجز الآن، عبء أقل عن نفسك لاحقًا.",
  "الاستمرارية تصنع الفرق، لا الكمال.",
  "عقلك يستحق عشرين دقيقة هادئة بلا تشتت.",
  "أنت أقرب لهدفك مما كنت عليه بالأمس.",
  "لا تقارن يومك بغيرك، قارنه بنفسك أمس فقط.",
  "المذاكرة القصيرة والمنتظمة تهزم المذاكرة الطويلة المتقطعة.",
  "ثقتك بنفسك تُبنى من مهام صغيرة أنجزتها بصدق.",
  "لست متأخرًا، أنت فقط في بداية مسارك الخاص.",
  "كل جلسة تركيز هي استثمار صغير في نسختك القادمة.",
];

function pickQuote() {
  return MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const defaultState = {
  points: 0,
  totalEarnedPoints: 0,
  streak: 0,
  lastCompletionDate: null,
  completedToday: [],
  completedTodayDate: todayStr(),
  donated: 0,
};

export default function NutroStudy() {
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState(defaultState);
  const [view, setView] = useState("home"); // home | focus | done
  const [activeTask, setActiveTask] = useState(null); // {subjectId, idx, title, color}
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_SECONDS);
  const [running, setRunning] = useState(false);
  const [charityPool, setCharityPool] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const intervalRef = useRef(null);

  // ---- load
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STATE_KEY, false);
        let s = res ? JSON.parse(res.value) : defaultState;
        if (s.totalEarnedPoints === undefined) s.totalEarnedPoints = s.points || 0;
        // roll over day
        const t = todayStr();
        if (s.completedTodayDate !== t) {
          s = { ...s, completedToday: [], completedTodayDate: t };
        }
        // streak decay if missed more than one day
        if (s.lastCompletionDate && s.lastCompletionDate !== t && s.lastCompletionDate !== yesterdayStr()) {
          s = { ...s, streak: 0 };
        }
        setState(s);
      } catch (e) {
        setState(defaultState);
      }
      try {
        const pool = await window.storage.get(CHARITY_KEY, true);
        setCharityPool(pool ? JSON.parse(pool.value) : { totalPoints: 0 });
      } catch (e) {
        setCharityPool({ totalPoints: 0 });
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setState(next);
    try {
      await window.storage.set(STATE_KEY, JSON.stringify(next), false);
    } catch (e) {
      /* ignore */
    }
  }, []);

  // ---- timer
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            handleSessionComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function startTask(subject, idx) {
    setActiveTask({ subjectId: subject.id, idx, title: subject.tasks[idx], color: subject.special ? T.amber : T.olive, subjectName: subject.name });
    setSecondsLeft(POMODORO_SECONDS);
    setRunning(true);
    setView("focus");
  }

  function cancelFocus() {
    setRunning(false);
    clearInterval(intervalRef.current);
    setView("home");
    setActiveTask(null);
  }

  async function handleSessionComplete() {
    setRunning(false);
    if (!activeTask) return;
    const taskId = `${activeTask.subjectId}-${activeTask.idx}`;
    const t = todayStr();
    const already = state.completedToday.includes(taskId);
    let next = { ...state };
    const beforeBadges = unlockedBadgeIds(state);
    if (!already) {
      next.completedToday = [...state.completedToday, taskId];
      next.points = state.points + 10;
      next.totalEarnedPoints = (state.totalEarnedPoints || 0) + 10;
      if (state.lastCompletionDate === t) {
        // streak already counted today
      } else if (state.lastCompletionDate === yesterdayStr()) {
        next.streak = state.streak + 1;
      } else {
        next.streak = 1;
      }
      next.lastCompletionDate = t;
    }
    const afterBadges = unlockedBadgeIds(next);
    const earned = afterBadges.find((id) => !beforeBadges.includes(id));
    setNewBadge(earned ? BADGES.find((b) => b.id === earned) : null);
    await persist(next);
    setView("done");
  }

  async function donate(amount) {
    if (state.points < amount) return;
    const next = { ...state, points: state.points - amount, donated: state.donated + amount };
    await persist(next);
    try {
      const pool = charityPool || { totalPoints: 0 };
      const updated = { totalPoints: (pool.totalPoints || 0) + amount };
      await window.storage.set(CHARITY_KEY, JSON.stringify(updated), true);
      setCharityPool(updated);
    } catch (e) {
      /* ignore */
    }
  }

  if (!loaded) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Flame color={T.amber} size={28} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Tajawal', sans-serif", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        @keyframes flicker { 0%,100% { opacity:1; transform: scale(1);} 50% { opacity:.85; transform: scale(1.04);} }
        .flame-anim { animation: flicker 2.2s ease-in-out infinite; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform: translateY(0);} }
        .fade-up { animation: fadeUp .4s ease both; }
        button:focus-visible, [role="button"]:focus-visible { outline: 2px solid ${T.amber}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .flame-anim, .fade-up { animation: none !important; }
        }
      `}</style>

      {view === "home" && (
        <HomeView
          state={state}
          charityPool={charityPool}
          onStart={startTask}
          onDonate={donate}
        />
      )}

      {view === "focus" && activeTask && (
        <FocusRoom
          task={activeTask}
          secondsLeft={secondsLeft}
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onCancel={cancelFocus}
        />
      )}

      {view === "done" && activeTask && (
        <DoneView
          task={activeTask}
          streak={state.streak}
          badge={newBadge}
          onContinue={() => {
            setView("home");
            setActiveTask(null);
            setNewBadge(null);
          }}
        />
      )}
    </div>
  );
}

function HomeView({ state, charityPool, onStart, onDonate }) {
  const doneCount = state.completedToday.length;
  const totalTasks = SUBJECTS.reduce((a, s) => a + s.tasks.length, 0);
  const [quote] = useState(pickQuote);

  return (
    <div className="fade-up" style={{ maxWidth: 480, margin: "0 auto", padding: "28px 18px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 1, color: T.textMuted, marginBottom: 2 }}>NUTRO STUDY</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>مساء الهدوء 🌙</div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            padding: "8px 14px",
          }}
        >
          <Flame size={18} color={T.amber} className="flame-anim" />
          <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: T.amber }}>
            {state.streak}
          </span>
        </div>
      </div>

      {/* Motivation quote */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: `${T.olive}14`,
          border: `1px solid ${T.olive}40`,
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 18,
        }}
      >
        <Sparkles size={15} color={T.oliveSoft} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, lineHeight: 1.7, color: T.oliveSoft, fontWeight: 500 }}>{quote}</span>
      </div>

      {/* Stats card */}
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: 20,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <div>
            <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 4 }}>نقاط نترو</div>
            <div className="mono" style={{ fontSize: 30, fontWeight: 600, color: T.oliveSoft }}>
              {state.points}
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 4 }}>اليوم</div>
            <div className="mono" style={{ fontSize: 18, color: T.text }}>
              {doneCount}/{totalTasks}
            </div>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, (doneCount / totalTasks) * 100)}%`,
              background: `linear-gradient(90deg, ${T.olive}, ${T.amber})`,
              transition: "width .4s ease",
            }}
          />
        </div>
      </div>

      {/* Charity card */}
      <div
        style={{
          background: `linear-gradient(135deg, ${T.surface2}, ${T.surface})`,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: 18,
          marginBottom: 26,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Heart size={16} color={T.amber} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>وجّه تركيزك لهدف أسمى</span>
        </div>
        <p style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.7, margin: "0 0 12px" }}>
          حوّل نقاط مذاكرتك إلى دعم لمبادرات مكافحة الجوع. رصيد المجتمع الحالي:{" "}
          <span className="mono" style={{ color: T.amberSoft }}>
            {charityPool?.totalPoints ?? 0}
          </span>{" "}
          نقطة.
        </p>
        <button
          onClick={() => onDonate(20)}
          disabled={state.points < 20}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: state.points < 20 ? T.surface2 : T.amber,
            color: state.points < 20 ? T.textMuted : "#1B1608",
            border: "none",
            borderRadius: 12,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 700,
            cursor: state.points < 20 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          <Users size={15} />
          تبرّع بـ 20 نقطة
        </button>
      </div>

      {/* Reminder status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `${T.olive}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bell size={15} color={T.oliveSoft} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>تذكير المذاكرة مفعّل</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>كل يوم الساعة 7:00 مساءً</div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 10, paddingRight: 2 }}>الإنجازات</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 26,
        }}
      >
        {BADGES.map((b) => {
          const unlocked = b.check(state);
          const BIcon = b.icon;
          return (
            <div
              key={b.id}
              title={b.desc}
              style={{
                background: unlocked ? `${T.amber}14` : T.surface,
                border: `1px solid ${unlocked ? T.amber + "55" : T.border}`,
                borderRadius: 16,
                padding: "14px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: unlocked ? `${T.amber}25` : T.surface2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unlocked ? <BIcon size={16} color={T.amber} /> : <Lock size={13} color={T.textMuted} />}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: unlocked ? T.amberSoft : T.textMuted, lineHeight: 1.4 }}>
                {b.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subjects */}
      <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 10, paddingRight: 2 }}>موادّ اليوم</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SUBJECTS.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} completedToday={state.completedToday} onStart={onStart} />
        ))}
      </div>
    </div>
  );
}

function SubjectCard({ subject, completedToday, onStart }) {
  const [open, setOpen] = useState(false);
  const Icon = subject.icon;
  const accent = subject.special ? T.amber : T.olive;
  const doneCount = subject.tasks.filter((_, i) => completedToday.includes(`${subject.id}-${i}`)).length;

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${subject.special ? "rgba(227,162,61,0.35)" : T.border}`,
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          color: T.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: `${accent}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} color={accent} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{subject.name}</div>
            <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>
              {doneCount}/{subject.tasks.length} مهام مكتملة
            </div>
          </div>
        </div>
        <ChevronLeft
          size={18}
          color={T.textMuted}
          style={{ transform: open ? "rotate(-90deg)" : "none", transition: "transform .2s ease" }}
        />
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {subject.tasks.map((task, idx) => {
            const done = completedToday.includes(`${subject.id}-${idx}`);
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: T.surface2,
                  borderRadius: 12,
                  padding: "10px 12px",
                  opacity: done ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1.5 }}>{task}</span>
                {done ? (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: `${accent}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={14} color={accent} />
                  </div>
                ) : (
                  <button
                    onClick={() => onStart(subject, idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: accent,
                      color: "#161A11",
                      border: "none",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      flexShrink: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    <Play size={12} fill="#161A11" />
                    ابدأ
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FocusRoom({ task, secondsLeft, running, onToggle, onCancel }) {
  const pct = 1 - secondsLeft / POMODORO_SECONDS;
  const R = 120;
  const C = 2 * Math.PI * R;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050603",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <button
        onClick={onCancel}
        aria-label="إلغاء"
        style={{
          position: "absolute",
          top: 22,
          left: 22,
          background: "transparent",
          border: `1px solid ${T.border}`,
          borderRadius: 999,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.textMuted,
          cursor: "pointer",
        }}
      >
        <X size={18} />
      </button>

      <div style={{ fontSize: 12, letterSpacing: 1.5, color: T.textMuted, marginBottom: 6 }}>
        {task.subjectName}
      </div>
      <div style={{ fontSize: 15, color: T.text, marginBottom: 36, textAlign: "center", padding: "0 40px", lineHeight: 1.6 }}>
        {task.title}
      </div>

      <div style={{ position: "relative", width: 260, height: 260 }}>
        <svg width="260" height="260" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="130" cy="130" r={R} fill="none" stroke="#1C2015" strokeWidth="6" />
          <circle
            cx="130"
            cy="130"
            r={R}
            fill="none"
            stroke={task.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div
          className="mono"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 600,
            color: T.text,
          }}
        >
          {fmt(secondsLeft)}
        </div>
      </div>

      <button
        onClick={onToggle}
        style={{
          marginTop: 44,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: task.color,
          color: "#161A11",
          border: "none",
          borderRadius: 999,
          padding: "12px 28px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {running ? <Pause size={16} fill="#161A11" /> : <Play size={16} fill="#161A11" />}
        {running ? "إيقاف مؤقت" : "استئناف"}
      </button>

      <div style={{ marginTop: 18, fontSize: 11.5, color: "#5A5F4E" }}>غرفة التركيز — بلا إشعارات، بلا تشتت</div>
    </div>
  );
}

function DoneView({ task, streak, badge, onContinue }) {
  const [quote] = useState(pickQuote);
  return (
    <div
      className="fade-up"
      style={{
        position: "fixed",
        inset: 0,
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 999,
          background: `${task.color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Check size={34} color={task.color} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>أحسنت! جلسة مكتملة</div>
      <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>{task.title}</div>

      <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "10px 18px" }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>نقاط</div>
          <div className="mono" style={{ fontSize: 16, color: T.oliveSoft, fontWeight: 600 }}>+10</div>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "10px 18px" }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>الشعلة</div>
          <div className="mono" style={{ fontSize: 16, color: T.amber, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
            <Flame size={13} /> {streak}
          </div>
        </div>
      </div>

      {badge && (
        <div
          className="fade-up"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: `${T.amber}18`,
            border: `1px solid ${T.amber}55`,
            borderRadius: 14,
            padding: "10px 16px",
            marginBottom: 24,
          }}
        >
          <badge.icon size={18} color={T.amber} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.amberSoft }}>مكافأة جديدة: {badge.name}</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>{badge.desc}</div>
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.8, maxWidth: 280, margin: "0 0 24px" }}>{quote}</p>

      <button
        onClick={onContinue}
        style={{
          background: T.olive,
          color: "#161A11",
          border: "none",
          borderRadius: 999,
          padding: "12px 30px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        العودة للرئيسية
      </button>
    </div>
  );
}
