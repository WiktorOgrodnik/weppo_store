import { get, getWithCondition, add, update, deleted } from './dbconnect.js';
import { getUsersCartId } from './modules.js';

export function initApi(app) {

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
    
            if (!req.cookies.cart_id && !req.session.loggedin) {
                const order = await (add('orders'))([null, null, null, null, null, null, null, 0, 1, 0]);
                const order_id = order.rows[0].order_id;
    
                (add('products_orders'))([product_id, order_id, ammount, product_price]);
                res.cookie('cart_id', order_id);
            } else if (req.session.loggedin) {
                const order_id = await getUsersCartId(req.session.user_id);
                /// MODULARYZOWAĆ TO <- Do modułu koszyka
                if (order_id) {
                    const products_orders = await (getWithCondition('products_orders3'))([order_id, product_id]);
    
                    if (products_orders.rows.length) (update('products_orders'))([order_id, product_id, +products_orders.rows[0].ammount + +ammount, products_orders.rows[0].price]);
                    else (add('products_orders'))([product_id, order_id, ammount, product_price]);
                } else {
                    const order = await (add('orders'))([req.session.user_id, null, null, null, null, null, null, 0, 1, 0]);
                    const order_id = order.rows[0].order_id;

                    (add('products_orders'))([product_id, order_id, ammount, product_price]);
                }
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
            let order_id = req.cookies.cart_id;
            let response = 'less';

            if (req.session.loggedin) {
                order_id = await getUsersCartId(req.session.user_id);
            }
    
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
}