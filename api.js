import { get, getWithCondition, update, deleted } from './dbconnect.js';
import { ApiException } from './exceptions.js';
import { addToCart, deleteFromCart, getUsersCartId } from './modules.js';

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
            const user_id = req.session.user_id;
            let cart_id = req.cookies.cart_id;

            try {
                cart_id = await addToCart(cart_id, user_id, product_id, ammount);

                if (!req.session.loggedin) res.cookie('cart_id', cart_id);
        
                res.setHeader('Content-type', 'text/plain; charset=utf8;');
                res.end('Ok');
            } catch (error) {
                if (error instanceof ApiException) {
                    res.setHeader('Content-type', 'text/plain; charset=utf8;');
                    res.end(error.message);
                } else {
                    console.error (`Podczas dodawania artykułów do koszyka wszystapił błąd: ${error.message}, zapytanie: ${error.query}`);
                    res.setHeader('Content-type', 'text/plain; charset=utf8;');
                    res.end('Problems with loading data');
                }
            }
        })();
    });
    
    app.delete('/api/deleteFromCart/:id/:ammount', (req, res) => {
        (async () => {
            const product_id = req.params.id;
            const ammount = req.params.ammount;
            const user_id = req.session.user_id;
            let cart_id = req.cookies.cart_id;
            let response = 'less'; 

            try {
                response = await deleteFromCart(cart_id, user_id, product_id, ammount);
            } catch (error) {
                if (error instanceof ApiException) {
                    response = error.message;
                } else {
                    console.error (`Podczas usuwania artykułów z koszyka wystapił błąd: ${error.message}, zapytanie: ${error.query}`);
                    response = 'Problems with loading data';
                }
            } finally {
                if (response == 'nonenone') {
                    res.clearCookie('cart_id');
                    response = 'none';
                }
            }
    
            res.setHeader('Content-type', 'text/plain; charset=utf8;');
            res.end(response);
        })();
    });
}