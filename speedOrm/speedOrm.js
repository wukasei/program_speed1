import  Driver  from './modules/driver.js';
import  Client  from './modules/client.js';
import  Order  from './modules/order.js';
import { performance } from 'perf_hooks';

async function testOrmSelect(table, limit) {
    const start = performance.now();
    const rows = await table.findAll({limit});
    const end = performance.now();

    const time = end - start;
    console.log(`ORM: table ${table.name} | LIMIT ${limit} | Time: ${time.toFixed(3)} ms`);
    return time;
}

async function testOrmJoin(limit) {
    const start = performance.now(); 

    const rows = await Order.findAll({
        include: Client,
        limit
    });

    const end = performance.now();
    const time = end - start;

    console.log(`Orm join Order-Client | limit ${limit} | Time: ${time.toFixed(3)} ms`);
    return time;
}


// async function avarageValueOrm(limit, repeats) {
//     const times =[];

//     for(let i = 0; i < repeats; i++){
//         const answer = await testOrmJoin(limit);
//         times.push(answer);
//     }

//     const avg = times.reduce((a, b) => a + b, 0) / times.length;
//     console.log(`Average ORM execution time (${repeats} times): ${avg.toFixed(3)}ms`);
// }

// avarageValueOrm( 50, 100);

async function avarageValueOrm(table, limit, repeats) {
    const times =[];

    for(let i = 0; i < repeats; i++){
        const answer = await testOrmSelect(table,limit);
        times.push(answer);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average ORM execution time (${repeats} times): ${avg.toFixed(3)}ms`);
}

avarageValueOrm(Driver, 50, 100);