import { get, getWithCondition } from './dbconnect.js';

export async function cartModule(req) {

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

    return {cart: products, cart_value: cart_value, cart_count: cart_count};
}