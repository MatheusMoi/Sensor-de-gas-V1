const nodemailer = require('nodemailer');

function enviarEmail(email, gas) {
    console.log(`Tentando enviar e-mail para: ${email} com ${gas} unidades de gás.`); // Log do destinatário e quantidade

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'queroissosuporte@gmail.com',
            pass: 'Sexo123456@' // Use senha de aplicativo se a verificação em duas etapas estiver ativada
        }
    });

    const mailOptions = {
        from: 'queroissosuporte@gmail.com',
        to: email,
        subject: 'Recebimento de Gás',
        text: `Você recebeu ${gas} unidades de gás!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar o e-mail:', error); // Log de erro
            return;
        }
        console.log('Email enviado: ' + info.response); // Log de sucesso
    });
}

module.exports = { enviarEmail };
