# FiverrBot – Discord moderation bot

Node.js Discord bot that:

1. **Self-promotion** – Deletes messages containing self-promo phrases and DMs: *"Your message is deleted because it's against server rule."*
2. **Looking for Dev** – In the configured channel, deletes messages that break the channel rules and DMs the user with the rule reminder.

## Setup

### 1. Install

```bash
npm install
```

### 2. Config

Copy the example config and edit it:

```bash
copy config.example.json config.json
```

Edit `config.json`:

- **`token`** – Your bot token from [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Reset/Copy Token.
- **`lookingForDevChannelId`** – Channel ID for “Looking for Dev” (right‑click channel → Copy ID).

### 3. Bot permissions

- **Server:** `Manage Messages` (to delete messages), `Send Messages`, `Read Message History`, `View Channel`.
- **Privileged intent:** In Developer Portal → Bot → enable **Message Content Intent**.

### 4. Run

```bash
npm start
```

---

## Config reference

### Self-promotion (`selfPromotion`)

- **`enabled`** – `true` / `false`
- **`keywords`** – Array of phrases. If a message contains any (case‑insensitive), it’s treated as self‑promo, deleted, and the author is DMed.

### Looking for Dev (`lookingForDev`)

- **`enabled`** – `true` / `false`
- **`lookingForDevChannelId`** – Only this channel is checked.
- **`requiredKeywords`** – All of these must appear in the message. If any is missing → delete + DM.
- **`forbiddenKeywords`** – If any of these appear → delete + DM.
- **`requirePriceOrPercentage`** – `true` / `false` (default: `true`). If `true`, messages must contain a price or percentage (e.g., `$100`, `50%`, `100 USD`, `price: 200`, etc.).
- **`pricePercentageMessage`** – DM sent when a message is deleted for missing price/percentage.
- **`ruleMessage`** – DM sent for other rule violations (missing required keywords, etc.).

**Price/Percentage detection:** The bot recognizes:
- Percentages: `50%`, `100 percent`, `25 percentage`
- Prices: `$100`, `100 USD`, `price: 200`, `cost 50`, `budget: 500`, `100 dollars`, etc.

---

## Hide the "+ Add App" button on the bot profile

The "+ Add App" button appears when your app has **Install Links** configured. To remove it:

### Option 1: Run the script (recommended)

```bash
npm run hide-open-app
```

This clears both the Interactions Endpoint URL and Install Link via the Discord API.

### Option 2: Manual (Developer Portal)

**To remove the "+ Add App" button:**

1. Open [Discord Developer Portal](https://discord.com/developers/applications) → your application.
2. Go to the **Installation** page (left sidebar).
3. In the **Install Link** section, select **"None"** (not "Discord Provided Link" or "Custom URL").
4. Click **Save Changes**.

**Also clear Interactions Endpoint URL (optional, but recommended):**

1. Go to **General Information**.
2. Find **Interactions Endpoint URL**.
3. Clear the field (delete the URL) and **Save Changes**.

The button should disappear after a short while. Your bot will keep working; it uses the gateway (e.g. `messageCreate`), not the interactions endpoint.

