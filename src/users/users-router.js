require('dotenv').config();
const express = require('express');
const logger = require('../logger');
const UsersService = require('./users-service');
const xss = require('xss');

const usersRouter = express.Router();
const bodyParser = express.json();

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  user_type: user.user_type,
  password: user.password,
  about: xss(user.about),
  website: user.website,
});

usersRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    UsersService.getAllUsers(knexInstance)
      .then((users) => {
        res.json(users.map(serializeUser));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { name, email, user_type, password } = req.body;
    const newUser = { name, email, user_type, password };

    for (const field of ['name', 'email', 'user_type', 'password']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);

        return res.status(400).send({
          error: { message: `Missing '${field}' is required` },
        });
      }
    }

    UsersService.insertUser(req.app.get('db'), newUser)
      .then((user) => {
        res.status(201).json(serializeUser(user));
      })
      .catch(next);
  });

usersRouter
  .route('/:user_id')
  .all((req, res, next) => {
    UsersService.getById(req.app.get('db'), req.params.user_id)
      .then((user) => {
        if (!user) {
          return res.status(404).json({
            error: { message: `User doesn't exist` },
          });
        }
        res.user = user;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeUser(res.user));
  })
  .delete((req, res, next) => {
    UsersService.deleteUser(req.app.get('db'), req.params.user_id)

      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { name, email, password, about, website } = req.body;
    const userToUpdate = { name, email, password, about, website };

    const numberOfValues = Object.values(userToUpdate).filter(Boolean).length;

    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'name', 'user_type', 'email' or 'password'`,
        },
      });

    UsersService.updateUser(req.app.get('db'), req.params.user_id, userToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = usersRouter;
