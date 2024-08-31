import { WebPaths } from './routes/WebPaths';

import packageJson from '../../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  site: {
    name: string;
    serverUrl: string;
    assetURL: string;
    basePath: string;
    version: string;
  };
  auth: {
    method: 'jwt' | 'amplify' | 'firebase' | 'supabase' | 'auth0';
    skip: boolean;
    redirectPath: string;
  };
  mapbox: {
    apiKey: string;
  };
  firebase: {
    appId: string;
    apiKey: string;
    projectId: string;
    authDomain: string;
    storageBucket: string;
    measurementId: string;
    messagingSenderId: string;
  };
  amplify: { userPoolId: string; userPoolWebClientId: string; region: string };
  auth0: { clientId: string; domain: string; callbackUrl: string };
  supabase: { url: string; key: string };
};

// ----------------------------------------------------------------------

export const DefaultConfig: ConfigValue = {
  site: {
    name: 'Minimals',
    serverUrl: '',
    assetURL: 'https://api-dev-minimal-v6.vercel.app',
    basePath: '',
    version: packageJson.version,
  },
  /**
   * Auth
   * @method jwt | amplify | firebase | supabase | auth0
   */
  auth: {
    method: 'jwt',
    skip: true,
    redirectPath: WebPaths.app.root,
  },
  /**
   * Mapbox
   */
  mapbox: {
    apiKey: '',
  },
  /**
   * Firebase
   */
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  },
  /**
   * Amplify
   */
  amplify: {
    userPoolId: '',
    userPoolWebClientId: '',
    region: '',
  },
  /**
   * Auth0
   */
  auth0: {
    clientId: '',
    domain: '',
    callbackUrl: '',
  },
  /**
   * Supabase
   */
  supabase: {
    url: '',
    key: '',
  },
};
