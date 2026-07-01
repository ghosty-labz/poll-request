import { createFileRoute } from "@tanstack/react-router";
import { PollView } from "#/components/poll-view/PollView";

interface PollSearch {
  /** Management key; present when arriving from the manage link. */
  key?: string;
}

export const Route = createFileRoute("/polls/$publicId")({
  validateSearch: (search: Record<string, unknown>): PollSearch => ({
    key: typeof search.key === "string" ? search.key : undefined,
  }),
  component: PollPage,
});

function PollPage() {
  const { publicId } = Route.useParams();
  const { key } = Route.useSearch();
  return <PollView publicId={publicId} managementKey={key ?? null} />;
}
