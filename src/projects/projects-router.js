require('dotenv').config();
const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const ProjectsService = require('./projects-service');
const xss = require('xss');

const projectsRouter = express.Router();
const bodyParser = express.json();

const serializeProject = (project) => ({
  id: project.id,
  project_type: project.project_type,
  deadline: project.deadline,
  deadline_flexibility: project.deadline_flexibility,
  charity_id: project.charity_id,
  details: xss(project.details),
});

projectsRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    ProjectsService.getAllProjects(knexInstance)
      .then((projects) => {
        res.json(projects.map(serializeProject));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const {
      project_type,
      deadline,
      deadline_flexibility,
      charity_id,
      details,
    } = req.body;
    const newProject = {
      project_type,
      deadline,
      deadline_flexibility,
      charity_id,
      details,
    };

    for (const field of [
      'project_type',
      'deadline',
      'deadline_flexibility',
      'charity_id',
    ]) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);

        return res.status(400).send({
          error: { message: `Missing '${field}' is required` },
        });
      }
    }

    ProjectsService.insertProject(req.app.get('db'), newProject)
      .then((project) => {
        res.status(201).json(serializeProject(project));
      })
      .catch(next);
  });

projectsRouter
  .route('/:project_id')
  .all((req, res, next) => {
    ProjectsService.getById(req.app.get('db'), req.params.project_id)
      .then((project) => {
        if (!project) {
          return res.status(404).json({
            error: { message: `Project doesn't exist` },
          });
        }
        res.project = project; // save project for the next middleware
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeProject(res.project));
  })
  .delete((req, res, next) => {
    ProjectsService.deleteProject(req.app.get('db'), req.params.project_id)

      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { project_type, deadline, deadline_flexibility, details } = req.body;
    const projectToUpdate = {
      project_type,
      deadline,
      deadline_flexibility,
      details,
    };

    const numberOfValues = Object.values(projectToUpdate).filter(Boolean)
      .length;

    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'project_type', 'deadline', 'deadline_flexibility' or 'details'`,
        },
      });
    ProjectsService.updateProject(
      req.app.get('db'),
      req.params.project_id,
      projectToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = projectsRouter;
