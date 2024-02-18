const http = require('http');
const url = require('url');
const { StringDecoder } = require('string_decoder');

const hostname = '127.0.0.1'; // This will be your server's IP or hostname
const port = 3000; // Port on which your server listens

let requestCounter = 0;
const dictionary = {};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
  const method = req.method.toUpperCase();
  const queryStringObject = parsedUrl.query;

  requestCounter++; // Increment the request counter

  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    if (path === 'api/definitions' && method === 'POST') {
      // Create a new dictionary entry
      const requestBody = JSON.parse(buffer);
      const word = requestBody.word;
      const definition = requestBody.definition;

      if (!word || !definition || typeof word !== 'string' || typeof definition !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid input' }));
        return;
      }

      if (dictionary[word]) {
        // Word already exists
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Warning! ${word} already exists.` }));
      } else {
        // Add new word
        dictionary[word] = definition;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: `Request #${requestCounter}. New entry recorded: "${word} : ${definition}"`,
          totalEntries: Object.keys(dictionary).length
        }));
      }
    } else if (path === 'api/definitions' && method === 'GET' && queryStringObject.word) {
      // Get the definition of a word
      const word = queryStringObject.word;
      const definition = dictionary[word];

      if (definition) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ word, definition, requestNumber: requestCounter }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Request# ${requestCounter}, word '${word}' not found!` }));
      }
    } else {
      // Path not found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Path not found' }));
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
