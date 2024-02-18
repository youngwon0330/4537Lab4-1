const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf-8');

// Simple in-memory dictionary for example purposes
let dictionary = {};
let requestCounter = 0;

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

const handler = (req, res) => {
  const d = new Date()
  res.end(d.toString())
}

module.exports = allowCors(handler)


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
