require("dotenv").config();
const { App, ExpressReceiver } = require("@slack/bolt");
const fs = require("fs");
const path = require("path");

// ==============================
//  LOGGING SETUP
// ==============================
const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "borologs");

// Crear carpeta logs si no existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ==============================
//  EXPRESS RECEIVER + SLACK APP
// ==============================
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// ==============================
//  BORO CALC (UTC-3)
// ==============================
function getNextWorkdayTarget() {
  const nowUTC = new Date();
  const now = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000); // UTC-3 fijo

  let target = new Date(now);
  target.setHours(17, 30, 0, 0);

  while (
    target <= now ||
    target.getDay() === 0 || // domingo
    target.getDay() === 6    // sábado
  ) {
    target.setDate(target.getDate() + 1);
    target.setHours(17, 30, 0, 0);
  }

  const diffMs = target - now;
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % (3600 * 24)) / 60);
  const seconds = totalSeconds % 60;

  return `Faltan ${days} días, ${hours} horas, ${minutes} minutos y ${seconds} segundos para el BORO.`;
}

// ==============================
//  SLASH COMMAND /boroboro
// ==============================
app.command("/boroboro", async ({ ack, respond, command }) => {
  await ack();

  const timestamp = new Date().toISOString();
  const username = command.user_name;
  const userId = command.user_id;
  const channelName = command.channel_name || "";
  const channelId = command.channel_id;
  const teamId = command.team_id;

  const logEntry =
    `${timestamp} - user=${username} (${userId}) ` +
    `channel=${channelName || channelId} team=${teamId} command=/boroboro\n`;

  fs.appendFile(LOG_FILE, logEntry, (err) => {
    if (err) console.error("Error al escribir log:", err);
  });

  await respond({
    response_type: "in_channel",
    text: getNextWorkdayTarget()
  });
});

// ==============================
//  ENDPOINT PÚBLICO /logs
// ==============================
receiver.app.get("/logs", (req, res) => {
  fs.readFile(LOG_FILE, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("No se pudieron leer los logs.");
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(data || "No hay logs todavía.");
  });
});

// ==============================
//  START SERVER
// ==============================
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port); // Bolt arranca el ExpressReceiver internamente
  console.log(`⚡️ Slack app running on port ${port}`);
})();
