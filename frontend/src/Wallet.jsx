import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API || "/api";

function Wallet({ user }) {
    const [amount, setAmount] = useState("");
    const [qrUrl, setQrUrl] = useState("");
    const [step, setStep] = useState(1); // 1: Select Amount, 2: QR Code
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const presets = [100, 300, 500, 1000, 2000];

    useEffect(() => {
        fetch(`${API}/wallet/qr`)
            .then(r => r.json())
            .then(data => setQrUrl(data.qr_url))
            .catch(console.error);
    }, []);

    const handleTopupRequest = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API}/wallet/topup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.user_id,
                    amount: Number(amount)
                })
            });
            const data = await res.json();
            if (res.ok) {
                setStep(2);
            } else {
                alert(data.error || "Failed to create request");
            }
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center mt-20">
                <h2 className="text-2xl font-bold mb-4">Please log in to use the wallet</h2>
                <button onClick={() => navigate("/")} className="bg-primary px-6 py-2 rounded-xl">Go Home</button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto py-10">
            <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-neutral-muted hover:text-primary transition-colors text-sm">
                <span className="material-symbols-outlined">arrow_back</span> Back to Movies
            </button>

            <div className="bg-neutral-dark/30 p-8 rounded-2xl border border-neutral-dark shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-9xl">account_balance_wallet</span>
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-primary">My Wallet</h1>
                        <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-neutral-muted tracking-widest">Current Balance</div>
                            <div className="text-2xl font-black text-white">฿{Number(user.balance || 0).toFixed(2)}</div>
                        </div>
                    </div>

                    {step === 1 ? (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                                <label className="text-xs uppercase font-bold text-neutral-muted tracking-widest">Select Amount to Top Up</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {presets.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setAmount(p)}
                                            className={`py-3 rounded-xl border transition-all font-bold ${amount === p ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-neutral-dark/50 border-neutral-dark hover:border-primary/50 text-neutral-muted'}`}
                                        >
                                            ฿{p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-xs uppercase font-bold text-neutral-muted tracking-widest">Or Enter Custom Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted font-bold">฿</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full h-14 bg-neutral-dark/50 border border-neutral-dark rounded-xl pl-10 pr-4 text-xl font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading || !amount}
                                onClick={handleTopupRequest}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg mt-4 ${amount ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-neutral-dark text-neutral-muted cursor-not-allowed'}`}
                            >
                                {loading ? "Processing..." : "Continue to Payment"}
                                <span className="material-symbols-outlined">qr_code_2</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center gap-6 animate-fade-in">
                            <div className="bg-white p-4 rounded-2xl shadow-2xl inline-block">
                                {qrUrl ? (
                                    <img src={qrUrl} alt="Payment QR Code" className="w-64 h-64 object-contain" />
                                ) : (
                                    <div className="w-64 h-64 flex items-center justify-center text-neutral-dark bg-neutral-100 rounded-xl">
                                        <span className="material-symbols-outlined text-6xl animate-pulse">qr_code_2</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="text-lg font-bold text-white">Scan to Pay ฿{Number(amount).toFixed(2)}</div>
                                <p className="text-sm text-neutral-muted px-10">
                                    Please scan the QR code above with your mobile banking app. After payment, an admin will verify and approve your balance within 5-10 minutes.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 w-full mt-4">
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setAmount("");
                                    }}
                                    className="w-full py-4 bg-neutral-dark/50 hover:bg-neutral-dark rounded-xl font-bold transition-all border border-neutral-dark text-white"
                                >
                                    Done
                                </button>
                                <p className="text-[10px] text-neutral-muted uppercase tracking-widest italic">
                                    * Refresh your balance in the header to see updates
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Wallet;
