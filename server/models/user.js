'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      password: {
        type: DataTypes.STRING
      },
      email: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING
      },
      nickname: {
        unique: true,
        type: DataTypes.STRING
      },
      profile_url: {
        type: DataTypes.STRING
      },
      bio: {
        type: DataTypes.STRING
      },
      role: {
        allowNull: false,
        defaultValue: 2,
        type: DataTypes.INTEGER
      },
      email_verified: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN
      },
      key_for_verify: {
        allowNull: false,
        type: DataTypes.STRING
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: new Date()
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: new Date()
      }
    },
    {
      sequelize,
      modelName: 'user',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  return User;
};
