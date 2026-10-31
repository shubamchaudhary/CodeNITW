import type { Clock, SceneT } from "../lib/timeline.ts";
import { BigScene, BulletsScene, ChatScene, CodeScene, DecisionScene, FlowScene, ImageScene, PauseScene, SectionScene, StoryScene, TitleScene } from "./generic.tsx";
import { Fill, Marathi, Phone, Sampling, Tokens } from "./custom1.tsx";
import { Attempt1, Attention, Cache, Director, EncDec, Embed, Layers, Tickets } from "./custom2.tsx";
import { Brief, BrickCost, Bricks, Cost, Hook, Idea, NoPolicy, Phone2, Quiz, Recap, Spotlight, Tickets2, WheelScene } from "./custom3.tsx";
import { Chunker, Complaints, Keyword, Magnets, MeaningMap, NotRag, OpenBook, ParentChild, PasteAll, Pipeline, Versions } from "./custom4.tsx";
import { Bm25, BruteForce, CardList, Hiring, Hnsw, PostFilter, Rrf } from "./custom5.tsx";
import { Backwards, Condense, Corrective, Hyde, LostMiddle, Rewrite, Shred, WhereMap } from "./custom6.tsx";
import { AgentLoop, Control, Conveyor, Form, Restaurant, Subway, SuperStep, ToolBelt, ToolCard } from "./custom7.tsx";
import { Desk, FanOut, Handover, LiftButton, Notebook, Reuse, SaveGame, Team } from "./custom8.tsx";
import { DiffCard, Freeze, Overlay, Replay, ReviewCard, RubberStamp, Stale } from "./custom9.tsx";
import { Biases, Checks, CiGate, JudgeCal, Piles, RankMetrics, Score } from "./custom10.tsx";
import { ClaimVsDb, Online, PassK, Rollout, XRay } from "./custom11.tsx";
import { Budget, Cage, Napkin, Rails, Review, Route, Saga, Tenants } from "./custom12.tsx";
import { Bill, DualLlm, Ink, Levers, Postman, SqlGuard, Trifecta } from "./custom13.tsx";
import { Apprentice, Bus, Finale, Manual, Pairs, Photo, StickyNotes, System, UsbC } from "./custom14.tsx";

const CUSTOM = { phone: Phone, fill: Fill, tokens: Tokens, marathi: Marathi, sampling: Sampling, embed: Embed, attention: Attention, layers: Layers, encdec: EncDec, director: Director, cache: Cache, tickets: Tickets, attempt1: Attempt1, hook: Hook, phone2: Phone2, quiz: Quiz, idea: Idea, bricks: Bricks, brickcost: BrickCost, wheel: WheelScene, nopolicy: NoPolicy, spotlight: Spotlight, cost: Cost, tickets2: Tickets2, brief: Brief, recap: Recap, openbook: OpenBook, pasteall: PasteAll, keyword: Keyword, meaningmap: MeaningMap, magnets: Magnets, chunker: Chunker, parentchild: ParentChild, pipeline: Pipeline, versions: Versions, notrag: NotRag, complaints: Complaints, cardlist: CardList, bruteforce: BruteForce, hnsw: Hnsw, postfilter: PostFilter, bm25: Bm25, rrf: Rrf, hiring: Hiring, wheremap: WhereMap, rewrite: Rewrite, hyde: Hyde, condense: Condense, corrective: Corrective, backwards: Backwards, lostmiddle: LostMiddle, shred: Shred, restaurant: Restaurant, toolcard: ToolCard, control: Control, toolbelt: ToolBelt, form: Form, agentloop: AgentLoop, conveyor: Conveyor, subway: Subway, superstep: SuperStep, savegame: SaveGame, liftbutton: LiftButton, desk: Desk, notebook: Notebook, fanout: FanOut, reuse: Reuse, team: Team, handover: Handover, diffcard: DiffCard, freeze: Freeze, replay: Replay, rubberstamp: RubberStamp, reviewcard: ReviewCard, overlay: Overlay, stale: Stale, score: Score, piles: Piles, checks: Checks, cigate: CiGate, judgecal: JudgeCal, biases: Biases, rankmetrics: RankMetrics, claimvsdb: ClaimVsDb, passk: PassK, xray: XRay, online: Online, rollout: Rollout, review: Review, route: Route, napkin: Napkin, tenants: Tenants, budget: Budget, rails: Rails, cage: Cage, saga: Saga, ink: Ink, postman: Postman, trifecta: Trifecta, dualllm: DualLlm, sqlguard: SqlGuard, bill: Bill, levers: Levers, manual: Manual, stickynotes: StickyNotes, pairs: Pairs, apprentice: Apprentice, bus: Bus, photo: Photo, usbc: UsbC, system: System, finale: Finale } as const;

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
