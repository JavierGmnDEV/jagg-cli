import { EntitySchema } from 'typeorm';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/** EntitySchema en vez de decoradores: el modelo de persistencia queda fuera del dominio y no necesita emitDecoratorMetadata. */
export const UserSchema = new EntitySchema<UserRecord>({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'text' },
    email: { type: 'text', unique: true },
    createdAt: { name: 'created_at', type: 'timestamp', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamp', updateDate: true },
  },
});
