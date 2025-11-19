const { App } = require("@slack/bolt");

const app = new App({
token: "N08w9wwFukM2CNYjYMqON5SH", 
signingSecret: "627c04c0d75d35c8eb7d8fd648c5b8aa"
});

function getNextWorkdayTarget() {
  const now = new Date();
  let target = new Date(now);
  target.setHours(17, 30, 0, 0);

  // Avanza al siguiente día hábil si es después de las 17:30 o fin de semana
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

app.command("/boroboro", async ({ command, ack, respond }) => {
  await ack();
  await respond(getNextWorkdayTarget());
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ Slack app running on port ${port}`);
})();
