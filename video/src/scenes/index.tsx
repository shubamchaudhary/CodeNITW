import type { Clock, SceneT } from "../lib/timeline.ts";
import { BigScene, BulletsScene, ChatScene, CodeScene, DecisionScene, FlowScene, ImageScene, PauseScene, SectionScene, StoryScene, TitleScene } from "./generic.tsx";
import { Fill, Marathi, Phone, Sampling, Tokens } from "./custom1.tsx";
import { Attempt1, Attention, Cache, Director, EncDec, Embed, Layers, Tickets } from "./custom2.tsx";
import { Brief, BrickCost, Bricks, Cost, Hook, Idea, NoPolicy, Phone2, Quiz, Recap, Spotlight, Tickets2, WheelScene } from "./custom3.tsx";
import { Chunker, Complaints, Keyword, Magnets, MeaningMap, NotRag, OpenBook, ParentChild, PasteAll, Pipeline, Versions } from "./custom4.tsx";
import { Bm25, BruteForce, CardList, Hiring, Hnsw, PostFilter, Rrf } from "./custom5.tsx";

const CUSTOM = { phone: Phone, fill: Fill, tokens: Tokens, marathi: Marathi, sampling: Sampling, embed: Embed, attention: Attention, layers: Layers, encdec: EncDec, director: Director, cache: Cache, tickets: Tickets, attempt1: Attempt1, hook: Hook, phone2: Phone2, quiz: Quiz, idea: Idea, bricks: Bricks, brickcost: BrickCost, wheel: WheelScene, nopolicy: NoPolicy, spotlight: Spotlight, cost: Cost, tickets2: Tickets2, brief: Brief, recap: Recap, openbook: OpenBook, pasteall: PasteAll, keyword: Keyword, meaningmap: MeaningMap, magnets: Magnets, chunker: Chunker, parentchild: ParentChild, pipeline: Pipeline, versions: Versions, notrag: NotRag, complaints: Complaints, cardlist: CardList, bruteforce: BruteForce, hnsw: Hnsw, postfilter: PostFilter, bm25: Bm25, rrf: Rrf, hiring: Hiring } as const;

export const SceneView = ({ sc, t }: { sc: SceneT; t: Clock }) => {
  const s = sc.scene;
  switch (s.kind) {
    case "title":
      return <TitleScene s={s} t={t} />;
    case "section":
      return <SectionScene s={s} t={t} />;
    case "story":
      return <StoryScene s={s} t={t} />;
    case "flow":
      return <FlowScene s={s} t={t} />;
    case "image":
      return <ImageScene s={s} t={t} />;
    case "big":
      return <BigScene s={s} t={t} />;
    case "bullets":
      return <BulletsScene s={s} t={t} />;
    case "chat":
      return <ChatScene s={s} t={t} />;
    case "pause":
      return <PauseScene s={s} t={t} />;
    case "code":
      return <CodeScene s={s} t={t} />;
    case "decision":
      return <DecisionScene s={s} t={t} />;
    case "custom": {
      const View = CUSTOM[s.name as keyof typeof CUSTOM];
      if (!View) throw new Error(`Unknown custom scene "${s.name}"`);
      return <View t={t} props={s.props} />;
    }
  }
};
