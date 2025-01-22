import { MongoClient } from "mongodb";
import fs from 'fs';
import readline from 'readline';

const uri = "mongodb://localhost:27017/";

const mongoClient = new MongoClient(uri);
let db = null;
let collection = {
    trends: null,
    userinfo: null
};

async function connectDb() {
    try {
        console.log('MongoDB: Connecting to DB...');
        db = mongoClient.db('blackcoffer');
        collection.trends = db.collection('trends');
        collection.userinfo = db.collection('userinfo');

        await collection.trends.deleteMany({});
        await insertData(collection.trends);

        console.log('MongoDB: Connected to DB');
    }
    catch (e) {
        console.error(`MongoDB: DB Connection Error: ${e}`);
    }
}


async function insertData(trends) {
    try {
        const rl = readline.createInterface({
            input: fs.createReadStream('../docs/jsondata.json'),
            crlfDelay: Infinity
        });
    
        const batchSize = 100;
        let buffer = [];
        let objString = ``;
        let addFlag = false;
        for await (let line of rl) {
            line = line.trim();
            let openIndex = line.indexOf('{');
            let closeIndex = line.indexOf('}');
            
            if (openIndex > -1) {
                objString += line;
                addFlag = true;
            }
            else if(addFlag) {
                objString += line;
            }

            if (closeIndex > -1) {
                if(objString.endsWith(',')) {
                    objString = objString.slice(0, -1);
                }
                
                let obj = JSON.parse(objString);
                buffer.push(obj);

                // console.log(obj);
                // console.log('\n', objString, '\n');

                objString = ``;
                addFlag = false;
            }

            if (buffer.length >= batchSize) {
                console.log('Inserting batch of records: ' + buffer.length);
                await trends.insertMany(buffer);
                buffer = [];
            }
        }
        if (buffer.length > 0) { // Insert remaining records
            console.log('Inserting remaining batch of records: ' + buffer.length);
            await trends.insertMany(buffer);
        }
    } catch (error) {
        console.log('Error in inserting data: ', error);
    }
}



export { connectDb, mongoClient, db, collection };