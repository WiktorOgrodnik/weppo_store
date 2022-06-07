'use strict';

import express from 'express';
import { add, get, getWithCondition, search, secret, update } from './dbconnect.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bcrypt from 'bcryptjs/dist/bcrypt.js';
import { initApi } from './api.js';
import { cartModule, getUsersCartId, orderFormModule } from './modules.js'
import { validators } from './validators.js';
import { authorize } from './authorize.js';
import { Categories } from './categories.js';
import { User } from './user.js';

Object.prototype.isEmpty = function () {
    return Object.keys(this).length == 0;
}

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(session({
    secret: secret,
    resave: true,
    saveUninitialized: true
}));

app.use(express.static('./static'));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.json());

initApi(app);

app.get('/', async (req, res) => {

    const categories = await Categories.load();
    const products = await (get('products'))();
    res.render('index', {products: products.rows, categories: categories.rows});
});

/**
 * Orders
 */

app.get('/order', async (req, res) => {
    const cart_id = req.cookies.cart_id;
    const user_id = req.session.user_id;
    const categories = await Categories.load();
    const data = await orderFormModule(cart_id, user_id);
    let email = '';
    let tel = '';

    if (user_id) {
        const user = await (getWithCondition('users'))([user_id]);
        if (user?.rows?.length > 0) {
            email = perdata.rows[0].email;
            tel = perdata.rows[0].tel;
        }
    }

    if (data.cart_count == 0) res.redirect('/cart');
    else res.render('order', Object.assign(data, {email: email, tel: tel, categories: categories.rows}));
});

app.post('/order', async (req, res) => {
    
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

        const data = await orderFormModule(req.cookies.cart_id, req.session.user_id);

        res.render('order', Object.assign(data, oldData, {error_message: error_message}));
    } else {
        
        /*Validation completed*/
        const adress_id = await (add('addresses')([address_line_1, address_line_2, country, postal_code, city]));
        const perdata_id = await (add('personal_data')([name, pesel, nip, regon, adress_id.rows[0].adress_id]));
            
        let user_id;
        let cart_id = req.cookies.cart_id;

        if (!req.session.user_id) {
            user_id = await (add('users')([email, tel, 'none', 0, 0, null, null]));
            await (add('users_roles')([user_id.rows[0].user_id, 1]));
            user_id = user_id.rows[0].user_id;
        } else {
            user_id = req.session.user_id;
            cart_id = await getUsersCartId(user_id);
        }
            
        const cart = await (getWithCondition('orders')([cart_id]));
        console.log(cart);
        const order = cart.rows[0];

        order.user_id = user_id;
        order.perdata_id = perdata_id.rows[0].perdata_id;
        order.order_date = Date.now();
        order.delivery_id = delivery_id;
        order.payment_id = payment_id;
        order.status_id = 2;
            
        const payment_price = await (getWithCondition('payment_methods')([payment_id]));
        const delivery_price = await (getWithCondition('deliveries')([delivery_id]));
        const cart_price = (await cartModule(req.cookies.cart_id, req.session.user_id, 'cart')).cart_value;

        order.price = cart_price + payment_price.rows[0].payment_price + delivery_price.rows[0].delivery_price;

        await update('orders')([cart_id, order.user_id, order.perdata_id, order.other_address_id, order.order_date, order.end_date, order.delivery_id, order.payment_id, order.is_paid, order.status_id, order.price]);

        res.clearCookie('cart_id');
        res.redirect(`/orders/${order.order_id}`);
    }
});

// Need some try-catch
app.get('/orders/:id', async (req, res) => {

    const categories = await Categories.load();
    const cart = await cartModule(req.params.id, null, 'order');
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

            const users_roles = await (getWithCondition('users_roles'))([user.rows[0].user_id]);

            if (users_roles.rows[0].role_id > 1 && user.rows[0].user_id !== req.session.user_id)
                res.render('bill', {categories: categories.rows, error_message: 'Nie ma takiego zamówienia, sprawdź czy numer zamówienia jest prawidłowy'});
            else
                res.render('bill', Object.assign({categories: categories.rows}, cart, data));
        } else {
            res.render('bill', {categories: categories.rows, error_message: 'Nieoczekiwany błąd serwera'});
        }
    } else {
        res.render('bill', {categories: categories.rows, error_message: 'Nie ma takiego zamówienia, sprawdź czy numer zamówienia jest prawidłowy'});
    }
});

app.get('/order-success', async (req, res) => {
    const orderid = req.query.id;
    const categories = await Categories.load();

    res.render('order-success', {categories: categories.rows, order_id: orderid});
});

/**
 * Cart
 */

app.get('/cart', async (req, res) => {
    const categories = await Categories.load();
    const cart = await cartModule(req.cookies.cart_id, req.session.user_id, 'cart');
    res.render('cart', Object.assign({categories: categories.rows}, cart));
});

/**
 * Displaying products and search
 */

app.get('/product/:id', async (req, res) => {
    const categories = await Categories.load();
    const products = await (getWithCondition('products'))([req.params.id]);
    res.render('product', {product: products.rows[0], categories: categories.rows});
});

app.get('/category/:id', async (req, res) => {
    const categories = await Categories.load();
    const products = await (getWithCondition('categories_products'))([req.params.id]);
    res.render('category', {products: products.rows, categories: categories.rows});
});

app.get('/search', async (req, res) => {
    const categories = await Categories.load();
    const order_selected = !req.query.isEmpty() && req.query.orderby ? req.query.orderby : 'alpha';

    const order_by = [
        {name: 'A-Z', short_name: 'alpha', sql: 'ORDER BY table5.product_name ASC;'},
        {name: 'Z-A', short_name: 'revalpha', sql: 'ORDER BY table5.product_name DESC;'},
        {name: 'Cena (od najmniejszych)', short_name: 'pricelow', sql: 'ORDER BY table5.price ASC;'},
        {name: 'Cena (od największych)', short_name: 'pricetop', sql: 'ORDER BY table5.price DESC;'}
    ];

    const products = !req.query.isEmpty() && req.query.query ? await (search('products_search', order_by.find(obj => obj.short_name == order_selected).sql))([`%${req.query.query}%`]) : {rows: []};
    res.render('search', {categories: categories.rows, query: req.query.query, orderby: order_selected, products: products.rows, order_by: order_by});
});

/**
 * Other
 */

app.get('/settings', authorize(3), async (req, res) => {
    const categories = await Categories.load();
    res.render('settings', {categories: categories.rows});
}); 

app.get('/account', authorize(2, 3), async (req, res) => {
    const categories = await Categories.load();
    res.render('account', {categories: categories.rows});
});

app.get('/login', authorize(1), async (req, res) => {
    const categories = await Categories.load();
    res.render('login', {categories: categories.rows, returnUrl: req.query.returnUrl});
});

app.post('/login', authorize(1), async (req, res) => {
    const email = req.body.email;
    const passwd = req.body.password;
    const returnUrl = req.body.returnUrl ?? '/';
    const categories = await Categories.load();
    if (email && passwd) {
        try {
            const user = await User.getUserByEmailAndPasswd(email, passwd);
            req.session.loggedin = true;
            req.session.user_id = user.user_id;
            req.session.user = user;

            user.updateLastLogin(Date.now());
            if (!await getUsersCartId(user.user_id)) {
                user.addCart(req.cookies.cart_id);
            }

            res.clearCookie('cart_id');
            res.redirect(returnUrl);
        } catch (error) {
            console.error(error.message);
            res.render('login', {categories: categories.rows, returnUrl: returnUrl, serverMessage: 'Email lub hasło są nieprawidłowe!'});
        }
    } else {
        res.render('login', {categories: categories.rows, returnUrl: returnUrl, serverMessage: 'Wypełnij e-mail i hasło!'});
    }
});

app.get('/logout', (req, res) => {
    req.session.loggedin = false;
    req.session.user_id = 0;
    res.redirect('/');
});

app.post('/register', async (req, res) => {

    const email = req.body.email;
    const passwd = req.body.passwd;
    const passwd2 = req.body.passwd2;
    const tel = req.body.tel;

    let valid = true;
    let message = 'ok';

    const emails = await (getWithCondition('email_register'))([email]);
    if (emails?.rows.length > 0) {
        valid = false;
        message = 'Ten email jest już zajęty';
    }

    const telephones = await (getWithCondition('tel_register'))([tel]);
    if (telephones?.rows.length > 0) {
        valid = false;
        message = 'Ten nr telefonu jest już zajęty';
    }

    if (passwd !== passwd2) {
        valid = false;
        message = 'Podane hasła nie są identyczne';
    }

    if (!validators.validatePassword(passwd)) {
        valid = false;
        message = 'Hasło musi mieć: co najmniej 12 znaków i zawierać: małe litery, duże litery, cyfry';
    }

    if (!validators.validateTelephone(tel)) {
        valid = false;
        message = 'Nr telefonu nie jest poprawny!';
    }

    if (!validators.validateEmail(email)) {
        valid = false;
        message = 'Email nie jest poprawny!';
    }

    if (valid) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(passwd, salt);

        const user_inserted = await (add('users')([email, tel, hash, 1, 1, null, null]));
        if (user_inserted?.rows?.length > 0) {
            const user_id = user_inserted.rows[0].user_id;
            await (add('users_roles')([user_id, 2])); //normal user permissions
                
            req.session.registered = true;

            res.redirect('/registration-successful');
        } else {
            console.error('Something went wrong!');
            res.end('Something went wrong!')
        }
    } else {
        const categories = await Categories.load();
        res.render('login', {categories: categories.rows, serverMessageReg: message, regemail: email, regtel: tel});
    }
});

app.get('/registration-successful', async (req, res) => {
    if (req.session.registered) {
        req.session.registered = false;
        const categories = await Categories.load();
        res.render('registration_successful', {categories: categories.rows});
    } else {
        res.redirect('/');
    }
});

app.get('/contact', async (req, res) => {
    const categories = await Categories.load();
    res.render('contact', {categories: categories.rows});
});

app.get('/purchase_history', authorize(2, 3), async (req, res) => {

    function getDateTime(isoDate) {
        let date = isoDate.getDate();
        let month = isoDate.getMonth() + 1;
    
        if (date < 10) date = '0' + date;
        if (month < 10) month = '0' + month;
    
        return `${date}-${month}-${isoDate.getFullYear()}`;
    }


    const categories = await Categories.load();
    const orders = await (getWithCondition('orders4'))([req.session.user_id]);
    const status = await (get('statuses'))();

    const carts = [];
    const pictures = [];

    for (let index of orders.rows) {
        carts.push(await (cartModule(index.order_id, null, 'order')));
    }

    for(let k of carts) {
        pictures.push(k.cart.map(l => l.image));
    }

    let i = 0;
    for (let k of orders.rows) {
        k.order_date = getDateTime(new Date(k.order_date));
        k.pictures = pictures[i++];
    }

    for (let k of orders.rows) {
        console.log(k.pictures instanceof Array);
    }

    res.render('purchase_history', {categories: categories.rows, orders: orders.rows, status: status.rows});
});

app.get('/more-permissions-needed', async (req, res) => {
    const categories = await Categories.load();
    res.render('more_permissions_needed', {categories: categories.rows});
});

app.listen(port, () => {
    console.log(`Weppo-store listening at port ${port}`);
});
