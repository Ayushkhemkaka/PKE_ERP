import { pool } from "../configs/dbConn.js"

const find = (req,res) =>{

    console.log(req.params)
    let colList = ['booknumber' , 'date' ,'name' ,'lorryNumber' ,'item' ,'paymentstatus' ,'totalamount' ,'dueamount','paidamount']
    let col = colList.join(",")

    let conList = []
    let valList = []
    if(req.query.bookNumber != null && req.query.bookNumber !== ""){
        conList.push("booknumber = $" + (conList.length+1))
        valList.push(req.query.booknumber)
    }
    if(req.query.date != null && req.query.date !== ""){
        conList.push("date = $" + (conList.length+1))
        valList.push(req.query.date)
    }
    if(req.query.name != null && req.query.name !== ""){
        conList.push("name = $" + (conList.length+1))
        valList.push(req.query.name)
    }
    if(req.query.lorryNumber != null && req.query.lorryNumber !== ""){
        conList.push("lorryNumber = $" + (conList.length+1))
        valList.push(req.query.lorryNumber)
    }
    if(req.query.paymentStatus != null && req.query.paymentStatus !== ""){
        conList.push("paymentstatus = $" + (conList.length+1))
        valList.push(req.query.paymentStatus)
    }
    if(req.query.item != null && req.query.item !== ""){
        conList.push("item = $" + (conList.length+1))
        valList.push(req.query.item)
    }
    let con = conList.join(" and ")
    console.log(conList)
    let query = conList.length === 0? 'SELECT '+col+' FROM self.entry': 'SELECT '+col+' FROM self.entry WHERE ' +con
    console.log(query)
    pool.connect((err, client, release) => {
        if (err) {
            return console.error('Error acquiring client', err.stack)
        }
        client.query(query,valList,(err, result) => {
            release()
            if (err) {
                return console.error('Error executing query', err.stack)
            }
            console.log(result.rows)
            let response = result.rows;
            for(let i of response){
                let date = i['date'];
                let dateIST = date.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}).split(",")[0];
                console.log(dateIST)
                i['date'] = dateIST
            }
            console.log()
            res.send(result.rows)
        })
    })
}

export {find}