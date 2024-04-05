const net = require("node:net");
const fs = require("node:fs");

/**
 * Callback function that gets called when a specific request path is triggered.
 *
 * @callback RouteCallback
 * @param {RequestData} data - The request data object containing details about the request.
 * @returns {string} The response data to be sent back to the client.
 */

/**
 * Interface representing the structure of a request data object.
 *
 * @typedef {Object} RequestData
 * @property {string} request - Contains the HTTP method, path, and version (e.g., GET /user-agent HTTP/1.1).
 * @property {string} host - The hostname of the client that sent the request.
 * @property {string} agent - The user agent used by the client to send the request (e.g., browser, curl).
 * @property {string} body - The content of the request body (for POST requests).
 */

const PROTOCOL = "HTTP/1.1";
const CRLF = "\r\n";

/**
 * Helper function to create different HTTP response messages.
 *
 * @returns - An object containing methods for generating various HTTP response messages.
 */
function response() {
  return {
    /**
     * Creates a successful response message (status code 200 OK).
     *
     * @param {string} message - The message body to include in the response.
     * @param {Object} headers - An object containing additional headers to send with the response.
     * @returns {string} The formatted HTTP response message.
     */
    ok: function (message, headers) {
      return (
        `${PROTOCOL} 200 OK\r\n` +
        Object.keys(headers).map(
          (header) => `${header}: ${headers[header]}${CRLF}`
        ) +
        (message
          ? `Content-Length: ${message.length}\r\n\r\n` + message
          : "\r\n\r\n")
      );
    },

    /**
     * Creates a response message for a resource that was successfully created (status code 201 Created).
     *
     * @returns {string} The formatted HTTP response message.
     */
    created: function () {
      return `${PROTOCOL} 201 Created\r\n\r\n`;
    },

    /**
     * Creates a response message for a resource that was not found (status code 404 Not Found).
     *
     * @returns {string} The formatted HTTP response message.
     */
    not_found: function () {
      return `${PROTOCOL} 404 Not Found\r\n\r\n`;
    },
  };
}

/**
 * Function that creates a basic framework for a web server.
 *
 * @returns - An object containing methods for defining routes and starting the server.
 */
function framework() {
  const routes = {
    GET: {},
    POST: {},
    PUT: {},
    DELETE: {},
  };

  const server = net
    .createServer()
    .on("connection", function (socket) {
      socket.on("data", function (data) {
        const [headers, body] = data.toString().split(CRLF + CRLF);
        const [request, host, agent] = headers.toString().split(CRLF);
        const [method, path, version] = request.split(" ");

        const parentRoute = path === "/" ? "/" : path.split("/")[1];
        const route = routes[method][parentRoute];

        if (route) {
          socket.write(route.callback({ request, host, agent, body }));
          socket.end();
        } else {
          socket.write(response().not_found());
          socket.end();
        }
      });
    })
    .on("error", function (error) {
      console.log("Error occurred", error);
    });

  return {
    /**
     * Defines a route handler for a specific HTTP method and path.
     *
     * @param {"GET" | "POST" | "PUT" | "DELETE"} method - The HTTP method for the route (GET, POST, PUT, or DELETE).
     * @param {string} path - The path of the route (e.g., "/user-agent").
     * @param {RouteCallback} callback - The function to be called when the route is matched.
     */
    route: function (method, path, callback) {
      const parentRoute = path === "/" ? "/" : path.split("/")[1];
      routes[method.toUpperCase()][parentRoute] = { method, path, callback };
    },

    /**
     * Starts the server listening on a specified port and hostname.
     *
     * @param {string} host - The hostname or IP address to listen on.
     * @param {number} port - The port number to listen on.
     */
    listen: function (host, port) {
      server.listen(port, host);
    },
  };
}

const app = framework();

// Define routes
app.route("GET", "/", function () {
  return response().ok(null, { "Content-Type": "text/plain" });
});

app.route("GET", "/user-agent", function ({ request, host, agent }) {
  const clientAgent = agent.split(": ")[1];
  return response().ok(clientAgent, { "Content-Type": "text/plain" });
});

app.route("GET", "/echo", function ({ request, host, agent }) {
  const [method, path, version] = request.split(" ");
  const echoedPath = path.split("/echo/")[1];
  return response().ok(echoedPath, { "Content-Type": "text/plain" });
});

app.route("GET", "/files", function ({ request, host, agent }) {
  const [method, path, version] = request.split(" ");
  const filename = path.split("/files/")[1];
  try {
    const fileContent = fs.readFileSync(process.argv[3] + "/" + filename);

    return response().ok(fileContent, {
      "Content-Type": "application/octet-stream",
    });
  } catch (e) {
    return response().not_found();
  }
});

app.route("POST", "/files", function ({ request, host, agent, body }) {
  const [method, path, version] = request.split(" ");
  const filename = path.split("/files/")[1];
  try {
    fs.writeFileSync(process.argv[3] + "/" + filename, body);

    return response().created();
  } catch (e) {
    return response().not_found();
  }
});

app.route("GET", "/**", function ({ request, host, agent }) {
  return response().not_found();
});

// Start server
app.listen("localhost", 4221);
