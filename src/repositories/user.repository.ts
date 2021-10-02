import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasOneRepositoryFactory, repository} from '@loopback/repository';
import _ from 'lodash';
import {NoteappdbDataSource} from '../datasources';
import {AppUserCredentials, NewUserRequest, User, UserRelations} from '../models';
import {UserCredentialsRepository} from './user-credentials.repository';
export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {

  public readonly userCredentials: HasOneRepositoryFactory<AppUserCredentials, typeof User.prototype.id>;

  constructor(
    @inject('datasources.noteappdb') dataSource: NoteappdbDataSource, @repository.getter('UserCredentialsRepository') protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>,
  ) {
    super(User, dataSource);
    this.userCredentials = this.createHasOneRepositoryFactoryFor('userCredentials', userCredentialsRepositoryGetter);
    this.registerInclusionResolver('userCredentials', this.userCredentials.inclusionResolver);
  }

  async createUser(newUserRequest: NewUserRequest, password: string) {
    const savedUser = await this.create(_.omit(newUserRequest, 'password'));

    await this.userCredentials(savedUser.id).create({
      appUserId: savedUser.id.toString(),
      password: password,
    });

    return savedUser;
  }

  async findCredentials(
    userId: typeof User.prototype.id,
  ): Promise<AppUserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
