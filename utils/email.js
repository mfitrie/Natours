const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

class Email{
    constructor(user,url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Joe <${process.env.EMAIL_FROM}>`;
    }

    newTransport(){
        if(process.env.NODE_ENV == 'production'){
            // Sendgrid
            return 1;
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth:{
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
    
        });
    }

    // Send the actual email
    async send(template, subject){
        // 1) Render HTML based on a pug template
        // pass the options to be used in pug
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: htmlToText.fromString(html),
        }


        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);


    }

    async sendWelcome(){
        await this.send('Welcome','Welcome to the Natours Family!');
    }

    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token (valid for only 10 minutes)');
    }
}






// const sendEmail = async (options) =>{
//     // // 1) Create a transporter
//     // const transporter = nodemailer.createTransport({
//     //     host: process.env.EMAIL_HOST,
//     //     port: process.env.EMAIL_PORT,
//     //     auth:{
//     //         user: process.env.EMAIL_USERNAME,
//     //         pass: process.env.EMAIL_PASSWORD
//     //     }

//     //     // Activate in gmail "less secure app" option
//     // });



//     // // 2) Define the email options
//     // const mailOptions = {
//     //     from: 'Joe <joe@gmail.com>',
//     //     to: options.email,
//     //     subject: options.subject,
//     //     text: options.message,
//     //     // html: 
//     // }


//     // 3) Actually send the email
//     await transporter.sendMail(mailOptions);
// };


module.exports = {Email};