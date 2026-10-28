import { exportOnlyCarrier } from "../generic";

// Export-only: no official public API documentation could be read, so no endpoint is implemented. See docs/CARRIERS.md.
export const adapter = exportOnlyCarrier({ id: "jt", name: "J&T Express", countries: ["AE", "SA", "EG"], docsUrl: "https://www.jtexpress.ae" });
