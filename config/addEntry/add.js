import readline from 'readline';
import { add } from '../../dbconnect.js';

const read = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const insert_builder = {
    products: ['Product', 'name', 'price', 'discounted_price', 'ammount', 'description', 'image'],
    categories: ['Category', 'name'],
    categories_products: ['Categories_products', 'product_id', 'category_id']
};

const questionBuilder = function (name, arr, length, callback) {
    let res = [];
    const recursiveQuestions = (index) => {
        read.question(`${name} ${arr[index]}: `, answer => {
            res.push(answer);
            if (index + 1 == length) callback(res).then(() => {read.close();});
            else recursiveQuestions(index + 1);
        });
    };

    recursiveQuestions(0);
}

read.question('To what table do you want to insert: ', key => {
    if (insert_builder[key] !== undefined) {
        const name = insert_builder[key][0];
        const arr = insert_builder[key].slice(1);
        const callback = add(key);
        questionBuilder(name, arr, arr.length, callback);
    } else {
        console.error('No such table');
        read.close();
    }
});

read.on('close', () => {
    process.exit(0);
});