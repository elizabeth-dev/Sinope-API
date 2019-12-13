import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn, RelationId } from 'typeorm';
import { PostEntity } from '../post/post.entity';
import { QuestionEntity } from '../question/question.entity';
import { UserEntity } from '../user/user.entity';

@Entity()
export class ProfileEntity {
	@PrimaryColumn({ type: 'uuid' })
	public id: string;

	@Column({ unique: true })
	public tag: string;

	@Column()
	public name: string;

	@CreateDateColumn()
	public created: Date;

	@RelationId((profile: ProfileEntity) => profile.managers)
	public managerIds: string[];

	@ManyToMany(() => UserEntity, (user) => user.profiles, { onDelete: 'CASCADE' })
	@JoinTable()
	public managers: UserEntity[];

	@OneToMany(() => PostEntity, (post) => post.author)
	public posts: PostEntity[];

	@ManyToMany(() => PostEntity, (post) => post.likes)
	public likes: PostEntity[];

	@ManyToMany(() => ProfileEntity, (profile) => profile.followers)
	public following: ProfileEntity[];

	@ManyToMany(() => ProfileEntity, (profile) => profile.following)
	@JoinTable()
	public followers: ProfileEntity[];

	@OneToMany(() => QuestionEntity, (question) => question.author)
	public askedQuestions: QuestionEntity[];

	@OneToMany(() => QuestionEntity, (question) => question.recipient)
	public receivedQuestions: QuestionEntity[];
}
