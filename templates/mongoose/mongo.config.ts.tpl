function readMongoUrl(): string {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error('La variable de entorno MONGO_URL no está definida');
  return url;
}

export const mongoUrl = readMongoUrl();
