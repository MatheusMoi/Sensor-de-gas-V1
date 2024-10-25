fetch('/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nome: 'João', senha: 'senha123' })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        console.log(`Bem-vindo, ${data.user}!`);
        // Aqui você pode redirecionar ou atualizar a página para exibir o nome do usuário
        document.getElementById('username').textContent = data.user;
    } else {
        console.error(data.message);
    }
})
.catch(error => console.error('Erro ao fazer login:', error));
