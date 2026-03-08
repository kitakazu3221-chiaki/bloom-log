import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const USERS_FILE = resolve(DATA_DIR, "users.json");
const PHOTOS_DIR = resolve(DATA_DIR, "photos");
const RECORDS_DIR = resolve(DATA_DIR, "records");

const JWT_SECRET =
  process.env.JWT_SECRET ?? "bloom-log-dev-secret-change-in-production";
const BCRYPT_ROUNDS = 10;
const PORT = Number(process.env.PORT ?? 3001);
const IS_PROD = process.env.NODE_ENV === "production";
const TRIAL_DAYS = 3;

// ── Stripe ──────────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
});
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";

// Ensure data directories exist
for (const dir of [DATA_DIR, PHOTOS_DIR, RECORDS_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
if (!existsSync(USERS_FILE)) {
  writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2), "utf-8");
}

// Migrate existing users: add trialEndsAt if missing
{
  const store = JSON.parse(readFileSync(USERS_FILE, "utf-8")) as { users: User[] };
  let changed = false;
  for (const user of store.users) {
    if (!user.trialEndsAt) {
      const created = new Date(user.createdAt);
      user.trialEndsAt = new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
      user.subscriptionStatus = "none";
      changed = true;
    }
  }
  if (changed) writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// ── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  trialEndsAt: string;
  stripeCustomerId?: string;
  subscriptionStatus?: "trialing" | "active" | "canceled" | "past_due" | "none";
  subscriptionId?: string;
  currentPeriodEnd?: string;
}
interface UsersStore {
  users: User[];
}

type ScalpArea = "top" | "front" | "side";
interface NoteData {
  shampoo?: string;
  treatment?: string;
  sleep?: number;
  stress?: number;
}
interface PhotoRecord {
  id: string;
  date: string;
  area: ScalpArea;
  filename: string;
  notes: NoteData;
}
interface RecordsStore {
  records: PhotoRecord[];
}

interface SignalMessage {
  type: string;
  [key: string]: unknown;
}
interface Session {
  pcMessages: SignalMessage[];
  phoneMessages: SignalMessage[];
  pcSSE: express.Response | null;
  phoneSSE: express.Response | null;
}
interface AuthRequest extends express.Request {
  authUser: { userId: string; username: string };
}

// ── Auth helpers ─────────────────────────────────────────────────────────────

function readUsers(): UsersStore {
  return JSON.parse(readFileSync(USERS_FILE, "utf-8")) as UsersStore;
}
function writeUsers(store: UsersStore): void {
  writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function setCookieToken(
  res: express.Response,
  userId: string,
  username: string
): void {
  const token = jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: "30d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function verifyToken(
  token: string
): { userId: string; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
    };
  } catch {
    return null;
  }
}

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const token = (req.cookies as Record<string, string>).token;
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }
  (req as AuthRequest).authUser = payload;
  next();
}

// ── Subscription helpers ─────────────────────────────────────────────────────

function getUserSubscriptionState(user: User): "trialing" | "active" | "expired" {
  if (user.subscriptionStatus === "active") return "active";
  const trialEnd = new Date(user.trialEndsAt);
  if (Date.now() < trialEnd.getTime()) return "trialing";
  return "expired";
}

function requireSubscription(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const { userId } = (req as AuthRequest).authUser;
  const store = readUsers();
  const user = store.users.find((u) => u.id === userId);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  const state = getUserSubscriptionState(user);
  if (state === "expired") {
    res.status(403).json({ error: "subscription_required" });
    return;
  }
  next();
}

// ── Records helpers ───────────────────────────────────────────────────────────

async function readRecords(userId: string): Promise<PhotoRecord[]> {
  const dir = join(RECORDS_DIR, userId);
  await mkdir(dir, { recursive: true });
  try {
    const raw = await readFile(join(dir, "records.json"), "utf-8");
    return (JSON.parse(raw) as RecordsStore).records ?? [];
  } catch { return []; }
}

async function writeRecords(userId: string, records: PhotoRecord[]): Promise<void> {
  const dir = join(RECORDS_DIR, userId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "records.json"), JSON.stringify({ records }, null, 2), "utf-8");
}

// ── Signaling helpers ─────────────────────────────────────────────────────────

const sessions = new Map<string, Session>();

function sendSSE(res: express.Response, data: SignalMessage): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
function pushToRole(session: Session, role: "pc" | "phone", msg: SignalMessage): void {
  if (role === "pc") {
    if (session.pcSSE) sendSSE(session.pcSSE, msg); else session.pcMessages.push(msg);
  } else {
    if (session.phoneSSE) sendSSE(session.phoneSSE, msg); else session.phoneMessages.push(msg);
  }
}
function flushMessages(session: Session, role: "pc" | "phone"): void {
  const target = role === "pc" ? session.pcSSE : session.phoneSSE;
  const queue = role === "pc" ? session.pcMessages : session.phoneMessages;
  if (target && queue.length > 0) {
    for (const msg of queue) sendSSE(target, msg);
    queue.length = 0;
  }
}

// ── Rate limiters ────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: "リクエストが多すぎます。しばらくしてから再試行してください" },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: { error: "アップロードが多すぎます。しばらくしてから再試行してください" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();

// ── Stripe webhook (must be before express.json) ─────────────────────────────

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!STRIPE_WEBHOOK_SECRET) { res.status(500).send("Webhook not configured"); return; }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      req.headers["stripe-signature"]!,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[stripe] Webhook signature verification failed:", err);
    res.status(400).send("Webhook signature verification failed");
    return;
  }

  const store = readUsers();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const user = store.users.find((u) => u.stripeCustomerId === sub.customer);
      if (user) {
        user.subscriptionId = sub.id;
        user.subscriptionStatus = sub.status === "active" ? "active"
          : sub.status === "past_due" ? "past_due"
          : sub.status === "canceled" ? "canceled"
          : "none";
        user.currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
        writeUsers(store);
        console.log(`[stripe] Subscription ${sub.status} for user ${user.username}`);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const user = store.users.find((u) => u.stripeCustomerId === sub.customer);
      if (user) {
        user.subscriptionStatus = "canceled";
        user.subscriptionId = undefined;
        user.currentPeriodEnd = undefined;
        writeUsers(store);
        console.log(`[stripe] Subscription canceled for user ${user.username}`);
      }
      break;
    }
  }

  res.json({ received: true });
});

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username?.trim() || !password) { res.status(400).json({ error: "ユーザー名とパスワードを入力してください" }); return; }
  if (username.length < 3) { res.status(400).json({ error: "ユーザー名は3文字以上にしてください" }); return; }
  if (password.length < 8) { res.status(400).json({ error: "パスワードは8文字以上にしてください" }); return; }

  const store = readUsers();
  if (store.users.some((u) => u.username === username)) {
    res.status(409).json({ error: "そのユーザー名は既に使用されています" }); return;
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const user: User = {
    id: crypto.randomUUID(), username, passwordHash,
    createdAt: now.toISOString(),
    trialEndsAt: trialEnd.toISOString(),
    subscriptionStatus: "none",
  };
  store.users.push(user);
  writeUsers(store);
  setCookieToken(res, user.id, user.username);
  res.json({ username: user.username });
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) { res.status(400).json({ error: "ユーザー名とパスワードを入力してください" }); return; }
  const store = readUsers();
  const user = store.users.find((u) => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "ユーザー名またはパスワードが正しくありません" }); return;
  }
  setCookieToken(res, user.id, user.username);
  res.json({ username: user.username });
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const token = (req.cookies as Record<string, string>).token;
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }
  const store = readUsers();
  const user = store.users.find((u) => u.id === payload.userId);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  const subscription = getUserSubscriptionState(user);
  const trialDaysLeft = Math.max(0, Math.ceil(
    (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));
  res.json({ username: payload.username, subscription, trialDaysLeft });
});

// ── Signaling routes ──────────────────────────────────────────────────────────

app.post("/api/session/create", (_req, res) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, { pcMessages: [], phoneMessages: [], pcSSE: null, phoneSSE: null });
  console.log(`[signal] Session created: ${sessionId}`);
  res.json({ sessionId });
});

app.post("/api/session/join", (req, res) => {
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) { res.status(400).json({ error: "Missing sessionId" }); return; }
  const session = sessions.get(sessionId);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  pushToRole(session, "pc", { type: "peer-joined", sessionId });
  pushToRole(session, "phone", { type: "peer-joined", sessionId });
  res.json({ ok: true });
});

app.post("/api/session/signal", (req, res) => {
  const { sessionId, role, message } = req.body as {
    sessionId?: string; role?: "pc" | "phone"; message?: SignalMessage;
  };
  if (!sessionId || !role || !message) { res.status(400).json({ error: "Missing fields" }); return; }
  const session = sessions.get(sessionId);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  pushToRole(session, role === "pc" ? "phone" : "pc", message);
  res.json({ ok: true });
});

app.get("/api/session/events", (req, res) => {
  const { session: sessionId, role } = req.query as { session?: string; role?: "pc" | "phone" };
  if (!sessionId || !role) { res.status(400).end("Missing session or role"); return; }
  const session = sessions.get(sessionId);
  if (!session) { res.status(404).end("Session not found"); return; }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  if (role === "pc") session.pcSSE = res; else session.phoneSSE = res;
  flushMessages(session, role);
  console.log(`[signal] SSE connected: ${role} for ${sessionId}`);

  req.on("close", () => {
    console.log(`[signal] SSE disconnected: ${role} for ${sessionId}`);
    if (role === "pc") session.pcSSE = null; else session.phoneSSE = null;
    pushToRole(session, role === "pc" ? "phone" : "pc", { type: "peer-left" });
    if (!session.pcSSE && !session.phoneSSE) {
      sessions.delete(sessionId);
      console.log(`[signal] Session removed: ${sessionId}`);
    }
  });
});

// ── Subscription routes ──────────────────────────────────────────────────────

app.post("/api/subscription/checkout", requireAuth, async (req, res) => {
  if (!STRIPE_PRICE_ID) { res.status(500).json({ error: "Stripe not configured" }); return; }
  const { userId, username } = (req as AuthRequest).authUser;
  const store = readUsers();
  const user = store.users.find((u) => u.id === userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  try {
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId, username },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      writeUsers(store);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${req.headers.origin ?? "https://bloom-log.com"}/?checkout=success`,
      cancel_url: `${req.headers.origin ?? "https://bloom-log.com"}/?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[stripe] checkout error:", err);
    res.status(500).json({ error: "チェックアウトの作成に失敗しました" });
  }
});

app.post("/api/subscription/portal", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  const store = readUsers();
  const user = store.users.find((u) => u.id === userId);
  if (!user?.stripeCustomerId) {
    res.status(400).json({ error: "サブスクリプションが見つかりません" });
    return;
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${req.headers.origin ?? "https://bloom-log.com"}/`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("[stripe] portal error:", err);
    res.status(500).json({ error: "ポータルの作成に失敗しました" });
  }
});

app.get("/api/subscription/status", requireAuth, (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  const store = readUsers();
  const user = store.users.find((u) => u.id === userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const state = getUserSubscriptionState(user);
  const trialDaysLeft = Math.max(0, Math.ceil(
    (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));
  res.json({
    state,
    trialDaysLeft,
    subscriptionStatus: user.subscriptionStatus ?? "none",
    currentPeriodEnd: user.currentPeriodEnd ?? null,
  });
});

// ── Photo routes ──────────────────────────────────────────────────────────────

app.post("/api/photos/upload", uploadLimiter, requireAuth, requireSubscription, async (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  const { dataUrl, area, notes } = req.body as {
    dataUrl?: string; area?: ScalpArea; notes?: NoteData;
  };
  if (!dataUrl || !area) { res.status(400).json({ error: "Missing fields" }); return; }

  try {
    const base64 = dataUrl.split(",")[1];
    if (!base64) { res.status(400).json({ error: "Invalid dataUrl" }); return; }

    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const filename = `${datePart}T${timePart}_${area}.jpg`;

    const areaDir = join(PHOTOS_DIR, userId, area);
    await mkdir(areaDir, { recursive: true });
    await writeFile(join(areaDir, filename), Buffer.from(base64, "base64"));

    const record: PhotoRecord = {
      id: crypto.randomUUID(), date: datePart, area, filename, notes: notes ?? {},
    };
    const records = await readRecords(userId);
    records.push(record);
    await writeRecords(userId, records);

    res.json(record);
  } catch (err) {
    console.error("[photos] upload error:", err);
    res.status(500).json({ error: "保存に失敗しました" });
  }
});

app.get("/api/photos/records", requireAuth, requireSubscription, async (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  res.json({ records: await readRecords(userId) });
});

app.get("/api/photos/file/:area/:filename", requireAuth, requireSubscription, async (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  const { area, filename } = req.params as { area: string; filename: string };
  if (filename.includes("..") || area.includes("..")) { res.status(400).end(); return; }
  try {
    const data = await readFile(join(PHOTOS_DIR, userId, area, filename));
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.end(data);
  } catch { res.status(404).end(); }
});

// ── Static files (production) ─────────────────────────────────────────────────

if (IS_PROD) {
  const STATIC_DIR = resolve(__dirname, "../../client/dist");
  app.use(express.static(STATIC_DIR));
  app.use((_req, res) => {
    res.sendFile(resolve(STATIC_DIR, "index.html"));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

const HOST = IS_PROD ? "0.0.0.0" : "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`Bloom Log server on http://${HOST}:${PORT} [${IS_PROD ? "production" : "dev"}]`);
});
