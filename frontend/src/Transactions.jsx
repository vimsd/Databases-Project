import { useEffect, useState } from "react";

const API = "http://127.0.0.1:5000";

export default function Transactions({ user }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/transactions/${user.user_id}`)
      .then(r => r.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2>My Transactions</h2>
      {data.map(t => (
        <div key={t.payment_id}>
          {t.amount} บาท - {t.payment_time}
        </div>
      ))}
    </div>
  );
}
