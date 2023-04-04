'use strict';

const { INSTALL_SQL, UNINSTALL_SQL } = require('@cipherstash/libpq/database-extensions/postgresql');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(INSTALL_SQL)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(UNINSTALL_SQL)
  }
};
