const http = require('http');
const url = require('url');

const dictionary = {};
let totalRequests = 0;

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

function handlePostRequest(req, res) {
    totalRequests++;

    let data = '';

    req.on('data', (chunk) => {
        data += chunk.toString();
    });

    req.on('end', () => {
        const { word, definition } = JSON.parse(data);

        if (!word || !definition || typeof word !== 'string' || typeof definition !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid input. Word and definition must be non-empty strings.' }));
            return;
        }

        if (dictionary[word]) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Warning! '${word}' already exists.` }));
            return;
        }

        dictionary[word] = definition;
        const totalEntries = Object.keys(dictionary).length;

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Definition added successfully!',
            requestNumber: totalRequests,
            totalEntries
        }));
    });
}

function handleGetRequest(query, res) {
    const word = query.word;

    if (!word || typeof word !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid input. Word must be a non-empty string.' }));
        return;
    }

    const definition = dictionary[word];

    if (!definition) {
        res.writeHead(404, {
            'Content-Type': 'application/json',
            'Access-Control-Expose-Headers': 'requestNumber' // Add this line to expose the 'requestNumber' header
        });
        res.end(JSON.stringify({
            error: `Request# ${totalRequests}, Word '${word}' not found!`,
            requestNumber: totalRequests
        }));
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Expose-Headers': 'requestNumber' // Add this line to expose the 'requestNumber' header
    });
    res.end(JSON.stringify({
        word,
        definition,
        requestNumber: totalRequests
    }));
}

const port = 8080;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});