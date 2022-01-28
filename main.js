'use strict';

import express from 'express';
import { get, getWithCondition } from './dbconnect.js';
import cookieParser from 'cookie-parser';
import { initApi } from './api.js';

Object.prototype.isEmpty = function () {
    return Object.keys(this).length == 0;
}

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./static'));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

initApi(app);

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
        let products = [];
        let cart_value = 0;
        let cart_count = 0;

        if (req.cookies.cart_id) {
            const cart = await (getWithCondition('products_orders2'))([req.cookies.cart_id]);
            products = cart.rows;

            for (let k of products) {
                cart_value += k.ammount * k.price;
                cart_count += k.ammount;
            }
        }

        res.render('cart', {categories: categories.rows, cart: products, cart_value: cart_value, cart_count: cart_count});
    })();
});

app.get('/contact', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        res.render('contact', {categories: categories.rows});
    })();
});

app.get('/order', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        res.render('order', {categories: categories.rows});
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

app.get('/search', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        const products = !req.query.isEmpty() && req.query.query != '' ? await (getWithCondition('products_search'))([`%${req.query.query}%`]) : {rows: []};
        res.render('search', {categories: categories.rows, query: req.query.query, products: products.rows});
    })();
});

app.listen(port, () => {
    console.log(`Weppo-store listening at port ${port}`);
});
