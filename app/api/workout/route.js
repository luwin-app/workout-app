export async function POST(request) {
  try {
    const body = await request.json();
    const { goal, time, equipment, recentHistory } = body;

    if (!goal || !time || !Array.isArray(equipment) || equipment.length === 0) {
      return Response.json({ error: '入力が不足しています' }, { status: 400 });
    }

    let historyContext = '';
    if (Array.isArray(recentHistory) && recentHistory.length > 0) {
      historyContext = `\nユーザーの直近のトレーニング履歴（鍛えた部位）：${recentHistory.join('、')}`;
    }

    const userMessage = `目標：${goal}\nトレーニング時間：${time}\n使える器具：${equipment.join('、')}${historyContext}`;

    const historyInstruction = recentHistory && recentHistory.length > 0
      ? `ユーザーの直近のトレーニング履歴を考慮し、同じ部位ばかりにならないよう、バランスよく提案してください。前回鍛えた部位は避けて、回復を考慮した提案をしてください。`
      : '';

    const systemPrompt = `あなたは優秀なパーソナルトレーナーです。ユーザーの目標・時間・使える器具に合わせて、
今日トレーニングすべき部位と具体的なメニューを提案してください。
${historyInstruction}
必ず以下のJSON形式で返してください。他の文字は一切含めないでください：
{
  "target_muscles": "今日鍛える部位（例：胸・肩・三頭筋）",
  "reason": "この部位を選んだ理由を1〜2文で",
  "menu": [
    {
      "name": "種目名（日本語）",
      "name_en": "種目名（英語・YouTube検索用）",
      "sets": 3,
      "reps": "12回",
      "rest": "60秒",
      "point": "フォームのポイントを1文で"
    }
  ],
  "total_time": "合計時間の目安",
  "advice": "今日のトレーニング全体へのアドバイスを1〜2文で"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      let errorMessage = 'APIエラーが発生しました';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // response body wasn't JSON
      }
      console.error('Gemini API error:', response.status, errorMessage);
      return Response.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse AI response:', cleanContent);
      return Response.json({ error: 'AIの応答を解析できませんでした。もう一度お試しください。' }, { status: 500 });
    }

    parsed.target_muscles = String(parsed.target_muscles || '');
    parsed.reason = String(parsed.reason || '');
    parsed.total_time = String(parsed.total_time || '');
    parsed.advice = String(parsed.advice || '');

    if (Array.isArray(parsed.menu)) {
      parsed.menu = parsed.menu.map((item) => ({
        name: String(item.name || ''),
        name_en: String(item.name_en || ''),
        sets: Number(item.sets) || 3,
        reps: String(item.reps || ''),
        rest: String(item.rest || ''),
        point: String(item.point || ''),
        video_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(String(item.name_en || '') + ' workout tutorial')}`,
      }));
    } else {
      parsed.menu = [];
    }

    return Response.json({ result: parsed });
  } catch (error) {
    console.error('Workout API error:', error);
    return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
