import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Symbols that drift up the screen behind the card.
const GLYPHS = ["</>", "{ }", "( ) =>", ";", "#", "&&", "===", "[ ]", "0x1F", "fn", "<div>", "git", "npm i", "//", "*", "λ", "return", "async", "O(n)", "SELECT *"];

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  return reduced;
}

// Types each tagline out character by character, holds, deletes, moves on.
function useTypewriter(lines, reduced) {
  const [text, setText] = useState(reduced ? lines[0] || "" : "");
  const key = lines.join("|");
  useEffect(() => {
    if (reduced || lines.length === 0) {
      setText(lines[0] || "");
      return;
    }
    let line = 0;
    let char = 0;
    let deleting = false;
    let t;
    const tick = () => {
      const current = lines[line];
      if (!deleting) {
        char += 1;
        setText(current.slice(0, char));
        if (char === current.length) {
          if (lines.length === 1) return; // single line: type once and rest
          deleting = true;
          t = setTimeout(tick, 2100);
          return;
        }
        t = setTimeout(tick, 42 + Math.random() * 46);
      } else {
        char -= 1;
        setText(current.slice(0, char));
        if (char === 0) {
          deleting = false;
          line = (line + 1) % lines.length;
          t = setTimeout(tick, 420);
          return;
        }
        t = setTimeout(tick, 20);
      }
    };
    t = setTimeout(tick, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced]);
  return text;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};
const rise = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

// Animated, immersive backdrop + glass card shared by the auth screens.
// Terminal-inspired identity: blueprint grid with travelling scan beams,
// aurora parallax, drifting glyphs, meteors, a `>_` brand tile with a
// rotating gradient ring + orbiting spark, typewriter tagline, and a
// tilting card wrapped in an animated gradient border with a
// cursor-tracking glow.
export default function AuthShell({ title, taglines, children }) {
  const list = useMemo(() => (Array.isArray(taglines) ? taglines : [taglines]), [taglines]);
  const reduced = useReducedMotion();
  const typed = useTypewriter(list, reduced);
  const cardRef = useRef(null);

  // Normalized cursor position (-0.5 … 0.5), springy so everything glides.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });

  // Parallax layers at different depths.
  const blob1x = useTransform(smx, (v) => v * 70);
  const blob1y = useTransform(smy, (v) => v * 50);
  const blob2x = useTransform(smx, (v) => v * -90);
  const blob2y = useTransform(smy, (v) => v * -60);
  const blob3x = useTransform(smx, (v) => v * 40);
  const blob3y = useTransform(smy, (v) => v * 55);
  // Card tilt (a few degrees only).
  const rotY = useTransform(smx, (v) => v * 6);
  const rotX = useTransform(smy, (v) => v * -6);
  // Cursor spotlight position in px.
  const spotX = useMotionValue(-600);
  const spotY = useMotionValue(-600);
  const sSpotX = useSpring(spotX, { stiffness: 120, damping: 22 });
  const sSpotY = useSpring(spotY, { stiffness: 120, damping: 22 });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
      spotX.set(e.clientX);
      spotY.set(e.clientY);
      // Border glow tracks the cursor while it's over the card.
      const el = cardRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--gx", `${e.clientX - r.left}px`);
        el.style.setProperty("--gy", `${e.clientY - r.top}px`);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, mx, my, spotX, spotY]);

  // Stable random config for the drifting glyphs / meteors.
  const glyphs = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        text: GLYPHS[i % GLYPHS.length],
        left: Math.random() * 100,
        size: 11 + Math.random() * 13,
        duration: 16 + Math.random() * 18,
        delay: -Math.random() * 30,
        opacity: 0.08 + Math.random() * 0.2,
      })),
    []
  );
  const meteors = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        top: Math.random() * 45,
        left: 20 + Math.random() * 75,
        delay: i * 3.5 + Math.random() * 3,
        duration: 1.1 + Math.random() * 0.9,
        repeatDelay: 6 + Math.random() * 8,
      })),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] flex items-center justify-center px-4 py-10">
      {/* Aurora blobs (parallax) */}
      <motion.div
        aria-hidden
        style={{ x: blob1x, y: blob1y }}
        className="pointer-events-none absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-indigo-600/30 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        style={{ x: blob2x, y: blob2y }}
        className="pointer-events-none absolute -bottom-40 -right-24 w-[38rem] h-[38rem] rounded-full bg-fuchsia-600/25 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        style={{ x: blob3x, y: blob3y }}
        className="pointer-events-none absolute top-1/3 right-1/4 w-[26rem] h-[26rem] rounded-full bg-cyan-500/20 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blueprint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 78%)",
        }}
      />

      {/* Scan beams travelling along the grid */}
      {!reduced && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
            initial={{ top: "-4%" }}
            animate={{ top: ["-4%", "104%"] }}
            transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-fuchsia-400/40 to-transparent"
            initial={{ left: "-4%" }}
            animate={{ left: ["-4%", "104%"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 4 }}
          />
        </>
      )}

      {/* Drifting code glyphs */}
      {!reduced &&
        glyphs.map((g) => (
          <motion.span
            key={g.id}
            aria-hidden
            className="pointer-events-none absolute font-mono text-indigo-200 select-none"
            style={{ left: `${g.left}%`, top: "104%", fontSize: g.size, opacity: g.opacity }}
            animate={{ y: "-118vh", rotate: [0, g.id % 2 ? 14 : -14] }}
            transition={{ duration: g.duration, delay: g.delay, repeat: Infinity, ease: "linear" }}
          >
            {g.text}
          </motion.span>
        ))}

      {/* Meteor streaks */}
      {!reduced &&
        meteors.map((m) => (
          <motion.span
            key={m.id}
            aria-hidden
            className="pointer-events-none absolute h-px w-36 rotate-[215deg] bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent"
            style={{ top: `${m.top}%`, left: `${m.left}%`, opacity: 0 }}
            animate={{ x: [0, -420], y: [0, 300], opacity: [0, 0.9, 0] }}
            transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, repeatDelay: m.repeatDelay, ease: "easeOut" }}
          />
        ))}

      {/* Cursor spotlight */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute z-[5] w-[34rem] h-[34rem] rounded-full"
          style={{
            x: sSpotX,
            y: sSpotY,
            translateX: "-50%",
            translateY: "-50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)",
          }}
        />
      )}

      {/* Film grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: NOISE }} />

      {/* Content */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md"
        style={reduced ? undefined : { rotateX: rotX, rotateY: rotY, transformPerspective: 1100 }}
      >
        <div className="flex flex-col items-center mb-7">
          {/* Brand mark: `>_` tile with rotating gradient ring + orbiting spark */}
          <motion.div variants={rise} className="relative mb-5">
            <div className="relative rounded-[20px] p-[2px] overflow-hidden shadow-[0_16px_40px_-10px_rgba(99,102,241,0.55)]">
              <motion.div
                aria-hidden
                className="absolute -inset-[150%]"
                style={{
                  background: "conic-gradient(from 0deg, #22d3ee, #818cf8, #e879f9, #818cf8, #22d3ee)",
                }}
                animate={reduced ? undefined : { rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative w-16 h-16 rounded-[18px] bg-[#0b1020] flex items-center justify-center">
                <span className="font-mono font-bold text-[22px] leading-none bg-gradient-to-br from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
                  &gt;
                </span>
                <motion.span
                  className="font-mono font-bold text-[22px] leading-none text-slate-200 ml-1"
                  animate={reduced ? undefined : { opacity: [1, 1, 0, 0, 1] }}
                  transition={{ duration: 1.3, repeat: Infinity, times: [0, 0.45, 0.5, 0.95, 1] }}
                >
                  _
                </motion.span>
              </div>
            </div>
            {/* Orbiting spark */}
            {!reduced && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_3px_rgba(103,232,249,0.7)]" />
              </motion.div>
            )}
          </motion.div>

          {/* Shimmering title */}
          <motion.h1
            variants={rise}
            className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text text-center"
            style={{
              backgroundImage:
                "linear-gradient(110deg, #a5b4fc 20%, #f0abfc 40%, #67e8f9 50%, #f0abfc 60%, #a5b4fc 80%)",
              backgroundSize: "220% 100%",
            }}
            animate={reduced ? undefined : { backgroundPosition: ["0% 50%", "-220% 50%"] }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          >
            {title}
          </motion.h1>

          {/* Typewriter tagline */}
          <motion.div variants={rise} className="h-6 mt-2 flex items-center font-mono text-sm text-slate-400">
            <span className="text-cyan-400/80 mr-2 select-none">~$</span>
            <span>{typed}</span>
            <motion.span
              aria-hidden
              className="ml-0.5 inline-block w-[7px] h-[15px] bg-cyan-300/80"
              animate={reduced ? undefined : { opacity: [1, 1, 0, 0, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.45, 0.5, 0.95, 1] }}
            />
          </motion.div>
        </div>

        {/* Card with animated gradient border + cursor-tracking glow */}
        <motion.div variants={rise}>
          <div ref={cardRef} className="group relative rounded-2xl p-[1.5px] overflow-hidden shadow-2xl shadow-black/50">
            <motion.div
              aria-hidden
              className="absolute -inset-[150%]"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(129,140,248,0.7) 60deg, rgba(217,70,239,0.7) 120deg, transparent 180deg, transparent 200deg, rgba(103,232,249,0.5) 300deg, transparent 360deg)",
              }}
              animate={reduced ? undefined : { rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            />
            {/* Cursor-following glow inside the border layer */}
            {!reduced && (
              <div
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "radial-gradient(220px circle at var(--gx, 50%) var(--gy, 50%), rgba(103,232,249,0.4), transparent 70%)",
                }}
              />
            )}
            <div className="relative rounded-[15px] bg-slate-900/90 backdrop-blur-xl border border-white/10 p-7 sm:p-8">
              {/* Top edge highlight */}
              <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              {children}
            </div>
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.p variants={rise} className="mt-5 text-center font-mono text-[11px] text-slate-600 select-none">
          {"// built for the grind — one pattern at a time"}
        </motion.p>
      </motion.div>
    </div>
  );
}
