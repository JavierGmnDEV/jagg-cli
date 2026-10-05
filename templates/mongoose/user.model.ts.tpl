import { type Connection, type Model, Schema, type Types } from 'mongoose';

export interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { collection: 'users', timestamps: true, versionKey: false },
);

export type UserModel = Model<UserDocument>;

/** Reutiliza el modelo si ya está registrado en la conexión (evita OverwriteModelError). */
export function getUserModel(connection: Connection): UserModel {
  return (connection.models.User as UserModel | undefined) ?? connection.model<UserDocument>('User', userSchema);
}
