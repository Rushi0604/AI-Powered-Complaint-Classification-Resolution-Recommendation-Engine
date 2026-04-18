"use client";

import { useState } from "react";
import { analyzeComplaint } from "@/lib/apiClient";
import type { AnalysisResult } from "@/lib/types";

export default function SubmitPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Please enter a complaint first.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data: AnalysisResult = await analyzeComplaint(text.trim());
      setResult(data);

      // Persist to localStorage history
      const stored = localStorage.getItem("complaint-history");
      const history: AnalysisResult[] = stored ? JSON.parse(stored) : [];
      history.push(data);
      localStorage.setItem("complaint-history", JSON.stringify(history));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to server.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>
          Submit Complaint
        </h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Enter a complaint to get instant AI-powered classification, priority
          assignment, and resolution recommendations.
        </p>
      </div>

      {/* Input Card */}
      <div
        className="rounded-xl p-6 border mb-6"
        style={{
          background: "#ffffff",
          borderColor: "#e5e7eb",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <label
          htmlFor="complaint-input"
          className="block text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "#6d28d9" }}
        >
          Complaint Text
        </label>
        <textarea
          id="complaint-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example: The product I received was completely broken and the packaging was torn apart. I want a refund immediately!"
          rows={5}
          className="w-full rounded-lg px-4 py-3 text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 resize-vertical"
          style={{
            background: "#f9fafb",
            color: "#111827",
            borderColor: "#e5e7eb",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
            boxShadow: "0 2px 8px rgba(109,40,217,0.25)",
          }}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {loading ? "Analyzing…" : "Analyze Complaint"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-6 border font-medium"
          style={{
            background: "#fef2f2",
            color: "#dc2626",
            borderColor: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div
          className="rounded-xl border animate-fade-in-up overflow-hidden"
          style={{
            background: "#ffffff",
            borderColor: "#e5e7eb",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Header bar */}
          <div
            className="px-6 py-3 border-b"
            style={{
              background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
              borderColor: "#e5e7eb",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-white opacity-90">
              Analysis Result
            </p>
          </div>

          <div className="p-6">
            {/* Complaint echo */}
            <p
              className="text-sm italic pb-4 mb-4 border-b"
              style={{ color: "#6b7280", borderColor: "#f3f4f6" }}
            >
              &ldquo;{result.complaint}&rdquo;
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "#eff6ff", color: "#2563eb" }}
              >
                {result.category}
              </span>
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={prioStyle(result.priority)}
              >
                Priority: {result.priority}
              </span>
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={statusStyle(result.status)}
              >
                {result.status}
              </span>
            </div>

            {/* Reasons */}
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "#6d28d9" }}
            >
              Reasons
            </h3>
            <ul className="space-y-1.5 mb-5">
              {result.reason.map((r, i) => (
                <li
                  key={i}
                  className="text-sm px-3 py-2 rounded-lg font-medium"
                  style={{ background: "#fffbeb", color: "#92400e" }}
                >
                  {r}
                </li>
              ))}
            </ul>

            {/* Actions */}
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "#6d28d9" }}
            >
              Recommended Actions
            </h3>
            <ul className="space-y-1.5">
              {result.actions.map((a, i) => (
                <li
                  key={i}
                  className="text-sm px-3 py-2 rounded-lg font-medium flex items-start gap-2"
                  style={{ background: "#eff6ff", color: "#1e40af" }}
                >
                  <span className="mt-0.5 shrink-0" style={{ color: "#2563eb" }}>→</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
