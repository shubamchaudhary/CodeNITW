import type { Beat, Scene } from "../../lib/types.ts";
import type { Step } from "../ll01/diagrams.ts";

// Boards for KFK-ALL, drawn by LL-01's llarch scene with moving records
// (Step.moves), crashed nodes (Step.dead) and per-step node state (Step.subs).

type N = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; tone?: string; at?: number };
type E = { id: string; from?: string; to?: string; fs?: "l" | "r" | "t" | "b"; ts?: "l" | "r" | "t" | "b"; fo?: number; tof?: number; via?: [number, number][]; d?: string; l?: string; lx?: number; ly?: number; la?: "start" | "middle" | "end"; at?: number };
export type Board = { view: [number, number]; nodes: N[]; edges: E[]; groups?: { x: number; y: number; w: number; h: number; t: string; nodes?: string[] }[] };

// A board scene from [step, beat] pairs, so step i always goes with beat i.
export const A = (board: Board, title: string | undefined, ...pairs: [Step, Beat | string][]): Scene => ({
  kind: "custom",
  name: "llarch",
  props: { ...board, steps: pairs.map((p) => p[0]), title, panel: true },
  beats: pairs.map((p) => (typeof p[1] === "string" ? { say: p[1] } : p[1])),
});

// ------------------------------------------------------------ a topic, its partitions, two groups
export const TOPIC: Board = {
  view: [1500, 760],
  groups: [
    { x: 420, y: 20, w: 460, h: 720, t: "topic order-events", nodes: ["p0", "p1", "p2"] },
    { x: 1010, y: 20, w: 470, h: 470, t: "group notification", nodes: ["c1", "c2", "c3"] },
  ],
  nodes: [
    { id: "prod", x: 30, y: 330, w: 280, t: "Producer", s: "order-service" },
    { id: "p0", x: 460, y: 90, w: 380, h: 110, t: "Partition 0", s: "order-events-0" },
    { id: "p1", x: 460, y: 325, w: 380, h: 110, t: "Partition 1", s: "order-events-1" },
    { id: "p2", x: 460, y: 560, w: 380, h: 110, t: "Partition 2", s: "order-events-2" },
    { id: "c1", x: 1060, y: 80, w: 370, t: "Consumer 1" },
    { id: "c2", x: 1060, y: 230, w: 370, t: "Consumer 2" },
    { id: "c3", x: 1060, y: 380, w: 370, t: "Consumer 3" },
    { id: "an", x: 1060, y: 580, w: 370, t: "analytics group", s: "1 consumer" },
  ],
  edges: [
    { id: "w0", from: "prod", to: "p0", fs: "r", ts: "l", via: [[370, 372], [370, 145]] },
    { id: "w1", from: "prod", to: "p1", fs: "r", ts: "l", tof: -8 },
    { id: "w2", from: "prod", to: "p2", fs: "r", ts: "l", via: [[370, 372], [370, 615]] },
    { id: "r0", from: "p0", to: "c1", fs: "r", ts: "l", tof: 23 },
    { id: "r1", from: "p1", to: "c2", fs: "r", ts: "l", via: [[950, 380], [950, 272]] },
    { id: "r2", from: "p2", to: "c3", fs: "r", ts: "l", via: [[980, 615], [980, 422]] },
    { id: "a0", from: "p0", to: "an", fs: "r", ts: "l", fo: -25, via: [[900, 120], [900, 600], [1060, 600]] },
    { id: "a1", from: "p1", to: "an", fs: "r", ts: "l", fo: 25, via: [[920, 405], [920, 622]] },
    { id: "a2", from: "p2", to: "an", fs: "r", ts: "l", tof: 22 },
  ],
};

// ------------------------------------------------------------ the cluster: one partition, three replicas
// order-events P1: leader on Broker 2, followers on 1 and 3 (the write flow's setup).
export const CLUSTER: Board = {
  view: [1500, 770],
  nodes: [
    { id: "prod", x: 20, y: 330, w: 260, t: "Producer", s: "order-service" },
    { id: "b1", x: 480, y: 30, w: 380, h: 130, t: "Broker 1", s: "P1 follower" },
    { id: "b2", x: 480, y: 320, w: 380, h: 130, t: "Broker 2", s: "P1 leader" },
    { id: "b3", x: 480, y: 610, w: 380, h: 130, t: "Broker 3", s: "P1 follower\ncoordinator (P23)" },
    { id: "ctl", x: 1080, y: 30, w: 400, t: "Controllers", s: "KRaft · 1 active" },
    { id: "cons", x: 1080, y: 343, w: 400, t: "Consumer", s: "group notification" },
  ],
  edges: [
    { id: "pm", from: "prod", to: "b1", fs: "r", ts: "l", fo: -20, via: [[380, 352], [380, 95]], l: "metadata", lx: 392, ly: 230, la: "start" },
    { id: "pw", from: "prod", to: "b2", fs: "r", ts: "l", tof: -13, l: "produce", lx: 330, ly: 360 },
    { id: "f1", from: "b1", to: "b2", fs: "b", ts: "t", fo: -110, tof: -110, l: "fetch", lx: 590, ly: 245, la: "start" },
    { id: "f3", from: "b3", to: "b2", fs: "t", ts: "b", fo: -110, tof: -110, l: "fetch", lx: 590, ly: 535, la: "start" },
    { id: "f31", from: "b3", to: "b1", fs: "t", ts: "b", fo: 110, tof: 110, l: "fetch", lx: 802, ly: 535, la: "start" },
    { id: "c2", from: "b2", to: "cons", fs: "r", ts: "l", tof: 0, l: "records", lx: 970, ly: 373 },
    { id: "c1", from: "b1", to: "cons", fs: "r", ts: "l", fo: 30, tof: -25, via: [[1000, 125], [1000, 360]] },
    { id: "cc", from: "cons", to: "b3", fs: "b", ts: "r", l: "join · commit", lx: 1292, ly: 560, la: "start" },
    { id: "h", from: "b1", to: "ctl", fs: "r", ts: "l", fo: -25, tof: -2, l: "heartbeat", lx: 970, ly: 58 },
  ],
};

// ------------------------------------------------------------ the controller quorum
export const QUORUM: Board = {
  view: [1500, 720],
  groups: [{ x: 20, y: 20, w: 1460, h: 280, t: "controllers (vote, keep __cluster_metadata)", nodes: ["k1", "k2", "k3"] }],
  nodes: [
    { id: "k1", x: 80, y: 110, w: 380, h: 130, t: "Controller 1", s: "active · epoch 1" },
    { id: "k2", x: 560, y: 110, w: 380, h: 130, t: "Controller 2", s: "standby" },
    { id: "k3", x: 1040, y: 110, w: 380, h: 130, t: "Controller 3", s: "standby" },
    { id: "x1", x: 80, y: 520, w: 380, t: "Broker 4", s: "observer" },
    { id: "x2", x: 560, y: 520, w: 380, t: "Broker 5", s: "observer" },
    { id: "x3", x: 1040, y: 520, w: 380, t: "Broker 6", s: "observer" },
  ],
  edges: [
    { id: "s21", from: "k2", to: "k1", fs: "l", ts: "r", fo: -20, tof: -20, l: "fetch", lx: 510, ly: 135 },
    { id: "s31", d: "M1230 110 L1230 70 L270 70 L270 110", l: "fetch", lx: 750, ly: 60 },
    { id: "v23", from: "k2", to: "k3", fs: "r", ts: "l", fo: 25, tof: 25, l: "vote?", lx: 990, ly: 225 },
    { id: "b1k", from: "x1", to: "k1", fs: "t", ts: "b", l: "fetch metadata", lx: 282, ly: 390, la: "start" },
    { id: "b2k", d: "M750 520 L750 400 L360 400 L360 240" },
    { id: "b3k", d: "M1230 520 L1230 420 L400 420 L400 240" },
    { id: "b1n", d: "M270 520 L270 330 L700 330 L700 240" },
    { id: "b2n", from: "x2", to: "k2", fs: "t", ts: "b", fo: 40, tof: 40 },
    { id: "b3n", d: "M1230 520 L1230 460 L800 460 L800 240" },
  ],
};

// ------------------------------------------------------------ inside the producer
export const PIPE: Board = {
  view: [1500, 760],
  groups: [
    { x: 20, y: 20, w: 1000, h: 470, t: "your thread (calls send)", nodes: ["send", "ser", "part", "acc", "cmp"] },
    { x: 20, y: 540, w: 1000, h: 200, t: "sender thread (1 per producer)", nodes: ["snd"] },
  ],
  nodes: [
    { id: "send", x: 60, y: 90, w: 260, t: "send()", s: "key, value" },
    { id: "ser", x: 380, y: 90, w: 260, t: "Serializer", s: "object -> byte[]" },
    { id: "part", x: 700, y: 90, w: 280, t: "Partitioner", s: "murmur2 · sticky" },
    { id: "acc", x: 380, y: 290, w: 600, h: 150, t: "Record accumulator", s: "P0 batch · P1 batch · P2 batch\n32 MB buffer.memory" },
    { id: "cmp", x: 60, y: 300, w: 260, t: "Compression", s: "whole batch" },
    { id: "snd", x: 300, y: 600, w: 600, t: "Sender", s: "one request per leader broker" },
    { id: "bA", x: 1140, y: 470, w: 330, t: "Broker 1", s: "leader P0, P2" },
    { id: "bB", x: 1140, y: 640, w: 330, t: "Broker 2", s: "leader P1" },
    { id: "fut", x: 1140, y: 90, w: 330, t: "Your code", s: "gets a Future" },
  ],
  edges: [
    { id: "a", from: "send", to: "ser" },
    { id: "b", from: "ser", to: "part" },
    { id: "c", from: "part", to: "acc", fs: "b", ts: "t", fo: 0, tof: 210 },
    { id: "d", from: "acc", to: "cmp", fs: "l", ts: "r", tof: -10 },
    { id: "e", from: "cmp", to: "snd", fs: "b", ts: "l", via: [[190, 642]] },
    { id: "g", from: "snd", to: "bA", fs: "r", ts: "l", fo: -20, via: [[1040, 622], [1040, 512]] },
    { id: "h", from: "snd", to: "bB", fs: "r", ts: "l", fo: 20 },
    { id: "ret", from: "acc", to: "fut", fs: "r", ts: "b", l: "returns", lx: 1180, ly: 270, la: "start" },
  ],
};

// ------------------------------------------------------------ exactly-once inside Kafka
export const TXN: Board = {
  view: [1500, 760],
  groups: [
    { x: 20, y: 20, w: 820, h: 720, t: "Kafka cluster (brokers): only stores records", nodes: ["in", "out", "co", "tc"] },
    { x: 900, y: 20, w: 580, h: 720, t: "your app (one JVM)", nodes: ["kc", "pr", "kp"] },
  ],
  nodes: [
    { id: "in", x: 60, y: 90, w: 360, t: "payments", s: "input · ... 41, 42, 43" },
    { id: "tc", x: 60, y: 330, w: 360, t: "Txn coordinator", s: "__transaction_state", tone: "teal" },
    { id: "out", x: 460, y: 220, w: 340, t: "payment-results", s: "output topic" },
    { id: "co", x: 460, y: 540, w: 340, t: "__consumer_offsets", s: "payment-svc -> 42" },
    { id: "kc", x: 960, y: 90, w: 460, t: "KafkaConsumer", s: "read_committed" },
    { id: "pr", x: 960, y: 300, w: 460, t: "process(record)", s: "any DB / API call is here" },
    { id: "kp", x: 960, y: 520, w: 460, t: "KafkaProducer", s: "transactional.id payment-svc-1" },
  ],
  edges: [
    { id: "poll", from: "in", to: "kc", fs: "r", ts: "l", l: "poll", lx: 700, ly: 120 },
    { id: "kcp", from: "kc", to: "pr", fs: "b", ts: "t" },
    { id: "prk", from: "pr", to: "kp", fs: "b", ts: "t" },
    { id: "wo", from: "kp", to: "out", fs: "l", ts: "r", fo: -20, via: [[880, 542], [880, 262]], l: "R42 pending", lx: 892, ly: 455, la: "start" },
    { id: "wc", from: "kp", to: "co", fs: "l", ts: "r", fo: 20, tof: 0, l: "43 pending", lx: 880, ly: 600, la: "middle" },
    { id: "end", from: "kp", to: "tc", fs: "b", ts: "b", via: [[1190, 700], [240, 700]], l: "commit / abort", lx: 700, ly: 690 },
    { id: "mo", from: "tc", to: "out", fs: "r", ts: "l", tof: 20, l: "marker", lx: 430, ly: 330, la: "start" },
    { id: "mc", from: "tc", to: "co", fs: "r", ts: "l", fo: 20, via: [[440, 392], [440, 582]], l: "marker", lx: 446, ly: 500, la: "start" },
  ],
};

// ------------------------------------------------------------ dual write and the outbox
export const OUTBOX: Board = {
  view: [1500, 720],
  groups: [{ x: 300, y: 20, w: 520, h: 330, t: "one local DB transaction", nodes: ["orders", "outbox"] }],
  nodes: [
    { id: "svc", x: 20, y: 140, w: 230, t: "Order service", s: "placeOrder()" },
    { id: "orders", x: 340, y: 80, w: 440, t: "INSERT orders", s: "the business row" },
    { id: "outbox", x: 340, y: 220, w: 440, t: "INSERT outbox", s: "event id · aggregate_id" },
    { id: "relay", x: 340, y: 520, w: 440, t: "Outbox relay", s: "poll · publish · mark", tone: "teal" },
    { id: "k", x: 960, y: 220, w: 300, t: "Kafka", s: "orders topic" },
    { id: "cons", x: 1180, y: 520, w: 300, t: "Consumer", s: "dedupes on event id" },
  ],
  edges: [
    { id: "tx", from: "svc", to: "orders", fs: "r", ts: "l", via: [[290, 182], [290, 122]] },
    { id: "tx2", from: "svc", to: "outbox", fs: "r", ts: "l", via: [[290, 182], [290, 262]] },
    { id: "direct", from: "svc", to: "k", fs: "b", ts: "l", via: [[135, 470], [890, 470], [890, 262]], l: "dual write: DB, then Kafka", lx: 150, ly: 460, la: "start" },
    { id: "rd", from: "relay", to: "outbox", fs: "t", ts: "b", l: "1 read unpublished", lx: 572, ly: 420, la: "start" },
    { id: "pub", from: "relay", to: "k", fs: "r", ts: "b", fo: -20, tof: -80, via: [[1030, 542]], l: "2 publish, wait for ack", lx: 800, ly: 530, la: "start" },
    { id: "mark", from: "relay", to: "outbox", fs: "l", ts: "l", fo: 0, via: [[300, 562], [300, 262]] },
    { id: "kc", from: "k", to: "cons", fs: "b", ts: "t", fo: 80, via: [[1190, 420], [1330, 420]] },
  ],
};

// ------------------------------------------------------------ retries and the DLT
export const RETRY: Board = {
  view: [1500, 700],
  nodes: [
    { id: "main", x: 20, y: 80, w: 300, t: "payments", s: "main topic" },
    { id: "lst", x: 420, y: 80, w: 300, t: "Listener", s: "charge(p)" },
    { id: "ok", x: 820, y: 80, w: 260, t: "Done", tone: "green" },
    { id: "r1", x: 20, y: 380, w: 300, t: "retry-1000", s: "wait 1 s" },
    { id: "r2", x: 420, y: 380, w: 300, t: "retry-2000", s: "wait 2 s" },
    { id: "r3", x: 820, y: 380, w: 300, t: "retry-4000", s: "wait 4 s" },
    { id: "dlt", x: 1180, y: 380, w: 300, t: "payments-dlt", s: "@DltHandler", tone: "red" },
    { id: "ops", x: 1180, y: 580, w: 300, t: "Alert · fix · replay", s: "idempotent" },
  ],
  edges: [
    { id: "m-l", from: "main", to: "lst" },
    { id: "l-ok", from: "lst", to: "ok" },
    { id: "l-r1", from: "lst", to: "r1", fs: "b", ts: "t", fo: -60, via: [[510, 300], [170, 300]], l: "fail", lx: 340, ly: 290 },
    { id: "r1-r2", from: "r1", to: "r2", l: "fail", lx: 370, ly: 410 },
    { id: "r2-r3", from: "r2", to: "r3", l: "fail", lx: 770, ly: 410 },
    { id: "r3-d", from: "r3", to: "dlt", l: "fail", lx: 1150, ly: 410 },
    { id: "d-o", from: "dlt", to: "ops", fs: "b", ts: "t" },
  ],
};
