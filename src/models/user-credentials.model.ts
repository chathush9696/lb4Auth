import {UserCredentials} from '@loopback/authentication-jwt';
import {belongsTo, model} from '@loopback/repository';
import {User} from './user.model';

@model()
export class AppUserCredentials extends UserCredentials {

  @belongsTo(() => User)
  appUserId: string;

  constructor(data?: Partial<AppUserCredentials>) {
    super(data);
  }
}

export interface AppUserCredentialsRelations {
  // describe navigational properties here
}

export type UserCredentialsWithRelations = AppUserCredentials & AppUserCredentialsRelations;
