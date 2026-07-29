"use client";

export type CardKind = "person" | "event" | "heritage" | "kingdom";

export type HistoryCardData = {
  id: string;
  kind: CardKind;
  era: string;
  year: string;
  title: string;
  subtitle: string;
  keyPoint: string;
  links: string[];
  motif: string;
};

export const essentialHistoryCards: HistoryCardData[] = [
  { id:"gwanggaeto", kind:"person", era:"\uC0BC\uAD6D \uC2DC\uB300", year:"391~413", title:"\uAD11\uAC1C\uD1A0 \uB300\uC655", subtitle:"\uACE0\uAD6C\uB824\uC758 \uC804\uC131\uAE30\uB97C \uC774\uB048 \uC655", keyPoint:"\uC601\uD1A0\uB97C \uB113\uD600 \uACE0\uAD6C\uB824\uB97C \uAC15\uD55C \uB098\uB77C\uB85C \uBC1C\uC804\uC2DC\uCF1C\uC5B4\uC694.", links:["\uACE0\uAD6C\uB824","\uC7A5\uC218\uC655","\uAD11\uAC1C\uD1A0 \uB300\uC655\uB989\uBE44"], motif:"♜" },
  { id:"ganggamchan", kind:"person", era:"\uACE0\uB824 \uC2DC\uB300", year:"1019", title:"\uAC15\uAC10\uCC2C", subtitle:"\uADC0\uC8FC\uB300\uCCA9\uC758 \uC7A5\uAD70", keyPoint:"\uAC70\uB780\uC758 \uCE68\uC785\uC5D0 \uB9DE\uC11C \uADC0\uC8FC\uB300\uCCA9\uC5D0\uC11C \uC2B9\uB9AC\uD588\uC5B4\uC694.", links:["\uACE0\uB824","\uAC70\uB780","\uADC0\uC8FC\uB300\uCCA9"], motif:"⚔" },
  { id:"yi_sunsin", kind:"person", era:"\uC870\uC120 \uC2DC\uB300", year:"1592~1598", title:"\uC774\uC21C\uC2E0", subtitle:"\uC784\uC9C4\uC65C\uB780\uC758 \uC218\uAD70 \uC7A5\uAD70", keyPoint:"\uC218\uAD70\uC744 \uC774\uB04C\uACE0 \uBC14\uB2E4\uC5D0\uC11C \uC77C\uBCF8\uAD70\uC5D0 \uB9DE\uC130\uC5B4\uC694.", links:["\uC784\uC9C4\uC65C\uB780","\uAC70\uBD81\uC120","\uC758\uBCD1"], motif:"⚓" },
  { id:"imjin", kind:"event", era:"\uC870\uC120 \uC2DC\uB300", year:"1592", title:"\uC784\uC9C4\uC65C\uB780", subtitle:"\uC77C\uBCF8\uC758 \uCE68\uB7B5\uC73C\uB85C \uC2DC\uC791\uB41C \uC804\uC7C1", keyPoint:"\uC774\uC21C\uC2E0\uC758 \uC218\uAD70\uACFC \uC5EC\uB7EC \uC9C0\uC5ED\uC758 \uC758\uBCD1\uC774 \uB9DE\uC130\uC5B4\uC694.", links:["\uC774\uC21C\uC2E0","\uC758\uBCD1","\uBCD1\uC790\uD638\uB780"], motif:"✦" },
  { id:"march", kind:"event", era:"\uC77C\uC81C \uAC15\uC810\uAE30", year:"1919", title:"3\u00B71 \uC6B4\uB3D9", subtitle:"\uB3C5\uB9BD\uC744 \uC120\uC5B8\uD55C \uB9CC\uC138 \uC6B4\uB3D9", keyPoint:"\uC804\uAD6D\uC758 \uC0AC\uB78C\uB4E4\uC774 \uD3C9\uD654\uC801\uC73C\uB85C \uB3C5\uB9BD \uB9CC\uC138\uB97C \uC678\uCCE4\uC5B4\uC694.", links:["\uB300\uD55C\uBBFC\uAD6D \uC784\uC2DC \uC815\uBD80","\uC720\uAD00\uC21C","\uAD11\uBCF5"], motif:"✋" },
  { id:"war625", kind:"event", era:"\uADFC\uD604\uB300", year:"1950. 6. 25.", title:"6\u00B725 \uC804\uC7C1", subtitle:"\uD55C\uBC18\uB3C4\uC5D0 \uD070 \uC0C1\uCC98\uB97C \uB0A8\uAE34 \uC804\uC7C1", keyPoint:"1950\uB144 6\uC6D4 25\uC77C \uBD81\uD55C\uC758 \uB0A8\uCE68\uC73C\uB85C \uC2DC\uC791\uB418\uC5C8\uC5B4\uC694.", links:["\uAD11\uBCF5","\uC815\uC804 \uD611\uC815","\uBD84\uB2E8"], motif:"☮" },
  { id:"tripitaka", kind:"heritage", era:"\uACE0\uB824 \uC2DC\uB300", year:"13\uC138\uAE30", title:"\uD314\uB9CC\uB300\uC7A5\uACBD", subtitle:"\uBAA9\uD310\uC5D0 \uC0C8\uAE34 \uBD88\uAD50 \uACBD\uC804", keyPoint:"\uBABD\uACE8\uC758 \uCE68\uC785\uC5D0\uC11C \uB098\uB77C\uB97C \uC9C0\uD0A4\uAE30\uB97C \uBC14\uB77C\uB294 \uB9C8\uC74C\uC744 \uB2F4\uC558\uC5B4\uC694.", links:["\uBABD\uACE8\uC758 \uCE68\uC785","\uACE0\uB824","\uD574\uC778\uC0AC"], motif:"▤" },
  { id:"celadon", kind:"heritage", era:"\uACE0\uB824 \uC2DC\uB300", year:"\uACE0\uB824 \uC804\uC131\uAE30", title:"\uACE0\uB824\uCCAD\uC790", subtitle:"\uBE44\uCDE8\uC0C9 \uBE5B\uC744 \uB748 \uB3C4\uC790\uAE30", keyPoint:"\uC0C1\uAC10 \uAE30\uBC95\uACFC \uBE44\uCDE8\uC0C9 \uBE5B\uAE5C\uC774 \uD2B9\uC9D5\uC778 \uACE0\uB824\uC758 \uBB38\uD654\uC720\uC0B0\uC774\uC5D0\uC694.", links:["\uC0C1\uAC10 \uAE30\uBC95","\uACE0\uB824","\uAE08\uC18D \uD65C\uC790"], motif:"◉" },
  { id:"hunmin", kind:"heritage", era:"\uC870\uC120 \uC2DC\uB300", year:"1443~1446", title:"\uD6C8\uBBFC\uC815\uC74C", subtitle:"\uBC31\uC131\uC744 \uC704\uD574 \uB9CC\uB4E0 \uBB38\uC790", keyPoint:"\uC138\uC885\uC774 \uBC31\uC131\uC774 \uC26C\uAC8C \uAE00\uC744 \uC775\uD788\uB3C4\uB85D \uB9CC\uB4E0 \uBB38\uC790\uC608\uC694.", links:["\uC138\uC885","\uC9D1\uD604\uC804","\uC870\uC120"], motif:"ㄱ" },
  { id:"gwangbok", kind:"event", era:"\uADFC\uD604\uB300", year:"1945. 8. 15.", title:"\uAD11\uBCF5", subtitle:"\uC77C\uC81C\uC758 \uC2DD\uBBFC \uD1B5\uCE58\uC5D0\uC11C \uBC97\uC5B4\uB09C \uB0A0", keyPoint:"\uC77C\uC81C\uAC00 \uC81C2\uCC28 \uC138\uACC4 \uB300\uC804\uC5D0\uC11C \uD328\uD558\uBA70 \uB9DE\uC774\uD588\uC5B4\uC694.", links:["\uC77C\uC81C \uAC15\uC810\uAE30","\uB3C5\uB9BD \uC6B4\uB3D9","6\u00B725 \uC804\uC7C1"], motif:"☀" },
];

const kindStyle: Record<CardKind, string> = { person:"#E99462", event:"#D86D68", heritage:"#5F9E91", kingdom:"#718FC6" };

export function HistoryCard({ card, onSelect }: { card: HistoryCardData; onSelect?: (card: HistoryCardData) => void }) {
  return <button onClick={() => onSelect?.(card)} className="group relative min-h-80 overflow-hidden rounded-3xl border border-orange-100 bg-[#fffaf1] p-5 text-left shadow-[0_10px_22px_rgba(119,75,42,.11)] transition hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(119,75,42,.18)]">
    <div className="absolute -right-5 -top-7 grid h-28 w-28 place-items-center rounded-full text-6xl opacity-15" style={{ background:kindStyle[card.kind], color:kindStyle[card.kind] }}>{card.motif}</div>
    <div className="relative"><span className="rounded-full px-2 py-1 text-[10px] font-bold text-white" style={{ background:kindStyle[card.kind] }}>{card.era}</span><p className="mt-3 text-xs font-bold text-stone-500">{card.year}</p><h3 className="mt-1 text-3xl font-black tracking-tight text-stone-800">{card.title}</h3><p className="mt-1 text-sm font-semibold text-stone-600">{card.subtitle}</p><p className="mt-4 border-t border-orange-100 pt-4 text-sm leading-6 text-stone-700">{card.keyPoint}</p><div className="mt-4 flex flex-wrap gap-1">{card.links.map((link) => <span key={link} className="rounded-full bg-orange-50 px-2 py-1 text-[10px] text-stone-600">#{link}</span>)}</div></div>
  </button>;
}

export function HistoryCardCompare({ first, second, onSelect }: { first: HistoryCardData; second: HistoryCardData; onSelect?: (card: HistoryCardData) => void }) {
  return <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center"><HistoryCard card={first} onSelect={onSelect} /><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f4dfb8] font-black text-[#a56a24]">VS</div><HistoryCard card={second} onSelect={onSelect} /></div>;
}
