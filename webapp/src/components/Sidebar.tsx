"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/keywords", label: "Keyword Search", icon: "🔍" },
  { href: "/topics", label: "Topics by Year", icon: "📅" },
  { href: "/videos", label: "Video Explorer", icon: "🎬" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="p-6 border-b" style={{ borderColor: "var(--card-border)" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--accent-light)" }}>
          C dans l&apos;air
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Analytics Dashboard
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "text-white"
                  : "hover:text-white"
              }`}
              style={{
                background: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "white" : "var(--muted)",
              }}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t text-xs" style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
        <p>France 5 · YouTube Channel</p>
        <p className="mt-1">Data analysis tool</p>
      </div>
    </aside>
  );
}
