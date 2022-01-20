'use strict';

import express from 'express';
import { get, getWithCondition, add, update, deleted } from './dbconnect.js';
import cookieParser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./static'));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/api/mainpage', (req, res) => {
    (async () => {
        const products = await (get('products'))();

        res.setHeader('Content-type', 'application/json; charset=utf8;');
        res.end(JSON.stringify(products.rows))
    })();
});

app.post('/api/addToCart/:id/:ammount', (req, res) => {
    (async () => {
        const product_id = req.params.id;
        const ammount = req.params.ammount;

        const product = await (getWithCondition('products'))([product_id]);
        const product_price = product.rows[0].price;

        if (!req.cookies.cart_id) {
            const order = await (add('orders'))([null, null, null, null, null, null, null, 0, 1, 0]);
            const order_id = order.rows[0].order_id;

            (add('products_orders'))([product_id, order_id, ammount, product_price]);
            res.cookie('cart_id', order_id);
        } else {
            const order_id = req.cookies.cart_id;
            const products_orders = await (getWithCondition('products_orders3'))([order_id, product_id]);

            if (products_orders.rows.length) (update('products_orders'))([order_id, product_id, +products_orders.rows[0].ammount + +ammount, products_orders.rows[0].price]);
            else (add('products_orders'))([product_id, order_id, ammount, product_price]);
        }

        res.setHeader('Content-type', 'text/plain; charset=utf8;');
        res.end('Ok');
    })();
});

app.delete('/api/deleteFromCart/:id/:ammount', (req, res) => {
    (async () => {
        const product_id = req.params.id;
        const ammount = req.params.ammount;
        const order_id = req.cookies.cart_id
        let response = 'less';

        if (order_id) {
            const product_order = await (getWithCondition('products_orders3'))([order_id, product_id]);

            if (product_order.rows.length && product_order.rows[0].ammount > ammount) {
                (update('products_orders'))([order_id, product_id, product_order.rows[0].ammount - ammount, product_order.rows[0].price]);
            } else if (product_order.rows.length && product_order.rows[0].ammount == ammount) {
                (deleted('products_orders'))([order_id, product_id]);
                response = 'none';
            }
        } 

        res.setHeader('Content-type', 'text/plain; charset=utf8;');
        res.end(response);
    })();
});

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
