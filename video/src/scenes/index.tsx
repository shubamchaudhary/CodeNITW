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
import { ArrayGrow, BucketFill, ChainTree, ChmLocks, Contract, DrawIt, GrowTable, Heap, Lookup, LostUpdate, LruList, ModCount, PowerTwo, Stranded, TreeFloor } from "./custom15.tsx";
import { Collectors, Compact, DrawHeap, Eden, Frames, Leak, Meta, Pod, RefKinds, Regions, Roots, Sawtooth } from "./custom16.tsx";
import { Recall } from "./secui.tsx";
import { A1Attn, A1Embed, A1Halluc, A1Hook, A1Lang, A1Mask, A1Next, A1Practice, A1Prefill, A1Prompt, A1Qkv, A1Sample, A1Stack, A1Tokens, A1Vote, A1Window } from "./ai01.tsx";
import { A2Chunkers, A2Context, A2Contrastive, A2Cosine, A2Hook, A2Keyword, A2Meaning, A2OneVector, A2OpenBook, A2Parent, A2Prompt, A2Update } from "./ai02.tsx";
import { A3Bm25, A3Brute, A3Filter, A3Hnsw, A3Hook, A3Mmr, A3Quant, A3Rerank, A3Rrf, A3Skip } from "./ai03.tsx";
import { A4Condense, A4Graph, A4Hook, A4Hyde, A4Multi, A4Pdf, A4SelfQuery, A4Table, A4Trace } from "./ai04.tsx";
import { ChartScene, CompareScene, DrillScene, NumbersScene, SayItScene, SeqScene, TrapScene } from "./generic2.tsx";
import { Csrf, NotProtect, Origins, Preflight, SqlInject, Xss } from "./custom17.tsx";
import { AuthFlow, Chain, Doorman, Hashing, Sessions, Starter } from "./custom18.tsx";
import { Anatomy, JwtPath, Keys, Refresh, Revoke, Storage, Twenty } from "./custom19.tsx";
import { ClientCreds, CodeFlow, Oidc, Opaque, Roles, Valet } from "./custom20.tsx";
import { Choose, FilterWrap, FiveHundred, Hooks, Pipeline2, Problem, Resolvers, Scopes, TenantFlow, Translate } from "./custom21.tsx";

const CUSTOM = { phone: Phone, fill: Fill, tokens: Tokens, marathi: Marathi, sampling: Sampling, embed: Embed, attention: Attention, layers: Layers, encdec: EncDec, director: Director, cache: Cache, tickets: Tickets, attempt1: Attempt1, hook: Hook, phone2: Phone2, quiz: Quiz, idea: Idea, bricks: Bricks, brickcost: BrickCost, wheel: WheelScene, nopolicy: NoPolicy, spotlight: Spotlight, cost: Cost, tickets2: Tickets2, brief: Brief, recap: Recap, openbook: OpenBook, pasteall: PasteAll, keyword: Keyword, meaningmap: MeaningMap, magnets: Magnets, chunker: Chunker, parentchild: ParentChild, pipeline: Pipeline, versions: Versions, notrag: NotRag, complaints: Complaints, cardlist: CardList, bruteforce: BruteForce, hnsw: Hnsw, postfilter: PostFilter, bm25: Bm25, rrf: Rrf, hiring: Hiring, wheremap: WhereMap, rewrite: Rewrite, hyde: Hyde, condense: Condense, corrective: Corrective, backwards: Backwards, lostmiddle: LostMiddle, shred: Shred, restaurant: Restaurant, toolcard: ToolCard, control: Control, toolbelt: ToolBelt, form: Form, agentloop: AgentLoop, conveyor: Conveyor, subway: Subway, superstep: SuperStep, savegame: SaveGame, liftbutton: LiftButton, desk: Desk, notebook: Notebook, fanout: FanOut, reuse: Reuse, team: Team, handover: Handover, diffcard: DiffCard, freeze: Freeze, replay: Replay, rubberstamp: RubberStamp, reviewcard: ReviewCard, overlay: Overlay, stale: Stale, score: Score, piles: Piles, checks: Checks, cigate: CiGate, judgecal: JudgeCal, biases: Biases, rankmetrics: RankMetrics, claimvsdb: ClaimVsDb, passk: PassK, xray: XRay, online: Online, rollout: Rollout, review: Review, route: Route, napkin: Napkin, tenants: Tenants, budget: Budget, rails: Rails, cage: Cage, saga: Saga, ink: Ink, postman: Postman, trifecta: Trifecta, dualllm: DualLlm, sqlguard: SqlGuard, bill: Bill, levers: Levers, manual: Manual, stickynotes: StickyNotes, pairs: Pairs, apprentice: Apprentice, bus: Bus, photo: Photo, usbc: UsbC, system: System, finale: Finale, lookup: Lookup, bucketfill: BucketFill, contract: Contract, stranded: Stranded, chaintree: ChainTree, growtable: GrowTable, powertwo: PowerTwo, lostupdate: LostUpdate, chmlocks: ChmLocks, modcount: ModCount, arraygrow: ArrayGrow, lrulist: LruList, treefloor: TreeFloor, heap: Heap, drawit: DrawIt, sawtooth: Sawtooth, frames: Frames, roots: Roots, refkinds: RefKinds, eden: Eden, compact: Compact, meta: Meta, collectors: Collectors, regions: Regions, leak: Leak, pod: Pod, drawheap: DrawHeap, recall: Recall, sqlinject: SqlInject, xss: Xss, csrf: Csrf, origins: Origins, preflight: Preflight, notprotect: NotProtect, starter: Starter, doorman: Doorman, chain: Chain, authflow: AuthFlow, hashing: Hashing, sessions: Sessions, twenty: Twenty, anatomy: Anatomy, keys: Keys, jwtpath: JwtPath, refresh: Refresh, storage: Storage, revoke: Revoke, valet: Valet, roles: Roles, codeflow: CodeFlow, clientcreds: ClientCreds, opaque: Opaque, oidc: Oidc, fivehundred: FiveHundred, resolvers: Resolvers, scopes: Scopes, problem: Problem, translate: Translate, pipeline2: Pipeline2, filterwrap: FilterWrap, hooks: Hooks, choose: Choose, tenantflow: TenantFlow, a1hook: A1Hook, a1next: A1Next, a1practice: A1Practice, a1tokens: A1Tokens, a1lang: A1Lang, a1window: A1Window, a1embed: A1Embed, a1attn: A1Attn, a1qkv: A1Qkv, a1mask: A1Mask, a1stack: A1Stack, a1prefill: A1Prefill, a1sample: A1Sample, a1halluc: A1Halluc, a1prompt: A1Prompt, a1vote: A1Vote, a2hook: A2Hook, a2openbook: A2OpenBook, a2keyword: A2Keyword, a2meaning: A2Meaning, a2cosine: A2Cosine, a2contrastive: A2Contrastive, a2onevector: A2OneVector, a2chunkers: A2Chunkers, a2parent: A2Parent, a2context: A2Context, a2prompt: A2Prompt, a2update: A2Update, a3hook: A3Hook, a3brute: A3Brute, a3skip: A3Skip, a3hnsw: A3Hnsw, a3filter: A3Filter, a3quant: A3Quant, a3bm25: A3Bm25, a3rrf: A3Rrf, a3rerank: A3Rerank, a3mmr: A3Mmr, a4hook: A4Hook, a4multi: A4Multi, a4hyde: A4Hyde, a4condense: A4Condense, a4selfquery: A4SelfQuery, a4trace: A4Trace, a4pdf: A4Pdf, a4table: A4Table, a4graph: A4Graph } as const;

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
    case "sayit":
      return <SayItScene s={s} t={t} />;
    case "drill":
      return <DrillScene s={s} t={t} />;
    case "trap":
      return <TrapScene s={s} t={t} />;
    case "compare":
      return <CompareScene s={s} t={t} />;
    case "numbers":
      return <NumbersScene s={s} t={t} />;
    case "seq":
      return <SeqScene s={s} t={t} />;
    case "chart":
      return <ChartScene s={s} t={t} />;
    case "custom": {
      const View = CUSTOM[s.name as keyof typeof CUSTOM];
      if (!View) throw new Error(`Unknown custom scene "${s.name}"`);
      return <View t={t} props={s.props} />;
    }
  }
};
