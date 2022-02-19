
const regexes = {
    email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    postalCode: /^\d{2}-\d{3}$/,
    tel: /^[+\d][\d]{4,16}$/,
    passwd: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}:;<>,.?~_+-=|]).{12,}$/
};

export const validators = {
    validateEmail: email => regexes.email.test(email),
    validateNotEmpty: name => name.length > 0,
    validateDeliveryId: id => id > 0 && id <= 3,
    validatePaymentId: id => id > 0 && id <=7,
    validatePostalCode: code => regexes.postalCode.test(code),
    validateTelephone: tel => regexes.tel.test(tel),
    validatePassword: passwd => regexes.passwd.test(passwd)
};