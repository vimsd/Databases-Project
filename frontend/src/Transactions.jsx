import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API || "/api"; // support proxy and container networking

export default function Transactions({ user }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${API}/transactions/${user.user_id}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, [user]);

  return (
    <div>
      <h2>My Transactions</h2>
      {data.map(t => (
        <div key={t.payment_id} style={{marginBottom: 8}}>
          <strong>{t.movie}</strong> - {new Date(t.showtime).toLocaleString()}<br/>
          Seat: {t.seat} | Amount: {t.amount} ฿ | Status: {t.status}<br/>
          Paid at: {t.payment_time}
        </div>
      ))}
    </div>
  );
}
