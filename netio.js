const net = require("node:net");

const PROTOCOL = "HTTP/1.1";
const CRLF = "\r\n";

function response() {
  return {
    ok: function (message) {
      return (
        `${PROTOCOL} 200 OK\r\n` +
        "Content-Type: text/plain\r\n" +
        (message
          ? `Content-Length: ${message.length}\r\n\r\n${message}`
          : "\r\n\r\n")
      );
    },
    not_found: function () {
      return (
        `${PROTOCOL} 404 Not Found\r\n` + "Content-Type: text/plain\r\n\r\n"
      );
    },
  };
}

function netio() {
  const routes = {};

  const server = net
    .createServer()
    .on("connection", function (socket) {
      socket.on("data", function (data) {
        // console.log(data.toString());

        const [request, host, agent] = data.toString().split(CRLF);
        const [method, path, version] = request.split(" ");

        const parentRoute = path === "/" ? "/" : path.split("/")[1];
        const route = routes[parentRoute];

        // console.log(parentRoute);
        // console.log(routes);

        if (route) {
          socket.write(route.callback({ request, host, agent }));
          socket.end();
        } else {
          socket.write(response().not_found());
          socket.end();
        }
      });
    })
    .on("error", function (error) {
      console.log("Error occured", error);
    });

  return {
    route: function (method, path, callback) {
      const parentRoute = path === "/" ? "/" : path.split("/")[1];
      routes[parentRoute] = { method, path, callback };
    },

    listen: function (host, port) {
      server.listen(port, host);
    },
  };
}

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

// const PORT_NUMBER = 4221;
// const server = net.createServer();

// server.on("connection", function (socket) {
//   socket.on("data", function (data) {
//     const [request, host, agent] = data.toString().split(CRLF);
//     const [method, path, version] = request.split(" ");
//     const clientAgent = agent.split(": ")[1];

//     if (path === "/" || path.startsWith("/user-agent")) {
//       const response =
//         `${PROTOCOL} 200 OK\r\n` +
//         "Content-Type: text/plain\r\n" +
//         `Content-Length: ${clientAgent.length}\r\n\r\n` +
//         `${clientAgent}`;

//       socket.write(response);
//     } else if (path.startsWith("/echo/")) {
//       const text = path.split("/echo/")[1];

//       const response =
//         `${PROTOCOL} 200 OK\r\n` +
//         "Content-Type: text/plain\r\n" +
//         `Content-Length: ${text.length}\r\n\r\n` +
//         `${text}\r\n`;

//       socket.write(response);
//     } else {
//       const response =
//         `${PROTOCOL} 404 Not Found\r\n` + "Content-Type: text/plain\r\n\r\n";
//       socket.write(response);
//     }

//     // if (path === "/") {
//     //   socket.write(`${PROTOCOL} 200 OK\r\n\r\n`);
//     // } else if (path.startsWith("/echo/")) {
//     //   const text = path.split("/echo/")[1];

//     //   const response =
//     //     `${PROTOCOL} 200 OK\r\n` +
//     //     "Content-Type: text/plain\r\n" +
//     //     `Content-Length: ${text.length}\r\n\r\n` +
//     //     `${text}\r\n`;

//     //   socket.write(response);
//     // } else {
//     //   const response =
//     //     `${PROTOCOL} 404 Not Found\r\n` + "Content-Type: text/plain\r\n\r\n";
//     //   socket.write(response);
//     // }

//     socket.end();
//   });
// });

// server.on("error", function (error) {
//   console.log("Server error", error);
// });

// server.listen(PORT_NUMBER, "localhost");
