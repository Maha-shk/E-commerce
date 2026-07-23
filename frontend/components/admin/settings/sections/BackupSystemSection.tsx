import { DatabaseBackup, Download, Upload, RotateCcw } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { Divider } from "@/components/admin/settings/Divider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { backupFrequencyOptions, systemInfo } from "@/lib/admin/settings";

interface BackupSystemSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function BackupSystemSection({ data, onChange }: BackupSystemSectionProps) {
  const handleChange = (id: string, value: unknown) => {
    onChange?.(id, value);
  };

  const getValue = (key: string, defaultValue: string) => {
    return (data?.[key] as string) ?? defaultValue;
  };

  return (
    <SettingsSection
      id="backup"
      icon={DatabaseBackup}
      title="Backup & System"
      description="Schedule automatic backups and manage your store's data."
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <SettingsSelectField
          id="backup-frequency"
          label="Backup Frequency"
          options={backupFrequencyOptions}
          value={getValue("backup-frequency", "Daily")}
          onChange={(value) => handleChange("backup-frequency", value)}
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">System Version</p>
          <div className="flex h-11 items-center">
            <Badge variant="navy">{systemInfo.version}</Badge>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Last Backup Date</p>
          <div className="flex h-11 items-center text-sm text-foreground">{systemInfo.lastBackup}</div>
        </div>
      </div>

      <Divider />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline">
          <Download />
          Export Store Data
        </Button>
        <Button type="button" variant="outline">
          <Upload />
          Import Data
        </Button>
        <Button type="button" variant="outline">
          <RotateCcw />
          Restore Backup
        </Button>
      </div>
    </SettingsSection>
  );
}
