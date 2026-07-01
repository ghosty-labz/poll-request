interface StatusPillProps {
  expired: boolean;
}

/** OPEN (pulsing green) / CLOSED (red) status pill. */
export function StatusPill({ expired }: StatusPillProps) {
  return (
    <span
      className={`flex items-center gap-[7px] rounded-[20px] border-2 border-ink px-[11px] py-1 font-plex text-[11px] font-bold tracking-[0.06em] text-ink ${
        expired ? "bg-[#ffe7e9]" : "bg-[#eafde3]"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${expired ? "bg-[#ff4d5e]" : "animate-pulse bg-neon-deep"}`}
      />
      {expired ? "CLOSED" : "OPEN"}
    </span>
  );
}
