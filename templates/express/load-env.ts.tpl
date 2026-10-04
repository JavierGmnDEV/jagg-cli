// Se importa primero en main.ts: las configs leen process.env al importarse
try {
  process.loadEnvFile();
} catch {
  // sin archivo .env: se usan las variables del entorno (ej. Docker)
}
