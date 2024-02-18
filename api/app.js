const http = require("http");
const url = require("url");
const querystring = require("querystring");

// Dictionary storage
const dictionary = [];
let requestCount = 0;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const path = parsedUrl.pathname;
  const queryString = querystring.parse(parsedUrl.query);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Increment request count for each API call
  requestCount++;

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === "/api/definitions/" && req.method === "GET") {
    // Search for a word definition
    const word = queryString.word.toLowerCase();
    const definition = dictionary.find((entry) => entry.word === word);
    if (definition) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          requestNumber: requestCount,
          definition: definition,
        })
      );
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          requestNumber: requestCount,
          message: `Word '${word}' not found.`,
        })
      );
    }
  } else if (path === "/api/definitions" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const { word, definition } = JSON.parse(body);
      const wordExists = dictionary.some(
        (entry) => entry.word === word.toLowerCase()
      );
      if (!wordExists) {
        dictionary.push({ word: word.toLowerCase(), definition });
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            requestNumber: requestCount,
            totalEntries: dictionary.length,
            message: `New entry recorded: '${word} : ${definition}'`,
          })
        );
      } else {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            requestNumber: requestCount,
            message: `Warning! '${word}' already exists.`,
          })
        );
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Endpoint not found.",
      })
    );
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));