import AbstractPage from "./AbstractPage.js";

export default class extends AbstractPage {
    constructor() {
        super();
        this.setTitle("Settings");
    }

    async getHtml() {
        return `
            <h1> Settings </h1>
            <p> You are viewing settings </p>
            `
    }
}