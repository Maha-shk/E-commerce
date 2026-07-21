import { User, AtSign, Mail, Briefcase, Lock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileField } from "@/components/admin/ProfileField";
import { ProfilePhoto } from "@/components/admin/ProfilePhoto";
import { ChangePasswordCard } from "@/components/admin/ChangePasswordCard";
import { adminProfile } from "@/lib/admin/profile";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Profile"
        subtitle="Manage your personal information, security, and global preferences."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile summary */}
        <Card className="py-0 lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <ProfilePhoto initials={adminProfile.initials} />

            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {adminProfile.name}
              </h2>
              <p className="mt-0.5 text-sm text-subtle">{adminProfile.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal information */}
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-2">
          <div className="border-b px-6 py-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Personal Information
            </h2>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <ProfileField
              label="Full Name"
              id="full-name"
              icon={<User />}
              defaultValue={adminProfile.name}
            />
            <ProfileField
              label="Username"
              id="username"
              icon={<AtSign />}
              defaultValue={adminProfile.username}
            />
            <ProfileField
              label="Email Address"
              id="email"
              type="email"
              icon={<Mail />}
              defaultValue={adminProfile.email}
            />
            <ProfileField
              label="Role"
              id="role"
              icon={<Briefcase />}
              defaultValue={adminProfile.role}
              readOnly
              trailing={<Lock />}
            />
          </div>

          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button variant="outline" size="xl">
              Cancel
            </Button>
            <Button size="xl">Save Changes</Button>
          </div>
        </Card>
      </div>

      {/* Change password */}
      <ChangePasswordCard />
    </div>
  );
}
