---
title: "Início rápido para desenvolvimento"
description: "Prepare o repositório e execute os componentes do #Sustenido localmente."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["setup", "desenvolvimento", "node", "docker"]
order: 200
---

## Pré-requisitos

- Git;
- Node.js compatível com cada lockfile;
- npm;
- Docker com Compose para API, MongoDB e scraper;
- Expo e ambiente Android/iOS somente se trabalhar no aplicativo nativo.

Use arquivos `.env.example` como inventário de chaves. Nunca copie credenciais de produção para desenvolvimento nem versione `.env`.

## Web principal

```bash
cd Front
npm ci
npm run dev
```

Por padrão local, o controlador da web usa `http://localhost:3000` quando `VITE_API_BASE_URL` não foi definido. Para builds de ambiente, use os scripts `build:live` ou `build:sustenido`; não troque URLs manualmente no código.

## Backend e scraper

```bash
cd Server/sustenido
cp .env.example .env
docker compose up -d --build
```

Preencha apenas valores locais. O Compose sobe MongoDB, API Node e scraper Python. O ambiente `live` é desenvolvimento; não é staging nem LIVE MODE. Scraping e demais integrações externas são **Beta**, inclusive no ambiente local.

## Aplicativo nativo

```bash
cd Mobile
npm ci
npm start
```

O mobile ainda contém a API de desenvolvimento codificada no código. Corrigir isso por configuração de ambiente é pré-requisito para tratar o build como produção.

## Admin

```bash
cd Admin
npm ci
npm run dev:server
npm run dev
```

O frontend local usa a porta 5174 e o servidor local, 5175. O Admin tem autenticação e banco próprios; não promova usuários comuns para simular administradores.

## Verificação mínima

Execute testes e builds do componente alterado. Não considere `npm test` do Admin evidência de cobertura: hoje ele aceita ausência de testes.
