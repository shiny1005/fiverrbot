require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN not found in .env file. Please create a .env file with your Discord bot token.');
  process.exit(1);
}

// Parse configuration from environment variables
const config = {
  token: process.env.DISCORD_TOKEN,
  lookingForDevChannelId: process.env.LOOKING_FOR_DEV_CHANNEL_ID,
  selfPromotion: {
    enabled: process.env.SELF_PROMOTION_ENABLED === 'true',
    keywords: JSON.parse(process.env.SELF_PROMOTION_KEYWORDS || '[]'),
  },
  lookingForDev: {
    enabled: process.env.LOOKING_FOR_DEV_ENABLED === 'true',
    requiredKeywords: JSON.parse(process.env.LOOKING_FOR_DEV_REQUIRED_KEYWORDS || '[]'),
    forbiddenKeywords: JSON.parse(process.env.LOOKING_FOR_DEV_FORBIDDEN_KEYWORDS || '[]'),
    requirePriceOrPercentage: process.env.LOOKING_FOR_DEV_REQUIRE_PRICE_OR_PERCENTAGE !== 'false',
    pricePercentageMessage: process.env.LOOKING_FOR_DEV_PRICE_PERCENTAGE_MESSAGE,
    ruleMessage: process.env.LOOKING_FOR_DEV_RULE_MESSAGE,
  },
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const SELF_PROMO_DM = "Your message is deleted because it's against server rule.";

function isSelfPromotion(text, keywords) {
  if (!keywords || keywords.length === 0) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function hasPriceOrPercentage(text) {
  const lower = text.toLowerCase();
  
  // Check for percentage patterns: %, percent, percentage
  if (/\d+\s*%/.test(text) || /\d+\s*percent/.test(lower) || /\d+\s*percentage/.test(lower)) {
    return true;
  }
  
  // Check for price patterns: $, USD, EUR, GBP, price, cost, budget, etc.
  const pricePatterns = [
    /\$\s*\d+/,                    // $100, $ 50
    /\d+\s*\$/,                    // 100$, 50 $
    /\d+\s*(usd|eur|gbp|cad|aud|jpy|chf|nzd)/i,  // 100 USD, 50eur
    /\b(price|cost|budget|pay|payment|compensation|salary|wage|fee|rate)\s*:?\s*\d+/i,  // price: 100, cost 50
    /\b\d+\s*(dollar|dollars|euro|euros|pound|pounds|yen)/i,  // 100 dollars
  ];
  
  return pricePatterns.some(pattern => pattern.test(text));
}

function hasRequiredKeywords(text, requiredKeywords) {
  if (!requiredKeywords || requiredKeywords.length === 0) return true;
  const lower = text.toLowerCase();
  return requiredKeywords.every((kw) =>
    kw ? lower.includes(kw.toLowerCase()) : true
  );
}

function hasForbiddenKeywords(text, forbiddenKeywords) {
  if (!forbiddenKeywords || forbiddenKeywords.length === 0) return false;
  const lower = text.toLowerCase();
  return forbiddenKeywords.some((kw) => kw && lower.includes(kw.toLowerCase()));
}

async function tryDM(user, content) {
  try {
    await user.send(content);
  } catch (e) {
    console.warn(`Could not DM ${user.tag}:`, e.message);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return; // ignore DMs

  const { selfPromotion, lookingForDev, lookingForDevChannelId } = config;
  const text = message.content || '';

  // 1. Self-promotion (all channels when enabled)
  if (selfPromotion?.enabled && selfPromotion.keywords?.length) {
    if (isSelfPromotion(text, selfPromotion.keywords)) {
      try {
        await message.delete();
        await tryDM(message.author, SELF_PROMO_DM);
      } catch (e) {
        console.error('Self-promo delete/DM error:', e);
      }
      return;
    }
  }

  // 2. Looking for Dev channel rules (2-step filtering)
  if (
    lookingForDev?.enabled &&
    lookingForDevChannelId &&
    message.channel.id === lookingForDevChannelId
  ) {
    try {
      // Step 1: Check forbidden keywords first
      if (hasForbiddenKeywords(text, lookingForDev.forbiddenKeywords)) {
        await message.delete();
        const dmText =
          lookingForDev.ruleMessage ||
          "Your message was deleted. Please follow the server's #looking-for-dev rules before posting.";
        await tryDM(message.author, dmText);
        return;
      }

      // Step 2: Check required keywords (pattern)
      if (!hasRequiredKeywords(text, lookingForDev.requiredKeywords)) {
        await message.delete();
        const dmText =
          lookingForDev.ruleMessage ||
          "Your message was deleted. Please follow the server's #looking-for-dev rules before posting.";
        await tryDM(message.author, dmText);
        return;
      }

      // Step 3: Check price/percentage (only if pattern passed)
      if (lookingForDev.requirePriceOrPercentage !== false) {
        if (!hasPriceOrPercentage(text)) {
          await message.delete();
          const dmText =
            lookingForDev.pricePercentageMessage ||
            "Your message in the #looking-for-dev channel was deleted because it didn't include a price or percentage.";
          await tryDM(message.author, dmText);
          return;
        }
      }
    } catch (e) {
      console.error('Looking-for-dev delete/DM error:', e);
    }
  }
});

client.login(config.token).catch((e) => {
  console.error('Login failed. Check config.json and token.');
  process.exit(1);
});
