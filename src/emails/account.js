const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nirturk@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nirturk@gmail.com',
        subject: 'Your Account have been cancelled',
        text: `We're sorry to see you leave, ${name}. Please tell us if there is something we can do better.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}