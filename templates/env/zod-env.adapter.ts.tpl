import { z } from 'zod';
import type { EnvPort, EnvValue, EnvVariable } from '{{portImport}}';
import { EnvValidationError } from '{{errorImport}}';

const TRUTHY = ['true', '1', 'yes', 'on'];
const FALSY = ['false', '0', 'no', 'off'];

class ZodEnvVariable<Required extends boolean> implements EnvVariable<Required> {
  constructor(
    private readonly key: string,
    private readonly raw: string | undefined,
    private readonly isRequired = false,
    private readonly fallback?: string,
  ) {}

  required(): EnvVariable<true> {
    return new ZodEnvVariable<true>(this.key, this.raw, true, this.fallback);
  }

  default(value: string): EnvVariable<true> {
    return new ZodEnvVariable<true>(this.key, this.raw, this.isRequired, value);
  }

  asString() {
    return this.parse(z.string());
  }

  asInt() {
    return this.parse(z.string().trim().regex(/^-?\d+$/, 'debe ser un entero').transform(Number));
  }

  asFloat() {
    return this.parse(z.coerce.number());
  }

  asPort() {
    return this.parse(z.coerce.number().int().min(1).max(65535));
  }

  asBool() {
    return this.parse(
      z
        .string()
        .trim()
        .toLowerCase()
        .pipe(z.enum([...TRUTHY, ...FALSY]))
        .transform((value) => TRUTHY.includes(value)),
    );
  }

  asUrl() {
    return this.parse(z.url());
  }

  asEmail() {
    return this.parse(z.email());
  }

  asEnum<const T extends string>(values: readonly [T, ...T[]]): EnvValue<T, Required> {
    return this.parse(z.enum(values));
  }

  asArray(separator = ',') {
    return this.parse(
      z.string().transform((value) =>
        value
          .split(separator)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }

  asJson<T = unknown>(): EnvValue<T, Required> {
    return this.parse(
      z.string().transform((value, ctx): T => {
        try {
          return JSON.parse(value) as T;
        } catch {
          ctx.addIssue({ code: 'custom', message: 'debe ser JSON válido' });
          return z.NEVER;
        }
      }),
    );
  }

  private parse<S extends z.ZodType>(schema: S): EnvValue<z.output<S>, Required> {
    // Un string vacío ("KEY=") cuenta como no definido, igual que en env-var
    const value = this.raw === undefined || this.raw === '' ? this.fallback : this.raw;
    if (value === undefined) {
      if (this.isRequired) throw new EnvValidationError(this.key, 'es requerida');
      return undefined as EnvValue<z.output<S>, Required>;
    }

    const result = schema.safeParse(value);
    if (!result.success) {
      throw new EnvValidationError(this.key, result.error.issues.map((i) => i.message).join(', '));
    }
    return result.data as EnvValue<z.output<S>, Required>;
  }
}

export class ZodEnvAdapter implements EnvPort {
  constructor(private readonly source: Record<string, string | undefined> = process.env) {}

  get(key: string): EnvVariable {
    return new ZodEnvVariable<false>(key, this.source[key]);
  }
}
