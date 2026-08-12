import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';
import { PlatformScope } from '../tenancy/decorators/platform-scope.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness + DB connectivity probe used by Docker healthchecks.
   *
   * @PlatformScope because a probe must answer regardless of which store the
   * request came from — otherwise an unmapped hostname makes a perfectly
   * healthy container look down.
   */
  @Public()
  @PlatformScope()
  @Get()
  async check() {
    let database = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
