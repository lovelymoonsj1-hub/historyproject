"use client";

import { useEffect, useState } from "react";
import { clearSession, savedSession, signIn, signUp, type LearningSession } from "../lib/supabase-learning";

function friendlyErrorMessage(error: unknown, mode: "signin" | "signup") {
  const original = error instanceof Error ? error.message.toLowerCase() : "";
  if (original.includes("invalid login credentials")) {
    return "학습 ID 또는 비밀번호가 맞지 않아요. 다시 확인해 보세요.";
  }
  if (original.includes("user already registered") || original.includes("already registered")) {
    return "이미 사용 중인 학습 ID예요. 로그인하거나 다른 ID를 사용해 보세요.";
  }
  if (original.includes("password") && (original.includes("weak") || original.includes("least"))) {
    return "비밀번호는 6글자 이상으로 만들어 주세요.";
  }
  if (original.includes("email not confirmed")) {
    return "가입 확인이 아직 끝나지 않았어요. 선생님께 알려 주세요.";
  }
  return mode === "signin"
    ? "로그인하는 중 문제가 생겼어요. 잠시 후 다시 해 보세요."
    : "학습 ID를 만드는 중 문제가 생겼어요. 잠시 후 다시 해 보세요.";
}

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
      setMessage("학습 ID는 3글자 이상, 비밀번호는 6글자 이상으로 입력해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const next = mode === "signin" ? await signIn(learningId, password) : await signUp(learningId, password);
      if (!next) {
        try {
          const existing = await signIn(learningId, password);
          setSession(existing);
          setOpen(false);
          setPassword("");
          return;
        } catch {
          setMessage("가입 정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
      } else {
        setSession(next);
        setOpen(false);
        setPassword("");
      }
    } catch (error) {
      setMessage(friendlyErrorMessage(error, mode));
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearSession();
    setSession(null);
    setOpen(false);
  };
  const label = session?.user.user_metadata?.learning_id ?? session?.user.email?.split("@")[0];

  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full border border-[#e0c9a8] bg-white px-3 py-2 text-xs font-black text-[#57958f] hover:bg-[#fff3df]">
      {session ? `${label} · 학습 기록` : "학습 기록 로그인"}
    </button>
    {open && <div className="absolute right-0 top-11 z-50 w-80 rounded-3xl border border-[#e0c9a8] bg-white p-5 shadow-xl">
      {session ? <>
        <p className="text-sm font-black text-[#397e79]">{label}님의 학습 기록을 저장하고 있어요.</p>
        <p className="mt-2 text-xs leading-5 text-stone-600">이름이나 이메일 없이 학습 ID와 나의 기록만 저장합니다.</p>
        <button type="button" onClick={logout} className="mt-4 rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-black text-[#b6534a]">로그아웃</button>
      </> : <>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setMode("signin"); setMessage(""); }} className={`rounded-full px-3 py-1 text-xs font-black ${mode === "signin" ? "bg-[#57958f] text-white" : "bg-[#fff3df] text-stone-600"}`}>로그인</button>
          <button type="button" onClick={() => { setMode("signup"); setMessage(""); }} className={`rounded-full px-3 py-1 text-xs font-black ${mode === "signup" ? "bg-[#57958f] text-white" : "bg-[#fff3df] text-stone-600"}`}>학습 ID 만들기</button>
        </div>
        <p className="mt-3 text-xs leading-5 text-stone-600">실제 이름·이메일 없이 나만의 학습 ID로 기록을 저장해요.</p>
        <label className="mt-3 block text-xs font-bold">학습 ID
          <input value={learningId} onChange={(event) => setLearningId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2 text-sm" placeholder="예: history05" autoComplete="username" />
        </label>
        <label className="mt-3 block text-xs font-bold">비밀번호
          <input value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} className="mt-1 w-full rounded-xl border border-[#e0c9a8] px-3 py-2 text-sm" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        </label>
        {message && <p className="mt-3 rounded-xl bg-[#fff0ed] p-3 text-xs leading-5 text-[#b6534a]">{message}</p>}
        <button type="button" disabled={busy} onClick={submit} className="mt-4 w-full rounded-full bg-[#57958f] px-4 py-2 text-xs font-black text-white disabled:opacity-60">
          {busy ? "확인 중…" : mode === "signin" ? "로그인" : "학습 ID 만들기"}
        </button>
      </>}
    </div>}
  </div>;
}
