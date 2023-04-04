'use strict';

const { faker } = require('@faker-js/faker');

const Patient = require('../models/patient')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(q, { DataTypes }) {
    const allergies = ["Penicillin", "Mould", "Shellfish", "Peanut", "Egg", "Dilantin", "None"];

    const medications = [
      "Acetaminophen",
      "Adderall",
      "Amitriptyline",
      "Amlodipine",
      "Amoxicillin",
      "Melatonin",
      "Meloxicam",
      "Metformin",
      "Methadone",
      "Methotrexate",
      "Metoprolol",
      "Wellbutrin",
      "Xanax",
      "Zubsolv",
      "None",
    ];

    const patients = Array.from({ length: 100 }).map(() => ({
      full_name: faker.name.fullName(),
      email: faker.internet.email(),
      weight: Math.round((Math.random() * 100) * 100) / 100,
      dob: faker.date.between('1940-01-01', '2020-12-31'),
      allergies: faker.helpers.arrayElement(allergies),
      medications: faker.helpers.arrayElement(medications)
    }))

    const patient = Patient(q.sequelize, DataTypes);

    await patient.bulkCreate(patients)
  },

  async down(q) {
    await q.bulkDelete('patients', null);
  }
};
