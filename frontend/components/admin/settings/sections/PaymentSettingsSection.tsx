import { CreditCard } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { Divider } from "@/components/admin/settings/Divider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { paymentMethods } from "@/lib/admin/settings";

export function PaymentSettingsSection() {
  return (
    <SettingsSection
      id="payments"
      icon={CreditCard}
      title="Payment Settings"
      description="Choose which payment options are available at checkout."
    >
      <div className="divide-y rounded-lg border">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <label
              key={method.id}
              htmlFor={`pay-${method.id}`}
              className="flex cursor-pointer items-center gap-3.5 p-3.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{method.name}</span>
                <span className="block text-xs text-subtle">{method.description}</span>
              </span>
              <Switch id={`pay-${method.id}`} defaultChecked={method.defaultChecked} className="shrink-0" />
            </label>
          );
        })}
      </div>

      <Divider />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Default Payment Method</p>
          <RadioGroup defaultValue="card">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                htmlFor={`default-${method.id}`}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"
              >
                <RadioGroupItem id={`default-${method.id}`} value={method.id} />
                {method.name}
              </label>
            ))}
          </RadioGroup>
        </div>

        <SettingsField
          id="transaction-fee"
          label="Transaction Fee Percentage"
          type="number"
          trailing="%"
          defaultValue="2.9"
          wrapperClassName="h-fit"
        />
      </div>
    </SettingsSection>
  );
}
