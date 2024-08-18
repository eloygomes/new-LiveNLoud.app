const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const port = 3000;
const cors = require("cors");

const uri = "mongodb://root:example@db:27017/admin";
const client = new MongoClient(uri);

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
    const { databaseComing, collectionComing } = req.body; // Corrigido de moviesComing para collectionComing

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

    let newId = 1;

    if (existingUser) {
      if (existingUser.userdata && Array.isArray(existingUser.userdata)) {
        const isDuplicate = existingUser.userdata.some((existingData) => {
          const { id, ...existingFields } = existingData;
          const { id: newId, ...newFields } = userdata;
          return JSON.stringify(existingFields) === JSON.stringify(newFields);
        });

        if (isDuplicate) {
          console.log(
            "Nenhuma alteração, todos os campos (exceto id) já existem."
          );
          return res.status(200).json({
            message:
              "Nenhuma alteração, todos os campos (exceto id) já existem.",
          });
        }

        const maxId = Math.max(
          ...existingUser.userdata.map((u) => u.id).filter((id) => !isNaN(id)),
          0
        );
        newId = maxId + 1;

        userdata.id = newId;

        const updateResult = await collection.updateOne(
          { email: userdata.email },
          { $push: { userdata: userdata } }
        );

        console.log("Usuário atualizado com sucesso:", updateResult);
        return res.status(200).json({
          message: "Dados atualizados com sucesso!",
          updatedUser: updateResult,
        });
      } else {
        console.log(
          "Documento contém apenas o campo email, inicializando o campo userdata..."
        );

        userdata.id = newId;

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

      userdata.id = newId;

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

// Rota para buscar um filme específico no banco de dados
app.get("/api/data/:dataid", async (req, res) => {
  try {
    const database = client.db("liveNloud_");
    const collection = database.collection("data");

    // Query for a movie that has the title 'Back to the Future'
    const query = { title: "Back to the Future" };
    const movie = await collection.findOne(query);

    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: "Filme não encontrado." });
    }
  } catch (error) {
    console.error("Erro ao buscar o filme:", error);
    res.status(500).json({ message: "Erro ao buscar o filme." });
  }
});

// Nova Rota para buscar todos os filmes no banco de dados
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
