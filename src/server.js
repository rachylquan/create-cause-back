const knex = require('knex');
const app = require('./app');

const { PORT, DB_URL } = require('./config');

const db = knex({
  client: 'pg',
  connection: DB_URL,
});

app.set('db', db);

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

// to do list
// migrations
// set up service and route
// authentication with roles

// create an account
// log in to account
// add account details
// get account by id
// edit profile

// create a project
// edit project
// get project all projects
// get project by id
