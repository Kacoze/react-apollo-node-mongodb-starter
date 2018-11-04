// Helpers
import bcrypt from 'bcryptjs';

import { mongo } from '../../server';

const mongodb = require('mongodb');

const o_id = id => new mongodb.ObjectID(id);

// import knex from '../../sql/connector';
// import { returnId } from '../../sql/helpers';

// Actual query fetching and transformation in DB
class User {
  async getUsers({ column, order }, { searchText, role, isActive }) {
    let columnOrder = !order ? 1 : order === 'desc' ? 1 : -1;
    const query = await mongo(db =>
      db
        .collection('users')
        .find({
          $query: {
            role: role || { $regex: `.*$` },
            isActive,
            $or: [{ username: { $regex: `.*${searchText}.*` } }, { email: { $regex: `.*${searchText}.*` } }]
          }
        })
        .addQueryModifier('$orderby', { [`${column || 'email'}`]: columnOrder })
    );
    return query.toArray();
  }

  getUser(id) {
    return mongo(db => db.collection('users').findOne({ _id: o_id(id) }));
  }

  getUserWithPassword(id) {
    return mongo(db =>
      db.collection('users').findOne({ _id: o_id(id) }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs;
        }
      })
    );
  }

  getUserWithSerial(serial) {
    return mongo(db =>
      db.collection('users').findOne({ serial }, async (err, docs) => {
        if (err) {
          throw err;
        } else {
          return await docs;
        }
      })
    );
  }

  async register({ username, email, password, role, isActive }) {
    const passwordHash = await bcrypt.hash(password, 12);
    return await mongo(async db => {
      await db.collection('users').insertOne({
        username,
        email,
        role: role || 'user',
        passwordHash: passwordHash,
        isActive: !!isActive
      });
      const user = await db.collection('users').findOne({ email });
      return await db.collection('users').update({ email }, { $set: { id: user._id.toString() } });
    });
  }

  async createFacebookAuth({ id, displayName, _id }) {
    return await mongo(db =>
      db.collection('users').update({ _id: o_id(_id) }, { $set: { fb_id: id, display_name: displayName, id: _id } })
    );
  }

  createGithubAuth({ id, displayName, _id }) {
    return mongo(db =>
      db.collection('users').insertOne({ fb_id: id, display_name: displayName, _id: _id }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs.insertedId;
        }
      })
    );
  }

  createGoogleOAuth({ id, displayName, _id }) {
    return mongo(db =>
      db.collection('users').insertOne({ fb_id: id, display_name: displayName, _id: _id }, (err, docs) => {
        if (err) {
          throw err;
        } else {
          return docs.insertedId;
        }
      })
    );
  }

  createLinkedInAuth({ id, displayName, _id }) {
    return mongo(db =>
      db.collection('users').insertOne({ fb_id: id, display_name: displayName, _id: _id }, async (err, docs) => {
        if (err) {
          throw err;
        } else {
          return await docs.insertedId;
        }
      })
    );
  }

  async editUser({ id, username, email, role, isActive, password }) {
    let localAuthInput = { email };
    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      localAuthInput = { email, passwordHash: passwordHash };
    }

    return mongo(db =>
      db.collection('users').update(
        { _id: o_id(id) },
        {
          $set: {
            id: id.toString(),
            username,
            role: role || 'user',
            isActive,
            ...localAuthInput
          }
        }
      )
    );
  }

  editUserProfile({ id, profile }) {
    try {
      return mongo(async db => db.collection('users').update({ _id: o_id(id) }, { $set: { ...profile } }));
    } catch (err) {
      return mongo(db => db.collection('users').insertOne({ _id: o_id(id), ...profile }));
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
  //     .where({ _id: id })
  //     .first();

  //   if (userProfile) {
  //     return knex('auth_certificate')
  //       .update({ serial })
  //       .where({ _id: id });
  //   } else {
  //     return returnId(knex('auth_certificate')).insert({ serial, _id: id });
  //   }
  // }

  // deleteUser(id) {
  //   return knex('user')
  //     .where('id', '=', id)
  //     .del();
  // }

  async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);

    return mongo(db => db.collection('users').update({ id }, { $set: { passwordHash } }));
  }

  async updateActive(id, isActive) {
    return await mongo(db => db.collection('users').update({ _id: o_id(id) }, { $set: { isActive: isActive } }));
  }

  async getUserByEmail(email) {
    return await mongo(db => db.collection('users').findOne({ email }));
  }

  async getUserByFbIdOrEmail(id, email) {
    return await mongo(db => db.collection('users').findOne({ $or: [{ fb_id: id }, { email }] }));
  }

  // async getUserByLnInIdOrEmail(id, email) {
  //   return camelizeKeys(
  //     await knex
  //       .select(
  //         'u.id',
  //         'u.username',
  //         'u.role',
  //         'u.isActive',
  //         'lna.ln_id',
  //         'u.email',
  //         'u.passwordHash',
  //         'up.first_name',
  //         'up.last_name'
  //       )
  //       .from('user AS u')
  //       .leftJoin('auth_linkedin AS lna', 'lna._id', 'u.id')
  //       .leftJoin('user_profile AS up', 'up._id', 'u.id')
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
  //         'u.isActive',
  //         'gha.gh_id',
  //         'u.email',
  //         'u.passwordHash',
  //         'up.first_name',
  //         'up.last_name'
  //       )
  //       .from('user AS u')
  //       .leftJoin('auth_github AS gha', 'gha._id', 'u.id')
  //       .leftJoin('user_profile AS up', 'up._id', 'u.id')
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
  //         'u.isActive',
  //         'ga.google_id',
  //         'u.email',
  //         'u.passwordHash',
  //         'up.first_name',
  //         'up.last_name'
  //       )
  //       .from('user AS u')
  //       .leftJoin('auth_google AS ga', 'ga._id', 'u.id')
  //       .leftJoin('user_profile AS up', 'up._id', 'u.id')
  //       .where('ga.google_id', '=', id)
  //       .orWhere('u.email', '=', email)
  //       .first()
  //   );
  // }

  getUserByUsername(username) {
    return mongo(db => db.collection('users').findOne({ username }));
    // return camelizeKeys(
    //   await knex
    //     .select('u.id', 'u.username', 'u.role', 'u.isActive', 'u.email', 'up.first_name', 'up.last_name')
    //     .from('user AS u')
    //     .where('u.username', '=', username)
    //     .leftJoin('user_profile AS up', 'up._id', 'u.id')
    //     .first()
    // );
  }

  async getUserByUsernameOrEmail(usernameOrEmail) {
    return await mongo(db =>
      db.collection('users').findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] })
    );
  }
}
const userDAO = new User();

export default userDAO;
