const net = require('net'),
      config = require('./config'),
      Device = require('./device'),
      mysql = require('mysql'),
      sock_tls = require('./sg_socket_tls'),
      moment = require('moment'),
      ioClient = require('socket.io-client')('http://localhost:5000');

class App {
    constructor(ip, direction){
        this.ip = ip;
        this.direction = direction;
        this.run();
        this.con = mysql.createConnection(config.mysql);
    }

    run() {
        this.device = new Device(this.ip);
        this.socketActive = false;

        sock_tls.event.on('run', ()=>{              //основной цикл , run срабатывает после подключения трех сокетов
            let pass1 = [],
                pass2 = [],
                cardList1 = [],
                cardList2 = [];

            sock_tls.event.on('code', (code, dev, doc, unix_time)=>{
                if((code==117) || (code==17) || (code==118) || (code==16) || (code==31) || (code==114)){
                    if(dev==this.direction){      //если направление равно нулю
                        this.moveControl(pass1, code, cardList1, doc, "OUT", unix_time);
                        console.log("move1: ", pass1);
                    } else {
                        this.moveControl(pass2, code, cardList2, doc, "IN", unix_time);
                        console.log("move2: ", pass2);
                    }
                } else {
                    console.log("code 1 or 112");
                }
            });

            // setInterval(()=>{this.uploadDoc()}, 3600000);   //выгрузка карт в турникет из бд раз в час
            // this.uploadDoc();   //выгрузка после запуска турникетов
            // this.device.setDataTime();

            // device.downloadDoc();           //получить список карт на пк
            // device.uploadDoc();             //выгрузка карт в турникет
            // device.getDocCount();            //получить колво карт в турникете
            //  device.getDeviceState();
            this.device.setAccessMode(0x01, 0x01);           //(номер считывателя, режим)
            this.device.setAccessMode(0x02, 0x01);
        })
    }

    async moveControl(pass, code, cardList, doc, IO, unix_time=0) {
        pass.push(code);
        cardList.push(doc);
        let timestamp = moment.unix(unix_time).format('YYYY-MM-DD HH:mm:ss');
        console.log("pass: ", pass);
        console.log('cardList: ', cardList);
        
        for(let i = 0; i<pass.length;i++) {
            if(pass[i]==117 & pass[i+1]==17 & pass[i+2]==118) {
                let docTemp = 0;
                for(let i = cardList.length-1; i>0; i--) {
                    if(cardList[i]!=0) {
                        docTemp = cardList[i];
                    }
                }
                console.log("Точно прошел", this.ip);
                console.log("docTemp: ", docTemp);
                let query = "INSERT INTO `event` (`id_card`, `io`, `mov`, `ip_turniket`, `event_date`) VALUES ((SELECT id FROM card WHERE number='"+docTemp+"' AND actuality = 1), '"+IO+"', 'yes', '"+this.ip+"', '"+timestamp+"')";
                console.log(query)
                try {
                    await this.sqlQuery(this.con, query);
                    pass.length=0;
                    cardList.length=0;
                }catch(e){
                    console.log(e);
                }
                ioClient.emit('newEvent', {card: docTemp, io: IO, pass: 'yes', date: timestamp});
            }

            if(pass[i]==117 & pass[i+1]==16 & pass[i+2]==118) {
                let docTemp = 0;
                for(let i = cardList.length-1; i>0; i--) {
                    if(cardList[i]!=0) {
                        docTemp = cardList[i];
                    }
                }
                console.log("Точно не прошел", this.ip);
                let query = "INSERT INTO `event` (`id_card`, `io`, `mov`, `ip_turniket`, `event_date`) VALUES ((SELECT id FROM card WHERE number='"+docTemp+"' AND actuality = 1), '"+IO+"', 'no', '"+this.ip+"', '"+timestamp+"')";
                console.log(query)

                try {
                    await this.sqlQuery(this.con, query);
                    pass.length=0;
                    cardList.length=0;
                }catch(e){
                    console.log(e);
                }
                ioClient.emit('newEvent', {card: docTemp, io: IO, pass: 'no', date: timestamp});
            }

            if((pass[i]==16 & pass[i+1]==31 & pass[i+2]==31 & pass[i+3]==118)) {
                let docTemp = 0;
                for(let i = cardList.length-1; i>0; i--) {
                    if(cardList[i]!=0) {
                        docTemp = cardList[i];
                    }
                }
                console.log("Не прошел, с задержкой", this.ip);
                let query = "INSERT INTO `event` (`id_card`, `io`, `mov`, `ip_turniket`, `event_date`) VALUES ((SELECT id FROM card  WHERE number='"+docTemp+"' AND actuality = 1), '"+IO+"', 'no', '"+this.ip+"', '"+timestamp+"')";
                console.log(query)

                try {
                    await this.sqlQuery(this.con, query);
                    pass.length=0;
                    cardList.length=0;
                }catch(e){
                    console.log(e);
                }
                ioClient.emit('newEvent', {card: docTemp, io: IO, pass: 'no', date: timestamp});
            }

            if((pass[i]==114 & pass[i+1]==118)) {
                let docTemp = 0;
                for(let i = cardList.length-1; i>0; i--) {
                    if(cardList[i]!=0) {
                        docTemp = cardList[i];
                    }
                }
                console.log("Долго проходил", this.ip);
                let query = "INSERT INTO `event` (`id_card`, `io`, `mov`, `ip_turniket`, `event_date`) VALUES ((SELECT id FROM card WHERE number='"+docTemp+"' AND actuality = 1), '"+IO+"', 'yes', '"+this.ip+"', '"+timestamp+"')";
                console.log(query)

                try {
                    await this.sqlQuery(this.con, query);
                    pass.length=0;
                    cardList.length=0;
                }catch(e){
                    console.log(e);
                }
                ioClient.emit('newEvent', {card: docTemp, io: IO, pass: 'yes', date: timestamp});
            }
            if((pass[i]==117 & pass[i+1]==17 & pass[i+2]==31  & pass[i+3]==31  & pass[i+4]==118)) {
                let docTemp = 0;
                for(let i = cardList.length-1; i>0; i--) {
                    if(cardList[i]!=0) {
                        docTemp = cardList[i];
                    }
                }
                console.log("Прошел с задержкой", this.ip);
                let query = "INSERT INTO `event` (`id_card`, `io`, `mov`, `ip_turniket`, `event_date`) VALUES ((SELECT id FROM card WHERE number='"+docTemp+"' AND actuality = 1), '"+IO+"', 'yes', '"+this.ip+"', '"+timestamp+"')";
                console.log(query)
              
                try {
                    await this.sqlQuery(this.con, query);
                    pass.length=0;
                    cardList.length=0;
                }catch(e){
                    console.log(e);
                }
                ioClient.emit('newEvent', {card: docTemp, io: IO, pass: 'yes', date: timestamp});
            }

            if((pass[i]==16 & pass[i+1]==31 & pass[i+2]==31  & pass[i+3]==16 & pass[i+4]==31 & pass[i+5]==31 & pass[i+6]==16)) {    //нужно гдето записывать это событие
                console.log("Датчик не работает", this.ip);
                let docTemp = 0;
                for(let i = cardList.length-1; i>0; i--) {
                    if(cardList[i]!=0) {
                        docTemp = cardList[i];
                    }
                }
                pass.length=0;
                cardList.length=0;
            }

            if((pass[i]==117 & pass[i+1]==16 & pass[i+2]==114  & pass[i+3]==114  & pass[i+4]==31 & pass[i+5]==31 & pass[i+6]==118)) {
                console.log("Прошел с долгой задержкой", this.ip);
                let docTemp = 0;
                for(let i = cardList.length-1; i>0; i--) {
                    if(cardList[i]!=0) {
                        docTemp = cardList[i];
                    }
                }

                let query = "INSERT INTO `event` (`id_card`, `io`, `mov`, `ip_turniket`, `event_date`) VALUES ((SELECT id FROM card WHERE number='"+docTemp+"' AND actuality = 1), '"+IO+"', 'yes', '"+this.ip+"', '"+timestamp+"')";
                console.log(query)
                
                try {
                    await this.sqlQuery(this.con, query);
                    pass.length=0;
                    cardList.length=0;
                }catch(e){
                    console.log(e);
                }
                ioClient.emit('newEvent', {card: docTemp, io: IO, pass: 'yes', date: timestamp});
            }
        }
    }

    uploadDoc(){
	    this.device.uploadDoc();
    }

    sendToMon() {
        try {
            let req = sock_tls.sendToMon(this.sockets[1][0]);
            console.log("send: ", this.hexEncode(req));
            this.sockets[3][0].write(req);
        } catch(e){
            console.log(e)
        }
    }

    setTime() {                                      //установка времени во все устройства
        console.log("Set time")
        let isCrypt = false
        let key = (isCrypt) ? sock_tls.genCryptKey() : ''

        for(let i = 0; i<this.sockets[0].length;i++){
            (async ()=>{
                let req = sock_tls.setDataTime(this.sockets[1][i], key);
                try {        
                    this.sockets[0][i].write(req)
                } catch(e){
                    console.log(e)
                }
            })()
        }
    }

    sqlConnection(con) {
        return new Promise(function (resolve, reject) {
            con.connect(function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    console.log("Connected to mysql");
                    resolve();
                }
            })
        })
    }

    sqlQuery(con, query) {
        return new Promise(function (resolve, reject) {
            con.query(query, function (err, result) {
                if (err) reject(err);
                resolve(result);
            })
        })
    }




}

module.exports.App = App
module.exports.uploadDoc = App.uploadDoc