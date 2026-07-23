import { CreditCard } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { Divider } from "@/components/admin/settings/Divider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { paymentMethods } from "@/lib/admin/settings";

interface PaymentSettingsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function PaymentSettingsSection({ data, onChange }: PaymentSettingsSectionProps) {
  const handleChange = (id: string, value: unknown) => {
    onChange?.(id, value);
  };

  const getValue = (key: string, defaultValue: string) => {
    return (data?.[key] as string) ?? defaultValue;
  };

  const getToggleValue = (key: string, defaultValue: boolean) => {
    const value = data?.[key];
    if (typeof value === "boolean") return value;
    return defaultValue;
  };

  const handlePaymentMethodToggle = (methodId: string, checked: boolean) => {
    handleChange(`payment-method-${methodId}`, checked);
  };

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
              <Switch
                id={`pay-${method.id}`}
                checked={getToggleValue(`payment-method-${method.id}`, method.defaultChecked)}
                onCheckedChange={(checked) => handlePaymentMethodToggle(method.id, checked)}
                className="shrink-0"
              />
            </label>
          );
        })}
      </div>

      <Divider />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Default Payment Method</p>
          <RadioGroup
            value={getValue("default-payment-method", "card")}
            onValueChange={(value) => handleChange("default-payment-method", value)}
          >
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
          value={getValue("transaction-fee", "2.9")}
          onChange={(e) => handleChange("transaction-fee", e.target.value)}
          wrapperClassName="h-fit"
        />
      </div>
    </SettingsSection>
  );
}
