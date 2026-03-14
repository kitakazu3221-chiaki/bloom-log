import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import geoip from "geoip-lite";
import { OAuth2Client } from "google-auth-library";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const USERS_FILE = resolve(DATA_DIR, "users.json");
const PHOTOS_DIR = resolve(DATA_DIR, "photos");
const RECORDS_DIR = resolve(DATA_DIR, "records");

const IS_PROD = process.env.NODE_ENV === "production";
if (IS_PROD && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is required in production");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET ?? crypto.randomUUID();
const BCRYPT_ROUNDS = 10;
const PORT = Number(process.env.PORT ?? 3001);
const TRIAL_DAYS = 14;
const ALLOWED_ORIGINS = ["https://bloom-log.com"];
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
if (!IS_PROD) ALLOWED_ORIGINS.push("http://localhost:5173", "http://localhost:3001");

// ── Stripe ──────────────────────────────────────────────────────────────────

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : (null as unknown as Stripe);
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const STRIPE_PRICE_ID_JPY = process.env.STRIPE_PRICE_ID_JPY ?? process.env.STRIPE_PRICE_ID ?? "";
const STRIPE_PRICE_ID_USD = process.env.STRIPE_PRICE_ID_USD ?? process.env.STRIPE_PRICE_ID ?? "";

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
  passwordHash?: string;
  googleId?: string;
  email?: string;
  createdAt: string;
  trialEndsAt: string;
  stripeCustomerId?: string;
  subscriptionStatus?: "trialing" | "active" | "canceled" | "past_due" | "none";
  subscriptionId?: string;
  currentPeriodEnd?: string;
  storageMode?: "cloud" | "local" | "filesystem";
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
  exercise?: boolean;
  exerciseType?: string;
  diet?: number;
  alcohol?: boolean;
  supplements?: string;
  scalpMassage?: boolean;
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
  // Validate userId is a valid UUID format to prevent path injection
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.userId)) {
    res.status(401).json({ error: "Invalid token" }); return;
  }
  (req as AuthRequest).authUser = payload;
  next();
}

// ── Subscription helpers ─────────────────────────────────────────────────────

function getUserSubscriptionState(user: User): "free" | "active" {
  if (user.subscriptionStatus === "active") return "active";
  return "free";
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

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const sessions = new Map<string, Session & { createdAt: number }>();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      if (session.pcSSE) session.pcSSE.end();
      if (session.phoneSSE) session.phoneSSE.end();
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

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

const signalingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30,
  message: { error: "リクエストが多すぎます" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();

// Trust first proxy (Caddy) for correct IP detection in rate limiting
if (IS_PROD) app.set("trust proxy", 1);

// Validate Origin header against whitelist
function getSafeOrigin(req: express.Request): string {
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return "https://bloom-log.com";
}

// ── CORS middleware ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  next();
});

// ── Security headers ────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.removeHeader("X-Powered-By");
  next();
});

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

  try {
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
          const periodEnd = typeof sub.current_period_end === "number"
            ? new Date(sub.current_period_end * 1000)
            : new Date(sub.current_period_end);
          user.currentPeriodEnd = isNaN(periodEnd.getTime()) ? undefined : periodEnd.toISOString();
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
  } catch (err) {
    console.error("[stripe] Webhook processing error:", err);
  }

  res.json({ received: true });
});

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username?.trim() || !password) { res.status(400).json({ error: "ユーザー名とパスワードを入力してください" }); return; }
  if (username.length < 3 || username.length > 30) { res.status(400).json({ error: "ユーザー名は3〜30文字にしてください" }); return; }
  if (!/^[a-zA-Z0-9_\-]+$/.test(username)) { res.status(400).json({ error: "ユーザー名は英数字・アンダースコア・ハイフンのみ使用できます" }); return; }
  if (password.length < 8 || password.length > 128) { res.status(400).json({ error: "パスワードは8〜128文字にしてください" }); return; }

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
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "ユーザー名またはパスワードが正しくありません" }); return;
  }
  setCookieToken(res, user.id, user.username);
  res.json({ username: user.username });
});

app.post("/api/auth/google", authLimiter, async (req, res) => {
  const { credential } = req.body as { credential?: string };
  if (!credential || !googleClient) { res.status(400).json({ error: "Google login not available" }); return; }
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub) { res.status(400).json({ error: "Invalid Google token" }); return; }
    const { sub: googleId, email, name } = payload;
    const store = readUsers();
    let user = store.users.find((u) => u.googleId === googleId);
    if (!user) {
      // Generate username from email or name
      const base = (email?.split("@")[0] ?? name ?? "user").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 20);
      let username = base;
      if (store.users.some((u) => u.username === username)) {
        username = `${base}_${crypto.randomUUID().slice(0, 4)}`;
      }
      const now = new Date();
      const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      user = {
        id: crypto.randomUUID(), username, googleId, email,
        createdAt: now.toISOString(), trialEndsAt: trialEnd.toISOString(),
        subscriptionStatus: "none",
      };
      store.users.push(user);
      writeUsers(store);
    }
    setCookieToken(res, user.id, user.username);
    res.json({ username: user.username });
  } catch {
    res.status(401).json({ error: "Google認証に失敗しました" });
  }
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
  const trialDaysLeft = 0;
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "";
  const geo = geoip.lookup(ip);
  const region = geo?.country === "JP" ? "jp" : "global";
  res.json({ username: payload.username, subscription, trialDaysLeft, createdAt: user.createdAt, storageMode: user.storageMode ?? "cloud", region });
});

// ── Signaling routes ──────────────────────────────────────────────────────────

app.post("/api/session/create", signalingLimiter, requireAuth, (_req, res) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, { pcMessages: [], phoneMessages: [], pcSSE: null, phoneSSE: null, createdAt: Date.now() });
  console.log(`[signal] Session created: ${sessionId}`);
  res.json({ sessionId });
});

app.post("/api/session/join", signalingLimiter, requireAuth, (req, res) => {
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) { res.status(400).json({ error: "Missing sessionId" }); return; }
  const session = sessions.get(sessionId);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  pushToRole(session, "pc", { type: "peer-joined", sessionId });
  pushToRole(session, "phone", { type: "peer-joined", sessionId });
  res.json({ ok: true });
});

app.post("/api/session/signal", signalingLimiter, requireAuth, (req, res) => {
  const { sessionId, role, message } = req.body as {
    sessionId?: string; role?: "pc" | "phone"; message?: SignalMessage;
  };
  if (!sessionId || !role || !message) { res.status(400).json({ error: "Missing fields" }); return; }
  const session = sessions.get(sessionId);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  pushToRole(session, role === "pc" ? "phone" : "pc", message);
  res.json({ ok: true });
});

app.get("/api/session/events", requireAuth, (req, res) => {
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
  const locale = (req.body as { locale?: string } | undefined)?.locale;
  const priceId = locale === "ja" ? STRIPE_PRICE_ID_JPY : STRIPE_PRICE_ID_USD;
  if (!priceId) { res.status(500).json({ error: "Stripe not configured" }); return; }
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
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getSafeOrigin(req)}/?checkout=success`,
      cancel_url: `${getSafeOrigin(req)}/?checkout=cancel`,
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
      return_url: `${getSafeOrigin(req)}/`,
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
  res.json({
    state,
    trialDaysLeft: 0,
    subscriptionStatus: user.subscriptionStatus ?? "none",
    currentPeriodEnd: user.currentPeriodEnd ?? null,
  });
});

// ── Photo routes ──────────────────────────────────────────────────────────────

app.post("/api/photos/upload", uploadLimiter, requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  const { dataUrl, area, notes } = req.body as {
    dataUrl?: string; area?: ScalpArea; notes?: NoteData;
  };
  if (!dataUrl || !area) { res.status(400).json({ error: "Missing fields" }); return; }
  // Validate area is an allowed value
  if (!["top", "front", "side"].includes(area)) { res.status(400).json({ error: "Invalid area" }); return; }

  // Sanitize notes data
  const sanitizedNotes: NoteData = {};
  if (notes && typeof notes === "object") {
    if (typeof notes.shampoo === "string") sanitizedNotes.shampoo = notes.shampoo.slice(0, 200);
    if (typeof notes.treatment === "string") sanitizedNotes.treatment = notes.treatment.slice(0, 200);
    if (typeof notes.sleep === "number" && notes.sleep >= 0 && notes.sleep <= 24) sanitizedNotes.sleep = notes.sleep;
    if (typeof notes.stress === "number" && notes.stress >= 1 && notes.stress <= 5) sanitizedNotes.stress = notes.stress;
    if (typeof notes.exercise === "boolean") sanitizedNotes.exercise = notes.exercise;
    if (typeof notes.exerciseType === "string") sanitizedNotes.exerciseType = notes.exerciseType.slice(0, 200);
    if (typeof notes.diet === "number" && notes.diet >= 1 && notes.diet <= 5) sanitizedNotes.diet = notes.diet;
    if (typeof notes.alcohol === "boolean") sanitizedNotes.alcohol = notes.alcohol;
    if (typeof notes.supplements === "string") sanitizedNotes.supplements = notes.supplements.slice(0, 200);
    if (typeof notes.scalpMassage === "boolean") sanitizedNotes.scalpMassage = notes.scalpMassage;
  }

  try {
    const base64 = dataUrl.split(",")[1];
    if (!base64) { res.status(400).json({ error: "Invalid dataUrl" }); return; }

    const buf = Buffer.from(base64, "base64");
    // Validate file size (max 5MB after decode)
    if (buf.length > 5 * 1024 * 1024) { res.status(400).json({ error: "File too large" }); return; }
    // Validate JPEG/PNG magic bytes
    const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    if (!isJpeg && !isPng) { res.status(400).json({ error: "Invalid image format" }); return; }

    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const filename = `${datePart}T${timePart}_${area}.jpg`;

    const areaDir = join(PHOTOS_DIR, userId, area);
    await mkdir(areaDir, { recursive: true });
    await writeFile(join(areaDir, filename), buf);

    const record: PhotoRecord = {
      id: crypto.randomUUID(), date: datePart, area, filename, notes: sanitizedNotes,
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

app.get("/api/photos/records", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  res.json({ records: await readRecords(userId) });
});

app.get("/api/photos/file/:area/:filename", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  const { area, filename } = req.params as { area: string; filename: string };
  // Validate area is one of allowed values
  if (!["top", "front", "side"].includes(area)) { res.status(400).end(); return; }
  // Validate filename: only allow safe characters (date_area.jpg pattern)
  if (!/^[\w\-]+\.jpg$/.test(filename)) { res.status(400).end(); return; }
  // Resolve and verify the path stays within PHOTOS_DIR
  const filePath = resolve(PHOTOS_DIR, userId, area, filename);
  if (!filePath.startsWith(resolve(PHOTOS_DIR, userId) + "/")) { res.status(400).end(); return; }
  try {
    const data = await readFile(filePath);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.end(data);
  } catch { res.status(404).end(); }
});

app.delete("/api/photos/:id", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  const recordsFile = join(RECORDS_DIR, userId, "records.json");
  try {
    const store = JSON.parse(await readFile(recordsFile, "utf-8")) as RecordsStore;
    const idx = store.records.findIndex((r) => r.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: "not_found" }); return; }
    const record = store.records[idx];
    // Delete photo file
    const photoPath = join(PHOTOS_DIR, userId, record.area, record.filename);
    try { await unlink(photoPath); } catch { /* file may already be gone */ }
    // Remove from records
    store.records.splice(idx, 1);
    await writeFile(recordsFile, JSON.stringify(store, null, 2), "utf-8");
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "delete_failed" }); }
});

app.post("/api/settings/storage-mode", requireAuth, (req, res) => {
  const { userId } = (req as AuthRequest).authUser;
  const { mode } = req.body as { mode?: string };
  if (mode !== "cloud" && mode !== "local" && mode !== "filesystem") { res.status(400).json({ error: "invalid_mode" }); return; }
  const store = JSON.parse(readFileSync(USERS_FILE, "utf-8")) as UsersStore;
  const user = store.users.find((u) => u.id === userId);
  if (!user) { res.status(404).json({ error: "user_not_found" }); return; }
  user.storageMode = mode;
  writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), "utf-8");
  res.json({ ok: true, storageMode: mode });
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
