"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { LucideProps } from "lucide-react";
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { PageIntro } from "@/components/customer/PageIntro";
import { SocialLinks } from "@/components/customer/SocialLinks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select-native";

const SUBJECTS = [
  { value: "general", label: "General Inquiry" },
  { value: "order", label: "Order Support" },
  { value: "product", label: "Product Information" },
  { value: "return", label: "Returns & Refunds" },
  { value: "technical", label: "Technical Support" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "other", label: "Other" },
] as const;

const CONTACT_DETAILS = [
  {
    icon: Mail,
    title: "Email",
    lines: ["support@cento.local", "info@cento.local"],
  },
  {
    icon: Phone,
    title: "Phone",
    lines: ["+1 (555) 123-4567", "Mon–Fri, 9am–6pm EST"],
  },
  {
    icon: MapPin,
    title: "Address",
    lines: ["123 Commerce Street", "New York, NY 10001"],
  },
] as const;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  subject: z.string().min(1, "Choose a subject"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be 2000 characters or fewer"),
});

type ContactValues = z.infer<typeof contactSchema>;

function DetailRow({
  icon: Icon,
  title,
  lines,
}: {
  icon: ComponentType<LucideProps>;
  title: string;
  lines: readonly string[];
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {lines.map((line) => (
          <p key={line} className="mt-0.5 text-sm wrap-break-word text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (values: ContactValues) => {
    try {
      // Was hardcoded to http://localhost:4000/api, so the contact form was
      // broken in every deployed environment.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const result = await response.json();
      if (!result.success) throw new Error("Failed to send message");

      toast.success("Thanks — we'll get back to you shortly.");
      reset();
    } catch {
      toast.error("Couldn't send your message. Please try again.");
      // Rethrow so react-hook-form doesn't mark the submit as successful.
      throw new Error("submit failed");
    }
  };

  return (
    <CustomerPageShell>
      <PageIntro
        align="center"
        title="Contact Us"
        description="Have a question or some feedback? Send us a message and we'll respond as soon as we can."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Details */}
        <Card className="gap-0 py-0 lg:col-span-1">
          <div className="p-6">
            <h2 className="text-base font-semibold tracking-tight">Get in Touch</h2>

            <div className="mt-6 space-y-6">
              {CONTACT_DETAILS.map((detail) => (
                <DetailRow key={detail.title} {...detail} />
              ))}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-semibold tracking-tight">Follow Us</h3>
              <SocialLinks
                className="mt-4"
                itemClassName="bg-muted text-muted-foreground hover:bg-orange-500 hover:text-white"
              />
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card className="gap-0 py-0 lg:col-span-2">
          <div className="p-6">
            <h2 className="text-base font-semibold tracking-tight">Send us a Message</h2>

            {isSubmitSuccessful ? (
              <div
                role="status"
                className="mt-5 flex items-start gap-3 rounded-lg bg-success-muted p-4 text-sm text-success"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p className="font-medium">
                  Thanks for your message — we&apos;ll get back to you soon.
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  id="name"
                  label="Full name"
                  placeholder="Arthur Morgan"
                  autoComplete="name"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Field
                  id="email"
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="eyebrow">
                  Subject
                </Label>
                <NativeSelect
                  id="subject"
                  className="h-11"
                  aria-invalid={errors.subject ? true : undefined}
                  {...register("subject")}
                >
                  <option value="">Select a subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject.value} value={subject.value}>
                      {subject.label}
                    </option>
                  ))}
                </NativeSelect>
                {errors.subject ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.subject.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="eyebrow">
                  Message
                </Label>
                <Textarea
                  id="message"
                  rows={6}
                  placeholder="How can we help?"
                  aria-invalid={errors.message ? true : undefined}
                  className="resize-y"
                  {...register("message")}
                />
                {errors.message ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.message.message}
                  </p>
                ) : null}
              </div>

              <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {isSubmitting ? "Sending…" : "Send Message"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              By submitting this form you agree to our{" "}
              <Link href="/privacy" className="text-orange-600 hover:underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-orange-600 hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </Card>
      </div>
    </CustomerPageShell>
  );
}
