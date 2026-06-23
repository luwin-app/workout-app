'use client';

import { useState, useEffect } from 'react';

const EQUIPMENT_OPTIONS = ['自重のみ', 'ダンベル', 'バーベル', 'マシン', 'チューブ'];
const TIME_OPTIONS = ['15分', '30分', '45分', '60分以上'];

export default function Home() {
  const [goal, setGoal] = useState('');
  const [time, setTime] = useState('30分');
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pressing, setPressing] = useState(false);

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
      @keyframes bounceSelect {
        0% { transform: scale(1); }
        50% { transform: scale(0.95); }
        100% { transform: scale(1); }
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
      .bounce { animation: bounceSelect 150ms ease; }
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

    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, time, equipment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'エラーが発生しました');
      } else {
        setResult(data.result);
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
  };

  return (
    <div style={{
      maxWidth: 390,
      margin: '0 auto',
      padding: '0 16px 40px',
      fontFamily: "-apple-system, 'Hiragino Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ paddingTop: 60, paddingBottom: 20, borderBottom: '1px solid #E5E5EA' }}>
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
      </div>

      {!result ? (
        <>
          {/* Goal Card */}
          <div style={{ marginTop: 24 }}>
            <p style={{
              fontSize: 13,
              color: '#8E8E93',
              marginBottom: 8,
              fontWeight: 500,
            }}>今日の目標</p>
            <div style={{
              backgroundColor: '#F2F2F7',
              borderRadius: 12,
              padding: 16,
            }}>
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
            <p style={{
              fontSize: 13,
              color: '#8E8E93',
              marginBottom: 8,
              fontWeight: 500,
            }}>トレーニング時間</p>
            <div style={{
              backgroundColor: '#F2F2F7',
              borderRadius: 12,
              padding: 12,
            }}>
              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}>
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
            <p style={{
              fontSize: 13,
              color: '#8E8E93',
              marginBottom: 8,
              fontWeight: 500,
            }}>使える器具</p>
            <div style={{
              backgroundColor: '#F2F2F7',
              borderRadius: 12,
              padding: 12,
            }}>
              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                {EQUIPMENT_OPTIONS.map((item) => {
                  const selected = equipment.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleEquipment(item)}
                      className={selected ? '' : ''}
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

          {/* Loading */}
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

          {/* Error */}
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
            marginTop: 24,
            background: 'linear-gradient(135deg, #007AFF, #5AC8FA)',
            borderRadius: 16,
            padding: 20,
            color: '#FFFFFF',
          }}>
            <p style={{
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.4,
              margin: 0,
            }}>今日は{result.target_muscles}を鍛えよう</p>
            <p style={{
              fontSize: 15,
              opacity: 0.85,
              marginTop: 8,
              lineHeight: 1.5,
            }}>{result.reason}</p>
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
                    <p style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: '#1C1C1E',
                      margin: 0,
                    }}>{item.name}</p>
                    <p style={{
                      fontSize: 13,
                      color: '#8E8E93',
                      margin: '2px 0 10px',
                    }}>{item.name_en}</p>

                    <div style={{
                      display: 'flex',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 13,
                        color: '#1C1C1E',
                      }}>{item.sets}セット</span>
                      <span style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 13,
                        color: '#1C1C1E',
                      }}>{item.reps}</span>
                      <span style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 13,
                        color: '#1C1C1E',
                      }}>休憩 {item.rest}</span>
                    </div>

                    <div style={{
                      borderTop: '1px solid #E5E5EA',
                      marginTop: 12,
                      paddingTop: 10,
                    }}>
                      <p style={{
                        fontSize: 14,
                        color: '#8E8E93',
                        margin: 0,
                        lineHeight: 1.5,
                      }}>{item.point}</p>
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
            <p style={{
              fontSize: 15,
              color: '#1C1C1E',
              margin: 0,
              fontWeight: 500,
            }}>🕐 合計時間：{result.total_time}</p>
            <p style={{
              fontSize: 15,
              color: '#8E8E93',
              margin: '10px 0 0',
              lineHeight: 1.5,
            }}>💬 {result.advice}</p>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              height: 48,
              marginTop: 20,
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
    </div>
  );
}
