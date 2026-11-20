# Etapa 1: proposta dos dados e dos tipos do motor

Status: **aprovada em 20/11/2026 e implementada** em `packages/engine`. É a referência dos dados e dos tipos do motor; as decisões estão no "Registro de decisões" das regras.

Notas da implementação:

- No estado, `config` tem `difficulty`, `mapId`, `rules` e `settings` (as configurações da dificuldade).
- Os eventos `bot-took-over` e `player-returned` da especificação não são do motor: dependem da conexão e serão emitidos pelo servidor (Etapa 4).
- Vitória e derrota por ilhados nunca acontecem juntas, por causa da validação 5 (moradores = meta + 3). O conflito real é vitória junto com derrota por nível, e aí vale a derrota.
- Validar os dados ao carregar o motor soma o Zod ao app web (cerca de 26 KB comprimidos). Se pesar na Smart TV (Etapa 5), avaliar `zod/mini`.

Objetivo: cumprir a decisão de 20/11/2026 ("todos os números do jogo ficam nos dados; só a estrutura das regras fica no código") e definir os tipos `SeatId`, `Snapshot`, `Ctx` e `Result`.

## 1. Onde fica cada coisa

| O quê | Onde | Exemplo |
| --- | --- | --- |
| Números do jogo (custos, limites, limiares, baralhos, metas) | Dados (JSON validado por schema) | "andar em quadra alagada custa 2" |
| Estrutura das regras | Código do motor | "só a Barqueira entra em quadra submersa", "a Vizinha anda na diagonal", "o Engenheiro pode pôr saco em quadra vizinha" |
| Mapa | Dados | alturas, igreja, cais, casas, ordem dos moradores extras |

Arquivos em `packages/engine/data/`:

- `rules.json`: regras gerais, água, custos e `RoleParams`.
- `difficulties.json`: Tranquilo, Normal e Tempestade.
- `maps/village-river.json`: mapa "Vila do Rio".

Os três passam pelo schema quando o jogo é criado. Um teste no CI valida os arquivos do repositório, e a simulação (Etapa 2) pode carregar versões alternativas para calibrar sem mexer no código.

## 2. `rules.json`

```jsonc
{
  "version": 1,
  "seats": { "min": 2, "max": 4 },
  "actionsPerTurn": 3,
  "maxRiverLevel": 24,          // chegou a este nível: derrota
  "strandedLossCount": 4,       // este número de ilhados: derrota
  "water": {
    "thresholds": {             // por altura: alaga a partir de / submerge a partir de
      "1": { "flood": 5,  "submerge": 12 },
      "2": { "flood": 12, "submerge": 19 },
      "3": { "flood": 19, "submerge": 26 }
    },
    "sandbagBonus": 3,          // soma aos dois limiares, por saco
    "maxSandbagsPerTile": 2
  },
  "rainCards": { "cloudy": 0, "drizzle": 1, "rain": 2, "storm": 3 },
  "costs": {
    "move": { "dry": 1, "flooded": 2 },        // submersa: proibida (estrutura, no código)
    "pickUp": { "healthy": 1, "injured": 2 },
    "reinforce": 2
  },
  "roleParams": {
    "defaultCarryCapacity": 1,
    "firefighterFloodedMoveCost": 1,
    "firefighterInjuredPickUpCost": 1,         // (a testar)
    "boatPilotSubmergedMoveCost": 1,
    "boatPilotCarryCapacity": 2,               // (a testar)
    "carryMoveSurcharge": 1,                   // (a testar) custo extra por passo...
    "carrySurchargeFromCarried": 2,            // ...a partir de quantos moradores carregados
    "engineerReinforceCost": 1,
    "medicHealCost": 1,
    "sweptSkipsNextTurn": true,                // (a testar)
    "sweptDrawsRainOnSkippedTurn": true,       // (a testar)
    "immediateLossOnSwept": []                 // (a testar) dificuldades com derrota imediata
  }
}
```

Os limiares ficam como tabela por altura, e não como fórmula (`5 + 7*(h-1)`), para cada altura poder ser calibrada sozinha.

## 3. `difficulties.json`

```jsonc
{
  "easy": {
    "goal": 8,
    "extraResidents": 1,
    "startLevel": 0,
    "deck": { "cloudy": 12, "drizzle": 8, "rain": 4, "storm": 1 },
    "forecast": { "kind": "peek", "cards": 2, "cost": 0 }
  },
  "normal": {
    "goal": 10,
    "extraResidents": 3,
    "startLevel": 0,
    "deck": { "cloudy": 8, "drizzle": 8, "rain": 6, "storm": 3 },
    "forecast": { "kind": "peek", "cards": 1, "cost": 0 }
  },
  "storm": {
    "goal": 12,
    "extraResidents": 5,
    "startLevel": 4,
    "deck": { "cloudy": 4, "drizzle": 8, "rain": 8, "storm": 5 },
    "forecast": { "kind": "storm-warning", "cards": 1, "cost": 1 }
  }
}
```

- `peek`: a previsão é pública e gratuita, sem ação (as próximas `cards` cartas aparecem para todos).
- `storm-warning`: a Radialista usa a ação `forecast` (custo `cost`) e todos veem se há Temporal nas próximas `cards` cartas (sim ou não).
- Sem Radialista na equipe, não há previsão em nenhuma dificuldade (estrutura, no código).

## 4. `maps/village-river.json`

```jsonc
{
  "id": "village-river",
  "columns": 6,
  "rows": 6,
  "heights": [                  // linha 1 a 6, colunas A a F
    [1, 1, 2, 2, 1, 1],
    [1, 2, 2, 3, 2, 1],
    [1, 2, 3, 3, 2, 1],
    [1, 2, 3, 2, 2, 1],
    [1, 1, 2, 2, 1, 1],
    [1, 1, 1, 1, 1, 1]
  ],
  "church": "D3",
  "dock": "B3",
  "houses": ["A2", "A4", "B1", "B5", "F3", "E5", "C2", "C5", "E2", "E4"],
  "residentsPerHouse": 1,
  "extraResidentOrder": ["A4", "B5", "F3", "E5", "C5"]
}
```

Fica no código (estrutura): o rio encosta na coluna A, a vizinhança é ortogonal e os voluntários começam no cais.

## 5. Validações do schema

Além dos tipos e faixas de cada campo (inteiros, não negativos, alturas de 1 a 3):

1. Igreja, cais e casas existem no mapa e são quadras diferentes. A igreja e o cais não são casas.
2. `extraResidentOrder` só tem casas, e cada `extraResidents` cabe nela.
3. O baralho de cada dificuldade soma pelo menos 1 carta.
4. Em cada altura, `flood < submerge`.
5. **Coerência da derrota por ilhados:** moradores no mapa = `goal + strandedLossCount - 1` (regras, seção 6: "o 4º ilhado torna a meta impossível"). Hoje: 11 = 8 + 3, 13 = 10 + 3, 15 = 12 + 3. Se a calibração mexer na meta sem mexer nos moradores, o schema avisa.

## 6. Tipos do motor

```ts
/** Identificador opaco de um assento (o kit decide o formato, ex.: "s1"). */
type SeatId = string

/** Contexto de uma ação: só quem age. Sem relógio, sem aleatoriedade, sem nada externo. */
interface Ctx {
  readonly seat: SeatId
}

/** Resultado de `transition`. Ação recusada devolve o mesmo estado, sem eventos. */
type Result<S, E> =
  | { readonly ok: true; readonly state: S; readonly events: readonly E[] }
  | { readonly ok: false; readonly state: S; readonly events: readonly []; readonly reason: RejectReason }

/** Estado antes de uma ação do turno, para o desfazer. */
type Snapshot = Omit<GameState, 'turnHistory'>
```

`RejectReason` é uma lista fechada de códigos em inglês, que a interface traduz: `not-your-turn`, `game-over`, `not-enough-actions`, `unknown-tile`, `not-adjacent`, `tile-submerged`, `carry-full`, `resident-not-here`, `resident-not-injured`, `role-required`, `sandbag-limit`, `tile-not-reinforceable`, `forecast-unavailable`, `nothing-to-undo`.

### Estado

Mudanças em relação à especificação (seção 4), marcadas com ★:

```ts
interface GameState {
  config: GameConfig          // ★ dados resolvidos desta partida (regras + dificuldade + mapa)
  rng: number                 // estado do gerador (mulberry32)
  tiles: Tile[]
  residents: Resident[]
  volunteers: Volunteer[]     // ordem do array = ordem dos assentos
  riverLevel: number
  rainDeck: RainCardKind[]
  rainDiscard: RainCardKind[]
  stormWarning: boolean | null // ★ resposta do alerta neste turno (null = não usado)
  turn: number
  activeSeat: SeatId
  turnHistory: Snapshot[]
  phase: 'playing' | 'won' | 'lost'
  lossReason?: 'stranded' | 'level' | 'swept' // ★ 'swept' só com immediateLossOnSwept
}
```

- **★ `config` dentro do estado** substitui `difficulty`, `goal` e `maxRiverLevel`. Assim a partida carrega os próprios números: uma sala aberta não muda se os dados forem calibrados no meio do jogo, e a simulação pode comparar configurações diferentes lado a lado. O custo é pequeno (cerca de 2 KB por estado).
- Ids das quadras: `A1` a `F6`. Ids dos moradores: casa + número (`A4-1`, `A4-2`), legíveis nos testes e nos logs.

### Ações e eventos

Ações como na especificação: `move { to }`, `pick-up { residentId }`, `heal { residentId }`, `reinforce { tileId }`, `forecast`, `undo`, `end-turn`.

Eventos da especificação, mais três novos (★): `forecast-revealed` (resposta do alerta), `action-undone` (para a interface desfazer a animação) e `turn-ended` (separa o fim do turno da chuva, útil no log "Enquanto você estava fora").

## 7. Detalhes de regra que proponho fixar

Pontos que os documentos não dizem com todas as letras. Para cada um vai uma recomendação; se aprovar a proposta, eles entram no "Registro de decisões".

1. **Alerta de temporal olha só a próxima carta** (`cards: 1`), como a previsão do Normal.
2. **Quando reembaralhar:** logo depois da compra que esvazia o baralho. Assim o baralho nunca fica vazio entre turnos. Se restar menos cartas do que a previsão mostra (Tranquilo, 1 carta), a previsão mostra só as que restam, sem adivinhar o próximo embaralhamento.
3. **Derrota tem prioridade sobre vitória** quando as duas acontecem no mesmo momento (por exemplo, a chuva ilha o 4º morador e um voluntário é levado ao cais completando a equipe).
4. **Voluntário levado ao cais conta para a vitória**, porque ele está no cais.
5. **A Médica cura só moradores que estão em quadra** (não os carregados), na quadra dela ou numa vizinha ortogonal.
6. **Saco de areia vale em quadra submersa** (a Barqueira está nela ou o Engenheiro ao lado). Pode secar a quadra, mas, pela decisão de 20/11/2026, os ilhados não voltam.
7. **Igreja e cais têm custo de quadra seca** para entrar (nunca molham).
8. **Encerrar o turno com ações sobrando** é permitido; as ações que sobram se perdem.
9. **Não há limite de voluntários na mesma quadra.**
10. **Vitória é verificada depois de cada ação e depois da chuva** ("vale na hora", seção 8).

## 8. Dependência para validar o schema (precisa de aprovação)

O motor precisa validar os dados. Opções:

| Opção | Prós | Contras |
| --- | --- | --- |
| **Zod 4 como dependência de produção do motor (recomendada)** | Um único lugar define o schema e os tipos TypeScript (`z.infer`); mensagens de erro claras; muito usado e mantido; sem dependências; o mesmo pacote serve para validar as mensagens do servidor na Etapa 4 | Dependência de produção nova; soma alguns KB ao app (dá para usar `zod/mini`, menor, se o tamanho pesar na Smart TV) |
| Validador escrito à mão, sem dependência | O motor continua sem nenhuma dependência | Tipos e validação duplicados; mais código para manter e testar |
| JSON Schema com Ajv só nos testes | Nenhuma dependência de produção | O motor não valida dados carregados pela simulação; tipos duplicados |

Zod é pura computação (sem I/O), então o motor continua puro.
