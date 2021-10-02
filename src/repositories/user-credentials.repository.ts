import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {NoteappdbDataSource} from '../datasources';
import {AppUserCredentials, AppUserCredentialsRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class UserCredentialsRepository extends DefaultCrudRepository<
  AppUserCredentials,
  typeof AppUserCredentials.prototype.id,
  AppUserCredentialsRelations
> {

  public readonly user: BelongsToAccessor<User, typeof AppUserCredentials.prototype.id>;

  constructor(
    @inject('datasources.noteappdb') dataSource: NoteappdbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(AppUserCredentials, dataSource);
  }
}
