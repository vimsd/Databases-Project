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

  const doPayAll = async () => {
    if (totalDue <= 0) return;
    try {
      const res = await fetch(`${API}/booking/confirm-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id })
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
      <h2 className="mb-4 text-2xl font-bold">My Bookings</h2>
      {data.length === 0 && <p className="text-neutral-muted">No bookings yet. Book a seat first to see transactions.</p>}

      <div className="flex flex-col gap-4">
        {data.map(t => (
          <div key={t.payment_id} className="bg-neutral-dark/30 border border-neutral-dark p-4 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-lg text-white">{t.movie}</strong>
                <div className="text-xs text-primary font-bold mt-1">
                  {t.theater_name || 'Theater'} <span className="uppercase bg-primary/20 px-2 py-0.5 rounded ml-1">{t.theater_format || 'Standard'}</span>
                </div>
              </div>
              <div className="text-right text-xs text-neutral-muted">
                {new Date(t.showtime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="mt-2 text-sm text-neutral-muted flex flex-wrap gap-x-6 gap-y-2">
              <span>Seat: <strong className="text-white">{t.seat}</strong></span>
              <span>Amount: <strong className="text-white">{t.amount} ฿</strong></span>
              <span>Status: <strong className={t.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}>{t.status}</strong></span>
              <span className="text-xs">Paid at: {new Date(t.payment_time).toLocaleString()}</span>
            </div>

            {t.status === "Pending" && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => doCancel(t.book_id)}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {totalDue > 0 && (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: "#111", border: "1px solid #333" }}>
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>
            Balance: {Number(user?.balance ?? 0).toFixed(2)} ฿ &nbsp;|&nbsp; Total due: {totalDue} ฿
          </div>
          <button
            onClick={doPayAll}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: "#22c55e",
              color: "#000",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(34,197,94,0.35)"
            }}
          >
            Pay all ({totalDue} ฿)
          </button>
        </div>
      )}
    </div>
  );
}
