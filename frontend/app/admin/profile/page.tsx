"use client";

import { useMemo, useState, type FormEvent } from "react";
import { User, AtSign, Mail, Briefcase, Lock, Loader2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileField } from "@/components/admin/ProfileField";
import { ChangePasswordCard } from "@/components/admin/ChangePasswordCard";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { ErrorState } from "@/components/admin/QueryState";
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-admin";
import { formatDate } from "@/lib/admin/format";

export default function ProfilePage() {
  const { data: profile, isPending, isError, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();

  /*
   * Only the edits live in state; the saved values stay in the query cache.
   *
   * This previously kept three separate `useState`s plus a `syncedId` guard to
   * copy the server values in without clobbering typing. Deriving removes the
   * sync entirely — and `hasChanges` falls out of the draft rather than being
   * a fourth piece of state that could drift.
   */
  const [draft, setDraft] = useState<{ fullName?: string; email?: string }>({});

  const fullName = draft.fullName ?? profile?.fullName ?? "";
  const email = draft.email ?? profile?.email ?? "";

  const hasChanges = useMemo(
    () =>
      Boolean(profile) &&
      ((draft.fullName !== undefined && draft.fullName !== profile!.fullName) ||
        (draft.email !== undefined && draft.email !== profile!.email)),
    [draft, profile],
  );

  const emailChanged = Boolean(profile) && email !== profile!.email;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !hasChanges) return;

    // `username` is deliberately not sent: the API's UpdateProfileDto has no
    // such field and rejects unknown properties.
    // Email is only sent when it actually changed — changing it forces
    // re-verification server-side.
    updateProfile.mutate(
      {
        fullName: fullName.trim(),
        ...(emailChanged && { email }),
      },
      { onSuccess: () => setDraft({}) },
    );
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        {/* Was `text-muted` — a background token used as text colour, which
            rendered as near-invisible pale grey on a pale background. */}
        <span className="text-sm text-muted-foreground">Loading profile…</span>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" subtitle="Manage your account details." />
        <Card className="gap-0 py-0">
          <div className="p-5">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your account details and password."
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Summary */}
        <Card className="gap-0 py-0 lg:col-span-1">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            {/*
             * A real upload. `ProfilePhoto` was explicitly frontend-only — its
             * own comment said "previewed locally, never uploaded" — so an
             * admin could pick a photo, watch it appear, and lose it on the
             * next page load. `AdminProfile.avatarUrl` was never rendered
             * either. This is the same uploader the customer profile uses, and
             * it posts to /auth/me/avatar.
             */}
            <AvatarUploader fullName={profile.fullName} avatarUrl={profile.avatarUrl} />

            <div>
              <h2 className="text-lg font-semibold tracking-tight">{profile.fullName}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{profile.roleLabel}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant={profile.emailVerified ? "success" : "warning"} className="h-6 px-2.5">
                <ShieldCheck className="size-3" aria-hidden />
                {profile.emailVerified ? "Email verified" : "Email unverified"}
              </Badge>
            </div>

            <dl className="w-full space-y-2 border-t border-border pt-4 text-left text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="font-medium">{formatDate(profile.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Active sessions</dt>
                <dd className="font-medium tabular-nums">{profile.activeSessions}</dd>
              </div>
            </dl>
          </div>
        </Card>

        {/* Personal information */}
        <Card className="gap-0 py-0 lg:col-span-2">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-base font-semibold tracking-tight">Personal Information</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your name and sign-in email.
            </p>
          </div>

          <form onSubmit={handleSave}>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <ProfileField
                label="Full name"
                id="full-name"
                icon={<User />}
                value={fullName}
                onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
              />

              {/*
               * Read-only on purpose. This used to be an editable input whose
               * value was silently dropped on save — the API has no `username`
               * field — so an admin could change it, get "Profile updated",
               * and find it reverted.
               */}
              <ProfileField
                label="Username"
                id="username"
                icon={<AtSign />}
                value={profile.username}
                readOnly
                trailing={<Lock />}
              />

              <ProfileField
                label="Email address"
                id="email"
                type="email"
                icon={<Mail />}
                value={email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
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

            {emailChanged ? (
              <div className="mx-6 mb-2 flex items-start gap-2.5 rounded-lg bg-warning-muted px-4 py-3 text-sm text-warning">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                {/* The old page changed email silently; the re-verification
                    consequence was only mentioned in a code comment. */}
                <p>
                  Changing your email signs you out of other sessions and requires you to
                  verify the new address before signing in again.
                </p>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraft({})}
                disabled={!hasChanges || updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!hasChanges || updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {updateProfile.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <ChangePasswordCard />
    </div>
  );
}
