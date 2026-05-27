import { defineDocs } from "@farming-labs/docs";
import { colorful } from "@farming-labs/theme/colorful";

export default defineDocs({
  entry: "docs",
  theme: colorful(),
  ordering: [
    {
      "slug": "quickstart"
    },
    {
      "slug": "installation"
    }
  ],
  metadata: {
    titleTemplate: "%s – Docs",
    description: "Managed by @farming-labs/docs Cloud",
  },
});
