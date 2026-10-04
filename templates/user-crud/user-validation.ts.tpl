const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX_LENGTH = 100;

/** Devuelve el nombre normalizado o un mensaje de error. */
export function validateName(value: unknown): [string] | [undefined, string] {
  if (typeof value !== 'string' || value.trim() === '') return ['El nombre es obligatorio'];
  const name = value.trim();
  if (name.length > NAME_MAX_LENGTH) return [`El nombre no puede superar ${NAME_MAX_LENGTH} caracteres`];
  return [undefined, name];
}

/** Devuelve el email normalizado (minúsculas) o un mensaje de error. */
export function validateEmail(value: unknown): [string] | [undefined, string] {
  if (typeof value !== 'string' || value.trim() === '') return ['El email es obligatorio'];
  const email = value.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) return ['El email no es válido'];
  return [undefined, email];
}
