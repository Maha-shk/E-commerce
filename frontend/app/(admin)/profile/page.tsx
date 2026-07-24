"use client";

import { useState, type FormEvent } from "react";
import { User, AtSign, Mail, Briefcase, Lock, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileField } from "@/components/admin/ProfileField";
import { ProfilePhoto } from "@/components/admin/ProfilePhoto";
import { ChangePasswordCard } from "@/components/admin/ChangePasswordCard";
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-admin";
import type { AdminProfile } from "@/lib/api/models";

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Sync form state with API data
  if (profile && (fullName !== profile.fullName || username !== profile.username || email !== profile.email)) {
    setFullName(profile.fullName);
    setUsername(profile.username);
    setEmail(profile.email);
  }

  const handleFieldChange = (
    field: "fullName" | "username" | "email",
    value: string
  ) => {
    if (field === "fullName") setFullName(value);
    if (field === "username") setUsername(value);
    if (field === "email") setEmail(value);
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.fullName);
      setUsername(profile.username);
      setEmail(profile.email);
    }
    setHasChanges(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !hasChanges) return;

    updateProfile.mutate(
      {
        fullName,
        username,
        email,
      },
      {
        onSuccess: () => {
          setHasChanges(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted" />
        <span className="ml-2 text-muted">Loading profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">
          Failed to load profile. Please try again later.
        </p>
      </div>
    );
  }

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
            <ProfilePhoto initials={profile.initials} />

            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {profile.fullName}
              </h2>
              <p className="mt-0.5 text-sm text-subtle">{profile.roleLabel}</p>
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

          <form onSubmit={handleSave}>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <ProfileField
                label="Full Name"
                id="full-name"
                icon={<User />}
                value={fullName}
                onChange={(e) => handleFieldChange("fullName", e.target.value)}
              />
              <ProfileField
                label="Username"
                id="username"
                icon={<AtSign />}
                value={username}
                onChange={(e) => handleFieldChange("username", e.target.value)}
              />
              <ProfileField
                label="Email Address"
                id="email"
                type="email"
                icon={<Mail />}
                value={email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
              <ProfileField
                label="Role"
                id="role"
                icon={<Briefcase />}
                value={profile.roleLabel}
                readOnly
                trailing={<Lock />}
              />
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                size="xl"
                onClick={handleCancel}
                disabled={!hasChanges || updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="xl"
                disabled={!hasChanges || updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Change password */}
      <ChangePasswordCard />
    </div>
  );
}
