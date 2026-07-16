# Site comercial do Sustenido

Landing page estática em português brasileiro, construída com Astro, TypeScript, React, Tailwind CSS e React Three Fiber. A primeira versão usa o modo de conversão `WAITLIST`, não inventa preço e mantém links comerciais opcionais.

## Executar localmente

Requer Node.js 22 ou uma versão LTS compatível.

```bash
npm install
cp .env.example .env
npm run dev
```

O site ficará disponível em `http://localhost:4321`.

## Validação e build

```bash
npm test
npm run check
npm run build
npm run preview
```

## Configuração

Todas as variáveis são públicas porque entram no bundle estático. Não coloque segredos nelas.

- `PUBLIC_SITE_URL`: URL canônica do site.
- `PUBLIC_APP_URL`: destino do link “Entrar”; o link é ocultado quando vazio.
- `PUBLIC_CTA_MODE`: `WAITLIST`, `TRIAL` ou `CHECKOUT`.
- `PUBLIC_CTA_URL`: destino real do CTA; quando vazio, leva à seção de acesso/FAQ sem simular envio.
- `PUBLIC_CONTACT_EMAIL`: contato exibido no rodapé quando configurado.
- `PUBLIC_CHROME_EXTENSION_URL`: URL pública da extensão.
- `PUBLIC_CHROME_EXTENSION_AVAILABLE`: exibe disponibilidade somente com `true` e URL confirmada.
- `PUBLIC_ANALYTICS_ID`: reservado para integração futura; nenhum analytics é carregado por padrão.

## Docker e VPS

```bash
docker compose up --build -d
```

O container expõe a porta interna `8080`, roda com Nginx sem privilégios e fornece `GET /healthz`. TLS e domínio devem ser terminados pelo reverse proxy da VPS.

## Decisões pendentes

- Domínio e URL final do aplicativo.
- Destino do CTA/lista de interesse e contato.
- Modelo, preço e eventual período de teste.
- Escopo oficial de offline e comandos mapeáveis no modo LIVE.
- Pedais, conexões, navegadores e versões mínimas oficialmente suportados.
- URL e disponibilidade da extensão na Chrome Web Store.
- Textos jurídicos, privacidade, cancelamento e consentimento LGPD.
- Autorização para uso de marcas de terceiros.

O site não deve ser publicado antes de esses destinos e alegações serem revisados pelo responsável pelo produto.
