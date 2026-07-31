"use client";

import { useEffect, useMemo, useState } from "react";
import {
  classroomMembers,
  classroomRecords,
  getLearningProfile,
  savedSession,
  signIn,
  signUp,
  syncTeacherClassMembers,
  teacherClassrooms,
  type ClassMembership,
  type Classroom,
  type LearningRecord,
  type LearningSession,
} from "../lib/supabase-learning";

type ConceptStat = { title: string; attempts: number; correct: number; rate: number };

function rate(correct: number, attempts: number) {
  return attempts ? Math.round((correct / attempts) * 100) : 0;
}

export default function TeacherDashboard() {
  const [session, setSession] = useState<LearningSession | null>(null);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState("");
  const [members, setMembers] = useState<ClassMembership[]>([]);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [learningId, setLearningId] = useState("");
  const [password, setPassword] = useState("");

  const loadClasses = async () => {
    try { await syncTeacherClassMembers(); } catch { /* The dashboard still works before a sync is available. */ }
    const nextClasses = await teacherClassrooms();
    setClasses(nextClasses);
    setClassroomId((current) => current || nextClasses[0]?.id || "");
  };

  useEffect(() => {
    const existing = savedSession();
    if (!existing) return;
    setSession(existing);
    void getLearningProfile(existing).then((profile) => {
      if (profile?.role === "teacher") void loadClasses();
      else setMessage("교사용 계정으로 로그인해 주세요.");
    }).catch(() => setMessage("교사용 정보를 불러오지 못했어요. Supabase 설정을 확인해 주세요."));
  }, []);

  useEffect(() => {
    if (!classroomId) { setMembers([]); setRecords([]); return; }
    setLoading(true);
    Promise.all([classroomMembers(classroomId), classroomRecords(classroomId)])
      .then(([nextMembers, nextRecords]) => { setMembers(nextMembers); setRecords(nextRecords); })
      .catch(() => setMessage("학급 데이터를 불러오지 못했어요. 교사용 권한 설정을 확인해 주세요."))
      .finally(() => setLoading(false));
  }, [classroomId]);

  const submit = async () => {
    if (learningId.trim().length < 3 || password.length < 6) {
      setMessage("교사용 ID는 3글자 이상, 비밀번호는 6글자 이상으로 입력해 주세요.");
      return;
    }
    setLoading(true); setMessage("");
    try {
      const next = mode === "signin" ? await signIn(learningId, password) : await signUp(learningId, password);
      if (!next) throw new Error("가입 정보를 확인하지 못했어요.");
      const profile = await getLearningProfile(next);
      if (profile?.role !== "teacher") throw new Error("교사용 계정이 아니에요. ID 생성 규칙을 확인해 주세요.");
      setSession(next);
      await loadClasses();
      setPassword("");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      if (detail.includes("ID_FORMAT_INVALID")) setMessage("교사용 ID는 영문 4~8자리 + 숫자 2자리 + master 형식으로 만들어 주세요. 예: jaun51master");
      else if (detail.includes("CLASS_CODE_IN_USE")) setMessage("같은 앞부분의 교사 계정이 이미 있어요. ID를 확인해 주세요.");
      else setMessage(detail || "교사용 계정을 확인하는 중 문제가 생겼어요.");
    } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const concept = new Map<string, { attempts: number; correct: number }>();
    const student = new Map<string, { attempts: number; correct: number; recentConcept: string | null; recentAt: number }>();
    records.forEach((record) => {
      const c = concept.get(record.concept_title) ?? { attempts: 0, correct: 0 };
      c.attempts += 1; c.correct += record.is_correct ? 1 : 0; concept.set(record.concept_title, c);
      const s = student.get(record.user_id) ?? { attempts: 0, correct: 0, recentConcept: null, recentAt: 0 };
      s.attempts += 1; s.correct += record.is_correct ? 1 : 0; student.set(record.user_id, s);
      const recordTime = Date.parse(record.created_at);
      if (recordTime >= s.recentAt) { s.recentConcept = record.concept_title; s.recentAt = recordTime; }
    });
    const concepts: ConceptStat[] = [...concept.entries()].map(([title, value]) => ({ title, ...value, rate: rate(value.correct, value.attempts) }))
      .sort((a, b) => a.rate - b.rate || b.attempts - a.attempts);
    const students = members.map((member) => {
      const value = student.get(member.user_id) ?? { attempts: 0, correct: 0, recentConcept: null, recentAt: 0 };
      return { ...member, ...value, rate: rate(value.correct, value.attempts) };
    }).sort((a, b) => a.rate - b.rate || b.attempts - a.attempts);
    const distribution = { support: 0, growing: 0, deep: 0, noData: 0 };
    students.forEach((item) => {
      if (!item.attempts) distribution.noData += 1;
      else if (item.rate < 50) distribution.support += 1;
      else if (item.rate < 80) distribution.growing += 1;
      else distribution.deep += 1;
    });
    return { concepts, students, distribution, totalRate: rate(records.filter((record) => record.is_correct).length, records.length) };
  }, [members, records]);

  const activeClass = classes.find((item) => item.id === classroomId);
  const ready = session && classes.length >= 0 && !message.includes("교사용 계정");

  return <main className="min-h-screen bg-[#fbf3e4] px-5 py-8 text-[#41382e] md:px-10">
    <div className="mx-auto max-w-6xl">
      <a href="/" className="text-sm font-black text-[#57958f]">← 역주행 학습 화면으로</a>
      <header className="mt-5 rounded-[30px] bg-[#4f8882] p-7 text-white shadow-sm md:p-9">
        <p className="text-sm font-bold text-[#dff1eb]">교사용 학급 관리</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">학급 학습 흐름 대시보드</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#edf9f4]">실명 없이 학습 ID와 정리 퀴즈 기록만으로, 학급의 공통 어려움과 학생별 학습 상태를 살펴봅니다.</p>
      </header>

      {!ready ? <section className="mx-auto mt-7 max-w-md rounded-[28px] border border-[#e4cfad] bg-white p-6 shadow-sm">
        <div className="flex gap-2"><button onClick={() => { setMode("signin"); setMessage(""); }} className={`rounded-full px-4 py-2 text-sm font-black ${mode === "signin" ? "bg-[#57958f] text-white" : "bg-[#fff2dc]"}`}>교사 로그인</button><button onClick={() => { setMode("signup"); setMessage(""); }} className={`rounded-full px-4 py-2 text-sm font-black ${mode === "signup" ? "bg-[#57958f] text-white" : "bg-[#fff2dc]"}`}>교사 계정 만들기</button></div>
        <p className="mt-4 text-sm leading-6 text-stone-600">교사 계정은 학급 데이터를 관리하기 위한 전용 계정입니다.</p>
        <label className="mt-4 block text-sm font-bold">교사용 ID<input value={learningId} onChange={(e) => setLearningId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2" /></label>
        <label className="mt-3 block text-sm font-bold">비밀번호<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2" /></label>
        {mode === "signup" && <div className="mt-3 rounded-2xl bg-[#fff2dc] p-4 text-sm leading-6 text-stone-700"><b className="block text-[#9b681f]">교사 ID 생성 규칙</b>영문 4~8자리 + 숫자 2자리 + <b>master</b>를 입력해 주세요.<br />예: <b>jaun51master</b><br /><span className="text-xs">앞부분 <b>jaun51</b>이 이 학급의 자동 연결 코드가 됩니다.</span></div>}
        {message && <p className="mt-4 rounded-xl bg-[#fff0ed] p-3 text-sm text-[#b6534a]">{message}</p>}
        <button disabled={loading} onClick={submit} className="mt-5 w-full rounded-full bg-[#57958f] px-4 py-3 font-black text-white disabled:opacity-60">{loading ? "확인 중…" : mode === "signin" ? "교사 로그인" : "교사 계정과 학급 만들기"}</button>
      </section> : <>
        <section className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"><div><p className="text-xs font-bold text-[#57958f]">선택한 학급</p><b className="text-xl">{activeClass?.class_code ?? "아직 만든 학급이 없어요"}</b></div>{classes.length > 1 && <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} className="rounded-xl border border-[#e0c9a8] bg-white px-3 py-2">{classes.map((item) => <option key={item.id} value={item.id}>{item.class_code}</option>)}</select>}<button onClick={() => { if (classroomId) { setLoading(true); Promise.all([classroomMembers(classroomId), classroomRecords(classroomId)]).then(([m, r]) => { setMembers(m); setRecords(r); }).finally(() => setLoading(false)); } }} className="rounded-full bg-[#fff0cf] px-4 py-2 text-sm font-black text-[#9b681f]">새로고침</button></section>
        {!classes.length ? <p className="mt-6 rounded-2xl bg-white p-6 text-sm">학급이 아직 없어요. 교사 ID의 생성 규칙을 확인해 주세요.</p> : <>
          <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="등록 학생" value={`${members.length}명`} note="학습 ID 기준" tone="bg-[#eaf5ed]" /><Metric label="누적 풀이" value={`${records.length}회`} note="정리 퀴즈 응답" tone="bg-[#fff1cf]" /><Metric label="학급 정답률" value={`${stats.totalRate}%`} note="전체 응답 기준" tone="bg-[#f8e5df]" /><Metric label="보충 우선 개념" value={stats.concepts[0]?.title ?? "데이터 수집 중"} note={stats.concepts[0] ? `정답률 ${stats.concepts[0].rate}%` : "퀴즈를 풀면 표시돼요"} tone="bg-[#e9e5f5]" /></section>
          <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><article className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">학급 공통 취약 개념</h2><p className="mt-1 text-sm text-stone-600">정답률이 낮은 순서입니다. 최소 1회 이상 응답한 개념만 표시합니다.</p><div className="mt-5 space-y-3">{stats.concepts.slice(0, 5).map((item) => <div key={item.title}><div className="flex justify-between gap-3 text-sm"><b>{item.title}</b><span>{item.rate}% · {item.attempts}회</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#f3eadc]"><div className="h-full rounded-full bg-[#d97970]" style={{ width: `${item.rate}%` }} /></div></div>)}{!stats.concepts.length && <p className="rounded-2xl bg-[#fff8ec] p-4 text-sm">아직 수집된 퀴즈 기록이 없어요.</p>}</div></article><article className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">학습 분포</h2><p className="mt-1 text-sm text-stone-600">정답률을 기준으로 보충과 심화 대상을 살펴봐요.</p><div className="mt-5 grid grid-cols-2 gap-3"><Distribution label="보충 필요" value={stats.distribution.support} color="bg-[#f8ddd8] text-[#af5149]" /><Distribution label="기본 다지기" value={stats.distribution.growing} color="bg-[#fff0cf] text-[#9a671f]" /><Distribution label="심화 추천" value={stats.distribution.deep} color="bg-[#dff1eb] text-[#397e79]" /><Distribution label="미응시" value={stats.distribution.noData} color="bg-[#ece8e3] text-stone-600" /></div></article></section>
           <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">학생별 학습 현황</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b text-stone-500"><tr><th className="pb-3">학습 ID</th><th className="pb-3">최근 학습 개념</th><th className="pb-3">풀이 수</th><th className="pb-3">정답률</th><th className="pb-3">추천</th></tr></thead><tbody>{stats.students.map((item) => <tr key={item.user_id} className="border-b border-[#f0e6d7]"><td className="py-3 font-bold">{item.learning_id}</td><td className="py-3">{item.recentConcept ?? "아직 학습 기록 없음"}</td><td className="py-3">{item.attempts}회</td><td className="py-3">{item.attempts ? `${item.rate}%` : "미응시"}</td><td className="py-3">{!item.attempts ? "학습 시작 안내" : item.rate < 50 ? "보충학습 추천" : item.rate < 80 ? "핵심 개념 복습" : "비교·서술형 심화"}</td></tr>)}</tbody></table></div></section>
          <section className="mt-5 rounded-3xl border border-[#b8d6c5] bg-[#eaf5ed] p-6"><p className="text-sm font-black text-[#397e79]">수업 활용 제안</p><h2 className="mt-1 text-xl font-black">다음 수업을 이렇게 준비해 보세요.</h2><p className="mt-2 text-sm leading-6">{stats.concepts[0] ? `학급에서 ‘${stats.concepts[0].title}’의 정답률이 가장 낮아요. 먼저 시간의 흐름과 관련 개념 카드를 활용해 보충학습을 하고, 정답률이 높은 학생에게는 비교·서술형 심화 문제를 제시해 보세요.` : "학생들이 정리 퀴즈를 풀면 학급 공통 어려움과 맞춤 수업 제안이 여기에 나타납니다."}</p></section>
        </>}
      </>}
    </div>
  </main>;
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <div className={`rounded-3xl p-5 ${tone}`}><p className="text-sm font-bold">{label}</p><b className="mt-2 block text-2xl font-black">{value}</b><small className="mt-2 block text-xs">{note}</small></div>;
}

function Distribution({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className={`rounded-2xl p-4 ${color}`}><p className="text-xs font-bold">{label}</p><b className="mt-2 block text-3xl font-black">{value}명</b></div>;
}
