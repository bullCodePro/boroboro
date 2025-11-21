const { App } = require("@slack/bolt");
const fs = require("fs");
const path = require("path");

// Ruta del archivo de logs: logs/borologs
const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "borologs");

// Aseguramos que exista la carpeta de logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

function getNextWorkdayTarget() {
  // Fecha actual en UTC
  const nowUTC = new Date();

  // Convertimos a UTC-3 (Uruguay)
  const now = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000);

  // Target = hoy a las 17:30 (en UTC-3)
  let target = new Date(now);
  target.setHours(17, 30, 0, 0);

  // Si ya pasó 17:30 o es fin de semana → próximo día hábil
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
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `Para el próximo BORO faltan ${days} días, ${hours} horas, ${minutes} minutos y ${seconds} segundos.`;
}

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
    if (err) {
      console.error("Error al escribir en el log:", err);
    }
  });

  await respond({
    response_type: "in_channel",
    text: getNextWorkdayTarget()
  });
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ Slack app running on port ${port}`);
})();
