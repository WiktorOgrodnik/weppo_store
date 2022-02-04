import { get, getWithCondition, update } from './dbconnect.js';
import { Order } from './order.js';

export async function getUsersCartId(user_id) {
    const cart_id = await (getWithCondition('orders3'))([user_id]);
    if (cart_id?.rows?.length > 0) {
        return cart_id.rows[0].order_id;
    }
}

export async function cartModule(cart_id, user_id, type) {

    let products = [];
    let cart_value = 0;
    let cart_count = 0;
    let cart = {};

    if (user_id) {
        cart_id = await getUsersCartId(user_id);
    }

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

export async function addToCart(cart_id, user_id, product_id, ammount) {
    if (user_id) cart_id = await getUsersCartId(user_id);
    else user_id = null;
    
    if (!cart_id) {
        const order = new Order(user_id, null, null, null, null, null, null, 0, 1, 0);
        try {
            cart_id = await order.add();
            cart_id = cart_id.rows[0].order_id;

            (update)
        } catch (error) {
            error.message = `Can not add new cart: ${error.message};`;
            throw error;
        }
    }

    try {
        await Order.addToOrder(cart_id, product_id, ammount);
    } catch (error) {
        throw error;
    } 

    return cart_id;
}

export async function deleteFromCart(cart_id, user_id, product_id, ammount) {
    if (user_id) cart_id = await getUsersCartId(user_id);

    if (!cart_id) {
        try {
            cart_id = await order.add();
            cart_id = cart_id.rows[0].order_id;

            await Order.addToOrder(cart_id, product_id, ammount);
        } catch (error) {
            error.message = `Can not add new cart: ${error.message};`;
            throw error;
        }
    }

    return cart_id;
}

export async function orderFormModule(cart_id, user_id) {
    const categories = await (get('categories'))();
    const cart = await cartModule(cart_id, user_id, 'cart');

    const payment_methods = await (get('payment_methods')());
    const deliveries = await (get('deliveries')());

    return Object.assign({categories: categories.rows, payment_methods: payment_methods.rows, deliveries: deliveries.rows}, cart);
}