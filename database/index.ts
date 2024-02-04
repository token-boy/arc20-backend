import { DataSource } from "typeorm";
import Redis from "ioredis"

import { NFT, Order, Test, Token } from "./entities";

// All data models.
const models = [Test, Token, Order, NFT];

// Redis Address.
const REDIS_URI = `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`

export class Storage {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = new DataSource({
      type: "postgres",
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: models,
      logging: false,
      synchronize: true,
      logger: "simple-console",
    });
  }

  /**
   * Create database connection.
   */
  connect() {
    return this.dataSource.initialize();
  }
}

export * from "./entities";

export const cache = new Redis(REDIS_URI, { lazyConnect: true })

function initStorage() {
  const storage = new Storage();
  return storage.connect();
}

export default initStorage;
