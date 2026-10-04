import '{{loadEnvImport}}';
import { appConfig } from '{{appConfigImport}}';
import { createApp } from '{{appImport}}';

const server = createApp().listen(appConfig.port, () => {
  console.log(`Servidor escuchando en http://localhost:${appConfig.port} (${appConfig.nodeEnv})`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} recibido, cerrando el servidor...`);
  server.close((error) => process.exit(error ? 1 : 0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
