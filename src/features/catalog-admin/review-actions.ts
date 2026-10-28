"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { newId } from "@/lib/id";
import { parse, refresh, fail } from "@/features/settings/lib";

export async function setReviewStatus(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("reviews.moderate", async (user) => {
    const status = fd(form, "status");
    const id = fd(form, "id");
    if (!id || !["approved", "hidden", "pending"].includes(status)) return fail("Invalid request");
    await getDb().update(schema.reviews).set({ status: status as "approved" | "hidden" | "pending" }).where(eq(schema.reviews.id, id));
    await audit(user, `review.${status}`, "review", id);
    refresh();
    return { message: status === "approved" ? "Review approved" : status === "hidden" ? "Review hidden" : "Review moved to pending" };
  });
}

export async function deleteReview(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("reviews.moderate", async (user) => {
    const id = fd(form, "id");
    if (!id) return fail("Missing review");
    await getDb().delete(schema.reviews).where(eq(schema.reviews.id, id));
    await audit(user, "review.delete", "review", id);
    refresh();
    return { message: "Review deleted" };
  });
}

export async function addReview(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("reviews.moderate", async (user) => {
    const p = parse(
      z.object({
        productId: z.string().min(1, "Choose a product").max(40),
        name: z.string().min(1, "Name is required").max(80),
        city: z.string().max(80),
        rating: z.number().int().min(1, "Rating must be 1–5").max(5, "Rating must be 1–5"),
        body: z.string().min(3, "Write the review text").max(2000),
      }),
      { productId: fd(form, "productId"), name: fd(form, "name"), city: fd(form, "city"), rating: Number(fd(form, "rating")), body: fd(form, "body") },
    );
    if (!p.ok) return p.state;
    const d = p.data;
    const pr = await getDb().select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.id, d.productId)).get();
    if (!pr) return fail("Product not found");
    const id = newId();
    await getDb().insert(schema.reviews).values({ id, productId: d.productId, name: d.name, city: d.city || null, rating: d.rating, body: d.body, status: "approved" });
    await audit(user, "review.create", "review", id);
    refresh();
    return { message: "Review added" };
  });
}
