import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function App() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/stats")
      .then((response) => response.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) {
    return <h1 style={{ fontFamily: "sans-serif" }}>Loading NetGuard AI dashboard...</h1>;
  }

  const Card = ({ title, value, color }) => (
    <div style={{
      background: "#1e1e2e",
      borderRadius: "12px",
      padding: "1.5rem",
      minWidth: "160px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ color: "#a0a0b0", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
        {title}
      </div>
      <div style={{ color: "#fff", fontSize: "2rem", fontWeight: "bold" }}>
        {value}
      </div>
    </div>
  );

  // Shape the stats into the format Recharts wants: an array of {name, value}
  const chartData = [
    { name: "Attacks", value: stats.attacks },
    { name: "Benign", value: stats.benign },
  ];
  const COLORS = ["#ff5c5c", "#4caf50"]; // red for attacks, green for benign

  return (
    <div style={{
      fontFamily: "sans-serif",
      background: "#12121c",
      minHeight: "100vh",
      padding: "2rem",
      color: "#fff",
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

      <div style={{
        background: "#1e1e2e",
        borderRadius: "12px",
        padding: "1.5rem",
        maxWidth: "500px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}>
        <h2 style={{ marginTop: 0 }}>Traffic Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              label
            >
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