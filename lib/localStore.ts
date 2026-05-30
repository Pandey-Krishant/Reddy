// ── Local Store — client-side user & bet management ──────────────────────────
// All data stored in localStorage. Works in same browser/device.

export interface RWUser {
  id: string;
  username: string;
  password: string; // plain text for simplicity (not production-grade)
  balance: number;
  exposure: number;
  createdAt: string;
}

export interface RWBet {
  id: string;
  userId: string;
  username: string;
  matchId: number;
  matchTitle: string;
  teamA: string;
  teamB: string;
  selectedTeam: string;
  amount: number;
  status: "pending" | "won" | "lost" | "cancelled";
  placedAt: string;
}

export interface RWSession {
  userId: string;
  username: string;
}

const USERS_KEY = "rw_users";
const BETS_KEY = "rw_bets";
const SESSION_KEY = "rw_session";

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function getUsers(): RWUser[] {
  return safeRead<RWUser[]>(USERS_KEY, []);
}

export function saveUsers(users: RWUser[]) {
  safeWrite(USERS_KEY, users);
}

export function getUserByUsername(username: string): RWUser | null {
  const users = getUsers();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export function getUserById(id: string): RWUser | null {
  const users = getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export function registerUser(username: string, password: string): { ok: boolean; error?: string } {
  if (!username.trim() || !password.trim()) return { ok: false, error: "Username and password required" };
  if (username.length < 3) return { ok: false, error: "Username must be at least 3 characters" };
  if (password.length < 4) return { ok: false, error: "Password must be at least 4 characters" };

  const existing = getUserByUsername(username);
  if (existing) return { ok: false, error: "Username already taken" };

  const user: RWUser = {
    id: uuid(),
    username: username.trim(),
    password,
    balance: 0,
    exposure: 0,
    createdAt: new Date().toISOString(),
  };

  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return { ok: true };
}

export function updateUserBalance(userId: string, newBalance: number, newExposure?: number) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx].balance = newBalance;
  if (newExposure !== undefined) users[idx].exposure = newExposure;
  saveUsers(users);

  // Update session if this is the current user
  const session = getSession();
  if (session && session.userId === userId) {
    saveSession(session);
  }
}

// ── Bets ─────────────────────────────────────────────────────────────────────

export function getBets(): RWBet[] {
  return safeRead<RWBet[]>(BETS_KEY, []);
}

export function saveBets(bets: RWBet[]) {
  safeWrite(BETS_KEY, bets);
}

export function getBetsByUser(userId: string): RWBet[] {
  return getBets().filter((b) => b.userId === userId);
}

export function placeBet(
  userId: string,
  username: string,
  matchId: number,
  matchTitle: string,
  teamA: string,
  teamB: string,
  selectedTeam: string,
  amount: number
): { ok: boolean; error?: string } {
  const users = getUsers();
  const userIdx = users.findIndex((u) => u.id === userId);
  if (userIdx === -1) return { ok: false, error: "User not found" };

  const user = users[userIdx];
  if (user.balance < amount) return { ok: false, error: "Insufficient balance" };
  if (amount < 100) return { ok: false, error: "Minimum bet is 100 Rs." };

  // Check if already has bet on this match
  const bets = getBets();
  const existingBetIdx = bets.findIndex((b) => b.userId === userId && b.matchId === matchId && b.status === "pending");

  if (existingBetIdx !== -1) {
    // Add more to existing bet
    bets[existingBetIdx].amount += amount;
    saveBets(bets);
  } else {
    // New bet
    const bet: RWBet = {
      id: uuid(),
      userId,
      username,
      matchId,
      matchTitle,
      teamA,
      teamB,
      selectedTeam,
      amount,
      status: "pending",
      placedAt: new Date().toISOString(),
    };
    bets.push(bet);
    saveBets(bets);
  }

  // Deduct balance, add to exposure
  users[userIdx].balance -= amount;
  users[userIdx].exposure += amount;
  saveUsers(users);

  return { ok: true };
}

export function cancelBet(userId: string, matchId: number): { ok: boolean; error?: string } {
  const bets = getBets();
  const betIdx = bets.findIndex((b) => b.userId === userId && b.matchId === matchId && b.status === "pending");
  if (betIdx === -1) return { ok: false, error: "Bet not found" };

  const bet = bets[betIdx];
  bets[betIdx].status = "cancelled";
  saveBets(bets);

  // Refund balance
  const users = getUsers();
  const userIdx = users.findIndex((u) => u.id === userId);
  if (userIdx !== -1) {
    users[userIdx].balance += bet.amount;
    users[userIdx].exposure = Math.max(0, users[userIdx].exposure - bet.amount);
    saveUsers(users);
  }

  return { ok: true };
}

export function resolveBet(betId: string, status: "won" | "lost" | "cancelled" | "pending"): { ok: boolean; error?: string } {
  const bets = getBets();
  const betIdx = bets.findIndex((b) => b.id === betId);
  if (betIdx === -1) return { ok: false, error: "Bet not found" };

  const bet = bets[betIdx];
  const oldStatus = bet.status;
  if (oldStatus === status) return { ok: true };

  bet.status = status;
  saveBets(bets);

  // Update user balance/exposure based on state change
  const users = getUsers();
  const userIdx = users.findIndex((u) => u.id === bet.userId);
  if (userIdx !== -1) {
    const user = users[userIdx];
    if (oldStatus === "pending") {
      // Deduct from exposure
      user.exposure = Math.max(0, user.exposure - bet.amount);
      if (status === "won") {
        // Refund bet amount + 100% profit (2x payout)
        user.balance += bet.amount * 2;
      } else if (status === "cancelled") {
        // Refund bet amount
        user.balance += bet.amount;
      }
      // If lost, the money is already deducted from balance, so do nothing.
    } else {
      // Reverting a resolved bet to pending
      if (status === "pending") {
        user.exposure += bet.amount;
        if (oldStatus === "won") {
          user.balance = Math.max(0, user.balance - bet.amount * 2);
        } else if (oldStatus === "cancelled") {
          user.balance = Math.max(0, user.balance - bet.amount);
        }
      }
    }
    saveUsers(users);
  }

  return { ok: true };
}

// ── Session ───────────────────────────────────────────────────────────────────

export function getSession(): RWSession | null {
  return safeRead<RWSession | null>(SESSION_KEY, null);
}

export function saveSession(session: RWSession) {
  safeWrite(SESSION_KEY, session);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): RWUser | null {
  const session = getSession();
  if (!session) return null;
  return getUserById(session.userId);
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin123";

export function isAdminSession(): boolean {
  const session = getSession();
  return session?.userId === "admin";
}

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    saveSession({ userId: "admin", username: "admin" });
    return true;
  }
  return false;
}
