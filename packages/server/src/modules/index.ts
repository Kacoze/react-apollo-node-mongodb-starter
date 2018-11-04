import cookies from './cookies';
import i18n from './i18n';
import user from './user';
import contact from './contact';
import mailer from './mailer';
import graphqlTypes from './graphqlTypes';
import './debug';

import ServerModule from './ServerModule';

export default new ServerModule(cookies, i18n, user, contact, mailer, graphqlTypes); //
