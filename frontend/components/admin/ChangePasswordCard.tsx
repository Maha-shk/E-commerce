"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileField } from "@/components/admin/ProfileField";

/** Frontend-only change password form — nothing is submitted yet. */
export function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Frontend-only for now — no backend to persist to yet.
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between gap-3 border-b px-6 py-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <ShieldCheck className="size-5 text-primary" />
          Change Password
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setReveal((v) => !v)}
          aria-pressed={reveal}
        >
          {reveal ? <EyeOff /> : <Eye />}
          {reveal ? "Hide" : "Show"}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <ProfileField
            label="Current Password"
            id="current-password"
            type={reveal ? "text" : "password"}
            icon={<Lock />}
            autoComplete="current-password"
            placeholder="Enter current password"
            wrapperClassName="sm:col-span-2"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />

          <div className="space-y-1">
            <ProfileField
              label="New Password"
              id="new-password"
              type={reveal ? "text" : "password"}
              icon={<KeyRound />}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={tooShort || undefined}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            {tooShort && (
              <p className="text-xs font-medium text-destructive">
                Use at least 8 characters.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <ProfileField
              label="Confirm New Password"
              id="confirm-password"
              type={reveal ? "text" : "password"}
              icon={<KeyRound />}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              aria-invalid={mismatch || undefined}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {mismatch && (
              <p className="text-xs font-medium text-destructive">Passwords do not match.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="xl"
            onClick={() => {
              setCurrent("");
              setNext("");
              setConfirm("");
            }}
          >
            Cancel
          </Button>
          <Button type="submit" size="xl" disabled={!canSubmit}>
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
}
