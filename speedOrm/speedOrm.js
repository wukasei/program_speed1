import { performance } from 'perf_hooks';
import readline from 'readline';

import sequelize from './database.js';
import Client from './modules/client.js';
import Driver from './modules/driver.js';
import Order from './modules/order.js';
import Vehicle from './modules/vehicle.js'; 
import TripDetails from './modules/tripdetails.js';
import TripLog from './modules/triplog.js';

Client.hasMany(Order, { foreignKey: 'client_id' });
Order.belongsTo(Client, { foreignKey: 'client_id' });

Driver.hasMany(Order, { foreignKey: 'driver_id' });
Order.belongsTo(Driver, { foreignKey: 'driver_id' });

Vehicle.hasMany(Order, { foreignKey: 'vehicle_id' });
Order.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

Order.hasOne(TripDetails, { foreignKey: 'order_id' });
TripDetails.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(TripLog, { foreignKey: 'order_id' });
TripLog.belongsTo(Order, { foreignKey: 'order_id' });

const models = {
    client: { Model: Client, idKey: 'client_id' },
    driver: { Model: Driver, idKey: 'driver_id' },
    vehicle: { Model: Vehicle, idKey: 'vehicle_id' },
    order: { Model: Order, idKey: 'order_id' },
    tripdetails: { Model: TripDetails, idKey: 'trip_id' },
    triplog: { Model: TripLog, idKey: 'log_id' },
};

export { models };

// -------------------- SELECT (ORM) --------------------
async function testOrmSelect(tableName, limit, include) {
    const start = performance.now();
    limit = parseInt(limit);
    if (isNaN(limit) || limit <= 0) limit = 10;
    
    const { Model } = models[tableName];
    const results = await Model.findAll({ limit,
        include
    });

    const end = performance.now();
    const time = end - start;
    console.log(`SELECT ${tableName} (ORM) | LIMIT ${limit} | Time: ${time.toFixed(3)} ms`);
    return time;
}

async function averageSelectAllTablesORM(limit, repeats) {
    const tables = [
        {
            model:'client',
            include: [
                {model: Order}
            ]
        }, 
        {
            model:'driver'
        }, 
        {
            model:'vehicle'
        },
        {
          model:'order',
          include: [
            { model: Client },
            { model: Driver },
            { model: Vehicle },
            { model: TripLog },
            { model: TripDetails },
            ]
        }, 
        {
            model: 'tripdetails',
            include: [
                { 
                    model: Order,
                    // include: [
                    //     { model: Client },
                    //     { model: Driver },
                    //     { model: Vehicle },
                    // ]
                },
            ],
        },
        {
            model: 'triplog',
            include: [
                { model: Order },
            ],
        }

    ];
    const results = [];

    for (const table of tables) {
        console.log(table);
        const times = [];
        for (let i = 0; i < repeats; i++) {
            times.push(await testOrmSelect(table.model, limit, table.include));
        }
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        results.push({ table:table.model, avg });
        console.log(`Average SELECT time for ${table.model} (ORM): ${avg.toFixed(3)} ms`);
    }

    console.log('\nSummary SELECT (ORM):');
    results.forEach(r => console.log(`${r.table.padEnd(12)} | Average: ${r.avg.toFixed(3)} ms`));
}

// -------------------- JOIN (ORM) --------------------
// async function testOrmJoin(type, limit) {
//     const start = performance.now();

//     limit = parseInt(limit);
//     if (isNaN(limit) || limit <= 0) limit = 10;

//     const joinType = type.toUpperCase();

//     await Order.findAll({
//         attributes: [
//             'order_id',
//             [sequelize.col('Client.name_'), 'client_name'],
//             [sequelize.literal("CONCAT(Driver.first_name, ' ', Driver.last_name)"), 'driver_name'],
//             [sequelize.col('Vehicle.registration_number'), 'vehicle'],
//             'route_from',
//             'route_to',
//             'order_status'
//         ],
//         include: [
//             {
//                 model: Client,
//                 attributes: [],
//                 required: joinType === 'INNER', 
//                 joinType                    
//             },
//             {
//                 model: Driver,
//                 attributes: [],
//                 required: joinType === 'INNER',
//                 joinType
//             },
//             {
//                 model: Vehicle,
//                 attributes: [],
//                 required: joinType === 'INNER',
//                 joinType
//             }
//         ],
//         limit,
//         raw: true
//     });

//     const end = performance.now();
//     console.log(`${joinType} JOIN (ORM) | LIMIT ${limit} | Time: ${(end - start).toFixed(3)} ms`);
//     return end - start;
// }

// async function averageJoinTimeORM(type, limit, repeats) {
//     const times = [];
//     for (let i = 0; i < repeats; i++) {
//         times.push(await testOrmJoin(type, limit));
//     }
//     const avg = times.reduce((a, b) => a + b, 0) / times.length;
//     console.log(`Average ${type} JOIN time (ORM) (${repeats} times): ${avg.toFixed(3)} ms`);
// }

// -------------------- INSERT (ORM) --------------------
async function testOrmInsert(conn, table) {
    const start = performance.now();
    let result;
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const { Model, idKey } = models[table];

    switch(table) {
        case 'client':
            result = await Model.create({
                client_type: 'TestType',
                name_: `Client_${uniqueSuffix}`,
                contact_person: `Person_${uniqueSuffix}`,
                phone: `9${Math.floor(Math.random()*1000000000)}`,
                email: `test${uniqueSuffix}@mail.com`
            }, { transaction: conn });
            break;
        case 'driver':
            result = await Model.create({
                first_name: `Driver_${uniqueSuffix}`,
                last_name: `Last_${uniqueSuffix}`,
                license_number: `LN${uniqueSuffix}`,
                license_category: 'B',
                email: `driver${uniqueSuffix}@mail.com`,
                phone: `9${Math.floor(Math.random()*1000000000)}`
            }, { transaction: conn });
            break;
        case 'vehicle':
            result = await Model.create({
                registration_number: `REG${uniqueSuffix}`,
                vehicle_type: 'Truck',
                make: `Make_${uniqueSuffix}`,
                model: `Model_${uniqueSuffix}`,
                technical_characteristics: 'Specs',
                status: 'available'
            }, { transaction: conn });
            break;
        case 'order': {
            const clients = await Client.findAll({ attributes: ['client_id'], limit: 10, raw: true, transaction: conn });
            const drivers = await Driver.findAll({ attributes: ['driver_id'], limit: 10, raw: true, transaction: conn });
            const vehicles = await Vehicle.findAll({ attributes: ['vehicle_id'], limit: 10, raw: true, transaction: conn });
            if (!clients.length || !drivers.length || !vehicles.length) throw new Error('No available data for ORM order insert');

            const clientId = clients[Math.floor(Math.random()*clients.length)].client_id;
            const driverId = drivers[Math.floor(Math.random()*drivers.length)].driver_id;
            const vehicleId = vehicles[Math.floor(Math.random()*vehicles.length)].vehicle_id;

            result = await Model.create({
                client_id: clientId,
                driver_id: driverId,
                vehicle_id: vehicleId,
                route_from: 'CityA',
                route_to: 'CityB',
                planned_departure_time: new Date(),
                planned_arrival_time: new Date(Date.now() + 2*60*60*1000),
                cargo_details: 'Goods',
                order_status: 'planned'
            }, { transaction: conn });
            break;
        }
        case 'tripdetails': {
            const orders = await Order.findAll({ attributes: ['order_id'], limit: 10, raw: true, transaction: conn });
            if (!orders.length) throw new Error('No available order for tripdetails insert (ORM)');
            const orderId = orders[Math.floor(Math.random()*orders.length)].order_id;

            result = await Model.create({
                order_id: orderId,
                actual_trip_status: 'completed',
                fuel_cost: 50.00,
                other_expenses: 5.00,
                total_cost: 55.00,
                revenue: 100.00
            }, { transaction: conn });
            break;
        }
        case 'triplog': {
            const trips = await TripDetails.findAll({ attributes: ['trip_id'], limit: 10, raw: true, transaction: conn });
            if (!trips.length) throw new Error('No available trip for triplog insert (ORM)');
            const tripId = trips[Math.floor(Math.random()*trips.length)].trip_id;

            result = await Model.create({
                trip_id: tripId,
                log_time: new Date(),
                status: 'OK',
                notes: `Test log ${uniqueSuffix}`
            }, { transaction: conn });
            break;
        }
        default: throw new Error('Invalid table name');
    }

    const end = performance.now();
    return { time: end - start, id: result[idKey] };
}

async function averageInsertORM(conn, table, repeats) {
    const times = [];
    const insertedIds = [];

    for (let i = 0; i < repeats; i++) {
        const { time, id } = await testOrmInsert(conn, table);
        times.push(time);
        insertedIds.push(id);
    }

    const avg = times.reduce((a,b)=>a+b,0)/times.length;
    console.log(`Average INSERT time for ${table} (ORM) (${repeats} times): ${avg.toFixed(3)} ms`);
    return insertedIds.filter(id => id !== undefined);
}

// -------------------- UPDATE (ORM) --------------------
async function testOrmUpdate(conn, table, id) {
    const start = performance.now();
    const { Model, idKey } = models[table];

    let updateData = {};
    switch (table) {
        case 'client': updateData = { phone: `9${Math.floor(Math.random() * 1000000000)}` }; break;
        case 'driver': updateData = { email: `driver${Math.floor(Math.random() * 10000)}@mail.com` }; break;
        case 'vehicle': {
            const vehicle = await Model.findByPk(id, { attributes: ['status'], raw: true, transaction: conn });
            updateData = { status: vehicle.status === 'available' ? 'busy' : 'available' };
            break;
        }
        case 'order': updateData = { route_from: 'CityX', route_to: 'CityY' }; break;
        case 'tripdetails': updateData = { actual_trip_status: 'delayed' }; break;
        case 'triplog': updateData = { status: 'Updated', notes: 'Updated test log (ORM)' }; break;
    }

    await Model.update(updateData, { where: { [idKey]: id }, transaction: conn });
    return performance.now() - start;
}

async function averageUpdateTimeORM(conn, table, ids, repeats) {
    const times = [];
    for (let i = 0; i < repeats; i++) {
        const id = ids[Math.floor(Math.random() * ids.length)];
        times.push(await testOrmUpdate(conn, table, id));
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average UPDATE time for ${table} (ORM) (${repeats} times): ${avg.toFixed(3)} ms`);
}

// -------------------- DELETE (ORM) --------------------
async function testOrmDelete(conn, table, id) {
    const start = performance.now();
    const { Model, idKey } = models[table];

    await Model.destroy({ where: { [idKey]: id }, transaction: conn });
    return performance.now() - start;
}

async function averageDeleteTimeORM(conn, table, ids) {
    const times = [];
    for (const id of ids) {
        times.push(await testOrmDelete(conn, table, id));
    }
    const avg = times.reduce((a,b)=>a+b,0)/times.length;
    console.log(`Average DELETE time for ${table} (ORM): ${avg.toFixed(3)} ms`);
}

// -------------------- Execution Wrapper (ORM) --------------------
async function runInsertUpdateDeleteTestORM(rl, ask) {
    const table = await ask('Enter table name for INSERT/UPDATE/DELETE (ORM): ');
    if (!Object.keys(models).includes(table)) { 
        console.log('Invalid table!');
        return;
    }

    try {
        await sequelize.transaction(async (t) => { 
            console.log(`\n[ORM] Inserting 100 records into ${table}...`);
            const insertedIds = await averageInsertORM(t, table, 100);

            console.log(`\n[ORM] Updating inserted records in ${table}...`);
            await averageUpdateTimeORM(t, table, insertedIds, insertedIds.length);

            console.log(`\n[ORM] Deleting inserted records from ${table}...`);
            await averageDeleteTimeORM(t, table, insertedIds);

            console.log('For a clean database, forcing transaction rollback...');
            throw new Error('Forced Rollback');
        });

    } catch (e) {
        if (e.message !== 'Forced Rollback') {
            console.log('[ORM] Error occurred, transaction rolled back:', e.message);
        } else {
            console.log('[ORM] Transaction rolled back, database unchanged.');
        }
    }
}


async function menuORM() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (question) => new Promise(resolve => rl.question(question, resolve));

    let exit = false;

    while (!exit) {
        console.log('\n=== Database Performance Test Menu (ORM Only) ===');
        console.log('1. SELECT test (ORM)');
        console.log('2. INSERT -> UPDATE -> DELETE test (ORM)');
        console.log('0. Exit');

        const choice = await ask('Choose an option: ');

        switch (choice) {
            case '1': {
                const limitInput = await ask('Enter LIMIT for SELECT (ORM): ');
                const limit = parseInt(limitInput);
                await averageSelectAllTablesORM(isNaN(limit) ? 10 : limit, 100);
                break;
            }

            // case '2': {
            //     let joinType = (await ask('Enter JOIN type (INNER/LEFT/RIGHT): ')).trim().toUpperCase();
            //     const allowed = ['INNER', 'LEFT', 'RIGHT'];
            //     if (!allowed.includes(joinType)) {
            //         console.log(' Invalid JOIN type. Using default INNER JOIN.');
            //         joinType = 'INNER';
            //     }

            //     const limitInput = await ask('Enter LIMIT for JOIN (ORM): ');
            //     const limit = parseInt(limitInput);
            //     await averageJoinTimeORM(joinType, isNaN(limit) ? 10 : limit, 5);
            //     break;
            //}

            case '3': {
                await runInsertUpdateDeleteTestORM(rl, ask);
                break;
            }

            case '0': {
                exit = true;
                break;
            }

            default:
                console.log('Invalid choice!');
        }
    }

    rl.close();
    process.exit(0);
}


menuORM();
