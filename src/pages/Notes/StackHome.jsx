import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuthState, onAuthStateChange } from "../../Data/authGate";
import { loadJSON } from "../../Data/planStore";
import { STACKS, resumeTopicId } from "./stacks";
import PageSkeleton from "../../components/PageSkeleton";

// A stack's home (/core-stack, /ai-stack) is its reading layout, opened where
// you left off: the topic you last had open, else your first unfinished one.
// It waits for auth so "unfinished" is read from the right account.
export default function StackHome({ stackKey }) {
  const [ready, setReady] = useState(getAuthState() !== "unknown");
  useEffect(() => onAuthStateChange((s) => s !== "unknown" && setReady(true)), []);
  if (!ready) return <PageSkeleton />;
  const stack = STACKS[stackKey];
  const id = resumeTopicId(stack, loadJSON(stack.completedKey, {}));
  return <Navigate to={`/notes/${stackKey}/${id}`} replace />;
}
