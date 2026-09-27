import { useEffect, useState } from "react";

// The app's theme is the `dark` class the header toggles on <html>, not the
// OS preference. Anything that themes itself (the markdown renderer does)
// has to follow this, or a light page gets dark-mode text on white.
export default function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains("dark"));
    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    // The header applies the saved theme in its own effect, which can run
    // before this observer exists (on a fresh load straight into a page), so
    // read the class again now rather than trusting the first render.
    sync();
    return () => observer.disconnect();
  }, []);

  return dark;
}
