# Publicação na Cloudflare

Passo a passo para publicar o jogo na sua conta da Cloudflare. Um único Worker serve o site (PWA) e as salas online (um Durable Object por sala). Nenhuma credencial entra no repositório: o login fica guardado só no seu computador.

## Antes de começar

- Conta na Cloudflare (o plano gratuito serve para começar). Os Durable Objects com armazenamento SQLite, usados pelas salas, entram no plano gratuito; confira os limites atuais em [Durable Objects: preços](https://developers.cloudflare.com/durable-objects/platform/pricing/) e [Workers: limites](https://developers.cloudflare.com/workers/platform/limits/).
- Cópia local da `main` atualizada e dependências instaladas:

```bash
git checkout main
```

```bash
git pull
```

```bash
pnpm install
```

## 1. Entrar na conta (uma vez por computador)

```bash
pnpm --filter @village-flood/server exec wrangler login
```

O navegador abre a página da Cloudflare para autorizar o Wrangler. O token fica no seu computador, fora do projeto.

## 2. Publicar

```bash
pnpm cf:deploy
```

O comando gera o site (`pnpm build`) e publica o Worker com os arquivos do site. Na primeira vez, o Wrangler pode pedir para escolher o subdomínio `workers.dev` da sua conta. No fim, ele mostra o endereço, no formato `https://village-flood.SEU-SUBDOMINIO.workers.dev`.

## 3. Conferir

1. Abra o endereço no computador e no celular. Com HTTPS, o celular oferece "Instalar app" ou "Adicionar à tela inicial".
2. Crie uma sala online e entre por outro aparelho (código, link ou QR code).
3. Abra a mesa na TV e jogue um turno pelo celular.
4. No celular instalado, ligue o modo avião e confira que "Jogar neste aparelho" continua funcionando.
5. No painel da Cloudflare (Workers e Pages → village-flood → Configurações), confira que os registros ("Workers Logs" ou "Observability") estão desligados. O projeto já publica com `observability` desligado, para não guardar dados de quem joga.

## Atualizar

Depois de cada release na `main`, repita:

```bash
git pull
```

```bash
pnpm cf:deploy
```

Para voltar à versão anterior, caso algo dê errado:

```bash
pnpm --filter @village-flood/server exec wrangler rollback
```

## Domínio próprio (opcional)

Se você tiver um domínio na Cloudflare, adicione-o no painel: Workers e Pages → village-flood → Configurações → Domínios e rotas → Adicionar → Domínio personalizado. O endereço `workers.dev` continua funcionando.

## Publicação automática pelo GitHub (opcional, para depois)

Dá para publicar a cada merge na `main` pelo GitHub Actions. Isso exige criar na Cloudflare um token de API com a permissão mínima (editar Workers só desta conta) e guardá-lo nos segredos do repositório (`CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`), nunca no código. Fica para quando você quiser; hoje a publicação é manual.

## O que o projeto já cuida

- Cabeçalhos de segurança em todas as páginas (`apps/web/cloudflare/_headers`): política de conteúdo que só aceita arquivos e conexões do próprio site, sem incorporação em outros sites, sem envio de endereço de origem (`Referrer-Policy: no-referrer`) e sem acesso a câmera, microfone ou localização.
- Service worker sempre conferido a cada visita (`Cache-Control: no-cache`); arquivos com hash no nome ficam em cache por 1 ano.
- Sem telemetria do Wrangler, sem registros de acesso e sem endereços de prévia (`apps/server/wrangler.jsonc`).
- Salas expiram depois de 12 h sem atividade; tokens de assento guardados só como hash.
