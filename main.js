'use strict';

import express from 'express';
import { add, get, getWithCondition, search, update } from './dbconnect.js';
import cookieParser from 'cookie-parser';
import { initApi } from './api.js';
import { cartModule, orderFormModule } from './modules.js'
import { validators } from './validators.js';

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

/**
 * Orders
 */

app.get('/order', (req, res) => {
    (async () => {
        const data = await orderFormModule(req.cookies.cart_id);

        if (data.cart.cart_count == 0) res.redirect('/cart');
        else res.render('order', data);
    })();
});

app.post('/order', (req, res) => {
    
    (async () => {
        let valid = true;
        let error_message = 'ok';
        
        const delivery_id = req.body.delivery;
        const payment_id = req.body.payment;
        const name = req.body.name;
        const address_line_1 = req.body.adress;
        const postal_code = req.body.postal_code;
        const city = req.body.city;
        const email = req.body.email;
        const tel = req.body.tel;

        // Obecnie nie użyte w formularzu
        const address_line_2 = null;
        const country = 'Polska'
        const pesel = null;
        const nip = null;
        const regon = null;

        if (!validators.validateEmail(email)) {error_message = 'Adres email nie jest prawidłowy'; valid = false;}
        if (!validators.validateDeliveryId(delivery_id)) {error_message = 'Przekazano nieistniejący typ dostawy'; valid = false;}
        if (!validators.validatePaymentId(payment_id)) {error_message = 'Przekazano nieistniejący typ płatności'; valid = false;}
        if (!validators.validateNotEmpty(name)) {error_message = 'Nazwa użytkownika nie może być pusta'; valid = false;}
        if (!validators.validateNotEmpty(address_line_1)) {error_message = 'Pierwsza linia adresu nie może być pusta'; valid = false;}
        if (!validators.validateNotEmpty(city)) {error_message = 'Nazwa miasta nie może być pusta'; valid = false;}
        if (!validators.validatePostalCode(postal_code)) {error_message = 'Format kodu pocztowego nie przypomina: xx-xxx'; valid = false;}
        if (!validators.validateTelephone(tel)) {error_message = 'Numer telefonu jest nieprawidłowy'; valid = false;}

        if (!valid) {
            const oldData = {
                name: name,
                address: address_line_1,
                postal_code: postal_code,
                city: city,
                email: email,
                tel: tel
            }

            const data = await orderFormModule(req.cookies.cart_id);

            res.render('order', Object.assign(data, oldData, {error_message: error_message}));
        } else {
        
            /*Validation completed*/
            const adress_id = await (add('addresses')([address_line_1, address_line_2, country, postal_code, city]));
            const perdata_id = await (add('personal_data')([name, pesel, nip, regon, adress_id.rows[0].adress_id]));
            const user_id = await (add('users')([email, tel, 'none', 0, 0, null, null]));
            await (add('users_roles')([user_id.rows[0].user_id, 1]));

            const cart = await (getWithCondition('orders')([req.cookies.cart_id]));
            const order = cart.rows[0];

            order.user_id = user_id.rows[0].user_id;
            order.perdata_id = perdata_id.rows[0].perdata_id;
            order.order_date = Date.now();
            order.delivery_id = delivery_id;
            order.payment_id = payment_id;
            order.status_id = 2;
            
            const payment_price = await (getWithCondition('payment_methods')([payment_id]));
            const delivery_price = await (getWithCondition('deliveries')([delivery_id]));
            const cart_price = (await cartModule(req.cookies.cart_id, 'cart')).cart_value;

            order.price = cart_price + payment_price.rows[0].payment_price + delivery_price.rows[0].delivery_price;

            await update('orders')([req.cookies.cart_id, order.user_id, order.perdata_id, order.other_address_id, order.order_date, order.end_date, order.delivery_id, order.payment_id, order.is_paid, order.status_id, order.price]);

            res.clearCookie('cart_id');
            res.redirect(`/orders/${order.order_id}`);
        }
    })();
});

// Need some try-catch
app.get('/orders/:id', (req, res) => {
    (async () => {
        const categories = await (get('categories'))();
        const cart = await cartModule(req.params.id, 'order');
        const order = await (getWithCondition('orders2'))([req.params.id]);

        if (order?.rows?.length) {
            const deliveries = await (getWithCondition('deliveries'))([order.rows[0].delivery_id]);
            const payment_methods = await (getWithCondition('payment_methods'))([order.rows[0].payment_id]);
            const user = await (getWithCondition('users'))([order.rows[0].user_id]);
            const perdata = await (getWithCondition('personal_data'))([order.rows[0].perdata_id]);
            if (perdata?.rows?.length) {
                const address = await (getWithCondition('addresses'))([perdata.rows[0].adress_id]);

                const data = {
                    delivery_name: deliveries.rows[0].delivery_name,
                    payment_method: payment_methods.rows[0].payment_name,
                    name: perdata.rows[0].personal_name,
                    email: user.rows[0].email,
                    tel: user.rows[0].tel,
                    address_line_1: address.rows[0].line_adress_1,
                    postal_code: address.rows[0].postal_code,
                    city: address.rows[0].city
                }

                res.render('bill', Object.assign({categories: categories.rows}, cart, data));

            } else {
                res.render('bill', {categories: categories.rows, error_message: 'Nieoczekiwany błąd serwera'});
            }
        } else {
            res.render('bill', {categories: categories.rows, error_message: 'Nie ma takiego zamówienia, sprawdź czy numer zamówienia jest prawidłowy'});
        }
    })();
});

app.get('/order-success', (req, res) => {
    (async () => {
        const orderid = req.query.id;
        const categories = await (get('categories'))();
        res.render('order-success', {categories: categories.rows, order_id: orderid});
    })();
});

/**
 * Cart
 */

app.get('/cart', (req, res) => {
    (async () => {

        const categories = await (get('categories'))();
        const cart = await cartModule(req.cookies.cart_id, 'cart');

        res.render('cart', Object.assign({categories: categories.rows}, cart));
    })();
});

/**
 * Displaying products and search
 */

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
        const order_selected = !req.query.isEmpty() && req.query.orderby ? req.query.orderby : 'alpha';

        const order_by = [
            {name: 'A-Z', short_name: 'alpha', sql: 'ORDER BY table5.product_name ASC;'},
            {name: 'Z-A', short_name: 'revalpha', sql: 'ORDER BY table5.product_name DESC;'},
            {name: 'Cena (od najmniejszych)', short_name: 'pricelow', sql: 'ORDER BY table5.price ASC;'},
            {name: 'Cena (od największych)', short_name: 'pricetop', sql: 'ORDER BY table5.price DESC;'}
        ];

        const products = !req.query.isEmpty() && req.query.query ? await (search('products_search', order_by.find(obj => obj.short_name == order_selected).sql))([`%${req.query.query}%`]) : {rows: []};
        res.render('search', {categories: categories.rows, query: req.query.query, orderby: order_selected, products: products.rows, order_by: order_by});
    })();
});

/**
 * Other
 */

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

app.listen(port, () => {
    console.log(`Weppo-store listening at port ${port}`);
});
