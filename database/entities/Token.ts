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

@Entity({ })
class Token extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id: number

  @Index()
  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string

  @Column({ name: 'index', type: 'int', unsigned: true, nullable: false })
  index: number

  @Column({
    name: 'protocal',
    type: 'smallint',
    unsigned: true,
    nullable: false,
  })
  protocal: TokenProtocal

  @Column({ name: 'mint_amount', type: 'int', unsigned: true, nullable: false })
  mintAmount: number

  @Column({ name: 'max_mints', type: 'int', unsigned: true, nullable: false })
  maxMints: number

  @Column({ name: 'supply', type: 'bigint', unsigned: true, nullable: false })
  supply: number

  @Column({ name: 'mint_count', type: 'int', unsigned: true, nullable: false })
  mintCount: number

  @Column({ name: 'burned', type: 'bigint', unsigned: true, nullable: false })
  burned: number

  @Column({ name: 'holders', type: 'int', unsigned: true, nullable: false })
  holders: number

  @Column({ name: 'bitworkc', type: 'varchar', length: 128, default: '' })
  bitworkc: string

  @Column({ name: 'bitworkr', type: 'varchar', length: 128, default: '' })
  bitworkr: string

  @Column({
    name: 'deploy_block',
    type: 'int',
    unsigned: true,
    nullable: false,
  })
  deployBlock: number

  @Column({ name: 'deployer', type: 'char', length: 64, nullable: false })
  deployer: string

  @Column({ name: 'deployed_at', type: 'timestamp', nullable: false })
  deployedAt: Date

  @Column({ name: 'confirmed', type: 'boolean', nullable: false })
  confirmed: boolean

  @Column({ name: 'mint_height', type: 'int', unsigned: true, nullable: false })
  mintHeight: number

  @Index({ unique: true })
  @Column({ name: 'commit_tx', type: 'char', length: 64, nullable: false })
  commitTx: string

  @Index({ unique: true })
  @Column({ name: 'reveal_tx', type: 'char', length: 64, nullable: false })
  revealTx: string

  @Column({
    name: 'output_index',
    type: 'smallint',
    unsigned: true,
    nullable: false,
  })
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
