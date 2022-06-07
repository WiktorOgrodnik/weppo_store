import { get } from "./dbconnect.js";

class Cateogry {
    constructor(id, name) {
        this.category_id = id;
        this.name = name;
    }
}

export class Categories {

    constructor(categories){
        this.rows = categories.map(row => new Cateogry(row.category_id, row.name));
    }

    static async load() {
        let categories = {};
        try {
            categories = await (get('categories'))();
            categories = categories.rows;
            categories = new Categories(categories);
        } catch (error) {
            error.message = `Categories.load(): ${error.message}`;
            categories = new Categories([]);
        }

        return categories;
    }
}