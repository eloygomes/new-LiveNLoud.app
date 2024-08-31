const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const app = express();
const port = 3000;
const cors = require("cors");

const uri = "mongodb://root:example@db:27017/admin";
const client = new MongoClient(uri);
const pythonApiUrl = "http://python_scraper:8000";

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Conexão com o MongoDB estabelecida com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
  }
}

connectToDatabase();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

// Nova Rota para chamar o serviço Python e realizar o scrape

app.post("/api/scrape", async (req, res) => {
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

// Rota para criar um novo item (usando o método POST corretamente)
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

app.post("/api/newsong", async (req, res) => {
  try {
    console.log("Dados recebidos:", req.body);

    const { userdata } = req.body;
    const { databaseComing, collectionComing } = req.body;

    console.log("Banco de dados:", databaseComing);
    console.log("Coleção:", collectionComing);

    // Verifica se os nomes estão presentes e válidos
    if (!databaseComing || !collectionComing) {
      return res
        .status(400)
        .json({ message: "Nome do banco de dados ou coleção não fornecido." });
    }

    const database = client.db(databaseComing.trim());
    const collection = database.collection(collectionComing.trim());

    console.log("Verificando se o email já existe...");
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
            [userdata.instrumentName]: {
              ...existingUser.userdata[songIndex][userdata.instrumentName],
              ...userdata[userdata.instrumentName],
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

// Rota para buscar uma musica específica no banco de dados
app.get("/api/alldata/:dataid", async (req, res) => {
  try {
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Busca todos os filmes na coleção 'movies'
    const songData = await collection.find({}).toArray();

    res.json(allMovies);
  } catch (error) {
    console.error("Erro ao buscar os filmes:", error);
    res.status(500).json({ message: "Erro ao buscar os filmes." });
  }
});

// Nova Rota para buscar todos os dados no banco de dados
app.get("/api/alldata/", async (req, res) => {
  try {
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Busca todos os filmes na coleção 'movies'
    const allMovies = await collection.find({}).toArray();

    res.json(allMovies);
  } catch (error) {
    console.error("Erro ao buscar os filmes:", error);
    res.status(500).json({ message: "Erro ao buscar os filmes." });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
