import { describe, expect, it } from "vitest";
import { decryptCredentials, encryptCredentials, maskSecret, mergeCredentials, publicFields } from "@/features/shipping/credentials-core";
import type { CredentialField } from "@/features/shipping/types";

const fields: CredentialField[] = [{ key: "user", label: "User", secret: false }, { key: "token", label: "Token", secret: true }];

describe("carrier credentials", () => {
  it("round-trips through AES-GCM and does not leak plaintext", async () => {
    const blob = await encryptCredentials({ user: "bob", token: "s3cr3t-token" }, "key-1");
    expect(blob.startsWith("v1.")).toBe(true);
    expect(blob).not.toContain("s3cr3t");
    expect(await decryptCredentials(blob, "key-1")).toEqual({ user: "bob", token: "s3cr3t-token" });
  });
  it("returns empty on wrong key / garbage / null", async () => {
    const blob = await encryptCredentials({ a: "b" }, "key-1");
    expect(await decryptCredentials(blob, "other")).toEqual({});
    expect(await decryptCredentials("junk", "key-1")).toEqual({});
    expect(await decryptCredentials(null, "key-1")).toEqual({});
  });
  it("blank submitted values keep stored secrets; unknown keys are dropped", () => {
    expect(mergeCredentials(fields, { user: "bob", token: "old" }, { user: "amy", token: "", evil: "x" })).toEqual({ user: "amy", token: "old" });
  });
  it("public view never contains secret values", () => {
    const pub = publicFields(fields, { user: "bob", token: "supersecretvalue" });
    expect(JSON.stringify(pub)).not.toContain("supersecretvalue");
    expect(pub.find((f) => f.key === "token")).toMatchObject({ configured: true, display: "••••ue" });
    expect(pub.find((f) => f.key === "user")?.display).toBe("bob");
    expect(maskSecret("abc")).toBe("••••");
  });
});
