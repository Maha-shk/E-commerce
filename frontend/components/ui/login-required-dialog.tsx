"use client";

import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "add to wishlist" | "add to cart";
}

export function LoginRequiredDialog({ open, onOpenChange, action }: LoginRequiredDialogProps) {
  const router = useRouter();

  const handleLogin = () => {
    onOpenChange(false);
    router.push('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">Login Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to {action}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleLogin} size="xl" className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            Go to Login
          </Button>
          <Button
            variant="outline"
            size="xl"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
