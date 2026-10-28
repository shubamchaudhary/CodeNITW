import React from "react";

// The surface every page sits on: the design system's `canvas`, flat, in
// both themes. Cards on it are set apart by their 1px `line` border.
//
// `allowSticky` swaps overflow-hidden for overflow-x-clip: a hidden-overflow
// ancestor becomes the scroll container for position: sticky, so nothing
// inside it could ever stick to the viewport. Clip trims the same sideways
// overflow without that side effect.
export default function PageShell({ children, className = "", allowSticky = false }) {
  return (
    <div className={`relative min-h-screen ${allowSticky ? "overflow-x-clip" : "overflow-hidden"} pb-16 bg-canvas ${className}`}>
      {children}
    </div>
  );
}
