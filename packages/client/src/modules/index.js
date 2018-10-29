import defaultRouter from './defaultRouter';
import i18n from './i18n';
import user from './user';
import contact from './contact';
import pageNotFound from './pageNotFound';
import pagination from './pagination';
import './favicon';

import ClientModule from './ClientModule';

export default new ClientModule(
  //
  contact,
  defaultRouter,
  pagination,
  user,
  i18n,
  pageNotFound
);
