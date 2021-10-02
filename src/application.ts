import {AuthenticationComponent} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  RefreshTokenServiceBindings,
  TokenServiceBindings,
  UserServiceBindings
} from '@loopback/authentication-jwt';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {NoteappdbDataSource} from './datasources';
import {UserRepository} from './repositories';
import {MySequence} from './sequence';



export {ApplicationConfig};

export class NoteappApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    ////////////////////////////////
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to('259200s');
    //For JWT Authentication
    // Mount authentication system
    this.component(AuthenticationComponent);
    // Mount jwt component
    this.component(JWTAuthenticationComponent);
    // Bind datasources
    this.dataSource(NoteappdbDataSource, UserServiceBindings.DATASOURCE_NAME);
    this.dataSource(
      NoteappdbDataSource,
      RefreshTokenServiceBindings.DATASOURCE_NAME,
    );
    //Bind custom user-repo
    this.bind(UserServiceBindings.USER_REPOSITORY).toClass(
      UserRepository,
    );
    //Token expiration set to 3 days
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to('259200');
    //////////////////////////////////////////////////////




    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
