"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 border backdrop-blur-sm"
      style={{
        background: "linear-gradient(135deg, var(--card-bg) 0%, rgba(99, 102, 241, 0.04) 100%)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          {title}
        </span>
        {icon && <span className="text-xl opacity-70">{icon}</span>}
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      {subtitle && (
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartContainer({ title, subtitle, children }: ChartContainerProps) {
  return (
    <div
      className="rounded-xl p-6 border"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
