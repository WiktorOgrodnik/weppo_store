import AbstractPage from "./AbstractPage.js";

export default class extends AbstractPage {
    constructor() {
        super();
        this.setTitle("Account");
    }

    async getHtml() {
        return `
            <h1> Your Account </h1>
            <p> You are viewing your settings </p>
            `
    }
}