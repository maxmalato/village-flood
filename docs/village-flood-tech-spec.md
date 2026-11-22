# Enchente na Vila (`village-flood`): especificação técnica para o Claude Code

Pré-requisito: ler `docs/village-flood-rules.md`. Este documento é a base para implementar a v1. Nomes de código em inglês. A stack é uma proposta que reaproveita a do Senhorio Web (https://github.com/maxmalato/senhorio-web); confirmar antes de iniciar. Siga as documentações oficiais de cada tecnologia, arquitetura limpa e segurança por padrão.

Regras marcadas como **(a testar)** no documento de regras são hipóteses e podem mudar. Por isso, os parâmetros delas devem ficar em dados de configuração (seção 6), nunca fixos no código.

## 1. Objetivos e fora de escopo (v1)

Objetivos: jogo cooperativo para 2 a 4 assentos (pessoas ou bots), nos modos um aparelho, online (salas) e mesa, como PWA para celular, tablet, desktop e navegador de Smart TV.

Fora de escopo da v1: contas de usuário, ranking global, chat, modelo de água B (v2, seção 12), mais de um mapa.

## 2. Stack proposta

TypeScript, Svelte 5, Vite, `vite-plugin-pwa` (Workbox), pnpm monorepo, Vitest, fast-check, Playwright, axe-core, Cloudflare Workers com um Durable Object por sala (armazenamento SQLite, WebSocket). Sem engine 3D: o tabuleiro é HTML/SVG.

## 3. Estrutura sugerida

```
apps/web            Svelte 5 PWA (UI, modos local, online e mesa)
apps/server         Worker + Durable Object (sala)
packages/engine     regras puras do village-flood (sem I/O)
packages/protocol   tipos de mensagem cliente/servidor
packages/kit        salas, assentos, reconexão, limites, modo mesa (agnóstico de jogo)
packages/bots       botMove e suggest
packages/sim        CLI de simulação em lote
```

`packages/kit` deve ser extraído do senhorio-web (ciclo de vida da sala, token de assento com hash, limite de mensagens, expiração, modo mesa). Ele conhece o jogo só por uma interface:

```ts
interface GameDefinition<State, Action, Event, Config> {
  id: string
  newGame(config: Config, seed: number): State
  transition(state: State, action: Action, ctx: Ctx): Result<State, Event>
  actorsOf(state: State): SeatId[]
  viewFor(state: State, seat: SeatId | 'table'): unknown // identidade neste jogo
  botMove(state: State, seat: SeatId): Action
}
```

## 4. Domínio (`packages/engine`)

```ts
type Difficulty = 'easy' | 'normal' | 'storm'
type RoleId = 'firefighter' | 'boat-pilot' | 'engineer' | 'medic' | 'radio-host' | 'neighbor'
type WaterState = 'dry' | 'flooded' | 'submerged'
type ResidentStatus = 'healthy' | 'injured' | 'stranded' | 'safe'
type TileKind = 'plain' | 'house' | 'church' | 'dock'
type HouseMark = 'cleared' | 'lost'   // derivada, nunca guardada no estado

interface Tile { id: string; x: number; y: number; height: 1 | 2 | 3; kind: TileKind; sandbags: 0 | 1 | 2; water: WaterState }
interface Resident { id: string; homeTileId: string; tileId: string | null; carriedBy: SeatId | null; status: ResidentStatus }
interface Volunteer { seat: SeatId; role: RoleId; tileId: string; carrying: string[]; actionsLeft: number; skipNextTurn: boolean }

interface GameState {
  rng: number               // estado serializável do PRNG (ex.: mulberry32)
  difficulty: Difficulty
  tiles: Tile[]; residents: Resident[]; volunteers: Volunteer[]
  riverLevel: number; maxRiverLevel: 24
  rainDeck: RainCardKind[]; rainDiscard: RainCardKind[]
  goal: number
  turn: number; activeSeat: SeatId
  turnHistory: Snapshot[]   // só do turno atual, para undo
  phase: 'playing' | 'won' | 'lost'
  lossReason?: 'stranded' | 'level'
}
```

> **Tipos finais:** a proposta aprovada em `docs/engine-data-proposal.md` (20/11/2026) atualiza esta seção: `config` dentro do estado (no lugar de `difficulty`, `goal` e `maxRiverLevel`), `stormWarning`, `lossReason: 'swept'` e os tipos `SeatId`, `Ctx`, `Result` e `Snapshot`. Vale a proposta.

`homeTileId` é a casa de origem do morador e nunca muda. Ele serve para derivar as marcas das casas (seção 5).

Ações (união discriminada): `move`, `pick-up`, `heal`, `reinforce`, `forecast`, `radio-call`, `undo`, `end-turn`.

Eventos (para UI, som e log; `bot-took-over` e `player-returned` são emitidos pelo servidor, não pelo motor; o motor também emite `forecast-revealed`, `radio-called`, `action-undone` e `turn-ended`): `moved`, `picked-up`, `delivered`, `healed`, `sandbag-placed`, `rain-drawn`, `level-rose`, `tile-flooded`, `tile-submerged`, `tile-dried`, `resident-injured`, `resident-stranded`, `volunteer-swept`, `turn-skipped`, `turn-started`, `bot-took-over`, `player-returned`, `won`, `lost`.

Contrato: `transition(state, action, ctx)` é pura e devolve `{ ok, state, events, reason }`. Nunca muta o estado de entrada. `ctx` traz o assento que age e nada externo (sem relógio). Os tipos `SeatId`, `Snapshot`, `Ctx` e `Result` são propostos e aprovados no início da Etapa 1. Toda validação acontece aqui e no servidor; o cliente nunca é confiável.

## 5. Regras como funções

- `waterModel.recompute(tiles, level): Tile[]` implementa o modelo A: limiares `flood = 5 + 7*(h-1) + 3*sandbags` e `submerge = flood + 7` (para h=1 isso dá 5 e 12; para h=2, 12 e 19; para h=3, 19 e 26), mais a regra de ligação com o rio por busca em largura a partir da coluna A, só pelas 4 vizinhas ortogonais. Igreja e cais nunca molham e não passam a água adiante. Isolar atrás de uma interface `WaterModel` para a v2.
- `applyTransitions(before, after)`: só transições para um estado mais molhado têm efeito. dry→flooded fere moradores saudáveis da quadra; →submerged torna moradores da quadra ilhados. Moradores carregados são ignorados. Nada reverte quando a quadra seca: ferido continua ferido e ilhado continua ilhado. Morador curado numa quadra alagada fica saudável até a próxima transição para um estado mais molhado.
- `moveCost(state, volunteer, tile)`: seca 1, alagada 2 (Bombeiro 1), submersa proibida (Barqueira 1). Vizinha anda na diagonal. **(a testar)** A Barqueira paga `+carryMoveSurcharge` (inicial: 1) por passo enquanto `carrying.length === 2`.
- `pickUpCost(state, volunteer, resident)`: 1 para morador saudável; 2 para ferido. O Bombeiro paga `firefighterInjuredPickUpCost` (2 desde 20/11/2026) e a Médica paga `medicInjuredPickUpCost` (1). Curar custa `medicHealCost` (0). **(a testar com pessoas)**
- `radio-call` (Radialista, uma vez por turno, custo `radioCallCost`): o próximo assento na ordem ganha `radioCallBonus` ações extras (`bonusActions`) no próximo turno dele; o bônus se perde se esse turno for perdido. Pode ser desfeito.
- `endTurn`: compra a carta de chuva (reembaralha o descarte se vazio), sobe o nível, recalcula, aplica transições, chama `sweepVolunteers`, verifica `checkOutcome` e passa a vez.
- `sweepVolunteers`: **(a testar)** para cada voluntário, exceto a Barqueira, em quadra submersa após a chuva: move ao cais, marca `skipNextTurn = true`, os moradores carregados viram `stranded` (e contam para o limite de 4) e emite `volunteer-swept`. Deve rodar antes de `checkOutcome`, porque os moradores ilhados dessa forma podem causar a derrota.
- Ao iniciar o turno de um voluntário com `skipNextTurn`, o engine emite `turn-skipped`, zera a marca, não concede ações, mas ainda compra a carta de chuva e passa a vez (hipótese: a água não espera).
- `checkOutcome`: vitória se `safe >= goal` e todos os voluntários no cais; derrota por 4 ilhados ou nível ≥ 24. Não existe mais derrota por voluntário sem saída. Só o cais entra na condição de vitória: a igreja apenas recebe moradores (eles ficam `safe` e não precisam ir ao cais).
- Entrar na igreja entrega os moradores carregados, sem custo.
- `houseMark(state, tileId): HouseMark | null` (função pura, derivada): para uma quadra `house`, considera os moradores com `homeTileId === tileId`. Se algum ainda está na quadra com status `healthy` ou `injured` e sem `carriedBy`, devolve `null` (a casa ainda tem morador). Caso contrário, devolve `'lost'` se algum deles estiver `stranded`, ou `'cleared'` se todos estiverem `safe` ou sendo carregados. Para quadras que não são casa, devolve `null`. Como `stranded` não aparece na quadra, `sweepVolunteers` muda a marca da casa de origem para `'lost'` quando ilha moradores carregados.
- `undo` restaura o snapshot do turno. Não desfaz `forecast`: usar `forecast` limpa o `turnHistory`, então o desfazer só alcança as ações feitas depois dele. O histórico também é limpo em `end-turn`.

## 6. Dados de configuração

Mapa e baralhos como dados (JSON validado por schema), não no código: alturas, igreja, cais, casas, se o mapa pode ser espelhado (`allowMirror`), cenários de moradores extras por dificuldade (`extraResidentScenarios`) e tabela de dificuldades (valores da seção 9 do documento de regras, todos **iniciais**). `newGame` sorteia o cenário e o espelhamento pela semente (ou recebe `variation` fixa, em testes e na simulação) e guarda a escolha em `config.variation`.

Todos os números do jogo ficam nos dados: 3 ações por turno, nível máximo 24, limite de 4 ilhados, limiares por altura, sacos de areia (bônus e máximo) e custos (andar, pegar, saco de areia, alerta). Só a estrutura das regras fica no código. O schema completo é aprovado pelo dono do projeto no início da Etapa 1, antes de implementar.

Os parâmetros de papéis também ficam em dados, para ajustar sem mudar o código:

```ts
interface RoleParams {
  boatPilotCarryCapacity: number        // inicial: 2
  carryMoveSurcharge: number            // inicial: 1 (custo extra por passo com 2 moradores)
  firefighterInjuredPickUpCost: number  // 2 (era 1 até 20/11/2026)
  sweptSkipsNextTurn: boolean           // inicial: true
  sweptDrawsRainOnSkippedTurn: boolean  // inicial: true
  immediateLossOnSwept: Difficulty[]    // inicial: [] (derrota imediata só nas dificuldades listadas)
}
```

Lista completa e valores atuais: `packages/engine/data/rules.json` (schema em `packages/engine/src/schema.ts`). Desde 20/11/2026 inclui também `medicHealCost` (0), `medicInjuredPickUpCost` (1), `radioCallCost` (1) e `radioCallBonus`.

## 7. Protocolo e salas

- Reaproveitar o protocolo do Senhorio: código de sala de 6 caracteres (sem senha, decisão de 22/11/2026), token de assento guardado como hash SHA-256, limite de 40 mensagens por 10 s, expiração de 12 h, modo mesa (assento de mesa).
- Mensagens novas: `ping`/`unping` (sugestão efêmera, fora do estado do jogo, com limite de 3 por jogador e limpeza ao fim do turno) e `resync` (o servidor envia o estado completo; a reconexão já recebe a sala inteira).
- Implementado na Etapa 4: `POST /api/rooms` cria a sala (`{ config: { difficulty } }` → `{ code }`), `GET /api/rooms/CODIGO` mostra o resumo e `/api/rooms/CODIGO/ws` abre o WebSocket. Mensagens do cliente: `hello` (apelido ou token), `profile`, `config`, `add-bot`, `remove-seat`, `start`, `action`, `ping`, `unping`, `resync`, `again`, `leave`. Do servidor: `welcome` (assento e token, só para quem entrou), `room`, `update` (sala + eventos), `notice` (queda, bot assumiu, volta) e `error` (código; recusa do motor vem como `refused` com o motivo). Tipos em `packages/kit/src/messages.ts` e `packages/protocol`.
- O navegador guarda só `{ code, token }` (chave `village-flood:room`) para voltar ao assento; o link de convite é `?sala=CODIGO`. Bots do lobby recebem nomes neutros ("Bot 1", "Bot 2").
- Modo mesa (Etapa 5): `POST /api/rooms` com `table: true` devolve também `tableToken`; a TV entra com `hello { token }` e recebe `welcome { seat: 'table' }`. A mesa só pode mandar `hello`, `resync` e `table-overlay` (`overlay: 'legend' | null`), que qualquer pessoa conectada também pode mandar para abrir ou fechar a legenda na TV. A visão da sala traz `table: { connected, overlay } | null`. Quem comanda é a primeira pessoa que entra pelo celular.
- PWA: `vite-plugin-pwa` (generateSW) com o registro por script gerado (sem `workbox-window` no pacote do jogo), `clientsClaim` e `skipWaiting`; `/api/*` fica fora do fallback de navegação. Os arquivos públicos (ícones e logo) vêm de `assets/logo/`.
- Prazos (`TAKEOVER_MS`, `BOT_STEP_MS`) vêm de variáveis do Worker (`wrangler.jsonc`), para os testes usarem prazos curtos.
- O servidor é a única fonte da verdade e valida `actorsOf` antes de aplicar qualquer ação.
- Sem contas: apenas apelido. Nada de dado pessoal em logs.

## 8. Desconexão e bots

Máquina de estados por assento humano: `connected` → `away` (soquete caiu) → `bot` (após cerca de 20 s se for a vez dele, ou ao chegar o turno dele) → `returning` (voltou, aguardando o próprio turno) → `connected` (no início do turno dele). Quem volta ainda em `away` (antes de o bot entrar) volta na hora.

- Eventos `bot-took-over` e `player-returned` alimentam o aviso para a equipe.
- O assento não é removido por inatividade. A sala expira pela regra normal.
- `botMove(state, seat)`: usa apenas informação pública. Busca em profundidade limitada a 3 ações, com função de avaliação (moradores salvos, risco da quadra e do voluntário de ser apanhado pela água, distância ao próximo morador por BFS, uso da habilidade). Orçamento de tempo de cerca de 50 ms por jogada. Determinística para o mesmo estado.
- `suggest(state, seat)`: mesma lógica, exibida como dica ao jogador.
- O bot roda no servidor (online) ou no cliente (local), sempre a mesma função pura.

## 9. UI (Svelte 5)

Telas: início (criar sala, entrar, jogar local), lobby (papéis, bots, dificuldade), jogo no celular, jogo na mesa (TV), legenda completa (mesa e celular), fim de partida.

Requisitos do tabuleiro: quadras tocáveis de pelo menos 44 px (6 colunas em 390 px dá cerca de 58 px), altura em número em cada quadra, ondas para alagada e ondas com hachura para submersa, ícones de casa, igreja, cais, moradores (com marca de ferido), sacos de areia e peões com iniciais. Destacar quadras alcançáveis com o custo (incluindo o custo extra da Barqueira com 2 moradores). Painel de ação mostrando ações restantes e botão "Encerrar turno". Desfazer sempre visível. Barra de nível do rio com os limiares. Previsão (quando houver Radialista). Ping nos turnos dos outros. Aviso e tela de volta para desconexão. Aviso claro quando um voluntário for apanhado pela água e perder o próximo turno. Eventos anunciados em `aria-live`. `prefers-reduced-motion` respeitado. Textos em PT-BR e EN.

**Marcas nas casas:** o componente da quadra recebe `houseMark(state, tileId)` e desenha, no canto inferior direito, um círculo branco de 24 px (18 px no celular) com "✓" verde (`cleared`) ou "✗" vermelho (`lost`). A forma diferencia as marcas, e a cor só reforça. O rótulo de acessibilidade da quadra inclui "casa vazia, todos retirados" ou "casa vazia, algum morador ficou ilhado". A marca ocupa o mesmo canto do número de feridos, mas nunca aparecem juntas, porque a marca só existe quando a casa não tem mais morador.

**Legenda:**
- Componente `QuickLegend` (painel da mesa): as três amostras de quadra (seca, alagada, submersa), "Igreja: abrigo", "Cais: saída" e o botão "Ver legenda completa".
- Componente `Legend` (tela cheia, mesa e celular): lista de itens vinda de dados (`legendItems`), agrupada em Quadras, Lugares e Pessoas e avisos, com a frase "Como ler o mapa: o número no canto de cada quadra é a altura dela." no topo. Na mesa usa 3 colunas; no celular, uma coluna com rolagem se precisar. A mesma lista alimenta as duas telas, para não divergir. As amostras de quadra usam os mesmos estilos do tabuleiro (fonte única de verdade).
- Botão "Legenda" no cabeçalho de todas as telas de jogo, com alvo de toque de pelo menos 44 px. Fecha com "Fechar" ou "Voltar ao jogo" e devolve o foco ao botão que abriu. A legenda é só leitura e não altera o estado do jogo.
- Em aberto (seção 13 do documento de regras): como abrir a legenda completa na TV sem toque.

**Mockups:** as telas de referência estão em `docs/mockups/` (imagens exportadas) e o código-fonte delas em `docs/mockups/source/` (cores, medidas e textos). Paleta usada: fundo `#0E2433`, painéis `#16364A`, creme `#F3EBD8`, dourado `#F2B84B`, tinta `#10263B`, água `#4DA3D9` e `#2A6AA3`; fontes Fredoka (títulos) e Nunito (texto).

## 10. Testes

- **Unidade:** tabela de limiares por altura e sacos de areia, ligação com o rio (morro protegido), custos de movimento por papel (incluindo +1 da Barqueira com 2 moradores), custo de pegar ferido (2, ou 1 para o Bombeiro), transições de ferido e ilhado, entrega automática, voluntário apanhado pela água (vai ao cais, perde o turno, moradores carregados ilhados, Barqueira imune), condições de vitória e derrota (o cais é exigido, a igreja não encerra a partida) e `houseMark` (casa com morador sem marca; casa com todos retirados `cleared`; casa com ilhado `lost`; casa com 2 moradores, um salvo e um esperando, sem marca; marca vira `lost` quando um voluntário apanhado ilha morador carregado).
- **Propriedades (fast-check):** conservação de moradores (no mapa + carregados + salvos + ilhados = total, inclusive após `sweepVolunteers`); nível nunca diminui; `recompute` é idempotente; mesma semente e mesmas ações geram o mesmo resultado; `transition` nunca muta a entrada; nenhuma ação válida deixa o estado inconsistente; `houseMark` nunca devolve marca para casa com morador esperando.
- **Simulação (`packages/sim`):** milhares de partidas por dificuldade × tamanho da equipe × composição de papéis, medindo taxa de vitória, duração, causa de derrota, ilhados e quantos voluntários foram apanhados. Registrar também quantos turnos sobram quando a equipe vence (para saber se a igreja como porto seguro deixa o jogo fácil, ponto 10 da seção 13 do documento de regras). Relatório em tabela. Metas na seção 9 do documento de regras.
- **Equilíbrio de papéis (a testar):** comparar a taxa de vitória entre composições (com e sem Barqueira, com e sem Bombeiro). Critério inicial: no máximo 10 pontos de diferença entre composições. Os resultados podem levar a mudar `RoleParams`, passar a capacidade 2 para a Vizinha ou voltar a derrota imediata só na Tempestade.
- **E2E (Playwright):** criar sala, entrar, jogar um turno, desfazer, ping, desconexão com bot assumindo e volta do jogador, modo mesa, abrir e fechar a legenda completa.
- **Acessibilidade (axe-core):** em todas as telas (incluindo a legenda), nos temas claro e escuro.

## 11. Segurança e privacidade

Princípio do menor privilégio. Validar toda ação no servidor. Token de assento só como hash. Limites de frequência por conexão. Sem dados pessoais (apelido apenas) e sem credenciais no repositório (variáveis de ambiente para segredos). Em exemplos e testes, usar apenas dados fictícios. Considerar a LGPD: sem coleta além do apelido, sem rastreadores.

## 12. Extra da v2: modelo de água B

Interface `WaterModel` com duas implementações: `river-level` (v1) e `flowing-rain` (v2: cartas com intensidade e região, água cai em quadras sorteadas da região e escorre para vizinhas de altura igual ou menor, só se ativa na Tempestade). Nenhum outro módulo deve depender do modelo concreto.

## 13. Marcos sugeridos

Veja `docs/ROADMAP.md`, que detalha as etapas, o critério de "pronto" de cada uma e a ordem recomendada (motor, bots e simulação antes das telas).
