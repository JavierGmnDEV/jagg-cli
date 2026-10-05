// Punto de entrada del CLI de TypeORM: carga .env antes de evaluar la configuración
try {
  process.loadEnvFile();
} catch {
  // sin archivo .env: se usan las variables del entorno
}

const { AppDataSource } = await import('{{dataSourceImport}}');

export default AppDataSource;
