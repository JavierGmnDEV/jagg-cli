export type EnvValue<T, Required extends boolean> = Required extends true ? T : T | undefined;

export interface EnvVariable<Required extends boolean = false> {
  required(): EnvVariable<true>;
  default(value: string): EnvVariable<true>;
  asString(): EnvValue<string, Required>;
  asInt(): EnvValue<number, Required>;
  asFloat(): EnvValue<number, Required>;
  asPort(): EnvValue<number, Required>;
  asBool(): EnvValue<boolean, Required>;
  asUrl(): EnvValue<string, Required>;
  asEmail(): EnvValue<string, Required>;
  asEnum<const T extends string>(values: readonly [T, ...T[]]): EnvValue<T, Required>;
  asArray(separator?: string): EnvValue<string[], Required>;
  asJson<T = unknown>(): EnvValue<T, Required>;
}

export interface EnvPort {
  get(key: string): EnvVariable;
}
