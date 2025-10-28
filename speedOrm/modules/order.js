import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Client from './client.js'; // шлях до Client

const Order = sequelize.define('Order', {
  order_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  route_from: { type: DataTypes.STRING, allowNull: false },
  route_to: { type: DataTypes.STRING, allowNull: false },
  planned_departure_time: { type: DataTypes.DATE, allowNull: false },
  planned_arrival_time: { type: DataTypes.DATE, allowNull: false },
  cargo_details: { type: DataTypes.TEXT, allowNull: true },
  order_status: { type: DataTypes.STRING, allowNull: false },
  driver_id: { type: DataTypes.INTEGER, allowNull: false },
  vehicle_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'order',
  timestamps: false
});

// Встановлюємо зв’язок
Order.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(Order, { foreignKey: 'client_id' });

export default Order;
