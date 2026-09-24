import { useEffect, useState } from "react";

// The app's theme is the `dark` class the header toggles on <html>, not the
// OS preference. Anything that themes itself (the markdown renderer does)
// has to follow this, or a light page gets dark-mode text on white.
export default function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setDark(el.classList.contains("dark")));
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
