'use strict';

import express from 'express';
import { get, getWithCondition, add, update } from './dbconnect.js';
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
        let order_id = undefined;

        if (!req.cookies.cart_id) {
            const order = await (add('orders'))([null, null, null, null, null, null, null, 0, 1, null]);
            order_id = order.rows[0].order_id;

            (add('products_orders'))([product_id, order_id, ammount, product_price]);
            res.cookie('cart_id', order_id);
        } else {
            order_id = req.cookies.cart_id;

            const products_orders = await (getWithCondition('products_orders'))([order_id]);
            let products_orders_ammount = 0;
            let products_orders_price = 0;

            let exists = false;
            for (let i of products_orders.rows) {
                if (i.product_id == product_id) {
                    exists = true;
                    products_orders_ammount = i.ammount;
                    products_orders_price = i.price;
                    break;
                }
            }

            if (exists) {
                (update('products_orders'))([order_id, product_id, +products_orders_ammount + +ammount, products_orders_price]);
            } else {
                (add('products_orders'))([product_id, order_id, ammount, product_price]);
            }

        }

        res.setHeader('Content-type', 'text/plain; charset=utf8;');
        res.end('Ok');
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

        if (req.cookies.cart_id) {
            const cart = await (getWithCondition('products_orders2'))([req.cookies.cart_id]);

            products = cart.rows;
        }
        

        res.render('cart', {categories: categories.rows, cart: products});


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
