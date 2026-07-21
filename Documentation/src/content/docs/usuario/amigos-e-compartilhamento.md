---
title: "Amigos, notificações e compartilhamento"
description: "Conecte-se com outros músicos e compartilhe repertórios com controle."
audience: "usuario"
visibility: "public"
status: "stable"
featureStatus: "delivered"
owner: "produto"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["produto", "tecnico", "linguagem"]
tags: ["amigos", "notificacoes", "compartilhamento", "privacidade"]
order: 80
---

## Encontre e convide

Pesquise pelo e-mail ou nome de usuário conhecido. Confira a identidade antes de enviar o convite e use a mensagem opcional apenas para contexto necessário.

## Aceite ou recuse

Convites pendentes aparecem na área social. Aceitar cria a amizade; recusar encerra o convite. Você pode remover uma amizade depois.

## Notificações

O sino reúne convites, eventos e compartilhamentos. Marque itens individualmente ou todos como lidos. As notificações atuais usam APIs REST; Socket.IO é tecnologia descontinuada e não faz parte deste fluxo.

## Compartilhe uma setlist

Setlists só podem ser compartilhadas com amigos aceitos. O destinatário decide aceitar ou recusar; ao aceitar, as músicas são importadas ou mescladas.

## Privacidade

Compartilhe apenas repertórios que você pode distribuir. Antes de remover uma amizade, saiba que conteúdos já importados pelo outro usuário não são necessariamente apagados da conta dele.
