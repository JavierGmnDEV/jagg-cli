function readDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('La variable de entorno DATABASE_URL no está definida');
  return url;
}

export const databaseUrl = readDatabaseUrl();
