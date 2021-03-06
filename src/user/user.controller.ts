import { Controller, Delete, ForbiddenException, Get, HttpCode, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ReqUser } from '../shared/decorators/user.decorator';
import { UserEntity } from './user.schema';
import { UserService } from './user.service';
import { map, mergeMap } from 'rxjs/operators';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRes } from './definitions/UserRes.dto';
import { checkPerms } from 'src/shared/utils/user.utils';

@ApiTags('User controller')
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get('self')
	@UseGuards(AuthGuard('bearer'))
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public getSelf(
		@ReqUser() user$: Observable<UserEntity>,
		@Query('expand') expand: string[] | string,
	): Observable<UserRes> {
		return user$.pipe(
			mergeMap((user) => this.userService.get(user.id, expand)),
			map((user) => new UserRes(user)),
		);
	}

	@Get(':id')
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public getById(@Param('id') id: string, @Query('expand') expand: string[] | string): Observable<UserRes> {
		return this.userService.get(id, expand).pipe(map((user) => new UserRes(user)));
	}

	@Delete(':id')
	@HttpCode(204)
	@UseGuards(AuthGuard('bearer'))
	public delete(@Param('id') id: string, @ReqUser() reqUser$: Observable<UserEntity>): Observable<void> {
		return reqUser$.pipe(
			mergeMap((user) => {
				if (user.id !== id) throw new ForbiddenException();

				return this.userService.delete(id);
			}),
		);
	}

	@Put(':id/profiles/:profileId')
	@UseGuards(AuthGuard('bearer'))
	@ApiQuery({
		name: 'expand',
		isArray: true,
		required: false,
		description: 'Select which fields should be expanded (populated) on the response',
	})
	public addProfile(
		@Param('id') user: string,
		@Param('profileId') profile: string,
		@ReqUser() reqUser$: Observable<UserEntity>,
		@Query('expand') expand: string[] | string,
	): Observable<UserRes> {
		return reqUser$.pipe(
			mergeMap((reqUser) => {
				if (checkPerms(reqUser, profile)) throw new ForbiddenException();

				return this.userService.addProfile(user, profile, expand);
			}),
			map((user) => new UserRes(user)),
		);
	}

	@Delete(':id/profiles/:profileId')
	@UseGuards(AuthGuard('bearer'))
	public removeProfile(
		@Param('id') user: string,
		@Param('profileId') profile: string,
		@ReqUser() reqUser$: Observable<UserEntity>,
	): Observable<void> {
		return reqUser$.pipe(
			mergeMap((reqUser) => {
				if (checkPerms(reqUser, profile)) throw new ForbiddenException();

				return this.userService.removeProfile(user, profile);
			}),
		);
	}
}
