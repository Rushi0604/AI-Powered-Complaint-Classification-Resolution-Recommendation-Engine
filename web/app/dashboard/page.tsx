"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/lib/types";

export default function DashboardPage() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("complaint-history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const totalComplaints = history.length;
  const highPriority = history.filter((r) => r.priority === "High").length;
  const suspicious = history.filter((r) => r.status === "Suspicious").length;
  const resolved = history.filter((r) => r.status === "Valid").length;
  const categories = history.reduce(
    (acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const kpis = [
    {
      label: "Total Complaints",
      value: totalComplaints,
      color: "#2563eb",
      bg: "#eff6ff",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "High Priority",
      value: highPriority,
      color: "#dc2626",
      bg: "#fef2f2",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    {
      label: "Suspicious",
      value: suspicious,
      color: "#d97706",
      bg: "#fffbeb",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: "Valid Complaints",
      value: resolved,
      color: "#059669",
      bg: "#ecfdf5",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Overview of complaint analysis and intelligence metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="rounded-xl p-5 border animate-fade-in-up"
            style={{
              background: "#ffffff",
              borderColor: "#e5e7eb",
              boxShadow: "var(--shadow-sm)",
              animationDelay: `${i * 80}ms`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: kpi.bg, color: kpi.color }}
              >
                {kpi.icon}
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight" style={{ color: "#111827" }}>
              {kpi.value}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: "#9ca3af" }}>
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div
        className="rounded-xl p-6 border mb-6"
        style={{ background: "#ffffff", borderColor: "#e5e7eb", boxShadow: "var(--shadow-sm)" }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-5"
          style={{ color: "#6d28d9" }}
        >
          Category Breakdown
        </h2>
        {Object.keys(categories).length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "#374151" }}>
              No complaints analyzed yet
            </p>
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
              Go to{" "}
              <a href="/submit" className="underline font-medium" style={{ color: "#6d28d9" }}>
                Submit Complaint
              </a>{" "}
              to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(categories).map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium" style={{ color: "#111827" }}>{cat}</span>
                  <span className="font-medium" style={{ color: "#6b7280" }}>
                    {count} · {Math.round((count / totalComplaints) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "#f3f4f6" }}>
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${(count / totalComplaints) * 100}%`,
                      background: "linear-gradient(90deg, #6d28d9, #4f46e5)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Complaints */}
      <div
        className="rounded-xl p-6 border"
        style={{ background: "#ffffff", borderColor: "#e5e7eb", boxShadow: "var(--shadow-sm)" }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-5"
          style={{ color: "#6d28d9" }}
        >
          Recent Complaints
        </h2>
        {history.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "#9ca3af" }}>
            No complaints yet.
          </p>
        ) : (
          <div className="space-y-2">
            {history
              .slice()
              .reverse()
              .slice(0, 5)
              .map((item, idx) => {
                const prioColor =
                  item.priority === "High" ? "#dc2626" : item.priority === "Medium" ? "#d97706" : "#059669";
                const prioBg =
                  item.priority === "High" ? "#fef2f2" : item.priority === "Medium" ? "#fffbeb" : "#ecfdf5";
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-lg border transition-colors duration-150"
                    style={{
                      background: "#f9fafb",
                      borderColor: "#f3f4f6",
                    }}
                  >
                    <p className="text-sm truncate max-w-[55%] font-medium" style={{ color: "#111827" }}>
                      {item.complaint}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "#eff6ff", color: "#2563eb" }}
                      >
                        {item.category}
                      </span>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: prioBg, color: prioColor }}
                      >
                        {item.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
