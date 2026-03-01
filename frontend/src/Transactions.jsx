import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API || "/api"; // support proxy and container networking

export default function Transactions({ user, refreshUser }) {
  const [data, setData] = useState([]);
  const [totalDue, setTotalDue] = useState(0);

  const load = () => {
    fetch(`${API}/transactions/${user.user_id}`)
      .then(r => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then(arr => {
        if (!Array.isArray(arr)) {
          console.warn("Expected array from transactions API", arr);
          setData([]);
          return;
        }
        setData(arr);
        const due = arr
          .filter(t => t.status === "Pending")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        setTotalDue(due);
      })
      .catch(e => {
        console.error("Failed to load transactions:", e);
        setData([]);
      });
  };

  useEffect(load, [user]);

  const doPay = async (book_id) => {
    try {
      const res = await fetch(`${API}/booking/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "pay failed");
      alert("Payment successful");
      refreshUser();
      load();
    } catch (e) {
      alert(`Payment error: ${e.message}`);
      console.error(e);
    }
  };

  const doCancel = async (book_id) => {
    try {
      const res = await fetch(`${API}/booking/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "cancel failed");
      alert("Booking cancelled");
      load();
    } catch (e) {
      alert(`Cancel error: ${e.message}`);
      console.error(e);
    }
  };

  return (
    <div>
      <h2>My Transactions</h2>
      {data.length === 0 && <p>No bookings yet. Book a seat first to see transactions.</p>}
      {data.map(t => (
        <div key={t.payment_id} style={{marginBottom: 8}}>
          <strong>{t.movie}</strong> - {new Date(t.showtime).toLocaleString()}<br/>
          Seat: {t.seat} | Amount: {t.amount} ฿ | Status: {t.status}<br/>
          Paid at: {t.payment_time}<br/>
          {t.status === "Pending" && (
            <>
              <button onClick={() => doPay(t.book_id)}>Pay</button>{" "}
              <button onClick={() => doCancel(t.book_id)}>Cancel</button>
            </>
          )}
        </div>
      ))}
      {totalDue > 0 && (
        <div style={{marginTop:20, fontWeight:'bold'}}>
          Total due: {totalDue} ฿
        </div>
      )}
    </div>
  );
}
