import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API || "/api";

function AdminWallet() {
    const [requests, setRequests] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [qrUrl, setQrUrl] = useState("");
    const [newQrUrl, setNewQrUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchRequests = () => {
        fetch(`${API}/admin/wallet/requests`)
            .then(r => r.json())
            .then(d => setRequests(Array.isArray(d) ? d : []))
            .catch(console.error);
    };

    const fetchBookings = () => {
        fetch(`${API}/admin/bookings`)
            .then(r => r.json())
            .then(d => setBookings(Array.isArray(d) ? d : []))
            .catch(console.error);
    };

    const fetchQr = () => {
        fetch(`${API}/wallet/qr`)
            .then(r => r.json())
            .then(d => {
                setQrUrl(d.qr_url);
                setNewQrUrl(d.qr_url);
            })
            .catch(console.error);
    };

    useEffect(() => {
        fetchRequests();
        fetchBookings();
        fetchQr();
    }, []);

    const handleAction = async (requestId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

        try {
            const res = await fetch(`${API}/admin/wallet/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ request_id: requestId })
            });
            if (res.ok) {
                alert(`Request ${action}ed`);
                fetchRequests();
            } else {
                const data = await res.json();
                alert(data.error || "Action failed");
            }
        } catch (e) {
            alert(e.message);
        }
    };

    const handleRefund = async (bookId) => {
        if (!window.confirm("Are you sure you want to refund and cancel this booking?")) return;

        try {
            const res = await fetch(`${API}/admin/booking/refund`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ book_id: bookId })
            });
            if (res.ok) {
                alert("Booking refunded and cancelled");
                fetchBookings();
            } else {
                const data = await res.json();
                alert(data.error || "Refund failed");
            }
        } catch (e) {
            alert(e.message);
        }
    };

    const updateQr = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/wallet/qr`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qr_url: newQrUrl })
            });
            if (res.ok) {
                alert("QR Code updated");
                fetchQr();
            }
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-10">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-primary mb-2">Wallet & Bookings</h1>
                    <p className="text-neutral-muted">Approve top-ups, manage bookings and process refunds</p>
                </div>
                <button onClick={() => navigate("/")} className="bg-neutral-dark/50 hover:bg-neutral-dark px-6 py-2 rounded-xl border border-neutral-dark transition-all">
                    Back to Dashboard
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Tables */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Top-up Requests Section */}
                    <div className="bg-neutral-dark/20 rounded-2xl border border-neutral-dark overflow-hidden flex flex-col shadow-xl">
                        <div className="px-6 py-4 border-b border-neutral-dark/50 bg-neutral-dark/10 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">pending_actions</span> Pending Top-ups
                            </h3>
                            <button onClick={fetchRequests} className="text-xs text-primary hover:text-white transition-colors uppercase font-bold tracking-widest flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">refresh</span> Refresh
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-[10px] uppercase tracking-widest text-neutral-muted bg-black/20">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-dark/30">
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-neutral-muted italic">No requests found</td>
                                        </tr>
                                    ) : (
                                        requests.map(req => (
                                            <tr key={req.request_id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">{req.email}</td>
                                                <td className="px-6 py-4 font-bold text-primary">฿{Number(req.amount).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-xs text-neutral-muted">{new Date(req.created_at).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${req.status === 'Pending' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' :
                                                        req.status === 'Approved' ? 'bg-green-400/10 text-green-400 border border-green-400/20' :
                                                            'bg-red-400/10 text-red-400 border border-red-400/20'
                                                        }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {req.status === 'Pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleAction(req.request_id, 'approve')} className="text-[10px] bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md font-bold uppercase transition-all">Approve</button>
                                                            <button onClick={() => handleAction(req.request_id, 'reject')} className="text-[10px] border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded-md font-bold uppercase transition-all">Reject</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Booking Management Section */}
                    <div className="bg-neutral-dark/20 rounded-2xl border border-neutral-dark overflow-hidden flex flex-col shadow-xl">
                        <div className="px-6 py-4 border-b border-neutral-dark/50 bg-neutral-dark/10 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">confirmation_number</span> Booking Management
                            </h3>
                            <button onClick={fetchBookings} className="text-xs text-primary hover:text-white transition-colors uppercase font-bold tracking-widest flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">refresh</span> Refresh
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-[10px] uppercase tracking-widest text-neutral-muted bg-black/20">
                                    <tr>
                                        <th className="px-6 py-4">Movie & User</th>
                                        <th className="px-6 py-4">Seat & Price</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-dark/30">
                                    {bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-neutral-muted italic">No bookings found</td>
                                        </tr>
                                    ) : (
                                        bookings.map(book => (
                                            <tr key={book.payment_id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white mb-0.5">{book.movie}</div>
                                                    <div className="text-[10px] text-neutral-muted uppercase tracking-widest">{book.user_email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">Seat {book.seat}</div>
                                                    <div className="text-primary font-bold">฿{Number(book.amount).toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-white text-xs">{new Date(book.showtime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                                                    <div className="text-[10px] text-neutral-muted uppercase tracking-widest mt-1">{book.theater_name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${book.status === 'Paid' ? 'bg-green-400/10 text-green-400 border border-green-400/20' :
                                                        book.status === 'Pending' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' :
                                                            'bg-red-400/10 text-red-400 border border-red-400/20'
                                                        }`}>
                                                        {book.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {book.status === 'Paid' && (
                                                        <button
                                                            onClick={() => handleRefund(book.book_id)}
                                                            className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md font-bold uppercase transition-all shadow-lg shadow-red-500/20"
                                                        >
                                                            Refund
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="flex flex-col gap-8">
                    <div className="bg-neutral-dark/20 rounded-2xl border border-neutral-dark p-6 flex flex-col gap-6 shadow-xl h-fit">
                        <h3 className="font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">qr_code_scanner</span> Payment Settings
                        </h3>

                        <div className="flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-inner flex flex-col items-center gap-2">
                                <div className="text-[10px] text-neutral-dark font-bold uppercase tracking-widest opacity-50">Current QR Code</div>
                                {qrUrl ? (
                                    <img src={qrUrl} alt="Admin QR" className="w-48 h-48 object-contain" />
                                ) : (
                                    <div className="w-48 h-48 bg-neutral-100 flex items-center justify-center text-neutral-muted rounded-xl">No QR Image</div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-muted tracking-widest">Update QR URL</label>
                                <textarea
                                    value={newQrUrl}
                                    onChange={(e) => setNewQrUrl(e.target.value)}
                                    rows="4"
                                    className="w-full bg-neutral-dark/50 border border-neutral-dark rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-primary outline-none resize-none"
                                    placeholder="https://example.com/qr-image.png"
                                />
                                <p className="text-[10px] text-neutral-muted italic">
                                    * You can use services like PromptPay QR generators or upload an image and paste the link here.
                                </p>
                            </div>

                            <button
                                disabled={loading || newQrUrl === qrUrl}
                                onClick={updateQr}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${newQrUrl !== qrUrl ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20' : 'bg-neutral-dark text-neutral-muted cursor-not-allowed border border-neutral-dark/50'}`}
                            >
                                {loading ? "Saving..." : "Update QR Code"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminWallet;
