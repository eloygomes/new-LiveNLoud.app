require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");

async function main() {
  const port = Number(process.env.SMTP_PORT || 587);
  const tlsServername = process.env.SMTP_TLS_SERVERNAME || process.env.SMTP_HOST;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { servername: tlsServername },
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
