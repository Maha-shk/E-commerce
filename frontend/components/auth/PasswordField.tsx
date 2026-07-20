"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/ui/field";

type Props = Omit<ComponentProps<typeof Field>, "type" | "trailing">;

/** Password field with a working show/hide toggle (UI state only). */
export function PasswordField(props: Props) {
  const [show, setShow] = useState(false);

  return (
    <Field
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="flex size-8 items-center justify-center rounded-md text-subtle transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}
