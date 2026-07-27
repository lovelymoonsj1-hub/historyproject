"use client";

import { useState } from "react";

const eras = [
  { id: "고조선", year: "기원전 2333", icon: "◈", color: "gold", fact: "우리 역사에서 처음 등장한 국가예요. 단군왕검이 세웠다고 전해져요.", tip: "‘널리 인간을 이롭게 한다’는 홍익인간 정신을 기억해요." },
  { id: "삼국 시대", year: "기원전 57 ~ 668", icon: "✦", color: "coral", fact: "고구려·백제·신라가 서로 경쟁하며 성장한 시대예요.", tip: "세 나라는 각자의 방식으로 문화를 발전시켰어요." },
  { id: "고려", year: "918 ~ 1392", icon: "☾", color: "blue", fact: "왕건이 세운 나라로, 고려청자와 금속 활자가 유명해요.", tip: "‘코리아(Korea)’라는 이름도 고려에서 비롯되었어요." },
  { id: "조선", year: "1392 ~ 1910", icon: "☰", color: "mint", fact: "유교를 바탕으로 한 나라예요. 세종 대왕과 한글이 빛났어요.", tip: "훈민정음은 누구나 쉽게 배우도록 만든 문자예요." },
];

const questions = [
  { q: "우리 역사에서 가장 먼저 등장한 나라는?", a: ["고려", "고조선", "조선"], correct: 1, note: "단군왕검이 세웠다고 전해지는 고조선이 가장 먼저 등장했어요." },
  { q: "금속 활자를 만든 나라로 유명한 곳은?", a: ["고려", "신라", "고조선"], correct: 0, note: "고려는 세계에서 가장 오래된 금속 활자본을 남겼어요." },
];

export default function Home() {
  const [selected, setSelected] = useState(eras[0]);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [started, setStarted] = useState(false);
  const question = questions[step];
  const chooseAnswer = (index: number) => { if (answer !== null) return; setAnswer(index); if (index === question.correct) setPoints(points + 1); };
  const nextQuestion = () => { setAnswer(null); setStep((step + 1) % questions.length); };

  return (
    <main>
      <nav className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">ㅎ</span> 역사탐험단</a>
        <div className="nav-links"><a href="#journey">시대 여행</a><a href="#mission">오늘의 미션</a><a href="#guide">탐험 안내</a></div>
        <a className="nav-cta" href="#mission">탐험 시작 <span>→</span></a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> 5학년 한국사 탐험</div>
          <h1>시간을 건너<br /><em>우리 역사를</em><br />만나러 가요.</h1>
          <p className="hero-desc">이름만 외우는 한국사는 이제 그만.<br />사람과 사건이 이어지는 이야기로<br />역사의 흐름을 밝혀 보세요.</p>
          <a className="primary-btn" href="#journey" onClick={() => setStarted(true)}>탐험 지도 펼치기 <span>↗</span></a>
          <div className="hero-note"><span>↳</span> 오늘의 탐험은 10분이면 충분해요</div>
        </div>
        <div className="hero-art" aria-label="시간의 흐름을 나타내는 일러스트">
          <div className="orbit orbit-1" /><div className="orbit orbit-2" /><div className="orbit orbit-3" />
          <div className="artifact artifact-1">◈</div><div className="artifact artifact-2">✦</div><div className="artifact artifact-3">☾</div>
          <div className="hero-sun">ㅎ</div>
          <div className="year-stamp">BC 2333<br /><small>TO</small><br />NOW</div>
        </div>
      </section>

      <section className="journey section-wrap" id="journey">
        <div className="section-head"><div><span className="eyebrow">01 / 큰 흐름 보기</span><h2>한눈에 보는<br /><em>우리 역사</em></h2></div><p>왼쪽에서 오른쪽으로 갈수록<br />시간이 흘러가요. 카드를 눌러<br />각 시대의 이야기를 확인해 보세요.</p></div>
        <div className="timeline" aria-label="한국사 시대 타임라인">
          <div className="timeline-line" />
          {eras.map((era) => <button key={era.id} className={`era-card ${era.color} ${selected.id === era.id ? "active" : ""}`} onClick={() => setSelected(era)}><span className="era-icon">{era.icon}</span><span className="era-name">{era.id}</span><span className="era-year">{era.year}</span><span className="card-arrow">↗</span></button>)}
        </div>
        <div className={`fact-panel ${selected.color}`}><div className="fact-kicker">{selected.icon} {selected.id} 탐험 노트</div><div><h3>{selected.fact}</h3><p>{selected.tip}</p></div><div className="fact-badge">기억 쏙쏙<br /><strong>TIP</strong></div></div>
      </section>

      <section className="mission-section" id="mission">
        <div className="section-wrap mission-grid">
          <div className="mission-intro"><span className="eyebrow light">02 / 오늘의 미션</span><h2>탐험한 만큼<br /><em>알고 있나요?</em></h2><p>짧은 퀴즈로 오늘 배운 내용을<br />확인해 봐요. 틀려도 괜찮아요.<br />다시 도전하면 되니까요!</p><div className="score-pill">✦ 현재 탐험 점수 <strong>{points * 10}점</strong></div></div>
          <div className="quiz-card"><div className="quiz-top"><span>MISSION {String(step + 1).padStart(2, "0")}</span><span>{step + 1} / {questions.length}</span></div><div className="progress"><span style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div><h3>{question.q}</h3><div className="answers">{question.a.map((item, index) => <button key={item} onClick={() => chooseAnswer(index)} className={answer === index ? (index === question.correct ? "correct" : "wrong") : ""}><span>{String.fromCharCode(65 + index)}</span>{item}{answer === index && <b>{index === question.correct ? "정답!" : "다시 생각해봐요"}</b>}</button>)}</div>{answer !== null && <div className={`answer-note ${answer === question.correct ? "good" : ""}`}>✦ {answer === question.correct ? "참 잘했어요! " : "괜찮아요! "}{question.note}<button onClick={nextQuestion}>다음 문제 <span>→</span></button></div>}</div>
        </div>
      </section>

      <section className="guide section-wrap" id="guide"><div className="guide-label"><span className="eyebrow">03 / 탐험 안내</span><h2>오늘의 작은 발견이<br /><em>내일의 큰 지식이 돼요.</em></h2></div><div className="guide-steps"><div><span>01</span><h3>흐름을 따라가요</h3><p>시대가 어떻게 이어지는지<br />타임라인으로 살펴봐요.</p></div><div><span>02</span><h3>이야기를 발견해요</h3><p>인물과 사건 속에 숨은<br />재미있는 의미를 찾아봐요.</p></div><div><span>03</span><h3>퀴즈로 확인해요</h3><p>배운 내용을 문제로 풀며<br />내 것으로 만들어 봐요.</p></div></div></section>

      <footer><div className="footer-brand"><span className="brand-mark">ㅎ</span> 역사탐험단</div><p>역사의 흐름을 밝히는 즐거운 습관</p><span className="footer-mark">2026 · HISTORY EXPLORERS</span></footer>
    </main>
  );
}
