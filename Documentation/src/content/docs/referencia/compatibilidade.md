---
title: "Compatibilidade de navegadores e recursos"
description: "Matriz inicial para escolher navegador, dispositivo e plano de contingência."
audience: "referencia"
visibility: "public"
status: "review"
featureStatus: "beta"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["produto", "tecnico", "linguagem"]
tags: ["compatibilidade", "chrome", "safari", "iphone", "palco", "beta"]
order: 140
---

## Matriz inicial

Esta matriz registra o suporte pretendido e a evidência atual; ela não substitui um teste no dispositivo real.

| Recurso | Chrome desktop | Safari desktop | Safari no iPhone | Observação |
|---|---|---|---|---|
| Biblioteca e edição web | Suportado | Suportado | Web responsiva | Validar release corrente |
| Apresentação/LIVE MODE | Suportado | Suportado | Web responsiva | Testar tela e bloqueio automático |
| Web Audio/afinador | Compatível quando autorizado | Compatível quando autorizado | Pode exigir interação e permissão | Testar microfone |
| Offline/PWA | Beta | Beta | Beta | Armazenamento varia por navegador |
| Bluetooth | Beta | Suporte variável | Não presumir suporte | Depende da Web Bluetooth API |
| MIDI | Beta | Suporte variável | Não presumir suporte | Depende da Web MIDI API |
| Guitar Pro/AlphaTab | Beta | Beta | Beta | Desempenho varia por arquivo |

## Regra para palco

Chrome e Safari são os navegadores iniciais para o modo de palco. “Navegador suportado” não significa que Bluetooth, MIDI, microfone, offline ou reprodução funcionem igualmente em todo sistema. Faça um ensaio completo no equipamento final.
