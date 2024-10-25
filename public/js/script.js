document.getElementById('logout-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/index.html'; // Redireciona para a página de login
        } else {
            alert('Erro ao sair. Tente novamente!');
        }
    })
    .catch(error => console.error('Erro:', error));
});
