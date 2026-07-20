import { MapPin, Phone, Pencil, Trash2, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ---- Demo data (placeholder) ---- */
const addresses = [
  {
    label: "Home",
    name: "Arthur Morgan",
    lines: ["1420 Maple Grove Avenue", "Apt 7B", "Boston, MA 02116"],
    phone: "+1 (617) 555-0142",
    isDefault: true,
  },
  {
    label: "Office",
    name: "Arthur Morgan",
    lines: ["88 Beacon Street, Floor 12", "Suite 1204", "Boston, MA 02108"],
    phone: "+1 (617) 555-0199",
    isDefault: false,
  },
  {
    label: "Family",
    name: "Mary Linton",
    lines: ["27 Birchwood Lane", "Cambridge, MA 02139"],
    phone: "+1 (617) 555-0177",
    isDefault: false,
  },
];

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Address Book"
        subtitle="Manage your shipping and billing addresses."
        action={
          <Button size="xl">
            <Plus />
            Add address
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {addresses.map((address) => (
          <Card key={`${address.label}-${address.name}`}>
            <CardContent className="flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                    <MapPin className="size-5" />
                  </span>
                  <Badge variant="navy">{address.label}</Badge>
                </span>
                {address.isDefault && <Badge variant="success">Default</Badge>}
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-foreground">{address.name}</p>
                <address className="mt-1 text-sm not-italic leading-relaxed text-muted-foreground">
                  {address.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-4 text-subtle" />
                  {address.phone}
                </p>
              </div>
            </CardContent>

            <CardFooter className="gap-2 border-t bg-transparent">
              <Button variant="outline" size="sm">
                <Pencil />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-subtle hover:text-destructive">
                <Trash2 />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}

        {/* Add-new tile */}
        <button className="flex min-h-55 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card/50 p-6 text-subtle transition-colors hover:border-primary/30 hover:bg-muted hover:text-primary">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Plus className="size-6" />
          </span>
          <span className="text-sm font-semibold">Add a new address</span>
        </button>
      </div>
    </div>
  );
}
