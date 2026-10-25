import { exportOnlyCarrier } from "../generic";

// Export-only: no official public API documentation could be read, so no endpoint is implemented. See docs/CARRIERS.md.
export const adapter = exportOnlyCarrier({ id: "aramex", name: "Aramex", countries: ["AE", "SA", "KW", "QA", "BH", "OM", "EG", "MA"], docsUrl: "https://www.aramex.com/ae/en/developers-solution-center/aramex-apis" });
