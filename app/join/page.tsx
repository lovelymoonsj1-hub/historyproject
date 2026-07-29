"use client";

import { useState } from "react";
import { joinClassByCode, signIn } from "../../lib/supabase-learning";

export default function JoinClassPage() {
  const [learningId, setLearningId] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setMessage("");
    try {
      await signIn(learningId, password);
      await joinClassByCode(classCode);
      setMessage("학급에 등록되었어요! 이제 퀴즈 기록이 선생님 학급 통계에 안전하게 반영됩니다.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      setMessage(detail.includes("CLASS_CODE_NOT_FOUND") ? "학급 관리 코드를 찾지 못했어요. 선생님께 코드를 다시 확인해 보세요." : "학습 ID, 비밀번호 또는 학급 관리 코드를 다시 확인해 보세요.");
    } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[#fbf3e4] px-5 py-10 text-[#41382e]"><section className="mx-auto max-w-md rounded-[30px] border border-[#e5cfad] bg-white p-7 shadow-sm"><a href="/" className="text-sm font-black text-[#57958f]">← 역주행으로 돌아가기</a><p className="mt-6 text-sm font-bold text-[#d2744d]">학급 등록</p><h1 className="mt-2 text-3xl font-black">우리 학급에 연결하기</h1><p className="mt-3 text-sm leading-6 text-stone-600">실제 이름이나 이메일 없이 학습 ID와 선생님이 알려 준 학급 관리 코드만 사용해요.</p><label className="mt-5 block text-sm font-bold">학습 ID<input value={learningId} onChange={(e) => setLearningId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2" /></label><label className="mt-3 block text-sm font-bold">비밀번호<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2" /></label><label className="mt-3 block text-sm font-bold">학급 관리 코드<input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="예: 5-2-역주행" className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2" /></label>{message && <p className={`mt-4 rounded-xl p-3 text-sm leading-6 ${message.includes("등록되었") ? "bg-[#eaf5ed] text-[#397e79]" : "bg-[#fff0ed] text-[#b6534a]"}`}>{message}</p>}<button disabled={busy} onClick={submit} className="mt-5 w-full rounded-full bg-[#57958f] px-4 py-3 font-black text-white disabled:opacity-60">{busy ? "연결 중…" : "학급에 등록하기"}</button></section></main>;
}
