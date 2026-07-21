# Sustenido Admin Only

Painel administrativo separado do `Front/`, com frontend React/Vite e backend Express no mesmo projeto.

Este Admin foi preparado para administrar somente o ambiente Sustenido. O controle de acesso usa o banco remoto de producao informado em `ADMIN_MONGO_URI`. O projeto nao cria um Mongo local.

Separacao de dados:

- `adminPanel.adminUsers`: login/permissao dos administradores no banco remoto.
- `adminPanel.adminLogs`: auditoria administrativa no banco remoto.
- API interna `admin-api`: servico Python no mesmo `docker-compose.yml` que le os bancos remotos do Admin e do Sustenido.
- Mongo do Sustenido via `host.docker.internal:27018`: banco alvo usado somente para operar usuarios, musicas, amizades e logs do produto.

## Instalar no servidor

```bash
cd Admin
cp .env.example .env
```

O repositorio mantem somente `.env.example`. No servidor, crie um unico `.env` a partir dele:

```text
PORT=5175
ADMIN_DB_NAME=adminPanel
ADMIN_MONGO_HOST=HOST_PRODUCAO
ADMIN_MONGO_PORT=27019
ADMIN_MONGO_ROOT_USER=USER
ADMIN_MONGO_ROOT_PASSWORD=SENHA
ADMIN_ACCESS_SECRET=...
ADMIN_REFRESH_SECRET=...
ADMIN_BOOTSTRAP_EMAIL=eloy.gomes@icloud.com
ADMIN_BOOTSTRAP_PASSWORD=...
SUSTENIDO_MONGO_URI=mongodb://USER:SENHA@host.docker.internal:27018/admin
TARGET_DB_NAME=sustenido
ADMIN_PUBLIC_ORIGIN=https://admin.sustenido.eloygomes.com
FRONTEND_BASE_URL=https://sustenido.eloygomes.com
```

`ADMIN_ACCESS_SECRET` e `ADMIN_REFRESH_SECRET` sao proprios do painel Admin. Nao use os secrets da API do Sustenido aqui.

`ADMIN_BOOTSTRAP_EMAIL` e `ADMIN_BOOTSTRAP_PASSWORD` criam/atualizam o primeiro usuario admin no banco proprio do painel. Depois que conseguir entrar, troque/remova a senha de bootstrap do `.env` em um ciclo posterior.

## Subir com Docker Compose

```bash
docker compose up -d --build
```

Ou use o script de deploy no VPS:

```bash
./scripts/deploy_admin_sustenido.sh
```

O script local copia `Admin/` para `/home/Admin` no VPS e roda o Docker Compose remoto. Ele usa `REMOTE_SERVER` de `scripts/ops/config.sh`. Se o caminho remoto for outro:

```bash
ADMIN_REMOTE_DIR=/outro/caminho/Admin ./scripts/deploy_admin_sustenido.sh
```

O painel monta a conexao a partir de `ADMIN_MONGO_HOST`, `ADMIN_MONGO_PORT`, `ADMIN_MONGO_ROOT_USER` e `ADMIN_MONGO_ROOT_PASSWORD`. Uma `ADMIN_MONGO_URI` completa continua aceita como alternativa. As telas administrativas operam o banco alvo definido em `SUSTENIDO_MONGO_URI`. O Admin local e o publicado devem apontar para o mesmo Mongo administrativo para compartilhar usuarios e senhas.

O Admin nao entra na rede Docker `sustenido_sustenido-network`. Para acessar o banco alvo, use a porta publicada do Mongo do Sustenido no host:

```text
host.docker.internal:27018
```

Se o log do `admin-sustenido` mostrar `getaddrinfo EAI_AGAIN db`, o `/home/Admin/.env` ainda esta com o host antigo. Corrija para:

```text
SUSTENIDO_MONGO_URI=mongodb://USER:SENHA@host.docker.internal:27018/admin
TARGET_DB_NAME=sustenido
```

`db:27017` nao funciona no Admin isolado porque esse hostname pertence ao Docker Compose do Sustenido, nao ao Compose do Admin.

## Reverse proxy

Configure o proxy publico assim:

```text
https://admin.sustenido.eloygomes.com -> container admin-sustenido porta 5175
```

O Nginx nao precisa acessar Mongo nem mudar por causa da separacao dos bancos. Se aparecer `502 Bad Gateway`, confira primeiro se o container esta escutando:

```bash
cd /home/Admin
docker compose ps
docker compose logs --tail 80 admin-sustenido
docker compose logs --tail 80 admin-api
curl -i http://127.0.0.1:5175/health
```

## Desenvolvimento

```bash
npm run dev:server
npm run dev
```

Frontend local: `http://localhost:5174`
Backend local: `http://localhost:5175`

## Build

```bash
npm run build:admin
```

Em producao, o frontend chama `/api` no mesmo subdominio do Admin.

## Primeiro admin

Nao promova usuario em `liveNloud_.authUsers`. O login administrativo usa `adminPanel.adminUsers` no Mongo administrativo remoto.

Configure no `/home/Admin/.env`:

```text
ADMIN_BOOTSTRAP_EMAIL=eloy.gomes@icloud.com
ADMIN_BOOTSTRAP_PASSWORD=uma-senha-forte
```

Depois rode o deploy. O servidor cria/atualiza esse usuario em `adminPanel.adminUsers`.
