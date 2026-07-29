const supabaseUrl = "https://bchmoqgkespahyjkzkxb.supabase.co";
const publishableKey = "sb_publishable_Fg-P-6yk0XChZZ3qkWV8mg_IEc1gBKx";
const sessionKey = "yeokjuhang-supabase-session";

export type LearningSession = { access_token: string; user: { id: string; email?: string | null; user_metadata?: { learning_id?: string } } };

function learningEmail(learningId: string) {
  const safeId = learningId.trim().toLowerCase().replace(/[^a-z0-9가-힣_-]/g, "");
  return `${safeId}@yeokjuhang.invalid`;
}

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("apikey", publishableKey);
  headers.set("Content-Type", "application/json");
  return fetch(`${supabaseUrl}${path}`, { ...options, headers });
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
  if (!response.ok) throw new Error(data.msg ?? data.error_description ?? "가입에 실패했어요.");
  if (data.session) {
    window.localStorage.setItem(sessionKey, JSON.stringify(data.session));
    await ensureProfile(data.session, learningId);
  }
  return data.session as LearningSession | null;
}

export async function signIn(learningId: string, password: string) {
  const response = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: learningEmail(learningId), password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg ?? data.error_description ?? "학습 ID 또는 비밀번호를 확인해 주세요.");
  window.localStorage.setItem(sessionKey, JSON.stringify(data));
  return data as LearningSession;
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
