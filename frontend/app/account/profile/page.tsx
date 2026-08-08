"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { SectionCard } from "@/components/account/SectionCard";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  useChangePassword,
  useCurrentUser,
  useSession,
  useUpdateProfile,
} from "@/lib/hooks/use-auth";
import { formatMonthYear } from "@/lib/format";

/** Mirrors the backend `UpdateMeDto`. */
const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Enter your full name")
    .max(120, "Name must be 120 characters or fewer"),
  // Optional on the server, so an empty string is valid here and clears it.
  phone: z.string().max(40, "Phone must be 40 characters or fewer"),
});

/** Mirrors the backend `ChangePasswordDto`, plus a client-only confirm field. */
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72)
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must include an uppercase letter, a lowercase letter and a number",
      ),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "New password must differ from the current one",
    path: ["newPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

/** Read-only "icon · caption · value" cell in the Account Details row. */
function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Shield;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="field-label">{label}</p>
        <div className="mt-1 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useSession();
  useCurrentUser();

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName ?? "",
      phone: user?.phone ?? "",
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  // `AccountShell` already gates on an authenticated customer.
  if (!user) return null;

  const onSaveProfile = (values: ProfileValues) =>
    updateProfile.mutate({
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
    });

  const onChangePassword = (values: PasswordValues) =>
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      { onSuccess: () => passwordForm.reset() },
    );

  const isProfileDirty = profileForm.formState.isDirty;

  return (
    <AccountShell loadingLabel="Loading your profile…" adminRedirect="/admin/profile">
      <AccountPageHeader
        title="Profile"
        description="Update your personal details and account password."
      />

      {/* Profile picture — its own card because it saves on pick, with no
          Save button, unlike the form below. */}
      <SectionCard title="Profile Picture" icon={Camera}>
        <AvatarUploader fullName={user.fullName} avatarUrl={user.avatarUrl} />
      </SectionCard>

      {/* Personal information */}
      <SectionCard title="Personal Information" icon={User}>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Full name"
              id="fullName"
              placeholder="Arthur Morgan"
              autoComplete="name"
              icon={<User />}
              error={profileForm.formState.errors.fullName?.message}
              {...profileForm.register("fullName")}
            />
            <Field
              label="Phone"
              id="phone"
              type="tel"
              placeholder="+353 87 123 4567"
              autoComplete="tel"
              icon={<Phone />}
              error={profileForm.formState.errors.phone?.message}
              {...profileForm.register("phone")}
            />
          </div>

          {/* Email is read-only: changing it has to re-run OTP verification. */}
          <div className="mt-4">
            <Field
              label="Email address"
              id="email"
              type="email"
              value={user.email}
              readOnly
              disabled
              icon={<Mail />}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Your email is used to sign in and can&apos;t be changed here. Contact support
              if you need it updated.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={updateProfile.isPending || !isProfileDirty}>
              {updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {updateProfile.isPending ? "Saving…" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={updateProfile.isPending || !isProfileDirty}
              onClick={() => profileForm.reset()}
            >
              Cancel
            </Button>
            {isProfileDirty && !updateProfile.isPending ? (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            ) : null}
          </div>
        </form>
      </SectionCard>

      {/* Change password */}
      <SectionCard title="Change Password" icon={Lock}>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} noValidate>
          <div className="max-w-md space-y-4">
            <PasswordField
              label="Current password"
              id="currentPassword"
              placeholder="Enter your current password"
              autoComplete="current-password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register("currentPassword")}
            />
            <PasswordField
              label="New password"
              id="newPassword"
              placeholder="Create a new password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register("newPassword")}
            />
            <PasswordField
              label="Confirm new password"
              id="confirmPassword"
              placeholder="Re-enter the new password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register("confirmPassword")}
            />
          </div>

          <div className="mt-6">
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {changePassword.isPending ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Read-only account facts */}
      <SectionCard title="Account Details" icon={Shield}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <DetailItem icon={BadgeCheck} label="Email status">
            <Badge
              variant={user.emailVerified ? "success" : "secondary"}
              className="h-6 px-2.5"
            >
              {user.emailVerified ? "Verified" : "Pending"}
            </Badge>
          </DetailItem>

          <DetailItem icon={Shield} label="Account status">
            <Badge variant="secondary" className="h-6 px-2.5">
              {user.status}
            </Badge>
          </DetailItem>

          <DetailItem icon={CalendarDays} label="Member since">
            {formatMonthYear(user.createdAt)}
          </DetailItem>
        </div>
      </SectionCard>
    </AccountShell>
  );
}
