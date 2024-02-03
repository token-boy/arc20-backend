import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm'

import { TokenProtocal } from 'helpers/constants'

@Entity({})
class Token extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id: number

  @Index()
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string

  @Column({ name: 'index', type: 'int', unsigned: true })
  index: number

  @Column({ name: 'protocal', type: 'smallint', unsigned: true })
  protocal: TokenProtocal

  @Column({ name: 'mint_amount', type: 'int', unsigned: true })
  mintAmount: number

  @Column({ name: 'max_mints', type: 'int', unsigned: true })
  maxMints: number

  @Column({ name: 'supply', type: 'bigint', unsigned: true })
  supply: number

  @Column({ name: 'mint_count', type: 'int', unsigned: true })
  mintCount: number

  @Column({ name: 'burned', type: 'bigint', unsigned: true })
  burned: number

  @Column({ name: 'holders', type: 'int', unsigned: true })
  holders: number

  @Column({ name: 'bitworkc', type: 'varchar', length: 128, default: '' })
  bitworkc: string

  @Column({ name: 'bitworkr', type: 'varchar', length: 128, default: '' })
  bitworkr: string

  @Column({ name: 'deploy_block', type: 'int', unsigned: true })
  deployBlock: number

  @Column({ name: 'deployer', type: 'char', length: 64 })
  deployer: string

  @Column({ name: 'deployed_at', type: 'timestamp' })
  deployedAt: Date

  @Column({ name: 'confirmed', type: 'boolean' })
  confirmed: boolean

  @Column({ name: 'mint_height', type: 'int', unsigned: true })
  mintHeight: number

  @Index({ unique: true })
  @Column({ name: 'commit_tx', type: 'char', length: 64 })
  commitTx: string

  @Index({ unique: true })
  @Column({ name: 'reveal_tx', type: 'char', length: 64 })
  revealTx: string

  @Column({ name: 'output_index', type: 'smallint', unsigned: true })
  outputIndex: string

  @Column({ name: 'metadata', type: 'json', default: '{}' })
  metadata: object

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date
}

export default Token
