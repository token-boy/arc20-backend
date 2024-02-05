import { fork } from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

export let utxoListener: ChildProcess
export let atomicalIndexer: ChildProcess

const dirname = path.dirname(fileURLToPath(import.meta.url))

function initTasks() {
  utxoListener = fork(`${dirname}/utxo-listener.js`)
  atomicalIndexer = fork(`${dirname}/atomical-indexer.js`)
}

export default initTasks
