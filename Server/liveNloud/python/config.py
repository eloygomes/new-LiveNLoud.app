import os

# Config de Mongo
def shared_sustenido_mongo_uri():
    host = os.getenv("SUSTENIDO_MONGO_HOST", "").strip()
    port = os.getenv("SUSTENIDO_MONGO_PORT", "27018").strip()
    user = os.getenv("SUSTENIDO_MONGO_USER", "")
    password = os.getenv("SUSTENIDO_MONGO_PASS", "")
    if host and user and password:
        from urllib.parse import quote_plus
        return f"mongodb://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/admin?authSource=admin"
    return os.getenv("SUSTENIDO_MONGO_URI") or os.getenv("MONGO_URI", "REMOVED_MONGO_URI")


MONGO_URI = shared_sustenido_mongo_uri()
MONGO_DB_NAME = os.getenv(
    "MONGO_DB_NAME",
    os.getenv("APP_DATABASE_NAME", "sustenido"),
)
MONGO_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "data")

# URL da API Node para enviar dados pra generalCifras
NODE_API_URL = os.getenv(
    "NODE_API_URL",
    "https://api.live.eloygomes.com/api/v1/createMusic",
)
