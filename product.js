'use strict';

import { getWithCondition } from "./dbconnect";

export class Product {
    constructor(product_name, price, disconted_price, ammount, description, image_src) {
        this.product_id = null;
        this.product_name = product_name;
        this.price = price;
        this.disconted_price = disconted_price;
        this.ammount = ammount;
        this.description = description;
        this.image_src = image_src;
    }

    static async load(product_id) {
        let product = {};
        try {
            product = await (getWithCondition('product'))([product_id]);
        } catch (error) {
            error.message = `Product.load(): ${error.message}`;
            throw error;
        } finally {
            product = product.rows[0];
            product = new Product(product.name, product.price, product.price, product.disconted_price, product.ammount, product.description, product.image);
            product.product_id = product_id;
        }

        return product;
    }
}