import { DataTypes } from 'sequelize';
import sequelize from '../database.js'; // шлях до database.js

const Driver = sequelize.define('Driver', {
  driver_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name: { type: DataTypes.STRING, allowNull: false },
  license_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  license_category: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'driver',  // точна назва таблиці в MySQL
  timestamps: false      // якщо немає createdAt/updatedAt
});

export default Driver;
