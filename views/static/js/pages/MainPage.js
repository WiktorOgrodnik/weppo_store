import AbstractPage from "./AbstractPage.js";

export default class extends AbstractPage {
    constructor() {
        super();
        this.setTitle("Main Page");
    }

    async getHtml() {
        return `
            <h1> Weppo Store </h1>
            `
    }
}