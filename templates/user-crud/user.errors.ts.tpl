export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`No existe un usuario con id ${id}`);
    this.name = 'UserNotFoundError';
  }
}

export class EmailAlreadyInUseError extends Error {
  constructor(email: string) {
    super(`El email ${email} ya está registrado`);
    this.name = 'EmailAlreadyInUseError';
  }
}
