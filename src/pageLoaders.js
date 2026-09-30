import { lazy, createElement, useState } from "react";

// The page chunks, in one place. Each page is a lazy component that can also
// be preloaded: once its chunk is in, it renders straight away, without a
// frame of the loading skeleton (a plain React.lazy still suspends once, even
// for a chunk that already arrived). The site tour preloads every page it
// visits before it starts.
function lazyPage(factory) {
  let Loaded = null;
  let pending = null;
  const preload = () =>
    (pending ||= factory().then((m) => {
      Loaded = m.default;
      return m;
    }));
  const Lazy = lazy(preload);
  // Picked once per mount: switching type later would remount the page.
  const Page = (props) => {
    const [Comp] = useState(() => Loaded || Lazy);
    return createElement(Comp, props);
  };
  Page.preload = preload;
  return Page;
}

export const StackHome = lazyPage(() => import("./pages/Notes/StackHome"));
export const TopicNotes = lazyPage(() => import("./pages/Notes/TopicNotes"));
export const DSAPrep = lazyPage(() => import("./pages/DSAPrep/DSAPrep"));
export const Planning = lazyPage(() => import("./pages/Planning/Planning"));
export const Contests = lazyPage(() => import("./pages/Contests/Contests"));
export const AuthPage = lazyPage(() => import("./pages/SignInUp/AuthPage"));
// The (large) company dataset is only fetched when someone opens the tracker.
export const JobTracker = lazyPage(() => import("./pages/JobTracker/JobTracker"));
