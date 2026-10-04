import '{{loadEnvImport}}';
import { createApp } from '{{appImport}}';

const port = Number(process.env.PORT ?? 3000);

const server = createApp().listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} recibido, cerrando el servidor...`);
  server.close((error) => process.exit(error ? 1 : 0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
