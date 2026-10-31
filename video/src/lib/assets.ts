import { createContext, useContext } from "react";
import { staticFile } from "remotion";

// Where lecture files (images, narration) come from: Remotion's public dir
// when rendering, or a URL prefix when the site plays the lecture.
export const AssetBase = createContext<string | null>(null);

export const useAsset = () => {
  const base = useContext(AssetBase);
  return (path: string) => (base == null ? staticFile(path) : base + path);
};
