import { Router } from 'express';
import { UserComposition } from '{{compositionImport}}';

const controller = UserComposition.createController();

export const userRoutes: Router = Router();

userRoutes.post('/', controller.create);
userRoutes.get('/', controller.findAll);
userRoutes.get('/:id', controller.findById);
userRoutes.patch('/:id', controller.update);
userRoutes.delete('/:id', controller.delete);
