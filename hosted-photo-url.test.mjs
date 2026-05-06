import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert.match(html, /id="photoUrl"/);
assert.match(html, /function handlePhotoUrlInput/);
assert.match(html, /photoUrl: getHostedPhotoUrl\(\) \|\| uploadedPhotoData \|\| ''/);
assert.match(html, /assets\/headshots\/ryan-lehmann\.jpg/);
assert.match(html, /setPhotoPreview\(hostedUrl\)/);
assert.match(html, /Hosted URL selected/);

console.log('hosted photo URL contract ok');
