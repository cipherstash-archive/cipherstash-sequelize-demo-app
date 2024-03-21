const express = require("express");
const { json, urlencoded } = require("body-parser");
const cors = require("cors");

const { sequelize } = require("./models");
const { Op } = require("sequelize");

/**
 * @type {import('sequelize').Sequelize['models']}
 */
const models = sequelize.models;

const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors());

/**
 * @param {(req: Request, res: Response) => Promise<void>} callback
 */
function handler(callback) {
  return (req, res, next) => {
    try {
      callback(req, res).catch((error) => next(error));
    } catch (error) {
      next(error);
    }
  };
}

// A helper function to assert the request ID param is valid
// and convert it to a number (since it comes as a string by default)
function getIdParam(req) {
  const id = req.params.id;
  if (/^\d+$/.test(id)) {
    return Number.parseInt(id, 10);
  }
  throw new TypeError(`Invalid ':id' param: "${id}"`);
}

app.get(
  "/api/patients",
  handler(async (req, res) => {
    let order = undefined;

    /**
     * @type {import('sequelize').WhereOptions}
     */
    let where = {};

    if (req.query.sortBy) {
      order = [
        [req.query.sortBy, req.query.direction === "asc" ? "ASC" : "DESC"],
      ];
    }

    if (req.query.fullNameTerm) {
      where['full_name'] = { [Op.or]: [{ [Op.like]: req.query.fullNameTerm }, { [Op.substring]: req.query.fullNameTerm }] }
    }

    if (req.query.emailTerm) {
      where['email'] = { [Op.or]: [{ [Op.like]: req.query.emailTerm }, { [Op.substring]: req.query.emailTerm }] }
    }

    if (req.query.medicationsTerm) {
      where['medications'] = { [Op.or]: [{ [Op.like]: req.query.medicationsTerm }, { [Op.substring]: req.query.medicationsTerm }] }
    }

    if (req.query.allergiesTerm) {
      where['allergies'] = { [Op.or]: [{ [Op.like]: req.query.allergiesTerm }, { [Op.substring]: req.query.allergiesTerm }] }
    }


    const patients = await models.patient.findAll({
      order,
      where,
      __identity: "some-long-token" // Set the JWT here
    });

    res.status(200).json(patients);
  })
);

app.post(
  "/api/patients",
  handler(async (req, res) => {
    if (req.body.id) {
      res
        .status(400)
        .send(
          `Bad request: ID should not be provided, since it is determined automatically by the database.`
        );
    } else {
      const { id } = await models.patient.create(req.body);
      res.status(201).json({ id });
    }
  })
);

app.get(
  "/api/patient/:id",
  handler(async (req, res) => {
    const id = getIdParam(req);
    const patient =
      "includeInstruments" in req.query
        ? await models.patient.findByPk(id, { include: models.instrument })
        : await models.patient.findByPk(id);
    if (patient) {
      res.status(200).json(patient);
    } else {
      res.status(404).send("404 - Not found");
    }
  })
);

app.put(
  "/api/patient/:id",
  handler(async (req, res) => {
    const id = getIdParam(req);

    // We only accept an UPDATE request if the `:id` param matches the body `id`
    if (req.body.id === id) {
      await models.patient.update(req.body, {
        where: {
          id: id,
        },
      });
      res.status(200).end();
    } else {
      res
        .status(400)
        .send(
          `Bad request: param ID (${id}) does not match body ID (${req.body.id}).`
        );
    }
  })
);

app.delete(
  "/api/patient/:id",
  handler(async (req, res) => {
    const id = getIdParam(req);
    await models.patient.destroy({
      where: {
        id: id,
      },
    });
    res.status(200).end();
  })
);

app.use(express.static(`${__dirname}/frontend/dist`));
app.get("/*", (_req, res) =>
  res.sendFile(__dirname + "/frontend/dist/index.html")
);


const port = process.env.PORT || 3000;

app.listen(port, () => console.log("Listening on " + port));
