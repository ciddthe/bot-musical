const http = require("http");
const QRCode = require("qrcode");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");

const PORT = process.env.PORT || 3000;
const QR_TOKEN = process.env.QR_TOKEN;

let latestQR = null;
let connected = false;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    return res.end(
      connected
        ? "Bot musical conectado a WhatsApp 🎵"
        : "Bot musical iniciado. WhatsApp aún no está conectado."
    );
  }

  if (url.pathname === "/qr") {
    if (!QR_TOKEN || url.searchParams.get("token") !== QR_TOKEN) {
      res.writeHead(401);
      return res.end("No autorizado");
    }

    if (connected) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("WhatsApp ya está conectado.");
    }

    if (!latestQR) {
      res.writeHead(503);
      return res.end("Todavía no hay QR. Espera unos segundos y vuelve a intentar.");
    }

    const image = await QRCode.toDataURL(latestQR);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      `<html><body style="font-family:sans-serif;text-align:center">
      <h2>Vincula WhatsApp</h2><img src="${image}" alt="QR de WhatsApp">
      <p>Escanea este código desde WhatsApp en otro dispositivo.</p>
      </body></html>`
    );
  }

  res.writeHead(404);
  res.end("No encontrado");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor activo en el puerto " + PORT);
});

async function iniciarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      latestQR = qr;
      console.log("Nuevo QR disponible en la ruta protegida /qr");
    }

    if (connection === "open") {
      connected = true;
      latestQR = null;
      console.log("WhatsApp conectado correctamente.");
    }

    if (connection === "close") {
      connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;

      if (code !== DisconnectReason.loggedOut) {
        setTimeout(iniciarWhatsApp, 5000);
      } else {
        console.log("Sesión cerrada. Será necesario volver a vincular WhatsApp.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const message of messages) {
      if (!message.message || message.key.fromMe) continue;

      const chat = message.key.remoteJid;
      if (!chat || !chat.endsWith("@g.us")) continue;

      const body =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        "";

      if (!body.toLowerCase().startsWith("/play ")) continue;

      const song = body.slice(6).trim();
      if (!song) continue;

      const searchURL =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(song);

      await sock.sendMessage(chat, {
        text: 🎵 Busqué: ${song}\n🔗 Resultados de YouTube:\n${searchURL}
      });
    }
  });
}

iniciarWhatsApp().catch(error => {
  console.error("Error al iniciar WhatsApp:", error);
});
