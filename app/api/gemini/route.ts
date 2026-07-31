import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API 키가 아직 설정되지 않았어요." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { query?: unknown } | null;
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ error: "검색할 개념을 입력해 주세요." }, { status: 400 });
  if (query.length > 120) return NextResponse.json({ error: "검색어를 120자 이내로 입력해 주세요." }, { status: 400 });

  const prompt = `너는 초등학교 5학년 사회 한국사 학습을 돕는 보충 설명 선생님이야.
학생이 입력한 검색어는 '${query}'야.
다음 형식으로 한국어로 쉽고 정확하게 설명해 줘:
1) 한 줄 뜻
2) 시대와 연도(확실하지 않으면 '정확한 연도 확인 필요'라고 표시)
3) 관련 인물·사건·나라·문화유산 2~4개
4) 역사 흐름 속에서 왜 중요한지
5) 초등학생이 헷갈리기 쉬운 점
교과서에 없는 내용일 수 있으므로 확인이 필요한 부분은 분명히 밝혀 줘. 근거 없는 추측이나 정치적·역사적 단정은 하지 마.`;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } };
    if (!response.ok) return NextResponse.json({ error: data.error?.message ?? "Gemini 설명을 불러오지 못했어요." }, { status: 502 });
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return NextResponse.json({ error: "Gemini가 설명을 만들어 주지 못했어요." }, { status: 502 });
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Gemini 연결 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
