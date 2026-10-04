import { validateEmail, validateName } from '{{validationImport}}';

/** Actualización parcial: llega al menos uno de los campos. */
export class UpdateUserDto {
  private constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly email?: string,
  ) {}

  get changes(): { name?: string; email?: string } {
    return {
      ...(this.name !== undefined && { name: this.name }),
      ...(this.email !== undefined && { email: this.email }),
    };
  }

  static create(object: Record<string, unknown>): [Error] | [undefined, UpdateUserDto] {
    const { id } = object;
    if (typeof id !== 'string' || id.trim() === '') return [new Error('El id es obligatorio')];
    if (object.name === undefined && object.email === undefined) {
      return [new Error('Envía al menos un campo a actualizar: name o email')];
    }

    let name: string | undefined;
    if (object.name !== undefined) {
      const [error, value] = validateName(object.name);
      if (error !== undefined) return [new Error(error)];
      name = value;
    }

    let email: string | undefined;
    if (object.email !== undefined) {
      const [error, value] = validateEmail(object.email);
      if (error !== undefined) return [new Error(error)];
      email = value;
    }

    return [undefined, new UpdateUserDto(id, name, email)];
  }
}
