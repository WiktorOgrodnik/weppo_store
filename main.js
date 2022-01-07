'use strict';

import express from 'express';
import { get, getWithCondition } from './dbconnect.js'

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./static'));
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    (async () => {
        const products = await (get('products'))();
        const categories = await (get('categories'))();
        res.render('index', {products: products.rows, categories: categories.rows});
    })();
});

app.get('/settings', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        res.render('settings', {categories: categories.rows});
    })();
}); 

app.get('/account', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        res.render('account', {categories: categories.rows});
    })();
});

app.get('/cart', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        res.render('cart', {categories: categories.rows});
    })();
});

app.get('/contact', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        res.render('contact', {categories: categories.rows});
    })();
});

app.get('/purchase_history', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        res.render('purchase_history', {categories: categories.rows});
    })();
});

app.get('/product/:id', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        const products = await (getWithCondition('products'))([req.params.id]);
        res.render('product', {product: products.rows[0], categories: categories.rows});
    })();
});

app.get('/category/:id', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        const products = await (getWithCondition('categories_products'))([req.params.id]);
        res.render('category', {products: products.rows, categories: categories.rows});
    })();
});

app.listen(port, () => {
    console.log(`Weppo-store listening at port ${port}`);
});
