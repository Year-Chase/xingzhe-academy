import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { UserTagRelation } from './user-tag-relation.entity'

export type TagDefinitionType = 'SYSTEM' | 'CUSTOM'

@Entity('tag_definition')
@Index('uq_tag_definition_type_name', ['type', 'name'], { unique: true })
@Index('uq_tag_definition_rule_code', ['ruleCode'], { unique: true })
export class TagDefinition {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ type: 'varchar', length: 80 })
  name: string

  @Column({ type: 'varchar', length: 20 })
  type: TagDefinitionType

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 80, nullable: true })
  ruleCode: string | null

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => UserTagRelation, (relation) => relation.tag)
  relations: UserTagRelation[]
}
