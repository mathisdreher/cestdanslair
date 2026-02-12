"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: "📊" },
  { href: "/keywords", label: "Recherche par mot-clé", icon: "🔍" },
  { href: "/topics", label: "Sujets par année", icon: "📅" },
  { href: "/videos", label: "Explorateur vidéo", icon: "🎬" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="p-6 border-b" style={{ borderColor: "var(--card-border)" }}>
        <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] bg-clip-text text-transparent">
          C dans l&apos;air
        </h1>
        <p className="text-xs mt-1 tracking-wide uppercase" style={{ color: "var(--muted)" }}>
          Analyse de données
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
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
        <p>France 5 · Chaîne YouTube</p>
        <p className="mt-1">Outil d&apos;analyse de données</p>
      </div>
    </aside>
  );
}
