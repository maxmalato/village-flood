# Enchente na Vila

[English version](README.en.md)

Jogo de tabuleiro **cooperativo** para o navegador, de 2 a 4 assentos (pessoas ou bots). Uma chuva forte faz o rio subir: a equipe leva os moradores até a igreja e, no fim, todos os voluntários embarcam no cais. A equipe ganha ou perde junta.

Modos previstos: um aparelho, vários aparelhos (sala privada com código e senha) e mesa (tabuleiro na TV ou notebook, celulares como controle). Roda como PWA em celular, tablet, desktop e Smart TV.

> **Situação:** em desenvolvimento. Etapas 0 (fundação), 1 (motor de regras) e 2 (bots e simulação) prontas; a próxima é a Etapa 3 (telas). Ainda não há telas do jogo. Os números do jogo foram calibrados com simulação (ver [docs/simulation](docs/simulation/)). Veja o [roadmap](docs/ROADMAP.md).

## Documentação

- [Regras](docs/village-flood-rules.md), com o registro de decisões no fim
- [Especificação técnica](docs/village-flood-tech-spec.md)
- [Roadmap](docs/ROADMAP.md)
- [Mockups](docs/mockups/)

## Estrutura

Monorepo pnpm com arquitetura limpa: as dependências apontam para dentro, e o motor não depende de ninguém. O ESLint barra imports que quebram essa regra.

| Pasta               | Conteúdo                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `packages/engine`   | Motor de regras em TypeScript puro, sem I/O. Os números do jogo ficam em `packages/engine/data/` |
| `packages/protocol` | Tipos das mensagens entre cliente e servidor                                                     |
| `packages/kit`      | Salas, assentos, reconexão e modo mesa, agnóstico de jogo                                        |
| `packages/bots`     | Bots (`botMove` e `suggest`)                                                                     |
| `packages/sim`      | Simulação em lote com bots                                                                       |
| `apps/web`          | Interface (Svelte 5 + Vite, PWA)                                                                 |
| `apps/server`       | Servidor de salas (Cloudflare Worker + Durable Object)                                           |

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
```

Antes do primeiro `pnpm e2e`, instale o navegador do Playwright:

```bash
pnpm --filter @village-flood/web exec playwright install chromium
```

Para rodar a interface em modo de desenvolvimento:

```bash
pnpm --filter @village-flood/web dev
```

## Segurança e privacidade

- Nenhum segredo no repositório. O arquivo `.env.example` tem só valores fictícios.
- O jogo guarda só apelidos: sem contas, analytics ou rastreamento.
- O pnpm só instala versões publicadas há pelo menos 1 dia e só deixa o `esbuild` e o `workerd` rodarem scripts de instalação. O CI roda com permissão só de leitura e usa actions fixadas pelo SHA do commit.

## Contribuição

A `main` é a versão publicada. Cada tarefa é feita numa branch `develop/nome-da-tarefa`, e o CI roda lint, tipos, testes, build e E2E a cada envio. Os commits são em português, no imperativo.

## Originalidade

Nome, arte, textos e sons são originais.
