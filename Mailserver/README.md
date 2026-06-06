# Shared Mailserver

Stack independente e centralizado para email transacional usado por `sustenido` e `liveNloud`.

## Conteudo local

- `docker-compose.yml`: define o container `shared_mailserver` e a rede `mailserver-network`.
- `mailserver.env`: configuracao do `docker-mailserver`.
- `docker-data/config`: contas, aliases e DKIM copiados do mailserver funcional do `liveNloud`.
- `docker-data/mail-data`, `docker-data/mail-state`, `docker-data/mail-logs`: volumes persistentes do novo stack.

## Cuidados

Nao suba este stack com o mailserver antigo ainda publicando as portas oficiais no mesmo host:

```text
25
465
587
```

Antes da troca no VPS, pare o container antigo `mailserver` ou remova a publicacao dessas portas em um teste controlado.

Para subir o novo mailserver apenas para testes internos Docker, sem publicar portas no host:

```bash
docker compose -f docker-compose.internal.yml up -d
```

Para a troca oficial, pare o mailserver antigo antes de subir o compose com portas publicas:

```bash
docker stop mailserver
docker compose up -d
```

Os backends devem conectar por DNS Docker interno:

```env
SMTP_HOST=shared_mailserver
SMTP_PORT=587
SMTP_TLS_SERVERNAME=mail.eloygomes.com
```

O nome `SMTP_TLS_SERVERNAME` deve permanecer publico para validar o certificado LetsEncrypt de `mail.eloygomes.com`.
