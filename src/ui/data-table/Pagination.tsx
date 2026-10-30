import Link from "next/link";

/** Paginación numerada como <nav>, con la página actual marcada (aria-current). */
export function Pagination({
  page,
  pages,
  total,
  from,
  to,
  href,
}: {
  page: number;
  pages: number;
  total: number;
  from: number;
  to: number;
  href: (p: number) => string;
}) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2);
  return (
    <nav aria-label="Paginación" className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <span className="mr-auto text-text-2">{total === 0 ? "Sin resultados" : `${from}–${to} de ${total}`}</span>
      {nums.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - nums[i - 1] > 1 && <span aria-hidden="true">…</span>}
          <Link
            href={href(p) as never}
            aria-current={p === page ? "page" : undefined}
            className="grid min-h-10 min-w-10 place-items-center border border-border no-underline aria-[current]:border-2 aria-[current]:border-accent aria-[current]:font-medium aria-[current]:text-accent"
          >
            <span className="sr-only">Página </span>
            {p}
          </Link>
        </span>
      ))}
    </nav>
  );
}
