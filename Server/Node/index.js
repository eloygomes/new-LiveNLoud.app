const express = require("express");
const axios = require("axios");
const { MongoClient, Binary } = require("mongodb");
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

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: [
      "https://www.live.eloygomes.com.br",
      "https://api.live.eloygomes.com.br",
    ],
    methods: ["GET", "POST"],
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
  socket.on("messageToServer", (data) => {
    console.log("Recebido do cliente:", data);

    // Emitir evento 'processData' para o script Python com os dados e o ID do cliente
    pythonNamespace.emit("processData", { ...data, clientId: socket.id });
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

app.use(
  cors({
    origin: "*", // Permite todas as origens durante o desenvolvimento
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

    const database = client.db("liveNloud_");
    const collection = database.collection("profileImages");

    // Buscar a imagem pelo email
    const imageDocument = await collection.findOne({ email: email });

    if (!imageDocument) {
      return res.status(404).json({ message: "Imagem não encontrada." });
    }

    // Enviar os dados binários da imagem
    res.set("Content-Type", "image/jpeg");
    res.send(imageDocument.image.buffer);
  } catch (err) {
    console.error("Erro ao buscar a imagem:", err);
    res.status(500).json({ error: "Erro ao buscar a imagem" });
  }
});

// Rota para chamar o serviço Python e realizar o scrape
app.post("/api/scrape", async (req, res) => {
  console.log("scrape called");
  try {
    const { artist, song, instrument, email, instrument_progressbar, link } =
      req.body;

    const response = await axios.post(`${pythonApiUrl}/scrape`, {
      artist,
      song,
      instrument,
      email,
      instrument_progressbar,
      link,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Erro ao chamar a API Python:", error.message);

    // Adicionar mais detalhes sobre o erro
    if (error.response) {
      console.error("Resposta da API Python:", error.response.data);
      res.status(error.response.status).json({
        message: "Erro ao chamar a API Python",
        error: error.response.data,
      });
    } else if (error.request) {
      console.error("Nenhuma resposta recebida da API Python");
      res
        .status(500)
        .json({ message: "Nenhuma resposta recebida da API Python" });
    } else {
      console.error("Erro na configuração da requisição para a API Python");
      res.status(500).json({
        message: "Erro na configuração da requisição para a API Python",
      });
    }
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
            song.artist === userdata.artist && song.song === userdata.song
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
    const { email } = req.params; // Obtém o email dos parâmetros da URL
    console.log(email);
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Busca o documento pelo email
    const user = await collection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Retorna todos os dados de músicas do usuário
    res.status(200).json(user.userdata);
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

    // Verificação de dados obrigatórios
    if (!email || !song || !artist || !instrument) {
      return res
        .status(400)
        .json({
          message: "Email, música, artista e instrumento são obrigatórios.",
        });
    }

    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Primeiro, converte lastPlay para array se ainda não for
    await collection.updateOne(
      {
        email: email,
        "userdata.song": song,
        "userdata.artist": artist,
        [`userdata.${instrument}.lastPlay`]: { $type: "date" },
      },
      {
        $set: { [`userdata.$[elem].${instrument}.lastPlay`]: [new Date()] },
      },
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
    );

    // Em seguida, adiciona a nova data ao array lastPlay
    const updateResult = await collection.updateOne(
      { email: email, "userdata.song": song, "userdata.artist": artist },
      {
        $push: { [`userdata.$[elem].${instrument}.lastPlay`]: new Date() },
      },
      { arrayFilters: [{ "elem.song": song, "elem.artist": artist }] }
    );

    if (updateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Usuário ou música/artista não encontrados." });
    }

    console.log("Campo lastPlay atualizado com sucesso:", updateResult);

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
    ``;

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
app.post("/api/generalCifra", async (req, res) => {
  try {
    const { instrument, link } = req.body;

    const database = client.db("generalCifras");
    const collection = database.collection("Documents");

    // Filtro baseado somente no instrumento e no link específico
    const filter = {
      [`instruments.${instrument}`]: true,
      [`${instrument}.link`]: link,
    };

    const document = await collection.findOne(filter);
    if (!document) {
      return res.status(404).json({ message: "Documento não encontrado" });
    }

    // Retorna o documento completo
    return res.status(200).json(document);
  } catch (error) {
    console.error("Erro ao tentar localizar cifra no banco geral:", error);
    return res
      .status(500)
      .json({ message: "Erro ao tentar localizar cifra no banco geral." });
  }
});

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

      // Helper para mesclar sub‑documento de instrumento
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

// Inicie o servidor HTTP (Express + Socket.IO)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
