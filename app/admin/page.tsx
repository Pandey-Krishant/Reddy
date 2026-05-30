"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface UserData {
  _id: string;
  username: string;
  balance: number;
  exposure: number;
  createdAt: string;
}

interface BetData {
  _id: string;
  userId: string;
  username: string;
  matchId: number;
  matchTitle: string;
  teamA: string;
  teamB: string;
  selectedTeam: string;
  amount: number;
  status: "pending" | "won" | "lost" | "cancelled";
  placedAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [bets, setBets] = useState<BetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/local/admin");
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setBets(data.bets || []);
      } else {
        setError("Failed to fetch admin data.");
      }
    } catch (err) {
      setError("Network error fetching admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateBalance(userId: string) {
    const bal = parseInt(editBalance, 10);
    if (isNaN(bal)) return;

    try {
      const res = await fetch("/api/local/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newBalance: bal }),
      });
      
      if (res.ok) {
        setEditUserId(null);
        fetchData();
      } else {
        alert("Failed to update balance");
      }
    } catch (err) {
      alert("Error updating balance");
    }
  }

  async function handleResolveBet(betId: string, status: "won" | "lost" | "cancelled" | "pending") {
    try {
      const res = await fetch("/api/local/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId, status }),
      });
      
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to resolve bet");
      }
    } catch (err) {
      alert("Error resolving bet");
    }
  }

  async function handleLogout() {
    await fetch("/api/local/logout");
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="rounded-full" />
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded font-bold text-sm text-white"
        >
          Sign Out
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {error && <div className="bg-rose-500/20 text-rose-400 p-4 rounded-lg">{error}</div>}

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Users</h2>
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-700/50 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Exposure</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-700/20">
                      <td className="px-4 py-3 text-xs text-slate-500">{u._id}</td>
                      <td className="px-4 py-3 font-bold text-white">{u.username}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">
                        {editUserId === u._id ? (
                          <input
                            type="number"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-24 text-white"
                          />
                        ) : (
                          `${u.balance} Rs.`
                        )}
                      </td>
                      <td className="px-4 py-3 text-amber-400 font-bold">{u.exposure} Rs.</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {editUserId === u._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateBalance(u._id)}
                              className="text-emerald-400 hover:text-emerald-300"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditUserId(null)}
                              className="text-slate-400 hover:text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditUserId(u._id);
                              setEditBalance(u.balance.toString());
                            }}
                            className="text-sky-400 hover:text-sky-300 font-semibold"
                          >
                            Edit Balance
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">All Bets</h2>
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-700/50 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3">Selection</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Placed</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {bets.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-700/20">
                      <td className="px-4 py-3 font-bold text-white">{b.username}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-400">{b.matchTitle}</div>
                        <div className="text-white font-semibold">
                          {b.teamA} vs {b.teamB}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-sky-400">{b.selectedTeam}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{b.amount} Rs.</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            b.status === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : b.status === "won"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : b.status === "lost"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{new Date(b.placedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {b.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveBet(b._id, "won")}
                              className="px-2 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-xs font-bold"
                            >
                              Won
                            </button>
                            <button
                              onClick={() => handleResolveBet(b._id, "lost")}
                              className="px-2 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded text-xs font-bold"
                            >
                              Lost
                            </button>
                            <button
                              onClick={() => handleResolveBet(b._id, "cancelled")}
                              className="px-2 py-1 bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 rounded text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {b.status !== "pending" && (
                          <button
                            onClick={() => handleResolveBet(b._id, "pending")}
                            className="px-2 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded text-xs font-bold"
                          >
                            Revert
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No bets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
