import { CreateUserUseCase } from '{{createUseCaseImport}}';
import { DeleteUserUseCase } from '{{deleteUseCaseImport}}';
import { GetUserByIdUseCase } from '{{getByIdUseCaseImport}}';
import { GetUsersUseCase } from '{{getAllUseCaseImport}}';
import { UpdateUserUseCase } from '{{updateUseCaseImport}}';
import { {{datasourceClass}} } from '{{datasourceImplImport}}';
{{#if hasClient}}
import { {{clientClass}} } from '{{clientImport}}';
{{/if}}
import { UserRepositoryImpl } from '{{repositoryImplImport}}';
{{#if cache}}
import { getCache } from '{{cacheProviderImport}}';
{{/if}}
{{#if metrics}}
import { getMetrics } from '{{metricsProviderImport}}';
import { measured } from '{{measuredImport}}';
{{/if}}
import { UserController } from '{{controllerImport}}';

/** Composition root del módulo: el único sitio que conoce las implementaciones concretas. */
export class UserComposition {
  static createController(): UserController {
    const datasource = new {{datasourceClass}}({{datasourceArgs}});
    const repository = new UserRepositoryImpl(datasource);
{{#if cache}}
    const cache = getCache();
{{/if}}
{{#if metrics}}
    const metrics = getMetrics();
{{/if}}

    return new UserController(
{{useCases}}
    );
  }
}
