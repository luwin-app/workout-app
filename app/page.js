'use client';

import { useState } from 'react';

const EQUIPMENT_OPTIONS = ['自重のみ', 'ダンベル', 'バーベル', 'マシン', 'チューブ'];
const TIME_OPTIONS = ['15分', '30分', '45分', '60分以上'];

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0d1b2a',
    color: '#e0e0e0',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '40px 20px',
  },
  container: {
    maxWidth: '680px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#39ff14',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#8899aa',
    marginBottom: '40px',
    fontSize: '0.95rem',
  },
  card: {
    backgroundColor: '#1a2a3a',
    borderRadius: '12px',
    padding: '28px',
    marginBottom: '20px',
    border: '1px solid #243447',
  },
  label: {
    display: 'block',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#39ff14',
    marginBottom: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#0d1b2a',
    border: '1px solid #2e4057',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '1rem',
    boxSizing: 'border-box',
    outline: 'none',
  },
  radioGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #2e4057',
    backgroundColor: '#0d1b2a',
    color: '#c0c0c0',
    fontSize: '0.95rem',
  },
  radioLabelSelected: {
    border: '1px solid #39ff14',
    backgroundColor: '#0d2a0d',
    color: '#39ff14',
  },
  checkboxGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  checkboxLabel: {
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #2e4057',
    backgroundColor: '#0d1b2a',
    color: '#c0c0c0',
    fontSize: '0.95rem',
  },
  checkboxLabelSelected: {
    border: '1px solid #39ff14',
    backgroundColor: '#0d2a0d',
    color: '#39ff14',
  },
  button: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#39ff14',
    color: '#0d1b2a',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loadingText: {
    textAlign: 'center',
    color: '#39ff14',
    fontSize: '1.1rem',
    padding: '20px',
  },
  resultCard: {
    backgroundColor: '#1a2a3a',
    borderRadius: '12px',
    padding: '28px',
    marginTop: '24px',
    border: '1px solid #39ff14',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.8',
    fontSize: '0.97rem',
    color: '#ddeeff',
  },
  resultTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#39ff14',
    marginBottom: '16px',
  },
  errorCard: {
    backgroundColor: '#2a1a1a',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '24px',
    border: '1px solid #ff4444',
    color: '#ff8888',
    fontSize: '0.95rem',
  },
};

export default function Home() {
  const [goal, setGoal] = useState('');
  const [time, setTime] = useState('30分');
  const [equipment, setEquipment] = useState(['自重のみ']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const toggleEquipment = (item) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    if (!goal.trim()) {
      setError('目標を入力してください。');
      return;
    }
    if (equipment.length === 0) {
      setError('器具を1つ以上選択してください。');
      return;
    }

    setLoading(true);
    setResult('');
    setError('');

    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, time, equipment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'エラーが発生しました。');
      } else {
        setResult(data.result);
      }
    } catch {
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>💪 今日のトレーニングを決めよう</h1>
        <p style={styles.subtitle}>目標・時間・器具を入力してAIに最適なメニューを提案してもらおう</p>

        {/* 目標 */}
        <div style={styles.card}>
          <label style={styles.label}>今日の目標は？</label>
          <input
            type="text"
            placeholder="例：上半身を引き締めたい、脚を太くしたい"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* 時間 */}
        <div style={styles.card}>
          <label style={styles.label}>トレーニング時間は？</label>
          <div style={styles.radioGroup}>
            {TIME_OPTIONS.map((option) => (
              <label
                key={option}
                style={{
                  ...styles.radioLabel,
                  ...(time === option ? styles.radioLabelSelected : {}),
                }}
                onClick={() => setTime(option)}
              >
                {time === option ? '● ' : '○ '}{option}
              </label>
            ))}
          </div>
        </div>

        {/* 器具 */}
        <div style={styles.card}>
          <label style={styles.label}>使える器具は？（複数選択可）</label>
          <div style={styles.checkboxGroup}>
            {EQUIPMENT_OPTIONS.map((item) => (
              <div
                key={item}
                style={{
                  ...styles.checkboxLabel,
                  ...(equipment.includes(item) ? styles.checkboxLabelSelected : {}),
                }}
                onClick={() => toggleEquipment(item)}
              >
                {equipment.includes(item) ? '✓ ' : ''}{item}
              </div>
            ))}
          </div>
        </div>

        {/* ボタン */}
        <button
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
          onClick={handleSubmit}
          disabled={loading}
        >
          AIにトレーニングを提案してもらう
        </button>

        {/* ローディング */}
        {loading && (
          <p style={styles.loadingText}>AIが考えています...💭</p>
        )}

        {/* エラー */}
        {error && (
          <div style={styles.errorCard}>⚠️ {error}</div>
        )}

        {/* 結果 */}
        {result && (
          <div style={styles.resultCard}>
            <p style={styles.resultTitle}>🏋️ 今日のトレーニングメニュー</p>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
