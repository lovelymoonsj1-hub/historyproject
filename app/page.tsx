"use client";

import { useMemo, useState } from "react";
import { historyEntries, type HistoryEntry } from "../data/history-data";
import { lateHistoryEntries } from "../data/late-history-data";

const allEntries = [...historyEntries, ...lateHistoryEntries];
const t = {
  app:"\uC5ED\uC8FC\uD589", sub:"\uC5ED\uC0AC\uB97C \uC8FC\uB3C4\uD558\uB294 \uC2DC\uAC04 \uC5EC\uD589", search:"\uAD81\uAE08\uD55C \uC778\uBB3C\u00B7\uC0AC\uAC74\u00B7\uBB38\uD654\uC720\uC0B0\uC744 \uAC80\uC0C9\uD574 \uBCF4\uC138\uC694", result:"\uAC80\uC0C9 \uACB0\uACFC", detail:"\uC5ED\uC0AC \uB9E5\uB77D \uC0C1\uC138 \uD654\uBA74", related:"\uD568\uAED8 \uC5F0\uACB0\uD574 \uBCF4\uC138\uC694", flow:"\uC774\uB7F0 \uD750\uB984\uC73C\uB85C \uC0DD\uAC01\uD574\uC694", beforeAfter:"\uC2DC\uAC04\uC758 \uD750\uB984", noResult:"\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC5B4\uC694.", hint:"\uC608: \uACE0\uB824, 1019, \uC784\uC9C4\uC65C\uB780, \uD6C8\uBBFC\uC815\uC74C", write:"\uD55C\uB450 \uBB38\uC7A5\uC73C\uB85C \uC815\uB9AC\uD574 \uBCF4\uC138\uC694", prompt:"\uC0DD\uAC01 \uD655\uC778", older:"\uC774\uC804 \uD750\uB984", later:"\uB2E4\uC74C \uD750\uB984", home:"\uD0C0\uC784\uB77C\uC778 \uD0D0\uC0C9" };

function normalize(value: string) { return value.toLowerCase().replace(/[\s·.\-~]/g, ""); }
function yearOf(entry: HistoryEntry) { const found = entry.years.match(/\d{1,4}/); return found ? Number(found[0]) : 0; }

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("\uACE0\uB824");
  const [answer, setAnswer] = useState("");
  const [learningMode, setLearningMode] = useState<"deep" | "support" | null>(null);
  const selected = allEntries.find((entry) => entry.title === selectedId) ?? allEntries[0];
  const results = useMemo(() => {
    const term = normalize(query);
    if (!term) return [];
    return allEntries.filter((entry) => normalize([entry.title, entry.type, entry.era, entry.years, ...entry.keywords].join(" ")).includes(term));
  }, [query]);
  const ordered = useMemo(() => [...allEntries].sort((a,b) => yearOf(a) - yearOf(b)), []);
  const currentIndex = ordered.findIndex((entry) => entry.title === selected.title);
  const nearby = ordered.filter((_, index) => index >= Math.max(0,currentIndex-2) && index <= Math.min(ordered.length-1,currentIndex+2));
  const select = (entry: HistoryEntry) => { setSelectedId(entry.title); setQuery(""); setAnswer(""); setLearningMode(null); };
  const follow = (term: string) => { const item = allEntries.find((entry) => entry.title === term) ?? allEntries.find((entry) => entry.keywords.includes(term)); if (item) select(item); else setQuery(term); };

  return <main className="min-h-screen bg-[#fbf3e4] text-[#41382e]">
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#ead5b8] bg-[#fff9ef]/95 px-5 py-3 backdrop-blur md:px-12"><div><b className="text-2xl tracking-tight text-[#d2744d]">{t.app}</b><span className="ml-2 text-xs text-stone-500">{t.sub}</span></div><label className="relative w-[min(47vw,440px)]"><span className="absolute left-3 top-2 text-lg text-[#57958f]">⌕</span><input className="w-full rounded-full border border-[#e0c9a8] bg-white px-9 py-2 text-sm outline-none focus:border-[#57958f]" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder={t.search} aria-label={t.search}/></label></header>
    <section className="mx-auto max-w-6xl px-5 py-9 md:px-10"><p className="text-xs font-bold text-[#d2744d]">{t.home}</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{selected.title}</h1><p className="mt-2 text-stone-500">{selected.era} · {selected.years}</p>
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
      <section className="mt-6 rounded-3xl border border-[#d9e5dc] bg-[#eff7f1] p-5"><h2 className="font-black">{t.beforeAfter}</h2><div className="mt-4 grid gap-3 md:grid-cols-5">{nearby.map((entry)=><button key={entry.title} onClick={()=>select(entry)} className={entry.title===selected.title ? "rounded-2xl bg-[#57958f] p-4 text-left text-white" : "rounded-2xl bg-white p-4 text-left hover:bg-[#fff3dd]"}><small>{entry.years}</small><b className="mt-1 block">{entry.title}</b><span className="mt-2 block text-xs opacity-80">{entry.era}</span></button>)}</div></section>
      <section className="mt-6 rounded-3xl border border-[#ead5b8] bg-white p-5"><label className="font-black">{t.write}</label><p className="mt-1 text-sm text-stone-600">{selected.prompt}</p><textarea className="mt-3 min-h-24 w-full rounded-2xl border border-[#e3cfb2] p-4 outline-none focus:border-[#57958f]" value={answer} onChange={(event)=>setAnswer(event.target.value)} placeholder={t.write}/></section>
    </section>
  </main>;
}
