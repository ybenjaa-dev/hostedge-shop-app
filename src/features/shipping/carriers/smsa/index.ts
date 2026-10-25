import { exportOnlyCarrier } from "../generic";

// Export-only: no official public API documentation could be read, so no endpoint is implemented. See docs/CARRIERS.md.
export const adapter = exportOnlyCarrier({ id: "smsa", name: "SMSA Express", countries: ["SA"], docsUrl: "https://www.smsaexpress.com" });
