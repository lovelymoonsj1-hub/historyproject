export type HistoryResource = {
  label: string;
  file: string;
  coverage: string;
  concepts: string[];
};

// 사용자가 제공한 학습 자료의 범위를 기록합니다. 원문 PDF는
// reference-materials/history-comics-2026-07-30에 보관하고, 앱에서는
// 개념 설명을 보강할 때 이 자료명을 함께 표시합니다.
export const historyResources: HistoryResource[] = [
  { label: "한국사 만화자료집 · 선사~백제", file: "01한국사_만화자료집_선사~백제.pdf", coverage: "선사 시대부터 백제까지", concepts: ["선사", "고조선", "고구려", "백제"] },
  { label: "한국사 만화자료집 · 신라", file: "02한국사_만화자료집_신라_v3.pdf", coverage: "신라의 성장과 삼국 통일", concepts: ["신라", "가야", "삼국 통일", "통일 신라"] },
  { label: "한국사 만화자료집 · 가야", file: "03한국사_만화자료집_가야.pdf", coverage: "가야의 성장과 문화", concepts: ["가야", "금동대향로", "철기 문화"] },
  { label: "한국사 만화자료집 · 발해", file: "04한국사_만화자료집_발해.pdf", coverage: "발해와 남북국 시대", concepts: ["발해", "대조영", "문왕", "해동성국"] },
  { label: "한국사 만화자료집 · 후삼국과 고려 건국", file: "05한국사_만화자료집_후삼국고려건국.pdf", coverage: "후삼국 통일과 고려 건국", concepts: ["후삼국", "궁예", "견훤", "왕건", "고려"] },
  { label: "한국사 만화자료집 · 고려", file: "06한국사_만화자료집_고려.pdf", coverage: "고려의 정치·대외 관계·문화", concepts: ["고려", "거란", "여진", "몽골", "팔만대장경", "청자", "금속활자"] },
  { label: "한국사 만화자료집 · 조선~정부 수립", file: "07한국사- 만화자료집 조선-정부수립.pdf", coverage: "조선 건국부터 대한민국 정부 수립까지", concepts: ["조선", "세종", "임진왜란", "병자호란", "흥선대원군", "강화도조약", "3·1운동", "광복", "대한민국 정부 수립"] },
  { label: "우리 역사를 담은 책들", file: "우리 역사를 담은 책들.pdf", coverage: "역사 기록과 문화유산을 담은 책", concepts: ["역사", "유물", "유적", "문화유산", "조선왕조실록", "삼국사기", "삼국유사"] },
];

const normalize = (value: string) => value.toLowerCase().normalize("NFC").replace(/\s/g, "");

export function historyResourceFor(title: string, era = "") {
  const text = normalize(`${title} ${era}`);
  return historyResources.find((resource) => resource.concepts.some((concept) => text.includes(normalize(concept))));
}
