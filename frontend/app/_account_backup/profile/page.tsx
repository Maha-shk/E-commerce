import { ShieldCheck, Pencil, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

const preferences = [
  { id: "pref-orders", label: "Order updates", desc: "Delivery status and shipping notifications", on: true },
  { id: "pref-promos", label: "Promotions & offers", desc: "Members-only deals and early access", on: true },
  { id: "pref-recs", label: "Product recommendations", desc: "Suggestions based on your activity", on: false },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Update your personal details and account security." />

      {/* Summary */}
      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            <AvatarFallback className="bg-primary font-display text-2xl font-semibold text-primary-foreground">
              AM
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-foreground">Arthur Morgan</h2>
              <Badge variant="success">
                <ShieldCheck className="size-3.5" />
                Verified
              </Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="size-4 text-subtle" />
                arthur.morgan@example.com
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="size-4 text-subtle" />
                +1 (617) 555-0142
              </span>
            </div>
            <p className="mt-1 text-xs text-subtle">Member since March 2024</p>
          </div>
          <Button variant="outline" size="lg">
            <Pencil />
            Change photo
          </Button>
        </CardContent>
      </Card>

      {/* Personal information */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Full name" id="fullName" defaultValue="Arthur Morgan" placeholder="Your full name" />
            <Field
              label="Email address"
              id="email"
              type="email"
              defaultValue="arthur.morgan@example.com"
              placeholder="name@domain.com"
              icon={<Mail />}
            />
            <Field
              label="Phone number"
              id="phone"
              defaultValue="+1 (617) 555-0142"
              placeholder="+1 (000) 000-0000"
              icon={<Phone />}
            />
            <Field label="Date of birth" id="dob" type="date" defaultValue="1990-06-12" />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button variant="ghost" size="xl" type="reset">
                Cancel
              </Button>
              <Button size="xl" type="submit">
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Current password"
              id="currentPassword"
              type="password"
              defaultValue="password"
              wrapperClassName="sm:col-span-2"
            />
            <Field label="New password" id="newPassword" type="password" placeholder="Minimum 12 characters" />
            <Field label="Confirm password" id="confirmPassword" type="password" placeholder="Re-enter new password" />
            <div className="flex justify-end sm:col-span-2">
              <Button size="xl" type="submit">
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {preferences.map((pref) => (
            <div key={pref.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-foreground">{pref.label}</p>
                <p className="text-xs text-subtle">{pref.desc}</p>
              </div>
              <Switch defaultChecked={pref.on} aria-label={pref.label} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
