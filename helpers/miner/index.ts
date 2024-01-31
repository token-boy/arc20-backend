import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import { initSync } from './miner'

function initMiner() {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const bytes = fs.readFileSync(path.join(dirname, 'miner_bg.wasm'));
  initSync(bytes);
}

export { mine } from './miner'

export default initMiner
