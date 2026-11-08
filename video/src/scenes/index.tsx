import type { Clock, SceneT } from "../lib/timeline.ts";
import { BigScene, BulletsScene, ChatScene, CodeScene, DecisionScene, FlowScene, ImageScene, PauseScene, SectionScene, StoryScene, TitleScene } from "./generic.tsx";
import { Recap } from "./custom3.tsx";
import { CardList } from "./custom5.tsx";
import { ArrayGrow, BucketFill, ChainTree, ChmLocks, Contract, DrawIt, GrowTable, Heap, Lookup, LostUpdate, LruList, ModCount, PowerTwo, Stranded, TreeFloor } from "./custom15.tsx";
import { Collectors, Compact, DrawHeap, Eden, Frames, Leak, Meta, Pod, RefKinds, Regions, Roots, Sawtooth } from "./custom16.tsx";
import { Recall } from "./secui.tsx";
import { A1Attn, A1Embed, A1Halluc, A1Hook, A1Lang, A1Mask, A1Next, A1Practice, A1Prefill, A1Prompt, A1Qkv, A1Sample, A1Stack, A1Tokens, A1Vote, A1Window } from "./ai01.tsx";
import { A2Chunkers, A2Context, A2Contrastive, A2Cosine, A2Hook, A2Keyword, A2Meaning, A2OneVector, A2OpenBook, A2Parent, A2Prompt, A2Update } from "./ai02.tsx";
import { A3Bm25, A3Brute, A3Filter, A3Hnsw, A3Hook, A3Mmr, A3Quant, A3Rerank, A3Rrf, A3Skip } from "./ai03.tsx";
import { A4Condense, A4Graph, A4Hook, A4Hyde, A4Multi, A4Pdf, A4SelfQuery, A4Table, A4Trace } from "./ai04.tsx";
import { A5Errors, A5Graph, A5Hook, A5Loop, A5Middleware, A5Slip, A5Structured, A5Super, A5ToolCard } from "./ai05.tsx";
import { A6Context, A6FanOut, A6Hook, A6Lift, A6Save, A6Store, A6Team, A6Time, A6Window } from "./ai06.tsx";
import { A7Card, A7Cas, A7Decisions, A7Hook, A7Matrix, A7Overlay, A7Pause, A7Replay } from "./ai07.tsx";
import { A8Checks, A8Correct, A8Gate, A8Hook, A8Judge, A8Kappa, A8Piles, A8Ranks } from "./ai08.tsx";
import { A9Config, A9Hook, A9Levels, A9PassK, A9Pyramid, A9Rollout, A9Trace } from "./ai09.tsx";
import { A10Budget, A10Cage, A10Hook, A10Patterns, A10Saga, A10Steps, A10Tools } from "./ai10.tsx";
import { A11Dual, A11Hook, A11Latency, A11Levers, A11Patterns, A11Prefix, A11Sql, A11Stream, A11Trifecta } from "./ai11.tsx";
import { A12Bus, A12Distill, A12Dpo, A12Finale, A12Hook, A12Lora, A12Mcp, A12Paged, A12Phases } from "./ai12.tsx";
import { LLArch, LLFilter, LLMad, LLSplit } from "./ll01.tsx";
import { IoaCheck, IoaMap, IoaOverlay, IoaRedis, IoaRetry, IoaSse, IoaStack, IoaState, IoaTree, IoaTurns, IoaUpsert } from "./ioa01.tsx";
import { ChartScene, CompareScene, DrillScene, NumbersScene, SayItScene, SeqScene, TrapScene } from "./generic2.tsx";
import { Csrf, NotProtect, Origins, Preflight, SqlInject, Xss } from "./custom17.tsx";
import { AuthFlow, Chain, Doorman, Hashing, Sessions, Starter } from "./custom18.tsx";
import { Anatomy, JwtPath, Keys, Refresh, Revoke, Storage, Twenty } from "./custom19.tsx";
import { ClientCreds, CodeFlow, Oidc, Opaque, Roles, Valet } from "./custom20.tsx";
import { Choose, FilterWrap, FiveHundred, Hooks, Pipeline2, Problem, Resolvers, Scopes, TenantFlow, Translate } from "./custom21.tsx";

const CUSTOM = { recap: Recap, cardlist: CardList, lookup: Lookup, bucketfill: BucketFill, contract: Contract, stranded: Stranded, chaintree: ChainTree, growtable: GrowTable, powertwo: PowerTwo, lostupdate: LostUpdate, chmlocks: ChmLocks, modcount: ModCount, arraygrow: ArrayGrow, lrulist: LruList, treefloor: TreeFloor, heap: Heap, drawit: DrawIt, sawtooth: Sawtooth, frames: Frames, roots: Roots, refkinds: RefKinds, eden: Eden, compact: Compact, meta: Meta, collectors: Collectors, regions: Regions, leak: Leak, pod: Pod, drawheap: DrawHeap, recall: Recall, sqlinject: SqlInject, xss: Xss, csrf: Csrf, origins: Origins, preflight: Preflight, notprotect: NotProtect, starter: Starter, doorman: Doorman, chain: Chain, authflow: AuthFlow, hashing: Hashing, sessions: Sessions, twenty: Twenty, anatomy: Anatomy, keys: Keys, jwtpath: JwtPath, refresh: Refresh, storage: Storage, revoke: Revoke, valet: Valet, roles: Roles, codeflow: CodeFlow, clientcreds: ClientCreds, opaque: Opaque, oidc: Oidc, fivehundred: FiveHundred, resolvers: Resolvers, scopes: Scopes, problem: Problem, translate: Translate, pipeline2: Pipeline2, filterwrap: FilterWrap, hooks: Hooks, choose: Choose, tenantflow: TenantFlow, a1hook: A1Hook, a1next: A1Next, a1practice: A1Practice, a1tokens: A1Tokens, a1lang: A1Lang, a1window: A1Window, a1embed: A1Embed, a1attn: A1Attn, a1qkv: A1Qkv, a1mask: A1Mask, a1stack: A1Stack, a1prefill: A1Prefill, a1sample: A1Sample, a1halluc: A1Halluc, a1prompt: A1Prompt, a1vote: A1Vote, a2hook: A2Hook, a2openbook: A2OpenBook, a2keyword: A2Keyword, a2meaning: A2Meaning, a2cosine: A2Cosine, a2contrastive: A2Contrastive, a2onevector: A2OneVector, a2chunkers: A2Chunkers, a2parent: A2Parent, a2context: A2Context, a2prompt: A2Prompt, a2update: A2Update, a3hook: A3Hook, a3brute: A3Brute, a3skip: A3Skip, a3hnsw: A3Hnsw, a3filter: A3Filter, a3quant: A3Quant, a3bm25: A3Bm25, a3rrf: A3Rrf, a3rerank: A3Rerank, a3mmr: A3Mmr, a4hook: A4Hook, a4multi: A4Multi, a4hyde: A4Hyde, a4condense: A4Condense, a4selfquery: A4SelfQuery, a4trace: A4Trace, a4pdf: A4Pdf, a4table: A4Table, a4graph: A4Graph, a5hook: A5Hook, a5slip: A5Slip, a5toolcard: A5ToolCard, a5errors: A5Errors, a5structured: A5Structured, a5loop: A5Loop, a5middleware: A5Middleware, a5graph: A5Graph, a5super: A5Super, a6hook: A6Hook, a6save: A6Save, a6lift: A6Lift, a6time: A6Time, a6context: A6Context, a6window: A6Window, a6store: A6Store, a6fanout: A6FanOut, a6team: A6Team, a7hook: A7Hook, a7pause: A7Pause, a7replay: A7Replay, a7decisions: A7Decisions, a7matrix: A7Matrix, a7card: A7Card, a7overlay: A7Overlay, a7cas: A7Cas, a8hook: A8Hook, a8piles: A8Piles, a8checks: A8Checks, a8gate: A8Gate, a8judge: A8Judge, a8kappa: A8Kappa, a8correct: A8Correct, a8ranks: A8Ranks, a9hook: A9Hook, a9levels: A9Levels, a9pyramid: A9Pyramid, a9passk: A9PassK, a9trace: A9Trace, a9rollout: A9Rollout, a9config: A9Config, a10hook: A10Hook, a10steps: A10Steps, a10budget: A10Budget, a10patterns: A10Patterns, a10cage: A10Cage, a10tools: A10Tools, a10saga: A10Saga, a11hook: A11Hook, a11stream: A11Stream, a11trifecta: A11Trifecta, a11dual: A11Dual, a11patterns: A11Patterns, a11sql: A11Sql, a11latency: A11Latency, a11levers: A11Levers, a11prefix: A11Prefix, a12hook: A12Hook, a12lora: A12Lora, a12dpo: A12Dpo, a12distill: A12Distill, a12phases: A12Phases, a12bus: A12Bus, a12paged: A12Paged, a12mcp: A12Mcp, a12finale: A12Finale, llarch: LLArch, llsplit: LLSplit, llmad: LLMad, llfilter: LLFilter, check: IoaCheck, analogy: IoaMap, mwstack: IoaStack, retrytrap: IoaRetry, reducers: IoaState, hierarchy: IoaTree, overlay: IoaOverlay, upsert: IoaUpsert, turns: IoaTurns, redis: IoaRedis, sse: IoaSse } as const;

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
