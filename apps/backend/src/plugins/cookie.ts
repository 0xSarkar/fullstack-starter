import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';

export default fp(async (fastify) => {
  await fastify.register(fastifyCookie, {
    secret: fastify.config.COOKIE_SECRET || 'changeme-cookie', // for signed cookies if needed
  });
}, {
  name: 'cookie',
});