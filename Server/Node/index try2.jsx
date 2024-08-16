const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const port = 3000;

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

// // Rota para listar todos os itens (usando o método GET corretamente)
// app.get('/api/items', (req, res) => {
//   res.json({ message: 'Listagem de itens' });
// });

// Rota para criar um novo item (usando o método POST corretamente)
app.post("/api/movie", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    // Dados do filme recebidos no corpo da requisição
    const newMovie = req.body;

    // Insere o novo filme na coleção 'movies'
    const result = await movies.insertOne(newMovie);

    // Retorna o resultado da inserção
    res.status(201).json({
      message: "Filme criado com sucesso!",
      movieId: result.insertedId,
      movie: newMovie,
    });
  } catch (error) {
    console.error("Erro ao criar o filme:", error);
    res.status(500).json({ message: "Erro ao criar o filme." });
  }
});

app.post("/api/insert", async (req, res) => {
  // TESTE funcionouuuuuuu
  // com esse input:
  // {
  //   "databaseComing": "broxada_sinistra",
  //   "moviesComing": "movies",
  //   "newMovie": {
  //     "title": "loucura",
  //     "year": 2077,
  //     "director": "Luciano hulk robotinic"
  //   }
  // }
  try {
    // Dados do filme recebidos no corpo da requisição
    const { newMovie } = req.body;
    const { databaseComing, moviesComing } = req.body;

    const database = client.db(databaseComing);
    const movies = database.collection(moviesComing);

    // Insere o novo filme na coleção 'movies'
    const result = await movies.insertOne(newMovie);

    // Retorna o resultado da inserção
    res.status(201).json({
      message: "Filme criado com sucesso!",
      movieId: result.insertedId,
      movie: newMovie,
    });
  } catch (error) {
    console.error("Erro ao criar o filme:", error);
    res.status(500).json({ message: "Erro ao criar o filme." });
  }
});

// // Rota para atualizar um item existente (usando o método PUT corretamente)
// app.put('/api/items/:id', (req, res) => {
//   const { id } = req.params;
//   const updatedItem = req.body;
//   res.json({ message: `Item com ID ${id} atualizado com sucesso!`, item: updatedItem });
// });

// // Rota para deletar um item (usando o método DELETE corretamente)
// app.delete('/api/items/:id', (req, res) => {
//   const { id } = req.params;
//   res.json({ message: `Item com ID ${id} deletado com sucesso!` });
// });

// Rota para buscar um filme específico no banco de dados
app.get("/api/movie", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    // Query for a movie that has the title 'Back to the Future'
    const query = { title: "Back to the Future" };
    const movie = await movies.findOne(query);

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
app.get("/api/movies", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    // Busca todos os filmes na coleção 'movies'
    const allMovies = await movies.find({}).toArray();

    res.json(allMovies);
  } catch (error) {
    console.error("Erro ao buscar os filmes:", error);
    res.status(500).json({ message: "Erro ao buscar os filmes." });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
