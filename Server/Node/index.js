const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

// Conectar ao MongoDB
// mongoose.connect("mongodb://root:example@db:27017/admin", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose
  .connect("mongodb://root:example@191.252.102.212:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Autenticado no banco de dados admin");
    // Depois de autenticado, você pode tentar acessar ou criar o banco de dados desejado
    return mongoose.connection.useDb("meu_banco"); // Substitua 'meu_banco' pelo nome do banco de dados desejado
  })
  .then((db) => {
    console.log("Conectado ao banco de dados meu_banco");
    // Continue com as operações no banco de dados 'meu_banco'
  })
  .catch((err) => {
    console.error("Erro ao conectar:", err);
  });

// Definir o esquema e o modelo para músicas
const songSchema = new mongoose.Schema({
  id: Number,
  Song: String,
  Artist: String,
  progressBar: Number,
  Instruments: Object,
  guitar01: Object,
  guitar02: Object,
  bass: Object,
  keys: Object,
  drums: Object,
  voice: Object,
  EmbedVideos: [String],
  AddedIn: Date,
  UpdateIn: Date,
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  songs: [songSchema], // Lista de músicas do usuário
});

const User = mongoose.model("User", userSchema);

// Configuração do Express
const app = express();
app.use(bodyParser.json());

// Rotas da API

// Criar ou adicionar uma nova música para um usuário
app.post("/api/songs", async (req, res) => {
  try {
    const { email, song } = req.body;

    // console.log(email);
    // console.log(song);

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, songs: [song] });

      console.log(`user is: ${user}`);
    } else {
      user.songs.push(song);
      console.log("caiu no else");
      console.log(`user is: ${song}`);
    }

    await user.save();
    res.status(201).send(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send(error);
  }
});

// Listar todas as músicas de todos os usuários
app.get("/api/songs", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Obter todas as músicas de um usuário específico pelo e-mail
app.get("/api/songs/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).send("User not found");
    res.status(200).send(user.songs);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Deletar todas as músicas de um usuário específico pelo e-mail
app.delete("/api/songs/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).send("User not found");

    user.songs = [];
    await user.save();

    res.status(200).send("All songs deleted for the user.");
  } catch (error) {
    res.status(500).send(error);
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
