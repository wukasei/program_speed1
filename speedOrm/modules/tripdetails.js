import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const TripDetails = sequelize.define('TripDetails', {
    trip_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    
    order_id: { type: DataTypes.INTEGER, allowNull: false, unique: true }, 
    
    actual_trip_status: { type: DataTypes.ENUM('completed', 'delayed', 'ongoing'), allowNull: false },
    fuel_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    other_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    total_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    revenue: { type: DataTypes.DECIMAL(10, 2), allowNull: true }
}, {
    tableName: 'tripdetails',
    timestamps: false
});

export default TripDetails;