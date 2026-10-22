import { useId } from "react";

/** Símbolo oficial Privacium: dois círculos entrelaçados com hachuras diagonais na interseção. */
export function PrivaciumMark({ className = "h-8 w-auto" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 80" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <defs>
        <clipPath id={`l-${id}`}><circle cx="40" cy="40" r="34" /></clipPath>
        <clipPath id={`r-${id}`}><circle cx="80" cy="40" r="34" /></clipPath>
      </defs>
      <g clipPath={`url(#l-${id})`}>
        <g clipPath={`url(#r-${id})`} strokeWidth="2.6">
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} x1={30} y1={i * 7 - 6} x2={95} y2={i * 7 + 38} />
          ))}
          <circle cx="80" cy="40" r="34" strokeWidth="6" />
          <circle cx="40" cy="40" r="34" strokeWidth="6" />
        </g>
      </g>
      <circle cx="40" cy="40" r="34" strokeWidth="2.2" />
      <circle cx="80" cy="40" r="34" strokeWidth="2.2" />
    </svg>
  );
}

export function PrivaciumLogo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const s = { sm: ["h-6", "text-xl"], md: ["h-8", "text-2xl"], lg: ["h-12", "text-4xl"] }[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Privacium">
      <PrivaciumMark className={`${s[0]} w-auto`} />
      <span className={`${s[1]} font-brand leading-none tracking-tight`}>privacium</span>
    </span>
  );
}
