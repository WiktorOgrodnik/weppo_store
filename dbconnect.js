import Pool from 'pg/lib/client.js';
import { PoolException } from './exceptions.js';

const env = process.env.DB_ENVIRONMENT || "development";

const db_data = {
    // development: 'postgres://postgres:password@localhost:5432/weppo_store',
    development: 'postgres://postgres:142327@localhost:5432/weppo_store',
    production: process.env.DATABASE_URL
};

const express_secret = {
    development: 'Y~R(l1OmOk+9neAG*!A<',
    production: process.env.SESSION_SECRET
}

export const db = db_data[env];
export const secret = express_secret[env];

/* Code to create tables - don't use it */

const tables = [
    'addresses',
    'roles',
    'products',
    'deliveries',
    'payment_methods',
    'statuses',
    'categories',
    'personal_data',
    'users',
    'orders',
    'tags',
    'products_orders',
    'users_roles',
    'categories_products',
    'tags_products'
];

const createTableQueries = {
    addresses: `addresses (
        adress_id BIGSERIAL PRIMARY KEY,
        line_adress_1 VARCHAR(200) NOT NULL,
        line_adress_2 VARCHAR(200),
        country VARCHAR(50) NOT NULL,
        postal_code VARCHAR(6) NOT NULL,
        city VARCHAR(50) NOT NULL
    );`,
    roles: `roles (
        role_id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
    );`,
    products: `products (
        product_id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price INT NOT NULL,
        disconted_price INT,
        ammount INT,
        description TEXT,
        image VARCHAR(100)
    );`,
    deliveries: `deliveries (
        delivery_id SERIAL PRIMARY KEY,
        delivery_name VARCHAR(50) NOT NULL,
        delivery_price INT NOT NULL
    );`,
    payment_methods: `payment_methods (
        payment_method_id SERIAL PRIMARY KEY,
        payment_name VARCHAR(50) NOT NULL,
        payment_price INT NOT NULL
    );`,
    statuses: `statuses (
        status_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
    );`,
    categories: `categories (
        category_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
    );`,
    personal_data: `personal_data (
        perdata_id BIGSERIAL PRIMARY KEY,
        personal_name VARCHAR(100) NOT NULL,
        pesel VARCHAR(11),
        nip VARCHAR(10),
        regon VARCHAR(14),
        adress_id INT,
        FOREIGN KEY (adress_id) REFERENCES addresses (adress_id)
    );`,
    users: `users (
        user_id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        tel VARCHAR(30) NOT NULL,
        passwd VARCHAR(255) NOT NULL,
        can_login BIT(1) NOT NULL,
        is_verified BIT(1) NOT NULL,
        perdata_def_id INT,
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        FOREIGN KEY (perdata_def_id) REFERENCES personal_data (perdata_id)
    );`,
    orders: `orders (
        order_id uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
        user_id INT,
        perdata_id INT,
        other_address_id INT,
        order_date TIMESTAMP,
        end_date TIMESTAMP,
        delivery_id INT,
        payment_id INT,
        is_paid BIT(1) NOT NULL,
        status_id INT NOT NULL,
        price INT,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (perdata_id) REFERENCES personal_data (perdata_id),
        FOREIGN KEY (other_address_id) REFERENCES addresses (adress_id),
        FOREIGN KEY (delivery_id) REFERENCES deliveries (delivery_id),
        FOREIGN KEY (payment_id) REFERENCES payment_methods (payment_method_id),
        FOREIGN KEY (status_id) REFERENCES statuses (status_id)
    );`,
    tags: `tags (
        tag_id SERIAL PRIMARY KEY,
        tag_name VARCHAR(100) NOT NULL
    );`,
    users_roles: `users_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        grant_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (role_id) REFERENCES roles (role_id)
    );`,
    products_orders: `products_orders (
        product_id INT NOT NULL,
        order_id uuid NOT NULL,
        ammount INT NOT NULL,
        price INT NOT NULL,
        PRIMARY KEY (product_id, order_id),
        FOREIGN KEY (product_id) REFERENCES products (product_id),
        FOREIGN KEY (order_id) REFERENCES orders (order_id)
    );`,
    categories_products: `categories_products (
        product_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (product_id, category_id),
        FOREIGN KEY (product_id) REFERENCES products (product_id),
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
    );`,
    tags_products: `tags_products (
        product_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (product_id, tag_id),
        FOREIGN KEY (product_id) REFERENCES products (product_id),
        FOREIGN KEY (tag_id) REFERENCES tags (tag_id)
    );`
};

/* Manipulating data */

function queryBuilder(query) {
    return async function (req) {
        const client = new Pool({connectionString: db, idleTimeoutMillis: 100});
        let toReturn = {};

        await client.connect();
        try {
            toReturn = await client.query(query, req);
        } catch (err) {
            throw new PoolException(query, err.stack);
        } finally {
            client.end();
        }

        return toReturn;
    }
}

/* Create and drop databases */

async function deleteDatabases() {
    
    for (let k of tables)
        await (queryBuilder(`DROP TABLE IF EXISTS ${k} CASCADE`))();
}

async function createDatabases() {

    for (let k of tables)
        await (queryBuilder(`CREATE TABLE IF NOT EXISTS ${createTableQueries[k]}`))();
}

export async function rebuiltDatabase() {
    
    await (queryBuilder('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))();
    await deleteDatabases();
    await createDatabases();
}

/* Insert data functions */

const addQuery = {
    products: 'INSERT INTO products VALUES (DEFAULT, $1, $2, $3, $4, $5, $6);',
    categories: 'INSERT INTO categories VALUES (DEFAULT, $1);',
    categories_products: 'INSERT INTO categories_products VALUES ($1, $2);',
    orders: 'INSERT INTO orders VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING order_id;',
    statuses: 'INSERT INTO statuses VALUES (DEFAULT, $1);',
    products_orders: 'INSERT INTO products_orders VALUES ($1, $2, $3, $4);',
    tags: 'INSERT INTO tags VALUES (DEFAULT, $1);',
    tags_products: 'INSERT INTO tags_products VALUES ($1, $2);',
    deliveries: 'INSERT INTO deliveries VALUES (DEFAULT, $1, $2);',
    payment_methods: 'INSERT INTO payment_methods VALUES (DEFAULT, $1, $2);',
    addresses: 'INSERT INTO addresses VALUES (DEFAULT, $1, $2, $3, $4, $5) RETURNING adress_id;',
    personal_data: 'INSERT INTO personal_data VALUES (DEFAULT, $1, $2, $3, $4, $5) RETURNING perdata_id;',
    roles: 'INSERT INTO roles VALUES (DEFAULT, $1);',
    users: 'INSERT INTO users VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, DEFAULT, $7) RETURNING user_id;',
    users_roles: 'INSERT INTO users_roles VALUES ($1, $2, DEFAULT);'
}

export function add(table) {
    return queryBuilder(addQuery[table]);
}

/* Getting data */

const getQuery = {
    products: 'SELECT * FROM products;',
    categories: 'SELECT * FROM categories;',
    categories_products: 'SELECT * FROM categories_products;',
    orders: 'SELECT * FROM orders;',
    deliveries: 'SELECT * FROM deliveries;',
    payment_methods: 'SELECT * FROM payment_methods;',
    statuses: 'SELECT * FROM statuses;'
}

const getQueryWithCondition = {
    products: 'SELECT * FROM products WHERE product_id=$1;',
    categories: 'SELECT * FROM categories WHERE category_id=$1;',
    categories_products: 'SELECT * FROM (SELECT * FROM products LEFT JOIN categories_products ON products.product_id = categories_products.product_id) temp WHERE temp.category_id=$1;',
    orders: 'SELECT * FROM orders WHERE order_id=$1;',
    orders2: 'SELECT * FROM orders WHERE order_id=$1 AND status_id > 1;',
    orders3: 'SELECT * FROM orders WHERE user_id=$1 AND status_id=1;',
    orders4: 'SELECT * FROM orders WHERE user_id=$1 AND status_id>1;',
    products_orders: 'SELECT * FROM products_orders WHERE order_id=$1',
    products_orders2: `SELECT orders.status_id, table1.product_id, table1.order_id, table1.ammount, table1.price, table1.name, table1.image FROM 
                        (SELECT products_orders.product_id, products_orders.order_id, products_orders.ammount, products_orders.price, products.name, products.image 
                            FROM products_orders 
                            INNER JOIN products ON products_orders.product_id = products.product_id) table1 INNER JOIN orders ON table1.order_id = orders.order_id
                            WHERE table1.order_id=$1 AND orders.status_id=1;`,
    products_orders3: 'SELECT * FROM products_orders WHERE order_id=$1 AND product_id=$2',
    products_orders4: `SELECT orders.status_id, table1.product_id, table1.order_id, table1.ammount, table1.price, table1.name, table1.image FROM 
                        (SELECT products_orders.product_id, products_orders.order_id, products_orders.ammount, products_orders.price, products.name, products.image 
                            FROM products_orders 
                            INNER JOIN products ON products_orders.product_id = products.product_id) table1 INNER JOIN orders ON table1.order_id = orders.order_id
                            WHERE table1.order_id=$1 AND orders.status_id>1;`,
    products_search: `SELECT * FROM
                        (SELECT * FROM
                        (SELECT * FROM
                            (SELECT * FROM 
                            (SELECT * FROM 
                            (SELECT
                                products.product_id AS productid, 
                                products.name AS product_name, 
                                products.price, 
                                products.disconted_price, 
                                products.ammount, 
                                products.description,
                                products.image 
                            FROM products) table1 
                            LEFT JOIN categories_products ON table1.productid=categories_products.product_id) table2
                        LEFT JOIN categories ON table2.category_id=categories.category_id) table3
                        LEFT JOIN tags_products ON table3.productid=tags_products.product_id) table4
                    LEFT JOIN tags ON table4.tag_id=tags.tag_id) table5
                    WHERE table5.product_name ILIKE $1 OR table5.name ILIKE $1 OR table5.tag_name ILIKE $1;`,
    deliveries: 'SELECT * FROM deliveries WHERE delivery_id=$1;',
    payment_methods: 'SELECT * FROM payment_methods WHERE payment_method_id=$1;',
    users: 'SELECT * FROM users WHERE user_id=$1;',
    personal_data: 'SELECT * FROM personal_data WHERE perdata_id=$1;',
    addresses: 'SELECT * FROM addresses WHERE adress_id=$1;',
    users_login: `SELECT * FROM users WHERE email=$1 AND can_login='1'`,
    users_roles: `SELECT * FROM users_roles WHERE user_id=$1`,
    email_register: `SELECT * FROM users RIGHT JOIN users_roles ON users.user_id = users_roles.user_id WHERE role_id>1 AND users.email=$1`,
    tel_register: `SELECT * FROM users RIGHT JOIN users_roles ON users.user_id = users_roles.user_id WHERE role_id>1 AND users.tel=$1`
}

export function get(table) {
    return queryBuilder(getQuery[table]);
}

export function getWithCondition(table) {
    return queryBuilder(getQueryWithCondition[table]);
}

/* Updating data */

const updateQuery = {
    products_orders: `UPDATE products_orders
    SET ammount=$3,
        price=$4
    WHERE order_id=$1 AND product_id=$2;`,
    orders: `UPDATE orders
    SET user_id=$2,
        perdata_id=$3,
        other_address_id=$4,
        order_date=(TO_TIMESTAMP($5 / 1000.0)),
        end_date=$6,
        delivery_id=$7,
        payment_id=$8,
        is_paid=$9,
        status_id=$10,
        price=$11
    WHERE order_id=$1;`,
    add_cart_to_user: `UPDATE orders
    SET user_id=$2
    WHERE order_id=$1;`,
    login_time: `UPDATE users
    SET last_login=(TO_TIMESTAMP($2 / 1000.0))
    WHERE user_id=$1;`
}

export function update(table) {
    return queryBuilder(updateQuery[table]);
}

/* Deleting data */

const deleteQuery = {
    products_orders: `DELETE FROM products_orders
    WHERE order_id=$1 AND product_id=$2;`,
    orders: `DELETE FROM orders WHERE order_id=$1;`
}

export function deleted(table) {
    return queryBuilder(deleteQuery[table]);
}

export function search(table, addon) {
    const query = getQueryWithCondition[table].slice(0, -1) + ' ' + addon;
    return queryBuilder(query);
}