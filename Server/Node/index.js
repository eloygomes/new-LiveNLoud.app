require("dotenv").config(); // <--- ADICIONE ISSO

const express = require("express");
const axios = require("axios");
const { MongoClient, Binary, ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp"); // Importar sharp
const fs = require("fs");

// Socket.IO
const http = require("http");
const { Server } = require("socket.io");

const uri = "mongodb://root:example@db:27017/admin";
const client = new MongoClient(uri);

const pythonApiUrl = process.env.PYTHON_API_URL || "http://python_scraper:8000";

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require("cors");

// Função para conectar ao banco de dados
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Conexão com o MongoDB estabelecida com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
  }
}

connectToDatabase();

// Crie o servidor HTTP a partir do Express
const server = http.createServer(app);

// const io = new Server(server, {
//   path: '/socket.io',
//   cors: {
//     origin: ["https://www.live.eloygomes.com.br", "https://api.live.eloygomes.com.br"],
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: (origin, callback) => {
      const allowed = [
        "https://www.live.eloygomes.com.br",
        "https://api.live.eloygomes.com.br",
        "https://www.live.eloygomes.com",
        "https://api.live.eloygomes.com",
        "https://live.eloygomes.com",
        "http://localhost:5173", // <-- habilita dev
      ];
      // Sem origin (apps nativos) ou na lista => libera
      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Namespaces
const clientNamespace = io.of("/"); // Namespace padrão para clientes
const pythonNamespace = io.of("/python"); // Namespace dedicado para o script Python

// INSTRUÇÕES
// •	messageToServer: Evento que o cliente emite para enviar dados ao servidor.
// •	processData: Evento que o servidor emite para o script Python com os dados a serem processados.
// •	processedData: Evento que o script Python emite para enviar os dados processados de volta ao servidor.
// •	messageFromServer: Evento que o servidor emite para enviar os dados processados de volta ao cliente.

// Handle client connections
clientNamespace.on("connection", (socket) => {
  const userEmail = socket.handshake.query.email;
  const pipa = socket.handshake.query.pipa;

  console.log("Usuário conectado:", socket.id, "Email:", userEmail);
  console.log("FRONT", pipa);

  if (userEmail) {
    socket.join(userEmail);
  }

  // Escutar eventos do cliente
  socket.on("messageToServer", ({ audioData, sampleRate }) => {
    console.log("Audio chunk:", {
      bytes: audioData?.length || audioData?.byteLength,
      sampleRate,
      id: socket.id,
    });
    pythonNamespace.emit("processData", {
      clientId: socket.id,
      audioData,
      sampleRate,
    });
  });

  socket.on("health", (data, cb) => {
    cb && cb({ ok: true, ts: Date.now() });
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id);
  });
});

// Handle Python script connections
pythonNamespace.on("connection", (socket) => {
  console.log(`Script Python conectado: ${socket.id}`);

  // Receber dados processados do script Python
  socket.on("processedData", (data) => {
    console.log("Dados processados recebidos do Python:", data);

    // Enviar os dados processados de volta ao cliente original
    const clientId = data.clientId;
    const clientSocket = clientNamespace.sockets.get(clientId);

    if (clientSocket) {
      clientSocket.emit("messageFromServer", data);
      console.log("Dados processados enviados ao cliente:", clientId);
    } else {
      console.log("Cliente não encontrado:", clientId);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Script Python desconectado: ${socket.id}`);
  });
});

// Middleware para JSON e CORS
// app.use(
//   cors({
//     origin: ["http://localhost:5173", "https://www.live.eloygomes.com.br"],
//     credentials: true,
//   })
// );

// app.use(
//   cors({
//     // Permite todas as origens durante o desenvolvimento
//     origin: "*",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: [
      "https://www.live.eloygomes.com.br",
      "https://api.live.eloygomes.com.br",
      "https://www.live.eloygomes.com",
      "https://api.live.eloygomes.com",
      "https://live.eloygomes.com",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

// Middleware para JSON com limite de tamanho adequado
app.use(express.json({ limit: "50mb" })); // Defina o limite conforme necessário

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configuração do Multer para armazenamento local com extensão '.jpeg'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profileImages");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + ".jpeg"); // Definir extensão como '.jpeg' independente do original
  },
});

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedTypes.test(file.mimetype);

  if (extname && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error("Apenas imagens são permitidas (jpeg, jpg, png, gif)."));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: fileFilter,
});

// Middleware para lidar com erros do Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erros do Multer
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({
          message: "O tamanho do arquivo excede o limite permitido de 5MB.",
        });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Outros erros
    return res.status(500).json({ message: err.message });
  }
  next();
});

app.post(
  "/api/uploadProfileImage",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const originalFilePath = req.file.path; // Caminho do arquivo original

      // Processar a imagem com Sharp e obter um buffer
      const processedImageBuffer = await sharp(originalFilePath)
        .resize(200, 200)
        .jpeg({ quality: 80 }) // Opcional: definir qualidade e formato
        .toBuffer();

      // Excluir o arquivo original, pois não precisamos mais dele
      fs.unlink(originalFilePath, (err) => {
        if (err) {
          console.error("Erro ao excluir o arquivo original:", err);
        } else {
          console.log("Arquivo original excluído com sucesso.");
        }
      });

      // Obter referência à coleção onde as imagens serão armazenadas
      const database = client.db("liveNloud_"); // Substitua pelo nome do seu banco de dados
      const collection = database.collection("profileImages");

      // Garantir que o campo 'email' seja único para evitar duplicatas
      await collection.createIndex({ email: 1 }, { unique: true });

      // Criar ou atualizar o documento para a imagem
      const filter = { email: req.body.email }; // Filtro para encontrar o documento do usuário
      const update = {
        $set: {
          image: new Binary(processedImageBuffer),
          uploadDate: new Date(),
        },
      };
      const options = { upsert: true }; // Cria o documento se não existir

      const result = await collection.updateOne(filter, update, options);

      if (result.upsertedCount > 0) {
        console.log(
          "Imagem salva no MongoDB com sucesso. Novo documento criado com ID:",
          result.upsertedId._id
        );
      } else if (result.modifiedCount > 0) {
        console.log("Imagem atualizada no MongoDB com sucesso.");
      } else {
        console.log("Nenhuma alteração feita no MongoDB.");
      }

      // Retornar uma resposta ao cliente
      res.status(200).json({
        message: "Imagem enviada e processada com sucesso!",
        // Opcional: retornar o ID do documento ou outras informações
      });
    } catch (err) {
      if (err.code === 11000) {
        // Código de erro para duplicação de chave
        console.error(
          "Erro: O email fornecido já possui uma imagem de perfil."
        );
        res
          .status(400)
          .json({ error: "O email fornecido já possui uma imagem de perfil." });
      } else {
        console.error("Erro ao processar e salvar a imagem:", err);
        res.status(500).json({ error: "Erro ao processar e salvar a imagem" });
      }
    }
  }
);

app.get("/api/profileImage/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Validar email (opcional mas recomendado)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email inválido." });
    }

    const database = client.db("liveNloud_");
    const collection = database.collection("profileImages");

    const imageDocument = await collection.findOne({ email });

    if (!imageDocument || !imageDocument.image || !imageDocument.image.buffer) {
      return res.status(404).json({ message: "Imagem não encontrada." });
    }

    res.set("Content-Type", imageDocument.image.contentType || "image/jpeg");
    res.send(imageDocument.image.buffer);
  } catch (err) {
    console.error("Erro ao buscar a imagem:", err);
    res.status(500).json({ error: "Erro ao buscar a imagem" });
  }
});

// Rota para chamar o serviço Python e realizar o scrape
// ---------- helpers p/ normalização ----------
// (você já tem normalizeInstrument e normalizeLink definidos mais acima)
// vou reaproveitá-los aqui sem duplicar

/** Aguarda N ms */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Busca o doc no banco geral usando (instrument, link) e fallbacks. */
async function findGeneralCifraDoc({ instrument, link, artist, song }) {
  const database = client.db("generalCifras");
  const collection = database.collection("Documents");

  const inst = normalizeInstrument(instrument);
  if (!inst) return null;

  const linkNorm = normalizeLink(link);

  // 1) preferencial: flag do instrumento + linkNorm no subdoc
  const byNorm = {
    $and: [
      {
        $or: [
          { [`instruments.${inst}`]: true },
          { [`instruments.${inst}`]: "true" },
        ],
      },
      { [`${inst}.linkNorm`]: linkNorm },
    ],
  };

  // 2) fallback: flag do instrumento + link "cru" (com/sem barra)
  const rawNoSlash = String(link).replace(/\/+$/, "");
  const rawWithSlash = rawNoSlash.endsWith("/") ? rawNoSlash : `${rawNoSlash}/`;
  const byRaw = {
    $and: [
      {
        $or: [
          { [`instruments.${inst}`]: true },
          { [`instruments.${inst}`]: "true" },
        ],
      },
      {
        $or: [
          { [`${inst}.link`]: link },
          { [`${inst}.link`]: rawNoSlash },
          { [`${inst}.link`]: rawWithSlash },
        ],
      },
    ],
  };

  // 3) último recurso: artist + song (pode haver múltiplos; pegamos o mais recente)
  const byTitle = { artist, song };

  let doc = await collection.findOne(byNorm);
  if (!doc) doc = await collection.findOne(byRaw);
  if (!doc) doc = await collection.findOne(byTitle);

  return doc || null;
}

/** Tenta encontrar o doc por algumas tentativas (para dar tempo do Python gravar). */
async function waitForGeneralCifraDoc(
  { instrument, link, artist, song },
  { retries = 10, intervalMs = 300 } = {}
) {
  for (let i = 0; i < retries; i++) {
    const found = await findGeneralCifraDoc({ instrument, link, artist, song });
    if (found) return found;
    await delay(intervalMs);
  }
  return null;
}

// Rota para chamar o serviço Python e realizar o scrape
app.post("/api/scrape", async (req, res) => {
  console.log("[SCRAPE] called", { body: req.body });

  try {
    const { artist, song, instrument, email, instrument_progressbar, link } =
      req.body;

    if (!artist || !song || !instrument || !link) {
      return res
        .status(400)
        .json({ message: "artist, song, instrument e link são obrigatórios." });
    }

    // 1) dispara o scraper Python
    const pyPayload = {
      artist,
      song,
      instrument,
      email,
      instrument_progressbar,
      link,
    };
    console.time("[SCRAPE] python request");
    const response = await axios.post(`${pythonApiUrl}/scrape`, pyPayload);
    console.timeEnd("[SCRAPE] python request");
    console.log("[SCRAPE] python resp:", response.status, response.data);

    // 2) se Python respondeu sucesso, aguardamos o doc aparecer no Mongo
    if (response.status >= 200 && response.status < 300) {
      console.time("[SCRAPE] waitForGeneralCifraDoc");
      const doc = await waitForGeneralCifraDoc(
        { instrument, link, artist, song },
        { retries: 25, intervalMs: 400 } // ~10 segundos
      );
      console.timeEnd("[SCRAPE] waitForGeneralCifraDoc");

      if (doc) {
        console.log("[SCRAPE] returning stored document:", {
          _id: doc._id,
          artist: doc.artist,
          song: doc.song,
        });
        // 200 com o documento salvo
        return res.status(200).json({
          message: "Data stored successfully",
          document: doc,
        });
      }

      // Não achou após as tentativas: devolve o payload original do Python (fallback)
      console.warn(
        "[SCRAPE] Document not found after waiting. Returning python response only."
      );
      return res.status(202).json({
        message:
          "Stored, but document not yet visible. Try fetching again shortly.",
        python: response.data,
      });
    }

    // Python respondeu algo diferente de 2xx
    return res.status(response.status).json({
      message: "Erro ao chamar a API Python",
      python: response.data,
    });
  } catch (error) {
    console.error("[SCRAPE] error:", error?.message);
    if (error.response) {
      console.error("[SCRAPE] python response data:", error.response.data);
      return res.status(error.response.status).json({
        message: "Erro ao chamar a API Python",
        error: error.response.data,
      });
    } else if (error.request) {
      return res
        .status(500)
        .json({ message: "Nenhuma resposta recebida da API Python" });
    }
    return res
      .status(500)
      .json({
        message: "Erro na configuração da requisição para a API Python",
      });
  }
});

// Rota para criar um novo usuário
app.post("/api/signup", async (req, res) => {
  try {
    const { userdata, databaseComing, collectionComing } = req.body;

    const database = client.db(databaseComing);
    const collection = database.collection(collectionComing);

    console.log("Verificando se o email já existe...");
    const query = { email: userdata.email };
    const existingUser = await collection.findOne(query);

    if (existingUser) {
      // Se o email já existir, retorna que o usuário já está cadastrado
      return res.status(200).json({
        message: "Usuário já cadastrado!",
      });
    }

    console.log("Email não existe, criando novo usuário...");

    // Cria um novo documento com o email e o array userdata
    const result = await collection.insertOne({
      email: userdata.email,
      userdata: [userdata],
    });

    console.log("Usuário criado com sucesso:", result);

    return res.status(201).json({
      message: "Usuário criado com sucesso!",
      userId: result.insertedId,
      user: userdata,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res
      .status(500)
      .json({ message: "Erro ao criar usuário", error: error.message });
  }
});

// Rota para adicionar ou atualizar uma música
app.post("/api/newsong", async (req, res) => {
  try {
    const { userdata } = req.body;
    const { databaseComing, collectionComing } = req.body;

    // Verifica se os nomes estão presentes e válidos
    if (!databaseComing || !collectionComing) {
      return res
        .status(400)
        .json({ message: "Nome do banco de dados ou coleção não fornecido." });
    }

    const database = client.db(databaseComing.trim());
    const collection = database.collection(collectionComing.trim());

    const query = { email: userdata.email };
    const existingUser = await collection.findOne(query);

    // deixa artista/música em um formato comparável (slug)
    const normalizeName = (s = "") =>
      String(s)
        .trim()
        .toLowerCase()
        .normalize("NFD") // remove acentos
        .replace(/[\u0300-\u036f]/g, "") // remove marcas diacríticas
        .replace(/[^a-z0-9]+/g, "-") // troca tudo que não for alfanumérico por "-"
        .replace(/-+/g, "-") // evita "--"
        .replace(/^-|-$/g, ""); // remove hífen do começo/fim

    if (existingUser) {
      if (existingUser.userdata && Array.isArray(existingUser.userdata)) {
        // Verificar se já existe um registro com o mesmo artista e música
        let songIndex = existingUser.userdata.findIndex(
          (song) =>
            normalizeName(song.artist) === normalizeName(userdata.artist) &&
            normalizeName(song.song) === normalizeName(userdata.song)
        );

        if (songIndex !== -1) {
          // Atualizar apenas os campos necessários do registro existente
          const updatedSongData = {
            ...existingUser.userdata[songIndex], // Mantenha os dados existentes
            progressBar:
              userdata.progressBar ||
              existingUser.userdata[songIndex].progressBar,
            embedVideos: Array.from(
              new Set([
                ...existingUser.userdata[songIndex].embedVideos,
                ...userdata.embedVideos,
              ])
            ),
            // Adicione esta linha para armazenar o setlist vindo do front
            setlist: Array.from(
              new Set([
                ...(existingUser.userdata[songIndex].setlist ?? []),
                ...(userdata.setlist ?? []),
              ])
            ),
            instruments: {
              ...existingUser.userdata[songIndex].instruments, // Mantenha os instrumentos existentes
              [userdata.instrumentName]: {
                ...existingUser.userdata[songIndex].instruments[
                  userdata.instrumentName
                ],
                ...userdata[userdata.instrumentName],
              },
            },
            updateIn: new Date().toISOString().split("T")[0], // Atualiza a data de atualização
          };

          existingUser.userdata[songIndex] = updatedSongData;

          const updateResult = await collection.updateOne(
            { email: userdata.email },
            { $set: { userdata: existingUser.userdata } }
          );

          console.log("Usuário atualizado com sucesso:", updateResult);

          return res.status(200).json({
            message: "Dados atualizados com sucesso!",
            updatedUser: updateResult,
          });
        } else {
          // Se não encontrar o registro correspondente, adicionar como novo
          userdata.id = existingUser.userdata.length + 1;
          const updateResult = await collection.updateOne(
            { email: userdata.email },
            { $push: { userdata: userdata } }
          );

          console.log("Novo registro adicionado com sucesso:", updateResult);

          return res.status(200).json({
            message: "Novo registro adicionado com sucesso!",
            updatedUser: updateResult,
          });
        }
      } else {
        console.log(
          "Documento contém apenas o campo email, inicializando o campo userdata..."
        );

        userdata.id = 1;

        const updateResult = await collection.updateOne(
          { email: userdata.email },
          { $set: { userdata: [userdata] } }
        );

        console.log(
          "Campo userdata inicializado e atualizado com sucesso:",
          updateResult
        );

        return res.status(200).json({
          message: "Dados atualizados com sucesso!",
          updatedUser: updateResult,
        });
      }
    } else {
      console.log("Email não existe, criando novo usuário...");

      userdata.id = 1;

      const result = await collection.insertOne({
        email: userdata.email,
        userdata: [userdata],
      });

      console.log("Usuário criado com sucesso:", result);

      return res.status(201).json({
        message: "Usuário criado com sucesso!",
        userId: result.insertedId,
        user: userdata,
      });
    }
  } catch (error) {
    console.error("Erro ao criar ou atualizar o usuário:", error);
    res.status(500).json({ message: "Erro ao criar ou atualizar o usuário." });
  }
});

// Rota para buscar uma música específica no banco de dados
app.post("/api/allsongdata", async (req, res) => {
  try {
    const { email, artist, song } = req.body;
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Verifica se os parâmetros foram passados
    if (!email || !artist || !song) {
      return res
        .status(400)
        .json({ message: "Email, artist e song são obrigatórios." });
    }

    // Busca o documento pelo email
    const user = await collection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Busca a música específica no array 'userdata'
    const musicData = user.userdata.find(
      (item) => item.artist === artist && item.song === song
    );

    if (!musicData) {
      return res
        .status(404)
        .json({ message: "Música não encontrada para este usuário." });
    }

    // Retorna os dados completos da música
    return res.status(200).json(musicData);
  } catch (error) {
    console.error("Erro ao buscar os dados da música:", error);
    res.status(500).json({ message: "Erro ao buscar os dados da música." });
  }
});

// Rota para buscar e deletar uma música específica no banco de dados
app.post("/api/deleteonesong", async (req, res) => {
  console.log("deleteonesong");
  try {
    const { email, artist, song } = req.body;
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Verifica se os parâmetros foram passados
    if (!email || !artist || !song) {
      return res
        .status(400)
        .json({ message: "Email, artist e song são obrigatórios." });
    }

    // Busca o documento pelo email e remove a música específica do array 'userdata'
    const updateResult = await collection.updateOne(
      { email: email },
      { $pull: { userdata: { artist: artist, song: song } } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: "Música não encontrada." });
    }

    return res.status(200).json({ message: "Música deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar a música:", error);
    res.status(500).json({ message: "Erro ao deletar a música." });
  }
});

// Rota para obter todas as músicas de um usuário
app.get("/api/alldata/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log(email);
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    const user = await collection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // ✅ Retorna o documento inteiro (com userdata dentro)
    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar as músicas:", error);
    res.status(500).json({ message: "Erro ao buscar as músicas." });
  }
});

// Rota para buscar todos os dados de todos os usuários no banco de dados
app.get("/api/alldata/", async (req, res) => {
  try {
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Busca todos os documentos na coleção 'data'
    const allData = await collection.find({}).toArray();

    res.json(allData);
  } catch (error) {
    console.error("Erro ao buscar os dados:", error);
    res.status(500).json({ message: "Erro ao buscar os dados." });
  }
});

// Rota para atualizar o nome do usuário
app.put("/api/updateUsername", async (req, res) => {
  try {
    const { email, newUsername } = req.body;

    // Check if email and newUsername are provided
    if (!email || !newUsername) {
      return res
        .status(400)
        .json({ message: "Email and new username are required." });
    }

    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Find and update the username for the specified email
    const updateResult = await collection.updateOne(
      { email: email },
      { $set: { "userdata.$[].username": newUsername } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    console.log("Username updated successfully:", updateResult);

    return res.status(200).json({
      message: "Username updated successfully!",
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(500).json({ message: "Error updating username." });
  }
});

// Rota para atualizar o last time played
app.put("/api/lastPlay", async (req, res) => {
  try {
    const { email, song, artist, instrument } = req.body;

    if (!email || !song || !artist || !instrument) {
      return res.status(400).json({
        message: "Email, música, artista e instrumento são obrigatórios.",
      });
    }

    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // 0) Garante que o documento/entrada existe
    const userDoc = await collection.findOne({ email });
    if (!userDoc) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    const hasEntry = (userDoc.userdata || []).some(
      (u) => u.song === song && u.artist === artist
    );
    if (!hasEntry) {
      return res
        .status(404)
        .json({ message: "Música/Artista não encontrados." });
    }

    // 1) Cria o subdocumento do instrumento se NÃO existir
    await collection.updateOne(
      {
        email,
        "userdata.song": song,
        "userdata.artist": artist,
        [`userdata.${instrument}`]: { $exists: false },
      },
      {
        $set: { [`userdata.$[elem].${instrument}`]: {} },
      },
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
    );

    // 2) Se lastPlay for Date, converte para array com aquele date
    await collection.updateOne(
      {
        email,
        "userdata.song": song,
        "userdata.artist": artist,
        [`userdata.${instrument}.lastPlay`]: { $type: "date" },
      },
      {
        $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
      },
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
    );

    // 3) Se lastPlay for String, zera para array
    await collection.updateOne(
      {
        email,
        "userdata.song": song,
        "userdata.artist": artist,
        [`userdata.${instrument}.lastPlay`]: { $type: "string" },
      },
      {
        $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
      },
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
    );

    // 4) Se lastPlay não existir, cria array vazio
    await collection.updateOne(
      {
        email,
        "userdata.song": song,
        "userdata.artist": artist,
        $or: [
          { [`userdata.${instrument}.lastPlay`]: { $exists: false } },
          { [`userdata.${instrument}.lastPlay`]: null },
        ],
      },
      {
        $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
      },
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
    );

    // 5) Agora sim, dá o push com segurança
    const updateResult = await collection.updateOne(
      { email, "userdata.song": song, "userdata.artist": artist },
      {
        $push: { [`userdata.$[elem].${instrument}.lastPlay`]: new Date() },
      },
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
    );

    return res.status(200).json({
      message: "Campo lastPlay atualizado com sucesso!",
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Erro ao atualizar o campo lastPlay:", error);
    res.status(500).json({ message: "Erro ao atualizar o campo lastPlay." });
  }
});

// Rota para download user data em formato JSON
app.get("/api/downloadUserData/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Fetch the user's data from the database
    const user = await collection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Convert the user data to a JSON string with indentation for readability
    const jsonData = JSON.stringify(user.userdata, null, 2);

    // Set headers to prompt the browser to download the file
    res.setHeader("Content-Disposition", "attachment; filename=userdata.json");
    res.setHeader("Content-Type", "application/json");

    // Send the JSON data as the response
    res.send(jsonData);
  } catch (error) {
    console.error("Error downloading user data:", error);
    res.status(500).json({ message: "Error downloading user data." });
  }
});

// Route to delete all songs except the one with id = 1
app.post("/api/deleteAllUserSongs", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Received request to delete songs for email:", email);

    // Validate that email is provided
    if (!email) {
      console.log("Email not provided in the request.");
      return res.status(400).json({ message: "Email is required." });
    }

    const database = client.db("liveNloud_"); // Your database name
    const collection = database.collection("data"); // Your collection name

    // Find the user document
    const user = await collection.findOne({ email: email });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return res.status(404).json({ message: "User not found." });
    }

    // Log the current userdata
    console.log(`Current userdata for ${email}:`, user.userdata);

    // Ensure userdata is an array
    if (!Array.isArray(user.userdata)) {
      console.log(`userdata for ${email} is not an array.`);
      return res.status(400).json({ message: "Invalid userdata format." });
    }

    // Check if there's a userdata element with id = 1
    const firstSong = user.userdata.find((song) => song.id === 1);

    if (!firstSong) {
      console.log(`No userdata element with id = 1 found for email: ${email}`);
      return res.status(400).json({ message: "No song with id = 1 found." });
    }

    // Use the $pull operator to remove all userdata elements where id != 1
    const updateResult = await collection.updateOne(
      { email: email },
      { $pull: { userdata: { id: { $ne: 1 } } } }
    );

    console.log("Update result:", updateResult);

    if (updateResult.matchedCount === 0) {
      console.log(`No documents matched for email: ${email}`);
      return res.status(404).json({ message: "User not found." });
    }

    if (updateResult.modifiedCount === 0) {
      console.log(`No songs were deleted for email: ${email}`);
      return res.status(200).json({
        message:
          "No songs were deleted. Either only one song exists or 'id' fields do not match.",
        modifiedCount: updateResult.modifiedCount,
      });
    }

    // Fetch the updated document to confirm the changes
    const updatedUser = await collection.findOne({ email: email });
    console.log(`Updated userdata for ${email}:`, updatedUser.userdata);

    return res.status(200).json({
      message: "All songs except the first one have been deleted successfully!",
      modifiedCount: updateResult.modifiedCount,
      remainingSongs: updatedUser.userdata, // Optional: return the remaining songs
    });
  } catch (error) {
    console.error("Error deleting songs:", error);
    res.status(500).json({ message: "Error deleting songs." });
  }
});

// Rota para deletar a conta completa do usuário
app.post("/api/deleteUserAccount", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("deleting:", email);

    console.log("Recebido pedido para deletar conta do email:", email);

    // Validação: Verificar se o email foi fornecido
    if (!email) {
      console.log("Email não fornecido no pedido.");
      return res.status(400).json({ message: "Email é obrigatório." });
    }

    const database = client.db("liveNloud_"); // Substitua pelo nome do seu banco de dados se for diferente
    const collection = database.collection("data"); // Substitua pelo nome da sua coleção se for diferente

    // Tentar deletar o documento do usuário baseado no email
    const deleteResult = await collection.deleteOne({ email: email });

    console.log("Resultado da operação de deletar:", deleteResult);

    if (deleteResult.deletedCount === 0) {
      console.log(`Nenhum usuário encontrado com o email: ${email}`);
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.status(200).json({
      message: "Conta do usuário deletada com sucesso!",
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Erro ao deletar a conta do usuário:", error);
    res.status(500).json({ message: "Erro ao deletar a conta do usuário." });
  }
});

// Rota para consultar as musicas no banco geral
// app.post('/api/generalCifra', async (req, res) => {
//   try {
//     const { artist, song, instrument } = req.body;

//     const database = client.db("generalCifras");
//     const collection = database.collection("Documents");

//     // Montamos um filtro dinâmico, por exemplo:
//     // { artist: 'O Rappa', song: 'Anjos', 'instruments.guitar01': true }
//     const filter = {
//       artist: artist,
//       song: song,
//       [`instruments.${instrument}`]: true
//     };

//     // Buscamos um único documento que atenda a todos esses critérios
//     const document = await collection.findOne(filter);

//     if (!document) {
//       return res.status(404).json({ message: "Documento não encontrado" });
//     }

//     // Se achou, retornamos o documento completo
//     return res.status(200).json(document);

//   } catch (error) {
//     console.error("Erro ao tentar localizar cifra no banco geral:", error);
//     return res.status(500).json({ message: "Erro ao tentar localizar cifra no banco geral." });
//   }
// });

app.post("/api/createMusic", async (req, res) => {
  try {
    const {
      song,
      artist,
      progressBar,
      instruments = {},
      guitar01,
      guitar02,
      bass,
      keys,
      drums,
      voice,
      embedVideos = [],
      email = "",
      setlist = [],
    } = req.body;

    // ---------- utilitário: remove "progress" do objeto -----------
    const stripProgress = (instr) => {
      if (!instr || typeof instr !== "object") return instr;
      const { progress, ...clean } = instr;
      return clean;
    };

    // ---------- prepara payload limpo -----------------------------
    const incoming = {
      song,
      artist,
      progressBar,
      instruments,
      guitar01: stripProgress(guitar01),
      guitar02: stripProgress(guitar02),
      bass: stripProgress(bass),
      keys: stripProgress(keys),
      drums: stripProgress(drums),
      voice: stripProgress(voice),
      embedVideos,
      email,
      setlist,
      updateIn: new Date().toISOString().split("T")[0],
    };

    const database = client.db("generalCifras");
    const collection = database.collection("Documents");

    // ---------- se já existe (mesmo song + artist) -> faz merge ----
    const filter = { song: song, artist: artist };
    const existing = await collection.findOne(filter);

    if (existing) {
      // Merge instruments flags (true se qualquer um dos lados for true)
      const mergedInstruments = {
        ...existing.instruments,
        ...incoming.instruments,
      };

      // Helper para mesclar sub-documento de instrumento
      const mergeInstrument = (inst) => {
        if (!incoming[inst]) return existing[inst]; // nada novo
        const oldDoc = existing[inst] || {};
        return { ...oldDoc, ...incoming[inst] }; // incoming contém link específico
      };

      const update = {
        $set: {
          progressBar: incoming.progressBar ?? existing.progressBar,
          instruments: mergedInstruments,
          guitar01: mergeInstrument("guitar01"),
          guitar02: mergeInstrument("guitar02"),
          bass: mergeInstrument("bass"),
          keys: mergeInstrument("keys"),
          drums: mergeInstrument("drums"),
          voice: mergeInstrument("voice"),
          updateIn: incoming.updateIn,
        },
        $addToSet: {
          embedVideos: { $each: incoming.embedVideos },
          setlist: { $each: incoming.setlist },
        },
      };

      await collection.updateOne(filter, update);

      return res.status(200).json({
        message: "Música existente atualizada com sucesso.",
      });
    }

    // ---------- se não existe -> cria novo documento ---------------
    const newMusic = {
      ...incoming,
      addedIn: new Date().toISOString().split("T")[0],
    };

    const result = await collection.insertOne(newMusic);

    return res.status(201).json({
      message: "Música adicionada com sucesso.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Chave duplicada (caso índice unique seja criado)
      return res.status(200).json({ message: "Música já cadastrada." });
    }
    console.error("Erro ao criar/atualizar música:", error);
    return res.status(500).json({ message: "Erro ao criar/atualizar música." });
  }
});

// ======================= JWT LOGIN START ============================
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Modelo AuthUser (usando o próprio MongoClient, sem mongoose)
const authDatabase = client.db("liveNloud_");
const authCollection = authDatabase.collection("authUsers");

// Helpers
const genAccessToken = (id) =>
  jwt.sign({ userId: id }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
const genRefreshToken = (id) =>
  jwt.sign({ userId: id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

// Rota de cadastro
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const existing = await authCollection.findOne({ email });

    if (existing) return res.status(400).json({ error: "Email já registrado" });

    await authCollection.insertOne({
      email,
      passwordHash: hash,
      userdata: " ",
    });

    res.status(201).json({ message: "Usuário criado com sucesso!" });
  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Rota de login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await authCollection.findOne({ email });
    if (!user) {
      console.log("Usuário não encontrado:", email);
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    console.log("Usuário encontrado:", user);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      console.log("Senha inválida para:", email);
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const accessToken = genAccessToken(user._id.toString());
    const refreshToken = genRefreshToken(user._id.toString());

    await authCollection.updateOne(
      { _id: user._id },
      { $set: { refreshToken } }
    );

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Erro ao logar:", err); // <-- log detalhado
    res.status(500).json({ error: "Erro interno" });
  }
});

// Rota de refresh token
app.post("/api/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await authCollection.findOne({
      _id: new ObjectId(payload.userId),
    });

    if (!user || user.refreshToken !== refreshToken) return res.sendStatus(403);

    const newAccessToken = genAccessToken(user._id.toString());
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.sendStatus(403);
  }
});

// Middleware de proteção
function authenticateJWT(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Rota protegida de teste
app.get("/api/protected", authenticateJWT, (req, res) => {
  res.json({
    message: "Você acessou uma rota protegida!",
    userId: req.user.userId,
  });
});
// ======================= JWT LOGIN END ============================

// Endpoint de healthcheck HTTP (fora de qualquer handler de conexão)
app.get("/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ---------- helpers p/ normalização ----------
const INSTRUMENT_ALLOWED = [
  "guitar01",
  "guitar02",
  "bass",
  "keys",
  "drums",
  "voice",
];
const INSTRUMENT_MAP = { keyboard: "keys", key: "keys" };

function normalizeInstrument(i) {
  const norm = (INSTRUMENT_MAP[i] || i || "").toLowerCase();
  return INSTRUMENT_ALLOWED.includes(norm) ? norm : null;
}

/** Normaliza link para comparação estável (sem http/https, sem www, minúsculo, sem barra final) */
function normalizeLink(u) {
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, ""); // remove barra final
    return `${host}${path}`;
  } catch {
    return String(u)
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

/** Remove `progress` se vier no subdoc do instrumento (p/ não poluir o banco geral) */
function stripProgress(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const { progress, ...rest } = obj;
  return rest;
}

/** Garante que, se o subdoc tiver `link`, também ganhe `linkNorm` */
function withLinkNorm(subdoc = {}) {
  if (subdoc && subdoc.link) {
    return { ...subdoc, linkNorm: normalizeLink(subdoc.link) };
  }
  return subdoc;
}

(async () => {
  const database = client.db("generalCifras");
  const collection = database.collection("Documents");

  // ajuda buscas por artista/música (não-único, pois pode repetir em diferentes versões)
  await collection.createIndex({ artist: 1, song: 1 });

  // acelera buscas por link normalizado em cada instrumento (crie os que usar)
  await collection.createIndex({ "guitar01.linkNorm": 1 });
  await collection.createIndex({ "guitar02.linkNorm": 1 });
  await collection.createIndex({ "bass.linkNorm": 1 });
  await collection.createIndex({ "keys.linkNorm": 1 });
  await collection.createIndex({ "drums.linkNorm": 1 });
  await collection.createIndex({ "voice.linkNorm": 1 });

  // flags
  await collection.createIndex({ "instruments.guitar01": 1 });
  await collection.createIndex({ "instruments.guitar02": 1 });
  await collection.createIndex({ "instruments.bass": 1 });
  await collection.createIndex({ "instruments.keys": 1 });
  await collection.createIndex({ "instruments.drums": 1 });
  await collection.createIndex({ "instruments.voice": 1 });
})();

app.get("/api/generalCifra", async (req, res) => {
  try {
    let { instrument, link } = req.query || {};
    if (!instrument || !link) {
      return res
        .status(400)
        .json({ message: "Parâmetros obrigatórios: instrument, link" });
    }

    instrument = normalizeInstrument(instrument);
    if (!instrument) {
      return res.status(400).json({ message: `Instrumento inválido.` });
    }

    const linkNorm = normalizeLink(link);

    const database = client.db("generalCifras");
    const collection = database.collection("Documents");

    // Busca preferencialmente por link normalizado no subdoc do instrumento
    const filter = {
      $or: [
        { [`instruments.${instrument}`]: true },
        { [`instruments.${instrument}`]: "true" },
      ],
      [`${instrument}.linkNorm`]: linkNorm,
    };

    // Fallback: tentar bater pelo campo link "cru" também (com e sem barra)
    // Fallback: tenta casar pelo link "cru" (com/sem barra) E exige a flag do instrumento
    const fallback = {
      $and: [
        {
          $or: [
            { [`instruments.${instrument}`]: true },
            { [`instruments.${instrument}`]: "true" },
          ],
        },
        {
          $or: [
            { [`${instrument}.link`]: link },
            { [`${instrument}.link`]: link.replace(/\/+$/, "") },
            {
              [`${instrument}.link`]: link.endsWith("/")
                ? link.slice(0, -1)
                : `${link}/`,
            },
          ],
        },
      ],
    };

    let doc = await collection.findOne(filter);
    if (!doc) doc = await collection.findOne(fallback);

    if (!doc)
      return res.status(404).json({ message: "Documento não encontrado" });

    return res.status(200).json(doc);
  } catch (error) {
    console.error("GET /api/generalCifra error:", error);
    return res.status(500).json({ message: "Erro interno." });
  }
});

// Inicie o servidor HTTP (Express + Socket.IO)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
