import type { Request, Response } from 'express';
import { CreateUserDto } from '{{createDtoImport}}';
import { UpdateUserDto } from '{{updateDtoImport}}';
import { EmailAlreadyInUseError, UserNotFoundError } from '{{errorsImport}}';
import type { CreateUserUseCase } from '{{createUseCaseImport}}';
import type { DeleteUserUseCase } from '{{deleteUseCaseImport}}';
import type { GetUserByIdUseCase } from '{{getByIdUseCaseImport}}';
import type { GetUsersUseCase } from '{{getAllUseCaseImport}}';
import type { UpdateUserUseCase } from '{{updateUseCaseImport}}';
import { HttpError } from '{{httpErrorImport}}';

type IdParams = { id: string };

/** Traduce errores de dominio a HTTP; el resto llega al error handler como 500. */
async function handleDomainErrors<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof UserNotFoundError) throw HttpError.notFound(error.message);
    if (error instanceof EmailAlreadyInUseError) throw HttpError.conflict(error.message);
    throw error;
  }
}

export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUsers: GetUsersUseCase,
    private readonly getUserById: GetUserByIdUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const [error, dto] = CreateUserDto.create(req.body ?? {});
    if (error) throw HttpError.badRequest(error.message);
    res.status(201).json(await handleDomainErrors(() => this.createUser.execute(dto)));
  };

  findAll = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.getUsers.execute());
  };

  findById = async (req: Request<IdParams>, res: Response): Promise<void> => {
    res.json(await handleDomainErrors(() => this.getUserById.execute(req.params.id)));
  };

  update = async (req: Request<IdParams>, res: Response): Promise<void> => {
    const [error, dto] = UpdateUserDto.create({ ...req.body, id: req.params.id });
    if (error) throw HttpError.badRequest(error.message);
    res.json(await handleDomainErrors(() => this.updateUser.execute(dto)));
  };

  delete = async (req: Request<IdParams>, res: Response): Promise<void> => {
    await handleDomainErrors(() => this.deleteUser.execute(req.params.id));
    res.status(204).end();
  };
}
