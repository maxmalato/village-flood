# CLAUDE.md

Instruções para o Claude Code neste repositório. Leia antes de qualquer tarefa.

## O projeto

Enchente na Vila (`village-flood`): jogo de tabuleiro **cooperativo** para o navegador, de 2 a 4 assentos (pessoas ou bots). Uma chuva forte faz o rio subir. A equipe leva os moradores até a igreja e depois todos os voluntários embarcam no cais. Modos: um aparelho, vários aparelhos (sala privada por código e senha) e mesa (tabuleiro na TV ou notebook, celulares como controle). Roda em celular, tablet, desktop e Smart TV com navegador, como PWA.

- Regras: `docs/village-flood-rules.md`.
- Especificação técnica: `docs/village-flood-tech-spec.md`.
- Situação das etapas: `docs/ROADMAP.md`. Confira antes de começar e atualize ao começar ou fechar uma etapa.
- Mockups: `docs/mockups/` (código-fonte das telas em `docs/mockups/source/`, como referência de layout, cores e textos; os arquivos `.dc.html` não abrem sozinhos no navegador, e as imagens exportadas ficam em `docs/mockups/`).
- Logo e ícones: `assets/logo/`.
- Decisões: registro no fim de `docs/village-flood-rules.md`, na seção "Registro de decisões". Decisão nova entra no topo, com data e motivo. **(a seção ainda precisa ser criada na primeira tarefa)**

Ordem de leitura: regras, especificação técnica, roadmap.

## Valores e regras ainda em teste

Todo valor marcado **(inicial)** e toda regra marcada **(a testar)** nos documentos é hipótese e **pode mudar**. Por isso:

- Nenhum desses valores fica fixo no código. Mapa, baralho de chuva, dificuldades e `RoleParams` ficam em arquivos de dados validados por schema (spec, seção 6).
- Antes de mudar um valor, rode a simulação e registre o resultado. Mudança de valor é mudança em dados, não em código.
- Se um documento estiver ambíguo ou duas regras se contradisserem, **não invente**: pergunte ao dono do projeto ou registre em "Pontos em aberto" (regras, seção 13).

## Idioma

| Item | Idioma |
| --- | --- |
| Pastas, arquivos, nomes no código, ações, eventos, chaves do JSON, branches | Inglês |
| Documentos em `docs/`, comentários no código | PT-BR |
| Textos do jogo (interface) | PT-BR e inglês (i18n desde o início) |
| README | **Duas versões, obrigatórias:** `README.md` (PT-BR) e `README.en.md` (inglês), com link de uma para a outra e conteúdo equivalente. Crie as duas na Etapa 0 e mantenha as duas atualizadas a cada etapa. Mudou uma, mude a outra na mesma tarefa. |
| Mensagens de commit | PT-BR no imperativo ("Adiciona cálculo do nível do rio") |

Respostas ao dono do projeto em PT-BR.

## Arquitetura (resumo da spec)

Arquitetura limpa: dependências apontam para dentro (UI e servidor dependem do motor; o motor não depende de ninguém).

- `packages/engine`: motor de regras em TypeScript puro. `transition(state, action, ctx)` é pura e devolve `{ ok, state, events, reason }`. Sem APIs de navegador ou da Cloudflare, sem I/O. Aleatoriedade só pelo gerador com semente guardada no estado. O cálculo da água fica atrás da interface `WaterModel`.
- `packages/protocol`: tipos das mensagens cliente/servidor.
- `packages/kit`: salas, assentos, reconexão, limites e modo mesa, **agnóstico de jogo** (só conhece `GameDefinition`). Extraído do `senhorio-web`.
- `packages/bots`: `botMove` e `suggest`, funções puras, só informação pública.
- `packages/sim`: simulação em lote (fora do `pnpm test`).
- `apps/web`: Svelte 5 + Vite + PWA. Só desenha o estado, envia ações e anima eventos. Nunca calcula regra.
- `apps/server`: Cloudflare Worker + um Durable Object por sala. Roda o mesmo motor e valida quem envia cada ação.
- Tabuleiro em HTML/SVG, sem engine 3D.

## Comandos

```bash
pnpm install
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm e2e
pnpm --filter @village-flood/sim simulate   # simulação com bots (fora do pnpm test)
```

(Ajuste os nomes dos pacotes na Etapa 0.)

## Regras de trabalho

- **Siga a documentação oficial** de cada tecnologia (Svelte 5, Vite, vite-plugin-pwa, Cloudflare Workers/Durable Objects, Vitest, Playwright). Evite soluções obsoletas ou depreciadas.
- **Confirme a stack** com o dono do projeto antes de iniciar a Etapa 0 (a spec propõe a mesma do Senhorio Web).
- **Testes obrigatórios.** Toda mudança no motor vem com teste (Vitest). Propriedades com fast-check (conservação de moradores, nível nunca diminui, `recompute` idempotente, mesma semente gera o mesmo resultado, `transition` nunca muta a entrada). Rode `pnpm lint`, `pnpm typecheck` e `pnpm test` antes de cada commit. Etapa com teste falhando não fecha.
- **Motor e bots primeiro.** Não comece a interface antes de a Etapa 2 (simulação) fechar. Os números abertos são calibrados ali, quando mudar custa pouco.
- **Branches:** a `main` é a versão publicada. Nunca commite direto na `main`. Toda tarefa nova começa numa branch criada a partir da `main` atualizada, com o nome `develop/nome-da-tarefa` (minúsculas e hífens, em inglês). Envie a branch para o GitHub, onde o CI roda os testes sem publicar. O dono do projeto testa e faz o merge; não faça merge nem abra pull request sem pedido.
- **Commits pequenos** por funcionalidade, em PT-BR no imperativo; uma tag por etapa (ver roadmap).
- **Tags e releases são criadas manualmente pelo dono do projeto.** Ao fechar uma etapa, avise e passe o passo a passo: nome da tag, commit (hash curto), título e descrição sugeridos, e o caminho no GitHub (Releases → Draft a new release).
- **Dois computadores:** o GitHub é a única fonte da verdade. No início da sessão, confira se a cópia local está atualizada (`git pull`); ao terminar, deixe tudo commitado e enviado.
- **Dependências:** só bibliotecas conhecidas e mantidas; ferramentas de teste e build como dependências de desenvolvimento. Peça aprovação antes de adicionar dependência de produção nova.
- **Originalidade:** nome, arte, textos e sons são originais. Nada copiado de outros jogos. Mantenha o mesmo padrão do Senhorio.

## Segurança e privacidade

- Nenhum segredo no repositório (chaves, tokens, senhas, IDs de conta da Cloudflare). Credenciais só no painel da Cloudflare, no `wrangler secret` ou nos segredos do GitHub Actions. Mantenha um `.env.example` só com valores fictícios.
- O servidor é a única fonte da verdade: valida `actorsOf` e toda ação antes de aplicar. O cliente nunca é confiável.
- Token de assento guardado apenas como hash (SHA-256). Limite de 40 mensagens por 10 s por conexão. Sala expira em 12 h.
- Princípio do menor privilégio em permissões, tokens e acessos.
- O jogo guarda só apelidos; sem contas, analytics ou rastreamento (LGPD). Nada de dado pessoal em logs.
- Exemplos e testes com dados fictícios (nomes sugeridos: Ana, Bruno, Carla, Diego, Elisa, Fábio).

## Qualidade e acessibilidade

- Estados da água sem depender só de cor (número de altura, ondas, hachura). Marcas das casas com formas diferentes (✓ e ✗).
- Alvos de toque de pelo menos 44 px, contraste mínimo 4,5:1, foco visível, rótulos por quadra, eventos em `aria-live`, `prefers-reduced-motion` respeitado.
- axe-core em todas as telas, nos temas claro e escuro.
- Teste em aparelho real: celular, tablet e navegador de Smart TV antes de fechar a etapa de mesa.
