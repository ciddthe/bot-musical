require("dotenv").config();

const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    return res.end(
      "Bot musical iniciado correctamente 🎵"
    );
  }

  res.writeHead(404);
  res.end("No encontrado");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(Servidor activo en el puerto ${PORT});
});

function buscarVideo(nombre) {
  const consulta = encodeURIComponent(nombre);

  return https://www.youtube.com/results?search_query=${consulta};
}

function prepararRespuesta(nombre) {
  const enlace = buscarVideo(nombre);

  return [
    🎵 Búsqueda: ${nombre},
    🔗 Videos de YouTube: ${enlace},
    "",
    "El audio se enviará cuando esté disponible",
    "una fuente autorizada para descargarlo."
  ].join("\n");
}

console.log("Funciones de búsqueda preparadas.");
console.log(
  prepararRespuesta("Imagine Dragons Believer")
);
