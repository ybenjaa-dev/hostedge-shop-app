/**
 * Payment-provider interface. Only Cash on Delivery is implemented today.
 * To add Stripe / CMI / Payzone / Tap / Moyasar later: implement PaymentProvider,
 * register it in PROVIDERS, and expose it as a payment method at checkout (COD mode OFF).
 */
export type PaymentIntent = { orderId: string; number: string; amount: number; currency: string; customer: { name: string; phone: string; email?: string } };
export type PaymentInit = { kind: "none" } | { kind: "redirect"; url: string } | { kind: "client"; clientSecret: string };

export interface PaymentProvider {
  id: string; // stored in orders.payment_method
  label: { en: string; fr: string; ar: string };
  /** Whether this provider can be used for the given country/currency. */
  isAvailable(ctx: { country: string; currency: string }): boolean;
  /** Called after the order is created. COD returns { kind: "none" }. */
  init(intent: PaymentIntent): Promise<PaymentInit>;
  /** Webhook / return-URL verification. Returns the order number paid, if valid. */
  verify?(req: Request): Promise<{ number: string; paid: boolean } | null>;
}

export const cashOnDelivery: PaymentProvider = {
  id: "cod",
  label: { en: "Cash on delivery", fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" },
  isAvailable: () => true,
  init: async () => ({ kind: "none" }),
};

export const PROVIDERS: Record<string, PaymentProvider> = { cod: cashOnDelivery };
