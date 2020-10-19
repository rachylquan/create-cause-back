const UsersService = {
  getAllUsers(knex) {
    return knex.select('*').from('cc_users');
  },

  insertUser(knex, newUser) {
    return knex
      .insert(newUser)
      .into('cc_users')
      .returning('*')
      .then((rows) => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from('cc_users').select('*').where('id', id).first();
  },

  deleteUser(knex, id) {
    return knex('cc_users').where({ id }).delete();
  },

  updateUser(knex, id, newUserFields) {
    return knex('cc_users').where({ id }).update(newUserFields);
  },
};

module.exports = UsersService;
