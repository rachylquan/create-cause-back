const knex = require('knex');
const app = require('../src/app');

const { makeUsersArray } = require('./users.fixtures');

describe('Users Endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () =>
    db.raw('TRUNCATE TABLE cc_users RESTART IDENTITY CASCADE')
  );

  afterEach('cleanup', () =>
    db.raw('TRUNCATE TABLE cc_users RESTART IDENTITY CASCADE')
  );

  describe(`GET /api/users`, () => {
    context(`Given no users`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get('/api/users').expect(200, []);
      });
    });

    context('Given there are users in the database', () => {
      const testUsers = makeUsersArray();

      beforeEach('insert users', () => {
        return db.into('cc_users').insert(testUsers);
      });

      it('responds with 200 and all of the users', () => {
        return supertest(app).get('/api/users').expect(200, testUsers);
      });
    });
  });

  describe(`GET /api/users/:user_id`, () => {
    context(`Given no users`, () => {
      it(`responds with 404`, () => {
        const userId = 123456;
        return supertest(app)
          .get(`/api/users/${userId}`)
          .expect(404, { error: { message: `User doesn't exist` } });
      });
    });

    context('Given there are users in the database', () => {
      const testUsers = makeUsersArray();

      beforeEach('insert users', () => {
        return db.into('cc_users').insert(testUsers);
      });

      it('responds with 200 and the specified user', () => {
        const userId = 2;
        const expectedUser = testUsers[userId - 1];

        return supertest(app)
          .get(`/api/users/${userId}`)
          .expect(200, expectedUser);
      });
    });
  });

  describe(`POST /api/users`, () => {
    const testUsers = makeUsersArray();

    it(`creates a user responding with 201 and the new user`, () => {
      const newUser = {
        name: 'Charity 3',
        user_type: 'charity',
        email: 'charity3@charity.org',
        password: 'charity3',
      };

      return supertest(app)
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).to.eql(newUser.name);
          expect(res.body.user_type).to.eql(newUser.user_type);
          expect(res.body.email).to.eql(newUser.email);
          expect(res.body.password).to.eql(newUser.password);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/users/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    const requiredFields = ['name', 'user_type', 'email', 'password'];

    requiredFields.forEach((field) => {
      const newUser = {
        name: 'Charity 4',
        user_type: 'charity',
        email: 'email@charity4.org',
        password: 'passwordcharity',
      };

      it(`responds with 400 an error message when the ${field} is required`, () => {
        delete newUser[field];

        return supertest(app)
          .post('/api/users')
          .send(newUser)
          .expect(400, {
            error: { message: `Missing '${field}' is required` },
          });
      });
    });
  });

  describe(`DELETE /api/users/:user_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const userId = 123456;
        return supertest(app)
          .delete(`/api/users/${userId}`)
          .expect(404, { error: { message: `User doesn't exist` } });
      });
    });

    context('Given there are users in the database', () => {
      const testUsers = makeUsersArray();

      beforeEach('insert notes', () => {
        return db.into('cc_users').insert(testUsers);
      });

      it('responds with 204 and removes the note', () => {
        const idToRemove = 2;
        const expectedUsers = testUsers.filter(
          (user) => user.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/users/${idToRemove}`)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/users`).expect(expectedUsers)
          );
      });
    });
  });

  describe('PATCH /api/users/:user_id', () => {
    context(`Given no users`, () => {
      it(`responds with 404`, () => {
        const userId = 12345;
        return supertest(app)
          .delete(`/api/users/${userId}`)
          .expect(404, { error: { message: `User doesn't exist` } });
      });
    });

    context(`Given there are users in the database`, () => {
      const testUsers = makeUsersArray();

      beforeEach('insert users', () => {
        return db.into('cc_users').insert(testUsers);
      });

      it(`responds with 204 and updates the user`, () => {
        const idToUpdate = 2;
        const updateUser = {
          name: 'Charity 4',
          user_type: 'charity',
          email: 'email@charity4.org',
          password: 'passwordcharity',
          about: 'updated about paragraph',
          website: 'https://updatedcharity.com',
        };
        const expectedUser = {
          ...testUsers[idToUpdate - 1],
          ...updateUser,
        };
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .send(updateUser)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/users/${idToUpdate}`).expect(expectedUser)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;

        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'name', 'user_type', 'email' or 'password'`,
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateUser = {
          name: 'updated user name',
        };
        const expectedUser = {
          ...testUsers[idToUpdate - 1],
          ...updateUser,
        };

        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .send({
            ...updateUser,
            fieldToIgnore: 'should not be in GET response',
          })
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/users/${idToUpdate}`).expect(expectedUser)
          );
      });
    });
  });
});
