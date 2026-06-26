'use client';

import { useState, useEffect } from 'react';

const SITE_URL = 'https://workout-app-zeta-opal.vercel.app/';

const AFFILIATE_PRODUCTS = {
  ダンベル: [
    { name: '可変式ダンベル', desc: '重量を素早く切り替えられ、自宅トレーニングをサポートする一台', url: '#' },
    { name: 'トレーニンググローブ', desc: 'グリップ力を高めて手のひらを保護し、快適なトレーニングをサポート', url: '#' },
  ],
  バーベル: [
    { name: 'トレーニングベルト', desc: '腰への負担を分散し、高重量トレーニングをサポート', url: '#' },
    { name: 'バーベルパッド', desc: 'スクワット・ヒップスラストで肩や腰をやさしく保護', url: '#' },
  ],
  マシン: [
    { name: 'トレーニングベルト', desc: '腰への負担を分散し、マシントレーニングをサポート', url: '#' },
    { name: 'トレーニンググローブ', desc: 'マシンのグリップ部分での滑り止めと手のひら保護をサポート', url: '#' },
  ],
  自重のみ: [
    { name: 'ヨガマット', desc: '関節への衝撃を和らげ、快適な自重トレーニング環境をサポート', url: '#' },
    { name: 'プッシュアップバー', desc: '深い可動域で胸・肩・腕のトレーニング強度アップをサポート', url: '#' },
  ],
  チューブ: [
    { name: 'トレーニングチューブセット', desc: '複数の強度から選べる、全身トレーニングをサポートするセット', url: '#' },
    { name: 'ヨガマット', desc: '床での種目に快適な環境を提供し、トレーニングをサポート', url: '#' },
  ],
};

const COMMON_PRODUCTS = [
  { name: 'ホエイプロテイン', desc: 'トレーニング後の栄養補給をサポート。吸収が早くタンパク質を手軽に補える', url: '#' },
  { name: 'BCAA', desc: '必須アミノ酸を補給し、トレーニング中のパフォーマンス維持をサポート', url: '#' },
];

function getAffiliateProducts(equipment) {
  const specific = [];
  for (const eq of equipment) {
    if (AFFILIATE_PRODUCTS[eq]) specific.push(...AFFILIATE_PRODUCTS[eq]);
  }
  const seen = new Set();
  const unique = specific.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
  const result = unique.slice(0, 2);
  for (const p of COMMON_PRODUCTS) {
    if (result.length >= 3) break;
    if (!result.find((r) => r.name === p.name)) result.push(p);
  }
  return result.slice(0, 3);
}

const EQUIPMENT_OPTIONS = ['自重のみ', 'ダンベル', 'バーベル', 'マシン', 'チューブ'];
const TIME_OPTIONS = ['15分', '30分', '45分', '60分以上'];

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('workout_history') || '[]');
  } catch {
    return [];
  }
}

function saveWorkout(resultData) {
  const history = loadHistory();
  const entry = {
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    target_muscles: resultData.target_muscles,
    menu: (resultData.menu || []).map((m) => m.name),
  };
  history.unshift(entry);
  localStorage.setItem('workout_history', JSON.stringify(history));
  return history;
}

function calcStats(history) {
  const total = history.length;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const thisWeek = history.filter((h) => new Date(h.date + 'T00:00:00') >= monday).length;

  const uniqueDates = [...new Set(history.map((h) => h.date))].sort().reverse();
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let expected = new Date(today);

  for (const date of uniqueDates) {
    const d = new Date(date + 'T00:00:00');
    const diffDays = Math.round((expected - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      streak++;
      expected = new Date(d);
      expected.setDate(expected.getDate() - 1);
    } else if (streak === 0 && diffDays === 1) {
      streak++;
      expected = new Date(d);
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return { total, thisWeek, streak };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${m}月${day}日（${weekDays[d.getDay()]}）`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [goal, setGoal] = useState('');
  const [time, setTime] = useState('30分');
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pressing, setPressing] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, streak: 0 });
  const [shareOpen, setShareOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    const h = loadHistory();
    setHistory(h);
    setStats(calcStats(h));
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      @keyframes buttonPress {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(0.97); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      .menu-card { animation: slideUp 0.4s ease forwards; opacity: 0; }
      .menu-card:nth-child(1) { animation-delay: 0.1s; }
      .menu-card:nth-child(2) { animation-delay: 0.2s; }
      .menu-card:nth-child(3) { animation-delay: 0.3s; }
      .menu-card:nth-child(4) { animation-delay: 0.4s; }
      .menu-card:nth-child(5) { animation-delay: 0.5s; }
      .menu-card:nth-child(6) { animation-delay: 0.6s; }
      .dot1 { animation: pulse 1.2s ease infinite; }
      .dot2 { animation: pulse 1.2s ease infinite 0.4s; }
      .dot3 { animation: pulse 1.2s ease infinite 0.8s; }
      .result-section { animation: slideUp 0.5s ease forwards; opacity: 0; }
      .result-section:nth-child(2) { animation-delay: 0.15s; }
      .result-section:nth-child(3) { animation-delay: 0.3s; }
      .btn-press { animation: buttonPress 200ms ease; }
      .history-card { animation: slideUp 0.3s ease forwards; opacity: 0; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const toggleEquipment = (item) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    if (!goal.trim()) {
      setError('目標を入力してください');
      return;
    }
    if (equipment.length === 0) {
      setError('器具を1つ以上選択してください');
      return;
    }

    setPressing(true);
    setTimeout(() => setPressing(false), 200);

    setLoading(true);
    setResult(null);
    setError('');

    const recentHistory = loadHistory().slice(0, 3).map((h) => h.target_muscles);

    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, time, equipment, recentHistory }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'エラーが発生しました');
      } else {
        setResult(data.result);
        const newHistory = saveWorkout(data.result);
        setHistory(newHistory);
        setStats(calcStats(newHistory));
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setShareOpen(false);
    setCopyDone(false);
  };

  const buildShareText = () =>
    `今日のトレーニングをAIに作ってもらった💪\n今日は【${result?.target_muscles}】を鍛える日！\n#AIワークアウト #筋トレ`;

  const handleShareX = () => {
    const text = encodeURIComponent(buildShareText() + '\n' + SITE_URL);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareLINE = () => {
    const text = encodeURIComponent(buildShareText());
    const url = encodeURIComponent(SITE_URL);
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    const text = buildShareText() + '\n' + SITE_URL;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  return (
    <div style={{
      maxWidth: 390,
      margin: '0 auto',
      fontFamily: "-apple-system, 'Hiragino Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '60px 16px 0',
        borderBottom: '1px solid #E5E5EA',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💪</div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#1C1C1E',
          margin: 0,
          lineHeight: 1.2,
        }}>Workout AI</h1>
        <p style={{
          fontSize: 15,
          color: '#8E8E93',
          margin: '6px 0 0',
          lineHeight: 1.5,
        }}>今日のトレーニングを最適化する</p>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginTop: 20,
        }}>
          {[{ key: 'home', label: 'ホーム' }, { key: 'history', label: '履歴' }].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: 'transparent',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === tab.key ? '#007AFF' : '#8E8E93',
                borderBottom: activeTab === tab.key ? '2px solid #007AFF' : '2px solid transparent',
                fontFamily: 'inherit',
                transition: 'color 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 40px' }}>
        {activeTab === 'home' ? (
          <>
            {/* Stats Bar */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginTop: 20,
            }}>
              {[
                { label: '🔥 連続', value: `${stats.streak}日`, color: '#FF9500' },
                { label: '累計', value: `${stats.total}回`, color: '#007AFF' },
                { label: '今週', value: `${stats.thisWeek}回`, color: '#34C759' },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: 1,
                  backgroundColor: '#F2F2F7',
                  borderRadius: 12,
                  padding: '12px 8px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: '#8E8E93', margin: '2px 0 0', fontWeight: 500 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {!result ? (
              <>
                {/* Goal Card */}
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 13, color: '#8E8E93', marginBottom: 8, fontWeight: 500 }}>今日の目標</p>
                  <div style={{ backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16 }}>
                    <textarea
                      placeholder="例：上半身を引き締めたい"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        fontSize: 17,
                        color: '#1C1C1E',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                      }}
                    />
                  </div>
                </div>

                {/* Time Card */}
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13, color: '#8E8E93', marginBottom: 8, fontWeight: 500 }}>トレーニング時間</p>
                  <div style={{ backgroundColor: '#F2F2F7', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {TIME_OPTIONS.map((option) => (
                        <button
                          key={option}
                          onClick={() => setTime(option)}
                          style={{
                            flex: 1,
                            minWidth: 70,
                            padding: '10px 0',
                            borderRadius: 8,
                            border: 'none',
                            fontSize: 15,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            backgroundColor: time === option ? '#007AFF' : 'transparent',
                            color: time === option ? '#FFFFFF' : '#007AFF',
                            fontFamily: 'inherit',
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Equipment Card */}
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13, color: '#8E8E93', marginBottom: 8, fontWeight: 500 }}>使える器具</p>
                  <div style={{ backgroundColor: '#F2F2F7', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {EQUIPMENT_OPTIONS.map((item) => {
                        const selected = equipment.includes(item);
                        return (
                          <button
                            key={item}
                            onClick={() => toggleEquipment(item)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              border: selected ? 'none' : '1.5px solid #007AFF',
                              fontSize: 15,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              backgroundColor: selected ? '#007AFF' : '#FFFFFF',
                              color: selected ? '#FFFFFF' : '#007AFF',
                              fontFamily: 'inherit',
                            }}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={pressing ? 'btn-press' : ''}
                  style={{
                    width: '100%',
                    height: 54,
                    marginTop: 24,
                    backgroundColor: '#007AFF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 17,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    boxShadow: '0 4px 14px rgba(0,122,255,0.35)',
                    fontFamily: 'inherit',
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {loading ? '' : 'トレーニングを生成　→'}
                </button>

                {loading && (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    color: '#007AFF',
                    fontSize: 15,
                    fontWeight: 500,
                  }}>
                    <span>✦ AIが最適なメニューを生成中</span>
                    <span className="dot1" style={{ marginLeft: 4 }}>.</span>
                    <span className="dot2">.</span>
                    <span className="dot3">.</span>
                  </div>
                )}

                {error && (
                  <div style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    backgroundColor: '#FFF2F2',
                    borderRadius: 12,
                    color: '#FF3B30',
                    fontSize: 15,
                    lineHeight: 1.5,
                  }}>
                    {error}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Target Muscles Card */}
                <div className="result-section" style={{
                  marginTop: 20,
                  background: 'linear-gradient(135deg, #007AFF, #5AC8FA)',
                  borderRadius: 16,
                  padding: 20,
                  color: '#FFFFFF',
                }}>
                  <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>
                    今日は{result.target_muscles}を鍛えよう
                  </p>
                  <p style={{ fontSize: 15, opacity: 0.85, marginTop: 8, lineHeight: 1.5 }}>{result.reason}</p>
                </div>

                {/* Menu Cards */}
                <div style={{ marginTop: 16 }}>
                  {result.menu?.map((item, i) => (
                    <div key={i} className="menu-card" style={{
                      backgroundColor: '#F2F2F7',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      position: 'relative',
                    }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{
                          fontSize: 32,
                          fontWeight: 700,
                          color: '#E5E5EA',
                          lineHeight: 1,
                          minWidth: 28,
                        }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 17, fontWeight: 600, color: '#1C1C1E', margin: 0 }}>{item.name}</p>
                          <p style={{ fontSize: 13, color: '#8E8E93', margin: '2px 0 10px' }}>{item.name_en}</p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ backgroundColor: '#FFFFFF', borderRadius: 6, padding: '4px 8px', fontSize: 13, color: '#1C1C1E' }}>{item.sets}セット</span>
                            <span style={{ backgroundColor: '#FFFFFF', borderRadius: 6, padding: '4px 8px', fontSize: 13, color: '#1C1C1E' }}>{item.reps}</span>
                            <span style={{ backgroundColor: '#FFFFFF', borderRadius: 6, padding: '4px 8px', fontSize: 13, color: '#1C1C1E' }}>休憩 {item.rest}</span>
                          </div>
                          <div style={{ borderTop: '1px solid #E5E5EA', marginTop: 12, paddingTop: 10 }}>
                            <p style={{ fontSize: 14, color: '#8E8E93', margin: 0, lineHeight: 1.5 }}>{item.point}</p>
                          </div>
                          {item.video_url && (
                            <a
                              href={item.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                marginTop: 10,
                                padding: '6px 12px',
                                backgroundColor: '#FF3B30',
                                color: '#FFFFFF',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                textDecoration: 'none',
                              }}
                            >
                              ▶ 動画で確認
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Card */}
                <div className="result-section" style={{
                  backgroundColor: '#F2F2F7',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 4,
                }}>
                  <p style={{ fontSize: 15, color: '#1C1C1E', margin: 0, fontWeight: 500 }}>🕐 合計時間：{result.total_time}</p>
                  <p style={{ fontSize: 15, color: '#8E8E93', margin: '10px 0 0', lineHeight: 1.5 }}>💬 {result.advice}</p>
                </div>

                {/* Affiliate Products */}
                {(() => {
                  const products = getAffiliateProducts(equipment);
                  return (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <p style={{ fontSize: 13, color: '#8E8E93', margin: 0, fontWeight: 500 }}>おすすめアイテム</p>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#8E8E93',
                          border: '1px solid #C7C7CC',
                          borderRadius: 4,
                          padding: '1px 5px',
                          letterSpacing: '0.05em',
                        }}>PR</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {products.map((p, i) => (
                          <div key={i} style={{
                            backgroundColor: '#F2F2F7',
                            borderRadius: 12,
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E', margin: 0 }}>{p.name}</p>
                              <p style={{ fontSize: 13, color: '#8E8E93', margin: '3px 0 0', lineHeight: 1.45 }}>{p.desc}</p>
                            </div>
                            <a
                              href={p.url}
                              style={{
                                flexShrink: 0,
                                padding: '7px 13px',
                                backgroundColor: '#FFFFFF',
                                color: '#007AFF',
                                border: '1.5px solid #007AFF',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              詳細を見る
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Share Section */}
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={() => setShareOpen((v) => !v)}
                    style={{
                      width: '100%',
                      height: 48,
                      backgroundColor: shareOpen ? '#F2F2F7' : '#34C759',
                      color: shareOpen ? '#1C1C1E' : '#FFFFFF',
                      border: 'none',
                      borderRadius: 14,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <span>{shareOpen ? '閉じる' : '📤 結果をシェア'}</span>
                  </button>

                  {shareOpen && (
                    <div style={{
                      marginTop: 10,
                      backgroundColor: '#F2F2F7',
                      borderRadius: 14,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}>
                      <button
                        onClick={handleShareX}
                        style={{
                          width: '100%',
                          height: 46,
                          backgroundColor: '#000000',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        X (Twitter) でシェア
                      </button>

                      <button
                        onClick={handleShareLINE}
                        style={{
                          width: '100%',
                          height: 46,
                          backgroundColor: '#06C755',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.627-.285-.627-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                        LINEでシェア
                      </button>

                      <button
                        onClick={handleCopyLink}
                        style={{
                          width: '100%',
                          height: 46,
                          backgroundColor: copyDone ? '#34C759' : '#FFFFFF',
                          color: copyDone ? '#FFFFFF' : '#1C1C1E',
                          border: copyDone ? 'none' : '1.5px solid #E5E5EA',
                          borderRadius: 10,
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {copyDone ? '✓ コピーしました' : '🔗 リンクをコピー'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  style={{
                    width: '100%',
                    height: 48,
                    marginTop: 12,
                    backgroundColor: '#FFFFFF',
                    color: '#007AFF',
                    border: '1.5px solid #007AFF',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  別のメニューを生成
                </button>
              </>
            )}
          </>
        ) : (
          /* History Tab */
          <div style={{ marginTop: 20 }}>
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 0',
                color: '#8E8E93',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <p style={{ fontSize: 17, margin: 0, fontWeight: 500 }}>まだ記録がありません</p>
                <p style={{ fontSize: 14, margin: '8px 0 0', lineHeight: 1.5 }}>
                  ホームでメニューを生成すると<br />ここに記録が残ります
                </p>
              </div>
            ) : (
              history.map((entry, i) => (
                <div
                  key={entry.id}
                  className="history-card"
                  style={{
                    backgroundColor: '#F2F2F7',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: 13, color: '#8E8E93', margin: 0, fontWeight: 500 }}>
                      {formatDate(entry.date)}
                    </p>
                    <span style={{
                      backgroundColor: '#007AFF',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}>
                      {entry.target_muscles}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {entry.menu.map((name, j) => (
                      <span key={j} style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 13,
                        color: '#1C1C1E',
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
