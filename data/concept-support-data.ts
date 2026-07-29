import type { HistoryEntry } from "./history-data";

// 기존 카드의 연결 목록에 등장하지만 독립 카드가 없었던 보충 개념입니다.
export const conceptSupportEntries: HistoryEntry[] = [
  {
    title: "전곡리 유적",
    type: "문화유산",
    era: "구석기 시대",
    years: "약 30만 년 전 무렵",
    summary: "경기도 연천 전곡리에서 발견된 구석기 유적으로, 우리나라 구석기인의 생활과 뗀석기 문화를 보여 주는 중요한 자료예요.",
    connection: "‘구석기 시대–뗀석기–사냥과 채집–전곡리 유적’의 흐름으로 연결해 보세요.",
    related: [
      { label: "구석기 시대", query: "구석기 시대", kind: "시대" },
      { label: "뗀석기", query: "뗀석기", kind: "도구" },
      { label: "주먹도끼", query: "주먹도끼", kind: "유물" },
    ],
    story: [
      { label: "시대·배경", value: "문자가 없던 구석기 시대의 유적이에요." },
      { label: "핵심 내용", value: "전곡리에서 아슐리안형 주먹도끼가 발견되어 구석기인의 도구 사용을 알 수 있어요." },
      { label: "연결", value: "유적에서 나온 유물은 당시 사람들의 생활 모습을 추측하는 근거가 돼요." },
    ],
    prompt: "전곡리 유적에서 발견된 주먹도끼로 구석기 시대의 생활을 어떻게 알 수 있는지 설명해 보세요.",
    keywords: ["전곡리", "전곡리 유적", "연천", "구석기", "주먹도끼", "뗀석기", "아슐리안형"]
  }
];
