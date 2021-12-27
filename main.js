'use strict';

import express from 'express';
import { client } from './dbconnect.js'
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use("/static", express.static(path.resolve("views", "static")));
app.use(express.urlencoded({extended: true}));

//client.connect();

app.get('/*', (req, res) => {
    res.sendFile(path.resolve("views", "index.html"))
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});