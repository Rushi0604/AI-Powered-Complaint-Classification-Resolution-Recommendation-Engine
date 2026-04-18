"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/lib/types";

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    const stored = localStorage.getItem("complaint-history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const filtered =
    filter === "All"
      ? history
      : history.filter(
          (r) => r.priority === filter || r.category === filter || r.status === filter
        );

  const clearHistory = () => {
    localStorage.removeItem("complaint-history");
    setHistory([]);
  };

  const prioStyle = (priority: string) => {
    switch (priority) {
      case "High":
        return { background: "#fef2f2", color: "#dc2626" };
      case "Medium":
        return { background: "#fffbeb", color: "#d97706" };
      default:
        return { background: "#ecfdf5", color: "#059669" };
    }
  };

  const statusStyle = (status: string) =>
    status === "Suspicious"
      ? { background: "#fef2f2", color: "#dc2626" }
      : { background: "#ecfdf5", color: "#059669" };

  const filters = ["All", "High", "Medium", "Low", "Valid", "Suspicious"];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>
            Analysis History
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            {history.length} complaint{history.length !== 1 ? "s" : ""} analyzed
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors hover:opacity-80"
            style={{
              color: "#dc2626",
              borderColor: "#fecaca",
              background: "#fef2f2",
            }}
          >
            Clear History
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150"
            style={{
              background: filter === f ? "#6d28d9" : "#f3f4f6",
              color: filter === f ? "#ffffff" : "#6b7280",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-10 border text-center"
          style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
        >
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "#374151" }}>
            {history.length === 0
              ? "No complaints analyzed yet"
              : "No complaints match this filter"}
          </p>
          {history.length === 0 && (
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
              Submit one to get started
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .slice()
            .reverse()
            .map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl p-5 border animate-fade-in-up"
                style={{
                  background: "#ffffff",
                  borderColor: "#e5e7eb",
                  boxShadow: "var(--shadow-sm)",
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                <p className="text-sm font-medium mb-3" style={{ color: "#111827" }}>
                  &ldquo;{item.complaint}&rdquo;
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    {item.category}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={prioStyle(item.priority)}
                  >
                    {item.priority}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={statusStyle(item.status)}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {item.actions.slice(0, 2).map((a, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded font-medium"
                      style={{ background: "#eff6ff", color: "#1e40af" }}
                    >
                      → {a}
                    </span>
                  ))}
                  {item.actions.length > 2 && (
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: "#9ca3af" }}>
                      +{item.actions.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
