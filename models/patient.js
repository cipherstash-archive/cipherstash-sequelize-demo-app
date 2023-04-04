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
    sequelize,
    modelName: 'patient',
  });
  return patient;
};
