import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	Patch,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { PostRes } from 'src/post/definitions/PostRes.dto';
import { checkPerms } from 'src/shared/utils/user.utils';
import { PostService } from '../post/post.service';
import { ReqUser } from '../shared/decorators/user.decorator';
import { UserEntity } from '../user/user.schema';
import { CreateProfileReq } from './definitions/CreateProfileReq.dto';
import { ProfileRes } from './definitions/ProfileRes.dto';
import { UpdateProfileReq } from './definitions/UpdateProfileReq.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile controller')
@Controller('profiles')
export class ProfileController {
	constructor(private readonly profileService: ProfileService, private readonly postService: PostService) {}

	@Get(':id')
	@ApiQuery({
		name: 'profile',
		required: false,
		description: 'Used to check if the profiles returned are followers or follows of the requestor profile.',
	})
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public get(
		@Param('id') id: string,
		@Query('expand') expand: string[] | string,
		@Query('profile') fromProfile?: string,
	): Observable<ProfileRes> {
		return this.profileService.get(id, expand).pipe(
			tap((profile) => {
				if (!profile) throw new NotFoundException();
			}),
			map((profile) => (fromProfile ? new ProfileRes(profile, fromProfile) : new ProfileRes(profile))),
		);
	}

	@Post()
	@UseGuards(AuthGuard('bearer'))
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public create(
		@Body() newProfile: CreateProfileReq,
		@ReqUser() reqUser$: Observable<UserEntity>,
		@Query('expand') expand: string[] | string,
	): Observable<ProfileRes> {
		return reqUser$.pipe(
			mergeMap((user) => this.profileService.create(newProfile, user.id, expand)),
			map((profile) => new ProfileRes(profile)),
		);
	}

	@Delete(':id')
	@HttpCode(204)
	@UseGuards(AuthGuard('bearer'))
	public delete(@Param('id') id: string, @ReqUser() reqUser$: Observable<UserEntity>): Observable<void> {
		return reqUser$.pipe(
			mergeMap((user) => {
				if (checkPerms(user, id)) throw new ForbiddenException();

				return this.profileService.delete(id);
			}),
			map((profile) => {
				if (!profile) throw new NotFoundException();

				return;
			}),
		);
	}

	@Patch(':id')
	@UseGuards(AuthGuard('bearer'))
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public update(
		@Param('id') profile: string,
		@Body() partial: UpdateProfileReq,
		@ReqUser() reqUser$: Observable<UserEntity>,
		@Query('expand') expand: string[] | string,
	): Observable<ProfileRes> {
		return reqUser$.pipe(
			mergeMap((user) => {
				if (checkPerms(user, profile)) throw new ForbiddenException();

				return this.profileService.update(profile, partial, expand);
			}),
			map((profile) => new ProfileRes(profile)),
		);
	}

	@Get(':id/followers')
	@ApiQuery({
		name: 'profile',
		required: false,
		description: 'Used to check if the profiles returned are followers or follows of the requestor profile.',
	})
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public getFollowers(
		@Param('id') profileId: string,
		@Query('expand') expand: string[] | string,
		@Query('profile') fromProfile?: string,
	): Observable<ProfileRes[]> {
		return this.profileService.getFollowers(profileId, expand).pipe(
			tap((followers) => {
				if (!followers) throw new NotFoundException();
			}),
			map((profiles) =>
				profiles.map((profile) =>
					fromProfile ? new ProfileRes(profile, fromProfile) : new ProfileRes(profile),
				),
			),
		);
	}

	@Get(':id/following')
	@ApiQuery({
		name: 'profile',
		required: false,
		description: 'Used to check if the profiles returned are followers or follows the requestor profile.',
	})
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public getFollowing(
		@Param('id') profileId: string,
		@Query('expand') expand: string[] | string,
		@Query('profile') fromProfile?: string,
	): Observable<ProfileRes[]> {
		return this.profileService.getFollowing(profileId, expand).pipe(
			tap((following) => {
				if (!following) throw new NotFoundException();
			}),
			map((profiles) =>
				profiles.map((profile) =>
					fromProfile ? new ProfileRes(profile, fromProfile) : new ProfileRes(profile),
				),
			),
		);
	}

	@Put(':id/followers/:follower')
	@UseGuards(AuthGuard('bearer'))
	public follow(
		@Param('id') profile: string,
		@Param('follower') follower: string,
		@ReqUser() reqUser$: Observable<UserEntity>,
	): Observable<void> {
		if (profile === follower) {
			throw new BadRequestException();
		}

		return reqUser$.pipe(
			mergeMap((user) => {
				if (checkPerms(user, follower)) throw new ForbiddenException();

				return this.profileService.follow(profile, follower);
			}),
		);
	}

	@Delete(':id/followers/:follower')
	@UseGuards(AuthGuard('bearer'))
	public unfollow(
		@Param('id') profile: string,
		@Param('follower') unfollower: string,
		@ReqUser() reqUser$: Observable<UserEntity>,
	): Observable<void> {
		if (profile === unfollower) {
			throw new BadRequestException();
		}

		return reqUser$.pipe(
			mergeMap((user) => {
				if (checkPerms(user, unfollower)) throw new ForbiddenException();

				return this.profileService.unfollow(profile, unfollower);
			}),
		);
	}

	@Get(':id/timeline')
	@UseGuards(AuthGuard('bearer'))
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public timeline(
		@Param('id') profileId: string,
		@ReqUser() reqUser$: Observable<UserEntity>,
		@Query('expand') expand: string[] | string,
	): Observable<PostRes[]> {
		return reqUser$.pipe(
			mergeMap((user) => {
				if (checkPerms(user, profileId)) throw new ForbiddenException();

				return this.profileService.getFollowingIds(profileId);
			}),
			mergeMap((followingIds) => this.postService.getByProfileList([...followingIds, profileId], expand)),
			map((posts) => posts.map((post) => new PostRes(post))),
		);
	}
}
