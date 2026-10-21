"use client";

import { Button } from "@/components/ui/button";

/** Submit button that asks for confirmation first (used for irreversible admin actions). */
export function ConfirmButton({ message, children, ...props }: { message: string } & React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
