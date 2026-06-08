import os

# Config de Mongo
MONGO_URI = os.getenv("MONGO_URI", "mongodb://root:example@db:27017/admin")
MONGO_DB_NAME = os.getenv(
    "MONGO_DB_NAME",
    os.getenv("APP_DATABASE_NAME", "sustenido"),
)
MONGO_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "data")

# URL interna da API Node para enviar dados para generalCifras.
NODE_API_URL = os.getenv("NODE_API_URL", "http://node:3000/api/v1/createMusic")
