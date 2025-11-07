import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const TripLog = sequelize.define('TripLog', {
    log_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    
    trip_id: { type: DataTypes.INTEGER, allowNull: false },
    
    log_time: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'triplog',
    timestamps: false
});

export default TripLog;