const cp = require('child_process'),
    config = require('./config'),
    mysql = require('mysql');

(async ()=>{
    let con = mysql.createConnection(config.mysql);
    let query = "SELECT ip, direction FROM config_turniket";
    let result;
    while(1){
        try{
            result = await sqlQuery(con, query);    //повторяем попытки пока данные не будут получены
        }catch(e){
            await timeout(5000);
            console("Нет доступа к базе данных")
            continue;
        }
        if(result.length) break;
        await timeout(5000);
    }
 
        let children1 = cp.fork(__dirname+"/server.js");
        children1.send({'ip': "172.16.62.43", 'direction': 1});   //передаем данные в экземпляры
 

})();

function sqlQuery(con, query) {
    return new Promise(function (resolve, reject) {
        con.query(query, function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}

function timeout(ms) {
    return new Promise(resolve=> {
        setTimeout(()=>{
            resolve();
        }, ms)
    })
}
