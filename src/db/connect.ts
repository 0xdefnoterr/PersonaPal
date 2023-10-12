import * as mongoose from "mongoose";
import * as dotenv from "dotenv";

export async function connect() {
    dotenv.config();
    try {
        let client = await mongoose.connect(process.env.MONGO_URL, {
            dbName: "m_bot",
        });
        console.log(`Connected to MongoDB as ${client.connection.host}`);
        return client;
    } catch (err) {
        console.error(err);
    }
}