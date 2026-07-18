import { Column, CreateDateColumn, Entity, Index, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm'
import { TagDefinition } from './tag-definition.entity'

export type UserTagRelationSource = 'SYSTEM' | 'ADMIN'

@Entity('user_tag_relation')
@Index('idx_user_tag_relation_user', ['userId'])
@Index('idx_user_tag_relation_tag', ['tagId'])
@Index('uq_user_tag_relation_user_tag', ['userId', 'tagId'], { unique: true })
export class UserTagRelation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ type: 'varchar', length: 100 })
  userId: string

  @Column({ type: 'bigint' })
  tagId: string

  @Column({ type: 'varchar', length: 20 })
  source: UserTagRelationSource

  @CreateDateColumn()
  assignedAt: Date

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedBy: string | null

  @ManyToOne(() => TagDefinition, (tag) => tag.relations)
  @JoinColumn({ name: 'tagId' })
  tag: TagDefinition
}
