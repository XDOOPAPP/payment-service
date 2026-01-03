const app = require("./src/app");
const connectDB = require("./src/config/database");
const env = require("./src/config/env");
const EventBus = require("./src/infra/event-bus/event-bus");
const paymentRoutes = require("./src/routes/payment.route");
const errorHandler = require("./src/middlewares/errorHandler.middleware");

(async () => {
  // 1. connect database
  await connectDB();

  // 2. connect event bus
  const bus = new EventBus(env.rabbitMQ_url);
  await bus.connect();

  // 3. inject bus for app
  app.set("eventBus", bus);

  // 4. user route
  app.use("/api/v1/payments", paymentRoutes(app));

  // 5. error handler
  app.use(errorHandler);

  // 6. start server
  app.listen(env.port, () => {
    console.log(`Payment Service running on port ${env.port}`);
  });
})();
