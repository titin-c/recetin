/** «Paso 1 de 2» con barras (componente nuevo del paso 8, solo con tokens existentes). */
export function ProgressSteps({ current, total }: { current: number; total: number }) {
  return (
    <div>
      <p className="text-xs text-text-2">
        Paso {current} de {total}
      </p>
      <div className="mt-2 flex gap-2" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-[3px] flex-1 ${i < current ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}
