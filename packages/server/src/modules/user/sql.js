// Helpers
import { has } from 'lodash';
import bcrypt from 'bcryptjs';

import { mongo } from '../../server';

const mongodb = require('mongodb');
const o_id = id => new mongodb.ObjectID(id);

// import knex from '../../sql/connector';
// import { returnId } from '../../sql/helpers';

// Actual query fetching and transformation in DB
class User {
  async getUsers(orderBy, filter) {
    const query = mongo(db =>
      db.collection('users').find({}, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );

    return await query;
  }

  async getUser(id) {
    return await mongo(db =>
      db.collection('users').findOne({ _id: o_id(id) }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );
  }

  async getUserWithPassword(id) {
    return await mongo(db =>
      db.collection('users').findOne({ _id: o_id(id) }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );
  }

  async getUserWithSerial(serial) {
    return await mongo(db =>
      db.collection('users').findOne({ serial }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );
  }

  async register({ username, email, password, role, isActive }) {
    const passwordHash = await bcrypt.hash(password, 12);

    if (role === undefined) {
      role = 'user';
    }

    const query = mongo(db =>
      db
        .collection('users')
        .insert({ username, email, role, password_hash: passwordHash, is_active: !!isActive }, (err, docs) => {
          if (err) {
            console.log(err);
            throw err;
          } else {
            console.log(docs);
            return docs._id;
          }
        })
    );

    return await query;
  }

  createFacebookAuth({ id, displayName, userId }) {
    const query = mongo(db =>
      db.collection('users').insert({ fb_id: id, display_name: displayName, user_id: userId }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );

    return query;
  }

  createGithubAuth({ id, displayName, userId }) {
    const query = mongo(db =>
      db.collection('users').insert({ fb_id: id, display_name: displayName, user_id: userId }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );

    return query;
  }

  createGoogleOAuth({ id, displayName, userId }) {
    const query = mongo(db =>
      db.collection('users').insert({ fb_id: id, display_name: displayName, user_id: userId }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );

    return query;
  }

  createLinkedInAuth({ id, displayName, userId }) {
    const query = mongo(db =>
      db.collection('users').insert({ fb_id: id, display_name: displayName, user_id: userId }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );

    return query;
  }

  async editUser({ id, username, email, role, isActive, password }) {
    let localAuthInput = { email };
    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      localAuthInput = { email, password_hash: passwordHash };
    }

    return mongo(db =>
      db.collection('users').update(
        { _id: o_id(id) },
        {
          $set: {
            username,
            role,
            is_active: isActive,
            ...localAuthInput
          }
        }
      )
    );
  }

  async editUserProfile({ id, profile }) {
    try {
      const update = await mongo(db => db.collection('users').update({ _id: o_id(id) }, { ...profile }));
      return update;
    } catch (err) {
      const insert = await mongo(db => db.collection('users').insertOne({ _id: o_id(id), ...profile }));
      return insert;
    }
  }

  // async editAuthCertificate({
  //   id,
  //   auth: {
  //     certificate: { serial }
  //   }
  // }) {
  //   const userProfile = await knex
  //     .select('id')
  //     .from('auth_certificate')
  //     .where({ user_id: id })
  //     .first();

  //   if (userProfile) {
  //     return knex('auth_certificate')
  //       .update({ serial })
  //       .where({ user_id: id });
  //   } else {
  //     return returnId(knex('auth_certificate')).insert({ serial, user_id: id });
  //   }
  // }

  // deleteUser(id) {
  //   return knex('user')
  //     .where('id', '=', id)
  //     .del();
  // }

  // async updatePassword(id, newPassword) {
  //   const passwordHash = await bcrypt.hash(newPassword, 12);

  //   return knex('user')
  //     .update({ password_hash: passwordHash })
  //     .where({ id });
  // }

  // updateActive(id, isActive) {
  //   return knex('user')
  //     .update({ is_active: isActive })
  //     .where({ id });
  // }

  async getUserByEmail(email) {
    return await mongo(db =>
      db.collection('users').findOne({ email }, (err, docs) => {
        if (err) {
          console.log('error', err);
          throw err;
        } else {
          console.log(docs);
          return docs;
        }
      })
    );
  }

  // async getUserByFbIdOrEmail(id, email) {
  //   return camelizeKeys(
  //     await knex
  //       .select(
  //         'u.id',
  //         'u.username',
  //         'u.role',
  //         'u.is_active',
  //         'fa.fb_id',
  //         'u.email',
  //         'u.password_hash',
  //         'up.first_name',
  //         'up.last_name'
  //       )
  //       .from('user AS u')
  //       .leftJoin('auth_facebook AS fa', 'fa.user_id', 'u.id')
  //       .leftJoin('user_profile AS up', 'up.user_id', 'u.id')
  //       .where('fa.fb_id', '=', id)
  //       .orWhere('u.email', '=', email)
  //       .first()
  //   );
  // }

  // async getUserByLnInIdOrEmail(id, email) {
  //   return camelizeKeys(
  //     await knex
  //       .select(
  //         'u.id',
  //         'u.username',
  //         'u.role',
  //         'u.is_active',
  //         'lna.ln_id',
  //         'u.email',
  //         'u.password_hash',
  //         'up.first_name',
  //         'up.last_name'
  //       )
  //       .from('user AS u')
  //       .leftJoin('auth_linkedin AS lna', 'lna.user_id', 'u.id')
  //       .leftJoin('user_profile AS up', 'up.user_id', 'u.id')
  //       .where('lna.ln_id', '=', id)
  //       .orWhere('u.email', '=', email)
  //       .first()
  //   );
  // }

  // async getUserByGHIdOrEmail(id, email) {
  //   return camelizeKeys(
  //     await knex
  //       .select(
  //         'u.id',
  //         'u.username',
  //         'u.role',
  //         'u.is_active',
  //         'gha.gh_id',
  //         'u.email',
  //         'u.password_hash',
  //         'up.first_name',
  //         'up.last_name'
  //       )
  //       .from('user AS u')
  //       .leftJoin('auth_github AS gha', 'gha.user_id', 'u.id')
  //       .leftJoin('user_profile AS up', 'up.user_id', 'u.id')
  //       .where('gha.gh_id', '=', id)
  //       .orWhere('u.email', '=', email)
  //       .first()
  //   );
  // }

  // async getUserByGoogleIdOrEmail(id, email) {
  //   return camelizeKeys(
  //     await knex
  //       .select(
  //         'u.id',
  //         'u.username',
  //         'u.role',
  //         'u.is_active',
  //         'ga.google_id',
  //         'u.email',
  //         'u.password_hash',
  //         'up.first_name',
  //         'up.last_name'
  //       )
  //       .from('user AS u')
  //       .leftJoin('auth_google AS ga', 'ga.user_id', 'u.id')
  //       .leftJoin('user_profile AS up', 'up.user_id', 'u.id')
  //       .where('ga.google_id', '=', id)
  //       .orWhere('u.email', '=', email)
  //       .first()
  //   );
  // }

  async getUserByUsername(username) {
    return await mongo(db =>
      db.collection('users').findOne({ username }, (err, docs) => {
        if (err) {
          console.log('error', err);
          throw err;
        } else {
          console.log(docs);
          return docs;
        }
      })
    );
    // return camelizeKeys(
    //   await knex
    //     .select('u.id', 'u.username', 'u.role', 'u.is_active', 'u.email', 'up.first_name', 'up.last_name')
    //     .from('user AS u')
    //     .where('u.username', '=', username)
    //     .leftJoin('user_profile AS up', 'up.user_id', 'u.id')
    //     .first()
    // );
  }

  async getUserByUsernameOrEmail(usernameOrEmail) {
    return await mongo(db =>
      db.collection('users').findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] })
    );
    // return camelizeKeys(
    //   await knex
    //     .select(
    //       'u.id',
    //       'u.username',
    //       'u.password_hash',
    //       'u.role',
    //       'u.is_active',
    //       'u.email',
    //       'up.first_name',
    //       'up.last_name'
    //     )
    //     .from('user AS u')
    //     .where('u.username', '=', usernameOrEmail)
    //     .orWhere('u.email', '=', usernameOrEmail)
    //     .leftJoin('user_profile AS up', 'up.user_id', 'u.id')
    //     .first()
    // );
  }
}
const userDAO = new User();

export default userDAO;
