import { createApp } from './app';
import { env } from './config/env';
import { disconnectPrisma, prisma } from './lib/prisma';

async function main(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      '\n[db] No se pudo conectar a PostgreSQL. Verifica que la base esté levantada ' +
        '(docker compose up -d) y que DATABASE_URL sea correcta.\n',
      error,
    );
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`\n  API lista en http://localhost:${env.PORT}/api`);
    // eslint-disable-next-line no-console
    console.log(`  Orígenes permitidos: ${env.allowedOrigins.join(', ')}\n`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n[server] ${signal} recibido, cerrando...`);
    server.close(() => undefined);
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
