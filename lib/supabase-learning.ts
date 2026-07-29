const supabaseUrl = "https://bchmoqgkespahyjkzkxb.supabase.co";
const publishableKey = "sb_publishable_Fg-P-6yk0XChZZ3qkWV8mg_IEc1gBKx";
const sessionKey = "yeokjuhang-supabase-session";

export type LearningSession = {
  access_token: string;
  user: { id: string; email?: string | null; user_metadata?: { learning_id?: string } };
};

function learningEmail(learningId: string) {
  const safeId = learningId.trim().toLowerCase().replace(/[^a-z0-9\uac00-\ud7a3_-]/g, "");
  return `${safeId}@yeokjuhang.invalid`;
}

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("apikey", publishableKey);
  headers.set("Content-Type", "application/json");
  return fetch(`${supabaseUrl}${path}`, { ...options, headers });
}

// The GoTrue REST API returns the session directly, while SDK calls wrap it
// in a `session` property. Supporting both prevents false sign-up failures.
function sessionFrom(data: unknown): LearningSession | null {
  const candidate = data && typeof data === "object" && "session" in data
    ? (data as { session?: unknown }).session
    : data;

  if (candidate && typeof candidate === "object" && "access_token" in candidate && "user" in candidate) {
    return candidate as LearningSession;
  }
  return null;
}

export function savedSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionKey);
  return raw ? (JSON.parse(raw) as LearningSession) : null;
}

export function clearSession() {
  if (typeof window !== "undefined") window.localStorage.removeItem(sessionKey);
}

export async function signUp(learningId: string, password: string) {
  const response = await request("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email: learningEmail(learningId), password, data: { learning_id: learningId.trim() } }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg ?? data.error_description ?? "\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");

  const session = sessionFrom(data);
  if (session) {
    window.localStorage.setItem(sessionKey, JSON.stringify(session));
    await ensureProfile(session, learningId);
  }
  return session;
}

export async function signIn(learningId: string, password: string) {
  const response = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: learningEmail(learningId), password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg ?? data.error_description ?? "\uD559\uC2B5 ID \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");

  const session = sessionFrom(data);
  if (!session) throw new Error("\uB85C\uADF8\uC778 \uC815\uBCF4\uB97C \uBC1B\uC9C0 \uBABB\uD588\uC5B4\uC694. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.");
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}

async function ensureProfile(session: LearningSession, learningId: string) {
  await request("/rest/v1/learning_profiles?on_conflict=user_id", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ user_id: session.user.id, learning_id: learningId.trim() }),
  });
}

export async function recordQuizAttempt(conceptTitle: string, quizNumber: number, isCorrect: boolean, selectedOption: string) {
  const session = savedSession();
  if (!session) return;
  await request("/rest/v1/learning_records", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ user_id: session.user.id, concept_title: conceptTitle, quiz_number: quizNumber, is_correct: isCorrect, selected_option: selectedOption }),
  });
}
