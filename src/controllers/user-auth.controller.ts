import {TokenService} from '@loopback/authentication';
import {
  Credentials,
  MyUserService,
  RefreshTokenService,
  RefreshTokenServiceBindings,
  TokenServiceBindings,
  User,
  UserServiceBindings
} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  getModelSchemaRef,
  post,
  requestBody,
  SchemaObject
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {genSalt, hash} from 'bcryptjs';
import {
  LoginResult, NewUserRequest, RefreshResult
} from '../models/user.model';
import {UserRepository} from '../repositories';

//Defines the format of Login request
const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

// Describes the type of grant object taken in by method "refresh"
type RefreshGrant = {
  refreshToken: string;
};

// Describes the schema of grant object
const RefreshGrantSchema: SchemaObject = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: {
      type: 'string',
    },
  },
};

// Describes the request body of grant object
const RefreshGrantRequestBody = {
  description: 'Reissuing Acess Token',
  required: true,
  content: {
    'application/json': {schema: RefreshGrantSchema},
  },
};

//Auth Controller class definition

export class AuthController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE)
    public refreshService: RefreshTokenService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
    @repository(UserRepository)
    protected userRepository: UserRepository,
  ) { }

  /**
   * Expose Login end point to Annotation tool frontend
   * Authenticate user and return the JWT token / refresh token pair to use in subsequent requests
   * @param credentials - Object including email and password (format: { "email": "email_address", "password": "password" })
   * @returns 401 if fails, token and user object if authentication successful
   */
  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<LoginResult> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const accessToken = await this.jwtService.generateToken(userProfile);
    //Create refresh token too
    const tokens = await this.refreshService.generateToken(
      userProfile,
      accessToken,
    );

    //Get annotation user object from our Database
    const annotationUser = await this.userRepository.findById(user.id);
    return <LoginResult>{
      token: accessToken,
      refreshToken: tokens.refreshToken,
      expireTime: tokens.expiresIn,
      user: {
        userId: annotationUser.id,
        name: annotationUser.name,
        userType: annotationUser.userType || 0,
      },
    };
  }

  /**
   * Endpoint to refresh the authentication token which was generated in login function
   * Required by frontend when jwt access token is expired, to get a new token
   * @param refreshGrant
   * @returns
   */
  @post('/users/refresh-token')
  async refresh(
    @requestBody(RefreshGrantRequestBody) refreshGrant: RefreshGrant,
  ): Promise<RefreshResult> {
    return {
      token: (await this.refreshService.refreshToken(refreshGrant.refreshToken))
        .accessToken,
    };
  }

  /**
   * Endpoint to create a user account in the system
   * Creates a record in AnnotationUser collection
   * @param newUserRequest Object with user name, email and password
   * @returns Created user object
   */
  @post('/users/signup', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async signUp(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUserRequest, {
            title: 'NewUser',
          }),
        },
      },
    })
    newUserRequest: NewUserRequest,
  ): Promise<User> {
    const password = await hash(newUserRequest.password, await genSalt());

    return await this.userRepository.createUser(newUserRequest, password);
  }
}
