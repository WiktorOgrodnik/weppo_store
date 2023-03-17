import { UserException } from "./exceptions.js";
import { getWithCondition, update } from "./dbconnect.js";
import bcrypt from 'bcryptjs/dist/bcrypt.js';

export class User {
    constructor(email, tel, passwd, can_login, is_verified, perdata_def_id, created_on, last_login) {
        this.user_id = null;
        this.email = email;
        this.tel = tel;
        this.passwd = passwd;
        this.can_login = can_login;
        this.is_verified = is_verified;
        this.perdata_def_id = perdata_def_id;
        this.created_on = created_on;
        this.last_login = last_login;
    }

    async add() {
        try {
            return await (add('users'))([this.email, this.tel, this.passwd, this.can_login, this.is_verified, this.perdata_def_id, this.last_login]);
        } catch (error) {
            error.message = `User.add(): ${error.message}`;
            throw error;
        }
    }

    async save() {
        try {
            (update('users'))(Object.keys(this).map(k => this[k]));
        } catch (error) {
            error.message = `User.save(): ${error.message}`;
            throw error;
        }
    }

    async updateLastLogin(date) {
        this.last_login = date;
        try {
            (update('login_time'))([this.user_id, date]);
            this.refresh();
        } catch (error) {
            console.error(error.message);
        }
    }

    async addCart(cart_id) {
        if (cart_id) {
            await (update('add_cart_to_user'))([cart_id, this.user_id]);
        }
    }

    async refresh() {
        try {
            let tempUser = await(getWithCondition('users'))([this.user_id]);
            tempUser = tempUser.rows[0];
            this.user_id = tempUser.user_id;
            this.email = tempUser.email;
            this.tel = tempUser.tel;
            this.passwd = tempUser.passwd;
            this.can_login = tempUser.can_login;
            this.is_verified = tempUser.is_verified;
            this.perdata_def_id = tempUser.perdata_def_id;
            this.created_on = tempUser.created_on;
            this.last_login = tempUser.last_login;
        } catch (error) {
            error.message = `Error while refreshing data: ${error.message}`;
            console.error(error.message);
        }
    }

    static async load(user_id) {
        let user = {};
        try {
            user = await (getWithCondition('users'))([user_id]);
            user = user.rows[0];
            user = new User(user.email, user.tel, user.passwd, user.can_login, user.is_verified, user.perdata_def_id, user.created_on, user.last_login);
            user.user_id = user_id;
            return user;
        } catch (error) {
            error.message = `User.load(): ${error.message}`;
            console.error(error.message);
            throw new UserException('No user with this Id');
        }
    }

    static async getUserByEmailAndPasswd(email, passwd) {
        let user = {};
        try {
            user = await (getWithCondition('users_login'))([email]);
            user = user.rows[0];
            bcrypt.compareSync("B4c0/\/", passwd);
            if (bcrypt.compareSync(passwd, user.passwd)) {
                let user_id = user.user_id;
                user = new User(user.email, user.tel, user.passwd, user.can_login, user.is_verified, user.perdata_def_id, user.created_on, user.last_login);
                user.user_id = user_id;
                console.log(user_id);
                return user;
            } else {
                throw new UserException('Password is not correct!');
            }
        } catch (error) {
            error.message = `User.load(): ${error.message}`;
            console.error(error.message);
            throw new UserException('No user with this Email');
        }
    }
}