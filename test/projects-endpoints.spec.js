const knex = require('knex');
const app = require('../src/app');
const {
  makeProjectsArray,
  makeMaliciousProject,
} = require('./projects.fixtures');

const { makeUsersArray } = require('./users.fixtures');

describe('Projects Endpoints', function () {
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
    db.raw('TRUNCATE TABLE cc_projects, cc_users RESTART IDENTITY CASCADE')
  );

  afterEach('cleanup', () =>
    db.raw('TRUNCATE TABLE cc_projects, cc_users RESTART IDENTITY CASCADE')
  );

  describe(`GET /api/projects`, () => {
    context(`Given no projects`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get('/api/projects').expect(200, []);
      });
    });

    context('Given there are projects in the database', () => {
      const testUsers = makeUsersArray();
      const testProjects = makeProjectsArray();

      beforeEach('insert projects', () => {
        return db
          .into('cc_users')
          .insert(testUsers)
          .then(() => {
            return db.into('cc_projects').insert(testProjects);
          });
      });

      it('responds with 200 and all of the projectss', () => {
        return supertest(app).get('/api/projects').expect(200, testProjects);
      });
    });

    context(`Given an XSS attack project`, () => {
      const testUsers = makeUsersArray();
      const { maliciousProject, expectedProject } = makeMaliciousProject();

      beforeEach('insert malicious project', () => {
        return db
          .into('cc_users')
          .insert(testUsers)
          .then(() => {
            return db.into('cc_projects').insert(maliciousProject);
          });
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/projects`)
          .expect(200)
          .expect((res) => {
            expect(res.body[0].details).to.eql(expectedProject.details);
          });
      });
    });
  });

  describe(`GET /api/projects/:project_id`, () => {
    context(`Given no projects`, () => {
      it(`responds with 404`, () => {
        const projectId = 123456;
        return supertest(app)
          .get(`/api/projects/${projectId}`)
          .expect(404, { error: { message: `Project doesn't exist` } });
      });
    });

    context('Given there are projects in the database', () => {
      const testUsers = makeUsersArray();
      const testProjects = makeProjectsArray();

      beforeEach('insert projects', () => {
        return db
          .into('cc_users')
          .insert(testUsers)
          .then(() => {
            return db.into('cc_projects').insert(testProjects);
          });
      });

      it('responds with 200 and the specified project', () => {
        const projectId = 2;
        const expectedProject = testProjects[projectId - 1];

        return supertest(app)
          .get(`/api/projects/${projectId}`)
          .expect(200, expectedProject);
      });
    });

    context(`Given an XSS attack project`, () => {
      const testUsers = makeUsersArray();
      const { maliciousProject, expectedProject } = makeMaliciousProject();

      beforeEach('insert malicious project', () => {
        return db
          .into('cc_users')
          .insert(testUsers)
          .then(() => {
            return db.into('cc_projects').insert([maliciousProject]);
          });
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/projects/${maliciousProject.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.details).to.eql(expectedProject.details);
          });
      });
    });
  });

  describe(`POST /api/projects`, () => {
    const testUsers = makeUsersArray();

    beforeEach(`insert malicious project`, () => {
      return db.into(`cc_users`).insert(testUsers);
    });

    it(`creates a project responding with 201 and the new project`, () => {
      this.retries(3);

      const newProject = {
        project_type: 'website',
        deadline: new Date(),
        deadline_flexibility: 'set',
        charity_id: 2,
        details: 'some details about what we want',
      };

      return supertest(app)
        .post('/api/projects')
        .send(newProject)
        .expect(201)
        .expect((res) => {
          expect(res.body.project_type).to.eql(newProject.project_type);
          expect(res.body.deadline_flexibility).to.eql(
            newProject.deadline_flexibility
          );
          expect(res.body.charity_id).to.eql(newProject.charity_id);
          expect(res.body.details).to.eql(newProject.details);
          const expected = new Date().toLocaleString();
          const actual = new Date(res.body.deadline).toLocaleString();
          expect(actual).to.eql(expected);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/projects/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    const requiredFields = [
      'project_type',
      'deadline',
      'deadline_flexibility',
      'charity_id',
    ];

    requiredFields.forEach((field) => {
      const newProject = {
        project_type: 'website',
        deadline: new Date(),
        deadline_flexibility: 'flex',
        charity_id: 1,
        details: '',
      };

      it(`responds with 400 an error message when the ${field} is required`, () => {
        delete newProject[field];

        return supertest(app)
          .post('/api/projects')
          .send(newProject)
          .expect(400, {
            error: { message: `Missing '${field}' is required` },
          });
      });
    });

    it('removes XSS attack content from response', () => {
      const { maliciousProject, expectedProject } = makeMaliciousProject();

      return supertest(app)
        .post(`/api/projects`)
        .send(maliciousProject)
        .expect(201)
        .expect((res) => {
          expect(res.body.details).to.eql(expectedProject.details);
        });
    });
  });

  describe(`DELETE /api/projects/:project_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const projectId = 123456;
        return supertest(app)
          .delete(`/api/projects/${projectId}`)
          .expect(404, { error: { message: `Project doesn't exist` } });
      });
    });

    context('Given there are projects in the database', () => {
      const testUsers = makeUsersArray();
      const testProjects = makeProjectsArray();

      beforeEach('insert notes', () => {
        return db
          .into('cc_users')
          .insert(testUsers)
          .then(() => {
            return db.into('cc_projects').insert(testProjects);
          });
      });

      it('responds with 204 and removes the note', () => {
        const idToRemove = 2;
        const expectedProjects = testProjects.filter(
          (project) => project.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/projects/${idToRemove}`)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/projects`).expect(expectedProjects)
          );
      });
    });
  });

  describe('PATCH /api/projects/:project_id', () => {
    context(`Given no projects`, () => {
      it(`responds with 404`, () => {
        const projectId = 12345;
        return supertest(app)
          .delete(`/api/projects/${projectId}`)
          .expect(404, { error: { message: `Project doesn't exist` } });
      });
    });

    context(`Given there are projects in the database`, () => {
      const testUsers = makeUsersArray();
      const testProjects = makeProjectsArray();

      beforeEach('insert projects', () => {
        return db
          .into('cc_users')
          .insert(testUsers)
          .then(() => {
            return db.into('cc_projects').insert(testProjects);
          });
      });

      it(`responds with 204 and updates the project`, () => {
        const idToUpdate = 2;
        const updateProject = {
          project_type: 'website',
          deadline: '2018-08-15T23:00:00.000Z',
          deadline_flexibility: 'set',
          charity_id: 2,
          details: 'updated project details',
        };
        const expectedProject = {
          ...testProjects[idToUpdate - 1],
          ...updateProject,
        };
        return supertest(app)
          .patch(`/api/projects/${idToUpdate}`)
          .send(updateProject)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/projects/${idToUpdate}`)
              .expect(expectedProject)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;

        return supertest(app)
          .patch(`/api/projects/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'project_type', 'deadline', 'deadline_flexibility' or 'details'`,
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateProject = {
          details: 'updated project details',
        };
        const expectedProject = {
          ...testProjects[idToUpdate - 1],
          ...updateProject,
        };

        return supertest(app)
          .patch(`/api/projects/${idToUpdate}`)
          .send({
            ...updateProject,
            fieldToIgnore: 'should not be in GET response',
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/projects/${idToUpdate}`)
              .expect(expectedProject)
          );
      });
    });
  });
});
