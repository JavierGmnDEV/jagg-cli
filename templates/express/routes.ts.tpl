import { Router } from 'express';
import { healthRoutes } from '{{healthRoutesImport}}';

export const routes: Router = Router();

routes.use('/health', healthRoutes);
