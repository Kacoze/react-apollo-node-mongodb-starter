import http from 'http';
import { MongoClient } from 'mongodb';

import addGraphQLSubscriptions from './api/subscriptions';

import { serverPort } from './net';
import app from './app';
import log from '../../common/log';

// eslint-disable-next-line import/no-mutable-exports
let server;
let db;
let mutableServerPromise;

const url = 'mongodb://localhost:27017/integration_test';

server = http.createServer();
server.on('request', app);

addGraphQLSubscriptions(server);

MongoClient.connect(
  url,
  (err, client) => {
    if (err) throw err;
    db = client.db('myDatabaseNameAsAString');

    // Start the application after the database connection is ready
    mutableServerPromise = new Promise(resolve => {
      server.listen(serverPort, () => {
        log.info(`API is now running on port ${serverPort}`);
        resolve(server);
      });
    });
  }
);

server.on('close', () => {
  server = undefined;
});

if (module.hot) {
  module.hot.dispose(() => {
    try {
      if (server) {
        server.close();
      }
    } catch (error) {
      log(error.stack);
    }
  });
  module.hot.accept(['./app'], () => {
    server.removeAllListeners('request');
    server.on('request', app);
  });
  module.hot.accept(['./api/subscriptions'], () => {
    try {
      addGraphQLSubscriptions(server);
    } catch (error) {
      log(error.stack);
    }
  });

  module.hot.accept();
}

export default { ...mutableServerPromise };
export const mongo = async cb => cb(await db);
