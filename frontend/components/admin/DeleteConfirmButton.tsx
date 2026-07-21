"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteConfirmButtonProps = Omit<ComponentProps<typeof Button>, "onClick" | "title"> & {
  /** Heading for the confirmation dialog. */
  title: string;
  description: ReactNode;
  confirmLabel?: string;
};

/**
 * Trigger button that gates a destructive action behind a confirmation dialog.
 * Used on screens that are still presentation-only, so confirming just closes
 * the dialog — wire an `onConfirm` through when real deletion lands.
 */
export function DeleteConfirmButton({
  title,
  description,
  confirmLabel,
  children,
  ...buttonProps
}: DeleteConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}
