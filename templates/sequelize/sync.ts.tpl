// Solo desarrollo: crea las tablas que falten a partir de los modelos.
// En producción usa migraciones (sequelize-cli o umzug).
try {
  process.loadEnvFile();
} catch {
  // sin archivo .env: se usan las variables del entorno
}

const { SequelizeDatabase } = await import('{{clientImport}}');

const sequelize = SequelizeDatabase.getInstance();
await sequelize.sync();
console.log('Tablas sincronizadas:', Object.keys(sequelize.models).join(', '));
await SequelizeDatabase.disconnect();

export {};
