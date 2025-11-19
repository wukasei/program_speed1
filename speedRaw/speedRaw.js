import pool from './database.js';
import { performance } from 'perf_hooks';
import readline from 'readline';


// -------------------- SELECT --------------------
async function testRawSelect(table, limit) {
    const start = performance.now();
    limit = parseInt(limit); 
    if (isNaN(limit) || limit <= 0) limit = 10; 

    const [rows] = await pool.execute(`SELECT * FROM ${table} LIMIT ${limit}`);
    const end = performance.now();

    console.log(`SELECT ${table} | LIMIT ${limit} | Time: ${(end - start).toFixed(3)} ms`);
    return end - start;
}
async function averageSelectAllTables(limit, repeats) {
    const tables = ['client', 'driver', 'vehicle', '`order`', 'tripdetails'];
    const results = [];

    for (const table of tables) {
        const times = [];
        for (let i = 0; i < repeats; i++) {
            times.push(await testRawSelect(table, limit));
        }
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        results.push({ table, avg });
        console.log(`Average SELECT time for ${table}: ${avg.toFixed(3)} ms`);
    }

    console.log('\nSummary SELECT:');
    results.forEach(r => console.log(`${r.table.padEnd(12)} | Average: ${r.avg.toFixed(3)} ms`));
}

// -------------------- JOIN --------------------
async function testRawJoin(type, limit) {
    const start = performance.now();

    limit = parseInt(limit);
    if (isNaN(limit) || limit <= 0) limit = 10; 

    const [rows] = await pool.execute(`
        SELECT 
          o.order_id,
          c.name_ AS client_name,
          CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
          v.registration_number AS vehicle,
          td.trip_id as tripdetails,
          tl.login_id as triplog,
          o.route_from,
          o.route_to,
          o.order_status
        FROM \`order\` o
        ${type} JOIN client c ON o.client_id = c.client_id
        ${type} JOIN driver d ON o.driver_id = d.driver_id
        ${type} JOIN vehicle v ON o.vehicle_id = v.vehicle_id
        ${type} JOIN tripdetails td ON o.order_id = td.order_id
        ${type} JOIN triplog tl ON o.order_id = tl.order_id
        LIMIT ${limit};
    `);

    const end = performance.now();
    console.log(`${type} JOIN | LIMIT ${limit} | Time: ${(end - start).toFixed(3)} ms`);
    return end - start;
}


async function averageJoinTime(type, limit, repeats) {
    const times = [];
    for (let i = 0; i < repeats; i++) {
        times.push(await testRawJoin(type, limit));
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average ${type} JOIN time (${repeats} times): ${avg.toFixed(3)} ms`);
}

// -------------------- INSERT --------------------
async function testRawInsert(conn, table) {
    const start = performance.now();
    let result;
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    switch(table) {
        case 'client':
            [result] = await conn.execute(`
                INSERT INTO client (client_type, name_, contact_person, phone, email)
                VALUES (
                    'TestType',
                    'Client_${uniqueSuffix}',
                    'Person_${uniqueSuffix}',
                    CONCAT('9', FLOOR(RAND()*1000000000)),
                    CONCAT('test${uniqueSuffix}@mail.com')
                )
            `);
            break;

        case 'driver':
            [result] = await conn.execute(`
                INSERT INTO driver (first_name, last_name, license_number, license_category, email, phone)
                VALUES (
                    'Driver_${uniqueSuffix}',
                    'Last_${uniqueSuffix}',
                    'LN${uniqueSuffix}',
                    'B',
                    CONCAT('driver${uniqueSuffix}@mail.com'),
                    CONCAT('9', FLOOR(RAND()*1000000000))
                )
            `);
            break;

        case 'vehicle':
            [result] = await conn.execute(`
                INSERT INTO vehicle (registration_number, vehicle_type, make, model, technical_characteristics, status)
                VALUES (
                    'REG${uniqueSuffix}',
                    'Truck',
                    'Make_${uniqueSuffix}',
                    'Model_${uniqueSuffix}',
                    'Specs',
                    'available'
                )
            `);
            break;

        case 'order': {
            const [clients] = await conn.execute(`SELECT client_id FROM client LIMIT 10`);
            const [drivers] = await conn.execute(`SELECT driver_id FROM driver LIMIT 10`);
            const [vehicles] = await conn.execute(`SELECT vehicle_id FROM vehicle LIMIT 10`);
            if (!clients.length || !drivers.length || !vehicles.length) {
                throw new Error('No available client/driver/vehicle for order insert');
            }
            const clientId = clients[Math.floor(Math.random()*clients.length)].client_id;
            const driverId = drivers[Math.floor(Math.random()*drivers.length)].driver_id;
            const vehicleId = vehicles[Math.floor(Math.random()*vehicles.length)].vehicle_id;

            [result] = await conn.execute(`
                INSERT INTO \`order\` (client_id, driver_id, vehicle_id, route_from, route_to, planned_departure_time, planned_arrival_time, cargo_details, order_status)
                VALUES (?, ?, ?, 'CityA', 'CityB', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'Goods', 'planned')
            `, [clientId, driverId, vehicleId]);
            break;
        }

        case 'tripdetails': {
            const [orders] = await conn.execute(`SELECT order_id FROM \`order\` LIMIT 10`);
            if (!orders.length) throw new Error('No available order for tripdetails insert');
            const orderId = orders[Math.floor(Math.random()*orders.length)].order_id;

            [result] = await conn.execute(`
                INSERT INTO tripdetails (order_id, actual_trip_status, fuel_cost, other_expenses, total_cost, revenue)
                VALUES (?, 'completed', 50.00, 5.00, 55.00, 100.00)
            `, [orderId]);
            break;
        }

        case 'triplog': {
            const [trips] = await conn.execute(`SELECT trip_id FROM tripdetails LIMIT 10`);
            if (!trips.length) throw new Error('No available trip for triplog insert');
            const tripId = trips[Math.floor(Math.random()*trips.length)].trip_id;

            [result] = await conn.execute(`
                INSERT INTO triplog (trip_id, log_time, status, notes)
                VALUES (?, NOW(), 'OK', 'Test log ${uniqueSuffix}')
            `, [tripId]);
            break;
        }

        default:
            throw new Error('Invalid table name');
    }

    const end = performance.now();
    return { time: end - start, id: result.insertId };
}


async function averageInsertRaw(conn, table, repeats) {
    const times = [];
    const insertedIds = [];

    for (let i = 0; i < repeats; i++) {
        const { time, id } = await testRawInsert(conn, table);
        times.push(time);
        insertedIds.push(id);
    }

    const avg = times.reduce((a,b)=>a+b,0)/times.length;
    console.log(`Average INSERT time for ${table} (${repeats} times): ${avg.toFixed(3)} ms`);
    return insertedIds;
}


// -------------------- UPDATE --------------------
async function testRawUpdate(conn, table, id) {
    const start = performance.now();

    if (table === 'client') {
        await conn.execute(`UPDATE client SET phone = CONCAT('9', FLOOR(RAND() * 1000000000)) WHERE client_id = ?`, [id]);
    }
    if (table === 'driver') {
        await conn.execute(`UPDATE driver SET email = CONCAT('driver', FLOOR(RAND()*10000), '@mail.com') WHERE driver_id = ?`, [id]);
    }
    if (table === 'vehicle') {
        await conn.execute(`UPDATE vehicle SET status = IF(status='available','busy','available') WHERE vehicle_id = ?`, [id]);
    }
    if (table === 'order') {
        await conn.execute(`UPDATE \`order\` SET route_from='CityX', route_to='CityY' WHERE order_id = ?`, [id]);
    }
    if (table === 'tripdetails') {
        await conn.execute(`UPDATE tripdetails SET actual_trip_status='delayed' WHERE trip_id = ?`, [id]);
    }
    if (table === 'triplog') {
        await conn.execute(`UPDATE triplog SET status='Updated', notes='Updated test log' WHERE log_id = ?`, [id]);
    }

    const end = performance.now();
    return end - start;
}


async function averageUpdateTime(conn, table, ids, repeats) {
    const times = [];
    for (let i = 0; i < repeats; i++) {
        const id = ids[Math.floor(Math.random() * ids.length)];
        times.push(await testRawUpdate(conn, table, id)); 
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average UPDATE time for ${table} (${repeats} times): ${avg.toFixed(3)} ms`);
}


// -------------------- DELETE --------------------
async function testRawDelete(conn, table, id) {
    const start = performance.now();

    if (table === 'client') {
        await conn.execute(`DELETE FROM client WHERE client_id = ?`, [id]);
    } else if (table === 'driver') {
        await conn.execute(`DELETE FROM driver WHERE driver_id = ?`, [id]);
    } else if (table === 'vehicle') {
        await conn.execute(`DELETE FROM vehicle WHERE vehicle_id = ?`, [id]);
    } else if (table === 'order') {
        await conn.execute(`DELETE FROM \`order\` WHERE order_id = ?`, [id]);
    } else if (table === 'tripdetails') {
        await conn.execute(`DELETE FROM tripdetails WHERE trip_id = ?`, [id]);
    } else if (table === 'triplog') {
        await conn.execute(`DELETE FROM triplog WHERE log_id = ?`, [id]);
    }

    const end = performance.now();
    return end - start;
}

async function averageDeleteTime(conn, table, ids) {
    const times = [];
    for (const id of ids) {
        times.push(await testRawDelete(conn, table, id));
    }
    const avg = times.reduce((a,b)=>a+b,0)/times.length;
    console.log(`Average DELETE time for ${table}: ${avg.toFixed(3)} ms`);
}



async function menu() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    function ask(question) { return new Promise(resolve => rl.question(question, resolve)); }

    let exit = false;

    while (!exit) {
        console.log('\n=== Database Performance Test Menu ===');
        console.log('1. SELECT test');
        console.log('2. JOIN test');
        console.log('3. INSERT -> UPDATE -> DELETE test');
        console.log('0. Exit');

        const choice = await ask('Choose an option: ');

        switch(choice) {
            case '1': {
                const limit = parseInt(await ask('Enter LIMIT for SELECT: '));
                await averageSelectAllTables(limit, 5);
                break;
            }
            case '2': {
                const joinType = await ask('Enter JOIN type (INNER/LEFT/RIGHT): ');
                const limit = parseInt(await ask('Enter LIMIT for JOIN: '));
                await averageJoinTime(joinType.toUpperCase(), limit, 5);
                break;
            }
            case '3': {
                const table = await ask('Enter table name for INSERT/UPDATE/DELETE: ');
                if (!['client','driver','vehicle','`order`','tripdetails','triplog'].includes(table)) {
                    console.log('Invalid table!');
                    break;
                }

                const conn = await pool.getConnection();
                try {
                    await conn.beginTransaction();

                    console.log(`\nInserting 100 records into ${table}...`);
                    const insertedIds = await averageInsertRaw(conn, table, 100);

                    console.log(`\nUpdating inserted records in ${table}...`);

                    const updateTimes = [];
                    for (const id of insertedIds) {
                        updateTimes.push(await testRawUpdate(conn, table, id));
                    }
                    console.log(`\nUpdating inserted records in ${table}...`);
                    await averageUpdateTime(conn, table, insertedIds, 5);

                    console.log(`\nDeleting inserted records from ${table}...`);
                    await averageDeleteTime(conn, table, insertedIds);

                    await conn.rollback();
                    console.log('Transaction rolled back, database unchanged.');

                } catch (e) {
                    await conn.rollback();
                    console.log('Error occurred, transaction rolled back:', e.message);
                } finally {
                    conn.release();
                }
                break;
            }

            case '0': {
                console.log("Goodbye!")
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


menu();
