// Helpers
import bcrypt from 'bcryptjs';

import { mongo } from '../../server';

const mongodb = require('mongodb');

const o_id = id => new mongodb.ObjectID(id);

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

  async deleteUser(id) {
    return await mongo(db => db.collection('users').delete({ id }));
  }

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

  getUserByUsername(username) {
    return mongo(db => db.collection('users').findOne({ username }));
  }

  async getUserByUsernameOrEmail(usernameOrEmail) {
    return await mongo(db =>
      db.collection('users').findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] })
    );
  }
}
const userDAO = new User();

export default userDAO;
