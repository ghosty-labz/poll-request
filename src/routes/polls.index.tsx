import { Link, createFileRoute } from "@tanstack/react-router";
import { MyPollsList } from "#/components/my-polls/MyPollsList";
import { fetchMyPollsFn } from "#/server/poll-fns";

export const Route = createFileRoute("/polls/")({
  loader: () => fetchMyPollsFn(),
  component: MyPollsPage,
});

function MyPollsPage() {
  const polls = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-cream font-plex text-ink">
      <div className="mx-auto max-w-[860px]">
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
            <span className="text-ink">$ poll list --mine</span>
            <Link
              to="/polls/new"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-plex text-[13px] font-bold text-neon no-underline shadow-[3px_3px_0_var(--color-neon)]"
            >
              Open a poll →
            </Link>
          </div>
        </div>

        {/* header */}
        <div className="px-11 pb-[30px] pt-12">
          <div className="mb-[22px] inline-block rounded-md border-2 border-ink bg-neon px-[10px] py-1 font-plex text-xs font-semibold tracking-[0.04em] text-ink">
            // your polls
          </div>
          <h1 className="m-0 font-pixel text-[26px] leading-[1.4] text-ink">Your Polls</h1>
          <p className="m-0 mt-[22px] max-w-[520px] font-plex text-[15px] leading-[1.7] text-[#54594c]">
            Every poll opened from this browser. No account behind this — if
            you clear cookies or switch devices, use a poll’s manage link to
            get back in.
          </p>
        </div>

        {/* list */}
        <div className="px-11 pb-[70px] pt-2">
          <MyPollsList polls={polls} />
        </div>
      </div>
    </div>
  );
}
