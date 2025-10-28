import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Client = sequelize.define('Client', {
  client_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_type: { type: DataTypes.STRING, allowNull: false },
  name_: { type: DataTypes.STRING, allowNull: false },
  contact_person: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
  tableName: 'client',
  timestamps: false
});

export default Client;
