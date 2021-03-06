import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostController } from './post.controller';
import { PostEntitySchema } from './post.schema';
import { PostService } from './post.service';
import { QuestionModule } from '../question/question.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Post', schema: PostEntitySchema }]), QuestionModule],
	providers: [PostService],
	controllers: [PostController],
	exports: [PostService],
})
export class PostModule {}
