import 'dotenv/config';
import Fastify from 'fastify';
// import pinoPretty from 'pino-pretty';
import closeWithGrace from 'close-with-grace';
import app from './app.js';

const isProd = process.env.NODE_ENV === 'production';

const server = Fastify({
  logger: isProd
    ? true
    : {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    }
});

// Register your application as a normal plugin.
await server.register(app);

// delay is the number of milliseconds for the graceful close to finish
closeWithGrace({ delay: Number(process.env.FASTIFY_CLOSE_GRACE_DELAY) || 500 }, async function ({ signal, err, manual }) {
  if (err) {
    server.log.error(err);
  }
  await server.close();
});

// Start listening.
server.listen({ port: Number(process.env.PORT) || 3000 }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
