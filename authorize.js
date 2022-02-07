import { getWithCondition } from "./dbconnect.js";

export function authorize(...roles) {
    return function (req, res, next) {
        if (req.session.loggedin) {
            
            (async () => {

                const permissions = await (getWithCondition('users_roles'))([req.session.user_id]);
                
                let valid = false;

                if (permissions.rows?.length > 0) {
                    for (let k of roles) {
                        const pred = permissions.rows.find(pred => pred.role_id == k);
                        if (pred) {
                            console.log('permission grnated');
                            valid = true;
                        }
                    }
                }

                if (valid) {
                    next();
                } else {
                    res.redirect(`/more-permissions-needed`);
                }
            })();
        } else {
            if (req.url.startsWith('/login')) next();
            else res.redirect(`/login?returnUrl=${req.url}`);
        }
    }
}