const supabaseUrl = "https://bchmoqgkespahyjkzkxb.supabase.co";
const publishableKey = "sb_publishable_Fg-P-6yk0XChZZ3qkWV8mg_IEc1gBKx";
const sessionKey = "yeokjuhang-supabase-session";

export type LearningSession = {
  access_token: string;
  user: { id: string; email?: string | null; user_metadata?: { learning_id?: string } };
};

function learningEmail(learningId: string) {
  // Supabase email sign-in needs an ASCII email address. Turn every learning ID
  // (including Korean text) into a stable internal-only identifier first.
  const safeId = Array.from(learningId.trim().toLowerCase())
    .map((character) => /[a-z0-9_-]/.test(character)
      ? character
      : `u${character.codePointAt(0)?.toString(16) ?? ""}`)
    .join("")
    .slice(0, 48);
  return `${safeId}@history-explorers.lumiolab-4734.chatgpt.site`;
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
    headers: { Authorization: `Bearer ${session.access_token}`, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify({ user_id: session.user.id, learning_id: learningId.trim() }),
  });
}

export type LearningProfile = { user_id: string; learning_id: string; role: "student" | "teacher" };
export type Classroom = { id: string; class_code: string; teacher_id: string };
export type ClassMembership = { user_id: string; classroom_id: string; learning_id: string; joined_at: string };
export type LearningRecord = { user_id: string; classroom_id: string | null; concept_title: string; quiz_number: number; is_correct: boolean; created_at: string };

async function jsonOrError(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? data.msg ?? data.error_description ?? "REQUEST_FAILED");
  return data;
}

function activeSession() {
  const session = savedSession();
  if (!session) throw new Error("LOGIN_REQUIRED");
  return session;
}

export async function getLearningProfile(session = activeSession()): Promise<LearningProfile | null> {
  const response = await request(`/rest/v1/learning_profiles?user_id=eq.${session.user.id}&select=user_id,learning_id,role`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const data = await jsonOrError(response) as LearningProfile[];
  return data[0] ?? null;
}

export async function joinClassByCode(classCode: string) {
  const session = activeSession();
  const response = await request("/rest/v1/rpc/join_class", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ p_class_code: classCode.trim() }),
  });
  return jsonOrError(response) as Promise<string>;
}

export async function createTeacherClassroom(classCode: string, teacherCode: string) {
  const session = activeSession();
  const response = await request("/rest/v1/rpc/create_teacher_classroom", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ p_class_code: classCode.trim(), p_teacher_code: teacherCode.trim() }),
  });
  return jsonOrError(response) as Promise<string>;
}

export async function teacherClassrooms() {
  const session = activeSession();
  const response = await request(`/rest/v1/classrooms?teacher_id=eq.${session.user.id}&select=id,class_code,teacher_id&order=created_at.desc`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return jsonOrError(response) as Promise<Classroom[]>;
}

export async function classroomMembers(classroomId: string) {
  const session = activeSession();
  const response = await request(`/rest/v1/class_memberships?classroom_id=eq.${classroomId}&select=user_id,classroom_id,learning_id,joined_at&order=joined_at`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return jsonOrError(response) as Promise<ClassMembership[]>;
}

export async function classroomRecords(classroomId: string) {
  const session = activeSession();
  const response = await request(`/rest/v1/learning_records?classroom_id=eq.${classroomId}&select=user_id,classroom_id,concept_title,quiz_number,is_correct,created_at&order=created_at.desc`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return jsonOrError(response) as Promise<LearningRecord[]>;
}

export async function recordQuizAttempt(conceptTitle: string, quizNumber: number, isCorrect: boolean, selectedOption: string) {
  const session = savedSession();
  if (!session) return;
  let classroomId: string | null = null;
  try {
    const response = await request(`/rest/v1/class_memberships?user_id=eq.${session.user.id}&select=classroom_id&limit=1`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const memberships = await jsonOrError(response) as { classroom_id: string }[];
    classroomId = memberships[0]?.classroom_id ?? null;
  } catch { /* A student can use the app before joining a class. */ }
  await request("/rest/v1/learning_records", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ user_id: session.user.id, concept_title: conceptTitle, quiz_number: quizNumber, is_correct: isCorrect, selected_option: selectedOption, ...(classroomId ? { classroom_id: classroomId } : {}) }),
  });
}
