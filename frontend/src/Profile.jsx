import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API || "/api";

export default function Profile({ user }) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        display_name: "",
        bio: "",
        avatar_url: ""
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchProfileData = useCallback(async () => {
        try {
            // 1. Fetch Mongo Profile
            const profRes = await fetch(`${API}/mongo/profiles/${user.user_id}`);
            if (profRes.ok) {
                const profData = await profRes.json();
                setProfile({
                    display_name: profData.display_name || "",
                    bio: profData.bio || "",
                    avatar_url: profData.avatar_url || ""
                });
            }

            // 2. Fetch MySQL Watch History (Paid Bookings)
            const histRes = await fetch(`${API}/booking/history/${user.user_id}`);
            if (histRes.ok) {
                const histData = await histRes.json();
                setHistory(histData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user.user_id]);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchProfileData();
    }, [user, navigate, fetchProfileData]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const resp = await fetch(`${API}/mongo/profiles/${user.user_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile)
            });
            if (resp.ok) {
                alert("Profile updated successfully!");
            } else {
                alert("Failed to update profile.");
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white text-center mt-20">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-[#111] text-white p-8">
            <div className="max-w-4xl mx-auto flex flex-col gap-10">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate("/")} className="text-neutral-muted hover:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined">arrow_back</span> Back to Home
                    </button>
                    <h1 className="text-3xl font-bold text-primary">My Profile</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

                    {/* PROFILE EDIT FORM */}
                    <div className="md:col-span-1 bg-neutral-dark/20 p-6 rounded-2xl border border-neutral-dark flex flex-col gap-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-32 rounded-full overflow-hidden bg-neutral-dark border-2 border-primary/50 mb-4 flex items-center justify-center text-4xl">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : "👤"}
                            </div>
                            <h2 className="text-xl font-bold">{profile.display_name || user.email}</h2>
                            <p className="text-sm text-neutral-muted">{user.role.toUpperCase()} • Balance: ฿{user.balance}</p>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs uppercase font-bold text-neutral-muted mb-1 block">Display Name</label>
                                <input
                                    type="text"
                                    value={profile.display_name}
                                    onChange={e => setProfile({ ...profile, display_name: e.target.value })}
                                    className="w-full bg-neutral-dark/50 border border-neutral-dark rounded-xl p-3 text-sm focus:border-primary outline-none"
                                    placeholder="CoolCinemaFan99"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase font-bold text-neutral-muted mb-1 block">Bio</label>
                                <textarea
                                    value={profile.bio}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                    rows="3"
                                    className="w-full bg-neutral-dark/50 border border-neutral-dark rounded-xl p-3 text-sm focus:border-primary outline-none resize-none"
                                    placeholder="I love sci-fi movies..."
                                ></textarea>
                            </div>
                            <div>
                                <label className="text-xs uppercase font-bold text-neutral-muted mb-1 block">Avatar URL</label>
                                <input
                                    type="text"
                                    value={profile.avatar_url}
                                    onChange={e => setProfile({ ...profile, avatar_url: e.target.value })}
                                    className="w-full bg-neutral-dark/50 border border-neutral-dark rounded-xl p-3 text-sm focus:border-primary outline-none"
                                    placeholder="https://example.com/me.jpg"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="mt-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </form>
                    </div>

                    {/* WATCH HISTORY */}
                    <div className="md:col-span-2 bg-neutral-dark/20 p-6 rounded-2xl border border-neutral-dark">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-neutral-dark pb-4">
                            <span className="material-symbols-outlined text-primary text-3xl">history</span> Watch History
                        </h3>

                        <div className="flex flex-col gap-4">
                            {history.length === 0 ? (
                                <div className="text-center p-10 bg-neutral-dark/10 rounded-2xl border border-neutral-dark/30">
                                    <span className="material-symbols-outlined text-4xl text-neutral-muted opacity-50 mb-2 block">movie</span>
                                    <p className="text-neutral-muted">You haven't watched any movies yet.</p>
                                </div>
                            ) : (
                                history.map((item, idx) => (
                                    <div key={idx} className="bg-neutral-dark/30 p-4 rounded-2xl border border-neutral-dark/50 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                        <div className="flex-1">
                                            <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">
                                                {new Date(item.showtime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="text-lg font-bold mb-1">{item.title}</div>
                                            <div className="text-sm text-neutral-muted flex gap-3">
                                                <span><span className="material-symbols-outlined text-[12px] align-middle">location_on</span> {item.branch_name}</span>
                                                <span><span className="material-symbols-outlined text-[12px] align-middle">chair</span> {item.seats_booked} seats</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs uppercase text-neutral-muted mb-1">Total Paid</div>
                                            <div className="text-xl font-black text-[#00ffcc]">฿{item.amount_paid}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
