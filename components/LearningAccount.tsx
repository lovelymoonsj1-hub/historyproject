"use client";

import { useEffect, useState } from "react";
import { clearSession, savedSession, signIn, signUp, type LearningSession } from "../lib/supabase-learning";

export function LearningAccount() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [learningId, setLearningId] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<LearningSession | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setSession(savedSession()), []);
  const submit = async () => {
    if (learningId.trim().length < 3 || password.length < 6) {
      setMessage("학습 ID는 3글자 이상, 비밀번호는 6글자 이상으로 입력해요.");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const next = mode === "signin" ? await signIn(learningId, password) : await signUp(learningId, password);
      if (!next) {
        try {
          const existing = await signIn(learningId, password);
          setSession(existing); setOpen(false); setPassword("");
          return;
        } catch { /* An unconfirmed earlier account needs to be recreated. */ }
        setMessage("이미 만들었던 학습 ID일 수 있어요. 로그인 탭에서 다시 시도하거나, 이메일 확인 설정 전 만든 ID라면 Supabase의 Authentication → Users에서 삭제한 뒤 새로 만들어 주세요.");
      } else {
        setSession(next); setOpen(false); setPassword("");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "로그인 중 문제가 생겼어요."); }
    finally { setBusy(false); }
  };
  const logout = () => { clearSession(); setSession(null); setOpen(false); };
  const label = session?.user.user_metadata?.learning_id ?? session?.user.email?.split("@")[0];

  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full border border-[#e0c9a8] bg-white px-3 py-2 text-xs font-black text-[#57958f] hover:bg-[#fff3df]">
      {session ? `${label} \u00B7 학습 기록` : "학습 기록 로그인"}
    </button>
    {open && <div className="absolute right-0 top-11 z-50 w-80 rounded-3xl border border-[#e0c9a8] bg-white p-5 shadow-xl">
      {session ? <><p className="text-sm font-black text-[#397e79]">{label}님의 학습 기록을 저장하고 있어요.</p><p className="mt-2 text-xs leading-5 text-stone-600">이름이나 이메일 없이 학습 ID와 퀴즈 기록만 저장합니다.</p><button type="button" onClick={logout} className="mt-4 rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-black text-[#b6534a]">로그아웃</button></> : <>
        <div className="flex gap-2"><button type="button" onClick={() => setMode("signin")} className={`rounded-full px-3 py-1 text-xs font-black ${mode === "signin" ? "bg-[#57958f] text-white" : "bg-[#fff3df] text-stone-600"}`}>로그인</button><button type="button" onClick={() => setMode("signup")} className={`rounded-full px-3 py-1 text-xs font-black ${mode === "signup" ? "bg-[#57958f] text-white" : "bg-[#fff3df] text-stone-600"}`}>학습 ID 만들기</button></div>
        <p className="mt-3 text-xs leading-5 text-stone-600">실제 이름·이메일 없이 나만의 학습 ID로 기록을 저장해요.</p>
        <label className="mt-3 block text-xs font-bold">학습 ID<input value={learningId} onChange={(event) => setLearningId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2 text-sm" placeholder="예: history05" autoComplete="username" /></label>
        <label className="mt-3 block text-xs font-bold">비밀번호<input value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2 text-sm" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
        {message && <p className="mt-3 rounded-xl bg-[#fff0ed] p-3 text-xs leading-5 text-[#b6534a]">{message}</p>}
        <button type="button" disabled={busy} onClick={submit} className="mt-4 w-full rounded-full bg-[#57958f] px-4 py-2 text-xs font-black text-white disabled:opacity-60">{busy ? "확인 중..." : mode === "signin" ? "로그인" : "학습 ID 만들기"}</button>
      </>}
    </div>}
  </div>;
}
