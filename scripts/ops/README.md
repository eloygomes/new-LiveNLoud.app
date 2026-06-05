# Ops scripts

Scripts para sincronizar bancos, publicar o `Front/dist` e atualizar backend entre os ambientes:

- `live`: dev/staging
- `sustenido`: producao

## Configuracao inicial

Crie a configuracao local:

```bash
cp scripts/ops/config.example.sh scripts/ops/config.sh
```

Edite `scripts/ops/config.sh` e confira principalmente:

- `REMOTE_SERVER`
- `LIVE_REMOTE_APP_DIR`
- `SUSTENIDO_REMOTE_APP_DIR`
- `MONGO_PASS`
- `MONGO_DATABASES`
- diretorios de front (`*_FRONT_SITE_DIR`)

`config.sh` fica fora do Git porque pode conter senha e caminhos internos do VPS.

## Bancos

Backup manual:

```bash
./scripts/ops/db/bkp/backup_live_db.sh
./scripts/ops/db/bkp/backup_sustenido_db.sh
```

Copiar live para sustenido:

```bash
./scripts/ops/db/sync_db/db_live_to_sustenido.sh
```

Copiar sustenido para live:

```bash
./scripts/ops/db/sync_db/db_sustenido_to_live.sh
```

Os scripts sempre fazem backup do destino antes de sobrescrever e baixam uma copia local para `LOCAL_BACKUP_DIR`.

Restaurar um backup local para live:

```bash
./scripts/ops/db/restore/restore_live_db_from_backup.sh "$HOME/LiveNLoud-db-backups/live/PASTA_DO_BACKUP"
```

Restaurar um backup local para sustenido:

```bash
./scripts/ops/db/restore/restore_sustenido_db_from_backup.sh "$HOME/LiveNLoud-db-backups/sustenido/PASTA_DO_BACKUP"
```

Os restores tambem fazem backup do destino antes de sobrescrever.

Bootstrap de Mongo novo, util para servidor novo ou volume Mongo vazio:

```bash
./scripts/ops/db/bootstrap/bootstrap_mongo_live.sh
./scripts/ops/db/bootstrap/bootstrap_mongo_sustenido.sh
```

Esses scripts criam/verificam o usuario admin configurado em `config.sh`. Os dumps continuam contendo apenas os bancos da aplicacao (`MONGO_DATABASES`), nao os bancos internos `admin`, `config` e `local`.

## Front completo

Estes sao os scripts corretos para deploy completo no fluxo normal:

Deploy completo de live, equivalente ao antigo `Front/deploy/deploy_livenloud.sh`:

```bash
./scripts/ops/deploy/front/deploy_front_live.sh
```

Deploy completo de sustenido, equivalente ao antigo `Front/deploy/deploy_sustenido.sh`:

```bash
./scripts/ops/deploy/front/deploy_front_sustenido.sh
```

Esses scripts:

- buscam a versao atual no Git remoto;
- incrementam a versao local em `SoftVersion`;
- rodam `npm test`;
- rodam o build correto;
- validam a API esperada no `Front/dist`;
- fazem backup do site remoto;
- publicam o `Front/dist` com `rsync`.

## Front dist

Voce so usaria `deploy_dist_*` em casos especificos, por exemplo:

- voce ja rodou o build manualmente;
- o teste/build ja passou e voce so quer reenviar o mesmo `dist`;
- deu erro de rede no `rsync` e voce quer repetir so o envio;
- quer publicar um `dist` gerado por outro processo.

Se voce nao tem esse caso, pode ignorar os `deploy_dist_*`.

```bash
cd Front
npm run build:live
cd ..
./scripts/ops/deploy/front/manual_dist/deploy_dist_live.sh
```

ou:

```bash
cd Front
npm run build:sustenido
cd ..
./scripts/ops/deploy/front/manual_dist/deploy_dist_sustenido.sh
```

O script valida se `Front/dist` contem a API esperada antes de fazer `rsync`.

## Backend

Atualizar backend no VPS:

```bash
./scripts/ops/deploy/back/deploy_backend_live.sh
./scripts/ops/deploy/back/deploy_backend_sustenido.sh
```

Esses scripts fazem `git pull --ff-only` no diretorio remoto e depois:

```bash
docker compose up -d --build node python_scraper
```

## Observacoes

- Nao misture sync de banco com deploy de front/backend.
- Antes de rodar scripts destrutivos, eles pedem uma frase exata de confirmacao.
- Os scripts assumem que live e sustenido usam deployments separados, mas com os mesmos nomes de databases Mongo.
