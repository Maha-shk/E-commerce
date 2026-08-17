"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicService } from "@/lib/api/services/public";
import { getApiErrorMessage } from "@/lib/api/client";
import { useSession } from "@/lib/hooks/use-auth";

/**
 * "Email me when this is back."
 *
 * Only rendered when the product is out of stock — subscribing to something in
 * stock is a 400, because there would be nothing to wait for.
 *
 * Signed-in shoppers need no input: the server takes the address off the
 * session. Guests type one, so the field only appears for them.
 *
 * Each request is discharged once when the restock email goes out, so after a
 * restock this correctly returns to "Notify me" — a later stock-out does not
 * silently re-use the old subscription.
 */
export function BackInStockNotify({ productId }: { productId: string }) {
  const { isAuthenticated } = useSession();
  const queryClient = useQueryClient();

  /*
   * A guest's address is the lookup key as well as the destination, so the
   * "are you waiting?" question can't be answered until they've typed one.
   * Signed-in shoppers are identified by the session instead.
   */
  const [email, setEmail] = useState("");
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);

  const lookupEmail = isAuthenticated ? undefined : (checkedEmail ?? undefined);
  const canLookup = isAuthenticated || Boolean(checkedEmail);

  const stateKey = ["notify-me", productId, lookupEmail ?? "session"] as const;

  const { data: state, isPending: stateLoading } = useQuery({
    queryKey: stateKey,
    queryFn: () => publicService.getBackInStockState(productId, lookupEmail),
    select: (r) => r.data,
    enabled: canLookup,
  });

  const subscribe = useMutation({
    mutationFn: () =>
      publicService.subscribeBackInStock(
        productId,
        isAuthenticated ? undefined : email.trim(),
      ),
    onSuccess: (r) => {
      // `alreadyWaiting` distinguishes a real subscription from a repeat click,
      // so a no-op doesn't get celebrated as if something happened.
      if (r.data.alreadyWaiting) toast.info("You're already on the list for this one.");
      else toast.success(r.data.message);

      if (!isAuthenticated) setCheckedEmail(email.trim());
      queryClient.invalidateQueries({ queryKey: ["notify-me", productId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const unsubscribe = useMutation({
    mutationFn: () => publicService.unsubscribeBackInStock(productId, lookupEmail),
    onSuccess: () => {
      toast.success("You won't be emailed about this one.");
      queryClient.invalidateQueries({ queryKey: ["notify-me", productId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const waiting = state?.waiting ?? false;
  const busy = subscribe.isPending || unsubscribe.isPending;

  if (waiting) {
    return (
      <div className="space-y-3 rounded-xl border border-success/30 bg-success-muted p-4">
        <p className="flex items-start gap-2 text-sm font-medium text-success">
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          We&rsquo;ll email you the moment this is back in stock.
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => unsubscribe.mutate()}
        >
          {unsubscribe.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Cancel this alert
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <BellRing className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          Out of stock — want to know when it returns?
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          One email when it&rsquo;s back. Nothing else.
        </p>
      </div>

      {isAuthenticated ? (
        <Button
          size="lg"
          className="w-full"
          disabled={busy || stateLoading}
          onClick={() => subscribe.mutate()}
        >
          {subscribe.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <BellRing className="size-4" aria-hidden />
          )}
          Notify me
        </Button>
      ) : (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            subscribe.mutate();
          }}
        >
          <div className="flex-1">
            <Label htmlFor="back-in-stock-email" className="sr-only">
              Email address
            </Label>
            <Input
              id="back-in-stock-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>
          <Button type="submit" size="lg" disabled={busy || !email.trim()}>
            {subscribe.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Notify me
          </Button>
        </form>
      )}
    </div>
  );
}
