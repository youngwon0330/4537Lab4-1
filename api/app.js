const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf-8');

// Simple in-memory dictionary for example purposes
let dictionary = {};
let requestCounter = 0;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, requestNumber'); // Add 'requestNumber' to the allowed headers
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === 'POST' && pathname === '/api/definitions/') {
      handlePostRequest(req, res);
  } else if (req.method === 'GET' && pathname === '/api/definitions/') {
      handleGetRequest(parsedUrl.query, res);
  } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

  const { pathname, query } = new URL(req.url, `http://${req.headers.host}`);
  const path = pathname.replace(/^\/+|\/+$/g, '');
  const method = req.method.toUpperCase();

  requestCounter++; // Increment request counter

  if (path === 'definitions') {
    if (method === 'POST') {
      let buffer = '';
      for await (const chunk of req) {
        buffer += decoder.write(chunk);
      }
      buffer += decoder.end();

      const { word, definition } = JSON.parse(buffer);
      if (!word || !definition || typeof word !== 'string' || typeof definition !== 'string') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Invalid input' }));
        return;
      }

      if (dictionary[word]) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: `Warning! ${word} already exists.` }));
      } else {
        dictionary[word] = definition;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          message: `Request #${requestCounter}. New entry recorded: "${word} : ${definition}"`,
          totalEntries: Object.keys(dictionary).length
        }));
      }
    } else if (method === 'GET' && query.word) {
      const word = query.word;
      const definition = dictionary[word];

      if (definition) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ word, definition, requestNumber: requestCounter }));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: `Request# ${requestCounter}, word '${word}' not found!` }));
      }
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Path not found' }));
    }
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Path not found' }));
  }
};
