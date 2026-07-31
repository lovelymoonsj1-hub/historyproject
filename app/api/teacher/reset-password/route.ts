import { NextResponse } from "next/server";

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey || !authorization?.startsWith("Bearer ")) {
    return json({ error: "교사 비밀번호 관리 설정이 아직 완료되지 않았어요." }, 503);
  }

  const body = await request.json().catch(() => null) as { classroomId?: unknown; studentUserId?: unknown; password?: unknown } | null;
  const classroomId = typeof body?.classroomId === "string" ? body.classroomId : "";
  const studentUserId = typeof body?.studentUserId === "string" ? body.studentUserId : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!classroomId || !studentUserId || password.length < 6) return json({ error: "새 비밀번호는 6글자 이상으로 입력해 주세요." }, 400);

  const teacherHeaders = { apikey: publishableKey, Authorization: authorization };
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: teacherHeaders });
  if (!userResponse.ok) return json({ error: "교사 로그인이 만료되었어요. 다시 로그인해 주세요." }, 401);
  const teacher = await userResponse.json() as { id?: string };
  if (!teacher.id || teacher.id === studentUserId) return json({ error: "학생 계정을 확인하지 못했어요." }, 403);

  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/learning_profiles?user_id=eq.${encodeURIComponent(teacher.id)}&select=role`, { headers: teacherHeaders });
  const profiles = await profileResponse.json() as { role?: string }[];
  if (!profileResponse.ok || profiles[0]?.role !== "teacher") return json({ error: "교사 계정만 학생 비밀번호를 변경할 수 있어요." }, 403);

  const classroomResponse = await fetch(`${supabaseUrl}/rest/v1/classrooms?id=eq.${encodeURIComponent(classroomId)}&teacher_id=eq.${encodeURIComponent(teacher.id)}&select=id`, { headers: teacherHeaders });
  const classrooms = await classroomResponse.json() as { id?: string }[];
  if (!classroomResponse.ok || !classrooms.length) return json({ error: "이 학급의 관리 권한이 없어요." }, 403);
  const memberResponse = await fetch(`${supabaseUrl}/rest/v1/class_memberships?classroom_id=eq.${encodeURIComponent(classroomId)}&user_id=eq.${encodeURIComponent(studentUserId)}&select=user_id`, { headers: teacherHeaders });
  const members = await memberResponse.json() as { user_id?: string }[];
  if (!memberResponse.ok || !members.length) return json({ error: "해당 학생이 이 학급에 등록되어 있지 않아요." }, 403);

  const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(studentUserId)}`, {
    method: "PUT",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!updateResponse.ok) return json({ error: "학생 비밀번호를 변경하지 못했어요. 잠시 후 다시 시도해 주세요." }, 502);
  return json({ ok: true });
}
