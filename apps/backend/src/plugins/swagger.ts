import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Fullstack Starter API",
        description: "API documentation for Fullstack Starter Backend",
        version: "1.0.0",
      },
    },
  });

  // This adds the `/docs` UI and `/docs/json`
  await fastify.register(swaggerUi, {
    routePrefix: "/docs",   // UI at /docs
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
});
