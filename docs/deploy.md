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

## Atualizar à mão

Com a publicação automática ativa, isto só é preciso em emergência. Para publicar à mão:

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

## Publicação automática pelo GitHub

Ativa desde 23/11/2026 (`.github/workflows/deploy.yml`). A cada merge na `main`, o CI roda os testes e, **só se tudo passar**, o workflow "Deploy" publica exatamente aquele commit na Cloudflare. Não é preciso rodar `wrangler login` nem `pnpm cf:deploy`; esses comandos ficam para publicar à mão ou voltar uma versão numa emergência.

Configuração (feita uma vez pelo dono do projeto):

1. Na Cloudflare: **My Profile → API Tokens → Create Token**, modelo **"Edit Cloudflare Workers"**, só para a sua conta (de preferência com validade). Copie o token uma vez.
2. O **Account ID** fica em **Workers e Pages**, na lateral.
3. No GitHub: **Settings → Environments → New environment** `production`; em **Deployment branches**, só a `main`; em **Environment secrets**, `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` (secrets, nunca "variables").

Como acompanhar: aba **Actions** do repositório → workflow **Deploy**. Se os segredos não estiverem configurados, a publicação é pulada com um aviso, sem erro. Se o token vazar ou vencer, gere outro na Cloudflare (**Roll**) e troque o segredo no GitHub.

## Padrão de nomes para vários jogos na mesma conta

O endereço é `NOME-DO-WORKER.SUBDOMINIO-DA-CONTA.workers.dev`. Use um subdomínio de conta neutro (o seu "estúdio", não o nome de um jogo) e o nome de cada jogo no `name` do `wrangler.jsonc` (aqui, `village-flood`). Trocar o subdomínio da conta muda o endereço de todos os Workers dela de uma vez.

## O que o projeto já cuida

- Cabeçalhos de segurança em todas as páginas (`apps/web/cloudflare/_headers`): política de conteúdo que só aceita arquivos e conexões do próprio site, sem incorporação em outros sites, sem envio de endereço de origem (`Referrer-Policy: no-referrer`) e sem acesso a câmera, microfone ou localização.
- Service worker sempre conferido a cada visita (`Cache-Control: no-cache`); arquivos com hash no nome ficam em cache por 1 ano.
- Sem telemetria do Wrangler, sem registros de acesso e sem endereços de prévia (`apps/server/wrangler.jsonc`).
- Salas expiram depois de 12 h sem atividade; tokens de assento guardados só como hash.
