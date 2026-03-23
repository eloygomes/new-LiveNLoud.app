const nodemailer = require("nodemailer");

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.verify();
  console.log("SMTP OK");

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: "eloy.gomes@icloud.com",
    subject: "Teste SMTP Live N Loud",
    text: "Teste de envio do Docker Mailserver",
  });

  console.log("ENVIADO:", info.messageId);
}

main().catch((err) => {
  console.error("SMTP ERROR:", err);
  process.exit(1);
});