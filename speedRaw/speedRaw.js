import pool from './database.js';
import { performance } from 'perf_hooks';

async function testRawSelect(table, limit) {
    const start = performance.now();
    const [rows] = await pool.execute(`select * from ${table} limit ${limit}`)
    const end = performance.now();

    const time = end - start;
    console.log(`Raw SQL: table ${table} | LIMIT ${limit} | Time: ${(end - start).toFixed(3)} ms`);
    return time;
}

async function testRawJoin(limit){
    const start = performance.now();
    const [rows] = await pool.execute(`
        select o.order_id, o.route_from, o.route_to, o.planned_departure_time,
               o.planned_arrival_time, o.order_status,
               c.name_, c.contact_person, c.phone
        from \`order\` o
        join client c on o.client_id = c.client_id
        limit ?
    `, [limit]);
    const end = performance.now();
    const time = end - start;

     console.log(`Raw SQL JOIN | LIMIT ${limit} | Time: ${time.toFixed(3)} ms`);
    return time;
}

async function avarageValueRaw(table, limit, repeats) {
    const times =[];

    for(let i = 0; i < repeats; i++){
        const answer = await testRawSelect(table, limit);
        times.push(answer);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average Raw execution time (${repeats} times): ${avg.toFixed(3)}ms`);
}

avarageValueRaw('driver', 50, 100);