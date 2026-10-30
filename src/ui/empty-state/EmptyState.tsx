import type { ReactNode } from "react";

/** Estado vacío / «próximamente»: explica qué habrá aquí y qué se puede hacer, sin botones falsos. */
export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="mt-4 border border-dashed border-border-field bg-surface px-6 py-10">
      <div className="mb-3">{icon}</div>
      <h2 className="text-xl">{title}</h2>
      <div className="mt-2 space-y-2 text-text-2">{children}</div>
    </div>
  );
}
