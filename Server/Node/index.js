const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");

// Socket.IO
const http = require("http");
const { Server } = require("socket.io");

const uri = "mongodb://root:example@db:27017/admin";
const client = new MongoClient(uri);
const pythonApiUrl = "http://python_scraper:8000";

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

// Configure o Socket.IO com o servidor HTTP
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173", "https://www.live.eloygomes.com.br"],
//     methods: ["GET", "POST"],
//   },
// });

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

// INSTRUCTIONS
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

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "https://www.live.eloygomes.com.br"],
  })
);

app.use(express.json({ limit: "50mb" })); // Defina o limite conforme necessário

// Rota para chamar o serviço Python e realizar o scrape
app.post("/api/scrape", async (req, res) => {
  console.log("scrape called");
  try {
    const { artist, song, instrument, email, instrument_progressbar, link } =
      req.body;

    // URL correta para chamar o serviço Flask rodando no container Python
    const response = await axios.post("http://python:8000/scrape", {
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

// Inicie o servidor HTTP (Express + Socket.IO)
// server.listen(port, () => {
//   console.log(`Servidor rodando em http://localhost:${port}`);
// });

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
