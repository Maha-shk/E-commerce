"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Lock, Package, Truck } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductImage } from "@/components/customer/ProductImage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select-native";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/lib/hooks/use-cart";
import { useSession } from "@/lib/hooks/use-auth";
import { useAddresses } from "@/lib/hooks/use-account";
import { addressLinesToFields, formatAddressLine } from "@/lib/address";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Shipping countries. Ireland leads because the store prices in EUR and
 * formats with the en-IE locale.
 */
const COUNTRIES = [
  { code: "IE", name: "Ireland" },
  { code: "UK", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
] as const;

const POSTCODE_RULES: Record<string, { pattern: RegExp; hint: string }> = {
  IE: { pattern: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/, hint: "an Eircode (D02 XY45)" },
  UK: { pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/, hint: "a UK postcode" },
  US: { pattern: /^\d{5}(-\d{4})?$/, hint: "a ZIP code (12345 or 12345-6789)" },
  CA: { pattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, hint: "a Canadian postal code (A1A 1A1)" },
  AU: { pattern: /^\d{4}$/, hint: "a 4-digit Australian postcode" },
};

/**
 * Express is a flat surcharge that replaces standard shipping. Standard uses
 * whatever the cart already computed, so the number the shopper saw on /cart
 * is the number they see here.
 */
const EXPRESS_SHIPPING = 14.99;

type DeliveryMethod = "standard" | "express";

type ContactInfo = { email: string; phone: string };
type ShippingForm = {
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  country: string;
  state: string;
  postalCode: string;
};

type FieldName = keyof ContactInfo | keyof ShippingForm;
type FormErrors = Partial<Record<FieldName, string>>;

/** Fields that must be filled before the order can be placed. */
const REQUIRED_FIELDS: FieldName[] = [
  "email",
  "phone",
  "firstName",
  "lastName",
  "address",
  "city",
  "country",
  "postalCode",
];

const LABELS: Record<FieldName, string> = {
  email: "Email address",
  phone: "Phone number",
  firstName: "First name",
  lastName: "Last name",
  address: "Address",
  apartment: "Apartment",
  city: "City",
  country: "Country",
  state: "State / County",
  postalCode: "Postal code",
};

function validate(field: FieldName, value: string, country: string): string | undefined {
  const trimmed = value.trim();

  if (REQUIRED_FIELDS.includes(field) && !trimmed) {
    return `${LABELS[field]} is required`;
  }
  if (!trimmed) return undefined;

  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address";
  }

  if (field === "phone") {
    if (!/^\+?[\d\s\-()]+$/.test(trimmed)) return "Enter a valid phone number";
    if (trimmed.replace(/\D/g, "").length < 7) return "Phone number is too short";
  }

  if (field === "postalCode") {
    const rule = POSTCODE_RULES[country];
    if (rule && !rule.pattern.test(trimmed.toUpperCase())) {
      return `Enter ${rule.hint}`;
    }
    if (!rule && (trimmed.length < 3 || trimmed.length > 10)) {
      return "Enter a valid postal code";
    }
  }

  return undefined;
}

export default function CheckoutPage() {
  const router = useRouter();
  // The header's cart badge is owned by CustomerPageShell now.
  const { cart, subtotal, shipping, tax, fetchCart, clearCart } = useCart();
  const { user, isAuthenticated } = useSession();
  const { data: addresses = [] } = useAddresses();

  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<FieldName>>(new Set());

  /*
   * Form values are DERIVED, not synced.
   *
   * The profile and the saved address list both arrive asynchronously. Copying
   * them into form state from an effect means an extra render pass every time
   * they land, and a race where a fast typist's input gets overwritten by the
   * late-arriving prefill. Instead we keep only what the user actually typed
   * ("drafts") and fall back to the loaded data underneath — so the fields
   * fill themselves the moment the data appears, and any keystroke wins
   * permanently.
   */
  const [contactDraft, setContactDraft] = useState<Partial<ContactInfo>>({});
  const [draft, setDraft] = useState<Partial<ShippingForm>>({});
  const [addressChoice, setAddressChoice] = useState<string | null>(null);

  const items = useMemo(() => cart?.items ?? [], [cart]);

  const profileName = useMemo(() => {
    if (!isAuthenticated || !user) return { firstName: "", lastName: "" };
    const [firstName = "", ...rest] = user.fullName.split(" ");
    return { firstName, lastName: rest.join(" ") };
  }, [isAuthenticated, user]);

  const contact: ContactInfo = {
    email: contactDraft.email ?? (isAuthenticated ? (user?.email ?? "") : ""),
    phone: contactDraft.phone ?? (isAuthenticated ? (user?.phone ?? "") : ""),
  };

  // No explicit pick yet → fall back to the default saved address.
  const selectedAddressId =
    addressChoice ?? (addresses.find((a) => a.isDefault) ?? addresses[0])?.id ?? "manual";
  const savedFields = useMemo(() => {
    const match = addresses.find((a) => a.id === selectedAddressId);
    return match ? addressLinesToFields(match.lines) : null;
  }, [addresses, selectedAddressId]);

  const form: ShippingForm = {
    firstName: draft.firstName ?? profileName.firstName,
    lastName: draft.lastName ?? profileName.lastName,
    address: draft.address ?? savedFields?.address ?? "",
    apartment: draft.apartment ?? savedFields?.apartment ?? "",
    city: draft.city ?? savedFields?.city ?? "",
    country: draft.country ?? "IE",
    state: draft.state ?? savedFields?.state ?? "",
    postalCode: draft.postalCode ?? savedFields?.postalCode ?? "",
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Direct navigation to /checkout with nothing in the cart. The old version
  // fired a blocking window.alert() from inside an effect.
  useEffect(() => {
    if (cart && cart.items.length === 0) {
      toast.info("Your cart is empty — add something first.");
      router.replace("/products");
    }
  }, [cart, router]);

  /** Switch to a saved address: drop the address-shaped drafts so it shows through. */
  const chooseAddress = (id: string) => {
    setAddressChoice(id);
    setDraft(({ firstName, lastName, country }) => ({ firstName, lastName, country }));
    setErrors((prev) => ({
      ...prev,
      address: undefined,
      city: undefined,
      postalCode: undefined,
    }));
  };

  const setField = (field: keyof ShippingForm, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (touched.has(field)) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, value, form.country) }));
    }
  };

  const setContactField = (field: keyof ContactInfo, value: string) => {
    setContactDraft((prev) => ({ ...prev, [field]: value }));
    if (touched.has(field)) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, value, form.country) }));
    }
  };

  const blur = (field: FieldName, value: string) => {
    setTouched((prev) => new Set(prev).add(field));
    setErrors((prev) => ({ ...prev, [field]: validate(field, value, form.country) }));
  };

  const errorFor = (field: FieldName) => (touched.has(field) ? errors[field] : undefined);

  /**
   * Totals.
   *
   * The old page recomputed shipping as `subtotal > 100 ? 0 : 9.99` and left
   * tax out entirely, so /cart and /checkout showed different totals for the
   * same basket. Standard shipping now comes from the cart (which mirrors the
   * server's pricing) and tax is included.
   */
  const shippingCost = deliveryMethod === "express" ? EXPRESS_SHIPPING : shipping;
  const total = subtotal + shippingCost + tax;

  const deliveryOptions = [
    {
      value: "standard" as const,
      icon: Package,
      title: "Standard Delivery",
      detail: "5–7 business days",
      cost: shipping,
    },
    {
      value: "express" as const,
      icon: Truck,
      title: "Express Delivery",
      detail: "2–3 business days",
      cost: EXPRESS_SHIPPING,
    },
  ];

  const handleConfirmOrder = async () => {
    const nextErrors: FormErrors = {};
    for (const field of REQUIRED_FIELDS) {
      const value =
        field === "email" || field === "phone"
          ? contact[field]
          : form[field as keyof ShippingForm];
      nextErrors[field] = validate(field, value, form.country);
    }

    setErrors(nextErrors);
    setTouched(new Set(REQUIRED_FIELDS));

    const firstInvalid = REQUIRED_FIELDS.find((f) => nextErrors[f]);
    if (firstInvalid) {
      toast.error(nextErrors[firstInvalid]!);
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactInfo: contact,
          shippingAddress: form,
          deliveryMethod,
          items: items.map((item) => ({
            productId: item.productId,
            // Carries the shopper's variant choice onto the order line. Without
            // it the server rejects any product that defines variants, and the
            // warehouse would have no idea which version was bought.
            variantId: item.variantId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            salePrice: item.salePrice,
            image: item.image,
          })),
          subtotal,
          shippingCost,
          total,
          userId: isAuthenticated && user ? user.id : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Failed to create order");
      }

      const result = await response.json();
      const orderId = result.data.orderNumber || result.data.id;

      sessionStorage.setItem("justCompletedCheckout", "true");
      sessionStorage.setItem("recentOrderId", orderId);

      await clearCart();

      // Everyone lands on the confirmation. Guests used to be bounced to
      // /login first and never saw a confirmation at all — the sign-up nudge
      // now lives on the confirmation page itself, after the receipt.
      if (!isAuthenticated) {
        sessionStorage.setItem("pendingOrderId", orderId);
        sessionStorage.setItem("pendingOrderEmail", contact.email);
      }
      router.push(`/order-confirmation/${orderId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't place your order. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CustomerPageShell>
      <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link href="/cart">
              <ChevronLeft className="size-4" aria-hidden />
              Return to Cart
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="gap-0 py-0">
              <div className="border-b border-border px-5 pt-5 pb-4">
                <h2 className="text-base font-semibold tracking-tight">
                  Contact & Shipping
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Where should we send your order?
                </p>
              </div>

              <div className="space-y-5 px-5 py-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    id="email"
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={contact.email}
                    error={errorFor("email")}
                    onChange={(e) => setContactField("email", e.target.value)}
                    onBlur={(e) => blur("email", e.target.value)}
                  />
                  <Field
                    id="phone"
                    label="Phone number"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+353 87 123 4567"
                    value={contact.phone}
                    error={errorFor("phone")}
                    onChange={(e) => setContactField("phone", e.target.value)}
                    onBlur={(e) => blur("phone", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    id="firstName"
                    label="First name"
                    autoComplete="given-name"
                    placeholder="Arthur"
                    value={form.firstName}
                    error={errorFor("firstName")}
                    onChange={(e) => setField("firstName", e.target.value)}
                    onBlur={(e) => blur("firstName", e.target.value)}
                  />
                  <Field
                    id="lastName"
                    label="Last name"
                    autoComplete="family-name"
                    placeholder="Morgan"
                    value={form.lastName}
                    error={errorFor("lastName")}
                    onChange={(e) => setField("lastName", e.target.value)}
                    onBlur={(e) => blur("lastName", e.target.value)}
                  />
                </div>

                {/* Saved addresses fill the fields below rather than replacing
                    them — the old version swapped the Address input out for a
                    <select>, so a signed-in shopper could never edit the street
                    line of a saved address. */}
                {isAuthenticated && addresses.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="savedAddress" className="eyebrow">
                      Use a saved address
                    </Label>
                    <NativeSelect
                      id="savedAddress"
                      className="h-11"
                      value={selectedAddressId}
                      onChange={(e) => chooseAddress(e.target.value)}
                    >
                      <option value="manual">Enter a new address…</option>
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.label || "Address"}
                          {address.isDefault ? " (Default)" : ""} —{" "}
                          {formatAddressLine(address.lines)}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                ) : null}

                <Field
                  id="address"
                  label="Street address"
                  autoComplete="address-line1"
                  placeholder="123 Main Street"
                  value={form.address}
                  error={errorFor("address")}
                  onChange={(e) => {
                    // Editing the street line means they're no longer using a
                    // saved address, so the <select> drops back to "new".
                    setAddressChoice("manual");
                    setField("address", e.target.value);
                  }}
                  onBlur={(e) => blur("address", e.target.value)}
                />

                <Field
                  id="apartment"
                  label="Apartment, suite (optional)"
                  autoComplete="address-line2"
                  placeholder="Apt 4B"
                  value={form.apartment}
                  onChange={(e) => setField("apartment", e.target.value)}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    id="city"
                    label="City"
                    autoComplete="address-level2"
                    placeholder="Dublin"
                    value={form.city}
                    error={errorFor("city")}
                    onChange={(e) => setField("city", e.target.value)}
                    onBlur={(e) => blur("city", e.target.value)}
                  />

                  <div className="space-y-1.5">
                    <Label htmlFor="country" className="eyebrow">
                      Country
                    </Label>
                    <NativeSelect
                      id="country"
                      className="h-11"
                      value={form.country}
                      aria-invalid={errorFor("country") ? true : undefined}
                      onChange={(e) => {
                        const country = e.target.value;
                        setDraft((prev) => ({ ...prev, country }));
                        // Postcode rules are country-specific, so an already
                        // entered code has to be re-checked against the new one.
                        setErrors((prev) => ({
                          ...prev,
                          country: validate("country", country, country),
                          postalCode: touched.has("postalCode")
                            ? validate("postalCode", form.postalCode, country)
                            : prev.postalCode,
                        }));
                      }}
                      onBlur={(e) => blur("country", e.target.value)}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </NativeSelect>
                    {errorFor("country") ? (
                      <p className="text-xs font-medium text-destructive">
                        {errorFor("country")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    id="state"
                    label="State / County (optional)"
                    autoComplete="address-level1"
                    placeholder="Leinster"
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                  />
                  <Field
                    id="postalCode"
                    label="Postal code"
                    autoComplete="postal-code"
                    placeholder={form.country === "IE" ? "D02 XY45" : "Postal code"}
                    value={form.postalCode}
                    error={errorFor("postalCode")}
                    onChange={(e) => setField("postalCode", e.target.value)}
                    onBlur={(e) => blur("postalCode", e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Delivery */}
            <Card className="gap-0 py-0">
              <div className="border-b border-border px-5 pt-5 pb-4">
                <h2 className="text-base font-semibold tracking-tight">Delivery Method</h2>
              </div>

              <div className="px-5 py-5">
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={(value) => setDeliveryMethod(value as DeliveryMethod)}
                  className="gap-3"
                >
                  {deliveryOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = deliveryMethod === option.value;

                    return (
                      <Label
                        key={option.value}
                        htmlFor={`delivery-${option.value}`}
                        className={cn(
                          "flex items-center gap-4 rounded-lg border p-4 transition-colors duration-150",
                          isSelected
                            ? "border-primary bg-muted/50"
                            : "border-border hover:border-primary/40 hover:bg-muted/30",
                        )}
                      >
                        <RadioGroupItem
                          id={`delivery-${option.value}`}
                          value={option.value}
                        />
                        <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                        <div className="flex flex-1 items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{option.title}</p>
                            <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                              {option.detail}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              option.cost === 0 && "text-success",
                            )}
                          >
                            {option.cost === 0 ? "Free" : formatMoney(option.cost)}
                          </span>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
            <Card className="gap-0 py-0">
              <div className="border-b border-border px-5 pt-5 pb-4">
                <h2 className="text-base font-semibold tracking-tight">Order Summary</h2>
              </div>

              {items.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <ul className="max-h-80 space-y-4 overflow-y-auto px-5 py-5">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <ProductImage src={item.image} sizes="64px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                            Qty {item.quantity}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatMoney(item.salePrice * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-3 border-t border-border px-5 py-5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium tabular-nums">{formatMoney(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Shipping</span>
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          shippingCost === 0 && "text-success",
                        )}
                      >
                        {shippingCost === 0 ? "Free" : formatMoney(shippingCost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium tabular-nums">{formatMoney(tax)}</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-4">
                      <span className="text-base font-semibold tracking-tight">Total</span>
                      <span className="text-xl font-semibold tabular-nums">
                        {formatMoney(total)}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <Button
                      size="xl"
                      className="w-full"
                      disabled={isProcessing}
                      onClick={handleConfirmOrder}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Processing…
                        </>
                      ) : (
                        "Confirm Order"
                      )}
                    </Button>

                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="size-3.5" aria-hidden />
                      Secure checkout powered by Stripe
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
    </CustomerPageShell>
  );
}
