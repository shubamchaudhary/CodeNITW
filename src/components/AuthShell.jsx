import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

// Symbols that drift up the screen behind the card.
const GLYPHS = ["</>", "{ }", "( ) =>", ";", "#", "&&", "===", "[ ]", "0x1F", "fn", "<div>", "git", "npm i", "//", "*", "λ", "return", "async", "O(n)", "SELECT *"];

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

// Animated, immersive backdrop + glass card shared by the auth screens.
// Mouse-parallax aurora, cursor spotlight, floating code glyphs, meteor
// streaks, an animated gradient border and gentle 3D tilt on the card.
export default function AuthShell({ title, taglines, children }) {
  const list = Array.isArray(taglines) ? taglines : [taglines];
  const [idx, setIdx] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 2600);
    return () => clearInterval(t);
  }, [list.length]);

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
  const rotY = useTransform(smx, (v) => v * 7);
  const rotX = useTransform(smy, (v) => v * -7);
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
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, mx, my, spotX, spotY]);

  // Stable random config for the drifting glyphs / meteors.
  const glyphs = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        text: GLYPHS[i % GLYPHS.length],
        left: Math.random() * 100,
        size: 11 + Math.random() * 13,
        duration: 16 + Math.random() * 18,
        delay: -Math.random() * 30,
        opacity: 0.1 + Math.random() * 0.22,
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4">
      {/* Aurora blobs (parallax) */}
      <motion.div
        aria-hidden
        style={{ x: blob1x, y: blob1y }}
        className="pointer-events-none absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-indigo-600/40 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        style={{ x: blob2x, y: blob2y }}
        className="pointer-events-none absolute -bottom-40 -right-24 w-[38rem] h-[38rem] rounded-full bg-fuchsia-600/30 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        style={{ x: blob3x, y: blob3y }}
        className="pointer-events-none absolute top-1/3 right-1/4 w-[26rem] h-[26rem] rounded-full bg-cyan-500/25 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

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
            background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)",
          }}
        />
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
        style={reduced ? undefined : { rotateX: rotX, rotateY: rotY, transformPerspective: 1000 }}
      >
        <div className="flex flex-col items-center mb-6">
          {/* Brand mark */}
          <motion.div
            animate={reduced ? undefined : { y: [0, -6, 0], boxShadow: [
              "0 10px 30px -8px rgba(99,102,241,0.45)",
              "0 18px 42px -8px rgba(217,70,239,0.5)",
              "0 10px 30px -8px rgba(99,102,241,0.45)",
            ] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center mb-4"
          >
            <span className="text-white font-mono font-bold text-lg">&lt;/&gt;</span>
          </motion.div>

          {/* Shimmering title */}
          <motion.h1
            className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text"
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

          <div className="h-5 mt-1.5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="text-sm text-slate-400"
              >
                {list[idx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Card with animated gradient border */}
        <div className="relative rounded-2xl p-[1.5px] overflow-hidden shadow-2xl shadow-black/40">
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
          <div className="relative rounded-[15px] bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
