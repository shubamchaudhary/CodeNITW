import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import PageSkeleton from "./PageSkeleton";

// The single account allowed to see owner-only pages (job tracker etc.).
// Everyone else is bounced to the app home exactly like an unknown URL, so
// the page is indistinguishable from one that doesn't exist.
export const OWNER_EMAIL = "beshubam@gmail.com";

export function isOwner(user) {
  return !!user && (user.email || "").toLowerCase() === OWNER_EMAIL;
}

export default function OwnerRoute() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsubscribe;
  }, []);

  // The same placeholder every page shows while it loads.
  if (checking) return <PageSkeleton />;
  // Same destination as the catch-all "*" route — a non-owner hitting this URL
  // sees exactly what they'd see for any nonexistent page.
  return isOwner(user) ? <Outlet /> : <Navigate to="/core-stack" replace />;
}
