import { createContext, useContext } from "react";

// Every section of the lecture, so a section card can show where it sits.
export type SectionInfo = { num: string; title: string };
export const Sections = createContext<SectionInfo[]>([]);
export const useSections = () => useContext(Sections);
