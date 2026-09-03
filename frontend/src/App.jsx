import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://127.0.0.1:8000";

function App() {
  const [stats, setStats] = useState(null);
  const [result, setResult] = useState(null);   // holds the live test result
  const [loading, setLoading] = useState(false); // true while a test is running

  // Fetch stats (extracted so we can call it again after a test)
  const loadStats = () => {
    fetch(`${API}/stats`)
      .then((r) => r.json())
      .then((data) => setStats(data));
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Runs when a visitor clicks a test button
  const testModel = async (flowType) => {
    setLoading(true);
    setResult(null);
    try {
      // 1. Get a real sample flow of the requested type
      const sampleRes = await fetch(`${API}/sample/${flowType}`);
      const sample = await sampleRes.json();

      // 2. Send it to /predict
      const predRes = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: sample.features }),
      });
      const prediction = await predRes.json();

      // 3. Show the result, and refresh the stats (a new detection was saved)
      setResult(prediction);
      loadStats();
    } catch (e) {
      setResult({ error: "Something went wrong. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return <h1 style={{ fontFamily: "sans-serif" }}>Loading NetGuard AI dashboard...</h1>;
  }

  const Card = ({ title, value, color }) => (
    <div style={{
      background: "#1e1e2e", borderRadius: "12px", padding: "1.5rem",
      minWidth: "160px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ color: "#a0a0b0", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ color: "#fff", fontSize: "2rem", fontWeight: "bold" }}>{value}</div>
    </div>
  );

  const chartData = [
    { name: "Attacks", value: stats.attacks },
    { name: "Benign", value: stats.benign },
  ];
  const COLORS = ["#ff5c5c", "#4caf50"];

  return (
    <div style={{
      fontFamily: "sans-serif", background: "#12121c", minHeight: "100vh",
      padding: "2rem", color: "#fff",
    }}>
      <h1 style={{ marginBottom: "0.5rem" }}>🛡️ NetGuard AI Dashboard</h1>
      <p style={{ color: "#a0a0b0", marginBottom: "2rem" }}>
        Network Intrusion Detection — live statistics
      </p>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <Card title="Total Detections" value={stats.total_detections} color="#4f8cff" />
        <Card title="Attacks" value={stats.attacks} color="#ff5c5c" />
        <Card title="Benign" value={stats.benign} color="#4caf50" />
        <Card title="Attack Rate" value={stats.attack_rate_percent + "%"} color="#ffb84f" />
      </div>

      {/* --- Interactive test section --- */}
      <div style={{
        background: "#1e1e2e", borderRadius: "12px", padding: "1.5rem",
        marginBottom: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", maxWidth: "600px",
      }}>
        <h2 style={{ marginTop: 0 }}>Test the Model Live</h2>
        <p style={{ color: "#a0a0b0" }}>
          Send a real network flow through the model and see how it classifies it.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={() => testModel("attack")}
            disabled={loading}
            style={{
              padding: "0.75rem 1.25rem", borderRadius: "8px", border: "none",
              background: "#ff5c5c", color: "#fff", fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer", fontSize: "1rem",
            }}
          >
            Test with a Real Attack
          </button>
          <button
            onClick={() => testModel("benign")}
            disabled={loading}
            style={{
              padding: "0.75rem 1.25rem", borderRadius: "8px", border: "none",
              background: "#4caf50", color: "#fff", fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer", fontSize: "1rem",
            }}
          >
            Test with Benign Traffic
          </button>
        </div>

        {loading && <p style={{ color: "#ffb84f" }}>Analyzing flow...</p>}

        {result && !result.error && (
          <div style={{
            padding: "1rem", borderRadius: "8px",
            background: result.is_attack ? "#3a1a1a" : "#1a3a1a",
            border: `1px solid ${result.is_attack ? "#ff5c5c" : "#4caf50"}`,
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold",
              color: result.is_attack ? "#ff5c5c" : "#4caf50" }}>
              {result.prediction}
            </div>
            <div style={{ color: "#a0a0b0" }}>
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {result && result.error && (
          <p style={{ color: "#ff5c5c" }}>{result.error}</p>
        )}
      </div>

      {/* --- Chart --- */}
      <div style={{
        background: "#1e1e2e", borderRadius: "12px", padding: "1.5rem",
        maxWidth: "500px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}>
        <h2 style={{ marginTop: 0 }}>Traffic Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
              innerRadius={70} outerRadius={110} paddingAngle={3}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;