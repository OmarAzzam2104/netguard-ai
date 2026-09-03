import { useState, useEffect } from "react";

function App() {
  // "state" = React's memory. stats starts as null (no data yet).
  const [stats, setStats] = useState(null);

  // useEffect runs once when the page loads. We use it to fetch data.
  useEffect(() => {
    fetch("http://127.0.0.1:8000/stats")
      .then((response) => response.json())
      .then((data) => setStats(data));
  }, []);

  // While we're still waiting for the data, show a loading message.
  if (!stats) {
    return <h1>Loading NetGuard AI dashboard...</h1>;
  }

  // Once we have data, show it.
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>🛡️ NetGuard AI Dashboard</h1>
      <p>Total detections: {stats.total_detections}</p>
      <p>Attacks: {stats.attacks}</p>
      <p>Benign: {stats.benign}</p>
      <p>Attack rate: {stats.attack_rate_percent}%</p>
    </div>
  );
}

export default App;