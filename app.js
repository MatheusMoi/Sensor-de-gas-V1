import http from 'http';
import path from 'path';
import express from 'express';
import fs from 'fs';
import session from 'express-session';
import fetch from 'node-fetch';

import { fileURLToPath } from 'url';  
import { dirname } from 'path';        

const __filename = fileURLToPath(import.meta.url);  
const __dirname = dirname(__filename);                

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "abc", resave: false, saveUninitialized: true }));

// Definindo a política de segurança de conteúdo
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    console.log('CSP definido');
    next();
});

// Configurações
app.set('port', process.env.PORT || 3001);
console.log(`Servidor configurado para a porta: ${app.get('port')}`);

// Artigos estáticos
app.use(express.static(path.join(__dirname, 'public')));

let dadosAnteriores = {}; // Inicializa os dados anteriores

// Função para obter chat_ids
async function getChatIds() {
    const TELEGRAM_TOKEN = '7904063666:AAHFnSaJnB73_H6vrrjYlIijEPGcWzSxkRE'; 
    try {
        console.log('Obtendo chat IDs...');
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`);
        const data = await response.json();
        console.log('Resposta recebida do Telegram:', data);

        const chatIds = data.result.map(update => ({
            chat_id: update.message.chat.id,
            username: update.message.from.username,
            first_name: update.message.from.first_name,
            last_name: update.message.from.last_name
        }));

        console.log('Chat IDs obtidos:', chatIds);
        
        return chatIds;
    } catch (err) {
        console.error(`Erro ao obter chat_ids: ${err.message}`);
        throw new Error(`Erro ao obter chat_ids: ${err.message}`);
    }
}

// Rota para obter chat_ids
app.get('/api/chat-ids', async (req, res) => {
    try {
        console.log('Rota /api/chat-ids chamada');
        const chatIds = await getChatIds();
        res.json({ success: true, chatIds });
    } catch (error) {
        console.error('Erro ao chamar a rota /api/chat-ids:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});4

// Função para enviar mensagem
async function sendMessage(chatId, message) {
    const TELEGRAM_TOKEN = '7904063666:AAHFnSaJnB73_H6vrrjYlIijEPGcWzSxkRE'; 
    try {
        console.log(`Enviando mensagem para chat_id: ${chatId}`);
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
            }),
        });
        const result = await response.json();
        console.log('Resposta do envio de mensagem:', result);
        return result;
    } catch (err) {
        console.error(`Erro ao enviar mensagem: ${err.message}`);
        throw new Error(`Erro ao enviar mensagem: ${err.message}`);
    }
}

app.post('/api/leitura', async (req, res) => {
    const { id, internet, gas } = req.body; 
    console.log('Rota /api/leitura chamada com dados:', req.body);

    if (!id || !internet || !gas) {
        console.log('Erro: ID, internet e gás são obrigatórios');
        return res.status(400).json({ success: false, message: 'ID, internet e gás são obrigatórios' });
    }

    const gasValue = Number(gas);
    if (isNaN(gasValue) || gasValue <= 0) {
        console.log('Erro: O valor de gás deve ser um número válido e maior que zero');
        return res.status(400).json({ success: false, message: 'O valor de gás deve ser um número válido e maior que zero' });
    }

    dadosAnteriores = { id, internet, gas: gasValue, timestamp: new Date().toISOString() };
    console.log(`Recebido ID: ${id}, Internet: ${internet}, Gas: ${gasValue}`);

    if (gasValue > 1) {
        const alertaMensagem = `ALERTA DE VAZAMENTO GÁS! 
 ⛔🚫  Vazando: ${gasValue}% ⛔🚫`;
        console.log(`Gás maior que 1, enviando alerta: ${alertaMensagem}`);

        try {
            const chatIds = await getChatIds(); 
            const chatIdToUse = chatIds.find(chat => chat.chat_id.toString() === id.toString());

            if (chatIdToUse) {
                await sendMessage(chatIdToUse.chat_id, alertaMensagem);
                console.log(`Mensagem enviada para ${chatIdToUse.chat_id}: ${alertaMensagem}`);
            } else {
                console.error(`Chat ID ${id} não encontrado entre os IDs obtidos.`);
            }
        } catch (err) {
            console.error('Erro ao obter chat_ids:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    res.json({ success: true, data: dadosAnteriores }); 
});

// Rota para obter os dados
app.get('/api/leitura', (req, res) => {
    console.log('Rota /api/leitura chamada para obter dados');
    res.json({ success: true, data: dadosAnteriores });
});

// Middleware de verificação de sessão
app.use('/acesso-restrito/*', (req, res, next) => {
    console.log('Verificando sessão para acesso restrito');
    if (req.session.user) {
        next();
    } else {
        console.log('Acesso negado, redirecionando para index.html');
        res.redirect('/index.html');
    }
});

// Rota para a página de acesso restrito
app.get('/acesso-restrito/acesso-restrito.html', (req, res) => {
    console.log('Acessando a página de acesso restrito');
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'acesso-restrito.html'));
    } else {
        console.log('Acesso negado, redirecionando para index.html');
        res.redirect('/index.html');
    }
});

// Login
app.post('/login', (req, res) => {
    const usuarios = JSON.parse(fs.readFileSync('./usuarios.json'));
    const { nome, senha } = req.body;
    console.log(`Tentativa de login para usuário: ${nome}`);

    const usuario = usuarios.find(u => u.nome === nome && u.senha === senha);
    if (usuario) {
        req.session.user = usuario.nome;
        console.log(`Usuário ${usuario.nome} logou.`);
        res.json({ success: true, user: usuario.nome });
    } else {
        console.log('Falha no login');
        res.json({ success: false, message: 'Falha no login' });
    }
});

// Rota para obter o nome do usuário da sessão
app.get('/get-username', (req, res) => {
    console.log('Rota /get-username chamada');
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.json({ username: null });
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    console.log('Usuário deslogado, redirecionando para index.html');
    res.redirect('/index.html');
});

// Início do servidor
server.listen(app.get('port'), () => {
    console.log('Servidor rodando na porta', app.get('port'));
});
