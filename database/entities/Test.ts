import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ })
class Test extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "id", type: "int", unsigned: true })
  id: number;

  @Column({ name: "text", type: "char", length: 36 })
  text: string;
}

export default Test;
