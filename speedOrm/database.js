import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('transportcompany', 'root', '15387241', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

export default sequelize;
