import { get, getWithCondition } from './dbconnect.js';

export async function cartModule(cart_id, type) {

    let products = [];
    let cart_value = 0;
    let cart_count = 0;
    let cart = {};

    if (cart_id) {
        if (type == 'cart') {
            cart = await (getWithCondition('products_orders2'))([cart_id]);
        }
        else if (type == 'order') {
            cart = await (getWithCondition('products_orders4'))([cart_id]);
        }
            
        products = cart.rows;
        if (products?.length) {
            for (let k of products) {
                cart_value += k.ammount * k.price;
                cart_count += k.ammount;
            }
        }
    }

    return {cart: products, cart_value: cart_value, cart_count: cart_count};
}

export async function orderFormModule(cart_id) {
    const categories = await (get('categories'))();
    const cart = await cartModule(cart_id, 'cart');

    const payment_methods = await (get('payment_methods')());
    const deliveries = await (get('deliveries')());

    return Object.assign({categories: categories.rows, payment_methods: payment_methods.rows, deliveries: deliveries.rows}, cart);
}