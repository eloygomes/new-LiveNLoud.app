---
title: "Testes e qualidade"
description: "Comandos, cobertura observada e critérios para validar mudanças por componente."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["testes", "qualidade", "ci", "build"]
order: 330
---

| Componente | Comando principal | Estado observado |
|---|---|---|
| Web | `npm test` | suíte extensa em Vitest/Testing Library |
| Web | `npm run build:sustenido` | valida build com API de produção |
| Mobile | `npm run test:offline` | cobertura específica de store/fila offline |
| Mobile | `npm run lint` | lint Expo |
| Admin | `npm test` | passa sem testes; não é cobertura |
| Admin | `npm run build:admin` | build disponível |
| Marketing | `npm test` e `npm run build` | testes e Astro check/build |
| Backend Node | — | sem script de teste |
| Portal docs | `npm test` e `npm run build` | schemas, links, tipos e build |

## Por mudança

Execute o menor conjunto que cobre a alteração e os consumidores do contrato. Mudança de API exige testes de servidor e clientes; mudança de modelo exige fixtures compatíveis; mudança de Presentation exige interações de palco.

Offline, scraping, extensão, Guitar Pro/AlphaTab, OAuth e controles Bluetooth/MIDI são **Beta** e exigem cenários de falha do serviço, arquivo ou dispositivo externo.

## Antes de integrar

- tipos/lint sem erros;
- testes relevantes aprovados;
- build do ambiente correto;
- nenhuma URL do ambiente errado no artefato;
- autorização negativa testada;
- dados e logs de fixtures anonimizados;
- atualização da documentação e rastreabilidade.

## Lacunas prioritárias

Criar suíte do backend, testes reais do Admin, integração do fluxo cadastro/aprovação, contratos OpenAPI, testes mobile além de offline e smoke tests em container.
