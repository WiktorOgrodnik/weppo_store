import Client from "pg/lib/client.js";

export const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: 'weppo_store',
    password: process.env.PASSWORD,
    port: process.env.PGPORT
});