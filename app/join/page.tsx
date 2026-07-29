"use client";

import { useState } from "react";
import { signIn } from "../../lib/supabase-learning";

export default function JoinClassPage() {
  const [learningId, setLearningId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setMessage("");
    try {
      await signIn(learningId, password);
      setMessage("학급에 자동 연결되었어요! 이제 퀴즈 기록이 선생님 학급 통계에 반영됩니다.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      setMessage(detail.includes("TEACHER_ACCOUNT_NOT_READY") ? "아직 같은 앞부분의 교사 계정이 만들어지지 않았어요. 선생님께 알려 주세요." : "학습 ID 또는 비밀번호를 다시 확인해 보세요.");
    } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[#fbf3e4] px-5 py-10 text-[#41382e]"><section className="mx-auto max-w-md rounded-[30px] border border-[#e5cfad] bg-white p-7 shadow-sm"><a href="/" className="text-sm font-black text-[#57958f]">← 역주행으로 돌아가기</a><p className="mt-6 text-sm font-bold text-[#d2744d]">학급 자동 연결</p><h1 className="mt-2 text-3xl font-black">우리 학급에 연결하기</h1><p className="mt-3 text-sm leading-6 text-stone-600">교사 ID가 <b>jaun51master</b>라면 학생 ID는 <b>jaun5100</b>처럼 만들어요. 같은 앞부분 <b>jaun51</b>을 읽어 자동으로 같은 학급에 연결합니다.</p><label className="mt-5 block text-sm font-bold">학습 ID<input value={learningId} onChange={(e) => setLearningId(e.target.value)} placeholder="예: jaun5100" className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2" /></label><label className="mt-3 block text-sm font-bold">비밀번호<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2" /></label>{message && <p className={`mt-4 rounded-xl p-3 text-sm leading-6 ${message.includes("자동 연결") ? "bg-[#eaf5ed] text-[#397e79]" : "bg-[#fff0ed] text-[#b6534a]"}`}>{message}</p>}<button disabled={busy} onClick={submit} className="mt-5 w-full rounded-full bg-[#57958f] px-4 py-3 font-black text-white disabled:opacity-60">{busy ? "연결 중…" : "학급에 자동 연결하기"}</button></section></main>;
}
