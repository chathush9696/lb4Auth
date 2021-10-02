import {Entity, hasOne, model, property} from '@loopback/repository';
import {AppUserCredentials} from './user-credentials.model';

@model()
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
  })
  email: string;

  @property({
    type: 'number',
  })
  userType?: number;

  @hasOne(() => AppUserCredentials)
  userCredentials: AppUserCredentials;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;

export interface LoginResult {
  token: string;
  refreshToken?: string;
  expireTime?: string;
  user: {
    userId: string;
    name: string;
    userType: number;
  };
}

export interface RefreshResult {
  token: string;
}

export class NewUserRequest extends User {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}
