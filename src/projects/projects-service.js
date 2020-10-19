const ProjectsService = {
  getAllProjects(knex) {
    return knex.select('*').from('cc_projects');
  },

  insertProject(knex, newProject) {
    return knex
      .insert(newProject)
      .into('cc_projects')
      .returning('*')
      .then((rows) => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from('cc_projects').select('*').where('id', id).first();
  },

  deleteProject(knex, id) {
    return knex('cc_projects').where({ id }).delete();
  },

  updateProject(knex, id, newProjectFields) {
    return knex('cc_projects').where({ id }).update(newProjectFields);
  },
};

module.exports = ProjectsService;
