import { validateEmail, validateName } from '{{validationImport}}';

export class CreateUserDto {
  private constructor(
    public readonly name: string,
    public readonly email: string,
  ) {}

  static create(object: Record<string, unknown>): [Error] | [undefined, CreateUserDto] {
    const [nameError, name] = validateName(object.name);
    if (nameError !== undefined) return [new Error(nameError)];

    const [emailError, email] = validateEmail(object.email);
    if (emailError !== undefined) return [new Error(emailError)];

    return [undefined, new CreateUserDto(name, email)];
  }
}
