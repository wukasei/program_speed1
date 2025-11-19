import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const TripLog = sequelize.define('TripLog', {
    login_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    
    trip_id: { type: DataTypes.INTEGER, allowNull: false },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    
    actual_departure_time: { type: DataTypes.DATE, allowNull: false },
    actual_arrival_time: { type: DataTypes.DATE, allowNull: false },
    driver_comments: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'triplog',
    timestamps: false
});

export default TripLog;