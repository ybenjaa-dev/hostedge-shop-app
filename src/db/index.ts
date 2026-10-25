import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getEnv } from "@/lib/env";

export type Db = ReturnType<typeof makeDb>;
const makeDb = (d1: D1Database) => drizzle(d1, { schema });

export function getDb(): Db {
  return makeDb(getEnv().DB);
}
export { schema };
