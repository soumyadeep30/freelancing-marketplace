const app = require("./app");
const config = require("./config");

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Fieldwork API listening on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/api/health`);
});
