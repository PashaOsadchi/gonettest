const assert = require('assert');
const { TextDecoder } = require('util');
const { encodeDataForScript } = require('../js/download_HTML.js');

const payload = [{ message: '</script><script>alert(1)</script>' }];
const encoded = encodeDataForScript(payload);

// Encoded data should not contain closing script tags or angle brackets
assert(!/<\/script>/i.test(encoded), 'Encoded string should not contain </script>');
assert(!/[<>]/.test(encoded), 'Encoded string should not contain < or > characters');

// Decoding should recover original data
const decodedJson = new TextDecoder().decode(Buffer.from(encoded, 'base64'));
const decoded = JSON.parse(decodedJson);
assert.deepStrictEqual(decoded, payload, 'Decoded data should match original');

console.log('script escape test passed');
