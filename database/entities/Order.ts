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

  @Column({ name: 'type', type: 'smallint', unsigned: true, nullable: false })
  type: OrderType

  @Column({ name: 'status', type: 'smallint', unsigned: true, nullable: false })
  status: OrderStatus

  @Index()
  @Column({ name: 'session_id', type: 'char', length: 10, nullable: false })
  sessionId: string

  @Index()
  @Column({
    name: 'receive_address',
    type: 'char',
    length: 64,
    nullable: false,
  })
  receiveAddress: string

  @Column({ name: 'key_pair', type: 'json', nullable: false })
  keyPair: Dict

  @Column({ name: 'metadata', type: 'json', nullable: false })
  metadata: Dict

  @Column({ name: 'expired_at', type: 'timestamp', nullable: false })
  expiredAt: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date
}

export default Order
