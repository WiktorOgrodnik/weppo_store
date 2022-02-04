'use strict';
import { add, getWithCondition, update } from './dbconnect.js';
import { ApiException } from './exceptions.js';

export class Order {
    constructor(user_id, perdata_id, other_adress_id, order_date, end_date, delivery_id, payment_id, is_paid, status_id, price) {
        this.order_id = null;
        this.user_id = user_id;
        this.perdata_id = perdata_id;
        this.other_adress_id = other_adress_id;
        this.order_date = order_date;
        this.end_date = end_date;
        this.delivery_id = delivery_id;
        this.payment_id = payment_id;
        this.is_paid = is_paid;
        this.status_id = status_id;
        this.price = price;
    }

    async add() {
        try {
            return await (add('orders'))(Object.keys(this).map(k => this[k]).slice(1));
        } catch (error) {
            error.message = `Order.add(): ${error.message}`;
            throw error;
        }
    }

    async save() {
        try {
            await (update('orders'))(Object.keys(this).map(k => this[k]));
        } catch (error) {
            error.message = `Order.save(): ${error.message}`;
            throw error;
        }
    }

    static async addToOrder(order_id, product_id, ammount) {
        try {
            const order = await this.load(order_id);
            if (order.status_id > 1) throw new ApiException('This is not a cart!');
            try {
                const products = await (getWithCondition('products'))([product_id]);

                try {
                    const products_orders = await (getWithCondition('products_orders3'))([order_id, product_id])
                    if (products_orders?.rows?.length > 0) {
                        const price = products_orders.rows[0].price;
                        const o_ammount = products_orders.rows[0].ammount;
                        await (update('products_orders'))([order_id, product_id, +o_ammount + +ammount, price]);
                    } else {
                        const price = products.rows[0].price;
                        await (add('products_orders'))([product_id, order_id, ammount, price])
                    }
                } catch (error) {
                    error.message = `Can not load products_order (addtToOrder): ${error.status_id}`;
                    throw error;
                }
            } catch (error) {
                error.message = `Can not load product (addtToOrder): ${error.status_id}`;
                throw error;
            }
        } catch (error) {
            error.message = `Can not load order (addtToOrder): ${error.status_id}`;
            throw error;
        }
    }

    static async load(order_id) {
        let order = {};
        try {
            order = await (getWithCondition('orders'))([order_id]);
        } catch (error) {
            error.message = `Order.load(): ${error.message}`;
            throw error;
        } finally {
            order = order.rows[0];
            order = new Order(order.user_id, order.perdata_id, order.other_address_id, order.order_date, order.end_date, order.delivery_id, order.payment_id, order.is_paid, order.status_id, order.price);
            order.order_id = order_id;
        }
        return order;
    }
}