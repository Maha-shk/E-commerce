import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SETTINGS, SETTING_KEYS, SettingKey } from './settings.defaults';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns every settings section, falling back to the documented defaults
   * for any key that has never been saved.
   */
  async findAll() {
    const rows = await this.prisma.setting.findMany();
    const stored = new Map(rows.map((r) => [r.key, r.value]));

    const result: Record<string, unknown> = {};
    for (const key of SETTING_KEYS) {
      result[key] = stored.get(key) ?? DEFAULT_SETTINGS[key];
    }
    return result;
  }

  async findOne(key: string) {
    this.assertKnownKey(key);
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return { key, value: row?.value ?? DEFAULT_SETTINGS[key as SettingKey] };
  }

  /** Upserts a single section. */
  async update(key: string, value: Prisma.InputJsonValue) {
    this.assertKnownKey(key);
    const row = await this.prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    return { key: row.key, value: row.value, updatedAt: row.updatedAt };
  }

  /** Upserts several sections at once (the Settings screen saves in bulk). */
  async updateMany(payload: Record<string, Prisma.InputJsonValue>) {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('No settings supplied');
    }
    keys.forEach((k) => this.assertKnownKey(k));

    await this.prisma.$transaction(
      keys.map((key) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value: payload[key] },
          update: { value: payload[key] },
        }),
      ),
    );

    return this.findAll();
  }

  /** Restores a section to its shipped default. */
  async reset(key: string) {
    this.assertKnownKey(key);
    await this.prisma.setting.deleteMany({ where: { key } });
    return { key, value: DEFAULT_SETTINGS[key as SettingKey] };
  }

  private assertKnownKey(key: string) {
    if (!SETTING_KEYS.includes(key as SettingKey)) {
      throw new BadRequestException(
        `Unknown settings key "${key}". Valid keys: ${SETTING_KEYS.join(', ')}`,
      );
    }
  }
}
