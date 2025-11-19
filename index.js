const { App } = require('@slack/bolt');

const app = new App({
  token: "N08w9wwFukM2CNYjYMqON5SH",
  signingSecret: "880ad6b8c9ab7a7d443b2684aea3a386"
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

app.command('/boroboro', async ({ command, ack, respond }) => {
  await ack();
  const mensaje = getNextWorkdayTarget();
  await respond(mensaje);
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack app is running!');
})();
