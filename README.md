# HTTP server playground

Example code

```js
const app = netio();

app.route("GET", "/", function () {
  return response().ok();
});

app.route("GET", "/user-agent", function ({ request, host, agent }) {
  const clientAgent = agent.split(": ")[1];
  return response().ok(clientAgent);
});

app.route("GET", "/echo", function ({ request, host, agent }) {
  const [method, path, version] = request.split(" ");
  const echodPath = path.split("/echo/")[1];
  return response().ok(echodPath);
});

app.route("GET", "/**", function ({ request, host, agent }) {
  return response().not_found();
});

app.listen("localhost", 4221);
```
