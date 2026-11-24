# Enchente na Vila

[English version](README.en.md)

Jogo de tabuleiro **cooperativo** para o navegador, de 2 a 4 assentos (pessoas ou bots). Uma chuva forte faz o rio subir: a equipe leva os moradores até a igreja e, no fim, todos os voluntários embarcam no cais. A equipe ganha ou perde junta. Roda em celular, tablet, desktop e navegador de Smart TV, e pode ser instalado como app (PWA).

> **Situação:** em desenvolvimento. Etapas 0 a 6 prontas. Falta a Etapa 7: partidas com pessoas para calibrar os números e a publicação na Cloudflare (`v1.0`). Veja o [roadmap](docs/ROADMAP.md).

## Como jogar

- Cada voluntário tem um papel com uma habilidade: Bombeiro, Barqueira, Engenheiro, Médica, Radialista ou Vizinha.
- Na sua vez, você tem **3 ações**: andar, pegar morador, curar, pôr saco de areia e as ações dos papéis. Dá para desfazer até encerrar o turno.
- Ao encerrar o turno, cai uma carta de chuva e o rio sobe. Quadras baixas alagam e depois submergem; moradores que ficam na água se ferem e acabam ilhados.
- **Vitória:** salvar a meta de moradores (levando-os à igreja) e reunir todos os voluntários no cais. **Derrota:** moradores ilhados demais ou o rio chegando ao topo.
- Três dificuldades: Tranquilo (com o botão "Dica"), Normal e Tempestade. A cada partida, o jogo sorteia em quais casas ficam os moradores extras e se o mapa aparece espelhado.

No jogo, o botão **"Como jogar"** no topo de todas as telas (um "?" no celular) mostra este resumo. Regras completas em [docs/village-flood-rules.md](docs/village-flood-rules.md).

## Modos

- **Neste aparelho:** todos em volta da mesma tela. Bots completam a equipe. Funciona sem internet depois do primeiro acesso.
- **Online:** "Criar sala online" gera um código de 6 símbolos, um link (`?sala=CODIGO`) e um QR code; os outros usam "Entrar com código" ou abrem o link. Fora da sua vez, você sugere jogadas (Ir para cá, Cuidado, Pegar daqui). Se alguém cair, um bot joga no lugar até a pessoa voltar; o aparelho reconecta sozinho.
- **Mesa:** em tablet, notebook ou TV (não aparece no celular), "Abrir mesa (TV ou notebook)" mostra o tabuleiro grande, e cada pessoa joga pelo celular (entra pelo QR code). Quem entra primeiro organiza a sala. A legenda completa abre na TV pelo controle remoto ou pelo botão "Mostrar legenda na TV" do celular.

## Acessibilidade

- Estados da água sem depender só de cor (número de altura, ondas e hachura); marcas ✓ e ✗ nas casas; sugestões com forma própria.
- Alvos de toque de pelo menos 44 px, contraste mínimo de 4,5:1 nos temas claro e escuro, foco visível, partida inteira pelo teclado, rótulo em cada quadra e eventos anunciados para leitores de tela.
- Animações curtas, desligadas quando o aparelho pede "reduzir movimento". Sons curtos, com o botão "Som" no topo de todas as telas.
- Português (Brasil) e inglês.

Checklist e medições em [docs/quality-checklist.md](docs/quality-checklist.md).

## Documentação

- [Regras](docs/village-flood-rules.md), com os pontos em aberto e o registro de decisões no fim
- [Especificação técnica](docs/village-flood-tech-spec.md)
- [Roadmap](docs/ROADMAP.md)
- [Checklist de acessibilidade e desempenho](docs/quality-checklist.md)
- [Relatórios de simulação](docs/simulation/)
- [Publicação na Cloudflare](docs/deploy.md)
- [Roteiro das partidas de teste](docs/playtests/README.md)
- [Mockups](docs/mockups/)

## Estrutura

Monorepo pnpm com arquitetura limpa: as dependências apontam para dentro, e o motor não depende de ninguém. O ESLint barra imports que quebram essa regra.

| Pasta               | Conteúdo                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `packages/engine`   | Motor de regras em TypeScript puro, sem I/O. Os números do jogo ficam em `packages/engine/data/` |
| `packages/protocol` | Mensagens e ações entre cliente e servidor, validadas com Zod                                    |
| `packages/kit`      | Salas, assentos, reconexão, pings e modo mesa, agnóstico de jogo                                 |
| `packages/bots`     | Bots (`botMove` e `suggest`), só com informação pública                                          |
| `packages/sim`      | Simulação em lote com bots                                                                       |
| `apps/web`          | Interface (Svelte 5 + Vite, PWA)                                                                 |
| `apps/server`       | Servidor de salas (Cloudflare Worker + um Durable Object por sala)                               |

## Requisitos

- Node.js 22.12 ou mais novo (o CI usa a versão do `.nvmrc`)
- pnpm, na versão do campo `packageManager` do `package.json`. O jeito mais simples é usar o Corepack:

```bash
corepack enable
```

## Comandos

```bash
pnpm install        # instala as dependências
pnpm test           # testes de unidade (Vitest)
pnpm lint           # ESLint e Prettier
pnpm typecheck      # TypeScript e svelte-check
pnpm build          # build da interface e do servidor
pnpm e2e            # testes E2E (Playwright + axe-core)
pnpm simulate       # simulação com bots (fora do pnpm test)
pnpm format         # formata o código com o Prettier
pnpm cf:deploy      # publica na Cloudflare (precisa de login na sua conta)
```

Antes do primeiro `pnpm e2e`, instale o navegador do Playwright:

```bash
pnpm --filter @village-flood/web exec playwright install chromium
```

## Jogar em casa

Para desenvolver (a página recarrega a cada mudança), rode a interface e, para online e mesa, o servidor de salas num segundo terminal. O site encaminha `/api` para o servidor (porta 8787):

```bash
pnpm --filter @village-flood/web dev
```

```bash
pnpm --filter @village-flood/server dev
```

Para testar com vários aparelhos na mesma rede Wi-Fi, gere o site e suba o servidor aberto para a rede. Ele serve o site e as salas na mesma porta:

```bash
pnpm --filter @village-flood/web build
```

```bash
pnpm --filter @village-flood/server exec wrangler dev --ip 0.0.0.0 --port 8787
```

Depois abra `http://IP-DO-COMPUTADOR:8787` em todos os aparelhos. Libere o acesso só para rede privada no firewall e feche o servidor ao terminar. Pela rede local, sem HTTPS, a instalação como app e o botão "Copiar link" não funcionam; o resto, sim.

Para testes, `?botDelay=0&seed=42` na URL faz os bots jogarem na hora e fixa a semente.

## Publicar

A cada merge na `main`, o GitHub Actions publica na Cloudflare sozinho, depois que todos os testes passam. A configuração, a publicação à mão, o domínio próprio e como voltar uma versão estão em [docs/deploy.md](docs/deploy.md).

## Segurança e privacidade

- O jogo guarda só apelidos: sem contas, analytics, rastreamento ou fontes externas. O QR code é gerado no próprio aparelho.
- O servidor é a única fonte da verdade e valida toda ação. O token de cada assento fica guardado só como hash (SHA-256); cada conexão tem limite de 40 mensagens por 10 s; a sala expira depois de 12 h sem atividade.
- O site é publicado com cabeçalhos de segurança: só aceita arquivos e conexões do próprio endereço, não pode ser incorporado em outros sites e não envia o endereço de origem.
- Nenhum segredo no repositório. O arquivo `.env.example` tem só valores fictícios.
- O pnpm só instala versões publicadas há pelo menos 1 dia e só deixa o `esbuild` e o `workerd` rodarem scripts de instalação. O CI roda com permissão só de leitura e usa actions fixadas pelo SHA do commit.

## Contribuição

A `main` é a versão publicada. Cada tarefa é feita numa branch `develop/nome-da-tarefa`, e o CI roda lint, tipos, testes, build e E2E a cada envio. Os commits são em português, no imperativo.

## Originalidade

Nome, arte, textos e sons são originais. Os sons são sintetizados no navegador, sem arquivos de áudio.
