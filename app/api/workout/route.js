export async function POST(request) {
  try {
    const { goal, time, equipment } = await request.json();

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
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.error?.message || 'APIエラーが発生しました' }, { status: response.status });
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    const parsed = JSON.parse(content);

    parsed.menu = parsed.menu.map((item) => ({
      ...item,
      video_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.name_en + ' workout tutorial')}`,
    }));

    return Response.json({ result: parsed });
  } catch (error) {
    return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
