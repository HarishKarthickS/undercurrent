export async function registerAuthenticatedRoutes(app, { identity, registerRoutes }) {
  await app.register(async (protectedApp) => {
    protectedApp.addHook('preHandler', async (request) => {
      request.parentSession = await identity.requireParent(request);
    });
    await registerRoutes(protectedApp);
  });
}
