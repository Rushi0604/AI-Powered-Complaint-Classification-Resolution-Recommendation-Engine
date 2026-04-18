"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    label: "Submit Complaint",
    href: "/submit",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: "History",
    href: "/history",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-full w-[240px] flex flex-col border-r z-50"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--card-border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}
          >
            AI
          </div>
          <div>
            <h1 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              ComplaintIQ
            </h1>
            <p className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>
              Intelligence Engine
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest px-3 py-2"
          style={{ color: "var(--muted)" }}
        >
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                background: isActive ? "var(--accent-glow)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--muted)",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <span style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t" style={{ borderColor: "var(--card-border)" }}>
        <p className="text-[10px]" style={{ color: "#9ca3af" }}>
          Lakshya 2.0 — Haastra
        </p>
      </div>
    </aside>
  );
}
