export async function POST(request) {
  try {
    const body = await request.json();
    const { goal, time, equipment } = body;

    if (!goal || !time || !Array.isArray(equipment) || equipment.length === 0) {
      return Response.json({ error: '入力が不足しています' }, { status: 400 });
    }

    const userMessage = `目標：${goal}\nトレーニング時間：${time}\n使える器具：${equipment.join('、')}`;

    const systemPrompt = `あなたは優秀なパーソナルトレーナーです。ユーザーの目標・時間・使える器具に合わせて、
今日トレーニングすべき部位と具体的なメニューを提案してください。
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      let errorMessage = 'APIエラーが発生しました';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // response body wasn't JSON
      }
      console.error('Anthropic API error:', response.status, errorMessage);
      return Response.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

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
