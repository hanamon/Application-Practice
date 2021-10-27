'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      nickname: {
        unique: true,
        type: Sequelize.STRING
      },
      profile_url: {
        type: Sequelize.STRING
      },
      bio: {
        type: Sequelize.STRING
      },
      role: {
        allowNull: false,
        defaultValue: 2,
        type: Sequelize.INTEGER
      },
      email_verified: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      key_for_verify: {
        allowNull: false,
        type: Sequelize.STRING
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
