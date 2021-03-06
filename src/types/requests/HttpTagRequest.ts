import HttpByIDRequest from './HttpByIDRequest';
import HttpDatabaseRequest from './HttpDatabaseRequest';

export interface HttpTagRequest extends HttpByIDRequest {
  ID: string;
}

export interface HttpTagsRequest extends HttpDatabaseRequest {
  Search: string;
  UserID?: string;
  Issuer?: boolean;
  Active?: boolean;
  WithUser: boolean;
}
