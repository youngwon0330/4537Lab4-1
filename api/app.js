const httpLib = require("http");
const urlLib = require("url");
const queryStringLib = require("querystring");

// Storage for word definitions
const wordBank = [];
let apiCallCount = 0;

const webServer = httpLib.createServer((request, response) => {
  const urlParsed = urlLib.parse(request.url);
  const endpoint = urlParsed.pathname;
  const queryParameters = queryStringLib.parse(urlParsed.query);

  // Setup for Cross-Origin Resource Sharing
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Log each API request
  apiCallCount++;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (endpoint === "/api/definitions/" && request.method === "GET") {
    // Attempt to find a word's definition
    const searchTerm = queryParameters.word.toLowerCase();
    const foundDefinition = wordBank.find((item) => item.word === searchTerm);
    if (foundDefinition) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          queryID: apiCallCount,
          definition: foundDefinition,
        })
      );
    } else {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          queryID: apiCallCount,
          message: `The term '${searchTerm}' was not located.`,
        })
      );
    }
  } else if (endpoint === "/api/definitions" && request.method === "POST") {
    let requestData = "";
    request.on("data", (dataPart) => {
      requestData += dataPart.toString();
    });
    request.on("end", () => {
      const { word, definition } = JSON.parse(requestData);
      const isDuplicate = wordBank.some(
        (record) => record.word === word.toLowerCase()
      );
      if (!isDuplicate) {
        wordBank.push({ word: word.toLowerCase(), definition });
        response.writeHead(201, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            queryID: apiCallCount,
            totalDefinitions: wordBank.length,
            message: `Definition added: '${word} : ${definition}'`,
          })
        );
      } else {
        response.writeHead(409, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            queryID: apiCallCount,
            message: `Attention! '${word}' is already in the database.`,
          })
        );
      }
    });
  } else {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        message: "Requested resource is unavailable.",
      })
    );
  }
});

const SERVER_PORT = process.env.PORT || 8083;
webServer.listen(SERVER_PORT, () => console.log(`Web server active on port ${SERVER_PORT}`));
//created by chatgpt
