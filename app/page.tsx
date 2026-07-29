"use client";

import { useMemo, useState } from "react";
import { historyEntries, type HistoryEntry } from "../data/history-data";
import { lateHistoryEntries } from "../data/late-history-data";
import { additionalSearchEntries } from "../data/additional-search-data";
import { LearningAccount } from "../components/LearningAccount";
import { recordQuizAttempt } from "../lib/supabase-learning";

const allEntries = [...historyEntries, ...lateHistoryEntries, ...additionalSearchEntries];
const searchAliasMap: Record<string, string[]> = {
  "세종": ["세종대왕", "세종 대왕"],
  "이성계": ["태조 이성계"],
  "왕건": ["태조 왕건"],
  "이순신": ["이순신 장군"],
  "광개토 대왕": ["광개토대왕"],
  "6·25 전쟁": ["6.25", "6·25", "한국전쟁", "한국 전쟁"],
  "3·1 운동": ["3.1 운동", "3.1운동", "삼일운동"],
  "대한민국 임시 정부": ["대한민국 임시정부", "임시정부"],
  "일제 강점기": ["일제강점기"],
  "임진왜란": ["임진 왜란"],
  "병자호란": ["병자 호란"],
  "훈민정음": ["한글"],
  "고려청자": ["상감기법", "상감 기법"],
};
const t = {
  app:"\uC5ED\uC8FC\uD589", sub:"\uC5ED\uC0AC\uB97C \uC8FC\uB3C4\uD558\uB294 \uC2DC\uAC04 \uC5EC\uD589", search:"\uAD81\uAE08\uD55C \uC778\uBB3C\u00B7\uC0AC\uAC74\u00B7\uBB38\uD654\uC720\uC0B0\uC744 \uAC80\uC0C9\uD574 \uBCF4\uC138\uC694", result:"\uAC80\uC0C9 \uACB0\uACFC", detail:"\uC5ED\uC0AC \uB9E5\uB77D \uC0C1\uC138 \uD654\uBA74", related:"\uD568\uAED8 \uC5F0\uACB0\uD574 \uBCF4\uC138\uC694", flow:"\uC774\uB7F0 \uD750\uB984\uC73C\uB85C \uC0DD\uAC01\uD574\uC694", beforeAfter:"\uC2DC\uAC04\uC758 \uD750\uB984", noResult:"\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC5B4\uC694.", hint:"\uC608: \uACE0\uB824, 1019, \uC784\uC9C4\uC65C\uB780, \uD6C8\uBBFC\uC815\uC74C", write:"\uD55C\uB450 \uBB38\uC7A5\uC73C\uB85C \uC815\uB9AC\uD574 \uBCF4\uC138\uC694", prompt:"\uC0DD\uAC01 \uD655\uC778", older:"\uC774\uC804 \uD750\uB984", later:"\uB2E4\uC74C \uD750\uB984", home:"\uD0C0\uC784\uB77C\uC778 \uD0D0\uC0C9" };

function normalize(value: string) { return value.toLowerCase().normalize("NFC").replace(/[^0-9a-z\uac00-\ud7a3]/g, ""); }
function searchableText(entry: HistoryEntry) { return [entry.title, entry.type, entry.era, entry.years, entry.summary, entry.connection, ...entry.keywords, ...entry.related.flatMap((item) => [item.label, item.query]), ...(searchAliasMap[entry.title] ?? [])].join(" "); }
const particleEnding = /(?:\uC5D0\uC11C|\uC5D0\uAC8C|\uAE4C\uC9C0|\uBD80\uD130|\uC73C\uB85C|\uC774\uB77C\uBA74|\uB77C\uBA74|\uC740\uB370|\uB294\uB370|\uC740|\uB294|\uC774|\uAC00|\uC744|\uB97C|\uC758|\uC5D0|\uC640|\uACFC|\uB3C4|\uB9CC|\uB85C|\uC694)$/;
function queryTerms(value: string) {
  const full = normalize(value);
  const words = value.toLowerCase().normalize("NFC").match(/[0-9a-z\uac00-\ud7a3]+/g) ?? [];
  const terms = words.flatMap((word) => {
    const normalized = normalize(word);
    const stem = normalized.replace(particleEnding, "");
    return [normalized, stem].filter((term) => term.length >= 2);
  });
  return [...new Set([full, ...terms.filter((term) => term !== full)])];
}
function searchScore(entry: HistoryEntry, value: string) {
  const full = normalize(value);
  const title = normalize(entry.title);
  const text = normalize(searchableText(entry));
  if (title === full) return 10000;
  if (title.includes(full)) return 9000;
  if (text.includes(full)) return 8000;
  const matches = queryTerms(value).filter((term) => text.includes(term));
  if (!matches.length) return -1;
  const titleHits = matches.filter((term) => title.includes(term)).length;
  return titleHits * 100 + matches.reduce((total, term) => total + term.length, 0);
}
function yearOf(entry: HistoryEntry) { const found = entry.years.match(/\d{1,4}/); return found ? Number(found[0]) : 0; }
type QuizQuestion = { question: string; options: string[]; answer: number; explanation: string; optionNotes?: string[] };
function legacyQuizFor(entry: HistoryEntry): QuizQuestion[] {
  const related = entry.related[0]?.label ?? "관련 개념";
  const secondRelated = entry.related[1]?.label ?? "당시의 생활 모습";
  return [
    { question: `${entry.title}을(를) 설명한 내용 중 핵심을 가장 잘 담은 것은 무엇일까요?`, options: [entry.summary, "이름만 비슷할 뿐 역사적 배경은 없는 내용이에요.", "다른 시대의 사건을 오늘날의 일처럼 설명한 내용이에요.", "역사 흐름보다 외우는 순서만 중요한 내용이에요."], answer: 0, explanation: `핵심은 ‘${entry.summary}’이에요. 인물·사건·나라를 배울 때는 무엇을 했는지와 그 의미를 함께 살펴봐요.` },
    { question: `${entry.title}을(를) 역사 흐름 속에서 이해할 때 가장 알맞은 생각은 무엇일까요?`, options: [entry.connection, "앞뒤 시대와 단절되어 있어 다른 내용과 연결할 수 없어요.", "연도는 중요하지 않고 이름만 기억하면 충분해요.", "비슷한 이름의 개념은 모두 같은 뜻이에요."], answer: 0, explanation: `이 개념은 ‘${entry.connection}’처럼 앞뒤 흐름과 연결해서 이해하면 오래 기억할 수 있어요.` },
    { question: `${entry.title}을(를) 더 깊이 탐구할 때 가장 먼저 연결해 볼 내용은 무엇일까요?`, options: [`${entry.title}와 ${related}의 관계`, `${entry.title}와 오늘날의 날씨`, `${entry.title}와 학교 급식`, `${entry.title}와 계절별 놀이`], answer: 0, explanation: `${entry.title}은(는) ${related}와 연결하고, ${secondRelated}까지 함께 살펴보면 배경과 결과를 더 잘 파악할 수 있어요.` },
  ];
}

function quizOptions(correct: string, distractors: string[], seed: number) {
  const values = [correct, ...distractors.filter((item) => item !== correct).slice(0, 3)];
  const offset = Math.abs(seed) % values.length;
  const options = values.map((_, index) => values[(index + offset) % values.length]);
  return { options, answer: options.indexOf(correct) };
}

function optionNotes(entry: HistoryEntry, options: string[], correct: string, kind: "summary" | "connection" | "related") {
  return options.map((option) => {
    if (option === correct) return "";
    const owner = allEntries.find((item) => kind === "summary"
      ? item.summary === option
      : kind === "connection"
        ? item.connection === option
        : option.startsWith(item.title));
    const ownerText = owner
      ? `\u2018${owner.title}\u2019\uC744(\uB97C) \uC124\uBA85\uD558\uB294 \uBCF4\uAE30\uC608\uC694.`
      : "\uB2E4\uB978 \uC5ED\uC0AC \uAC1C\uB150\uC744 \uC124\uBA85\uD558\uB294 \uBCF4\uAE30\uC608\uC694.";
    return `${ownerText} \uC774 \uBB38\uC81C\uC758 \uC8FC\uC81C\uB294 \u2018${entry.title}\u2019\uC774\uBBC0\uB85C, \uC815\uB2F5\uC778 \u2018${correct}\u2019\uACFC\uB294 \uB9DE\uC9C0 \uC54A\uC544\uC694.`;
  });
}

function wrongOptionExplanation(entry: HistoryEntry, option: string, correct: string) {
  const owner = allEntries.find((item) => item.summary === option || item.connection === option || option.startsWith(item.title));
  const ownerText = owner
    ? `\uC120\uD0DD\uD55C \uBCF4\uAE30\uB294 \u2018${owner.title}\u2019\uC744(\uB97C) \uC124\uBA85\uD574\uC694.`
    : "\uC120\uD0DD\uD55C \uBCF4\uAE30\uB294 \uB2E4\uB978 \uC5ED\uC0AC \uAC1C\uB150\uC744 \uC124\uBA85\uD574\uC694.";
  return `${ownerText} \uC774 \uBB38\uC81C\uB294 \u2018${entry.title}\u2019\uC5D0 \uB300\uD55C \uBB38\uC81C\uC774\uBBC0\uB85C, \uC815\uB2F5\uC778 \u2018${correct}\u2019\uACFC\uB294 \uB9DE\uC9C0 \uC54A\uC544\uC694.`;
}

function quizFor(entry: HistoryEntry): QuizQuestion[] {
  const peers = allEntries.filter((item) => item.title !== entry.title && (item.era === entry.era || item.type === entry.type));
  const fallbackPeers = peers.length >= 3 ? peers : allEntries.filter((item) => item.title !== entry.title);
  const seed = entry.title.codePointAt(0) ?? 1;
  const related = entry.related[0]?.label ?? "관련 개념";
  const q1 = quizOptions(entry.summary, fallbackPeers.slice(0, 3).map((item) => item.summary), seed);
  const q2 = quizOptions(entry.connection, fallbackPeers.slice(0, 3).map((item) => item.connection), seed + 1);
  const q3Correct = `${entry.title} ↔ ${related}`;
  const q3 = quizOptions(q3Correct, fallbackPeers.slice(0, 3).map((item) => `${item.title} ↔ ${item.related[0]?.label ?? "관련 개념"}`), seed + 2);
  return [
    { question: `${entry.title}을(를) 설명한 내용 중 핵심을 가장 잘 담은 것은 무엇일까요?`, options: q1.options, answer: q1.answer, explanation: `정답은 ‘${entry.summary}’입니다. 역사 개념은 이름만 외우기보다 무엇을 했고 어떤 의미가 있는지 함께 살펴봐요.` },
    { question: `${entry.title}을(를) 역사 흐름 속에서 이해할 때 가장 알맞은 연결은 무엇일까요?`, options: q2.options, answer: q2.answer, explanation: `‘${entry.connection}’처럼 앞뒤 흐름과 원인·결과를 연결하면 ${entry.title}의 의미를 더 정확하게 이해할 수 있어요.` },
    { question: `${entry.title}을(를) 더 깊이 탐구할 때 가장 알맞은 연결 관계는 무엇일까요?`, options: q3.options, answer: q3.answer, explanation: `${entry.title}은(는) ${related}와 함께 살펴보면 시대적 맥락을 파악하는 데 도움이 됩니다. 관련 개념을 눌러 자세한 내용을 확인해 보세요.` },
  ];
}

function LandingHero({ onStart }: { onStart: () => void }) {
  return <section className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12" aria-label="역주행 시작 화면">
    <div className="overflow-hidden rounded-[34px] border border-[#ead0aa] bg-[#fff9ef] shadow-sm">
      <div className="grid items-center gap-5 p-5 md:grid-cols-[.78fr_1.22fr] md:p-9">
        <div className="relative z-10 px-2 py-5 md:px-5">
          <p className="text-sm font-black tracking-wide text-[#d2744d]">역주행 · 역사를 주도하는 시간 여행</p>
          <h1 className="mt-4 text-5xl font-black leading-[1.12] tracking-tight text-[#41382e] md:text-6xl">역사는<br /><span className="text-[#d2744d]">흐름이다.</span></h1>
          <p className="mt-5 max-w-md text-base leading-7 text-stone-600">인물, 사건, 문화유산을 시간의 흐름으로 연결하며 우리 역사를 탐험해요.</p>
          <button type="button" onClick={onStart} className="mt-7 rounded-full bg-[#57958f] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#397e79]">시간 여행 시작하기 →</button>
          <p className="mt-4 text-xs font-bold text-[#aa6d28]">구석기 시대부터 6·25전쟁까지</p>
        </div>
        <div className="relative overflow-hidden rounded-[26px] bg-[#f7dfbb]"><img src="/images/history-explorers-hero.png" alt="남학생과 여학생이 한국사 지도와 연표를 함께 탐구하는 모습" className="h-full min-h-72 w-full object-cover" /></div>
      </div>
    </div>
  </section>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("\uAD6C\uC11D\uAE30 \uC2DC\uB300");
  const [showWelcome, setShowWelcome] = useState(true);
  const [quizStep, setQuizStep] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "wrong" | null>(null);
  const [learningMode, setLearningMode] = useState<"deep" | "support" | null>(null);
  const selected = allEntries.find((entry) => entry.title === selectedId) ?? allEntries[0];
  const results = useMemo(() => {
    if (!normalize(query)) return [];
    return allEntries
      .map((entry) => ({ entry, score: searchScore(entry, query) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(({ entry }) => entry);
  }, [query]);
  const suggestions = results.slice(0, 5);
  const ordered = useMemo(() => [...allEntries].sort((a,b) => yearOf(a) - yearOf(b)), []);
  const currentIndex = ordered.findIndex((entry) => entry.title === selected.title);
  const nearby = ordered.filter((_, index) => index >= Math.max(0,currentIndex-2) && index <= Math.min(ordered.length-1,currentIndex+2));
  const select = (entry: HistoryEntry) => { setSelectedId(entry.title); setShowWelcome(false); setQuery(""); setQuizStep(0); setQuizChoice(null); setQuizFeedback(null); setLearningMode(null); };
  const follow = (term: string) => { const item = allEntries.find((entry) => entry.title === term) ?? allEntries.find((entry) => entry.keywords.includes(term)); if (item) select(item); else setQuery(term); };
  const quiz = quizFor(selected);
  const currentQuiz = quiz[quizStep];
  if (quizFeedback === "wrong" && quizChoice !== null && currentQuiz) {
    currentQuiz.explanation = wrongOptionExplanation(selected, currentQuiz.options[quizChoice], currentQuiz.options[currentQuiz.answer]);
  }
  const answerQuiz = (choice: number) => { if (quizFeedback) return; const correct = choice === currentQuiz.answer; setQuizChoice(choice); setQuizFeedback(correct ? "correct" : "wrong"); void recordQuizAttempt(selected.title, quizStep + 1, correct, currentQuiz.options[choice]); };
  const nextQuiz = () => { if (quizStep < quiz.length - 1) { setQuizStep((step) => step + 1); setQuizChoice(null); setQuizFeedback(null); } else { setQuizStep(quiz.length); setQuizChoice(null); setQuizFeedback(null); } };
  const retryQuiz = () => { setQuizChoice(null); setQuizFeedback(null); };

  return <main className="min-h-screen bg-[#fbf3e4] text-[#41382e]">
    {query && suggestions.length > 0 && <div className="fixed right-5 top-[4.5rem] z-40 w-[min(47vw,440px)] overflow-hidden rounded-2xl border border-[#e0c9a8] bg-white p-2 shadow-lg md:right-12" role="listbox" aria-label="검색어 자동완성">{suggestions.map((entry)=><button type="button" role="option" key={`suggest-${entry.title}`} onClick={()=>select(entry)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#fff3df]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eaf5ed] text-sm font-black text-[#57958f]">↗</span><span className="min-w-0"><b className="block truncate text-sm">{entry.title}</b><small className="block truncate text-xs text-stone-500">{entry.era} · {entry.type}</small></span></button>)}</div>}
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#ead5b8] bg-[#fff9ef]/95 px-5 py-3 backdrop-blur md:px-12"><div><b className="text-2xl tracking-tight text-[#d2744d]">{t.app}</b><span className="ml-2 text-xs text-stone-500">{t.sub}</span></div><div className="flex items-center gap-2"><label className="relative w-[min(47vw,440px)]"><span className="absolute left-3 top-2 text-lg text-[#57958f]">⌕</span><input className="w-full rounded-full border border-[#e0c9a8] bg-white px-9 py-2 text-sm outline-none focus:border-[#57958f]" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder={t.search} aria-label={t.search}/></label><LearningAccount /></div></header>
    {showWelcome && !query ? <LandingHero onStart={() => setShowWelcome(false)} /> : <section className="mx-auto max-w-6xl px-5 py-9 md:px-10"><p className="text-xs font-bold text-[#d2744d]">{t.home}</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{selected.title}</h1><p className="mt-2 text-stone-500">{selected.era} · {selected.years}</p>
      {query && <section className="mt-5 rounded-3xl border border-[#e6d0b1] bg-white p-5"><h2 className="font-bold">{t.result} <span className="text-[#d2744d]">{results.length}</span></h2>{results.length ? <div className="mt-3 grid gap-2 md:grid-cols-2">{results.map((entry)=><button className="rounded-2xl bg-[#fff5e5] p-4 text-left hover:bg-[#e8f3ed]" key={entry.title} onClick={()=>select(entry)}><small className="text-[#57958f]">{entry.era} · {entry.type}</small><b className="ml-2">{entry.title}</b><p className="mt-2 text-xs text-stone-600">{entry.summary}</p></button>)}</div> : <p className="mt-3 text-sm text-stone-600">{t.noResult} {t.hint}</p>}</section>}
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.45fr_.8fr]">
        <article className="overflow-hidden rounded-[28px] border border-[#e7d0af] bg-[#fffaf1] shadow-sm"><div className="bg-gradient-to-r from-[#f8d7a7] to-[#e3efe6] p-6"><span className="rounded-full bg-[#57958f] px-3 py-1 text-xs font-bold text-white">{selected.type}</span><p className="mt-4 text-lg leading-8">{selected.summary}</p></div><div className="p-6"><h2 className="text-sm font-bold text-[#57958f]">{t.flow}</h2><p className="mt-2 text-lg font-bold leading-7">{selected.connection}</p><div className="mt-6 grid gap-3 md:grid-cols-3">{selected.story.map((item,index)=><div className="rounded-2xl border-t-4 border-[#e9a05d] bg-[#fff4df] p-4" key={item.label}><small className="font-bold text-[#b36b2c]">0{index+1} · {item.label}</small><p className="mt-2 text-sm leading-6 text-stone-700">{item.value}</p></div>)}</div></div></article>
        <aside className="rounded-[28px] border border-[#e7d0af] bg-white p-5"><h2 className="text-lg font-black">{t.related}</h2><div className="mt-3 divide-y divide-[#efe1cc]">{selected.related.map((item)=><button className="flex w-full items-center gap-3 py-4 text-left hover:text-[#57958f]" key={`${item.label}-${item.kind}`} onClick={()=>follow(item.query)}><span className="grid h-8 w-8 place-items-center rounded-full bg-[#f9e6c6] text-xs">↗</span><span><small className="block text-xs text-stone-500">{item.kind}</small><b>{item.label}</b></span></button>)}</div><div className="mt-5 rounded-2xl bg-[#fff0cf] p-4"><small className="font-bold text-[#aa6d28]">{t.prompt}</small><p className="mt-1 text-sm leading-6">{selected.prompt}</p></div></aside>
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="학습 추천 메뉴">
        <button type="button" onClick={() => setLearningMode(learningMode === "deep" ? null : "deep")} className="group rounded-[26px] border border-[#edc77b] bg-[#fff1c9] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-[#e3a33d] px-3 py-1 text-xs font-black text-white">더 알고 싶어요</span><h2 className="mt-3 text-xl font-black">이 개념을 더 깊이 탐험해 볼까요?</h2></div><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl">★</span></div>
          <p className="mt-3 text-sm leading-6 text-stone-700">관련 인물·사건·문화유산을 연결해 보며 {selected.title}이 역사 흐름에서 어떤 의미인지 더 넓게 살펴봐요.</p>
          <span className="mt-3 inline-block text-sm font-bold text-[#a86c20]">{learningMode === "deep" ? "추천 학습을 접어 보기 ↑" : "심화 학습 추천 보기 →"}</span>
        </button>
        <button type="button" onClick={() => setLearningMode(learningMode === "support" ? null : "support")} className="group rounded-[26px] border border-[#b8d6c5] bg-[#eaf5ed] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-[#57958f] px-3 py-1 text-xs font-black text-white">너무 어려워요</span><h2 className="mt-3 text-xl font-black">설명이 아직 어려운가요?</h2></div><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl">?</span></div>
          <p className="mt-3 text-sm leading-6 text-stone-700">핵심 용어를 쉬운 말로 다시 풀고, 시간 순서와 예시를 따라가며 한 단계씩 이해해 봐요.</p>
          <span className="mt-3 inline-block text-sm font-bold text-[#397e79]">{learningMode === "support" ? "보충 학습을 접어 보기 ↑" : "보충 학습 추천 보기 →"}</span>
        </button>
      </section>
      {learningMode && <section className="mt-4 rounded-[26px] border border-[#e2cfaf] bg-white p-6 shadow-sm" aria-live="polite">
        {learningMode === "deep" ? <><p className="text-xs font-black text-[#b36b2c]">심화 학습 길잡이</p><h2 className="mt-1 text-2xl font-black">{selected.title}에서 더 넓게 이어 가기</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{selected.related.slice(0, 3).map((item, index) => <button type="button" key={`${item.query}-deep`} onClick={() => follow(item.query)} className="rounded-2xl bg-[#fff5df] p-4 text-left hover:bg-[#ffedc4]"><small className="font-bold text-[#b36b2c]">깊이 보기 0{index + 1}</small><b className="mt-2 block">{item.label}</b><span className="mt-1 block text-xs text-stone-600">{item.kind}와 연결해 살펴봐요</span></button>)}</div><p className="mt-4 text-sm leading-6 text-stone-600">위 카드를 눌러 연결 개념을 탐색하고, 마지막에는 ‘무엇이 어떻게 이어졌는지’를 한두 문장으로 정리해 보세요.</p></> : <><p className="text-xs font-black text-[#397e79]">보충 학습 길잡이</p><h2 className="mt-1 text-2xl font-black">{selected.title}을(를) 차근차근 이해하기</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-[#edf7ef] p-4"><small className="font-bold text-[#397e79]">01 · 먼저</small><p className="mt-2 text-sm leading-6">{selected.era}와 연도를 먼저 확인해요.</p></div><div className="rounded-2xl bg-[#edf7ef] p-4"><small className="font-bold text-[#397e79]">02 · 다음</small><p className="mt-2 text-sm leading-6">{selected.story[0]?.value}</p></div><div className="rounded-2xl bg-[#edf7ef] p-4"><small className="font-bold text-[#397e79]">03 · 다시</small><p className="mt-2 text-sm leading-6">{selected.connection}</p></div></div><p className="mt-4 text-sm leading-6 text-stone-600">이해한 내용을 아래 입력칸에 직접 써 보면 기억에 더 오래 남아요.</p></>}
      </section>}
      <section className="mt-6 rounded-3xl border border-[#d9e5dc] bg-[#eff7f1] p-6 md:p-7"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-black md:text-2xl">{t.beforeAfter}</h2><p className="mt-1 text-sm text-stone-600">앞뒤 시대와 사건을 비교하며 흐름을 따라가 보세요.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#397e79]">카드를 눌러 이동</span></div><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{nearby.map((entry)=><button key={entry.title} onClick={()=>select(entry)} className={entry.title===selected.title ? "min-h-28 rounded-2xl bg-[#57958f] p-5 text-left text-white shadow-sm" : "min-h-28 rounded-2xl bg-white p-5 text-left shadow-sm hover:bg-[#fff3dd]"}><small className="block text-sm font-bold leading-5 opacity-90">{entry.years}</small><b className="mt-2 block text-lg font-black leading-7">{entry.title}</b><span className="mt-2 block text-sm leading-5 opacity-80">{entry.era}</span></button>)}</div></section>
      <section className="mt-6 rounded-3xl border border-[#ead5b8] bg-white p-5" aria-label="정리 퀴즈"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-black text-[#d2744d]">배운 내용을 확인해요</p><h2 className="mt-1 text-2xl font-black">정리 퀴즈</h2></div><span className="rounded-full bg-[#fff0cf] px-3 py-1 text-xs font-bold text-[#aa6d28]">{quizStep < quiz.length ? `${quizStep + 1} / ${quiz.length} 문제` : "학습 완료"}</span></div>{quizStep < quiz.length ? <><p className="mt-4 text-base font-bold leading-7">{currentQuiz.question}</p><div className="mt-3 grid gap-2">{currentQuiz.options.map((option, index) => { const chosen = quizChoice === index; const correct = currentQuiz.answer === index; const style = quizFeedback && correct ? "border-[#57958f] bg-[#eaf5ed]" : chosen && quizFeedback === "wrong" ? "border-[#d97970] bg-[#fff0ed]" : "border-[#e7d7c0] bg-[#fffaf2] hover:bg-[#fff4df]"; return <button type="button" key={option} onClick={() => answerQuiz(index)} className={`rounded-2xl border-2 p-3 text-left text-sm leading-6 transition ${style}`}><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-white font-black text-[#b36b2c]">{index + 1}</span>{option}</button>; })}</div>{quizFeedback && <div className={`mt-4 rounded-2xl p-4 ${quizFeedback === "correct" ? "bg-[#eaf5ed]" : "bg-[#fff0ed]"}`}><p className={`font-black ${quizFeedback === "correct" ? "text-[#397e79]" : "text-[#b6534a]"}`}>{quizFeedback === "correct" ? "정답이에요!" : "보충 설명을 읽고 다시 골라 보세요."}</p><p className="mt-1 text-sm leading-6">{currentQuiz.explanation}</p>{quizFeedback === "correct" ? <button type="button" onClick={nextQuiz} className="mt-3 rounded-full bg-[#57958f] px-4 py-2 text-xs font-black text-white">{quizStep === quiz.length - 1 ? "퀴즈 끝내기" : "다음 문제로 이동"} →</button> : <button type="button" onClick={retryQuiz} className="mt-3 rounded-full bg-[#b6534a] px-4 py-2 text-xs font-black text-white">설명 확인했어요 · 다시 풀기</button>}</div>}</> : <div className="mt-4 rounded-2xl bg-[#eaf5ed] p-5"><p className="font-black text-[#397e79]">정리 퀴즈를 모두 풀었어요!</p><p className="mt-1 text-sm leading-6">{selected.title}의 핵심 내용과 역사적 연결을 잘 확인했어요. 다른 개념을 검색해 또 도전해 보세요.</p><button type="button" onClick={() => { setQuizStep(0); setQuizChoice(null); setQuizFeedback(null); }} className="mt-3 rounded-full bg-[#57958f] px-4 py-2 text-xs font-black text-white">다시 풀기</button></div>}</section>
    </section>}
  </main>;
}
