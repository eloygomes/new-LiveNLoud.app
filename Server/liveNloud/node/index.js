require("dotenv").config();

const express = require("express");
const { MongoClient, Binary, ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp"); // Importar sharp
const fs = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const youtubeRoutes = require("./youtube/youtube.routes");
const cookieParser = require("cookie-parser");
const { createRuntime } = require("./server/runtime");

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error("MONGO_URI environment variable is required");
}
if (!process.env.ACCESS_SECRET || !process.env.REFRESH_SECRET) {
  throw new Error("ACCESS_SECRET and REFRESH_SECRET environment variables are required");
}
const client = new MongoClient(uri);
const APP_DATABASE_NAME = process.env.APP_DATABASE_NAME || "liveNloud_";
const appDatabase = () => client.db(APP_DATABASE_NAME);

async function postJson(url, payload, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `HTTP ${response.status}`,
    );
    error.response = { status: response.status, data };
    throw error;
  }

  return { status: response.status, data };
}

const pythonApiUrl = process.env.PYTHON_API_URL || "http://python_scraper:8000";

const app = express();
const PORT = process.env.PORT || 3000;

const defaultAllowedOrigins = [
  "https://live.eloygomes.com",
  "https://www.live.eloygomes.com",
];
const { applyCoreMiddleware } = createRuntime({ defaultAllowedOrigins });

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

applyCoreMiddleware(app);

app.use(cookieParser());

// ✅ exemplo (corrigido: usa o import já feito lá em cima)
app.use("/api/v1/youtube", youtubeRoutes);

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir arquivos públicos para download, como o pacote da extensão.
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

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

const GUITAR_PRO_ALLOWED_EXTENSIONS = new Set([
  "gp3",
  "gp4",
  "gp5",
  "gpx",
  "gp",
  "xml",
  "cap",
]);
const GUITAR_PRO_MAX_FILE_SIZE = 10 * 1024 * 1024;
const guitarProUploadDir = path.join(__dirname, "uploads", "guitarpro");

fs.mkdirSync(guitarProUploadDir, { recursive: true });

function getFileExtension(filename = "") {
  return String(filename).split(".").pop()?.toLowerCase() || "";
}

function sanitizeSlug(value = "") {
  return normalizeName(value) || "file";
}

function buildGuitarProStoredFileName({ email, artist, song, extension }) {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(2).toString("hex");
  return [
    sanitizeSlug(String(email || "").replace(/@/g, "-at-")),
    sanitizeSlug(artist),
    sanitizeSlug(song),
    timestamp,
    randomSuffix,
  ].join("-") + `.${extension}`;
}

const guitarProStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, guitarProUploadDir);
  },
  filename: (req, file, cb) => {
    const extension = getFileExtension(file.originalname);
    const fileName = buildGuitarProStoredFileName({
      email: req.body?.email,
      artist: req.body?.artist,
      song: req.body?.song,
      extension,
    });
    cb(null, fileName);
  },
});

const guitarProUpload = multer({
  storage: guitarProStorage,
  limits: { fileSize: GUITAR_PRO_MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const extension = getFileExtension(file.originalname);
    if (!GUITAR_PRO_ALLOWED_EXTENSIONS.has(extension)) {
      return cb(new Error("Formato de arquivo não suportado."));
    }
    return cb(null, true);
  },
});

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
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
      return res.status(400).json({
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
  "/api/v1/uploadProfileImage",
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
          result.upsertedId._id,
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
          "Erro: O email fornecido já possui uma imagem de perfil.",
        );
        res
          .status(400)
          .json({ error: "O email fornecido já possui uma imagem de perfil." });
      } else {
        console.error("Erro ao processar e salvar a imagem:", err);
        res.status(500).json({ error: "Erro ao processar e salvar a imagem" });
      }
    }
  },
);

app.get("/api/v1/profileImage/:email", async (req, res) => {
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

function sanitizeScrapeLink(link) {
  const raw = String(link || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const normalized = parsed.toString();
    const doubled = `${normalized}${normalized}`;
    if (raw === doubled) {
      return normalized;
    }
  } catch {
    // ignore invalid URL parsing here; fallback below
  }

  const half = Math.floor(raw.length / 2);
  if (
    half > 0 &&
    raw.length % 2 === 0 &&
    raw.slice(0, half) === raw.slice(half)
  ) {
    return raw.slice(0, half);
  }

  return raw;
}

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

  let doc = await collection.findOne(byNorm);
  if (!doc) doc = await collection.findOne(byRaw);
  if (!doc && artist && song) {
    const titleCandidates = await collection
      .find({
        $or: [
          { [`instruments.${inst}`]: true },
          { [`instruments.${inst}`]: "true" },
        ],
      })
      .toArray();
    doc = titleCandidates.find(
      (candidate) =>
        normalizeName(candidate.artist) === normalizeName(artist) &&
        normalizeName(candidate.song) === normalizeName(song),
    );
  }

  return doc || null;
}

/** Tenta encontrar o doc por algumas tentativas (para dar tempo do Python gravar). */
async function waitForGeneralCifraDoc(
  { instrument, link, artist, song },
  { retries = 10, intervalMs = 300 } = {},
) {
  for (let i = 0; i < retries; i++) {
    const found = await findGeneralCifraDoc({ instrument, link, artist, song });
    if (found) return found;
    await delay(intervalMs);
  }
  return null;
}

// Rota para chamar o serviço Python e realizar o scrape
app.post("/api/v1/scrape", async (req, res) => {
  console.log("[SCRAPE] called", { body: req.body });

  try {
    const { artist, song, instrument, email, instrument_progressbar, link } =
      req.body;
    const cleanLink = sanitizeScrapeLink(link);

    if (!instrument || !cleanLink) {
      return res
        .status(400)
        .json({ message: "instrument e link são obrigatórios." });
    }

    // 1) evita chamar o Python quando a cifra já está no banco geral
    const pyPayload = {
      artist,
      song,
      instrument,
      email,
      instrument_progressbar,
      link: cleanLink,
    };
    const requestLabel = `[SCRAPE] python request ${instrument}:${Date.now()}`;
    console.log("[SCRAPE] normalized link:", cleanLink);
    const existingGeneralDoc = await findGeneralCifraDoc({
      instrument,
      link: cleanLink,
      artist,
      song,
    });

    if (existingGeneralDoc) {
      console.log("[SCRAPE] returning existing general document:", {
        _id: existingGeneralDoc._id,
        artist: existingGeneralDoc.artist,
        song: existingGeneralDoc.song,
      });
      return res.status(200).json({
        message: "Data already available",
        document: existingGeneralDoc,
      });
    }

    // 2) dispara o scraper Python
    console.time(requestLabel);
    const response = await postJson(`${pythonApiUrl}/scrape`, pyPayload);
    console.timeEnd(requestLabel);
    console.log("[SCRAPE] python resp:", response.status, response.data);

    // 2) se Python respondeu sucesso, aguardamos o doc aparecer no Mongo
    if (response.status >= 200 && response.status < 300) {
      console.time("[SCRAPE] waitForGeneralCifraDoc");
      const doc = await waitForGeneralCifraDoc(
        { instrument, link: cleanLink, artist, song },
        { retries: 25, intervalMs: 400 }, // ~10 segundos
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
        "[SCRAPE] Document not found after waiting. Returning python response only.",
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
      const pyMessage =
        error.response.data?.message || "Erro ao chamar a API Python";
      const pyDetails = error.response.data?.details || "";
      return res.status(error.response.status).json({
        message: pyMessage,
        details: pyDetails,
        error: error.response.data,
      });
    } else if (error.request) {
      return res
        .status(500)
        .json({ message: "Nenhuma resposta recebida da API Python" });
    }
    return res.status(500).json({
      message: "Erro na configuração da requisição para a API Python",
    });
  }
});

// Rota para criar um novo usuário
app.post("/api/v1/signup", async (req, res) => {
  try {
    const { userdata, databaseComing, collectionComing } = req.body;
    const normalizedEmail = normalizeEmail(userdata.email);

    const database = client.db(databaseComing);
    const collection = database.collection(collectionComing);

    console.log("Verificando se o email já existe...");
    const query = { email: normalizedEmail };
    const existingUser = await collection.findOne(query);

    if (existingUser) {
      // Se o email já existir, retorna que o usuário já está cadastrado
      return res.status(200).json({
        message: "Usuário já cadastrado!",
      });
    }

    console.log("Email não existe, criando novo usuário...");

    const initialUserdata = createDefaultUserProfileSeed({
      email: normalizedEmail,
      username: userdata.username,
      fullName: userdata.fullName,
      existing: userdata,
    });

    // Cria um novo documento com o email e o array userdata
    const result = await collection.insertOne({
      email: normalizedEmail,
      userdata: [initialUserdata],
      availableSetlists: getDefaultUserSetlists(),
    });

    console.log("Usuário criado com sucesso:", result);

    return res.status(201).json({
      message: "Usuário criado com sucesso!",
      userId: result.insertedId,
      user: initialUserdata,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res
      .status(500)
      .json({ message: "Erro ao criar usuário", error: error.message });
  }
});

// Rota para adicionar ou atualizar uma música
app.post("/api/v1/newsong", authenticateJWT, async (req, res) => {
  try {
    let { userdata } = req.body;
    const { databaseComing, collectionComing } = req.body;

    // Verifica se os nomes estão presentes e válidos
    if (!databaseComing || !collectionComing) {
      return res
        .status(400)
        .json({ message: "Nome do banco de dados ou coleção não fornecido." });
    }

    const database = client.db(databaseComing.trim());
    const collection = database.collection(collectionComing.trim());

    if (!userdata?.email || !userdata?.artist || !userdata?.song) {
      return res.status(400).json({
        message: "Parâmetros obrigatórios: email, artist e song.",
      });
    }

    const ownerEmail = await requireSameUserEmail(
      req,
      res,
      userdata.email,
      "Usuario nao autorizado para criar ou atualizar esta musica.",
    );
    if (!ownerEmail) return;

    userdata.email = ownerEmail;
    userdata = await hydrateUserdataFromGeneralCifra(userdata);

    const query = { email: userdata.email };
    const existingUser = await collection.findOne(query);

    if (existingUser) {
      if (existingUser.userdata && Array.isArray(existingUser.userdata)) {
        const matchingIndexes = existingUser.userdata.reduce(
          (indexes, song, index) => {
            if (
              normalizeName(song.artist) === normalizeName(userdata.artist) &&
              normalizeName(song.song) === normalizeName(userdata.song)
            ) {
              indexes.push(index);
            }
            return indexes;
          },
          [],
        );

        if (matchingIndexes.length) {
          const [songIndex] = matchingIndexes;
          const duplicateEntries = matchingIndexes.map(
            (index) => existingUser.userdata[index],
          );
          const updatedSongData = mergeSongEntries(
            ...duplicateEntries,
            userdata,
          );
          updatedSongData.id =
            existingUser.userdata[songIndex].id || songIndex + 1;

          const nextUserdata = existingUser.userdata.filter(
            (_song, index) => !matchingIndexes.slice(1).includes(index),
          );
          nextUserdata[songIndex] = updatedSongData;

          const updateResult = await collection.updateOne(
            { email: userdata.email },
            { $set: { userdata: nextUserdata } },
          );

          console.log("Usuário atualizado com sucesso:", updateResult);

          await addUserLog({
            userEmail: userdata.email,
            action: "song_updated",
            message: `Updated song "${userdata.song}" by ${userdata.artist}.`,
            meta: { song: userdata.song, artist: userdata.artist },
          });

          return res.status(200).json({
            message: "Dados atualizados com sucesso!",
            updatedUser: updateResult,
          });
        } else {
          // Se não encontrar o registro correspondente, adicionar como novo
          userdata.id = existingUser.userdata.length + 1;
          const newSongData = mergeSongEntries(userdata);
          const updateResult = await collection.updateOne(
            { email: userdata.email },
            { $push: { userdata: newSongData } },
          );

          console.log("Novo registro adicionado com sucesso:", updateResult);

          await addUserLog({
            userEmail: userdata.email,
            action: "song_added",
            message: `Added song "${userdata.song}" by ${userdata.artist}.`,
            meta: { song: userdata.song, artist: userdata.artist },
          });

          return res.status(200).json({
            message: "Novo registro adicionado com sucesso!",
            updatedUser: updateResult,
          });
        }
      } else {
        console.log(
          "Documento contém apenas o campo email, inicializando o campo userdata...",
        );

        userdata.id = 1;
        const initialSongData = mergeSongEntries(userdata);

        const updateResult = await collection.updateOne(
          { email: userdata.email },
          { $set: { userdata: [initialSongData] } },
        );

        console.log(
          "Campo userdata inicializado e atualizado com sucesso:",
          updateResult,
        );

        await addUserLog({
          userEmail: userdata.email,
          action: "song_added",
          message: `Added song "${userdata.song}" by ${userdata.artist}.`,
          meta: { song: userdata.song, artist: userdata.artist },
        });

        return res.status(200).json({
          message: "Dados atualizados com sucesso!",
          updatedUser: updateResult,
        });
      }
    } else {
      console.log("Email não existe, criando novo usuário...");

      userdata.id = 1;
      const initialSongData = mergeSongEntries(userdata);

      const result = await collection.insertOne({
        email: userdata.email,
        userdata: [initialSongData],
      });

      console.log("Usuário criado com sucesso:", result);

      await addUserLog({
        userEmail: userdata.email,
        action: "song_added",
        message: `Added song "${userdata.song}" by ${userdata.artist}.`,
        meta: { song: userdata.song, artist: userdata.artist },
      });

      return res.status(201).json({
        message: "Usuário criado com sucesso!",
        userId: result.insertedId,
        user: initialSongData,
      });
    }
  } catch (error) {
    console.error("Erro ao criar ou atualizar o usuário:", error);
    res.status(500).json({ message: "Erro ao criar ou atualizar o usuário." });
  }
});

// Rota para buscar uma música específica no banco de dados
app.post("/api/v1/allsongdata", authenticateJWT, async (req, res) => {
  try {
    const { email, artist, song } = req.body;
    const ownerEmail = await requireSameUserEmail(
      req,
      res,
      email,
      "Usuario nao autorizado para consultar esta musica.",
    );
    if (!ownerEmail) return;

    const database = appDatabase();
    const collection = database.collection("data");

    // Verifica se os parâmetros foram passados
    if (!email || !artist || !song) {
      return res
        .status(400)
        .json({ message: "Email, artist e song são obrigatórios." });
    }

    // Busca o documento pelo email
    const user = await collection.findOne({ email: ownerEmail });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Busca a música específica no array 'userdata'
    const musicData = user.userdata.find(
      (item) =>
        normalizeName(item.artist) === normalizeName(artist) &&
        normalizeName(item.song) === normalizeName(song),
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
app.post("/api/v1/deleteonesong", authenticateJWT, async (req, res) => {
  try {
    const { email, artist, song } = req.body;
    const ownerEmail = await requireSameUserEmail(
      req,
      res,
      email,
      "Usuario nao autorizado para deletar esta musica.",
    );
    if (!ownerEmail) return;

    const database = appDatabase();
    const collection = database.collection("data");

    // Verifica se os parâmetros foram passados
    if (!email || !artist || !song) {
      return res
        .status(400)
        .json({ message: "Email, artist e song são obrigatórios." });
    }

    // Busca o documento pelo email e remove a música específica do array 'userdata'
    const updateResult = await collection.updateOne(
      { email: ownerEmail },
      { $pull: { userdata: { artist: artist, song: song } } },
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
app.get("/api/v1/alldata/:email", authenticateJWT, async (req, res) => {
  try {
    const { email } = req.params;
    const ownerEmail = await requireSameUserEmail(
      req,
      res,
      email,
      "Usuario nao autorizado para consultar estes dados.",
    );
    if (!ownerEmail) return;

    const database = appDatabase();
    const collection = database.collection("data");

    const user = await collection.findOne({ email: ownerEmail });

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
app.get("/api/v1/alldata/", async (req, res) => {
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
app.put("/api/v1/updateUsername", async (req, res) => {
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
      { $set: { "userdata.$[].username": newUsername } },
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
app.put("/api/v1/lastPlay", async (req, res) => {
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
      (u) => u.song === song && u.artist === artist,
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
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] },
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
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] },
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
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] },
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
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] },
    );

    // 5) Agora sim, dá o push com segurança e atualiza o resumo da música.
    const playedAt = new Date();
    const updateResult = await collection.updateOne(
      { email, "userdata.song": song, "userdata.artist": artist },
      {
        $push: { [`userdata.$[elem].${instrument}.lastPlay`]: playedAt },
        $set: {
          "userdata.$[elem].lastPlayed": playedAt,
          "userdata.$[elem].updateIn": playedAt.toISOString().split("T")[0],
        },
      },
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] },
    );

    await addUserLog({
      userEmail: email,
      action: "song_last_played",
      message: `Played "${song}" by ${artist} on ${instrument}.`,
      meta: { song, artist, instrument },
    });

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
app.get("/api/v1/downloadUserData/:email", async (req, res) => {
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

// Route to delete all songs while preserving the account shell.
app.post("/api/v1/deleteAllUserSongs", authenticateJWT, async (req, res) => {
  try {
    const email = await requireSameUserEmail(
      req,
      res,
      req.body?.email,
      "Usuario nao autorizado para deletar estas musicas.",
    );
    if (!email) return;

    // Validate that email is provided
    if (!email) {
      console.log("Email not provided in the request.");
      return res.status(400).json({ message: "Email is required." });
    }

    const database = appDatabase(); // Your database name
    const collection = database.collection("data"); // Your collection name

    // Find the user document
    const user = await collection.findOne({ email: email });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return res.status(404).json({ message: "User not found." });
    }

    // Ensure userdata is an array
    if (!Array.isArray(user.userdata)) {
      console.log(`userdata for ${email} is not an array.`);
      return res.status(400).json({ message: "Invalid userdata format." });
    }

    const profileEntry =
      user.userdata.find(
        (entry) =>
          !String(entry?.song || "").trim() &&
          !String(entry?.artist || "").trim(),
      ) || user.userdata[0];

    const preservedEntry = createDefaultUserProfileSeed({
      email,
      username: profileEntry?.username,
      fullName: profileEntry?.fullName,
      existing: profileEntry,
    });

    const updateResult = await collection.updateOne(
      { email },
      {
        $set: {
          userdata: [preservedEntry],
          availableSetlists: getDefaultUserSetlists(),
        },
      },
    );

    console.log("Update result:", updateResult);

    if (updateResult.matchedCount === 0) {
      console.log(`No documents matched for email: ${email}`);
      return res.status(404).json({ message: "User not found." });
    }

    if (updateResult.modifiedCount === 0) {
      console.log(`No songs were deleted for email: ${email}`);
      return res.status(200).json({
        message: "No songs were deleted.",
        modifiedCount: updateResult.modifiedCount,
      });
    }

    // Fetch the updated document to confirm the changes
    const updatedUser = await collection.findOne({ email: email });

    return res.status(200).json({
      message: "Todas as músicas do usuário foram deletadas com sucesso!",
      modifiedCount: updateResult.modifiedCount,
      remainingSongs: updatedUser.userdata,
    });
  } catch (error) {
    console.error("Error deleting songs:", error);
    res.status(500).json({ message: "Error deleting songs." });
  }
});

// Rota para deletar a conta completa do usuário
app.post("/api/v1/deleteUserAccount", authenticateJWT, async (req, res) => {
  try {
    const email = await requireSameUserEmail(
      req,
      res,
      req.body?.email,
      "Usuario nao autorizado para deletar esta conta.",
    );
    if (!email) return;
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email e senha sao obrigatorios." });
    }

    const database = appDatabase();
    const collection = database.collection("data");
    const profileImages = database.collection("profileImages");
    const authUser = await authCollection.findOne({ email });

    if (!authUser) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    const valid = await bcrypt.compare(password, authUser.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const deleteResult = await collection.deleteOne({ email });
    await profileImages.deleteOne({ email });
    await authCollection.deleteOne({ email });
    await notificationsCollection.deleteMany({ userEmail: email });
    await invitationsCollection.deleteMany({
      $or: [{ senderEmail: email }, { receiverEmail: email }],
    });
    await setlistSharesCollection.deleteMany({
      $or: [{ senderEmail: email }, { recipientEmail: email }],
    });
    await userLogsCollection.deleteMany({ userEmail: email });
    await calendarEventsCollection.deleteMany({ ownerEmail: email });
    await calendarEventsCollection.updateMany(
      {},
      {
        $pull: {
          invitedUsers: { email },
          pendingInvitedUsers: { email },
        },
      },
    );
    await authCollection.updateMany(
      {},
      {
        $pull: {
          acceptedInvitations: { counterpartEmail: email },
        },
      },
    );

    console.log("Resultado da operação de deletar:", deleteResult);

    return res.status(200).json({
      message: "Conta do usuário deletada com sucesso!",
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Erro ao deletar a conta do usuário:", error);
    res.status(500).json({ message: "Erro ao deletar a conta do usuário." });
  }
});

// Rota para criar ou atualizar uma música no banco geral
app.post("/api/v1/createMusic", async (req, res) => {
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
      guitar01: prepareInstrumentBlockForStorage(stripProgress(guitar01)),
      guitar02: prepareInstrumentBlockForStorage(stripProgress(guitar02)),
      bass: prepareInstrumentBlockForStorage(stripProgress(bass)),
      keys: prepareInstrumentBlockForStorage(stripProgress(keys)),
      drums: prepareInstrumentBlockForStorage(stripProgress(drums)),
      voice: prepareInstrumentBlockForStorage(stripProgress(voice)),
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
      // Helper para mesclar sub-documento de instrumento
      const mergeInstrument = (inst) => {
        if (!incoming[inst]) return existing[inst]; // nada novo
        const oldDoc = existing[inst] || {};
        return prepareInstrumentBlockForStorage(
          mergeInstrumentBlock(oldDoc, incoming[inst]),
        );
      };

      const mergedBlocks = {
        guitar01: mergeInstrument("guitar01"),
        guitar02: mergeInstrument("guitar02"),
        bass: mergeInstrument("bass"),
        keys: mergeInstrument("keys"),
        drums: mergeInstrument("drums"),
        voice: mergeInstrument("voice"),
      };

      const mergedInstruments = normalizeInstrumentFlags({
        ...existing,
        ...incoming,
        ...mergedBlocks,
        instruments: {
          ...existing.instruments,
          ...incoming.instruments,
        },
      });
      const mergedSetlist = normalizeSetlistForInstrumentFlags(
        [...(existing.setlist || []), ...(incoming.setlist || [])],
        mergedInstruments,
      );

      const update = {
        $set: {
          progressBar: incoming.progressBar ?? existing.progressBar,
          instruments: mergedInstruments,
          guitar01: mergedBlocks.guitar01,
          guitar02: mergedBlocks.guitar02,
          bass: mergedBlocks.bass,
          keys: mergedBlocks.keys,
          drums: mergedBlocks.drums,
          voice: mergedBlocks.voice,
          setlist: mergedSetlist,
          updateIn: incoming.updateIn,
        },
        $addToSet: {
          embedVideos: { $each: incoming.embedVideos },
        },
      };

      await collection.updateOne(filter, update);

      return res.status(200).json({
        message: "Música existente atualizada com sucesso.",
      });
    }

    // ---------- se não existe -> cria novo documento ---------------
    const newInstruments = normalizeInstrumentFlags(incoming);
    const newMusic = {
      ...incoming,
      instruments: newInstruments,
      setlist: normalizeSetlistForInstrumentFlags(incoming.setlist, newInstruments),
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
const authDatabase = appDatabase();
const authCollection = authDatabase.collection("authUsers");
const userDataCollection = authDatabase.collection("data");
const notificationsCollection = authDatabase.collection("notifications");
const invitationsCollection = authDatabase.collection("invitations");
const calendarEventsCollection = authDatabase.collection("calendarEvents");
const setlistSharesCollection = authDatabase.collection("setlistShares");
const userLogsCollection = authDatabase.collection("userLogs");
const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "https://live.eloygomes.com";
const DEFAULT_USER_SETLISTS = [
  "guitar01",
  "guitar02",
  "bass",
  "keys",
  "drums",
  "voice",
];
const MIN_BCRYPT_ROUNDS = 12;
const BCRYPT_ROUNDS = (() => {
  const parsed = Number(process.env.BCRYPT_ROUNDS || MIN_BCRYPT_ROUNDS);
  if (!Number.isInteger(parsed) || parsed < MIN_BCRYPT_ROUNDS) {
    throw new Error(`BCRYPT_ROUNDS must be an integer >= ${MIN_BCRYPT_ROUNDS}`);
  }
  return parsed;
})();

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function fallbackUsernameFromEmail(email = "") {
  return normalizeEmail(email).split("@")[0] || "user";
}

function normalizeUsername(username = "") {
  return String(username).trim().replace(/^@+/, "").toLowerCase();
}

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function getDefaultUserSetlists() {
  return [...DEFAULT_USER_SETLISTS];
}

function createDefaultUserProfileSeed({
  email = "",
  username = "",
  fullName = "",
  existing = {},
} = {}) {
  const today = new Date().toISOString().split("T")[0];
  const source = existing && typeof existing === "object" ? existing : {};
  const emptyInstrument = {
    active: "",
    capo: "",
    lastPlay: "",
    link: "",
    progress: "",
    songCifra: "",
    tuning: "",
  };

  return {
    id: 1,
    song: "",
    artist: "",
    progressBar: 0,
    instruments: {
      guitar01: false,
      guitar02: false,
      bass: false,
      keys: false,
      drums: false,
      voice: false,
    },
    guitar01: { ...emptyInstrument },
    guitar02: { ...emptyInstrument },
    bass: { ...emptyInstrument },
    keys: { ...emptyInstrument },
    drums: { ...emptyInstrument },
    voice: { ...emptyInstrument },
    embedVideos: [],
    setlist: getDefaultUserSetlists(),
    addedIn: source.addedIn || today,
    updateIn: today,
    email: normalizeEmail(email || source.email || ""),
    username: username || source.username || "",
    fullName: fullName || source.fullName || "",
  };
}

function buildSafeUserProfile({ authUser, dataDoc }) {
  const firstUserData = Array.isArray(dataDoc?.userdata)
    ? dataDoc.userdata.find((entry) => entry && typeof entry === "object")
    : null;

  const email = normalizeEmail(authUser?.email || dataDoc?.email || "");
  const username =
    normalizeUsername(firstUserData?.username) ||
    fallbackUsernameFromEmail(email);

  return {
    id: String(authUser?._id || dataDoc?._id || ""),
    email,
    username,
    usernameDisplay: firstUserData?.username || username,
    fullName: firstUserData?.fullName || "",
    acceptedInvitations: Array.isArray(authUser?.acceptedInvitations)
      ? authUser.acceptedInvitations
      : [],
  };
}

async function getCurrentUserProfile(req) {
  const authUser = await authCollection.findOne({
    _id: new ObjectId(req.user.userId),
  });

  if (!authUser?.email) return null;

  const dataDoc = await userDataCollection.findOne({
    email: normalizeEmail(authUser.email),
  });

  return buildSafeUserProfile({ authUser, dataDoc });
}

async function getCurrentUserEmail(req) {
  const currentUser = await getCurrentUserProfile(req);
  return normalizeEmail(currentUser?.email || "");
}

async function requireSameUserEmail(req, res, requestedEmail, message = "Usuario nao autorizado.") {
  const normalizedRequestedEmail = normalizeEmail(requestedEmail);
  const currentUserEmail = await getCurrentUserEmail(req);

  if (!normalizedRequestedEmail) {
    res.status(400).json({ message: "Email e obrigatorio." });
    return null;
  }

  if (!currentUserEmail || currentUserEmail !== normalizedRequestedEmail) {
    res.status(403).json({ message });
    return null;
  }

  return currentUserEmail;
}

async function findUserByUsernameOrEmail(value = "") {
  const rawValue = String(value || "").trim();
  if (!rawValue) return null;

  const normalizedEmail = normalizeEmail(rawValue);
  const normalizedUsername = normalizeUsername(rawValue);

  const authUser = rawValue.includes("@")
    ? await authCollection.findOne({ email: normalizedEmail })
    : null;

  if (authUser) {
    const dataDoc = await userDataCollection.findOne({ email: authUser.email });
    return buildSafeUserProfile({ authUser, dataDoc });
  }

  const dataDocs = await userDataCollection
    .find({ userdata: { $elemMatch: { username: { $exists: true } } } })
    .project({ email: 1, userdata: 1 })
    .toArray();

  const matchedDataDoc = dataDocs.find((doc) =>
    Array.isArray(doc.userdata)
      ? doc.userdata.some(
          (entry) =>
            normalizeUsername(entry?.username || "") === normalizedUsername,
        )
      : false,
  );

  if (!matchedDataDoc?.email) return null;

  const matchedAuthUser = await authCollection.findOne({
    email: normalizeEmail(matchedDataDoc.email),
  });

  if (!matchedAuthUser) return null;

  return buildSafeUserProfile({
    authUser: matchedAuthUser,
    dataDoc: matchedDataDoc,
  });
}

async function findUserByEmail(email = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) return null;

  const authUser = await authCollection.findOne({ email: normalizedEmail });
  if (!authUser) return null;

  const dataDoc = await userDataCollection.findOne({ email: normalizedEmail });
  return buildSafeUserProfile({ authUser, dataDoc });
}

function areUsersFriends(userProfile, targetEmail) {
  const normalizedTargetEmail = normalizeEmail(targetEmail);
  return Array.isArray(userProfile?.acceptedInvitations)
    ? userProfile.acceptedInvitations.some(
        (item) =>
          normalizeEmail(item?.counterpartEmail || "") ===
          normalizedTargetEmail,
      )
    : false;
}

async function saveAcceptedInvitationForUser(userEmail, acceptedInvitation) {
  const normalizedEmail = normalizeEmail(userEmail);
  const authUser = await authCollection.findOne({ email: normalizedEmail });
  if (!authUser) return;

  const currentAcceptedInvitations = Array.isArray(authUser.acceptedInvitations)
    ? authUser.acceptedInvitations
    : [];

  const nextAcceptedInvitations = [
    ...currentAcceptedInvitations.filter(
      (item) =>
        normalizeEmail(item?.counterpartEmail || "") !==
        normalizeEmail(acceptedInvitation.counterpartEmail || ""),
    ),
    acceptedInvitation,
  ];

  await authCollection.updateOne(
    { _id: authUser._id },
    { $set: { acceptedInvitations: nextAcceptedInvitations } },
  );
}

async function removeAcceptedInvitationForUser(userEmail, counterpartEmail) {
  const normalizedEmail = normalizeEmail(userEmail);
  const authUser = await authCollection.findOne({ email: normalizedEmail });
  if (!authUser) return;

  const nextAcceptedInvitations = Array.isArray(authUser.acceptedInvitations)
    ? authUser.acceptedInvitations.filter(
        (item) =>
          normalizeEmail(item?.counterpartEmail || "") !==
          normalizeEmail(counterpartEmail),
      )
    : [];

  await authCollection.updateOne(
    { _id: authUser._id },
    { $set: { acceptedInvitations: nextAcceptedInvitations } },
  );
}

async function addUserLog({ userEmail, action, message, meta = {} }) {
  const normalizedEmail = normalizeEmail(userEmail);
  if (!normalizedEmail) return;

  await userLogsCollection.insertOne({
    userEmail: normalizedEmail,
    action,
    message,
    meta,
    createdAt: new Date(),
  });
}

function extractMentionedUsernames(text = "") {
  const matches = String(text || "").match(/@([a-zA-Z0-9_.-]{3,30})/g) || [];
  return Array.from(new Set(matches.map((match) => normalizeUsername(match))));
}

function extractEmails(text = "") {
  const matches =
    String(text || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  return Array.from(new Set(matches.map((email) => normalizeEmail(email))));
}

async function createNotification({
  recipient,
  actor,
  type,
  title,
  message,
  meta = {},
}) {
  const now = new Date();
  const notification = {
    userEmail: recipient.email,
    userId: recipient.id,
    username: recipient.usernameDisplay,
    type,
    title,
    message,
    read: false,
    actor: actor
      ? {
          email: actor.email,
          username: actor.usernameDisplay,
          fullName: actor.fullName || "",
        }
      : null,
    meta,
    createdAt: now,
    updatedAt: now,
  };

  const result = await notificationsCollection.insertOne(notification);
  const savedNotification = {
    ...notification,
    _id: result.insertedId,
  };

  return savedNotification;
}

function serializeNotification(notification = {}) {
  return {
    ...notification,
    _id: notification._id?.toString?.() || String(notification._id || ""),
    createdAt: notification.createdAt || null,
    updatedAt: notification.updatedAt || null,
  };
}

function serializeInvitation(invitation = {}) {
  return {
    ...invitation,
    _id: invitation._id?.toString?.() || String(invitation._id || ""),
    createdAt: invitation.createdAt || null,
    updatedAt: invitation.updatedAt || null,
  };
}

function serializeCalendarEvent(event = {}) {
  return {
    ...event,
    _id: event._id?.toString?.() || String(event._id || ""),
    createdAt: event.createdAt || null,
    updatedAt: event.updatedAt || null,
    startsAt: event.startsAt || null,
    invitedUsers: Array.isArray(event.invitedUsers) ? event.invitedUsers : [],
    pendingInvitedUsers: Array.isArray(event.pendingInvitedUsers)
      ? event.pendingInvitedUsers
      : [],
  };
}

function serializeSetlistShare(share = {}) {
  return {
    ...share,
    _id: share._id?.toString?.() || String(share._id || ""),
    createdAt: share.createdAt || null,
    updatedAt: share.updatedAt || null,
    respondedAt: share.respondedAt || null,
    songs: Array.isArray(share.songs) ? share.songs : [],
    setlistNames: Array.isArray(share.setlistNames) ? share.setlistNames : [],
  };
}

(async () => {
  await notificationsCollection.createIndex({ userEmail: 1, createdAt: -1 });
  await notificationsCollection.createIndex({ userEmail: 1, read: 1 });
  await invitationsCollection.createIndex(
    { senderEmail: 1, receiverEmail: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: "pending" } },
  );
  await invitationsCollection.createIndex({ receiverEmail: 1, createdAt: -1 });
  await calendarEventsCollection.createIndex({ ownerEmail: 1, startsAt: 1 });
  await calendarEventsCollection.createIndex({
    "invitedUsers.email": 1,
    startsAt: 1,
  });
  await userLogsCollection.createIndex({ userEmail: 1, createdAt: -1 });
})();

async function sendPasswordResetEmail({ email, resetUrl }) {
  const smtp = createSmtpTransporter();
  if (!smtp) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  await smtp.transporter.sendMail({
    from: smtp.from,
    to: email,
    subject: "Redefinicao de senha - Sustenido",
    text:
      "Recebemos uma solicitacao para redefinir sua senha.\n\n" +
      `Abra este link: ${resetUrl}\n\n` +
      "Se voce nao pediu essa alteracao, ignore este e-mail.",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Redefinicao de senha</h2>
        <p>Recebemos uma solicitacao para redefinir sua senha.</p>
        <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p>
        <p>Se voce nao pediu essa alteracao, ignore este e-mail.</p>
      </div>
    `,
  });

  return { sent: true };
}

function createSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const tlsServername = process.env.SMTP_TLS_SERVERNAME || host;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: { servername: tlsServername },
    }),
    from,
  };
}

function getApprovalAdminEmails() {
  const raw = process.env.APPROVAL_ADMIN_EMAILS || process.env.SMTP_USER || "";
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => normalizeEmail(value))
        .filter(Boolean),
    ),
  );
}

async function sendSignupApprovalRequestEmail({
  userEmail,
  fullName = "",
  username = "",
  approveUrl,
  rejectUrl,
}) {
  const smtp = createSmtpTransporter();
  const adminEmails = getApprovalAdminEmails();

  if (!smtp || !adminEmails.length) {
    return { sent: false, reason: "smtp_or_admin_not_configured" };
  }

  const displayName = fullName || username || userEmail;

  await smtp.transporter.sendMail({
    from: smtp.from,
    to: adminEmails.join(", "),
    subject: "Novo cadastro aguardando aprovacao - Sustenido",
    text:
      `Um novo usuario criou conta e aguarda aprovacao.\n\n` +
      `Nome: ${displayName}\n` +
      `Username: ${username || "-"}\n` +
      `Email: ${userEmail}\n\n` +
      `Aprovar: ${approveUrl}\n` +
      `Rejeitar: ${rejectUrl}\n`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Novo cadastro aguardando aprovacao</h2>
        <p><strong>Nome:</strong> ${displayName}</p>
        <p><strong>Username:</strong> ${username || "-"}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p>
          <a href="${approveUrl}" style="display:inline-block;padding:10px 16px;background:#1f7a1f;color:#fff;text-decoration:none;border-radius:6px;margin-right:8px;">Aprovar usuario</a>
          <a href="${rejectUrl}" style="display:inline-block;padding:10px 16px;background:#a11d1d;color:#fff;text-decoration:none;border-radius:6px;">Rejeitar usuario</a>
        </p>
      </div>
    `,
  });

  return { sent: true };
}

async function sendApprovalStatusEmail({ email, approved }) {
  const smtp = createSmtpTransporter();
  if (!smtp) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const subject = approved
    ? "Sua conta foi aprovada - Sustenido"
    : "Sua conta nao foi aprovada - Sustenido";
  const text = approved
    ? `Sua conta foi aprovada. Voce ja pode acessar: ${FRONTEND_BASE_URL}/login`
    : "Sua solicitacao de acesso nao foi aprovada. Se precisar, entre em contato com o administrador.";

  await smtp.transporter.sendMail({
    from: smtp.from,
    to: email,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>${approved ? "Conta aprovada" : "Conta nao aprovada"}</h2>
        <p>${approved ? `Sua conta foi aprovada. <a href="${FRONTEND_BASE_URL}/login">Entrar no sistema</a>.` : "Sua solicitacao de acesso nao foi aprovada. Se precisar, entre em contato com o administrador."}</p>
      </div>
    `,
  });

  return { sent: true };
}

function renderApprovalHtml({ title, message }) {
  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f6f3eb; color: #1f2937; padding: 32px; }
        .card { max-width: 640px; margin: 10vh auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 12px 40px rgba(0,0,0,.08); }
        h1 { margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
  </html>`;
}

// Helpers
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "24h";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const genAccessToken = (id) =>
  jwt.sign({ userId: id }, process.env.ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
const genRefreshToken = (id) =>
  jwt.sign({ userId: id }, process.env.REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

// Rota de cadastro
app.post("/api/v1/auth/signup", async (req, res) => {
  const email = normalizeEmail(req.body?.email || "");
  const password = String(req.body?.password || "");
  const fullName = String(req.body?.fullName || "").trim();
  const username = String(req.body?.username || "").trim();

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: "Email e senha sao obrigatorios" });
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const existing = await authCollection.findOne({ email });

    if (existing) {
      if (existing.approvalStatus === "pending") {
        return res.status(200).json({
          message: "Cadastro ja realizado e aguardando aprovacao.",
          approvalStatus: "pending",
          delivery: "unknown",
        });
      }

      return res.status(400).json({ error: "Email já registrado" });
    }

    const rawApprovalToken = crypto.randomBytes(32).toString("hex");
    const approvalTokenHash = crypto
      .createHash("sha256")
      .update(rawApprovalToken)
      .digest("hex");
    const approveUrl =
      `${process.env.API_PUBLIC_BASE_URL || "https://api.live.eloygomes.com"}/api/v1/auth/approve-account` +
      `?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawApprovalToken)}&decision=approve`;
    const rejectUrl =
      `${process.env.API_PUBLIC_BASE_URL || "https://api.live.eloygomes.com"}/api/v1/auth/approve-account` +
      `?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawApprovalToken)}&decision=reject`;

    await authCollection.insertOne({
      email,
      passwordHash: hash,
      approvalStatus: "pending",
      approvalRequestedAt: new Date(),
      approvalTokenHash,
      userdata: " ",
    });

    let mailResult = { sent: false, reason: "not_attempted" };
    try {
      mailResult = await sendSignupApprovalRequestEmail({
        userEmail: email,
        fullName,
        username,
        approveUrl,
        rejectUrl,
      });
    } catch (mailError) {
      console.error("Erro ao enviar email de aprovacao:", {
        message: mailError?.message,
        code: mailError?.code,
        command: mailError?.command,
        smtpHost: process.env.SMTP_HOST,
        approvalAdmins: getApprovalAdminEmails(),
      });
      mailResult = {
        sent: false,
        reason: mailError?.code || "mail_send_failed",
      };
    }

    res.status(201).json({
      message: "Cadastro recebido e aguardando aprovacao.",
      approvalStatus: "pending",
      delivery: mailResult.sent ? "sent" : mailResult.reason,
    });
  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Rota de login
app.post("/api/v1/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email || "");
  const password = String(req.body?.password || "");
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

    if (user.approvalStatus === "rejected") {
      return res.status(403).json({
        error:
          "Sua conta nao foi aprovada. Entre em contato com o administrador.",
      });
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({
        error: "Sua conta ainda aguarda aprovacao.",
      });
    }

    const accessToken = genAccessToken(user._id.toString());
    const refreshToken = genRefreshToken(user._id.toString());

    await authCollection.updateOne(
      { _id: user._id },
      { $set: { refreshToken } },
    );

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Erro ao logar:", err); // <-- log detalhado
    res.status(500).json({ error: "Erro interno" });
  }
});

app.get("/api/v1/auth/approve-account", async (req, res) => {
  const email = normalizeEmail(req.query?.email || "");
  const token = String(req.query?.token || "");
  const decision = String(req.query?.decision || "approve").toLowerCase();

  if (!email || !token || !["approve", "reject"].includes(decision)) {
    return res.status(400).send(
      renderApprovalHtml({
        title: "Link invalido",
        message: "Os parametros de aprovacao estao incompletos ou invalidos.",
      }),
    );
  }

  try {
    const approvalTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await authCollection.findOne({ email, approvalTokenHash });

    if (!user) {
      return res.status(404).send(
        renderApprovalHtml({
          title: "Solicitacao nao encontrada",
          message:
            "Nao foi possivel localizar uma solicitacao pendente para este link.",
        }),
      );
    }

    const nextStatus = decision === "approve" ? "approved" : "rejected";

    await authCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          approvalStatus: nextStatus,
          approvedAt: decision === "approve" ? new Date() : null,
          rejectedAt: decision === "reject" ? new Date() : null,
        },
        $unset: {
          approvalTokenHash: "",
        },
      },
    );

    await sendApprovalStatusEmail({ email, approved: decision === "approve" });

    return res.send(
      renderApprovalHtml({
        title: decision === "approve" ? "Conta aprovada" : "Conta rejeitada",
        message:
          decision === "approve"
            ? `O usuario ${email} foi aprovado com sucesso.`
            : `O usuario ${email} foi rejeitado com sucesso.`,
      }),
    );
  } catch (error) {
    console.error("Erro ao processar aprovacao de conta:", error);
    return res.status(500).send(
      renderApprovalHtml({
        title: "Erro interno",
        message: "Nao foi possivel concluir esta acao agora.",
      }),
    );
  }
});

app.put("/api/v1/auth/updatePassword", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Email, senha atual e nova senha sao obrigatorios.",
    });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({
      message: "A nova senha deve ter pelo menos 8 caracteres.",
    });
  }

  try {
    const user = await authCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Senha atual invalida." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        message: "A nova senha nao pode ser igual a senha atual.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await authCollection.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: {
          refreshToken: "",
          resetPasswordTokenHash: "",
          resetPasswordExpiresAt: "",
        },
      },
    );

    return res.json({ message: "Senha atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar senha:", err);
    return res
      .status(500)
      .json({ message: "Erro interno ao atualizar senha." });
  }
});

app.post("/api/v1/auth/request-password-reset", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email e obrigatorio." });
  }

  try {
    const user = await authCollection.findOne({ email });
    const genericMessage =
      "Se o email existir, voce recebera um link para redefinir a senha.";

    if (!user) {
      return res.json({ message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordTokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    const resetUrl =
      `${FRONTEND_BASE_URL}/newpassword?token=${encodeURIComponent(rawToken)}` +
      `&email=${encodeURIComponent(email)}`;

    await authCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordTokenHash,
          resetPasswordExpiresAt,
        },
      },
    );

    const mailResult = await sendPasswordResetEmail({ email, resetUrl });
    const response = { message: genericMessage };

    if (!mailResult.sent) {
      response.delivery = mailResult.reason;
      if (process.env.NODE_ENV !== "production") {
        response.resetUrl = resetUrl;
      }
    }

    return res.json(response);
  } catch (err) {
    console.error("Erro ao solicitar reset de senha:", err);
    return res
      .status(500)
      .json({ message: "Erro interno ao solicitar reset de senha." });
  }
});

app.post("/api/v1/auth/reset-password", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const token = String(req.body?.token || "");
  const newPassword = String(req.body?.newPassword || "");

  if (!email || !token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email, token e nova senha sao obrigatorios." });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "A nova senha deve ter pelo menos 8 caracteres.",
    });
  }

  try {
    const resetPasswordTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await authCollection.findOne({
      email,
      resetPasswordTokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Link invalido ou expirado. Solicite um novo reset.",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        message: "A nova senha nao pode ser igual a senha anterior.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await authCollection.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: {
          refreshToken: "",
          resetPasswordTokenHash: "",
          resetPasswordExpiresAt: "",
        },
      },
    );

    return res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    return res
      .status(500)
      .json({ message: "Erro interno ao redefinir senha." });
  }
});

// Rota de refresh token
app.post("/api/v1/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await authCollection.findOne({
      _id: new ObjectId(payload.userId),
    });

    if (!user || user.refreshToken !== refreshToken) return res.sendStatus(403);
    if (user.approvalStatus !== "approved") return res.sendStatus(403);

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

async function requireAuthorizedSongOwner(req, res) {
  const requestedEmail = normalizeEmail(req.body?.email || req.query?.email || "");
  if (!requestedEmail) {
    res.status(400).json({ message: "Email é obrigatório." });
    return null;
  }

  const currentUser = await getCurrentUserProfile(req);
  if (!currentUser?.email || normalizeEmail(currentUser.email) !== requestedEmail) {
    res.status(403).json({ message: "Usuário não autorizado para esta música." });
    return null;
  }

  return requestedEmail;
}

async function findUserSongRecord({ email, artist, song }) {
  const database = client.db("liveNloud_");
  const collection = database.collection("data");
  const userDoc = await collection.findOne({ email });

  if (!userDoc || !Array.isArray(userDoc.userdata)) {
    return { collection, userDoc: null, songIndex: -1, songEntry: null };
  }

  const songIndex = userDoc.userdata.findIndex(
    (entry) =>
      normalizeName(entry.artist) === normalizeName(artist) &&
      normalizeName(entry.song) === normalizeName(song),
  );

  return {
    collection,
    userDoc,
    songIndex,
    songEntry: songIndex >= 0 ? userDoc.userdata[songIndex] : null,
  };
}

function getGuitarProFileCollection() {
  return client.db("liveNloud_").collection("guitarpro_files");
}

function runGuitarProUpload(req, res) {
  return new Promise((resolve, reject) => {
    guitarProUpload.single("file")(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(req.file);
    });
  });
}

// Rota protegida de teste
app.get("/api/v1/protected", authenticateJWT, (req, res) => {
  res.json({
    message: "Você acessou uma rota protegida!",
    userId: req.user.userId,
  });
});

app.get("/api/v1/me", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.json(currentUser);
  } catch (error) {
    console.error("GET /api/v1/me error:", error);
    return res.status(500).json({ message: "Erro interno ao buscar usuário." });
  }
});

app.post("/api/v1/guitarpro/upload", authenticateJWT, async (req, res) => {
  let storedFilePath = "";

  try {
    await runGuitarProUpload(req, res);

    if (!req.file) {
      return res.status(400).json({ message: "Arquivo não enviado." });
    }

    storedFilePath = req.file.path;
    const email = await requireAuthorizedSongOwner(req, res);
    if (!email) {
      fs.unlink(storedFilePath, () => {});
      return;
    }

    const { artist, song } = req.body || {};
    if (!artist || !song) {
      fs.unlink(storedFilePath, () => {});
      return res.status(400).json({ message: "artist e song são obrigatórios." });
    }

    const { collection, userDoc, songIndex, songEntry } = await findUserSongRecord({
      email,
      artist,
      song,
    });

    if (!userDoc || songIndex < 0 || !songEntry) {
      fs.unlink(storedFilePath, () => {});
      return res.status(404).json({ message: "Música não encontrada." });
    }

    const extension = getFileExtension(req.file.filename);
    const fileId = crypto.randomUUID();
    const uploadedAt = new Date().toISOString();
    const nextFiles = Array.isArray(songEntry.guitarProFiles)
      ? [...songEntry.guitarProFiles]
      : [];
    const nextFile = {
      id: fileId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      extension,
      mimeType: req.file.mimetype || "application/octet-stream",
      size: req.file.size,
      url: `/uploads/guitarpro/${req.file.filename}`,
      uploadedAt,
    };

    const fileBuffer = fs.readFileSync(storedFilePath);
    await getGuitarProFileCollection().updateOne(
      { fileId },
      {
        $set: {
          fileId,
          email,
          artist,
          song,
          normalizedArtist: normalizeName(artist),
          normalizedSong: normalizeName(song),
          originalName: req.file.originalname,
          fileName: req.file.filename,
          extension,
          mimeType: req.file.mimetype || "application/octet-stream",
          size: req.file.size,
          data: new Binary(fileBuffer),
          uploadedAt,
        },
      },
      { upsert: true },
    );

    nextFiles.push(nextFile);

    const nextUserdata = [...userDoc.userdata];
    nextUserdata[songIndex] = mergeSongEntries(songEntry, {
      guitarProFiles: nextFiles,
    });

    await collection.updateOne({ email }, { $set: { userdata: nextUserdata } });
    return res.status(200).json({ guitarProFiles: nextFiles, song: nextUserdata[songIndex] });
  } catch (error) {
    if (storedFilePath) {
      fs.unlink(storedFilePath, () => {});
    }
    console.error("Erro ao enviar arquivo Guitar Pro:", error);
    return res.status(
      error?.message === "Formato de arquivo não suportado." ||
        error?.code === "LIMIT_FILE_SIZE"
        ? 400
        : 500,
    ).json({
      message:
        error?.message === "Formato de arquivo não suportado."
          ? error.message
          : error?.code === "LIMIT_FILE_SIZE"
            ? "Arquivo muito grande."
          : "Não foi possível enviar o arquivo Guitar Pro.",
    });
  }
});

app.get("/api/v1/guitarpro/files", authenticateJWT, async (req, res) => {
  try {
    const email = await requireAuthorizedSongOwner(req, res);
    if (!email) return;

    const { artist, song } = req.query || {};
    if (!artist || !song) {
      return res.status(400).json({ message: "artist e song são obrigatórios." });
    }

    const { songEntry } = await findUserSongRecord({ email, artist, song });
    if (!songEntry) {
      return res.status(404).json({ message: "Música não encontrada." });
    }

    return res.status(200).json({
      guitarProFiles: Array.isArray(songEntry.guitarProFiles)
        ? songEntry.guitarProFiles
        : [],
    });
  } catch (error) {
    console.error("Erro ao listar arquivos Guitar Pro:", error);
    return res.status(500).json({ message: "Não foi possível carregar os arquivos." });
  }
});

app.get("/api/v1/guitarpro/file", authenticateJWT, async (req, res) => {
  try {
    const email = await requireAuthorizedSongOwner(req, res);
    if (!email) return;

    const { artist, song, fileId } = req.query || {};
    if (!artist || !song || !fileId) {
      return res.status(400).json({
        message: "email, artist, song e fileId são obrigatórios.",
      });
    }

    const { songEntry } = await findUserSongRecord({ email, artist, song });
    if (!songEntry) {
      return res.status(404).json({ message: "Música não encontrada." });
    }

    const currentFiles = Array.isArray(songEntry.guitarProFiles)
      ? songEntry.guitarProFiles
      : [];
    const fileToDownload = currentFiles.find((file) => file.id === fileId);

    if (!fileToDownload?.fileName) {
      return res.status(404).json({ message: "Arquivo não encontrado." });
    }

    const storedFile = await getGuitarProFileCollection().findOne({
      fileId,
      email,
    });

    if (storedFile?.data) {
      const fileBuffer = Buffer.isBuffer(storedFile.data)
        ? storedFile.data
        : Buffer.from(storedFile.data.buffer);

      res.setHeader(
        "Content-Type",
        storedFile.mimeType ||
          fileToDownload.mimeType ||
          "application/octet-stream",
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(
          storedFile.originalName ||
            fileToDownload.originalName ||
            fileToDownload.fileName,
        )}"`,
      );
      return res.send(fileBuffer);
    }

    const absoluteFilePath = path.join(guitarProUploadDir, fileToDownload.fileName);
    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ message: "Arquivo físico não encontrado no servidor." });
    }

    res.setHeader("Content-Type", fileToDownload.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(fileToDownload.originalName || fileToDownload.fileName)}"`,
    );
    return res.sendFile(absoluteFilePath);
  } catch (error) {
    console.error("Erro ao baixar arquivo Guitar Pro:", error);
    return res.status(500).json({ message: "Não foi possível baixar o arquivo." });
  }
});

app.delete("/api/v1/guitarpro/delete", authenticateJWT, async (req, res) => {
  try {
    const email = await requireAuthorizedSongOwner(req, res);
    if (!email) return;

    const { artist, song, fileId } = req.body || {};
    if (!artist || !song || !fileId) {
      return res.status(400).json({
        message: "email, artist, song e fileId são obrigatórios.",
      });
    }

    const { collection, userDoc, songIndex, songEntry } = await findUserSongRecord({
      email,
      artist,
      song,
    });

    if (!userDoc || songIndex < 0 || !songEntry) {
      return res.status(404).json({ message: "Música não encontrada." });
    }

    const currentFiles = Array.isArray(songEntry.guitarProFiles)
      ? songEntry.guitarProFiles
      : [];
    const fileToDelete = currentFiles.find((file) => file.id === fileId);

    if (!fileToDelete) {
      return res.status(404).json({ message: "Arquivo não encontrado." });
    }

    const nextFiles = currentFiles.filter((file) => file.id !== fileId);
    const nextUserdata = [...userDoc.userdata];
    nextUserdata[songIndex] = mergeSongEntries(songEntry, {
      guitarProFiles: nextFiles,
    });

    await collection.updateOne({ email }, { $set: { userdata: nextUserdata } });

    await getGuitarProFileCollection().deleteOne({
      fileId,
      email,
    });

    const absoluteFilePath = path.join(guitarProUploadDir, fileToDelete.fileName);
    fs.unlink(absoluteFilePath, () => {});

    return res.status(200).json({ guitarProFiles: nextFiles, song: nextUserdata[songIndex] });
  } catch (error) {
    console.error("Erro ao remover arquivo Guitar Pro:", error);
    return res.status(500).json({ message: "Não foi possível remover o arquivo." });
  }
});

app.get("/api/v1/users/search", authenticateJWT, async (req, res) => {
  try {
    const query = normalizeEmail(req.query?.q || "");
    const currentUser = await getCurrentUserProfile(req);

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (!query) {
      return res.json([]);
    }

    const authUsers = await authCollection
      .find({
        email: {
          $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      })
      .limit(12)
      .toArray();

    const users = [];
    for (const authUser of authUsers) {
      const safeUser = await findUserByEmail(authUser.email);
      if (!safeUser || safeUser.email === currentUser.email) continue;
      users.push({
        email: safeUser.email,
        username: safeUser.username,
        usernameDisplay: safeUser.usernameDisplay,
        fullName: safeUser.fullName || "",
      });
    }

    return res.json(users);
  } catch (error) {
    console.error("GET /api/v1/users/search error:", error);
    return res.status(500).json({ message: "Erro ao buscar usuários." });
  }
});

app.get("/api/v1/notifications", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const notifications = await notificationsCollection
      .find({ userEmail: currentUser.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return res.json(notifications.map(serializeNotification));
  } catch (error) {
    console.error("GET /api/v1/notifications error:", error);
    return res.status(500).json({ message: "Erro ao buscar notificações." });
  }
});

app.get("/api/v1/logs", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const logs = await userLogsCollection
      .find({ userEmail: currentUser.email })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.json(
      logs.map((log) => ({
        ...log,
        _id: log._id?.toString?.() || String(log._id || ""),
      })),
    );
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return res.status(500).json({ message: "Erro ao buscar logs." });
  }
});

app.put("/api/v1/notifications/read-all", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    await notificationsCollection.updateMany(
      { userEmail: currentUser.email, read: false },
      { $set: { read: true, updatedAt: new Date() } },
    );

    return res.json({ message: "Notificações marcadas como lidas." });
  } catch (error) {
    console.error("PUT /api/v1/notifications/read-all error:", error);
    return res.status(500).json({ message: "Erro ao atualizar notificações." });
  }
});

app.put("/api/v1/notifications/:id/read", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const notificationId = req.params.id;
    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "ID de notificação inválido." });
    }

    const result = await notificationsCollection.findOneAndUpdate(
      {
        _id: new ObjectId(notificationId),
        userEmail: currentUser.email,
      },
      { $set: { read: true, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    if (!result) {
      return res.status(404).json({ message: "Notificação não encontrada." });
    }

    return res.json(serializeNotification(result));
  } catch (error) {
    console.error("PUT /api/v1/notifications/:id/read error:", error);
    return res.status(500).json({ message: "Erro ao atualizar notificação." });
  }
});

app.get("/api/v1/invitations", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const invitations = await invitationsCollection
      .find({
        $or: [
          { senderEmail: currentUser.email },
          { receiverEmail: currentUser.email },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return res.json(invitations.map(serializeInvitation));
  } catch (error) {
    console.error("GET /api/v1/invitations error:", error);
    return res.status(500).json({ message: "Erro ao buscar convites." });
  }
});

app.post("/api/v1/invitations", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const email = normalizeEmail(req.body?.email || req.body?.identifier || "");
    const message = String(req.body?.message || "").trim();

    if (!email) {
      return res
        .status(400)
        .json({ message: "Informe o email do usuário para convidar." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email de convite inválido." });
    }

    const targetUser = await findUserByEmail(email);
    if (!targetUser) {
      return res
        .status(404)
        .json({ message: "Usuário convidado não encontrado." });
    }

    if (targetUser.email === currentUser.email) {
      return res
        .status(400)
        .json({ message: "Você não pode convidar a si mesmo." });
    }

    const existingPending = await invitationsCollection.findOne({
      senderEmail: currentUser.email,
      receiverEmail: targetUser.email,
      status: "pending",
    });

    if (existingPending) {
      return res
        .status(409)
        .json({ message: "Já existe um convite pendente para esse usuário." });
    }

    const now = new Date();
    const invitation = {
      senderEmail: currentUser.email,
      senderUsername: currentUser.usernameDisplay,
      senderFullName: currentUser.fullName || "",
      receiverEmail: targetUser.email,
      receiverUsername: targetUser.usernameDisplay,
      receiverFullName: targetUser.fullName || "",
      status: "pending",
      message,
      createdAt: now,
      updatedAt: now,
    };

    const result = await invitationsCollection.insertOne(invitation);
    const savedInvitation = { ...invitation, _id: result.insertedId };

    await createNotification({
      recipient: targetUser,
      actor: currentUser,
      type: "user_invitation",
      title: "Friend request",
      message: `${currentUser.usernameDisplay} sent you a friendship invite.`,
      meta: {
        invitationId: savedInvitation._id.toString(),
        senderEmail: currentUser.email,
        action: "friend_invitation",
      },
    });

    await addUserLog({
      userEmail: currentUser.email,
      action: "friend_request_sent",
      message: `Sent a friend request to ${targetUser.email}.`,
      meta: { targetEmail: targetUser.email },
    });
    await addUserLog({
      userEmail: targetUser.email,
      action: "friend_request_received",
      message: `Received a friend request from ${currentUser.email}.`,
      meta: { senderEmail: currentUser.email },
    });

    return res.status(201).json(serializeInvitation(savedInvitation));
  } catch (error) {
    console.error("POST /api/v1/invitations error:", error);
    return res.status(500).json({ message: "Erro ao criar convite." });
  }
});

app.put("/api/v1/invitations/:id/respond", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const invitationId = req.params.id;
    const status = String(req.body?.status || "")
      .trim()
      .toLowerCase();

    if (!ObjectId.isValid(invitationId)) {
      return res.status(400).json({ message: "ID de convite inválido." });
    }

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Status inválido para convite." });
    }

    const invitation = await invitationsCollection.findOne({
      _id: new ObjectId(invitationId),
      receiverEmail: currentUser.email,
      status: "pending",
    });

    if (!invitation) {
      return res
        .status(404)
        .json({ message: "Convite pendente não encontrado." });
    }

    const updatedInvitation = await invitationsCollection.findOneAndUpdate(
      { _id: invitation._id },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    const senderUser = await findUserByUsernameOrEmail(invitation.senderEmail);
    if (status === "accepted") {
      const acceptedAt = new Date();

      await saveAcceptedInvitationForUser(invitation.senderEmail, {
        invitationId,
        counterpartEmail: invitation.receiverEmail,
        counterpartUsername:
          invitation.receiverUsername || currentUser.usernameDisplay,
        counterpartFullName:
          invitation.receiverFullName || currentUser.fullName || "",
        acceptedAt,
      });

      await saveAcceptedInvitationForUser(invitation.receiverEmail, {
        invitationId,
        counterpartEmail: invitation.senderEmail,
        counterpartUsername:
          invitation.senderUsername || senderUser?.usernameDisplay || "",
        counterpartFullName:
          invitation.senderFullName || senderUser?.fullName || "",
        acceptedAt,
      });

      await addUserLog({
        userEmail: invitation.senderEmail,
        action: "friend_request_accepted",
        message: `${invitation.receiverEmail} accepted your friend request.`,
        meta: { counterpartEmail: invitation.receiverEmail },
      });
      await addUserLog({
        userEmail: invitation.receiverEmail,
        action: "friend_added",
        message: `You are now friends with ${invitation.senderEmail}.`,
        meta: { counterpartEmail: invitation.senderEmail },
      });
    } else {
      await addUserLog({
        userEmail: invitation.senderEmail,
        action: "friend_request_declined",
        message: `${invitation.receiverEmail} declined your friend request.`,
        meta: { counterpartEmail: invitation.receiverEmail },
      });
    }

    if (senderUser) {
      await createNotification({
        recipient: senderUser,
        actor: currentUser,
        type: "invitation_response",
        title: "Friend request updated",
        message: `${currentUser.usernameDisplay} ${status} your friendship invite.`,
        meta: {
          invitationId,
          status,
          receiverEmail: currentUser.email,
        },
      });
    }

    return res.json(serializeInvitation(updatedInvitation));
  } catch (error) {
    console.error("PUT /api/v1/invitations/:id/respond error:", error);
    return res.status(500).json({ message: "Erro ao responder convite." });
  }
});

app.delete("/api/v1/friends/:email", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const counterpartEmail = normalizeEmail(req.params.email || "");
    if (!isValidEmail(counterpartEmail)) {
      return res.status(400).json({ message: "Email de amizade inválido." });
    }

    const counterpartUser = await findUserByEmail(counterpartEmail);
    if (!counterpartUser) {
      return res.status(404).json({ message: "Amigo não encontrado." });
    }

    if (!areUsersFriends(currentUser, counterpartEmail)) {
      return res.status(404).json({ message: "Esta amizade não existe." });
    }

    await removeAcceptedInvitationForUser(currentUser.email, counterpartEmail);
    await removeAcceptedInvitationForUser(counterpartEmail, currentUser.email);

    await createNotification({
      recipient: counterpartUser,
      actor: currentUser,
      type: "friend_removed",
      title: "Friendship revoked",
      message: `${currentUser.usernameDisplay} revoked your friendship.`,
      meta: {
        counterpartEmail: currentUser.email,
        action: "friend_removed",
      },
    });

    await addUserLog({
      userEmail: currentUser.email,
      action: "friend_removed",
      message: `You revoked your friendship with ${counterpartEmail}.`,
      meta: { counterpartEmail },
    });
    await addUserLog({
      userEmail: counterpartEmail,
      action: "friend_removed",
      message: `${currentUser.email} revoked the friendship.`,
      meta: { counterpartEmail: currentUser.email },
    });

    return res.json({ message: "Friendship revoked successfully." });
  } catch (error) {
    console.error("DELETE /api/v1/friends/:email error:", error);
    return res.status(500).json({ message: "Erro ao revogar amizade." });
  }
});

app.get("/api/v1/calendar/events", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const events = await calendarEventsCollection
      .find({
        $or: [
          { ownerEmail: currentUser.email },
          { "invitedUsers.email": currentUser.email },
        ],
      })
      .sort({ startsAt: 1 })
      .toArray();

    return res.json(events.map(serializeCalendarEvent));
  } catch (error) {
    console.error("GET /api/v1/calendar/events error:", error);
    return res.status(500).json({ message: "Erro ao buscar eventos." });
  }
});

app.get("/api/v1/calendar/events/:id", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const eventId = req.params.id;
    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "ID de evento inválido." });
    }

    const event = await calendarEventsCollection.findOne({
      _id: new ObjectId(eventId),
    });

    if (!event) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    const isOwner = event.ownerEmail === currentUser.email;
    const isAcceptedGuest = (event.invitedUsers || []).some(
      (user) => normalizeEmail(user?.email || "") === currentUser.email,
    );
    const isPendingGuest = (event.pendingInvitedUsers || []).some(
      (user) => normalizeEmail(user?.email || "") === currentUser.email,
    );

    if (!isOwner && !isAcceptedGuest && !isPendingGuest) {
      return res
        .status(403)
        .json({ message: "Você não tem acesso a este evento." });
    }

    return res.json({
      ...serializeCalendarEvent(event),
      inviteStatus: isOwner
        ? "owner"
        : isAcceptedGuest
          ? "accepted"
          : "pending",
    });
  } catch (error) {
    console.error("GET /api/v1/calendar/events/:id error:", error);
    return res.status(500).json({ message: "Erro ao buscar evento." });
  }
});

app.post("/api/v1/calendar/events", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const startsAtRaw = req.body?.startsAt;
    const inviteInput = String(req.body?.invitedUsersText || "");

    if (!title || !startsAtRaw) {
      return res
        .status(400)
        .json({ message: "Título e data do evento são obrigatórios." });
    }

    const startsAt = new Date(startsAtRaw);
    if (Number.isNaN(startsAt.getTime())) {
      return res.status(400).json({ message: "Data do evento inválida." });
    }

    const invitedEmails = extractEmails(inviteInput);
    const invitedUsers = [];

    for (const email of invitedEmails) {
      const user = await findUserByEmail(email);
      if (!user || user.email === currentUser.email) continue;
      if (!areUsersFriends(currentUser, user.email)) {
        return res.status(403).json({
          message: `You can only invite friends to calendar events. ${user.email} is not your friend yet.`,
        });
      }
      invitedUsers.push({
        email: user.email,
        username: user.usernameDisplay,
        fullName: user.fullName || "",
      });
    }

    const dedupedInvitedUsers = invitedUsers.filter(
      (user, index, array) =>
        array.findIndex((candidate) => candidate.email === user.email) ===
        index,
    );

    const now = new Date();
    const calendarEvent = {
      title,
      description,
      startsAt,
      ownerEmail: currentUser.email,
      ownerUsername: currentUser.usernameDisplay,
      invitedUsers: [],
      pendingInvitedUsers: dedupedInvitedUsers,
      invitedUsersText: inviteInput,
      createdAt: now,
      updatedAt: now,
    };

    const result = await calendarEventsCollection.insertOne(calendarEvent);
    const savedEvent = { ...calendarEvent, _id: result.insertedId };

    for (const invitedUser of dedupedInvitedUsers) {
      const targetUser = await findUserByEmail(invitedUser.email);
      if (!targetUser) continue;

      await createNotification({
        recipient: targetUser,
        actor: currentUser,
        type: "calendar_invite",
        title: "New calendar event",
        message: `${currentUser.usernameDisplay} added you to "${title}".`,
        meta: {
          eventId: savedEvent._id.toString(),
          startsAt,
          action: "calendar_invite_response",
        },
      });
    }

    await addUserLog({
      userEmail: currentUser.email,
      action: "calendar_event_created",
      message: `Created calendar event "${title}".`,
      meta: { eventId: savedEvent._id.toString(), title },
    });

    return res.status(201).json(serializeCalendarEvent(savedEvent));
  } catch (error) {
    console.error("POST /api/v1/calendar/events error:", error);
    return res.status(500).json({ message: "Erro ao criar evento." });
  }
});

app.put("/api/v1/calendar/events/:id", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const eventId = req.params.id;
    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "ID de evento inválido." });
    }

    const existingEvent = await calendarEventsCollection.findOne({
      _id: new ObjectId(eventId),
    });

    if (!existingEvent) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    const isOwner = existingEvent.ownerEmail === currentUser.email;
    const isInvitedEditor =
      Boolean(existingEvent.allowGuestEdit) &&
      Array.isArray(existingEvent.invitedUsers) &&
      existingEvent.invitedUsers.some(
        (user) => normalizeEmail(user?.email || "") === currentUser.email,
      );

    if (!isOwner && !isInvitedEditor) {
      return res
        .status(403)
        .json({ message: "Você não tem permissão para editar este evento." });
    }

    const title = String(req.body?.title || existingEvent.title || "").trim();
    const description = String(
      req.body?.description ?? existingEvent.description ?? "",
    ).trim();
    const startsAt = req.body?.startsAt
      ? new Date(req.body.startsAt)
      : existingEvent.startsAt;
    const invitedUsersText =
      req.body?.invitedUsersText ?? existingEvent.invitedUsersText ?? "";

    if (!title || Number.isNaN(new Date(startsAt).getTime())) {
      return res.status(400).json({ message: "Dados do evento inválidos." });
    }

    const invitedEmails = extractEmails(invitedUsersText);
    const invitedUsers = [];

    for (const email of invitedEmails) {
      const user = await findUserByEmail(email);
      if (!user || user.email === currentUser.email) continue;
      if (!areUsersFriends(currentUser, user.email)) {
        return res.status(403).json({
          message: `You can only invite friends to calendar events. ${user.email} is not your friend yet.`,
        });
      }
      invitedUsers.push({
        email: user.email,
        username: user.usernameDisplay,
        fullName: user.fullName || "",
      });
    }

    const dedupedInvitedUsers = invitedUsers.filter(
      (user, index, array) =>
        array.findIndex((candidate) => candidate.email === user.email) ===
        index,
    );

    const nextAcceptedUsers = (existingEvent.invitedUsers || []).filter(
      (user) =>
        dedupedInvitedUsers.some(
          (candidate) =>
            normalizeEmail(candidate.email) === normalizeEmail(user.email),
        ),
    );

    const nextPendingUsers = dedupedInvitedUsers.filter(
      (candidate) =>
        !nextAcceptedUsers.some(
          (acceptedUser) =>
            normalizeEmail(acceptedUser.email) ===
            normalizeEmail(candidate.email),
        ),
    );

    const updatedEvent = await calendarEventsCollection.findOneAndUpdate(
      { _id: existingEvent._id },
      {
        $set: {
          title,
          description,
          startsAt: new Date(startsAt),
          invitedUsers: nextAcceptedUsers,
          pendingInvitedUsers: nextPendingUsers,
          allowGuestEdit:
            req.body?.allowGuestEdit !== undefined
              ? Boolean(req.body.allowGuestEdit)
              : Boolean(existingEvent.allowGuestEdit),
          invitedUsersText,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    await addUserLog({
      userEmail: currentUser.email,
      action: "calendar_event_updated",
      message: `Updated calendar event "${title}".`,
      meta: { eventId, title },
    });

    const notificationRecipients = [
      ...nextAcceptedUsers,
      ...nextPendingUsers,
      existingEvent.ownerEmail && existingEvent.ownerEmail !== currentUser.email
        ? {
            email: existingEvent.ownerEmail,
            username: existingEvent.ownerUsername || "",
            fullName: "",
          }
        : null,
    ]
      .filter(Boolean)
      .filter(
        (user, index, array) =>
          normalizeEmail(user.email || "") !== currentUser.email &&
          array.findIndex(
            (candidate) =>
              normalizeEmail(candidate.email || "") ===
              normalizeEmail(user.email || ""),
          ) === index,
      );

    for (const recipient of notificationRecipients) {
      await createNotification({
        recipient,
        type: "calendar_event_updated",
        title: "Event updated",
        message: `${currentUser.usernameDisplay} updated "${title}".`,
        meta: {
          eventId,
          startsAt: new Date(startsAt),
          action: "calendar_event_details",
        },
      });
    }

    return res.json(serializeCalendarEvent(updatedEvent));
  } catch (error) {
    console.error("PUT /api/v1/calendar/events/:id error:", error);
    return res.status(500).json({ message: "Erro ao atualizar evento." });
  }
});

app.put(
  "/api/v1/calendar/events/:id/respond",
  authenticateJWT,
  async (req, res) => {
    try {
      const currentUser = await getCurrentUserProfile(req);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      const eventId = req.params.id;
      const status = String(req.body?.status || "")
        .trim()
        .toLowerCase();

      if (!ObjectId.isValid(eventId)) {
        return res.status(400).json({ message: "ID de evento inválido." });
      }

      if (!["accepted", "declined"].includes(status)) {
        return res.status(400).json({ message: "Status inválido." });
      }

      const existingEvent = await calendarEventsCollection.findOne({
        _id: new ObjectId(eventId),
      });

      if (!existingEvent) {
        return res.status(404).json({ message: "Evento não encontrado." });
      }

      const pendingInvite = (existingEvent.pendingInvitedUsers || []).find(
        (user) => normalizeEmail(user?.email || "") === currentUser.email,
      );

      if (!pendingInvite) {
        return res
          .status(404)
          .json({ message: "Convite pendente não encontrado." });
      }

      const nextPendingUsers = (existingEvent.pendingInvitedUsers || []).filter(
        (user) => normalizeEmail(user?.email || "") !== currentUser.email,
      );
      const nextAcceptedUsers =
        status === "accepted"
          ? [
              ...(existingEvent.invitedUsers || []).filter(
                (user) =>
                  normalizeEmail(user?.email || "") !== currentUser.email,
              ),
              pendingInvite,
            ]
          : (existingEvent.invitedUsers || []).filter(
              (user) => normalizeEmail(user?.email || "") !== currentUser.email,
            );

      const updatedEvent = await calendarEventsCollection.findOneAndUpdate(
        { _id: existingEvent._id },
        {
          $set: {
            pendingInvitedUsers: nextPendingUsers,
            invitedUsers: nextAcceptedUsers,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      );

      const ownerUser = await findUserByEmail(existingEvent.ownerEmail);
      if (ownerUser) {
        await createNotification({
          recipient: ownerUser,
          actor: currentUser,
          type: "calendar_invite_response",
          title: "Event invitation updated",
          message: `${currentUser.usernameDisplay} ${status} your event invite.`,
          meta: {
            eventId,
            status,
          },
        });
      }

      await addUserLog({
        userEmail: currentUser.email,
        action: "calendar_invite_response",
        message: `${status === "accepted" ? "Accepted" : "Declined"} calendar invite for "${existingEvent.title}".`,
        meta: { eventId, status },
      });

      return res.json({ event: serializeCalendarEvent(updatedEvent), status });
    } catch (error) {
      console.error("PUT /api/v1/calendar/events/:id/respond error:", error);
      return res
        .status(500)
        .json({ message: "Erro ao responder convite do evento." });
    }
  },
);

app.delete("/api/v1/calendar/events/:id", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const eventId = req.params.id;
    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "ID de evento inválido." });
    }

    const result = await calendarEventsCollection.deleteOne({
      _id: new ObjectId(eventId),
      ownerEmail: currentUser.email,
    });

    if (!result.deletedCount) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    await addUserLog({
      userEmail: currentUser.email,
      action: "calendar_event_deleted",
      message: `Deleted a calendar event.`,
      meta: { eventId },
    });

    return res.json({ message: "Evento removido com sucesso." });
  } catch (error) {
    console.error("DELETE /api/v1/calendar/events/:id error:", error);
    return res.status(500).json({ message: "Erro ao remover evento." });
  }
});

app.post("/api/v1/setlist-shares", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const recipientEmail = normalizeEmail(req.body?.recipientEmail || "");
    const setlistNames = Array.from(
      new Set(
        (Array.isArray(req.body?.setlistNames) ? req.body.setlistNames : [])
          .map((tag) => String(tag || "").trim())
          .filter(Boolean),
      ),
    );

    if (!recipientEmail || !setlistNames.length) {
      return res.status(400).json({
        message: "Recipient email and selected setlists are required.",
      });
    }

    const targetUser = await findUserByEmail(recipientEmail);
    if (!targetUser) {
      return res.status(404).json({ message: "Destination user not found." });
    }

    if (targetUser.email === currentUser.email) {
      return res
        .status(400)
        .json({ message: "You cannot share a setlist with yourself." });
    }

    if (!areUsersFriends(currentUser, targetUser.email)) {
      return res.status(403).json({
        message: `You can only share setlists with accepted friends. ${targetUser.email} is not your friend yet.`,
      });
    }

    const senderDoc = await userDataCollection.findOne({
      email: currentUser.email,
    });

    const selectedSet = new Set(setlistNames.map((tag) => tag.toLowerCase()));
    const songs = (Array.isArray(senderDoc?.userdata) ? senderDoc.userdata : [])
      .filter((song) =>
        (Array.isArray(song?.setlist) ? song.setlist : []).some((tag) =>
          selectedSet.has(
            String(tag || "")
              .trim()
              .toLowerCase(),
          ),
        ),
      )
      .map((song) => {
        const { _id, id, email, username, fullName, ...rest } = song || {};
        const sharedTags = (Array.isArray(song?.setlist) ? song.setlist : [])
          .map((tag) => String(tag || "").trim())
          .filter((tag) => selectedSet.has(tag.toLowerCase()));

        return {
          ...rest,
          setlist: sharedTags.length ? sharedTags : setlistNames,
        };
      });

    if (!songs.length) {
      return res.status(400).json({
        message: "No songs were found for the selected setlists.",
      });
    }

    const now = new Date();
    const share = {
      senderEmail: currentUser.email,
      senderUsername: currentUser.usernameDisplay,
      senderFullName: currentUser.fullName || "",
      recipientEmail: targetUser.email,
      recipientUsername: targetUser.usernameDisplay,
      recipientFullName: targetUser.fullName || "",
      setlistNames,
      songs,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const result = await setlistSharesCollection.insertOne(share);
    const savedShare = { ...share, _id: result.insertedId };
    const title =
      setlistNames.length === 1
        ? setlistNames[0]
        : `${setlistNames.length} setlists`;

    await createNotification({
      recipient: targetUser,
      actor: currentUser,
      type: "setlist_share",
      title: "Setlist shared with you",
      message: `${currentUser.usernameDisplay} shared "${title}" with you.`,
      meta: {
        shareId: savedShare._id.toString(),
        setlistNames,
        songCount: songs.length,
        action: "setlist_share_response",
      },
    });

    await addUserLog({
      userEmail: currentUser.email,
      action: "setlist_share_sent",
      message: `Shared ${title} with ${targetUser.email}.`,
      meta: {
        shareId: savedShare._id.toString(),
        targetEmail: targetUser.email,
        setlistNames,
        songCount: songs.length,
      },
    });

    return res.status(201).json(serializeSetlistShare(savedShare));
  } catch (error) {
    console.error("POST /api/v1/setlist-shares error:", error);
    return res.status(500).json({ message: "Erro ao compartilhar setlist." });
  }
});

app.get("/api/v1/setlist-shares/:id", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const shareId = req.params.id;
    if (!ObjectId.isValid(shareId)) {
      return res.status(400).json({ message: "Invalid setlist share id." });
    }

    const share = await setlistSharesCollection.findOne({
      _id: new ObjectId(shareId),
    });

    if (!share) {
      return res.status(404).json({ message: "Setlist share not found." });
    }

    if (
      normalizeEmail(share.senderEmail) !== currentUser.email &&
      normalizeEmail(share.recipientEmail) !== currentUser.email
    ) {
      return res
        .status(403)
        .json({ message: "You do not have access to this setlist share." });
    }

    return res.json(serializeSetlistShare(share));
  } catch (error) {
    console.error("GET /api/v1/setlist-shares/:id error:", error);
    return res.status(500).json({ message: "Erro ao buscar setlist share." });
  }
});

app.put(
  "/api/v1/setlist-shares/:id/respond",
  authenticateJWT,
  async (req, res) => {
    try {
      const currentUser = await getCurrentUserProfile(req);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      const shareId = req.params.id;
      const status = String(req.body?.status || "")
        .trim()
        .toLowerCase();

      if (!ObjectId.isValid(shareId)) {
        return res.status(400).json({ message: "Invalid setlist share id." });
      }

      if (!["accepted", "declined"].includes(status)) {
        return res.status(400).json({ message: "Invalid response status." });
      }

      const share = await setlistSharesCollection.findOne({
        _id: new ObjectId(shareId),
        recipientEmail: currentUser.email,
      });

      if (!share) {
        return res.status(404).json({ message: "Setlist share not found." });
      }

      if (share.status !== "pending") {
        return res
          .status(409)
          .json({ message: "This share was already handled." });
      }

      let importedCount = 0;
      let mergedCount = 0;
      const now = new Date();

      if (status === "accepted") {
        const userDoc = (await userDataCollection.findOne({
          email: currentUser.email,
        })) || {
          email: currentUser.email,
          userdata: [],
          availableSetlists: [],
        };

        const currentUserdata = Array.isArray(userDoc.userdata)
          ? [...userDoc.userdata]
          : [];
        let nextId = currentUserdata.reduce(
          (max, song) => Math.max(max, Number(song?.id || 0)),
          0,
        );
        const setlistNames = Array.isArray(share.setlistNames)
          ? share.setlistNames
          : [];

        for (const sharedSong of Array.isArray(share.songs)
          ? share.songs
          : []) {
          const songTitle = String(sharedSong?.song || "").trim();
          const artist = String(sharedSong?.artist || "").trim();
          if (!songTitle || !artist) continue;

          const sharedTags = Array.from(
            new Set(
              (Array.isArray(sharedSong?.setlist)
                ? sharedSong.setlist
                : setlistNames
              )
                .map((tag) => String(tag || "").trim())
                .filter(Boolean),
            ),
          );

          const existingIndex = currentUserdata.findIndex(
            (song) =>
              normalizeName(song?.artist || "") === normalizeName(artist) &&
              normalizeName(song?.song || "") === normalizeName(songTitle),
          );

          if (existingIndex >= 0) {
            const existing = currentUserdata[existingIndex];
            currentUserdata[existingIndex] = {
              ...existing,
              setlist: Array.from(
                new Set([
                  ...(Array.isArray(existing.setlist) ? existing.setlist : []),
                  ...sharedTags,
                ]),
              ),
              instruments: {
                ...(existing.instruments || {}),
                ...(sharedSong.instruments || {}),
              },
              updateIn: now.toISOString().split("T")[0],
            };
            mergedCount += 1;
            continue;
          }

          const { _id, id, email, username, fullName, ...rest } =
            sharedSong || {};

          currentUserdata.push({
            ...rest,
            id: ++nextId,
            email: currentUser.email,
            username: currentUser.usernameDisplay,
            fullName: currentUser.fullName || "",
            setlist: sharedTags,
            addedIn: now.toISOString().split("T")[0],
            updateIn: now.toISOString().split("T")[0],
          });
          importedCount += 1;
        }

        const availableSetlists = Array.from(
          new Set([
            ...(Array.isArray(userDoc.availableSetlists)
              ? userDoc.availableSetlists
              : []),
            ...setlistNames,
            ...currentUserdata.flatMap((song) =>
              Array.isArray(song?.setlist) ? song.setlist : [],
            ),
          ]),
        ).filter(Boolean);

        await userDataCollection.updateOne(
          { email: currentUser.email },
          {
            $set: {
              email: currentUser.email,
              userdata: currentUserdata,
              availableSetlists,
            },
          },
          { upsert: true },
        );
      }

      const updatedShare = await setlistSharesCollection.findOneAndUpdate(
        { _id: share._id },
        {
          $set: {
            status,
            importedCount,
            mergedCount,
            respondedAt: now,
            updatedAt: now,
          },
        },
        { returnDocument: "after" },
      );

      const senderUser = await findUserByEmail(share.senderEmail);
      if (senderUser) {
        await createNotification({
          recipient: senderUser,
          actor: currentUser,
          type: "setlist_share_response",
          title: "Setlist share updated",
          message: `${currentUser.usernameDisplay} ${status} your setlist share.`,
          meta: {
            shareId,
            status,
            importedCount,
            mergedCount,
          },
        });
      }

      await addUserLog({
        userEmail: currentUser.email,
        action: "setlist_share_response",
        message: `${status === "accepted" ? "Accepted" : "Declined"} setlist share from ${share.senderEmail}.`,
        meta: {
          shareId,
          status,
          importedCount,
          mergedCount,
          setlistNames: share.setlistNames || [],
        },
      });

      return res.json({
        share: serializeSetlistShare(updatedShare),
        status,
        importedCount,
        mergedCount,
      });
    } catch (error) {
      console.error("PUT /api/v1/setlist-shares/:id/respond error:", error);
      return res
        .status(500)
        .json({ message: "Erro ao responder setlist share." });
    }
  },
);
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

function normalizeName(s = "") {
  return String(s)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SONG_INSTRUMENT_KEYS = [
  "guitar01",
  "guitar02",
  "bass",
  "keys",
  "drums",
  "voice",
];
const INSTRUMENT_SETLIST_TAGS = {
  guitar01: "guitar",
  guitar02: "guitar",
  bass: "bass",
  keys: "keys",
  drums: "drums",
  voice: "voice",
};

function uniqueArray(values = []) {
  return Array.from(
    new Set(
      values
        .filter((value) => value !== null && value !== undefined)
        .map((value) => (typeof value === "string" ? value.trim() : value))
        .filter(Boolean),
    ),
  );
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isExplicitTrue(value) {
  return value === true || String(value).trim().toLowerCase() === "true";
}

function isExplicitFalse(value) {
  return value === false || String(value).trim().toLowerCase() === "false";
}

function hasStoredValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return true;
}

function instrumentBlockHasContent(block = {}) {
  return [
    "link",
    "songCifra",
    "songTabs",
    "songChords",
    "songLyrics",
    "notes",
  ].some((key) => hasStoredValue(block?.[key]));
}

function buildInitialPresentationLayouts(songCifra = "") {
  return {
    default: {
      songCifra,
      fontSizeStep: 0,
      twoColumns: false,
      showProgressionMarkers: false,
      progressionMarkOverrides: {},
    },
    expanded: {
      songCifra,
      fontSizeStep: 0,
      twoColumns: true,
      showProgressionMarkers: false,
      progressionMarkOverrides: {},
    },
  };
}

function ensurePresentationLayoutsForInstrument(block = {}) {
  if (!isPlainObject(block)) return block;

  const songCifra =
    typeof block.songCifra === "string" ? block.songCifra : "";
  const hasLayouts =
    isPlainObject(block.presentationLayouts) &&
    (isPlainObject(block.presentationLayouts.default) ||
      isPlainObject(block.presentationLayouts.expanded));

  if (!songCifra.trim() || hasLayouts) {
    return block;
  }

  return {
    ...block,
    presentationLayouts: buildInitialPresentationLayouts(songCifra),
  };
}

function normalizeInstrumentFlags(entry = {}) {
  return SONG_INSTRUMENT_KEYS.reduce((flags, key) => {
    const currentFlag = entry.instruments?.[key];
    const block = entry[key];
    if (
      isExplicitFalse(currentFlag) ||
      isExplicitFalse(currentFlag?.active) ||
      isExplicitFalse(block) ||
      isExplicitFalse(block?.active)
    ) {
      flags[key] = false;
      return flags;
    }

    flags[key] = Boolean(
      isExplicitTrue(currentFlag) ||
      isExplicitTrue(currentFlag?.active) ||
      isExplicitTrue(block?.active) ||
      instrumentBlockHasContent(block),
    );
    return flags;
  }, {});
}

function normalizeSetlistForInstrumentFlags(setlist = [], instruments = {}) {
  const activeInstrumentTags = new Set(
    SONG_INSTRUMENT_KEYS.filter((key) => instruments?.[key]).map(
      (key) => INSTRUMENT_SETLIST_TAGS[key],
    ),
  );
  const instrumentTags = new Set(Object.values(INSTRUMENT_SETLIST_TAGS));

  return uniqueArray(setlist).filter(
    (tag) => !instrumentTags.has(tag) || activeInstrumentTags.has(tag),
  );
}

function mergeInstrumentBlock(existingBlock = {}, incomingBlock = {}) {
  if (!incomingBlock) {
    return ensurePresentationLayoutsForInstrument(existingBlock || {});
  }

  if (incomingBlock === false) {
    return {
      active: false,
      link: "",
      progress: 0,
      songCifra: "",
      songTabs: "",
      songChords: "",
      songLyrics: "",
      presentationLayouts: undefined,
    };
  }

  if (!isPlainObject(incomingBlock)) {
    return ensurePresentationLayoutsForInstrument(existingBlock || {});
  }

  const merged = { ...(existingBlock || {}) };

  Object.entries(incomingBlock).forEach(([key, value]) => {
    if (key === "active") return;

    const existingValue = merged[key];
    const incomingIsEmpty = !hasStoredValue(value);
    const existingHasValue = hasStoredValue(existingValue);

    if (incomingIsEmpty && existingHasValue) {
      return;
    }

    merged[key] = value;
  });

  if (isExplicitTrue(incomingBlock.active)) {
    merged.active = true;
  } else if (isExplicitFalse(incomingBlock.active)) {
    merged.active = false;
  } else if (!hasStoredValue(merged.active)) {
    merged.active = instrumentBlockHasContent(merged);
  }

  return ensurePresentationLayoutsForInstrument(merged);
}

function mergeSongEntries(...entries) {
  const today = new Date().toISOString().split("T")[0];
  const merged = entries.reduce((acc, entry = {}) => {
    const instrumentName = normalizeInstrument(entry.instrumentName);
    const existingInstrumentBlocks = SONG_INSTRUMENT_KEYS.reduce(
      (blocks, key) => ({
        ...blocks,
        [key]: acc[key],
      }),
      {},
    );
    const existingInstrumentFlags = acc.instruments;

    acc = {
      ...acc,
      ...entry,
      id: acc.id || entry.id,
      addedIn: acc.addedIn || entry.addedIn || today,
      progressBar: entry.progressBar ?? acc.progressBar ?? 0,
      embedVideos: Array.isArray(entry.embedVideos)
        ? entry.embedVideos
        : acc.embedVideos || [],
      guitarProFiles: Array.isArray(entry.guitarProFiles)
        ? entry.guitarProFiles
        : acc.guitarProFiles || [],
      setlist: uniqueArray([...(acc.setlist || []), ...(entry.setlist || [])]),
      updateIn: today,
    };
    SONG_INSTRUMENT_KEYS.forEach((key) => {
      acc[key] = existingInstrumentBlocks[key];
    });
    acc.instruments = existingInstrumentFlags;

    SONG_INSTRUMENT_KEYS.forEach((key) => {
      const hasNestedInstrumentPayload =
        !instrumentName &&
        entry.instruments &&
        Object.prototype.hasOwnProperty.call(entry.instruments, key);
      const instrumentPayload =
        entry[key] ||
        (hasNestedInstrumentPayload &&
        typeof entry.instruments[key] === "object"
          ? entry.instruments[key]
          : hasNestedInstrumentPayload
            ? entry.instruments[key]
            : null);
      acc[key] = mergeInstrumentBlock(acc[key], instrumentPayload);
    });

    if (instrumentName && entry[instrumentName]) {
      acc[instrumentName] = mergeInstrumentBlock(
        acc[instrumentName],
        entry[instrumentName],
      );
    }

    acc.instruments = normalizeInstrumentFlags(acc);
    return acc;
  }, {});

  merged.instruments = normalizeInstrumentFlags(merged);
  merged.setlist = normalizeSetlistForInstrumentFlags(
    merged.setlist,
    merged.instruments,
  );
  merged.guitarProFiles = Array.isArray(merged.guitarProFiles)
    ? merged.guitarProFiles
    : [];
  return merged;
}

async function hydrateUserdataFromGeneralCifra(userdata = {}) {
  if (!userdata?.artist || !userdata?.song) {
    return userdata;
  }

  const hydrated = { ...userdata };

  for (const instrument of SONG_INSTRUMENT_KEYS) {
    if (
      isExplicitFalse(hydrated[instrument]) ||
      isExplicitFalse(hydrated[instrument]?.active) ||
      isExplicitFalse(hydrated.instruments?.[instrument]) ||
      isExplicitFalse(hydrated.instruments?.[instrument]?.active)
    ) {
      hydrated[instrument] = false;
      hydrated.instruments = {
        ...(hydrated.instruments || {}),
        [instrument]: false,
      };
      continue;
    }

    const nestedInstrumentPayload = isPlainObject(hydrated.instruments?.[instrument])
      ? hydrated.instruments[instrument]
      : null;
    const block = hydrated[instrument] || nestedInstrumentPayload;

    if (!isPlainObject(block) || !hasStoredValue(block.link)) {
      continue;
    }

    if (hasStoredValue(block.songCifra)) {
      hydrated[instrument] = prepareInstrumentBlockForStorage(block);
      continue;
    }

    const generalDoc = await findGeneralCifraDoc({
      instrument,
      link: block.link,
      artist: hydrated.artist,
      song: hydrated.song,
    });
    const generalBlock = generalDoc?.[instrument];

    if (!isPlainObject(generalBlock) || !instrumentBlockHasContent(generalBlock)) {
      continue;
    }

    const nextBlock = prepareInstrumentBlockForStorage(
      mergeInstrumentBlock(block, generalBlock),
    );
    hydrated[instrument] = nextBlock;

    if (nestedInstrumentPayload) {
      hydrated.instruments = {
        ...(hydrated.instruments || {}),
        [instrument]: nextBlock,
      };
    }
  }

  return hydrated;
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

function prepareInstrumentBlockForStorage(subdoc = {}) {
  if (!isPlainObject(subdoc)) return subdoc;
  return withLinkNorm(ensurePresentationLayoutsForInstrument(subdoc));
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

app.put("/api/v1/updateSetlists", authenticateJWT, async (req, res) => {
  try {
    const { email, setlists } = req.body;
    const ownerEmail = await requireSameUserEmail(
      req,
      res,
      email,
      "Usuario nao autorizado para atualizar estas setlists.",
    );
    if (!ownerEmail) return;

    if (!email || !Array.isArray(setlists)) {
      return res
        .status(400)
        .json({ message: "Email e um array de setlists são obrigatórios." });
    }

    const sanitizedSetlists = Array.from(
      new Set(
        setlists
          .map((tag) => String(tag || "").trim())
          .filter((tag) => tag.length > 0),
      ),
    );

    const database = appDatabase();
    const collection = database.collection("data");

    const userDoc = await collection.findOne({ email: ownerEmail });
    if (!userDoc) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const allowedSet = new Set(sanitizedSetlists);
    const updatedUserdata = (userDoc.userdata || []).map((entry) => {
      const currentSetlist = Array.isArray(entry.setlist) ? entry.setlist : [];
      const filteredTags = currentSetlist.filter((tag) => allowedSet.has(tag));
      return { ...entry, setlist: filteredTags };
    });

    const updateResult = await collection.updateOne(
      { email: ownerEmail },
      {
        $set: {
          userdata: updatedUserdata,
          availableSetlists: sanitizedSetlists,
        },
      },
    );

    return res.status(200).json({
      message: "Setlists atualizadas e sincronizadas com as músicas.",
      modifiedCount: updateResult.modifiedCount,
      availableSetlists: sanitizedSetlists,
    });
  } catch (error) {
    console.error("Erro ao atualizar setlists:", error);
    return res
      .status(500)
      .json({ message: "Erro ao atualizar setlists do usuário." });
  }
});

app.get("/api/v1/generalCifra", async (req, res) => {
  try {
    let { instrument, link, artist, song } = req.query || {};
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
    if (!doc && artist && song) {
      const titleCandidates = await collection
        .find({
          $or: [
            { [`instruments.${instrument}`]: true },
            { [`instruments.${instrument}`]: "true" },
          ],
        })
        .toArray();
      doc = titleCandidates.find(
        (candidate) =>
          normalizeName(candidate.artist) === normalizeName(artist) &&
          normalizeName(candidate.song) === normalizeName(song),
      );
    }

    if (!doc)
      return res.status(404).json({ message: "Documento não encontrado" });

    return res.status(200).json(doc);
  } catch (error) {
    console.error("GET /api/v1/generalCifra error:", error);
    return res.status(500).json({ message: "Erro interno." });
  }
});

app.put("/api/v1/song/updateExact", authenticateJWT, async (req, res) => {
  try {
    const { email, updatedSong } = req.body;
    const ownerEmail = await requireSameUserEmail(
      req,
      res,
      email,
      "Usuario nao autorizado para atualizar esta musica.",
    );
    if (!ownerEmail) return;

    if (!email || !updatedSong || !updatedSong.artist || !updatedSong.song) {
      return res.status(400).json({
        message:
          "Parâmetros obrigatórios: email, artist, song e o payload atualizado.",
      });
    }

    const database = appDatabase();
    const collection = database.collection("data");

    const userDoc = await collection.findOne({ email: ownerEmail });
    if (!userDoc || !Array.isArray(userDoc.userdata)) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const matchingIndexes = userDoc.userdata.reduce((indexes, entry, index) => {
      if (
        normalizeName(entry.artist) === normalizeName(updatedSong.artist) &&
        normalizeName(entry.song) === normalizeName(updatedSong.song)
      ) {
        indexes.push(index);
      }
      return indexes;
    }, []);

    if (!matchingIndexes.length) {
      return res
        .status(404)
        .json({ message: "Música não encontrada para este usuário." });
    }

    const [songIndex] = matchingIndexes;
    const duplicateEntries = matchingIndexes.map(
      (index) => userDoc.userdata[index],
    );
    const mergedEntry = mergeSongEntries(...duplicateEntries, updatedSong);
    mergedEntry.id = userDoc.userdata[songIndex].id || songIndex + 1;

    const nextUserdata = userDoc.userdata.filter(
      (_song, index) => !matchingIndexes.slice(1).includes(index),
    );
    nextUserdata[songIndex] = mergedEntry;

    await collection.updateOne(
      { email: ownerEmail },
      { $set: { userdata: nextUserdata } },
    );

    await addUserLog({
      userEmail: ownerEmail,
      action: "song_updated",
      message: `Edited song "${updatedSong.song}" by ${updatedSong.artist}.`,
      meta: { song: updatedSong.song, artist: updatedSong.artist },
    });

    return res
      .status(200)
      .json({ message: "Música atualizada com sucesso!", song: mergedEntry });
  } catch (error) {
    console.error("Erro ao atualizar música:", error);
    return res
      .status(500)
      .json({ message: "Erro ao atualizar música.", error: error?.message });
  }
});

app.put("/api/v1/song/instrumentNotes", async (req, res) => {
  try {
    const { email, artist, song, instrument, notes = "" } = req.body;
    const normalizedInstrument = normalizeInstrument(instrument);

    if (!email || !artist || !song || !normalizedInstrument) {
      return res.status(400).json({
        message: "Parâmetros obrigatórios: email, artist, song e instrument.",
      });
    }

    const database = client.db("liveNloud_");
    const collection = database.collection("data");
    const userDoc = await collection.findOne({ email });

    if (!userDoc || !Array.isArray(userDoc.userdata)) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const songIndex = userDoc.userdata.findIndex(
      (entry) =>
        normalizeName(entry.artist) === normalizeName(artist) &&
        normalizeName(entry.song) === normalizeName(song),
    );

    if (songIndex < 0) {
      return res
        .status(404)
        .json({ message: "Música não encontrada para este usuário." });
    }

    const songEntry = mergeSongEntries(userDoc.userdata[songIndex]);
    const instrumentBlock = songEntry[normalizedInstrument] || {};

    if (
      !instrumentBlock.link ||
      typeof instrumentBlock.link !== "string" ||
      !instrumentBlock.link.trim()
    ) {
      return res.status(400).json({
        message: "Adicione um link ao instrumento antes de salvar notas.",
      });
    }

    songEntry[normalizedInstrument] = {
      ...instrumentBlock,
      active: instrumentBlock.active ?? true,
      notes: String(notes || ""),
    };
    songEntry.instruments = normalizeInstrumentFlags(songEntry);
    songEntry.updateIn = new Date().toISOString().split("T")[0];

    const nextUserdata = [...userDoc.userdata];
    nextUserdata[songIndex] = songEntry;

    await collection.updateOne({ email }, { $set: { userdata: nextUserdata } });

    await addUserLog({
      userEmail: email,
      action: "song_updated",
      message: `Updated notes for "${song}" by ${artist}.`,
      meta: { song, artist, instrument: normalizedInstrument },
    });

    return res.status(200).json({
      message: "Notas atualizadas com sucesso!",
      song: songEntry,
    });
  } catch (error) {
    console.error("Erro ao atualizar notas do instrumento:", error);
    return res.status(500).json({
      message: "Erro ao atualizar notas do instrumento.",
      error: error?.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
