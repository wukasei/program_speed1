import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Vehicle = sequelize.define('Vehicle', {
    vehicle_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    registration_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    vehicle_type: { type: DataTypes.STRING, allowNull: false },
    make: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING, allowNull: false },
    technical_characteristics: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('available', 'busy', 'maintenance'), allowNull: false }
}, {
    tableName: 'vehicle',
    timestamps: false
});

export default Vehicle;