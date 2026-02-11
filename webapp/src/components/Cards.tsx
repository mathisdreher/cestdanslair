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
      className="rounded-xl p-6 border"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          {title}
        </span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      {subtitle && (
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
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
