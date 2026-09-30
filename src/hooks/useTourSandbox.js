import { useEffect, useState } from "react";
import { isSandbox, onSandboxChange } from "../Data/authGate";

// Whether the site tour's sandbox is on (see Data/tourSandbox): pages that
// show a guest something different from a signed-in person follow it, so the
// tour sees the signed-in view of what it just did.
export default function useTourSandbox() {
  const [on, setOn] = useState(isSandbox);
  useEffect(() => onSandboxChange(setOn), []);
  return on;
}
