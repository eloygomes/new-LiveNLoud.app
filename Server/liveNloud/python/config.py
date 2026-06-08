import os

# Config de Mongo
MONGO_URI = os.getenv("MONGO_URI", "REMOVED_MONGO_URI")
MONGO_DB_NAME = os.getenv(
    "MONGO_DB_NAME",
    os.getenv("APP_DATABASE_NAME", "liveNloud_"),
)
MONGO_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "data")

# URL da API Node para enviar dados pra generalCifras
NODE_API_URL = os.getenv(
    "NODE_API_URL",
    "https://api.live.eloygomes.com/api/v1/createMusic",
)
