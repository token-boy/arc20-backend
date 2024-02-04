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

import { NFTProtocal } from 'helpers/constants'

@Entity({})
class NFT extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id: number

  @Index()
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string

  @Column({ name: 'index', type: 'int', unsigned: true })
  index: number

  @Column({ name: 'protocal', type: 'smallint', unsigned: true })
  protocal: NFTProtocal

  @Column({ name: 'owner', type: 'char', length: 64 })
  owner: string

  @Column({ name: 'mint_at', type: 'timestamp' })
  mintAt: Date

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

export default NFT
