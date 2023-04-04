const { sequelize } = require("./models");

/**
 * @type {import('sequelize').Sequelize['models']}
 */
const models = sequelize.models;

const PAGE_SIZE = 1000;

/**
 * @param {import('sequelize').Model} model
 */
async function forceSave(model) {
  // Since we want to encrypt all fields list them all here as changed (even if nothing was)
  model.changed("full_name", true);
  model.changed("email", true);
  model.changed("dob", true);
  model.changed("weight", true);
  model.changed("allergies", true);
  model.changed("medications", true);
  return await model.save();
}

(async () => {
  let offset = 0;

  // Iterate through all the patients in batches and save them
  while (true) {
    const patients = await models.patient.findAll({
      offset,
      limit: PAGE_SIZE,
      order: [[ 'id', 'ASC' ]]
    })

    if (patients.length === 0) {
      break;
    }

    await Promise.all(patients.map(forceSave))

    offset += PAGE_SIZE;
  }

  console.log("Migration successful!")
})();
