import { env } from '{{envImport}}';

export const mongoUrl = env.get('MONGO_URL').required().asString();
