import Client from "pg/lib/client.js";
const env = process.env.DB_ENVIRONMENT || "development";

const db_data = {
    development: 'postgres://postgres:password@localhost:5432/weppo_store',
    production: process.env.DATABASE_URL
};

export const db = db_data[env];

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
    'products_orders',
    'users_roles',
    'categories_products'
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
        name VARCHAR(50) NOT NULL
    );`,
    payment_methods: `payment_methods (
        payment_method_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
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
        first_name VARCHAR(50) NOT NULL,
        second_name VARCHAR(60) NOT NULL,
        pesel VARCHAR(11) NOT NULL,
        nip VARCHAR(10),
        regon VARCHAR(14),
        adress_id INT,
        FOREIGN KEY (adress_id) REFERENCES addresses (adress_id)
    );`,
    users: `users (
        user_id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        passwd VARCHAR(255) NOT NULL,
        can_login BIT(1) NOT NULL,
        is_verified BIT(1) NOT NULL,
        perdata_def_id INT,
        created_on TIMESTAMP NOT NULL,
        last_login TIMESTAMP,
        FOREIGN KEY (perdata_def_id) REFERENCES personal_data (perdata_id)
    );`,
    orders: `orders (
        order_id BIGSERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        perdata_id INT NOT NULL,
        other_adress_id INT,
        order_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        delivery_id INT NOT NULL,
        payment_id INT NOT NULL,
        is_paid BIT(1) NOT NULL,
        status_id INT NOT NULL,
        price INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (perdata_id) REFERENCES personal_data (perdata_id),
        FOREIGN KEY (other_adress_id) REFERENCES addresses (adress_id),
        FOREIGN KEY (delivery_id) REFERENCES deliveries (delivery_id),
        FOREIGN KEY (payment_id) REFERENCES payment_methods (payment_method_id),
        FOREIGN KEY (status_id) REFERENCES statuses (status_id)
    );`,
    users_roles: `users_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        grant_date TIMESTAMP,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (role_id) REFERENCES roles (role_id)
    );`,
    products_orders: `products_orders (
        product_id INT NOT NULL,
        order_id INT NOT NULL,
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
    );`
};

function deleteDatabases() {

    let i = 0;

    const del = async (k) => {
        const client = new Client(db);

        await client.connect();
        try {
            await client.query(`DROP TABLE IF EXISTS ${k} CASCADE`);
        } finally {
            await client.end();
        }
    }
    
    for (let k of tables) {
        setTimeout(() => del(k).catch(console.error), (i++)*200);
    }
}

function createDatabases(i) {

    const make = async (k) => {
        const client = new Client(db);

        await client.connect();
        try {
            await client.query(`CREATE TABLE IF NOT EXISTS ${createTableQueries[k]}`);
        } finally {
            await client.end();
        }
    }

    for (let k of tables) {
        setTimeout(() => make(k).catch(console.error), (i++)*200);
    }
}

export function rebuiltDatabase() {
    deleteDatabases();
    createDatabases(tables.length);
}

/* Manipulating data */

function queryBuilder(query) {
    return async function (req) {
        const client = new Client(db);

        await client.connect();
        try {
            return client.query(query, req);
        } catch (err) {
            console.error('Something unexpected happened: ' + err.stack);
        }
    }
}

/* Insert data functions */

const addQuery = {
    products: 'INSERT INTO products VALUES (DEFAULT, $1, $2, $3, $4, $5, $6);',
    categories: 'INSERT INTO categories VALUES (DEFAULT, $1);'
}

export function add(table) {
    return queryBuilder(addQuery[table]);
}

/* Getting data */

const getQuery = {
    products: 'SELECT * FROM products;',
    categories: 'SELECT * FROM categories;'
}

const getQueryWithCondition = {
    products: 'SELECT * FROM products WHERE product_id=$1;',
    categories: 'SELECT * FROM categories WHERE category_id=$1;'
}

export function get(table) {
    return queryBuilder(getQuery[table]);
}

export function getWithCondition(table) {
    return queryBuilder(getQueryWithCondition[table]);
}