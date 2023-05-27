import format from "pg-format"
import { pool } from "../configs/dbConn.js"

const insert = (req,res) =>{
    
    let reqBody = req.body.body

    const cols = "bookNumber,date,name,site,lorryNumber,item,measurementUnit,quantity,rate,amount,discount,freight,taxPercent,taxAmount,totalAmount,paymentStatus,dueAmount,paidAmount,lastUpdate,createdDate,lastUpdatedBy,createdBy"

    let valueList = []
    for(var i in reqBody){
        console.log(typeof(reqBody[i]),"   ",reqBody[i])
        console.log(typeof(reqBody[i]))
        let data = typeof(reqBody[i]) !== "string"? reqBody[i] : "'"+reqBody[i]+"'";
        data = reqBody[i] === null ? 0 : data
        console.log(typeof(data),"   ",data)
        valueList.push(data)
    }
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var now = date+' '+time;
    valueList.push("'"+now+"'")
    valueList.push("'"+now+"'")
    valueList.push("'Ayush'")
    valueList.push("'Ayush'")

    let value = valueList.join(',')
    let query =  format('INSERT INTO self.entry('+cols+') VALUES (' +value+")")
    console.log(query)
    pool.connect((err, client, release) => { 
        if (err) {
            console.error('Error acquiring client', err.stack)
            res.send(err.message)
            return
        }
        client.query(query,(err, result) => {
            release()
            if (err) {
                console.error('Error executing query', err.stack)
                res.send(err.message)
                return
            }
            console.log(result)
            res.send("Data Inserted Successfully")
        })
    })
}

export {insert}