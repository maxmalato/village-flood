// Distribui as partidas entre threads e junta os resultados por célula.
import type { GameData } from '@village-flood/engine'
import { Worker } from 'node:worker_threads'
import type { Job } from './plan.ts'
import type { GameMetrics } from './play.ts'

export type Results = Map<string, GameMetrics[]>

export async function runJobs(
  jobs: readonly Job[],
  datas: readonly GameData[],
  workers: number,
  onProgress?: (done: number, total: number) => void,
): Promise<Results> {
  const results: Results = new Map()
  const batches: Job[][] = []
  const batchSize = 20
  for (let i = 0; i < jobs.length; i += batchSize) batches.push(jobs.slice(i, i + batchSize))
  let next = 0
  let done = 0

  const runWorker = () =>
    new Promise<void>((resolve, reject) => {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { workerData: { datas } })
      const send = () => {
        const batch = batches[next++]
        if (!batch) {
          void worker.terminate().then(() => resolve())
          return
        }
        worker.postMessage(batch)
      }
      worker.on('message', (batch: { cell: string; metrics: GameMetrics }[]) => {
        for (const { cell, metrics } of batch) {
          const list = results.get(cell) ?? []
          list.push(metrics)
          results.set(cell, list)
        }
        done += batch.length
        onProgress?.(done, jobs.length)
        send()
      })
      worker.on('error', reject)
      send()
    })

  await Promise.all(Array.from({ length: Math.max(1, workers) }, runWorker))
  return results
}
