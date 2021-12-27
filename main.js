'use strict';

import express from 'express';
import { db, rebuiltDatabase } from './dbconnect.js'

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./static'));
app.use(express.urlencoded({extended: true}));

rebuiltDatabase();

app.get('/', (req, res) => {
    res.render('index', {});
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});