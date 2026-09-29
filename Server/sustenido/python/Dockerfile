FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl chromium chromium-driver nodejs npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY requirements.txt ./
COPY package.json hero_fetcher.mjs /opt/hero/
RUN pip install --no-cache-dir -r requirements.txt \
    && cd /opt/hero && npm install --omit=dev --no-audit --no-fund \
    && python -m playwright install-deps firefox \
    && python -m camoufox fetch

COPY . .

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl --fail http://localhost:8000/health || exit 1

CMD ["python", "scrapper.py"]
