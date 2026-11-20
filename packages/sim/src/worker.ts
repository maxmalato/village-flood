// Thread de trabalho: joga lotes de partidas.
import type { GameData } from '@village-flood/engine'
import { parentPort, workerData } from 'node:worker_threads'
import type { Job } from './plan.ts'
import { playGame, type GameMetrics } from './play.ts'

const datas = (workerData as { datas: GameData[] }).datas

parentPort?.on('message', (jobs: Job[]) => {
  const results: { cell: string; metrics: GameMetrics }[] = []
  for (const job of jobs) {
    const data = datas[job.variant]
    if (!data) throw new Error(`Variante inexistente: ${job.variant}`)
    results.push({ cell: job.cell, metrics: playGame(data, job.difficulty, job.roles, job.seed) })
  }
  parentPort?.postMessage(results)
})
