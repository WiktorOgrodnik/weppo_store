'use strict';

import express from 'express';
import { db, rebuiltDatabase } from './dbconnect.js'

const app = express();
const port = process.env.PORT || 3000;

rebuiltDatabase();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./static'));
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.render('index', {});
});

app.get('/settings', (req, res) => {
    res.render('settings', {});
});

app.get('/account', (req, res) => {
    res.render('account', {});
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});