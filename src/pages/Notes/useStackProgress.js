import { useCallback, useEffect, useState } from "react";
import { requireAuth } from "../../Data/authGate";
import {
  KEYS,
  loadJSON,
  subscribe,
  setSourceComplete,
  dateKey,
  getDay,
  addToPlanDay,
  removeFromPlanDay,
} from "../../Data/planStore";

// Which topics of a stack are done and which are on today's plan, kept live
// with the stores (Planning page, another tab, cloud sync) — shared by the
// left topic list and the topic header so both always agree.
export default function useStackProgress(stack) {
  const today = dateKey();
  const readPlanned = useCallback(
    () => new Set(getDay(today).filter((i) => i.source === stack.key).map((i) => i.refId)),
    [today, stack.key]
  );
  const [completed, setCompleted] = useState(() => loadJSON(stack.completedKey, {}));
  const [planned, setPlanned] = useState(readPlanned);
  // Bumped when a done stamp changes, so "done N days ago" re-reads it.
  const [stampRev, setStampRev] = useState(0);

  useEffect(() => {
    setCompleted(loadJSON(stack.completedKey, {}));
    setPlanned(readPlanned());
    return subscribe((key) => {
      if (key === stack.completedKey) setCompleted(loadJSON(stack.completedKey, {}));
      if (key === stack.timestampsKey) setStampRev((n) => n + 1);
      if (key === KEYS.PLAN_DAYS) setPlanned(readPlanned());
    });
  }, [stack, readPlanned]);

  // Returns whether it happened (a guest is asked to sign in instead).
  const setDone = useCallback(
    (id, value) => {
      if (!requireAuth("Sign in to track what you've finished — your progress is saved to your account.")) return false;
      setSourceComplete(stack.key, id, value);
      setCompleted(loadJSON(stack.completedKey, {}));
      setStampRev((n) => n + 1);
      return true;
    },
    [stack]
  );

  const togglePlanned = useCallback(
    (topic) => {
      if (!requireAuth("Sign in to plan your day — your plan is saved to your account.")) return;
      if (planned.has(topic.id)) {
        removeFromPlanDay(today, stack.key, topic.id);
      } else {
        addToPlanDay(today, stack.planItem(topic));
      }
      setPlanned(readPlanned());
    },
    [planned, today, stack, readPlanned]
  );

  return { completed, planned, setDone, togglePlanned, stampRev };
}
