// A chapter is a list of scenes; each scene is narrated as a list of beats.
// Beat n of a scene drives visual step n, so the picture changes as the
// sentence that explains it starts.

export type Beat = {
  say: string; // spoken and captioned, word for word
  at?: string; // start this step when this word is spoken, not when the beat starts
  hold?: number; // seconds of silence after the beat (thinking time)
};

export type FlowNode = { id: string; label: string; c: number; r: number; tone?: string };
export type FlowEdge = { from: string; to: string; label?: string; bend?: number };

type Base = { beats: Beat[] };

export type Scene = Base &
  (
    | { kind: "title"; eyebrow: string; title: string; subtitle?: string }
    | { kind: "section"; num: string; title: string }
    | {
        kind: "story";
        intro: string;
        cards: { who: string; role: string; text: string; tone: string }[];
        closing?: string;
      }
    | {
        kind: "flow";
        title?: string;
        cols: number;
        rows: number;
        nodeW?: number;
        nodeH?: number;
        nodes: FlowNode[];
        edges: FlowEdge[];
        show: string[][]; // nodes revealed at each step (cumulative)
        hide?: string[][]; // nodes faded out at each step (cumulative)
        overlay?: { step: number; text: string; tone?: string };
      }
    | {
        kind: "image";
        src: string;
        credit: string;
        title?: string;
        notes?: string[]; // one line per step, shown beside the image
        focus?: [number, number, number][]; // per step: x%, y%, zoom
        gif?: boolean;
      }
    | { kind: "big"; tone: "idea" | "myth" | "interview"; lead?: string; text: string; after?: string }
    | {
        kind: "bullets";
        title: string;
        tone?: "plain" | "myth";
        lead?: string;
        items: { text: string; sub?: string; icon?: string }[];
        firstItemStep?: number; // step at which item 0 appears (default 0)
      }
    | {
        kind: "chat";
        title?: string;
        messages: { from: "user" | "bot"; who?: string; text: string; step: number }[];
        stamp?: { text: string; step: number };
      }
    | { kind: "pause"; question: string; visual?: "docs" }
    | {
        kind: "code";
        title: string;
        lang: string;
        code: string;
        highlight: ([number, number] | null)[]; // 1-based line range per step
        badge?: { step: number; from: number; to: number; label: string };
      }
    | {
        kind: "decision";
        question: string;
        answer: string;
        left: { title: string; items: string[] };
        right: { title: string; items: string[] };
        footer?: string;
      }
    | { kind: "custom"; name: string; props?: Record<string, unknown> }
  );

export type Chapter = {
  id: string;
  title: string;
  voice: string;
  rate: string;
  next?: string;
  scenes: Scene[];
};
