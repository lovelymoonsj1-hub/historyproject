"use client";

import { useMemo, useState } from "react";
import { historyEntries, type HistoryEntry } from "../data/history-data";
import { lateHistoryEntries } from "../data/late-history-data";
import { additionalSearchEntries } from "../data/additional-search-data";
import { curriculumCoreEntries } from "../data/curriculum-core-data";
import { conceptSupportEntries } from "../data/concept-support-data";
import { worksheetNoteFor } from "../data/worksheet-answer-data";
import { LearningAccount } from "../components/LearningAccount";
import { recordQuizAttempt } from "../lib/supabase-learning";

const entryKey = (value: string) => value.toLowerCase().normalize("NFC").replace(/[^0-9a-z\uac00-\ud7a3]/g, "");
const allEntries = [...historyEntries, ...lateHistoryEntries, ...additionalSearchEntries, ...curriculumCoreEntries, ...conceptSupportEntries]
  .filter((entry, index, entries) => entries.findIndex((candidate) => entryKey(candidate.title) === entryKey(entry.title)) === index)
  .map((entry) => {
    const note = worksheetNoteFor(entry);
    return note ? { ...entry, summary: `${entry.summary} ${note.answer}`, keywords: [...entry.keywords, note.answer] } : entry;
  });
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
const eraStartYear: Record<string, number> = {
  "선사 시대": -700000,
  "고대 국가의 시작": -500,
  "여러 나라": -108,
  "삼국 시대": -57,
  "남북국 시대": 676,
  "통일 신라": 676,
  "통일 신라 말": 850,
  "고려 시대": 918,
  "조선 시대": 1392,
  "조선 전기": 1392,
  "조선 중기": 1592,
  "조선 후기": 1636,
  "근대": 1876,
  "일제 강점기": 1910,
  "근현대": 1945,
  "대한민국 정부 수립 이후": 1948,
};

function yearOf(entry: HistoryEntry) {
  const years = entry.years.replace(/\s/g, "");
  const tenThousandYearsAgo = years.match(/(\d+)만년전/);
  if (tenThousandYearsAgo) return -Number(tenThousandYearsAgo[1]) * 10000;

  const bceCentury = years.match(/기원전(?:약)?(\d+)세기/);
  if (bceCentury) return -Number(bceCentury[1]) * 100;
  const bceYear = years.match(/기원전(?:약)?(\d{1,4})년?/);
  if (bceYear) return -Number(bceYear[1]);

  const centuryRange = years.match(/(\d+)(?:~|-)\d+세기/);
  if (centuryRange) return (Number(centuryRange[1]) - 1) * 100;
  const century = years.match(/(\d+)세기/);
  if (century) return (Number(century[1]) - 1) * 100;

  const year = years.match(/\d{1,4}/);
  if (year) return Number(year[0]);

  const eraMatch = Object.entries(eraStartYear).find(([era]) => entry.era.includes(era));
  return eraMatch?.[1] ?? 0;
}
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

type ReferenceVisual = { terms: string[]; src: string; title: string; note: string };

const referenceVisuals: ReferenceVisual[] = [
  { terms: ["\uad6c\uc11d\uae30", "\uc804\uace1\ub9ac", "\uc804\uace1\ub9ac \uc720\uc801", "\ub550\uc11d\uae30", "\uc8fc\uba39\ub3c4\ub07c"], src: "/images/reference/ybm-history-05.jpg", title: "\uad6c\uc11d\uae30 \uc2dc\ub300 \uc0dd\ud65c", note: "\ub5bc\uc5b4 \ub9cc\ub4e0 \ub550\uc11d\uae30\uc640 \uc8fc\uba39\ub3c4\ub07c, \uc774\ub3d9 \uc0dd\ud65c\uc744 \ud568\uaed8 \uc0b4\ud3b4\ubd10\uc694." },
  { terms: ["\uc2e0\uc11d\uae30"], src: "/images/reference/ybm-history-07.jpg", title: "\uc2e0\uc11d\uae30 \uc2dc\ub300 \uc0dd\ud65c", note: "\uac04\uc11d\uae30\uc640 \ud1a0\uae30, \uc815\ucc29 \uc0dd\ud65c\uc744 \uc5f0\uacb0\ud574 \ubd10\uc694." },
  { terms: ["\uccad\ub3d9\uae30", "\uace0\uc778\ub3cc", "\ube44\ud30c\ud615"], src: "/images/reference/ybm-history-09.jpg", title: "\uccad\ub3d9\uae30 \uc2dc\ub300", note: "\ub18d\uc0ac\uc640 \uc0ac\ud68c\uc758 \ubcc0\ud654\ub97c \uadf8\ub9bc \uc18d \ub3c4\uad6c\uc5d0\uc11c \ucc3e\uc544\ubd10\uc694." },
  { terms: ["\uace0\uc870\uc120", "\ub2e8\uad70", "8\uc870\ubc95"], src: "/images/reference/ybm-history-13.jpg", title: "\uace0\uc870\uc120\uc758 \uac74\uad6d", note: "\uccad\ub3d9\uae30 \ubb38\ud654\uc640 \ucd5c\ucd08\uc758 \uad6d\uac00\ub97c \ud568\uaed8 \uc0dd\uac01\ud574 \ubd10\uc694." },
  { terms: ["\ubc31\uc81c", "\ubb34\ub839\uc655\ub989", "\uadfc\ucd08\uace0\uc655", "\uc0ac\ube44"], src: "/images/reference/ybm-history-22.jpg", title: "\ubc31\uc81c\uc758 \uad50\ub958 \ubb38\ud654", note: "\ubb34\ub839\uc655\ub989 \uc720\ubb3c\uc744 \ud1b5\ud574 \uc8fc\ubcc0 \ub098\ub77c\uc640\uc758 \uad50\ub958\ub97c \ubd10\uc694." },
  { terms: ["\uc2e0\ub77c", "\uae08\uad00", "\ucc9c\ub9c8\ucd1d"], src: "/images/reference/ybm-history-23.jpg", title: "\uc2e0\ub77c\uc758 \uc720\ubb3c", note: "\uace0\ubd84\uc5d0\uc11c \ub098\uc628 \uc720\ubb3c\ub85c \uc2e0\ub77c \uc0ac\ub78c\ub4e4\uc758 \uc0dd\ud65c\uc744 \uc0c1\uc0c1\ud574 \ubd10\uc694." },
  { terms: ["\uace0\uad6c\ub824", "\uad11\uac1c\ud1a0", "\uc7a5\uc218\uc655", "\uc744\uc9c0\ubb38\ub355", "\uac00\uc57c"], src: "/images/reference/ybm-history-19.jpg", title: "\uc0bc\uad6d\uacfc \uac00\uc57c", note: "\uace0\uad6c\ub824\u00b7\ubc31\uc81c\u00b7\uc2e0\ub77c\u00b7\uac00\uc57c\uc758 \uc131\uc7a5\uc744 \uc9c0\ub3c4\uc640 \ud568\uaed8 \uc0b4\ud3b4\ubd10\uc694." },
  { terms: ["\ubd88\uad6d\uc0ac", "\uc11d\uad74\uc554", "\uae08\ub3d9\ubbf8\ub975", "\ubd88\uad50", "\uc815\ub9bc\uc0ac", "\ubd84\ud669\uc0ac"], src: "/images/reference/ybm-history-25.jpg", title: "\uc0bc\uad6d\uc758 \ubd88\uad50 \ubb38\ud654", note: "\uc0ac\ucc30\uacfc \ubd88\uc0c1\uc740 \ub098\ub77c\uc758 \ubc1c\uc804\uacfc \ubd88\uad50\uc758 \uc601\ud5a5\uc744 \ubcf4\uc5ec \uc918\uc694." },
  { terms: ["\uc0bc\uad6d \ud1b5\uc77c", "\uae40\uc720\uc2e0", "\uad6c\uad6d"], src: "/images/reference/ybm-history-29.jpg", title: "\uc2e0\ub77c\uc758 \uc0bc\uad6d \ud1b5\uc77c", note: "\uc2e0\ub77c\u00b7\ub2f9 \uc5f0\ud569, \ubc31\uc81c\uc640 \uace0\uad6c\ub824\uc758 \uba78\ub9dd, \ub2f9 \ucd95\ucd9c\uc744 \uc21c\uc11c\ub300\ub85c \ubcf4\uc138\uc694." },
  { terms: ["\ubc1c\ud574", "\ub300\uc870\uc601"], src: "/images/reference/ybm-history-30.jpg", title: "\ubc1c\ud574\uc758 \uac74\uad6d", note: "\uace0\uad6c\ub824\ub97c \uacc4\uc2b9\ud55c \ubc1c\ud574\uc640 \ud1b5\uc77c \uc2e0\ub77c\uac00 \ud568\uaed8 \uc788\ub358 \uc2dc\uae30\uc608\uc694." },
  { terms: ["\ud1b5\uc77c \uc2e0\ub77c", "\uc7a5\ubcf4\uace0", "\ubd84\ud669\uc0ac", "\uc11d\uad74\uc554"], src: "/images/reference/ybm-history-33.jpg", title: "\ud1b5\uc77c \uc2e0\ub77c\uc758 \ubd88\uad50 \uc720\uc801", note: "\ud1b5\uc77c \uc2e0\ub77c\uac00 \ubd88\uad50 \ubb38\ud654\ub97c \ubc1c\uc804\uc2dc\ud0a8 \ubaa8\uc2b5\uc744 \uc0b4\ud3b4\ubd10\uc694." },
  { terms: ["\ud0dc\uc870 \uc655\uac74", "\ud6c4\uc0bc\uad6d", "\uace0\ub824\uc758 \uac74\uad6d"], src: "/images/reference/ybm-history-39.jpg", title: "\uace0\ub824\uc758 \uac74\uad6d", note: "\uc655\uac74\uc774 \ud6c4\uc0bc\uad6d\uc744 \ud1b5\uc77c\ud558\uace0 \uace0\ub824\ub97c \uc138\uc6b4 \uacfc\uc815\uc744 \ubd10\uc694." },
  { terms: ["\uad11\uc885", "\ub178\ube44\uc548\uac80\ubc95", "\uacfc\uac70\uc81c"], src: "/images/reference/ybm-history-40.jpg", title: "\uace0\ub824 \ucd08\uae30 \uc655\uad8c \uac15\ud654", note: "\uad11\uc885\uc758 \ub178\ube44\uc548\uac80\ubc95\uacfc \uacfc\uac70\uc81c\ub97c \uc655\uad8c \uac15\ud654\uc640 \uc5f0\uacb0\ud574 \ubcf4\uc138\uc694." },
  { terms: ["\uc5ec\uc9c4", "\uc724\uad00", "\ubcc4\ubb34\ubc18", "\ub3d9\ubd81 9\uc131"], src: "/images/reference/ybm-history-41.jpg", title: "\uace0\ub824\uc640 \uc8fc\ubcc0 \ub098\ub77c\ub4e4", note: "\uc5ec\uc9c4\u00b7\uac70\ub780\u00b7\uc1a1\u00b7\ubabd\uace8\uacfc \uad00\ub828\ud55c \uace0\ub824\uc758 \ub300\uc751\uacfc \uad50\ub958\ub97c \uc0b4\ud3b4\ubd10\uc694." },
  { terms: ["\uac70\ub780", "\uac15\uac10\ucc2c", "\uadc0\uc8fc\ub300\ucca9"], src: "/images/reference/ybm-history-43.jpg", title: "\uac70\ub780\uc758 \uce68\uc785\uacfc \uadf9\ubcf5", note: "\uace0\ub824\uac00 \uac70\ub780\uc758 \uce68\uc785\uc744 \uadf9\ubcf5\ud55c \uacfc\uc815\uc744 \uc21c\uc11c\ub300\ub85c \uc0b4\ud3b4\ubd10\uc694." },
  { terms: ["\ubabd\uace8\uc758 \uce68\uc785", "\uac15\ud654\ub3c4", "\uc0bc\ubcc4\ucd08"], src: "/images/reference/ybm-history-44.jpg", title: "\ubabd\uace8\uacfc \uace0\ub824", note: "\ubabd\uace8\uc758 \uce68\uc785, \uac15\ud654\ub3c4 \ucc9c\ub3c4, \uc0bc\ubcc4\ucd08\uc758 \ud56d\uc7c1\uc744 \ud558\ub098\uc758 \ud750\ub984\uc73c\ub85c \uc774\ud574\ud574 \ubcf4\uc138\uc694." },
  { terms: ["\ud314\ub9cc\ub300\uc7a5\uacbd", "\ub300\uc7a5\uacbd\ud310", "\ubabd\uace8"], src: "/images/reference/ybm-history-49.jpg", title: "\uace0\ub824\uc758 \ubd88\uad50 \ubb38\ud654", note: "\ubabd\uace8 \uce68\uc785 \uc18d\uc5d0\uc11c \ud314\ub9cc\ub300\uc7a5\uacbd\uc744 \ub9cc\ub4e0 \uc0ac\ub78c\ub4e4\uc758 \ub9c8\uc74c\uc744 \uc0dd\uac01\ud574 \ubd10\uc694." },
  { terms: ["\uccad\uc790", "\uc0c1\uac10", "\uc9c1\uc9c0", "\uae08\uc18d \ud65c\uc790", "\uace0\ub824"], src: "/images/reference/ybm-history-47.jpg", title: "\uace0\ub824\uc758 \ub6f0\uc5b4\ub09c \uacf5\uc608", note: "\ube44\uc0c9\uacfc \uc0c1\uac10 \uae30\ubc95\uc73c\ub85c \uc54c\ub824\uc9c4 \uace0\ub824\uccad\uc790\ub97c \uad00\ucc30\ud574 \ubd10\uc694." },
  { terms: ["\uae08\uc18d \ud65c\uc790", "\uc9c1\uc9c0", "\uc778\uc1c4"], src: "/images/reference/ybm-history-52.jpg", title: "\uace0\ub824\uc758 \uae08\uc18d \ud65c\uc790", note: "\uae08\uc18d \ud65c\uc790\uc640 \ud314\ub9cc\ub300\uc7a5\uacbd\uc758 \uc81c\uc791 \ubc29\ubc95\uc774 \uc5b4\ub5bb\uac8c \ub2e4\ub978\uc9c0 \ube44\uad50\ud574 \ubcf4\uc138\uc694." },
];

const preferredVisualByTitle: Record<string, string> = {
  "\uace0\ub824": "/images/reference/ybm-history-39.jpg",
  "\uc5ec\uc9c4": "/images/reference/ybm-history-41.jpg",
  "\uae08\uc18d \ud65c\uc790": "/images/reference/ybm-history-52.jpg",
  "\ub550\uc11d\uae30": "/images/reference/ybm-history-05.jpg",
  "\uc8fc\uba39\ub3c4\ub07c": "/images/reference/ybm-history-05.jpg",
};

function referenceVisualFor(entry: HistoryEntry) {
  const entryText = `${entry.title} ${entry.era} ${entry.keywords.join(" ")}`;
  const preferredSrc = preferredVisualByTitle[entry.title];
  if (preferredSrc) return referenceVisuals.find((visual) => visual.src === preferredSrc);
  const title = entry.title;
  const keywords = entry.keywords;
  const score = (visual: ReferenceVisual) => visual.terms.reduce((total, term) => {
    if (term.length < 2) return total;
    if (title === term) return total + 10000 + term.length;
    if (title.includes(term)) return total + 1000 + term.length;
    if (keywords.some((keyword) => keyword === term)) return total + 500 + term.length;
    if (keywords.some((keyword) => keyword.includes(term))) return total + 100 + term.length;
    if (entry.era.includes(term)) return total + 1;
    return total;
  }, 0);
  return referenceVisuals.map((visual) => ({ visual, score: score(visual) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score)[0]?.visual;
}

const officialImageSources = [
  { terms: ["\uad11\uac1c\ud1a0", "\uace0\uad6c\ub824"], label: "\uad6d\ub9bd\uc911\uc559\ubc15\ubb3c\uad00 \uad11\uac1c\ud1a0\ub300\uc655\ube44 \ud0c1\ubcf8", url: "https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?pageSize=10&relicRecommendCategory=&relicRecommendId=254462&sc=&schM=view&sv=" },
  { terms: ["\uae08\ub3d9\ubbf8\ub975", "\ubc18\uac00\uc0ac\uc720", "\ubd88\uad50"], label: "\uad6d\uac00\uc720\uc0b0\ud3ec\ud138 \uae08\ub3d9\ubbf8\ub975\ubcf4\uc0b4 \ubc18\uac00\uc0ac\uc720\uc0c1", url: "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1111100830000" },
  { terms: ["\ud0d5\ud3c9\ucc45", "\uc601\uc870", "\uc815\uc870", "\uaddc\uc7a5\uac01", "\uc2e4\ud559"], label: "\uad6d\ub9bd\uc911\uc559\ubc15\ubb3c\uad00 \uaddc\uc7a5\uac01 \uc18c\uc7a5\ud488", url: "https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=2665&schM=view&searchId=search" },
  { terms: ["\uc11d\uad74\uc554", "\ubd88\uad6d\uc0ac"], label: "\uad6d\uac00\uc720\uc0b0\ud3ec\ud138 \uc11d\uad74\uc554\u00b7\ubd88\uad6d\uc0ac", url: "https://heritage.go.kr/heri/html/HtmlPage.do?pageNo=4_2_2_0&pg=%2Funesco%2FHeritage%2FHeritage_01.jsp" },
  { terms: ["6\u00b725", "\ud55c\uad6d\uc804\uc7c1", "\ud734\uc804", "\uc778\ucc9c\uc0c1\ub959"], label: "\uad6d\uac00\uae30\ub85d\uc6d0 6\u00b725\uc804\uc7c1 \uae30\ub85d\uc790\ub8cc", url: "https://theme.archives.go.kr/next/625/viewMain.do" },
  { terms: ["\uace0\ub824\uccad\uc790", "\uc0c1\uac10", "\uc870\uc120\ubc31\uc790", "\ubc31\uc790"], label: "\uad6d\ub9bd\uc911\uc559\ubc15\ubb3c\uad00 \ub3c4\uc790\uacf5\uc608 \uc18c\uc7a5\ud488", url: "https://www.museum.go.kr/MUSEUM/contents/M0201080200.do?relicId=27175&schM=view&showHallId=757" },
];

function officialSourceFor(entry: HistoryEntry) {
  const entryText = `${entry.title} ${entry.era} ${entry.keywords.join(" ")}`;
  return officialImageSources.find((source) => source.terms.some((term) => entryText.includes(term)));
}

// 이미지가 연결되지 않은 개념도 빈칸으로 남지 않도록, 학습자가 확인할 수 있는
// 공공·교육 기관의 개념 자료를 기본 출처로 연결합니다.
const trustedConceptSources = {
  museum: { label: "e뮤지엄(국립중앙박물관) 자료", url: "https://www.emuseum.go.kr/" },
  heritage: { label: "국가유산청 국가유산 디지털 서비스", url: "https://digital.khs.go.kr/" },
  history: { label: "국사편찬위원회 우리역사넷", url: "https://contents.history.go.kr/" },
  encyclopedia: { label: "한국민족문화대백과사전", url: "https://encykorea.aks.ac.kr/" },
  archives: { label: "국가기록원 역사자료", url: "https://www.archives.go.kr/" },
};

function trustedSourceFor(entry: HistoryEntry) {
  const text = `${entry.title} ${entry.era} ${entry.type}`;
  if (text.includes("\uBB38\uD654") || text.includes("\uC720\uC0B0") || text.includes("\uC720\uBB3C") || text.includes("\uC720\uC801")) return { ...trustedConceptSources.museum, url: `https://www.emuseum.go.kr/m/imageSearch?query=${encodeURIComponent(entry.title)}` };
  if (text.includes("\uC77C\uC81C") || text.includes("\uADFC\uB300") || text.includes("\uB300\uD55C\uBBFC\uAD6D") || text.includes("6\u00B725")) return trustedConceptSources.archives;
  if (text.includes("\uC778\uBB3C") || text.includes("\uC655") || text.includes("\uC0AC\uAC74")) return { ...trustedConceptSources.encyclopedia, url: `https://encykorea.aks.ac.kr/Article/Search?query=${encodeURIComponent(entry.title)}` };
  return trustedConceptSources.history;
}

function LandingHero({ onStart }: { onStart: () => void }) {
  return <section className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12" aria-label="역주행 시작 화면">
    <div className="overflow-hidden rounded-[34px] border border-[#ead0aa] bg-[#fff9ef] shadow-sm">
      <div className="grid items-center gap-5 p-5 md:grid-cols-[.78fr_1.22fr] md:p-9">
        <div className="relative z-10 px-2 py-5 md:px-5">
          <p className="text-xl font-black leading-8 tracking-tight text-[#d2744d] md:text-2xl">역주행 · 역사를 주도하는 시간 여행</p>
          <h1 className="mt-4 text-6xl font-black leading-[1.08] tracking-tight text-[#41382e] md:text-7xl">역사는<br /><span className="text-[#d2744d]">흐름이다.</span></h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-stone-600 md:text-xl md:leading-9">인물, 사건, 문화유산을 시간의 흐름으로 연결하며 우리 역사를 탐험해요.</p>
          <button type="button" onClick={onStart} className="mt-7 rounded-full bg-[#57958f] px-7 py-3.5 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#397e79] md:text-lg">시간 여행 시작하기 →</button>
          <p className="mt-5 inline-flex rounded-full bg-[#fff0d6] px-4 py-2 text-base font-black text-[#aa6d28] md:text-lg">구석기 시대부터 6·25전쟁까지</p>
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
  const referenceVisual = referenceVisualFor(selected);
  const officialSource = officialSourceFor(selected) ?? trustedSourceFor(selected);
  const showNortheastNineFortressesMap = selected.title === "\uB3D9\uBD81 9\uC131" || selected.keywords.includes("\uB3D9\uBD81 9\uC131");
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
        <article className="overflow-hidden rounded-[28px] border border-[#e7d0af] bg-[#fffaf1] shadow-sm"><div className="bg-gradient-to-r from-[#f8d7a7] to-[#e3efe6] p-6"><span className="rounded-full bg-[#57958f] px-3 py-1 text-xs font-bold text-white">{selected.type}</span><p className="mt-4 text-lg leading-8">{selected.summary}</p></div>{referenceVisual && <figure className="border-y border-[#ead8bd] bg-[#fff6e8] p-4 sm:p-5"><div className="overflow-hidden rounded-2xl border border-[#e7cfaa] bg-white"><img src={referenceVisual.src} alt={`${referenceVisual.title} 교과서 참고 그림`} className="h-56 w-full object-cover object-top sm:h-72" loading="lazy" /></div><figcaption className="mt-3"><p className="text-sm font-black text-[#b36b2c]">그림으로 살펴보기 · {referenceVisual.title}</p><p className="mt-1 text-sm leading-6 text-stone-600">{referenceVisual.note}</p><p className="mt-2 text-xs text-stone-500">YBM 사회 5-2 교과서 참고 그림</p>{officialSource && <a href={officialSource.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-[#397e79] underline underline-offset-2">공식 자료 출처 보기 · {officialSource.label}</a>}</figcaption></figure>}{!referenceVisual && officialSource && <div className="border-y border-[#ead8bd] bg-[#fff6e8] p-5"><p className="text-sm font-black text-[#b36b2c]">공식 이미지 자료를 함께 살펴보세요</p><p className="mt-1 text-sm leading-6 text-stone-600">이 개념의 원문 이미지와 설명을 기관 자료에서 확인할 수 있어요.</p><a href={officialSource.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-[#57958f] px-4 py-2 text-xs font-black text-white">{officialSource.label} 열기 →</a></div>}<div className="p-6"><h2 className="text-sm font-bold text-[#57958f]">{t.flow}</h2><p className="mt-2 text-lg font-bold leading-7">{selected.connection}</p><div className="mt-6 grid gap-3 md:grid-cols-3">{selected.story.map((item,index)=><div className="rounded-2xl border-t-4 border-[#e9a05d] bg-[#fff4df] p-4" key={item.label}><small className="font-bold text-[#b36b2c]">0{index+1} · {item.label}</small><p className="mt-2 text-sm leading-6 text-stone-700">{item.value}</p></div>)}</div></div></article>
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
      {learningMode && <section className={`${learningMode === "deep" || learningMode === "support" ? "hidden" : ""} mt-4 rounded-[26px] border border-[#e2cfaf] bg-white p-6 shadow-sm`} aria-live="polite">
        {learningMode === "deep" ? <><p className="text-xs font-black text-[#b36b2c]">심화 학습 길잡이</p><h2 className="mt-1 text-2xl font-black">{selected.title}에서 더 넓게 이어 가기</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{selected.related.slice(0, 3).map((item, index) => <button type="button" key={`${item.query}-deep`} onClick={() => follow(item.query)} className="rounded-2xl bg-[#fff5df] p-4 text-left hover:bg-[#ffedc4]"><small className="font-bold text-[#b36b2c]">깊이 보기 0{index + 1}</small><b className="mt-2 block">{item.label}</b><span className="mt-1 block text-xs text-stone-600">{item.kind}와 연결해 살펴봐요</span></button>)}</div><p className="mt-4 text-sm leading-6 text-stone-600">위 카드를 눌러 연결 개념을 탐색하고, 마지막에는 ‘무엇이 어떻게 이어졌는지’를 한두 문장으로 정리해 보세요.</p></> : <><p className="text-xs font-black text-[#397e79]">보충 학습 길잡이</p><h2 className="mt-1 text-2xl font-black">{selected.title}을(를) 차근차근 이해하기</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-[#edf7ef] p-4"><small className="font-bold text-[#397e79]">01 · 먼저</small><p className="mt-2 text-sm leading-6">{selected.era}와 연도를 먼저 확인해요.</p></div><div className="rounded-2xl bg-[#edf7ef] p-4"><small className="font-bold text-[#397e79]">02 · 다음</small><p className="mt-2 text-sm leading-6">{selected.story[0]?.value}</p></div><div className="rounded-2xl bg-[#edf7ef] p-4"><small className="font-bold text-[#397e79]">03 · 다시</small><p className="mt-2 text-sm leading-6">{selected.connection}</p></div></div><p className="mt-4 text-sm leading-6 text-stone-600">이해한 내용을 아래 입력칸에 직접 써 보면 기억에 더 오래 남아요.</p></>}
      </section>}
      {learningMode === "deep" && <section className="mt-4 rounded-[26px] border border-[#e3c27b] bg-[#fffaf1] p-6 shadow-sm" aria-live="polite"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-[#b36b2c]">심화 탐구 활동</p><h2 className="mt-1 text-2xl font-black">{selected.title}을(를) 근거로 설명해 볼까요?</h2></div><span className="rounded-full bg-[#fff0cf] px-3 py-1 text-xs font-bold text-[#a86c20]">탐구형 심화</span></div><p className="mt-3 text-sm leading-6 text-stone-700">메인 화면의 관련 개념을 다시 고르는 대신, 시대의 원인과 결과를 연결하고 근거를 찾아보는 활동이에요.</p><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-[#fff1c9] p-4"><small className="font-black text-[#a86c20]">01 · 시대 좌표</small><p className="mt-2 text-sm leading-6">{selected.title}은(는) {selected.era}의 {selected.years}에 해당해요. 앞뒤 시대 카드에서 변화가 시작된 지점을 찾아보세요.</p><div className="mt-3 flex gap-2">{nearby.slice(0, 2).map((entry) => <button type="button" key={`deep-before-${entry.title}`} onClick={() => select(entry)} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#a86c20]">{entry.title}</button>)}</div></div><div className="rounded-2xl bg-[#fff1c9] p-4"><small className="font-black text-[#a86c20]">02 · 원인과 영향</small><p className="mt-2 text-sm leading-6">{selected.story[0]?.value}</p><p className="mt-2 text-sm leading-6">이 사건·인물이 다음 변화에 어떤 영향을 주었는지 {selected.connection}</p></div><div className="rounded-2xl bg-[#fff1c9] p-4"><small className="font-black text-[#a86c20]">03 · 나의 역사 문장</small><p className="mt-2 text-sm leading-6">다음 문장 틀을 완성해 보세요.</p><p className="mt-2 rounded-xl bg-white p-3 text-sm font-bold leading-6">“{selected.title}은(는) {selected.era}에 등장했고, 그 결과 ________와 연결된다.”</p></div></div><div className="mt-4 rounded-2xl border border-[#e3c27b] bg-white p-4"><p className="text-sm font-black text-[#b36b2c]">탐구 확인 질문</p><p className="mt-1 text-sm leading-6">{selected.prompt}</p><p className="mt-3 text-xs leading-5 text-stone-500">힌트: 시대·장소·관련 인물·결과 중 두 가지 이상을 사용해 설명해 보세요.</p></div></section>}
      {learningMode === "support" && <section className="mt-4 rounded-[26px] border border-[#b8d6c5] bg-[#f7fcf8] p-6 shadow-sm" aria-live="polite"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-[#397e79]">보충 학습 안내</p><h2 className="mt-1 text-2xl font-black">{selected.title}을(를) 쉽게 다시 이해해요</h2></div><span className="rounded-full bg-[#dcefe2] px-3 py-1 text-xs font-bold text-[#397e79]">개념 보충</span></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-white p-4"><small className="font-black text-[#397e79]">01 · 쉬운 뜻</small><p className="mt-2 text-sm leading-6">{selected.summary}</p></div><div className="rounded-2xl bg-white p-4"><small className="font-black text-[#397e79]">02 · 대표 예시</small><p className="mt-2 text-sm leading-6">{selected.story[1]?.value ?? selected.connection}</p><p className="mt-2 text-xs leading-5 text-stone-500">시대: {selected.era} · 연도: {selected.years}</p></div><div className="rounded-2xl bg-white p-4"><small className="font-black text-[#397e79]">03 · 헷갈리지 않기</small><p className="mt-2 text-sm leading-6">{selected.connection}</p><p className="mt-2 text-xs leading-5 text-stone-500">관련 개념: {selected.related.slice(0, 2).map((item) => item.label).join(" · ")}</p></div></div><div className="mt-4 rounded-2xl border border-[#b8d6c5] bg-white p-4"><p className="text-sm font-black text-[#397e79]">확인 예시</p><p className="mt-1 text-sm leading-6">{selected.prompt}</p><p className="mt-3 text-xs leading-5 text-stone-500">이 설명을 읽은 뒤 아래 정리 퀴즈에서 핵심 개념을 다시 확인해 보세요.</p></div></section>}
      <section className="mt-6 rounded-3xl border border-[#d9e5dc] bg-[#eff7f1] p-6 md:p-7"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-black md:text-2xl">{t.beforeAfter}</h2><p className="mt-1 text-sm text-stone-600">앞뒤 시대와 사건을 비교하며 흐름을 따라가 보세요.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#397e79]">카드를 눌러 이동</span></div><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{nearby.map((entry)=><button key={entry.title} onClick={()=>select(entry)} className={entry.title===selected.title ? "min-h-28 rounded-2xl bg-[#57958f] p-5 text-left text-white shadow-sm" : "min-h-28 rounded-2xl bg-white p-5 text-left shadow-sm hover:bg-[#fff3dd]"}><small className="block text-sm font-bold leading-5 opacity-90">{entry.years}</small><b className="mt-2 block text-lg font-black leading-7">{entry.title}</b><span className="mt-2 block text-sm leading-5 opacity-80">{entry.era}</span></button>)}</div></section>
      <section className="mt-6 rounded-3xl border border-[#ead5b8] bg-white p-5" aria-label="정리 퀴즈"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-black text-[#d2744d]">배운 내용을 확인해요</p><h2 className="mt-1 text-2xl font-black">정리 퀴즈</h2></div><span className="rounded-full bg-[#fff0cf] px-3 py-1 text-xs font-bold text-[#aa6d28]">{quizStep < quiz.length ? `${quizStep + 1} / ${quiz.length} 문제` : "학습 완료"}</span></div>{quizStep < quiz.length ? <><p className="mt-4 text-base font-bold leading-7">{currentQuiz.question}</p><div className="mt-3 grid gap-2">{currentQuiz.options.map((option, index) => { const chosen = quizChoice === index; const correct = currentQuiz.answer === index; const style = quizFeedback && correct ? "border-[#57958f] bg-[#eaf5ed]" : chosen && quizFeedback === "wrong" ? "border-[#d97970] bg-[#fff0ed]" : "border-[#e7d7c0] bg-[#fffaf2] hover:bg-[#fff4df]"; return <button type="button" key={option} onClick={() => answerQuiz(index)} className={`rounded-2xl border-2 p-3 text-left text-sm leading-6 transition ${style}`}><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-white font-black text-[#b36b2c]">{index + 1}</span>{option}</button>; })}</div>{quizFeedback && <div className={`mt-4 rounded-2xl p-4 ${quizFeedback === "correct" ? "bg-[#eaf5ed]" : "bg-[#fff0ed]"}`}><p className={`font-black ${quizFeedback === "correct" ? "text-[#397e79]" : "text-[#b6534a]"}`}>{quizFeedback === "correct" ? "정답이에요!" : "보충 설명을 읽고 다시 골라 보세요."}</p><p className="mt-1 text-sm leading-6">{currentQuiz.explanation}</p>{quizFeedback === "correct" ? <button type="button" onClick={nextQuiz} className="mt-3 rounded-full bg-[#57958f] px-4 py-2 text-xs font-black text-white">{quizStep === quiz.length - 1 ? "퀴즈 끝내기" : "다음 문제로 이동"} →</button> : <button type="button" onClick={retryQuiz} className="mt-3 rounded-full bg-[#b6534a] px-4 py-2 text-xs font-black text-white">설명 확인했어요 · 다시 풀기</button>}</div>}</> : <div className="mt-4 rounded-2xl bg-[#eaf5ed] p-5"><p className="font-black text-[#397e79]">정리 퀴즈를 모두 풀었어요!</p><p className="mt-1 text-sm leading-6">{selected.title}의 핵심 내용과 역사적 연결을 잘 확인했어요. 다른 개념을 검색해 또 도전해 보세요.</p><button type="button" onClick={() => { setQuizStep(0); setQuizChoice(null); setQuizFeedback(null); }} className="mt-3 rounded-full bg-[#57958f] px-4 py-2 text-xs font-black text-white">다시 풀기</button></div>}</section>
    </section>}
  </main>;
}
