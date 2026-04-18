"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/roles";

interface Complaint {
  complaint_id?: number | string;
  product_type: string;
  date: string;
  category: string;
  text: string;
  resolve_status: string;
  email: string;
  priority: string;
  sentiment?: number;
}

export default function DashboardPage() {
  const [role, setRole] = useState<"owner" | "employee">("employee");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchComplaints = async (userRole: string, email: string) => {
    const query = supabase.from("Complain_Data").select("*");
    if (userRole === "employee") {
      query.eq("email", email);
    }
    const { data } = await query;

    if (data) {
      const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
      const sorted = [...data].sort((a, b) => {
        const aPrio = priorityOrder[a.priority] ?? 3;
        const bPrio = priorityOrder[b.priority] ?? 3;
        if (aPrio !== bPrio) return aPrio - bPrio;
        const aSent = a.sentiment !== undefined && a.sentiment !== null ? Number(a.sentiment) : 0;
        const bSent = b.sentiment !== undefined && b.sentiment !== null ? Number(b.sentiment) : 0;
        if (aSent !== bSent) return aSent - bSent;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setComplaints(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || "";
        const userRole = getUserRole(email);
        
        setRole(userRole);
        setUserEmail(email);
        setUserName(
          session.user.user_metadata?.full_name ||
            email.split("@")[0] ||
            "User"
        );

        fetchComplaints(userRole, email);
      }
    });
  }, []);

  const openProcessModal = async (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAnalysisResult(null);
    setAnalyzing(true);
    
    try {
      const res = await fetch("http://127.0.0.1:5001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint: complaint.text })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      } else {
        console.error("Analysis API returned an error");
      }
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleProcess = async (complaint_id: number | string | undefined) => {
    if (!complaint_id) return;
    
    // Optimistically update UI
    setComplaints(prev => prev.map(c => 
      c.complaint_id === complaint_id ? { ...c, resolve_status: "resolved" } : c
    ));

    const { error } = await supabase
      .from("Complain_Data")
      .update({ resolve_status: "resolved" })
      .eq("complaint_id", complaint_id);

    if (error) {
      console.error("Failed to update status:", error);
      // Revert if error
      fetchComplaints(role, userEmail);
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.resolve_status === "submitted").length,
    critical: complaints.filter((c) => c.priority === "High").length,
    resolved: complaints.filter((c) => c.resolve_status === "resolved").length,
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "submitted":
        return { background: "#fffbeb", color: "#d97706", label: "Pending" };
      case "resolved":
        return { background: "#ecfdf5", color: "#059669", label: "Resolved" };
      default:
        return { background: "#f3f4f6", color: "#6b7280", label: status };
    }
  };

  const prioStyle = (prio: string) => {
    switch (prio) {
      case "High":
        return { background: "#fee2e2", color: "#b91c1c" };
      case "Medium":
        return { background: "#fef3c7", color: "#b45309" };
      default:
        return { background: "#dcfce7", color: "#15803d" };
    }
  };

  const statsData = [
    { label: "Total Complaints", val: stats.total, color: "border-indigo-100 bg-indigo-50/50 text-indigo-900", accent: "text-indigo-600" },
    { label: "Pending Review", val: stats.pending, color: "border-amber-100 bg-amber-50/50 text-amber-900", accent: "text-amber-600" },
    { label: "Critical Priority", val: stats.critical, color: "border-rose-100 bg-rose-50/50 text-rose-900", accent: "text-rose-600" },
    { label: "Successfully Resolved", val: stats.resolved, color: "border-emerald-100 bg-emerald-50/50 text-emerald-900", accent: "text-emerald-600" }
  ];

  return (
    <div className="min-h-screen p-6 bg-slate-50 text-slate-900 selection:bg-indigo-100">
      {/* Role Debug Banner */}
      {role === "owner" && (
        <div className="flex justify-center mb-8">
          <div className="text-[10px] uppercase font-black tracking-widest py-1.5 px-5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            ROOT ACCESS: {userEmail}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              {role === "owner" ? "OWNER TERMINAL" : `Hi, ${userName} 👋`}
            </h1>
            <p className="text-sm mt-1.5 font-medium text-slate-500">
              {role === "owner" ? "Enterprise master control and intelligence dashboard." : "Track your complaint progress below."}
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm transition-all"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {statsData.map(s => (
            <div key={s.label} className={`p-6 rounded-3xl border ${s.color} shadow-sm transition-transform hover:-translate-y-1`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">{s.label}</p>
              <p className={`text-4xl font-black tracking-tighter ${s.accent}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h2 className="font-bold tracking-tight text-lg text-slate-800">
              {role === "owner" ? "URGENT ACTION QUEUE" : "MY COMPLAINTS"}
            </h2>
            {role === "owner" && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                AI PRIORITY SORT ACTIVE
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-32 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Loading intelligence...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-32 text-center text-slate-500 font-medium">No active complaints found in the database.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.map((item, idx) => {
                const style = statusStyle(item.resolve_status);
                const pStyle = prioStyle(item.priority);
                const isResolved = item.resolve_status === "resolved";
                
                return (
                  <div key={item.complaint_id || idx} className={`p-6 transition-all duration-200 hover:bg-slate-50 ${isResolved ? "opacity-50 grayscale bg-slate-50/50" : ""}`}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider border" style={{ ...pStyle, borderColor: "currentColor", opacity: 0.8 }}>
                            {item.priority || "Low"}
                          </span>
                          <span className="text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {item.category || "General"}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-4 leading-snug text-slate-900">{item.text}</h3>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="uppercase tracking-widest text-[9px] font-bold text-slate-400">Product</span> 
                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{item.product_type}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="uppercase tracking-widest text-[9px] font-bold text-slate-400">Date</span> 
                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                          </span>
                          {role === "owner" && (
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                              <span className="uppercase tracking-widest text-[9px] font-bold opacity-70">User</span> 
                              {item.email}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 w-full md:w-auto">
                        <span className="text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm" style={style}>
                          {style.label}
                        </span>
                        {role === "owner" && !isResolved && (
                          <button 
                            onClick={() => openProcessModal(item)}
                            className="text-[10px] font-black px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl uppercase tracking-widest transition-all duration-200 shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                          >
                            Process Complaint
                          </button>
                        )}
                        {role === "owner" && isResolved && (
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-5 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Processing Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                  <span className="text-indigo-600 text-2xl">⚡</span> AI Intelligence Analysis
                </h2>
                <p className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest flex items-center gap-2">
                  <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700">#{selectedComplaint.complaint_id}</span>
                  <span>From: {selectedComplaint.email}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/50">
              {/* Original Complaint */}
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Original Text
                </p>
                <div className="p-5 bg-white rounded-2xl border border-slate-200 text-slate-700 text-sm leading-relaxed italic shadow-sm">
                  "{selectedComplaint.text}"
                </div>
              </div>

              {analyzing ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-lg">🧠</div>
                  </div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Running neural classification...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* KPI Bar */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-2">Category Mapping</p>
                      <p className="font-black text-indigo-600 text-lg">{analysisResult.category}</p>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-2">System Priority</p>
                      <p className={`font-black text-lg ${analysisResult.priority === 'High' ? 'text-rose-600' : analysisResult.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {analysisResult.priority}
                      </p>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-2">Flag Status</p>
                      <p className={`font-black text-lg flex items-center gap-2 ${analysisResult.status === 'Suspicious' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {analysisResult.status === 'Suspicious' ? '⚠️' : '✓'} {analysisResult.status}
                      </p>
                    </div>
                  </div>

                  {/* Logic and Reasons */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> AI Logic & Flags
                    </p>
                    <ul className="space-y-2">
                      {analysisResult.reason?.map((r: string, i: number) => (
                        <li key={i} className="text-sm font-medium text-slate-700 bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 shadow-sm">
                          <span className="text-amber-500 mt-0.5 text-xs">▹</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Recommended Actions
                    </p>
                    <ul className="space-y-2">
                      {analysisResult.actions?.map((act: string, i: number) => (
                        <li key={i} className="text-sm font-medium text-slate-700 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3 shadow-sm">
                          <span className="text-emerald-500 mt-0.5 text-xs">✓</span> {act}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
                  <p className="text-rose-700 font-bold text-sm">Failed to connect to the Intelligence Engine.</p>
                  <p className="text-rose-600/70 text-xs mt-1">Make sure app.py is running on port 5001.</p>
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Action Required
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedComplaint(null)}
                  className="px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors border border-transparent hover:border-slate-300"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    handleProcess(selectedComplaint.complaint_id);
                    setSelectedComplaint(null);
                  }}
                  disabled={analyzing}
                  className="px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
