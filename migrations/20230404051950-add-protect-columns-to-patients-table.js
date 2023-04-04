/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(q, { DataTypes }) {
    // Add columns for sorting and encrypting
    await q.addColumn("patients", "__full_name_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__full_name_ore", { type: "ore_64_8_v1" });
    await q.addColumn("patients", "__full_name_match", { type: DataTypes.ARRAY(DataTypes.INTEGER) });
    await q.addColumn("patients", "__full_name_unique", { type: DataTypes.TEXT });

    await q.addColumn("patients", "__email_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__email_ore", { type: "ore_64_8_v1" });
    await q.addColumn("patients", "__email_match", { type: DataTypes.ARRAY(DataTypes.INTEGER) });
    await q.addColumn("patients", "__email_unique", { type: DataTypes.TEXT });

    await q.addColumn("patients", "__dob_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__dob_ore", { type: "ore_64_8_v1_term" });

    await q.addColumn("patients", "__weight_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__weight_ore", { type: "ore_64_8_v1_term" });

    await q.addColumn("patients", "__allergies_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__allergies_ore", { type: "ore_64_8_v1" });
    await q.addColumn("patients", "__allergies_match", { type: DataTypes.ARRAY(DataTypes.INTEGER) });
    await q.addColumn("patients", "__allergies_unique", { type: DataTypes.TEXT });

    await q.addColumn("patients", "__medications_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__medications_ore", { type: "ore_64_8_v1" });
    await q.addColumn("patients", "__medications_match", { type: DataTypes.ARRAY(DataTypes.INTEGER) });
    await q.addColumn("patients", "__medications_unique", { type: DataTypes.TEXT });

    // Add indexes for all the ORE fields used for sorting and range queries
    await q.addIndex("patients", ["__full_name_ore"]);
    await q.addIndex("patients", ["__email_ore"]);
    await q.addIndex("patients", ["__dob_ore"]);
    await q.addIndex("patients", ["__weight_ore"]);
    await q.addIndex("patients", ["__allergies_ore"]);
    await q.addIndex("patients", ["__medications_ore"]);

    // Add indexes for all the match fields used for full text searches
    await q.addIndex("patients", ["__full_name_match"], { using: "GIN" });
    await q.addIndex("patients", ["__email_match"], { using: "GIN" });
    await q.addIndex("patients", ["__allergies_match"], { using: "GIN" });
    await q.addIndex("patients", ["__medications_match"], { using: "GIN" });
  }
}
