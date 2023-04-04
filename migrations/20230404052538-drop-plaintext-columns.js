'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface) {
    await queryInterface.removeColumn("patients", "full_name");
    await queryInterface.removeColumn("patients", "email");
    await queryInterface.removeColumn("patients", "dob");
    await queryInterface.removeColumn("patients", "weight");
    await queryInterface.removeColumn("patients", "allergies");
    await queryInterface.removeColumn("patients", "medications");
  },
};
