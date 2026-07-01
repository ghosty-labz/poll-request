/** Shared card shell + uppercase step label used across the form sections. */

interface FormCardProps {
  children: React.ReactNode;
}

export function FormCard({ children }: FormCardProps) {
  return (
    <div className="rounded-xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
      {children}
    </div>
  );
}

interface StepLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function StepLabel({ children, className = "" }: StepLabelProps) {
  return (
    <span
      className={`font-plex text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c6356] ${className}`}
    >
      {children}
    </span>
  );
}
