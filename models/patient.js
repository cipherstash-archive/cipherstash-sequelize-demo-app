'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class patient extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  patient.init({
    full_name: DataTypes.STRING,
    email: DataTypes.STRING,
    dob: DataTypes.DATEONLY,
    weight: DataTypes.FLOAT,
    allergies: DataTypes.STRING,
    medications: DataTypes.STRING
  }, {
    hooks: {
      beforeFind: async (options) => {
        console.error('beforeFind hook', options);
        if (options.__identity) {
          await sequelize.query(
            // Uncomment this line when using with Proxy
            '--SET IDENTITY TO ?', {
              replacements: [options.__identity],
            }
          );
          delete options.__identity;
        }
      },
      beforeFindAfterOptions: (options) => {
        // __identity is not present because it has been removed in the beforeFind hook
        console.error('beforeFindAfterOptions hook', options);
      },
    },
    sequelize,
    modelName: 'patient',
  });
  return patient;
};
