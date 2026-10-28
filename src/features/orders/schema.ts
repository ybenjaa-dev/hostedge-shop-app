import { z } from "zod";

export const orderInputSchema = z.object({
  idemKey: z.string().min(8).max(64),
  items: z
    .array(z.object({ productId: z.string().min(1).max(40), variantId: z.string().max(40).nullish(), qty: z.number().int().min(1).max(99) }))
    .min(1)
    .max(30),
  name: z.string().trim().min(2, "name").max(80),
  phone: z.string().trim().min(6).max(24),
  phoneCountry: z.string().length(2).default("MA"),
  cityId: z.string().max(40).nullish(),
  cityText: z.string().trim().max(80).optional(),
  address: z.string().trim().min(4, "address").max(300),
  notes: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(40).optional(),
  hp: z.string().max(200).optional(), // honeypot — must stay empty
  source: z.string().max(40).optional(),
  lang: z.string().max(5).optional(),
  tracking: z.object({ fbp: z.string().max(120).optional(), fbc: z.string().max(200).optional(), ttp: z.string().max(120).optional(), ttclid: z.string().max(200).optional(), fp: z.string().max(64).optional(), url: z.string().max(500).optional() }).optional(),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export const quoteInputSchema = z.object({
  items: orderInputSchema.shape.items,
  cityId: z.string().max(40).nullish(),
  couponCode: z.string().trim().max(40).optional(),
});
export type QuoteInput = z.infer<typeof quoteInputSchema>;
