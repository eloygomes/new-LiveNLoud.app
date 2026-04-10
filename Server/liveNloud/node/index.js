// require("dotenv").config();

// const express = require("express");
// const axios = require("axios");
// const { MongoClient, Binary, ObjectId } = require("mongodb");
// const multer = require("multer");
// const path = require("path");
// const sharp = require("sharp"); // Importar sharp
// const fs = require('fs');
// const youtubeRoutes = require("./youtube/youtube.routes");
// const cookieParser = require("cookie-parser");

// // Socket.IO
// const http = require('http');
// const { Server } = require('socket.io');

// const uri = "REMOVED_MONGO_URI";
// const client = new MongoClient(uri);

// const pythonApiUrl = process.env.PYTHON_API_URL || "http://python_scraper:8000";

// const app = express();
// const PORT = process.env.PORT || 3000;

// const cors = require("cors");

// // Função para conectar ao banco de dados
// async function connectToDatabase() {
//   try {
//     await client.connect();
//     console.log("Conexão com o MongoDB estabelecida com sucesso!");
//   } catch (error) {
//     console.error("Erro ao conectar ao MongoDB:", error);
//   }
// }

// connectToDatabase();

// // Crie o servidor HTTP a partir do Express
// const server = http.createServer(app);

// const io = new Server(server, {
//   path: '/socket.io',
//   cors: {
//     origin: (origin, callback) => {
//       const allowed = [
//         "https://www.live.eloygomes.com.br",
//         "https://api.live.eloygomes.com.br",
//         "https://www.live.eloygomes.com",
//         "https://api.live.eloygomes.com",
//         "https://live.eloygomes.com",
//         "http://127.0.0.1:5173",
//         "http://localhost:5173",
//                 // <-- habilita dev
//       ];
//       // Sem origin (apps nativos) ou na lista => libera
//       if (!origin || allowed.includes(origin)) return callback(null, true);
//       return callback(new Error("Not allowed by CORS"));
//     },
//     methods: ["GET", "POST"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   },
// });

// // Namespaces
// const clientNamespace = io.of('/'); // Namespace padrão para clientes
// const pythonNamespace = io.of('/python'); // Namespace dedicado para o script Python

// // INSTRUÇÕES
// // •	messageToServer: Evento que o cliente emite para enviar dados ao servidor.
// // •	processData: Evento que o servidor emite para o script Python com os dados a serem processados.
// // •	processedData: Evento que o script Python emite para enviar os dados processados de volta ao servidor.
// // •	messageFromServer: Evento que o servidor emite para enviar os dados processados de volta ao cliente.

// // Handle client connections
// clientNamespace.on('connection', (socket) => {
//   const userEmail = socket.handshake.query.email;
//   const pipa = socket.handshake.query.pipa;

//   console.log('Usuário conectado:', socket.id, 'Email:', userEmail);
//   console.log('FRONT', pipa);

//   if (userEmail) {
//     socket.join(userEmail);
//   }

//   // Escutar eventos do cliente
// socket.on("messageToServer", ({ audioData, sampleRate }) => {
//   console.log("Audio chunk:", { bytes: audioData?.length || audioData?.byteLength, sampleRate, id: socket.id });
//   pythonNamespace.emit("processData", { clientId: socket.id, audioData, sampleRate });
// });

//   socket.on('health', (data, cb) => {
//     cb && cb({ ok: true, ts: Date.now() });
//   });

//   socket.on('disconnect', () => {
//     console.log('Usuário desconectado:', socket.id);
//   });
// });

// // Handle Python script connections
// pythonNamespace.on('connection', (socket) => {
//   console.log(`Script Python conectado: ${socket.id}`);

//   // Receber dados processados do script Python
//   socket.on('processedData', (data) => {
//     console.log('Dados processados recebidos do Python:', data);

//     // Enviar os dados processados de volta ao cliente original
//     const clientId = data.clientId;
//     const clientSocket = clientNamespace.sockets.get(clientId);

//     if (clientSocket) {
//       clientSocket.emit('messageFromServer', data);
//       console.log('Dados processados enviados ao cliente:', clientId);
//     } else {
//       console.log('Cliente não encontrado:', clientId);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log(`Script Python desconectado: ${socket.id}`);
//   });
// });

// app.use(cors({
//   origin: [
//     "https://www.live.eloygomes.com.br",
//     "https://api.live.eloygomes.com.br",
//     "https://www.live.eloygomes.com",
//     "https://api.live.eloygomes.com",
//     "https://live.eloygomes.com",
//     "http://localhost:5173",
//     "http://127.0.0.1:5173",
//   ],
//   credentials: true,
// }));

// // Middleware para JSON com limite de tamanho adequado
// app.use(express.json({ limit: "50mb" }));

// app.use(cookieParser());

// // ✅ exemplo (corrigido: usa o import já feito lá em cima)
// app.use("/api/youtube", youtubeRoutes);

// // Servir arquivos estáticos da pasta uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Configuração do Multer para armazenamento local com extensão '.jpeg'
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/profileImages");
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + ".jpeg"); // Definir extensão como '.jpeg' independente do original
//   },
// });

// // Filtro de arquivo para aceitar apenas imagens
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimeType = allowedTypes.test(file.mimetype);

//   if (extname && mimeType) {
//     return cb(null, true);
//   } else {
//     cb(new Error("Apenas imagens são permitidas (jpeg, jpg, png, gif)."));
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
//   fileFilter: fileFilter,
// });

// // Middleware para lidar com erros do Multer
// app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     // Erros do Multer
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ message: "O tamanho do arquivo excede o limite permitido de 5MB." });
//     }
//     return res.status(400).json({ message: err.message });
//   } else if (err) {
//     // Outros erros
//     return res.status(500).json({ message: err.message });
//   }
//   next();
// });

// app.post('/api/uploadProfileImage', upload.single('profileImage'), async (req, res) => {
//   try {
//     const originalFilePath = req.file.path; // Caminho do arquivo original

//     // Processar a imagem com Sharp e obter um buffer
//     const processedImageBuffer = await sharp(originalFilePath)
//       .resize(200, 200)
//       .jpeg({ quality: 80 }) // Opcional: definir qualidade e formato
//       .toBuffer();

//     // Excluir o arquivo original, pois não precisamos mais dele
//     fs.unlink(originalFilePath, (err) => {
//       if (err) {
//         console.error('Erro ao excluir o arquivo original:', err);
//       } else {
//         console.log('Arquivo original excluído com sucesso.');
//       }
//     });

//     // Obter referência à coleção onde as imagens serão armazenadas
//     const database = client.db('liveNloud_'); // Substitua pelo nome do seu banco de dados
//     const collection = database.collection('profileImages');

//     // Garantir que o campo 'email' seja único para evitar duplicatas
//     await collection.createIndex({ email: 1 }, { unique: true });

//     // Criar ou atualizar o documento para a imagem
//     const filter = { email: req.body.email }; // Filtro para encontrar o documento do usuário
//     const update = {
//       $set: {
//         image: new Binary(processedImageBuffer),
//         uploadDate: new Date(),
//       },
//     };
//     const options = { upsert: true }; // Cria o documento se não existir

//     const result = await collection.updateOne(filter, update, options);

//     if (result.upsertedCount > 0) {
//       console.log('Imagem salva no MongoDB com sucesso. Novo documento criado com ID:', result.upsertedId._id);
//     } else if (result.modifiedCount > 0) {
//       console.log('Imagem atualizada no MongoDB com sucesso.');
//     } else {
//       console.log('Nenhuma alteração feita no MongoDB.');
//     }

//     // Retornar uma resposta ao cliente
//     res.status(200).json({
//       message: 'Imagem enviada e processada com sucesso!',
//       // Opcional: retornar o ID do documento ou outras informações
//     });
//   } catch (err) {
//     if (err.code === 11000) { // Código de erro para duplicação de chave
//       console.error('Erro: O email fornecido já possui uma imagem de perfil.');
//       res.status(400).json({ error: 'O email fornecido já possui uma imagem de perfil.' });
//     } else {
//       console.error('Erro ao processar e salvar a imagem:', err);
//       res.status(500).json({ error: 'Erro ao processar e salvar a imagem' });
//     }
//   }
// });

// app.get('/api/profileImage/:email', async (req, res) => {
//   try {
//     const { email } = req.params;

//     // Validar email (opcional mas recomendado)
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ message: 'Email inválido.' });
//     }

//     const database = client.db('liveNloud_');
//     const collection = database.collection('profileImages');

//     const imageDocument = await collection.findOne({ email });

//     if (
//       !imageDocument ||
//       !imageDocument.image ||
//       !imageDocument.image.buffer
//     ) {
//       return res.status(404).json({ message: 'Imagem não encontrada.' });
//     }

//     res.set(
//       'Content-Type',
//       imageDocument.image.contentType || 'image/jpeg'
//     );
//     res.send(imageDocument.image.buffer);
//   } catch (err) {
//     console.error('Erro ao buscar a imagem:', err);
//     res.status(500).json({ error: 'Erro ao buscar a imagem' });
//   }
// });

// // Rota para chamar o serviço Python e realizar o scrape
// // ---------- helpers p/ normalização ----------
// // (você já tem normalizeInstrument e normalizeLink definidos mais acima)
// // vou reaproveitá-los aqui sem duplicar

// /** Aguarda N ms */
// const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// /** Busca o doc no banco geral usando (instrument, link) e fallbacks. */
// async function findGeneralCifraDoc({ instrument, link, artist, song }) {
//   const database = client.db('generalCifras');
//   const collection = database.collection('Documents');

//   const inst = normalizeInstrument(instrument);
//   if (!inst) return null;

//   const linkNorm = normalizeLink(link);

//   // 1) preferencial: flag do instrumento + linkNorm no subdoc
//   const byNorm = {
//     $and: [
//       { $or: [ { [`instruments.${inst}`]: true }, { [`instruments.${inst}`]: "true" } ] },
//       { [`${inst}.linkNorm`]: linkNorm },
//     ]
//   };

//   // 2) fallback: flag do instrumento + link "cru" (com/sem barra)
//   const rawNoSlash = String(link).replace(/\/+$/,'');
//   const rawWithSlash = rawNoSlash.endsWith('/') ? rawNoSlash : `${rawNoSlash}/`;
//   const byRaw = {
//     $and: [
//       { $or: [ { [`instruments.${inst}`]: true }, { [`instruments.${inst}`]: "true" } ] },
//       { $or: [
//           { [`${inst}.link`]: link },
//           { [`${inst}.link`]: rawNoSlash },
//           { [`${inst}.link`]: rawWithSlash },
//         ]
//       }
//     ]
//   };

//   // 3) último recurso: artist + song (pode haver múltiplos; pegamos o mais recente)
//   const byTitle = { artist, song };

//   let doc = await collection.findOne(byNorm);
//   if (!doc) doc = await collection.findOne(byRaw);
//   if (!doc) doc = await collection.findOne(byTitle);

//   return doc || null;
// }

// /** Tenta encontrar o doc por algumas tentativas (para dar tempo do Python gravar). */
// async function waitForGeneralCifraDoc({ instrument, link, artist, song }, { retries = 10, intervalMs = 300 } = {}) {
//   for (let i = 0; i < retries; i++) {
//     const found = await findGeneralCifraDoc({ instrument, link, artist, song });
//     if (found) return found;
//     await delay(intervalMs);
//   }
//   return null;
// }

// // Rota para chamar o serviço Python e realizar o scrape
// app.post("/api/scrape", async (req, res) => {
//   console.log('[SCRAPE] called', { body: req.body });

//   try {
//     const { artist, song, instrument, email, instrument_progressbar, link } = req.body;

//     if (!artist || !song || !instrument || !link) {
//       return res.status(400).json({ message: "artist, song, instrument e link são obrigatórios." });
//     }

//     // 1) dispara o scraper Python
//     const pyPayload = { artist, song, instrument, email, instrument_progressbar, link };
//     console.log("[LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK] :", link)
//     console.time("[SCRAPE] python request");
//     const response = await axios.post(`${pythonApiUrl}/scrape`, pyPayload);
//     console.timeEnd("[SCRAPE] python request");
//     console.log("[SCRAPE] python resp:", response.status, response.data);

//     // 2) se Python respondeu sucesso, aguardamos o doc aparecer no Mongo
//     if (response.status >= 200 && response.status < 300) {
//       console.time("[SCRAPE] waitForGeneralCifraDoc");
//       const doc = await waitForGeneralCifraDoc(
//   { instrument, link, artist, song },
//   { retries: 25, intervalMs: 400 } // ~10 segundos
//   );
//       console.timeEnd("[SCRAPE] waitForGeneralCifraDoc");

//       if (doc) {
//         console.log("[SCRAPE] returning stored document:", { _id: doc._id, artist: doc.artist, song: doc.song });
//         // 200 com o documento salvo
//         return res.status(200).json({
//           message: "Data stored successfully",
//           document: doc,
//         });
//       }

//       // Não achou após as tentativas: devolve o payload original do Python (fallback)
//       console.warn("[SCRAPE] Document not found after waiting. Returning python response only.");
//       return res.status(202).json({
//         message: "Stored, but document not yet visible. Try fetching again shortly.",
//         python: response.data,
//       });
//     }

//     // Python respondeu algo diferente de 2xx
//     return res.status(response.status).json({
//       message: "Erro ao chamar a API Python",
//       python: response.data,
//     });
//   } catch (error) {
//     console.error("[SCRAPE] error:", error?.message);
//     if (error.response) {
//       console.error("[SCRAPE] python response data:", error.response.data);
//       return res.status(error.response.status).json({
//         message: "Erro ao chamar a API Python",
//         error: error.response.data,
//       });
//     } else if (error.request) {
//       return res.status(500).json({ message: "Nenhuma resposta recebida da API Python" });
//     }
//     return res.status(500).json({ message: "Erro na configuração da requisição para a API Python" });
//   }
// });

// // Rota para criar um novo usuário
// app.post("/api/signup", async (req, res) => {
//   try {
//     const { userdata, databaseComing, collectionComing } = req.body;

//     const database = client.db(databaseComing);
//     const collection = database.collection(collectionComing);

//     console.log("Verificando se o email já existe...");
//     const query = { email: userdata.email };
//     const existingUser = await collection.findOne(query);

//     if (existingUser) {
//       // Se o email já existir, retorna que o usuário já está cadastrado
//       return res.status(200).json({
//         message: "Usuário já cadastrado!",
//       });
//     }

//     console.log("Email não existe, criando novo usuário...");

//     // Cria um novo documento com o email e o array userdata
//     const result = await collection.insertOne({
//       email: userdata.email,
//       userdata: [userdata],
//     });

//     console.log("Usuário criado com sucesso:", result);

//     return res.status(201).json({
//       message: "Usuário criado com sucesso!",
//       userId: result.insertedId,
//       user: userdata,
//     });
//   } catch (error) {
//     console.error("Erro ao criar usuário:", error);
//     res
//       .status(500)
//       .json({ message: "Erro ao criar usuário", error: error.message });
//   }
// });

// // Rota para adicionar ou atualizar uma música
// app.post("/api/newsong", async (req, res) => {
//   try {
//     const { userdata } = req.body;
//     const { databaseComing, collectionComing } = req.body;

//     // Verifica se os nomes estão presentes e válidos
//     if (!databaseComing || !collectionComing) {
//       return res
//         .status(400)
//         .json({ message: "Nome do banco de dados ou coleção não fornecido." });
//     }

//     const database = client.db(databaseComing.trim());
//     const collection = database.collection(collectionComing.trim());

//     const query = { email: userdata.email };
//     const existingUser = await collection.findOne(query);

//     if (existingUser) {
//       if (existingUser.userdata && Array.isArray(existingUser.userdata)) {
//         // Verificar se já existe um registro com o mesmo artista e música
//         let songIndex = existingUser.userdata.findIndex((song) =>
//   normalizeName(song.artist) === normalizeName(userdata.artist) &&
//   normalizeName(song.song) === normalizeName(userdata.song)
// );

//         if (songIndex !== -1) {
//           // Atualizar apenas os campos necessários do registro existente
//           const updatedSongData = {
//             ...existingUser.userdata[songIndex], // Mantenha os dados existentes
//             progressBar:
//               userdata.progressBar ||
//               existingUser.userdata[songIndex].progressBar,
//             embedVideos: Array.from(
//               new Set([
//                 ...existingUser.userdata[songIndex].embedVideos,
//                 ...userdata.embedVideos,
//               ])
//             ),
//              // Adicione esta linha para armazenar o setlist vindo do front
//              setlist: Array.from(
//               new Set([
//                 ...(existingUser.userdata[songIndex].setlist ?? []),
//                 ...(userdata.setlist ?? [])
//               ])
//             ),
//             instruments: {
//               ...existingUser.userdata[songIndex].instruments, // Mantenha os instrumentos existentes
//               [userdata.instrumentName]: {
//                 ...existingUser.userdata[songIndex].instruments[
//                   userdata.instrumentName
//                 ],
//                 ...userdata[userdata.instrumentName],
//               },
//             },
//             updateIn: new Date().toISOString().split("T")[0], // Atualiza a data de atualização
//           };

//           existingUser.userdata[songIndex] = updatedSongData;

//           const updateResult = await collection.updateOne(
//             { email: userdata.email },
//             { $set: { userdata: existingUser.userdata } }
//           );

//           console.log("Usuário atualizado com sucesso:", updateResult);

//           return res.status(200).json({
//             message: "Dados atualizados com sucesso!",
//             updatedUser: updateResult,
//           });
//         } else {
//           // Se não encontrar o registro correspondente, adicionar como novo
//           userdata.id = existingUser.userdata.length + 1;
//           const updateResult = await collection.updateOne(
//             { email: userdata.email },
//             { $push: { userdata: userdata } }
//           );

//           console.log("Novo registro adicionado com sucesso:", updateResult);

//           return res.status(200).json({
//             message: "Novo registro adicionado com sucesso!",
//             updatedUser: updateResult,
//           });
//         }
//       } else {
//         console.log(
//           "Documento contém apenas o campo email, inicializando o campo userdata..."
//         );

//         userdata.id = 1;

//         const updateResult = await collection.updateOne(
//           { email: userdata.email },
//           { $set: { userdata: [userdata] } }
//         );

//         console.log(
//           "Campo userdata inicializado e atualizado com sucesso:",
//           updateResult
//         );

//         return res.status(200).json({
//           message: "Dados atualizados com sucesso!",
//           updatedUser: updateResult,
//         });
//       }
//     } else {
//       console.log("Email não existe, criando novo usuário...");

//       userdata.id = 1;

//       const result = await collection.insertOne({
//         email: userdata.email,
//         userdata: [userdata],
//       });

//       console.log("Usuário criado com sucesso:", result);

//       return res.status(201).json({
//         message: "Usuário criado com sucesso!",
//         userId: result.insertedId,
//         user: userdata,
//       });
//     }
//   } catch (error) {
//     console.error("Erro ao criar ou atualizar o usuário:", error);
//     res.status(500).json({ message: "Erro ao criar ou atualizar o usuário." });
//   }
// });

// // Rota para buscar uma música específica no banco de dados
// app.post("/api/allsongdata", async (req, res) => {
//   try {
//     const { email, artist, song } = req.body;
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Verifica se os parâmetros foram passados
//     if (!email || !artist || !song) {
//       return res
//         .status(400)
//         .json({ message: "Email, artist e song são obrigatórios." });
//     }

//     // Busca o documento pelo email
//     const user = await collection.findOne({ email: email });

//     if (!user) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     // Busca a música específica no array 'userdata'
//     const musicData = user.userdata.find(
//       (item) => item.artist === artist && item.song === song
//     );

//     if (!musicData) {
//       return res
//         .status(404)
//         .json({ message: "Música não encontrada para este usuário." });
//     }

//     // Retorna os dados completos da música
//     return res.status(200).json(musicData);
//   } catch (error) {
//     console.error("Erro ao buscar os dados da música:", error);
//     res.status(500).json({ message: "Erro ao buscar os dados da música." });
//   }
// });

// // Rota para buscar e deletar uma música específica no banco de dados
// app.post("/api/deleteonesong", async (req, res) => {
//   console.log("deleteonesong");
//   try {
//     const { email, artist, song } = req.body;
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Verifica se os parâmetros foram passados
//     if (!email || !artist || !song) {
//       return res
//         .status(400)
//         .json({ message: "Email, artist e song são obrigatórios." });
//     }

//     // Busca o documento pelo email e remove a música específica do array 'userdata'
//     const updateResult = await collection.updateOne(
//       { email: email },
//       { $pull: { userdata: { artist: artist, song: song } } }
//     );

//     if (updateResult.modifiedCount === 0) {
//       return res.status(404).json({ message: "Música não encontrada." });
//     }

//     return res.status(200).json({ message: "Música deletada com sucesso." });
//   } catch (error) {
//     console.error("Erro ao deletar a música:", error);
//     res.status(500).json({ message: "Erro ao deletar a música." });
//   }
// });

// // Rota para obter todas as músicas de um usuário
// app.get("/api/alldata/:email", async (req, res) => {
//   try {
//     const { email } = req.params;
//     console.log(email);
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     const user = await collection.findOne({ email: email });

//     if (!user) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     // ✅ Retorna o documento inteiro (com userdata dentro)
//     res.status(200).json(user);
//   } catch (error) {
//     console.error("Erro ao buscar as músicas:", error);
//     res.status(500).json({ message: "Erro ao buscar as músicas." });
//   }
// });

// // Rota para buscar todos os dados de todos os usuários no banco de dados
// app.get("/api/alldata/", async (req, res) => {
//   try {
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Busca todos os documentos na coleção 'data'
//     const allData = await collection.find({}).toArray();

//     res.json(allData);
//   } catch (error) {
//     console.error("Erro ao buscar os dados:", error);
//     res.status(500).json({ message: "Erro ao buscar os dados." });
//   }
// });

// // Rota para atualizar o nome do usuário
// app.put("/api/updateUsername", async (req, res) => {
//   try {
//     const { email, newUsername } = req.body;

//     // Check if email and newUsername are provided
//     if (!email || !newUsername) {
//       return res.status(400).json({ message: "Email and new username are required." });
//     }

//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Find and update the username for the specified email
//     const updateResult = await collection.updateOne(
//       { email: email },
//       { $set: { "userdata.$[].username": newUsername } }
//     );

//     if (updateResult.matchedCount === 0) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     console.log("Username updated successfully:", updateResult);

//     return res.status(200).json({
//       message: "Username updated successfully!",
//       modifiedCount: updateResult.modifiedCount,
//     });
//   } catch (error) {
//     console.error("Error updating username:", error);
//     res.status(500).json({ message: "Error updating username." });
//   }
// });

// // Rota para atualizar o last time played
// app.put("/api/lastPlay", async (req, res) => {
//   try {
//     const { email, song, artist, instrument } = req.body;

//     if (!email || !song || !artist || !instrument) {
//       return res.status(400).json({
//         message: "Email, música, artista e instrumento são obrigatórios.",
//       });
//     }

//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // 0) Garante que o documento/entrada existe
//     const userDoc = await collection.findOne({ email });
//     if (!userDoc) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }
//     const hasEntry = (userDoc.userdata || []).some(
//       (u) => u.song === song && u.artist === artist
//     );
//     if (!hasEntry) {
//       return res
//         .status(404)
//         .json({ message: "Música/Artista não encontrados." });
//     }

//     // 1) Cria o subdocumento do instrumento se NÃO existir
//     await collection.updateOne(
//       {
//         email,
//         "userdata.song": song,
//         "userdata.artist": artist,
//         [`userdata.${instrument}`]: { $exists: false },
//       },
//       {
//         $set: { [`userdata.$[elem].${instrument}`]: {} },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     // 2) Se lastPlay for Date, converte para array com aquele date
//     await collection.updateOne(
//       {
//         email,
//         "userdata.song": song,
//         "userdata.artist": artist,
//         [`userdata.${instrument}.lastPlay`]: { $type: "date" },
//       },
//       {
//         $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     // 3) Se lastPlay for String, zera para array
//     await collection.updateOne(
//       {
//         email,
//         "userdata.song": song,
//         "userdata.artist": artist,
//         [`userdata.${instrument}.lastPlay`]: { $type: "string" },
//       },
//       {
//         $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     // 4) Se lastPlay não existir, cria array vazio
//     await collection.updateOne(
//       {
//         email,
//         "userdata.song": song,
//         "userdata.artist": artist,
//         $or: [
//           { [`userdata.${instrument}.lastPlay`]: { $exists: false } },
//           { [`userdata.${instrument}.lastPlay`]: null },
//         ],
//       },
//       {
//         $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     // 5) Agora sim, dá o push com segurança
//     const updateResult = await collection.updateOne(
//       { email, "userdata.song": song, "userdata.artist": artist },
//       {
//         $push: { [`userdata.$[elem].${instrument}.lastPlay`]: new Date() },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     return res.status(200).json({
//       message: "Campo lastPlay atualizado com sucesso!",
//       modifiedCount: updateResult.modifiedCount,
//     });
//   } catch (error) {
//     console.error("Erro ao atualizar o campo lastPlay:", error);
//     res.status(500).json({ message: "Erro ao atualizar o campo lastPlay." });
//   }
// });

// // Rota para download user data em formato JSON
// app.get("/api/downloadUserData/:email", async (req, res) => {
//   try {
//     const { email } = req.params;
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Fetch the user's data from the database
//     const user = await collection.findOne({ email: email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Convert the user data to a JSON string with indentation for readability
//     const jsonData = JSON.stringify(user.userdata, null, 2);

//     // Set headers to prompt the browser to download the file
//     res.setHeader("Content-Disposition", "attachment; filename=userdata.json");
//     res.setHeader("Content-Type", "application/json");

//     // Send the JSON data as the response
//     res.send(jsonData);
//   } catch (error) {
//     console.error("Error downloading user data:", error);
//     res.status(500).json({ message: "Error downloading user data." });
//   }
// });

// // Route to delete all songs except the one with id = 1
// app.post("/api/deleteAllUserSongs", async (req, res) => {
//   try {
//     const { email } = req.body;

//     console.log("Received request to delete songs for email:", email);

//     // Validate that email is provided
//     if (!email) {
//       console.log("Email not provided in the request.");
//       return res.status(400).json({ message: "Email is required." });
//     }

//     const database = client.db("liveNloud_"); // Your database name
//     const collection = database.collection("data"); // Your collection name

//     // Find the user document
//     const user = await collection.findOne({ email: email });

//     if (!user) {
//       console.log(`User with email ${email} not found.`);
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Log the current userdata
//     console.log(`Current userdata for ${email}:`, user.userdata);

//     // Ensure userdata is an array
//     if (!Array.isArray(user.userdata)) {
//       console.log(`userdata for ${email} is not an array.`);
//       return res.status(400).json({ message: "Invalid userdata format." });
//     }

//     // Check if there's a userdata element with id = 1
//     const firstSong = user.userdata.find((song) => song.id === 1);

//     if (!firstSong) {
//       console.log(`No userdata element with id = 1 found for email: ${email}`);
//       return res.status(400).json({ message: "No song with id = 1 found." });
//     }

//     // Use the $pull operator to remove all userdata elements where id != 1
//     const updateResult = await collection.updateOne(
//       { email: email },
//       { $pull: { userdata: { id: { $ne: 1 } } } }
//     );

//     console.log("Update result:", updateResult);

//     if (updateResult.matchedCount === 0) {
//       console.log(`No documents matched for email: ${email}`);
//       return res.status(404).json({ message: "User not found." });
//     }

//     if (updateResult.modifiedCount === 0) {
//       console.log(`No songs were deleted for email: ${email}`);
//       return res.status(200).json({
//         message: "No songs were deleted. Either only one song exists or 'id' fields do not match.",
//         modifiedCount: updateResult.modifiedCount,
//       });
//     }

//     // Fetch the updated document to confirm the changes
//     const updatedUser = await collection.findOne({ email: email });
//     console.log(`Updated userdata for ${email}:`, updatedUser.userdata);

//     return res.status(200).json({
//       message: "All songs except the first one have been deleted successfully!",
//       modifiedCount: updateResult.modifiedCount,
//       remainingSongs: updatedUser.userdata, // Optional: return the remaining songs
//     });
//   } catch (error) {
//     console.error("Error deleting songs:", error);
//     res.status(500).json({ message: "Error deleting songs." });
//   }
// });

// // Rota para deletar a conta completa do usuário
// app.post("/api/deleteUserAccount", async (req, res) => {
//   try {
//     const { email } = req.body;
//     console.log('deleting:', email)

//     console.log("Recebido pedido para deletar conta do email:", email);

//     // Validação: Verificar se o email foi fornecido
//     if (!email) {
//       console.log("Email não fornecido no pedido.");
//       return res.status(400).json({ message: "Email é obrigatório." });
//     }

//     const database = client.db("liveNloud_"); // Substitua pelo nome do seu banco de dados se for diferente
//     const collection = database.collection("data"); // Substitua pelo nome da sua coleção se for diferente

//     // Tentar deletar o documento do usuário baseado no email
//     const deleteResult = await collection.deleteOne({ email: email });

//     console.log("Resultado da operação de deletar:", deleteResult);

//     if (deleteResult.deletedCount === 0) {
//       console.log(`Nenhum usuário encontrado com o email: ${email}`);
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     return res.status(200).json({
//       message: "Conta do usuário deletada com sucesso!",
//       deletedCount: deleteResult.deletedCount,
//     });
//   } catch (error) {
//     console.error("Erro ao deletar a conta do usuário:", error);
//     res.status(500).json({ message: "Erro ao deletar a conta do usuário." });
//   }
// });

// // Rota para criar ou atualizar uma música no banco geral
// app.post('/api/createMusic', async (req, res) => {
//   try {
//     const {
//       song,
//       artist,
//       progressBar,
//       instruments = {},
//       guitar01,
//       guitar02,
//       bass,
//       keys,
//       drums,
//       voice,
//       embedVideos = [],
//       email = "",
//       setlist = []
//     } = req.body;

//     // ---------- utilitário: remove "progress" do objeto -----------
//     const stripProgress = (instr) => {
//       if (!instr || typeof instr !== 'object') return instr;
//       const { progress, ...clean } = instr;
//       return clean;
//     };

//     // ---------- prepara payload limpo -----------------------------
//     const incoming = {
//       song,
//       artist,
//       progressBar,
//       instruments,
//       guitar01: stripProgress(guitar01),
//       guitar02: stripProgress(guitar02),
//       bass:     stripProgress(bass),
//       keys:     stripProgress(keys),
//       drums:    stripProgress(drums),
//       voice:    stripProgress(voice),
//       embedVideos,
//       email,
//       setlist,
//       updateIn: new Date().toISOString().split('T')[0],
//     };

//     const database   = client.db('generalCifras');
//     const collection = database.collection('Documents');

//     // ---------- se já existe (mesmo song + artist) -> faz merge ----
//     const filter = { song: song, artist: artist };
//     const existing = await collection.findOne(filter);

//     if (existing) {
//       // Merge instruments flags (true se qualquer um dos lados for true)
//       const mergedInstruments = { ...existing.instruments, ...incoming.instruments };

//       // Helper para mesclar sub-documento de instrumento
//       const mergeInstrument = (inst) => {
//         if (!incoming[inst]) return existing[inst]; // nada novo
//         const oldDoc = existing[inst] || {};
//         return { ...oldDoc, ...incoming[inst] }; // incoming contém link específico
//       };

//       const update = {
//         $set: {
//           progressBar: incoming.progressBar ?? existing.progressBar,
//           instruments: mergedInstruments,
//           guitar01: mergeInstrument('guitar01'),
//           guitar02: mergeInstrument('guitar02'),
//           bass:     mergeInstrument('bass'),
//           keys:     mergeInstrument('keys'),
//           drums:    mergeInstrument('drums'),
//           voice:    mergeInstrument('voice'),
//           updateIn: incoming.updateIn,
//         },
//         $addToSet: {
//           embedVideos: { $each: incoming.embedVideos },
//           setlist:     { $each: incoming.setlist }
//         }
//       };

//       await collection.updateOne(filter, update);

//       return res.status(200).json({
//         message: 'Música existente atualizada com sucesso.'
//       });
//     }

//     // ---------- se não existe -> cria novo documento ---------------
//     const newMusic = {
//       ...incoming,
//       addedIn: new Date().toISOString().split('T')[0],
//     };

//     const result = await collection.insertOne(newMusic);

//     return res.status(201).json({
//       message: 'Música adicionada com sucesso.',
//       insertedId: result.insertedId,
//     });
//   } catch (error) {
//     if (error.code === 11000) { // Chave duplicada (caso índice unique seja criado)
//       return res.status(200).json({ message: 'Música já cadastrada.' });
//     }
//     console.error('Erro ao criar/atualizar música:', error);
//     return res.status(500).json({ message: 'Erro ao criar/atualizar música.' });
//   }
// });

// // ======================= JWT LOGIN START ============================
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');

// // Modelo AuthUser (usando o próprio MongoClient, sem mongoose)
// const authDatabase = client.db('liveNloud_');
// const authCollection = authDatabase.collection('authUsers');

// // Helpers
// const genAccessToken = (id) => jwt.sign({ userId: id }, process.env.ACCESS_SECRET, { expiresIn: '15m' });
// const genRefreshToken = (id) => jwt.sign({ userId: id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

// // Rota de cadastro
// app.post('/api/auth/signup', async (req, res) => {
//   const { email, password } = req.body;
//   const hash = await bcrypt.hash(password, 10);

//   try {
//     const existing = await authCollection.findOne({ email });

//     if (existing) return res.status(400).json({ error: 'Email já registrado' });

//     await authCollection.insertOne({ email, passwordHash: hash,  userdata: ' ',});

//     res.status(201).json({ message: 'Usuário criado com sucesso!' });
//   } catch (err) {
//     console.error('Erro ao cadastrar:', err);
//     res.status(500).json({ error: 'Erro interno' });
//   }
// });

// // Rota de login
// app.post('/api/auth/login', async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await authCollection.findOne({ email });
//     if (!user) {
//       console.log('Usuário não encontrado:', email);
//       return res.status(401).json({ error: 'Credenciais inválidas' });
//     }

//     console.log('Usuário encontrado:', user);

//     const valid = await bcrypt.compare(password, user.passwordHash);
//     if (!valid) {
//       console.log('Senha inválida para:', email);
//       return res.status(401).json({ error: 'Credenciais inválidas' });
//     }

//     const accessToken = genAccessToken(user._id.toString());
//     const refreshToken = genRefreshToken(user._id.toString());

//     await authCollection.updateOne({ _id: user._id }, { $set: { refreshToken } });

//     res.json({ accessToken, refreshToken });
//   } catch (err) {
//     console.error('Erro ao logar:', err); // <-- log detalhado
//     res.status(500).json({ error: 'Erro interno' });
//   }
// });

// // Rota de refresh token
// app.post('/api/auth/refresh', async (req, res) => {
//   const { refreshToken } = req.body;
//   if (!refreshToken) return res.sendStatus(401);

//   try {
//     const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
//     const user = await authCollection.findOne({ _id: new ObjectId(payload.userId) });

//     if (!user || user.refreshToken !== refreshToken) return res.sendStatus(403);

//     const newAccessToken = genAccessToken(user._id.toString());
//     res.json({ accessToken: newAccessToken });
//   } catch (err) {
//     res.sendStatus(403);
//   }
// });

// // Middleware de proteção
// function authenticateJWT(req, res, next) {
//   const token = req.headers['authorization']?.split(' ')[1];
//   if (!token) return res.sendStatus(401);

//   jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
//     if (err) return res.sendStatus(403);
//     req.user = user;
//     next();
//   });
// }

// // Rota protegida de teste
// app.get('/api/protected', authenticateJWT, (req, res) => {
//   res.json({ message: 'Você acessou uma rota protegida!', userId: req.user.userId });
// });
// // ======================= JWT LOGIN END ============================

// // Endpoint de healthcheck HTTP (fora de qualquer handler de conexão)
// app.get('/health', (req, res) => {
//   res.json({ ok: true, ts: Date.now() });
// });

// // ---------- helpers p/ normalização ----------
// const INSTRUMENT_ALLOWED = ['guitar01','guitar02','bass','keys','drums','voice'];
// const INSTRUMENT_MAP = { keyboard: 'keys', key: 'keys' };

// function normalizeInstrument(i) {
//   const norm = (INSTRUMENT_MAP[i] || i || '').toLowerCase();
//   return INSTRUMENT_ALLOWED.includes(norm) ? norm : null;
// }

// function normalizeName(s = "") {
//   return String(s)
//     .trim()
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/-+/g, "-")
//     .replace(/^-|-$/g, "");
// }

// /** Normaliza link para comparação estável (sem http/https, sem www, minúsculo, sem barra final) */
// function normalizeLink(u) {
//   try {
//     const url = new URL(u);
//     const host = url.hostname.replace(/^www\./i, '').toLowerCase();
//     const path = url.pathname.replace(/\/+$/,''); // remove barra final
//     return `${host}${path}`;
//   } catch {
//     return String(u)
//       .trim()
//       .replace(/^https?:\/\//i,'')
//       .replace(/^www\./i,'')
//       .replace(/\/+$/,'')
//       .toLowerCase();
//   }
// }

// /** Remove `progress` se vier no subdoc do instrumento (p/ não poluir o banco geral) */
// function stripProgress(obj) {
//   if (!obj || typeof obj !== 'object') return obj;
//   const { progress, ...rest } = obj;
//   return rest;
// }

// /** Garante que, se o subdoc tiver `link`, também ganhe `linkNorm` */
// function withLinkNorm(subdoc = {}) {
//   if (subdoc && subdoc.link) {
//     return { ...subdoc, linkNorm: normalizeLink(subdoc.link) };
//   }
//   return subdoc;
// }

// (async () => {
//   const database = client.db('generalCifras');
//   const collection = database.collection('Documents');

//   // ajuda buscas por artista/música (não-único, pois pode repetir em diferentes versões)
//   await collection.createIndex({ artist: 1, song: 1 });

//   // acelera buscas por link normalizado em cada instrumento (crie os que usar)
//   await collection.createIndex({ "guitar01.linkNorm": 1 });
//   await collection.createIndex({ "guitar02.linkNorm": 1 });
//   await collection.createIndex({ "bass.linkNorm": 1 });
//   await collection.createIndex({ "keys.linkNorm": 1 });
//   await collection.createIndex({ "drums.linkNorm": 1 });
//   await collection.createIndex({ "voice.linkNorm": 1 });

//   // flags
//   await collection.createIndex({ "instruments.guitar01": 1 });
//   await collection.createIndex({ "instruments.guitar02": 1 });
//   await collection.createIndex({ "instruments.bass": 1 });
//   await collection.createIndex({ "instruments.keys": 1 });
//   await collection.createIndex({ "instruments.drums": 1 });
//   await collection.createIndex({ "instruments.voice": 1 });
// })();

// app.put("/api/updateSetlists", async (req, res) => {
//   try {
//     const { email, setlists } = req.body;

//     if (!email || !Array.isArray(setlists)) {
//       return res
//         .status(400)
//         .json({ message: "Email e um array de setlists são obrigatórios." });
//     }

//     const sanitizedSetlists = Array.from(
//       new Set(
//         setlists
//           .map((tag) => String(tag || "").trim())
//           .filter((tag) => tag.length > 0),
//       ),
//     );

//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     const userDoc = await collection.findOne({ email });
//     if (!userDoc) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     const allowedSet = new Set(sanitizedSetlists);
//     const updatedUserdata = (userDoc.userdata || []).map((entry) => {
//       const currentSetlist = Array.isArray(entry.setlist) ? entry.setlist : [];
//       const filteredTags = currentSetlist.filter((tag) => allowedSet.has(tag));
//       return { ...entry, setlist: filteredTags };
//     });

//     const updateResult = await collection.updateOne(
//       { email },
//       {
//         $set: {
//           userdata: updatedUserdata,
//           availableSetlists: sanitizedSetlists,
//         },
//       },
//     );

//     return res.status(200).json({
//       message: "Setlists atualizadas e sincronizadas com as músicas.",
//       modifiedCount: updateResult.modifiedCount,
//       availableSetlists: sanitizedSetlists,
//     });
//   } catch (error) {
//     console.error("Erro ao atualizar setlists:", error);
//     return res
//       .status(500)
//       .json({ message: "Erro ao atualizar setlists do usuário." });
//   }
// });

// app.get('/api/generalCifra', async (req, res) => {
//   try {
//     let { instrument, link } = req.query || {};
//     if (!instrument || !link) {
//       return res.status(400).json({ message: "Parâmetros obrigatórios: instrument, link" });
//     }

//     instrument = normalizeInstrument(instrument);
//     if (!instrument) {
//       return res.status(400).json({ message: `Instrumento inválido.` });
//     }

//     const linkNorm = normalizeLink(link);

//     const database = client.db('generalCifras');
//     const collection = database.collection('Documents');

//     // Busca preferencialmente por link normalizado no subdoc do instrumento
//     const filter = {
//       $or: [
//         { [`instruments.${instrument}`]: true },
//         { [`instruments.${instrument}`]: "true" },
//       ],
//       [`${instrument}.linkNorm`]: linkNorm,
//     };

//     // Fallback: tentar bater pelo campo link "cru" também (com e sem barra)
//  // Fallback: tenta casar pelo link "cru" (com/sem barra) E exige a flag do instrumento
// const fallback = {
//   $and: [
//     {
//       $or: [
//         { [`instruments.${instrument}`]: true },
//         { [`instruments.${instrument}`]: "true" },
//       ]
//     },
//     {
//       $or: [
//         { [`${instrument}.link`]: link },
//         { [`${instrument}.link`]: link.replace(/\/+$/,'') },
//         { [`${instrument}.link`]: link.endsWith('/') ? link.slice(0,-1) : `${link}/` },
//       ]
//     }
//   ]
// };

//     let doc = await collection.findOne(filter);
//     if (!doc) doc = await collection.findOne(fallback);

//     if (!doc) return res.status(404).json({ message: "Documento não encontrado" });

//     return res.status(200).json(doc);
//   } catch (error) {
//     console.error("GET /api/generalCifra error:", error);
//     return res.status(500).json({ message: "Erro interno." });
//   }
// });

// app.put("/api/song/updateExact", async (req, res) => {
//   try {
//     const { email, updatedSong } = req.body;

//     if (!email || !updatedSong || !updatedSong.artist || !updatedSong.song) {
//       return res.status(400).json({
//         message:
//           "Parâmetros obrigatórios: email, artist, song e o payload atualizado.",
//       });
//     }

//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     const userDoc = await collection.findOne({ email });
//     if (!userDoc || !Array.isArray(userDoc.userdata)) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     const songIndex = userDoc.userdata.findIndex(
//       (entry) =>
//         normalizeName(entry.artist) === normalizeName(updatedSong.artist) &&
//         normalizeName(entry.song) === normalizeName(updatedSong.song),
//     );

//     if (songIndex === -1) {
//       return res
//         .status(404)
//         .json({ message: "Música não encontrada para este usuário." });
//     }

//     const instrumentKeys = [
//       "guitar01",
//       "guitar02",
//       "bass",
//       "keys",
//       "drums",
//       "voice",
//     ];

//     const mergedEntry = {
//       ...userDoc.userdata[songIndex],
//       ...updatedSong,
//       instruments: {
//         ...(userDoc.userdata[songIndex].instruments || {}),
//         ...(updatedSong.instruments || {}),
//       },
//       updateIn:
//         updatedSong.updateIn ||
//         userDoc.userdata[songIndex].updateIn ||
//         new Date().toISOString().split("T")[0],
//     };

//     instrumentKeys.forEach((key) => {
//       if (updatedSong[key]) {
//         mergedEntry[key] = {
//           ...(userDoc.userdata[songIndex][key] || {}),
//           ...updatedSong[key],
//         };
//       }
//     });

//     userDoc.userdata[songIndex] = mergedEntry;

//     await collection.updateOne(
//       { email },
//       { $set: { userdata: userDoc.userdata } },
//     );

//     return res
//       .status(200)
//       .json({ message: "Música atualizada com sucesso!", song: mergedEntry });
//   } catch (error) {
//     console.error("Erro ao atualizar música:", error);
//     return res
//       .status(500)
//       .json({ message: "Erro ao atualizar música.", error: error?.message });
//   }
// });

// // Inicie o servidor HTTP (Express + Socket.IO)
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
// });

// require("dotenv").config();

// const express = require("express");
// const axios = require("axios");
// const { MongoClient, Binary, ObjectId } = require("mongodb");
// const multer = require("multer");
// const path = require("path");
// const sharp = require("sharp"); // Importar sharp
// const fs = require('fs');
// const youtubeRoutes = require("./youtube/youtube.routes");
// const cookieParser = require("cookie-parser");

// // Socket.IO
// const http = require('http');
// const { Server } = require('socket.io');

// const uri = "REMOVED_MONGO_URI";
// const client = new MongoClient(uri);

// const pythonApiUrl = process.env.PYTHON_API_URL || "http://python_scraper:8000";

// const app = express();
// const PORT = process.env.PORT || 3000;

// const cors = require("cors");

// // Função para conectar ao banco de dados
// async function connectToDatabase() {
//   try {
//     await client.connect();
//     console.log("Conexão com o MongoDB estabelecida com sucesso!");
//   } catch (error) {
//     console.error("Erro ao conectar ao MongoDB:", error);
//   }
// }

// connectToDatabase();

// // Crie o servidor HTTP a partir do Express
// const server = http.createServer(app);

// const io = new Server(server, {
//   path: '/socket.io',
//   cors: {
//     origin: (origin, callback) => {
//       const allowed = [
//         "https://www.live.eloygomes.com",
//         "https://api.live.eloygomes.com",
//         "https://www.live.eloygomes.com",
//         "https://api.live.eloygomes.com",
//         "https://live.eloygomes.com",
//         "http://127.0.0.1:5173",
//         "http://localhost:5173",
//                 // <-- habilita dev
//       ];
//       // Sem origin (apps nativos) ou na lista => libera
//       if (!origin || allowed.includes(origin)) return callback(null, true);
//       return callback(new Error("Not allowed by CORS"));
//     },
//     methods: ["GET", "POST"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   },
// });

// // Namespaces
// const clientNamespace = io.of('/'); // Namespace padrão para clientes
// const pythonNamespace = io.of('/python'); // Namespace dedicado para o script Python

// // INSTRUÇÕES
// // •	messageToServer: Evento que o cliente emite para enviar dados ao servidor.
// // •	processData: Evento que o servidor emite para o script Python com os dados a serem processados.
// // •	processedData: Evento que o script Python emite para enviar os dados processados de volta ao servidor.
// // •	messageFromServer: Evento que o servidor emite para enviar os dados processados de volta ao cliente.

// // Handle client connections
// clientNamespace.on('connection', (socket) => {
//   const userEmail = socket.handshake.query.email;
//   const pipa = socket.handshake.query.pipa;

//   console.log('Usuário conectado:', socket.id, 'Email:', userEmail);
//   console.log('FRONT', pipa);

//   if (userEmail) {
//     socket.join(userEmail);
//   }

//   // Escutar eventos do cliente
// socket.on("messageToServer", ({ audioData, sampleRate }) => {
//   console.log("Audio chunk:", { bytes: audioData?.length || audioData?.byteLength, sampleRate, id: socket.id });
//   pythonNamespace.emit("processData", { clientId: socket.id, audioData, sampleRate });
// });

//   socket.on('health', (data, cb) => {
//     cb && cb({ ok: true, ts: Date.now() });
//   });

//   socket.on('disconnect', () => {
//     console.log('Usuário desconectado:', socket.id);
//   });
// });

// // Handle Python script connections
// pythonNamespace.on('connection', (socket) => {
//   console.log(`Script Python conectado: ${socket.id}`);

//   // Receber dados processados do script Python
//   socket.on('processedData', (data) => {
//     console.log('Dados processados recebidos do Python:', data);

//     // Enviar os dados processados de volta ao cliente original
//     const clientId = data.clientId;
//     const clientSocket = clientNamespace.sockets.get(clientId);

//     if (clientSocket) {
//       clientSocket.emit('messageFromServer', data);
//       console.log('Dados processados enviados ao cliente:', clientId);
//     } else {
//       console.log('Cliente não encontrado:', clientId);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log(`Script Python desconectado: ${socket.id}`);
//   });
// });

// app.use(cors({
//   origin: [
//     "https://www.live.eloygomes.com",
//     "https://api.live.eloygomes.com",
//     "https://www.live.eloygomes.com",
//     "https://api.live.eloygomes.com",
//     "https://live.eloygomes.com",
//     "http://localhost:5173",
//     "http://127.0.0.1:5173",
//   ],
//   credentials: true,
// }));

// // Middleware para JSON com limite de tamanho adequado
// app.use(express.json({ limit: "50mb" }));

// app.use(cookieParser());

// // ✅ exemplo (corrigido: usa o import já feito lá em cima)
// app.use("/api/youtube", youtubeRoutes);

// // Servir arquivos estáticos da pasta uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Configuração do Multer para armazenamento local com extensão '.jpeg'
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/profileImages");
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + ".jpeg"); // Definir extensão como '.jpeg' independente do original
//   },
// });

// // Filtro de arquivo para aceitar apenas imagens
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimeType = allowedTypes.test(file.mimetype);

//   if (extname && mimeType) {
//     return cb(null, true);
//   } else {
//     cb(new Error("Apenas imagens são permitidas (jpeg, jpg, png, gif)."));
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
//   fileFilter: fileFilter,
// });

// // Middleware para lidar com erros do Multer
// app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     // Erros do Multer
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ message: "O tamanho do arquivo excede o limite permitido de 5MB." });
//     }
//     return res.status(400).json({ message: err.message });
//   } else if (err) {
//     // Outros erros
//     return res.status(500).json({ message: err.message });
//   }
//   next();
// });

// app.post('/api/uploadProfileImage', upload.single('profileImage'), async (req, res) => {
//   try {
//     const originalFilePath = req.file.path; // Caminho do arquivo original

//     // Processar a imagem com Sharp e obter um buffer
//     const processedImageBuffer = await sharp(originalFilePath)
//       .resize(200, 200)
//       .jpeg({ quality: 80 }) // Opcional: definir qualidade e formato
//       .toBuffer();

//     // Excluir o arquivo original, pois não precisamos mais dele
//     fs.unlink(originalFilePath, (err) => {
//       if (err) {
//         console.error('Erro ao excluir o arquivo original:', err);
//       } else {
//         console.log('Arquivo original excluído com sucesso.');
//       }
//     });

//     // Obter referência à coleção onde as imagens serão armazenadas
//     const database = client.db('liveNloud_'); // Substitua pelo nome do seu banco de dados
//     const collection = database.collection('profileImages');

//     // Garantir que o campo 'email' seja único para evitar duplicatas
//     await collection.createIndex({ email: 1 }, { unique: true });

//     // Criar ou atualizar o documento para a imagem
//     const filter = { email: req.body.email }; // Filtro para encontrar o documento do usuário
//     const update = {
//       $set: {
//         image: new Binary(processedImageBuffer),
//         uploadDate: new Date(),
//       },
//     };
//     const options = { upsert: true }; // Cria o documento se não existir

//     const result = await collection.updateOne(filter, update, options);

//     if (result.upsertedCount > 0) {
//       console.log('Imagem salva no MongoDB com sucesso. Novo documento criado com ID:', result.upsertedId._id);
//     } else if (result.modifiedCount > 0) {
//       console.log('Imagem atualizada no MongoDB com sucesso.');
//     } else {
//       console.log('Nenhuma alteração feita no MongoDB.');
//     }

//     // Retornar uma resposta ao cliente
//     res.status(200).json({
//       message: 'Imagem enviada e processada com sucesso!',
//       // Opcional: retornar o ID do documento ou outras informações
//     });
//   } catch (err) {
//     if (err.code === 11000) { // Código de erro para duplicação de chave
//       console.error('Erro: O email fornecido já possui uma imagem de perfil.');
//       res.status(400).json({ error: 'O email fornecido já possui uma imagem de perfil.' });
//     } else {
//       console.error('Erro ao processar e salvar a imagem:', err);
//       res.status(500).json({ error: 'Erro ao processar e salvar a imagem' });
//     }
//   }
// });

// app.get('/api/profileImage/:email', async (req, res) => {
//   try {
//     const { email } = req.params;

//     // Validar email (opcional mas recomendado)
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ message: 'Email inválido.' });
//     }

//     const database = client.db('liveNloud_');
//     const collection = database.collection('profileImages');

//     const imageDocument = await collection.findOne({ email });

//     if (
//       !imageDocument ||
//       !imageDocument.image ||
//       !imageDocument.image.buffer
//     ) {
//       return res.status(404).json({ message: 'Imagem não encontrada.' });
//     }

//     res.set(
//       'Content-Type',
//       imageDocument.image.contentType || 'image/jpeg'
//     );
//     res.send(imageDocument.image.buffer);
//   } catch (err) {
//     console.error('Erro ao buscar a imagem:', err);
//     res.status(500).json({ error: 'Erro ao buscar a imagem' });
//   }
// });

// // Rota para chamar o serviço Python e realizar o scrape
// // ---------- helpers p/ normalização ----------
// // (você já tem normalizeInstrument e normalizeLink definidos mais acima)
// // vou reaproveitá-los aqui sem duplicar

// /** Aguarda N ms */
// const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// /** Busca o doc no banco geral usando (instrument, link) e fallbacks. */
// async function findGeneralCifraDoc({ instrument, link, artist, song }) {
//   const database = client.db('generalCifras');
//   const collection = database.collection('Documents');

//   const inst = normalizeInstrument(instrument);
//   if (!inst) return null;

//   const linkNorm = normalizeLink(link);

//   // 1) preferencial: flag do instrumento + linkNorm no subdoc
//   const byNorm = {
//     $and: [
//       { $or: [ { [`instruments.${inst}`]: true }, { [`instruments.${inst}`]: "true" } ] },
//       { [`${inst}.linkNorm`]: linkNorm },
//     ]
//   };

//   // 2) fallback: flag do instrumento + link "cru" (com/sem barra)
//   const rawNoSlash = String(link).replace(/\/+$/,'');
//   const rawWithSlash = rawNoSlash.endsWith('/') ? rawNoSlash : `${rawNoSlash}/`;
//   const byRaw = {
//     $and: [
//       { $or: [ { [`instruments.${inst}`]: true }, { [`instruments.${inst}`]: "true" } ] },
//       { $or: [
//           { [`${inst}.link`]: link },
//           { [`${inst}.link`]: rawNoSlash },
//           { [`${inst}.link`]: rawWithSlash },
//         ]
//       }
//     ]
//   };

//   // 3) último recurso: artist + song (pode haver múltiplos; pegamos o mais recente)
//   const byTitle = { artist, song };

//   let doc = await collection.findOne(byNorm);
//   if (!doc) doc = await collection.findOne(byRaw);
//   if (!doc) doc = await collection.findOne(byTitle);

//   return doc || null;
// }

// /** Tenta encontrar o doc por algumas tentativas (para dar tempo do Python gravar). */
// async function waitForGeneralCifraDoc({ instrument, link, artist, song }, { retries = 10, intervalMs = 300 } = {}) {
//   for (let i = 0; i < retries; i++) {
//     const found = await findGeneralCifraDoc({ instrument, link, artist, song });
//     if (found) return found;
//     await delay(intervalMs);
//   }
//   return null;
// }

// // Rota para chamar o serviço Python e realizar o scrape
// app.post("/api/scrape", async (req, res) => {
//   console.log('[SCRAPE] called', { body: req.body });

//   try {
//     const { artist, song, instrument, email, instrument_progressbar, link } = req.body;

//     if (!artist || !song || !instrument || !link) {
//       return res.status(400).json({ message: "artist, song, instrument e link são obrigatórios." });
//     }

//     // 1) dispara o scraper Python
//     const pyPayload = { artist, song, instrument, email, instrument_progressbar, link };
//     console.log("[LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK][LINK] :", link)
//     console.time("[SCRAPE] python request");
//     const response = await axios.post(`${pythonApiUrl}/scrape`, pyPayload);
//     console.timeEnd("[SCRAPE] python request");
//     console.log("[SCRAPE] python resp:", response.status, response.data);

//     // 2) se Python respondeu sucesso, aguardamos o doc aparecer no Mongo
//     if (response.status >= 200 && response.status < 300) {
//       console.time("[SCRAPE] waitForGeneralCifraDoc");
//       const doc = await waitForGeneralCifraDoc(
//   { instrument, link, artist, song },
//   { retries: 25, intervalMs: 400 } // ~10 segundos
//   );
//       console.timeEnd("[SCRAPE] waitForGeneralCifraDoc");

//       if (doc) {
//         console.log("[SCRAPE] returning stored document:", { _id: doc._id, artist: doc.artist, song: doc.song });
//         // 200 com o documento salvo
//         return res.status(200).json({
//           message: "Data stored successfully",
//           document: doc,
//         });
//       }

//       // Não achou após as tentativas: devolve o payload original do Python (fallback)
//       console.warn("[SCRAPE] Document not found after waiting. Returning python response only.");
//       return res.status(202).json({
//         message: "Stored, but document not yet visible. Try fetching again shortly.",
//         python: response.data,
//       });
//     }

//     // Python respondeu algo diferente de 2xx
//     return res.status(response.status).json({
//       message: "Erro ao chamar a API Python",
//       python: response.data,
//     });
//   } catch (error) {
//     console.error("[SCRAPE] error:", error?.message);
//     if (error.response) {
//       console.error("[SCRAPE] python response data:", error.response.data);
//       return res.status(error.response.status).json({
//         message: "Erro ao chamar a API Python",
//         error: error.response.data,
//       });
//     } else if (error.request) {
//       return res.status(500).json({ message: "Nenhuma resposta recebida da API Python" });
//     }
//     return res.status(500).json({ message: "Erro na configuração da requisição para a API Python" });
//   }
// });

// // Rota para criar um novo usuário
// app.post("/api/signup", async (req, res) => {
//   try {
//     const { userdata, databaseComing, collectionComing } = req.body;

//     const database = client.db(databaseComing);
//     const collection = database.collection(collectionComing);

//     console.log("Verificando se o email já existe...");
//     const query = { email: userdata.email };
//     const existingUser = await collection.findOne(query);

//     if (existingUser) {
//       // Se o email já existir, retorna que o usuário já está cadastrado
//       return res.status(200).json({
//         message: "Usuário já cadastrado!",
//       });
//     }

//     console.log("Email não existe, criando novo usuário...");

//     // Cria um novo documento com o email e o array userdata
//     const result = await collection.insertOne({
//       email: userdata.email,
//       userdata: [userdata],
//     });

//     console.log("Usuário criado com sucesso:", result);

//     return res.status(201).json({
//       message: "Usuário criado com sucesso!",
//       userId: result.insertedId,
//       user: userdata,
//     });
//   } catch (error) {
//     console.error("Erro ao criar usuário:", error);
//     res
//       .status(500)
//       .json({ message: "Erro ao criar usuário", error: error.message });
//   }
// });

// // Rota para adicionar ou atualizar uma música
// app.post("/api/newsong", async (req, res) => {
//   try {
//     const { userdata } = req.body;
//     const { databaseComing, collectionComing } = req.body;

//     // Verifica se os nomes estão presentes e válidos
//     if (!databaseComing || !collectionComing) {
//       return res
//         .status(400)
//         .json({ message: "Nome do banco de dados ou coleção não fornecido." });
//     }

//     const database = client.db(databaseComing.trim());
//     const collection = database.collection(collectionComing.trim());

//     const query = { email: userdata.email };
//     const existingUser = await collection.findOne(query);

//     // deixa artista/música em um formato comparável (slug)
// const normalizeName = (s = "") =>
//   String(s)
//     .trim()
//     .toLowerCase()
//     .normalize("NFD")              // remove acentos
//     .replace(/[\u0300-\u036f]/g, "") // remove marcas diacríticas
//     .replace(/[^a-z0-9]+/g, "-")   // troca tudo que não for alfanumérico por "-"
//     .replace(/-+/g, "-")           // evita "--"
//     .replace(/^-|-$/g, "");        // remove hífen do começo/fim

//     if (existingUser) {
//       if (existingUser.userdata && Array.isArray(existingUser.userdata)) {
//         // Verificar se já existe um registro com o mesmo artista e música
//         let songIndex = existingUser.userdata.findIndex((song) =>
//   normalizeName(song.artist) === normalizeName(userdata.artist) &&
//   normalizeName(song.song) === normalizeName(userdata.song)
// );

//         if (songIndex !== -1) {
//           // Atualizar apenas os campos necessários do registro existente
//           const updatedSongData = {
//             ...existingUser.userdata[songIndex], // Mantenha os dados existentes
//             progressBar:
//               userdata.progressBar ||
//               existingUser.userdata[songIndex].progressBar,
//             embedVideos: Array.from(
//               new Set([
//                 ...existingUser.userdata[songIndex].embedVideos,
//                 ...userdata.embedVideos,
//               ])
//             ),
//              // Adicione esta linha para armazenar o setlist vindo do front
//              setlist: Array.from(
//               new Set([
//                 ...(existingUser.userdata[songIndex].setlist ?? []),
//                 ...(userdata.setlist ?? [])
//               ])
//             ),
//             instruments: {
//               ...existingUser.userdata[songIndex].instruments, // Mantenha os instrumentos existentes
//               [userdata.instrumentName]: {
//                 ...existingUser.userdata[songIndex].instruments[
//                   userdata.instrumentName
//                 ],
//                 ...userdata[userdata.instrumentName],
//               },
//             },
//             updateIn: new Date().toISOString().split("T")[0], // Atualiza a data de atualização
//           };

//           existingUser.userdata[songIndex] = updatedSongData;

//           const updateResult = await collection.updateOne(
//             { email: userdata.email },
//             { $set: { userdata: existingUser.userdata } }
//           );

//           console.log("Usuário atualizado com sucesso:", updateResult);

//           return res.status(200).json({
//             message: "Dados atualizados com sucesso!",
//             updatedUser: updateResult,
//           });
//         } else {
//           // Se não encontrar o registro correspondente, adicionar como novo
//           userdata.id = existingUser.userdata.length + 1;
//           const updateResult = await collection.updateOne(
//             { email: userdata.email },
//             { $push: { userdata: userdata } }
//           );

//           console.log("Novo registro adicionado com sucesso:", updateResult);

//           return res.status(200).json({
//             message: "Novo registro adicionado com sucesso!",
//             updatedUser: updateResult,
//           });
//         }
//       } else {
//         console.log(
//           "Documento contém apenas o campo email, inicializando o campo userdata..."
//         );

//         userdata.id = 1;

//         const updateResult = await collection.updateOne(
//           { email: userdata.email },
//           { $set: { userdata: [userdata] } }
//         );

//         console.log(
//           "Campo userdata inicializado e atualizado com sucesso:",
//           updateResult
//         );

//         return res.status(200).json({
//           message: "Dados atualizados com sucesso!",
//           updatedUser: updateResult,
//         });
//       }
//     } else {
//       console.log("Email não existe, criando novo usuário...");

//       userdata.id = 1;

//       const result = await collection.insertOne({
//         email: userdata.email,
//         userdata: [userdata],
//       });

//       console.log("Usuário criado com sucesso:", result);

//       return res.status(201).json({
//         message: "Usuário criado com sucesso!",
//         userId: result.insertedId,
//         user: userdata,
//       });
//     }
//   } catch (error) {
//     console.error("Erro ao criar ou atualizar o usuário:", error);
//     res.status(500).json({ message: "Erro ao criar ou atualizar o usuário." });
//   }
// });

// // Rota para buscar uma música específica no banco de dados
// app.post("/api/allsongdata", async (req, res) => {
//   try {
//     const { email, artist, song } = req.body;
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Verifica se os parâmetros foram passados
//     if (!email || !artist || !song) {
//       return res
//         .status(400)
//         .json({ message: "Email, artist e song são obrigatórios." });
//     }

//     // Busca o documento pelo email
//     const user = await collection.findOne({ email: email });

//     if (!user) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     // Busca a música específica no array 'userdata'
//     const musicData = user.userdata.find(
//       (item) => item.artist === artist && item.song === song
//     );

//     if (!musicData) {
//       return res
//         .status(404)
//         .json({ message: "Música não encontrada para este usuário." });
//     }

//     // Retorna os dados completos da música
//     return res.status(200).json(musicData);
//   } catch (error) {
//     console.error("Erro ao buscar os dados da música:", error);
//     res.status(500).json({ message: "Erro ao buscar os dados da música." });
//   }
// });

// // Rota para buscar e deletar uma música específica no banco de dados
// app.post("/api/deleteonesong", async (req, res) => {
//   console.log("deleteonesong");
//   try {
//     const { email, artist, song } = req.body;
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Verifica se os parâmetros foram passados
//     if (!email || !artist || !song) {
//       return res
//         .status(400)
//         .json({ message: "Email, artist e song são obrigatórios." });
//     }

//     // Busca o documento pelo email e remove a música específica do array 'userdata'
//     const updateResult = await collection.updateOne(
//       { email: email },
//       { $pull: { userdata: { artist: artist, song: song } } }
//     );

//     if (updateResult.modifiedCount === 0) {
//       return res.status(404).json({ message: "Música não encontrada." });
//     }

//     return res.status(200).json({ message: "Música deletada com sucesso." });
//   } catch (error) {
//     console.error("Erro ao deletar a música:", error);
//     res.status(500).json({ message: "Erro ao deletar a música." });
//   }
// });

// // Rota para obter todas as músicas de um usuário
// app.get("/api/alldata/:email", async (req, res) => {
//   try {
//     const { email } = req.params;
//     console.log(email);
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     const user = await collection.findOne({ email: email });

//     if (!user) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     // ✅ Retorna o documento inteiro (com userdata dentro)
//     res.status(200).json(user);
//   } catch (error) {
//     console.error("Erro ao buscar as músicas:", error);
//     res.status(500).json({ message: "Erro ao buscar as músicas." });
//   }
// });

// // Rota para buscar todos os dados de todos os usuários no banco de dados
// app.get("/api/alldata/", async (req, res) => {
//   try {
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Busca todos os documentos na coleção 'data'
//     const allData = await collection.find({}).toArray();

//     res.json(allData);
//   } catch (error) {
//     console.error("Erro ao buscar os dados:", error);
//     res.status(500).json({ message: "Erro ao buscar os dados." });
//   }
// });

// // Rota para atualizar o nome do usuário
// app.put("/api/updateUsername", async (req, res) => {
//   try {
//     const { email, newUsername } = req.body;

//     // Check if email and newUsername are provided
//     if (!email || !newUsername) {
//       return res.status(400).json({ message: "Email and new username are required." });
//     }

//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Find and update the username for the specified email
//     const updateResult = await collection.updateOne(
//       { email: email },
//       { $set: { "userdata.$[].username": newUsername } }
//     );

//     if (updateResult.matchedCount === 0) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     console.log("Username updated successfully:", updateResult);

//     return res.status(200).json({
//       message: "Username updated successfully!",
//       modifiedCount: updateResult.modifiedCount,
//     });
//   } catch (error) {
//     console.error("Error updating username:", error);
//     res.status(500).json({ message: "Error updating username." });
//   }
// });

// // Rota para atualizar o last time played
// app.put("/api/lastPlay", async (req, res) => {
//   try {
//     const { email, song, artist, instrument } = req.body;

//     if (!email || !song || !artist || !instrument) {
//       return res.status(400).json({
//         message: "Email, música, artista e instrumento são obrigatórios.",
//       });
//     }

//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // 0) Garante que o documento/entrada existe
//     const userDoc = await collection.findOne({ email });
//     if (!userDoc) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }
//     const hasEntry = (userDoc.userdata || []).some(
//       (u) => u.song === song && u.artist === artist
//     );
//     if (!hasEntry) {
//       return res
//         .status(404)
//         .json({ message: "Música/Artista não encontrados." });
//     }

//     // 1) Cria o subdocumento do instrumento se NÃO existir
//     await collection.updateOne(
//       {
//         email,
//         "userdata.song": song,
//         "userdata.artist": artist,
//         [`userdata.${instrument}`]: { $exists: false },
//       },
//       {
//         $set: { [`userdata.$[elem].${instrument}`]: {} },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     // 2) Se lastPlay for Date, converte para array com aquele date
//     await collection.updateOne(
//       {
//         email,
//         "userdata.song": song,
//         "userdata.artist": artist,
//         [`userdata.${instrument}.lastPlay`]: { $type: "date" },
//       },
//       {
//         $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     // 3) Se lastPlay for String, zera para array
//     await collection.updateOne(
//       {
//         email,
//         "userdata.song": song,
//         "userdata.artist": artist,
//         [`userdata.${instrument}.lastPlay`]: { $type: "string" },
//       },
//       {
//         $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     // 4) Se lastPlay não existir, cria array vazio
//     await collection.updateOne(
//       {
//         email,
//         "userdata.song": song,
//         "userdata.artist": artist,
//         $or: [
//           { [`userdata.${instrument}.lastPlay`]: { $exists: false } },
//           { [`userdata.${instrument}.lastPlay`]: null },
//         ],
//       },
//       {
//         $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [] },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     // 5) Agora sim, dá o push com segurança
//     const updateResult = await collection.updateOne(
//       { email, "userdata.song": song, "userdata.artist": artist },
//       {
//         $push: { [`userdata.$[elem].${instrument}.lastPlay`]: new Date() },
//       },
//       { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
//     );

//     return res.status(200).json({
//       message: "Campo lastPlay atualizado com sucesso!",
//       modifiedCount: updateResult.modifiedCount,
//     });
//   } catch (error) {
//     console.error("Erro ao atualizar o campo lastPlay:", error);
//     res.status(500).json({ message: "Erro ao atualizar o campo lastPlay." });
//   }
// });

// // Rota para download user data em formato JSON
// app.get("/api/downloadUserData/:email", async (req, res) => {
//   try {
//     const { email } = req.params;
//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     // Fetch the user's data from the database
//     const user = await collection.findOne({ email: email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Convert the user data to a JSON string with indentation for readability
//     const jsonData = JSON.stringify(user.userdata, null, 2);

//     // Set headers to prompt the browser to download the file
//     res.setHeader("Content-Disposition", "attachment; filename=userdata.json");
//     res.setHeader("Content-Type", "application/json");

//     // Send the JSON data as the response
//     res.send(jsonData);
//   } catch (error) {
//     console.error("Error downloading user data:", error);
//     res.status(500).json({ message: "Error downloading user data." });
//   }
// });

// // Route to delete all songs except the one with id = 1
// app.post("/api/deleteAllUserSongs", async (req, res) => {
//   try {
//     const { email } = req.body;

//     console.log("Received request to delete songs for email:", email);

//     // Validate that email is provided
//     if (!email) {
//       console.log("Email not provided in the request.");
//       return res.status(400).json({ message: "Email is required." });
//     }

//     const database = client.db("liveNloud_"); // Your database name
//     const collection = database.collection("data"); // Your collection name

//     // Find the user document
//     const user = await collection.findOne({ email: email });

//     if (!user) {
//       console.log(`User with email ${email} not found.`);
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Log the current userdata
//     console.log(`Current userdata for ${email}:`, user.userdata);

//     // Ensure userdata is an array
//     if (!Array.isArray(user.userdata)) {
//       console.log(`userdata for ${email} is not an array.`);
//       return res.status(400).json({ message: "Invalid userdata format." });
//     }

//     // Check if there's a userdata element with id = 1
//     const firstSong = user.userdata.find((song) => song.id === 1);

//     if (!firstSong) {
//       console.log(`No userdata element with id = 1 found for email: ${email}`);
//       return res.status(400).json({ message: "No song with id = 1 found." });
//     }

//     // Use the $pull operator to remove all userdata elements where id != 1
//     const updateResult = await collection.updateOne(
//       { email: email },
//       { $pull: { userdata: { id: { $ne: 1 } } } }
//     );

//     console.log("Update result:", updateResult);

//     if (updateResult.matchedCount === 0) {
//       console.log(`No documents matched for email: ${email}`);
//       return res.status(404).json({ message: "User not found." });
//     }

//     if (updateResult.modifiedCount === 0) {
//       console.log(`No songs were deleted for email: ${email}`);
//       return res.status(200).json({
//         message: "No songs were deleted. Either only one song exists or 'id' fields do not match.",
//         modifiedCount: updateResult.modifiedCount,
//       });
//     }

//     // Fetch the updated document to confirm the changes
//     const updatedUser = await collection.findOne({ email: email });
//     console.log(`Updated userdata for ${email}:`, updatedUser.userdata);

//     return res.status(200).json({
//       message: "All songs except the first one have been deleted successfully!",
//       modifiedCount: updateResult.modifiedCount,
//       remainingSongs: updatedUser.userdata, // Optional: return the remaining songs
//     });
//   } catch (error) {
//     console.error("Error deleting songs:", error);
//     res.status(500).json({ message: "Error deleting songs." });
//   }
// });

// // Rota para deletar a conta completa do usuário
// app.post("/api/deleteUserAccount", async (req, res) => {
//   try {
//     const { email } = req.body;
//     console.log('deleting:', email)

//     console.log("Recebido pedido para deletar conta do email:", email);

//     // Validação: Verificar se o email foi fornecido
//     if (!email) {
//       console.log("Email não fornecido no pedido.");
//       return res.status(400).json({ message: "Email é obrigatório." });
//     }

//     const database = client.db("liveNloud_"); // Substitua pelo nome do seu banco de dados se for diferente
//     const collection = database.collection("data"); // Substitua pelo nome da sua coleção se for diferente

//     // Tentar deletar o documento do usuário baseado no email
//     const deleteResult = await collection.deleteOne({ email: email });

//     console.log("Resultado da operação de deletar:", deleteResult);

//     if (deleteResult.deletedCount === 0) {
//       console.log(`Nenhum usuário encontrado com o email: ${email}`);
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     return res.status(200).json({
//       message: "Conta do usuário deletada com sucesso!",
//       deletedCount: deleteResult.deletedCount,
//     });
//   } catch (error) {
//     console.error("Erro ao deletar a conta do usuário:", error);
//     res.status(500).json({ message: "Erro ao deletar a conta do usuário." });
//   }
// });

// // Rota para criar ou atualizar uma música no banco geral
// app.post('/api/createMusic', async (req, res) => {
//   try {
//     const {
//       song,
//       artist,
//       progressBar,
//       instruments = {},
//       guitar01,
//       guitar02,
//       bass,
//       keys,
//       drums,
//       voice,
//       embedVideos = [],
//       email = "",
//       setlist = []
//     } = req.body;

//     // ---------- utilitário: remove "progress" do objeto -----------
//     const stripProgress = (instr) => {
//       if (!instr || typeof instr !== 'object') return instr;
//       const { progress, ...clean } = instr;
//       return clean;
//     };

//     // ---------- prepara payload limpo -----------------------------
//     const incoming = {
//       song,
//       artist,
//       progressBar,
//       instruments,
//       guitar01: stripProgress(guitar01),
//       guitar02: stripProgress(guitar02),
//       bass:     stripProgress(bass),
//       keys:     stripProgress(keys),
//       drums:    stripProgress(drums),
//       voice:    stripProgress(voice),
//       embedVideos,
//       email,
//       setlist,
//       updateIn: new Date().toISOString().split('T')[0],
//     };

//     const database   = client.db('generalCifras');
//     const collection = database.collection('Documents');

//     // ---------- se já existe (mesmo song + artist) -> faz merge ----
//     const filter = { song: song, artist: artist };
//     const existing = await collection.findOne(filter);

//     if (existing) {
//       // Merge instruments flags (true se qualquer um dos lados for true)
//       const mergedInstruments = { ...existing.instruments, ...incoming.instruments };

//       // Helper para mesclar sub-documento de instrumento
//       const mergeInstrument = (inst) => {
//         if (!incoming[inst]) return existing[inst]; // nada novo
//         const oldDoc = existing[inst] || {};
//         return { ...oldDoc, ...incoming[inst] }; // incoming contém link específico
//       };

//       const update = {
//         $set: {
//           progressBar: incoming.progressBar ?? existing.progressBar,
//           instruments: mergedInstruments,
//           guitar01: mergeInstrument('guitar01'),
//           guitar02: mergeInstrument('guitar02'),
//           bass:     mergeInstrument('bass'),
//           keys:     mergeInstrument('keys'),
//           drums:    mergeInstrument('drums'),
//           voice:    mergeInstrument('voice'),
//           updateIn: incoming.updateIn,
//         },
//         $addToSet: {
//           embedVideos: { $each: incoming.embedVideos },
//           setlist:     { $each: incoming.setlist }
//         }
//       };

//       await collection.updateOne(filter, update);

//       return res.status(200).json({
//         message: 'Música existente atualizada com sucesso.'
//       });
//     }

//     // ---------- se não existe -> cria novo documento ---------------
//     const newMusic = {
//       ...incoming,
//       addedIn: new Date().toISOString().split('T')[0],
//     };

//     const result = await collection.insertOne(newMusic);

//     return res.status(201).json({
//       message: 'Música adicionada com sucesso.',
//       insertedId: result.insertedId,
//     });
//   } catch (error) {
//     if (error.code === 11000) { // Chave duplicada (caso índice unique seja criado)
//       return res.status(200).json({ message: 'Música já cadastrada.' });
//     }
//     console.error('Erro ao criar/atualizar música:', error);
//     return res.status(500).json({ message: 'Erro ao criar/atualizar música.' });
//   }
// });

// // ======================= JWT LOGIN START ============================
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');

// // Modelo AuthUser (usando o próprio MongoClient, sem mongoose)
// const authDatabase = client.db('liveNloud_');
// const authCollection = authDatabase.collection('authUsers');

// // Helpers
// const genAccessToken = (id) => jwt.sign({ userId: id }, process.env.ACCESS_SECRET, { expiresIn: '15m' });
// const genRefreshToken = (id) => jwt.sign({ userId: id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

// // Rota de cadastro
// app.post('/api/auth/signup', async (req, res) => {
//   const { email, password } = req.body;
//   const hash = await bcrypt.hash(password, 10);

//   try {
//     const existing = await authCollection.findOne({ email });

//     if (existing) return res.status(400).json({ error: 'Email já registrado' });

//     await authCollection.insertOne({ email, passwordHash: hash,  userdata: ' ',});

//     res.status(201).json({ message: 'Usuário criado com sucesso!' });
//   } catch (err) {
//     console.error('Erro ao cadastrar:', err);
//     res.status(500).json({ error: 'Erro interno' });
//   }
// });

// // Rota de login
// app.post('/api/auth/login', async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await authCollection.findOne({ email });
//     if (!user) {
//       console.log('Usuário não encontrado:', email);
//       return res.status(401).json({ error: 'Credenciais inválidas' });
//     }

//     console.log('Usuário encontrado:', user);

//     const valid = await bcrypt.compare(password, user.passwordHash);
//     if (!valid) {
//       console.log('Senha inválida para:', email);
//       return res.status(401).json({ error: 'Credenciais inválidas' });
//     }

//     const accessToken = genAccessToken(user._id.toString());
//     const refreshToken = genRefreshToken(user._id.toString());

//     await authCollection.updateOne({ _id: user._id }, { $set: { refreshToken } });

//     res.json({ accessToken, refreshToken });
//   } catch (err) {
//     console.error('Erro ao logar:', err); // <-- log detalhado
//     res.status(500).json({ error: 'Erro interno' });
//   }
// });

// // Rota de refresh token
// app.post('/api/auth/refresh', async (req, res) => {
//   const { refreshToken } = req.body;
//   if (!refreshToken) return res.sendStatus(401);

//   try {
//     const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
//     const user = await authCollection.findOne({ _id: new ObjectId(payload.userId) });

//     if (!user || user.refreshToken !== refreshToken) return res.sendStatus(403);

//     const newAccessToken = genAccessToken(user._id.toString());
//     res.json({ accessToken: newAccessToken });
//   } catch (err) {
//     res.sendStatus(403);
//   }
// });

// // Middleware de proteção
// function authenticateJWT(req, res, next) {
//   const token = req.headers['authorization']?.split(' ')[1];
//   if (!token) return res.sendStatus(401);

//   jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
//     if (err) return res.sendStatus(403);
//     req.user = user;
//     next();
//   });
// }

// // Rota protegida de teste
// app.get('/api/protected', authenticateJWT, (req, res) => {
//   res.json({ message: 'Você acessou uma rota protegida!', userId: req.user.userId });
// });
// // ======================= JWT LOGIN END ============================

// // Endpoint de healthcheck HTTP (fora de qualquer handler de conexão)
// app.get('/health', (req, res) => {
//   res.json({ ok: true, ts: Date.now() });
// });

// // ---------- helpers p/ normalização ----------
// const INSTRUMENT_ALLOWED = ['guitar01','guitar02','bass','keys','drums','voice'];
// const INSTRUMENT_MAP = { keyboard: 'keys', key: 'keys' };

// function normalizeInstrument(i) {
//   const norm = (INSTRUMENT_MAP[i] || i || '').toLowerCase();
//   return INSTRUMENT_ALLOWED.includes(norm) ? norm : null;
// }

// /** Normaliza link para comparação estável (sem http/https, sem www, minúsculo, sem barra final) */
// function normalizeLink(u) {
//   try {
//     const url = new URL(u);
//     const host = url.hostname.replace(/^www\./i, '').toLowerCase();
//     const path = url.pathname.replace(/\/+$/,''); // remove barra final
//     return `${host}${path}`;
//   } catch {
//     return String(u)
//       .trim()
//       .replace(/^https?:\/\//i,'')
//       .replace(/^www\./i,'')
//       .replace(/\/+$/,'')
//       .toLowerCase();
//   }
// }

// /** Remove `progress` se vier no subdoc do instrumento (p/ não poluir o banco geral) */
// function stripProgress(obj) {
//   if (!obj || typeof obj !== 'object') return obj;
//   const { progress, ...rest } = obj;
//   return rest;
// }

// /** Garante que, se o subdoc tiver `link`, também ganhe `linkNorm` */
// function withLinkNorm(subdoc = {}) {
//   if (subdoc && subdoc.link) {
//     return { ...subdoc, linkNorm: normalizeLink(subdoc.link) };
//   }
//   return subdoc;
// }

// (async () => {
//   const database = client.db('generalCifras');
//   const collection = database.collection('Documents');

//   // ajuda buscas por artista/música (não-único, pois pode repetir em diferentes versões)
//   await collection.createIndex({ artist: 1, song: 1 });

//   // acelera buscas por link normalizado em cada instrumento (crie os que usar)
//   await collection.createIndex({ "guitar01.linkNorm": 1 });
//   await collection.createIndex({ "guitar02.linkNorm": 1 });
//   await collection.createIndex({ "bass.linkNorm": 1 });
//   await collection.createIndex({ "keys.linkNorm": 1 });
//   await collection.createIndex({ "drums.linkNorm": 1 });
//   await collection.createIndex({ "voice.linkNorm": 1 });

//   // flags
//   await collection.createIndex({ "instruments.guitar01": 1 });
//   await collection.createIndex({ "instruments.guitar02": 1 });
//   await collection.createIndex({ "instruments.bass": 1 });
//   await collection.createIndex({ "instruments.keys": 1 });
//   await collection.createIndex({ "instruments.drums": 1 });
//   await collection.createIndex({ "instruments.voice": 1 });
// })();

// app.put("/api/updateSetlists", async (req, res) => {
//   try {
//     const { email, setlists } = req.body;

//     if (!email || !Array.isArray(setlists)) {
//       return res
//         .status(400)
//         .json({ message: "Email e um array de setlists são obrigatórios." });
//     }

//     const sanitizedSetlists = Array.from(
//       new Set(
//         setlists
//           .map((tag) => String(tag || "").trim())
//           .filter((tag) => tag.length > 0),
//       ),
//     );

//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     const userDoc = await collection.findOne({ email });
//     if (!userDoc) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     const allowedSet = new Set(sanitizedSetlists);
//     const updatedUserdata = (userDoc.userdata || []).map((entry) => {
//       const currentSetlist = Array.isArray(entry.setlist) ? entry.setlist : [];
//       const filteredTags = currentSetlist.filter((tag) => allowedSet.has(tag));
//       return { ...entry, setlist: filteredTags };
//     });

//     const updateResult = await collection.updateOne(
//       { email },
//       {
//         $set: {
//           userdata: updatedUserdata,
//           availableSetlists: sanitizedSetlists,
//         },
//       },
//     );

//     return res.status(200).json({
//       message: "Setlists atualizadas e sincronizadas com as músicas.",
//       modifiedCount: updateResult.modifiedCount,
//       availableSetlists: sanitizedSetlists,
//     });
//   } catch (error) {
//     console.error("Erro ao atualizar setlists:", error);
//     return res
//       .status(500)
//       .json({ message: "Erro ao atualizar setlists do usuário." });
//   }
// });

// app.get('/api/generalCifra', async (req, res) => {
//   try {
//     let { instrument, link } = req.query || {};
//     if (!instrument || !link) {
//       return res.status(400).json({ message: "Parâmetros obrigatórios: instrument, link" });
//     }

//     instrument = normalizeInstrument(instrument);
//     if (!instrument) {
//       return res.status(400).json({ message: `Instrumento inválido.` });
//     }

//     const linkNorm = normalizeLink(link);

//     const database = client.db('generalCifras');
//     const collection = database.collection('Documents');

//     // Busca preferencialmente por link normalizado no subdoc do instrumento
//     const filter = {
//       $or: [
//         { [`instruments.${instrument}`]: true },
//         { [`instruments.${instrument}`]: "true" },
//       ],
//       [`${instrument}.linkNorm`]: linkNorm,
//     };

//     // Fallback: tentar bater pelo campo link "cru" também (com e sem barra)
//  // Fallback: tenta casar pelo link "cru" (com/sem barra) E exige a flag do instrumento
// const fallback = {
//   $and: [
//     {
//       $or: [
//         { [`instruments.${instrument}`]: true },
//         { [`instruments.${instrument}`]: "true" },
//       ]
//     },
//     {
//       $or: [
//         { [`${instrument}.link`]: link },
//         { [`${instrument}.link`]: link.replace(/\/+$/,'') },
//         { [`${instrument}.link`]: link.endsWith('/') ? link.slice(0,-1) : `${link}/` },
//       ]
//     }
//   ]
// };

//     let doc = await collection.findOne(filter);
//     if (!doc) doc = await collection.findOne(fallback);

//     if (!doc) return res.status(404).json({ message: "Documento não encontrado" });

//     return res.status(200).json(doc);
//   } catch (error) {
//     console.error("GET /api/generalCifra error:", error);
//     return res.status(500).json({ message: "Erro interno." });
//   }
// });

// app.put("/api/song/updateExact", async (req, res) => {
//   try {
//     const { email, updatedSong } = req.body;

//     if (!email || !updatedSong || !updatedSong.artist || !updatedSong.song) {
//       return res.status(400).json({
//         message:
//           "Parâmetros obrigatórios: email, artist, song e o payload atualizado.",
//       });
//     }

//     const database = client.db("liveNloud_");
//     const collection = database.collection("data");

//     const userDoc = await collection.findOne({ email });
//     if (!userDoc || !Array.isArray(userDoc.userdata)) {
//       return res.status(404).json({ message: "Usuário não encontrado." });
//     }

//     const songIndex = userDoc.userdata.findIndex(
//       (entry) =>
//         normalizeName(entry.artist) === normalizeName(updatedSong.artist) &&
//         normalizeName(entry.song) === normalizeName(updatedSong.song),
//     );

//     if (songIndex === -1) {
//       return res
//         .status(404)
//         .json({ message: "Música não encontrada para este usuário." });
//     }

//     const instrumentKeys = [
//       "guitar01",
//       "guitar02",
//       "bass",
//       "keys",
//       "drums",
//       "voice",
//     ];

//     const mergedEntry = {
//       ...userDoc.userdata[songIndex],
//       ...updatedSong,
//       instruments: {
//         ...(userDoc.userdata[songIndex].instruments || {}),
//         ...(updatedSong.instruments || {}),
//       },
//       updateIn:
//         updatedSong.updateIn ||
//         userDoc.userdata[songIndex].updateIn ||
//         new Date().toISOString().split("T")[0],
//     };

//     instrumentKeys.forEach((key) => {
//       if (updatedSong[key]) {
//         mergedEntry[key] = {
//           ...(userDoc.userdata[songIndex][key] || {}),
//           ...updatedSong[key],
//         };
//       }
//     });

//     userDoc.userdata[songIndex] = mergedEntry;

//     await collection.updateOne(
//       { email },
//       { $set: { userdata: userDoc.userdata } },
//     );

//     return res
//       .status(200)
//       .json({ message: "Música atualizada com sucesso!", song: mergedEntry });
//   } catch (error) {
//     console.error("Erro ao atualizar música:", error);
//     return res
//       .status(500)
//       .json({ message: "Erro ao atualizar música.", error: error?.message });
//   }
// });

// // Inicie o servidor HTTP (Express + Socket.IO)
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
// });

require("dotenv").config();

const express = require("express");
const axios = require("axios");
const { MongoClient, Binary, ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp"); // Importar sharp
const fs = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const youtubeRoutes = require("./youtube/youtube.routes");
const cookieParser = require("cookie-parser");

// Socket.IO
const http = require("http");
const { Server } = require("socket.io");

const uri = process.env.MONGO_URI || "mongodb://root:example@db:27017/admin";
const client = new MongoClient(uri);

const pythonApiUrl = process.env.PYTHON_API_URL || "http://python_scraper:8000";

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require("cors");

const LAN_DEV_ORIGIN_REGEX = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/;

function isAllowedDevOrigin(origin) {
  return (
    origin === "http://127.0.0.1:5173" ||
    origin === "http://localhost:5173" ||
    LAN_DEV_ORIGIN_REGEX.test(origin)
  );
}

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

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: (origin, callback) => {
      const allowed = [
        "https://www.live.eloygomes.com",
        "https://api.live.eloygomes.com",
        "https://www.live.eloygomes.com",
        "https://api.live.eloygomes.com",
        "https://live.eloygomes.com",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
      ];
      // Sem origin (apps nativos) ou na lista => libera
      if (!origin || allowed.includes(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }
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

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "https://www.live.eloygomes.com",
        "https://api.live.eloygomes.com",
        "https://www.live.eloygomes.com",
        "https://api.live.eloygomes.com",
        "https://live.eloygomes.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];

      if (!origin || allowed.includes(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Middleware para JSON com limite de tamanho adequado
app.use(express.json({ limit: "50mb" }));

app.use(cookieParser());

// ✅ exemplo (corrigido: usa o import já feito lá em cima)
app.use("/api/youtube", youtubeRoutes);

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
app.post("/api/scrape", async (req, res) => {
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

    // 1) dispara o scraper Python
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
    console.time(requestLabel);
    const response = await axios.post(`${pythonApiUrl}/scrape`, pyPayload, {
      headers: {
        Host: "localhost",
      },
    });
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

    if (existingUser) {
      if (existingUser.userdata && Array.isArray(existingUser.userdata)) {
        // Verificar se já existe um registro com o mesmo artista e música
        let songIndex = existingUser.userdata.findIndex(
          (song) =>
            normalizeName(song.artist) === normalizeName(userdata.artist) &&
            normalizeName(song.song) === normalizeName(userdata.song),
        );

        if (songIndex !== -1) {
          // Atualizar apenas os campos necessários do registro existente
          const updatedSongData = {
            ...existingUser.userdata[songIndex], // Mantenha os dados existentes
            progressBar:
              userdata.progressBar ||
              existingUser.userdata[songIndex].progressBar,
            embedVideos: Array.isArray(userdata.embedVideos)
              ? userdata.embedVideos
              : existingUser.userdata[songIndex].embedVideos || [],
            // Adicione esta linha para armazenar o setlist vindo do front
            setlist: Array.from(
              new Set([
                ...(existingUser.userdata[songIndex].setlist ?? []),
                ...(userdata.setlist ?? []),
              ]),
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
            { $set: { userdata: existingUser.userdata } },
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
          const updateResult = await collection.updateOne(
            { email: userdata.email },
            { $push: { userdata: userdata } },
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

        const updateResult = await collection.updateOne(
          { email: userdata.email },
          { $set: { userdata: [userdata] } },
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

      const result = await collection.insertOne({
        email: userdata.email,
        userdata: [userdata],
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
      (item) => item.artist === artist && item.song === song,
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

    // 5) Agora sim, dá o push com segurança
    const updateResult = await collection.updateOne(
      { email, "userdata.song": song, "userdata.artist": artist },
      {
        $push: { [`userdata.$[elem].${instrument}.lastPlay`]: new Date() },
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
      { $pull: { userdata: { id: { $ne: 1 } } } },
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
    const { email, password } = req.body;
    console.log("deleting:", email);

    console.log("Recebido pedido para deletar conta do email:", email);

    if (!email || !password) {
      console.log("Email não fornecido no pedido.");
      return res
        .status(400)
        .json({ message: "Email e senha sao obrigatorios." });
    }

    const database = client.db("liveNloud_");
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

    const deleteResult = await collection.deleteOne({ email: email });
    await profileImages.deleteOne({ email });
    await authCollection.deleteOne({ email });

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
const userDataCollection = authDatabase.collection("data");
const notificationsCollection = authDatabase.collection("notifications");
const invitationsCollection = authDatabase.collection("invitations");
const calendarEventsCollection = authDatabase.collection("calendarEvents");
const userLogsCollection = authDatabase.collection("userLogs");
const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "https://www.live.eloygomes.com";

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

  clientNamespace.to(recipient.email).emit("notification:new", {
    ...savedNotification,
    _id: savedNotification._id.toString(),
  });

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
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    tls: { servername: host },
  });

  await transporter.sendMail({
    from,
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
      { $set: { refreshToken } },
    );

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Erro ao logar:", err); // <-- log detalhado
    res.status(500).json({ error: "Erro interno" });
  }
});

app.put("/api/auth/updatePassword", async (req, res) => {
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

    const passwordHash = await bcrypt.hash(newPassword, 10);

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

app.post("/api/auth/request-password-reset", async (req, res) => {
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

app.post("/api/auth/reset-password", async (req, res) => {
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

    const passwordHash = await bcrypt.hash(newPassword, 10);

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

app.get("/api/me", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.json(currentUser);
  } catch (error) {
    console.error("GET /api/me error:", error);
    return res.status(500).json({ message: "Erro interno ao buscar usuário." });
  }
});

app.get("/api/users/search", authenticateJWT, async (req, res) => {
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
    console.error("GET /api/users/search error:", error);
    return res.status(500).json({ message: "Erro ao buscar usuários." });
  }
});

app.get("/api/notifications", authenticateJWT, async (req, res) => {
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
    console.error("GET /api/notifications error:", error);
    return res.status(500).json({ message: "Erro ao buscar notificações." });
  }
});

app.get("/api/logs", authenticateJWT, async (req, res) => {
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

app.put("/api/notifications/read-all", authenticateJWT, async (req, res) => {
  try {
    const currentUser = await getCurrentUserProfile(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    await notificationsCollection.updateMany(
      { userEmail: currentUser.email, read: false },
      { $set: { read: true, updatedAt: new Date() } },
    );

    clientNamespace.to(currentUser.email).emit("notification:read-all", {
      userEmail: currentUser.email,
    });

    return res.json({ message: "Notificações marcadas como lidas." });
  } catch (error) {
    console.error("PUT /api/notifications/read-all error:", error);
    return res.status(500).json({ message: "Erro ao atualizar notificações." });
  }
});

app.put("/api/notifications/:id/read", authenticateJWT, async (req, res) => {
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

    clientNamespace.to(currentUser.email).emit("notification:updated", {
      notification: serializeNotification(result),
    });

    return res.json(serializeNotification(result));
  } catch (error) {
    console.error("PUT /api/notifications/:id/read error:", error);
    return res.status(500).json({ message: "Erro ao atualizar notificação." });
  }
});

app.get("/api/invitations", authenticateJWT, async (req, res) => {
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
    console.error("GET /api/invitations error:", error);
    return res.status(500).json({ message: "Erro ao buscar convites." });
  }
});

app.post("/api/invitations", authenticateJWT, async (req, res) => {
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
    console.error("POST /api/invitations error:", error);
    return res.status(500).json({ message: "Erro ao criar convite." });
  }
});

app.put("/api/invitations/:id/respond", authenticateJWT, async (req, res) => {
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
    console.error("PUT /api/invitations/:id/respond error:", error);
    return res.status(500).json({ message: "Erro ao responder convite." });
  }
});

app.delete("/api/friends/:email", authenticateJWT, async (req, res) => {
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
    console.error("DELETE /api/friends/:email error:", error);
    return res.status(500).json({ message: "Erro ao revogar amizade." });
  }
});

app.get("/api/calendar/events", authenticateJWT, async (req, res) => {
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
    console.error("GET /api/calendar/events error:", error);
    return res.status(500).json({ message: "Erro ao buscar eventos." });
  }
});

app.get("/api/calendar/events/:id", authenticateJWT, async (req, res) => {
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
    console.error("GET /api/calendar/events/:id error:", error);
    return res.status(500).json({ message: "Erro ao buscar evento." });
  }
});

app.post("/api/calendar/events", authenticateJWT, async (req, res) => {
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
    console.error("POST /api/calendar/events error:", error);
    return res.status(500).json({ message: "Erro ao criar evento." });
  }
});

app.put("/api/calendar/events/:id", authenticateJWT, async (req, res) => {
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
    console.error("PUT /api/calendar/events/:id error:", error);
    return res.status(500).json({ message: "Erro ao atualizar evento." });
  }
});

app.put(
  "/api/calendar/events/:id/respond",
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
      console.error("PUT /api/calendar/events/:id/respond error:", error);
      return res
        .status(500)
        .json({ message: "Erro ao responder convite do evento." });
    }
  },
);

app.delete("/api/calendar/events/:id", authenticateJWT, async (req, res) => {
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
    console.error("DELETE /api/calendar/events/:id error:", error);
    return res.status(500).json({ message: "Erro ao remover evento." });
  }
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

app.put("/api/updateSetlists", async (req, res) => {
  try {
    const { email, setlists } = req.body;

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

    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    const userDoc = await collection.findOne({ email });
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
      { email },
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

app.put("/api/song/updateExact", async (req, res) => {
  try {
    const { email, updatedSong } = req.body;

    if (!email || !updatedSong || !updatedSong.artist || !updatedSong.song) {
      return res.status(400).json({
        message:
          "Parâmetros obrigatórios: email, artist, song e o payload atualizado.",
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
        normalizeName(entry.artist) === normalizeName(updatedSong.artist) &&
        normalizeName(entry.song) === normalizeName(updatedSong.song),
    );

    if (songIndex === -1) {
      return res
        .status(404)
        .json({ message: "Música não encontrada para este usuário." });
    }

    const instrumentKeys = [
      "guitar01",
      "guitar02",
      "bass",
      "keys",
      "drums",
      "voice",
    ];

    const mergedEntry = {
      ...userDoc.userdata[songIndex],
      ...updatedSong,
      instruments: {
        ...(userDoc.userdata[songIndex].instruments || {}),
        ...(updatedSong.instruments || {}),
      },
      updateIn:
        updatedSong.updateIn ||
        userDoc.userdata[songIndex].updateIn ||
        new Date().toISOString().split("T")[0],
    };

    instrumentKeys.forEach((key) => {
      if (updatedSong[key]) {
        mergedEntry[key] = {
          ...(userDoc.userdata[songIndex][key] || {}),
          ...updatedSong[key],
        };
      }
    });

    userDoc.userdata[songIndex] = mergedEntry;

    await collection.updateOne(
      { email },
      { $set: { userdata: userDoc.userdata } },
    );

    await addUserLog({
      userEmail: email,
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

// Inicie o servidor HTTP (Express + Socket.IO)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
