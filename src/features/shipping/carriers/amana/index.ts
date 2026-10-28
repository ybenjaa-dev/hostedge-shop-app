import { exportOnlyCarrier } from "../generic";

// Export-only: no official public API documentation could be read, so no endpoint is implemented. See docs/CARRIERS.md.
export const adapter = exportOnlyCarrier({ id: "amana", name: "Amana (Poste Maroc)", countries: ["MA"], docsUrl: "https://www.poste.ma" });
