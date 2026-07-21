"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DateField } from "@/components/admin/DateField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";

const labelClass = "text-sm font-medium text-muted-foreground";
const fieldClass = "h-11 rounded-lg bg-muted/40";

const reportTypes = [
  "Sales Summary",
  "Orders Report",
  "Inventory Report",
  "Customer Report",
  "Discounts Report",
];
const frequencies = ["Daily", "Weekly", "Monthly", "Quarterly"];
const formats = ["PDF", "CSV", "Excel"];

/**
 * "Schedule Report" trigger + modal. UI only — the form is a static template
 * and nothing is persisted; both actions simply close the dialog.
 */
export function ScheduleReportButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button variant="outline" size="icon-lg" aria-label="Schedule report">
            <CalendarClock className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="xl">
            <CalendarClock />
            Schedule Report
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="gap-0 sm:max-w-xl sm:p-6">
        <div className="space-y-5">
          <DialogHeader className="text-left">
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Set up an automated report delivered straight to your inbox.
            </DialogDescription>
          </DialogHeader>

          {/* Report type */}
          <div className="space-y-2">
            <label htmlFor="report-type" className={labelClass}>
              Report Type
            </label>
            <NativeSelect id="report-type" className={fieldClass} defaultValue="Sales Summary">
              {reportTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          </div>

          {/* Frequency + format */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="report-frequency" className={labelClass}>
                Frequency
              </label>
              <NativeSelect id="report-frequency" className={fieldClass} defaultValue="Weekly">
                {frequencies.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <label htmlFor="report-format" className={labelClass}>
                Delivery Format
              </label>
              <NativeSelect id="report-format" className={fieldClass} defaultValue="PDF">
                {formats.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateField id="report-start" label="From" value={startDate} onChange={setStartDate} />
            <DateField id="report-end" label="To" value={endDate} onChange={setEndDate} />
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <label htmlFor="report-recipient" className={labelClass}>
              Recipient Email
            </label>
            <Input
              id="report-recipient"
              type="email"
              className={fieldClass}
              defaultValue="admin@centoservizi.com"
              placeholder="name@centoservizi.com"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="xl">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="button" size="xl">
                <CalendarClock />
                Schedule Report
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
