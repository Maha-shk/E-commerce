import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import {
  CATALOG_LEVELS,
  CatalogLevelSpec,
  specForSegment,
} from './catalog.constants';

/**
 * Turns the `:level` URL segment into the spec that drives every hierarchy
 * rule, so the controllers never branch on which level they are serving.
 */
@Injectable()
export class CatalogLevelPipe implements PipeTransform<string, CatalogLevelSpec> {
  transform(value: string): CatalogLevelSpec {
    const spec = specForSegment(value);
    if (!spec) {
      throw new NotFoundException(
        `Unknown catalog level "${value}". Expected one of: ` +
          CATALOG_LEVELS.map((s) => s.segment).join(', '),
      );
    }
    return spec;
  }
}
