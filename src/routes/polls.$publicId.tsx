import { createFileRoute } from "@tanstack/react-router";
import { PollNotFound } from "#/components/poll-view/PollNotFound";
import { PollView } from "#/components/poll-view/PollView";
import { fetchPollViewFn } from "#/server/poll-fns";

interface PollSearch {
  /** Management key; present when arriving from the manage link. */
  key?: string;
}

export const Route = createFileRoute("/polls/$publicId")({
  validateSearch: (search: Record<string, unknown>): PollSearch => ({
    key: typeof search.key === "string" ? search.key : undefined,
  }),
  // The management key changes what the loader returns (canManage), so it's a
  // cache dependency alongside the publicId.
  loaderDeps: ({ search }) => ({ key: search.key ?? null }),
  loader: ({ params, deps }) =>
    fetchPollViewFn({ data: { publicId: params.publicId, key: deps.key } }),
  notFoundComponent: PollNotFound,
  errorComponent: PollNotFound,
  component: PollPage,
});

function PollPage() {
  const { publicId } = Route.useParams();
  const { key } = Route.useSearch();
  const view = Route.useLoaderData();
  return (
    <PollView
      // Remount when the poll (or key) changes so usePoll re-seeds its state.
      key={`${publicId}?${key ?? ""}`}
      publicId={publicId}
      managementKey={key ?? null}
      initialView={view}
    />
  );
}
