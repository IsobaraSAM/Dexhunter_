import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import App from "../App";
import { DEFAULT_BROWSE, parseBrowseSearch } from "../lib/browseLocation";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => parseBrowseSearch(search),
  search: {
    middlewares: [stripSearchParams(DEFAULT_BROWSE)],
  },
  component: Home,
});

function Home() {
  return <App />;
}
