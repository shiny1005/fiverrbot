/**
 * Removes the "Open App" / "+ Add App" button from the bot's profile.
 * Clears both Interactions Endpoint URL and Install Link (custom_install_url).
 *
 * Run: node scripts/hide-open-app.js
 * (Uses config.json for the bot token)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('config.json not found. Run from project root and ensure config.json exists.');
  process.exit(1);
}

const config = require(configPath);
const token = config.token;

if (!token || token === 'YOUR_DISCORD_BOT_TOKEN') {
  console.error('Set your bot token in config.json first.');
  process.exit(1);
}

// Clear both Interactions Endpoint URL and Install Link
const body = JSON.stringify({ 
  interactions_endpoint_url: null,
  custom_install_url: null
});

const req = https.request(
  {
    hostname: 'discord.com',
    path: '/api/v10/applications/@me',
    method: 'PATCH',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✓ Interactions Endpoint URL and Install Link have been cleared.');
        console.log('✓ The "+ Add App" button should disappear from the bot profile shortly.');
        console.log('\nNote: If the button still appears, you may also need to set Install Link to "None" in the Developer Portal (see README).');
      } else {
        console.error('Request failed:', res.statusCode, data || res.statusMessage);
        process.exit(1);
      }
    });
  }
);

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
