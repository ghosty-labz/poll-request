import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <div className="flex items-center justify-between border-b-2 border-ink px-11 py-[22px]">
      <Link to="/" className="flex items-center gap-[11px] no-underline">
        <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md bg-ink font-pixel text-[11px] text-neon">
          PR
        </span>
        <span className="font-plex text-[15px] font-bold text-ink">
          poll_request
        </span>
      </Link>
      <div className="flex items-center gap-6 font-plex text-[13px] font-medium text-[#5c6356]">
        <span className="text-ink">$ poll init</span>
        <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-ink bg-neon font-plex text-[13px] font-bold text-ink">
          D
        </span>
      </div>
    </div>
  );
}
