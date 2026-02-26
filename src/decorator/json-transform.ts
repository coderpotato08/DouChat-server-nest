import { JSON_TRANSFORM_METADATA_KEY } from '../constants/meta-data';
import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { ClassConstructor, ClassTransformOptions } from 'class-transformer';

/**
 * @example
 * ```Typescript
 * @JsonTransform(MenuModule, {})
 * ```
 * @param schema Class constructor
 */
export const JsonTransform = (
  schema: ClassConstructor<unknown>,
  options?: ClassTransformOptions,
): CustomDecorator<string> => {
  return SetMetadata(JSON_TRANSFORM_METADATA_KEY, [schema, options]);
};
