import { OrderStatus, OrderType } from 'helpers/constants'
import {
  Entity,
  BaseEntity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm'

@Entity({})
class Order extends BaseEntity {
  @PrimaryColumn({ name: 'id', type: 'char', length: 36 })
  id: string

  @Column({ name: 'type', type: 'smallint', unsigned: true })
  type: OrderType

  @Column({ name: 'status', type: 'smallint', unsigned: true })
  status: OrderStatus

  @Index()
  @Column({ name: 'session_id', type: 'char', length: 11 })
  sessionId: string

  @Index()
  @Column({
    name: 'receive_address',
    type: 'char',
    length: 64,
    nullable: false,
  })
  receiveAddress: string

  @Column({ name: 'key_pair', type: 'json' })
  keyPair: Dict

  @Column({ name: 'utxo', type: 'json', nullable: true })
  utxo: Dict

  @Column({ name: 'metadata', type: 'json' })
  metadata: Dict

  @Column({ name: 'expired_at', type: 'timestamp' })
  expiredAt: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date

  toJSON() {
    Object.assign(this, { payAddress: this.keyPair['address'] })
    delete this.keyPair
    return this
  }
}

export default Order
