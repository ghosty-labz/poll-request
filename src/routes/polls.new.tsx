import { Link, createFileRoute } from "@tanstack/react-router";
import { CreatePollForm } from "#/components/create-poll/CreatePollForm";

export const Route = createFileRoute("/polls/new")({ component: NewPollPage });

function NewPollPage() {
  return (
    <div className="min-h-screen bg-cream font-plex text-ink">
      <div className="mx-auto max-w-[1180px]">
        {/* nav */}
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

        {/* header */}
        <div className="px-11 pb-[30px] pt-12">
          <div className="mb-[22px] inline-block rounded-md border-2 border-ink bg-neon px-[10px] py-1 font-plex text-xs font-semibold tracking-[0.04em] text-ink">
            // new poll request
          </div>
          <h1 className="m-0 font-pixel text-[26px] leading-[1.4] text-ink">
            Open a Poll
            <br />
            Request
          </h1>
          <p className="m-0 mt-[22px] max-w-[520px] font-plex text-[15px] leading-[1.7] text-[#54594c]">
            Draft your question, stack the options, set the rules. Hit create
            and you’ll get one link to drop wherever your team lurks.
          </p>
        </div>

        {/* form + preview */}
        <div className="px-11 pb-[70px] pt-2">
          <CreatePollForm />
        </div>
      </div>
    </div>
  );
}
