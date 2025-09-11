// JavaScript da Página de Perfil
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados do perfil
    loadProfileData();
    loadUserHistory();
    loadUserFavorites();
    loadUserSettings();
});

// Carregar dados do perfil
async function loadProfileData() {
    try {
        // Simular carregamento de estatísticas
        // Em uma implementação real, isso viria de uma API
        setTimeout(() => {
            document.getElementById('totalTranslations').textContent = '127';
            document.getElementById('totalWords').textContent = '89';
            document.getElementById('streakDays').textContent = '15';
        }, 1000);
    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
    }
}

// Carregar histórico do usuário
async function loadUserHistory() {
    try {
        const response = await fetch('/api/user/history');
        const history = await response.json();
        
        const historyList = document.getElementById('historyList');
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-clock-history"></i>
                    <h4>Nenhuma atividade ainda</h4>
                    <p>Suas traduções e buscas aparecerão aqui</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-type">${getTypeLabel(item.type)}</span>
                    <span class="history-date">${formatDate(item.createdAt)}</span>
                </div>
                <div class="history-content">
                    <strong>${item.word}</strong>
                    ${item.translation ? `<br><small>Tradução: ${item.translation}</small>` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historyList').innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h4>Erro ao carregar histórico</h4>
                <p>Tente recarregar a página</p>
            </div>
        `;
    }
}

// Carregar favoritos do usuário
async function loadUserFavorites() {
    try {
        const response = await fetch('/api/user/favorites');
        const favorites = await response.json();
        
        const favoritesGrid = document.getElementById('favoritesGrid');
        const favoritesCount = document.getElementById('favoritesCount');
        
        favoritesCount.textContent = `${favorites.length} favoritos`;
        
        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-heart"></i>
                    <h4>Nenhum favorito ainda</h4>
                    <p>Adicione palavras ao seus favoritos para vê-las aqui</p>
                </div>
            `;
            return;
        }
        
        favoritesGrid.innerHTML = favorites.map(favorite => `
            <div class="favorite-item">
                <div class="favorite-word">${favorite.word}</div>
                <div class="favorite-meaning">${favorite.meaning}</div>
                <div class="favorite-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewWordDetails('${favorite.word}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFavorite('${favorite.id}')">
                        <i class="bi bi-heart-fill"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
    }
}

// Carregar configurações do usuário
async function loadUserSettings() {
    try {
        const response = await fetch('/api/user/settings');
        const settings = await response.json();
        
        // Aplicar configurações aos campos
        document.getElementById('defaultSourceLang').value = settings.defaultSourceLang || 'en';
        document.getElementById('defaultTargetLang').value = settings.defaultTargetLang || 'pt';
        document.getElementById('dailyWordNotifications').checked = settings.dailyWordNotifications || false;
        document.getElementById('translationReminders').checked = settings.translationReminders || false;
        document.getElementById('publicProfile').checked = settings.publicProfile || false;
        
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

// Atualizar perfil
async function updateProfile() {
    const form = document.getElementById('editProfileForm');
    const formData = new FormData(form);
    
    const profileData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: document.getElementById('newPassword').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };
    
    // Validação básica
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
        alert('As senhas não coincidem');
        return;
    }
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            // Fechar modal e recarregar página
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
            location.reload();
        } else {
            const error = await response.json();
            alert('Erro ao atualizar perfil: ' + error.message);
        }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        alert('Erro ao atualizar perfil');
    }
}

// Salvar configurações
async function saveSettings() {
    const settings = {
        defaultSourceLang: document.getElementById('defaultSourceLang').value,
        defaultTargetLang: document.getElementById('defaultTargetLang').value,
        dailyWordNotifications: document.getElementById('dailyWordNotifications').checked,
        translationReminders: document.getElementById('translationReminders').checked,
        publicProfile: document.getElementById('publicProfile').checked
    };
    
    try {
        const response = await fetch('/api/user/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            showNotification('Configurações salvas com sucesso!', 'success');
        } else {
            showNotification('Erro ao salvar configurações', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showNotification('Erro ao salvar configurações', 'error');
    }
}

// Restaurar configurações padrão
function resetSettings() {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
        document.getElementById('defaultSourceLang').value = 'en';
        document.getElementById('defaultTargetLang').value = 'pt';
        document.getElementById('dailyWordNotifications').checked = false;
        document.getElementById('translationReminders').checked = false;
        document.getElementById('publicProfile').checked = false;
        
        showNotification('Configurações restauradas', 'info');
    }
}

// Limpar histórico
async function clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
        try {
            const response = await fetch('/api/user/history', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadUserHistory();
                showNotification('Histórico limpo com sucesso!', 'success');
            } else {
                showNotification('Erro ao limpar histórico', 'error');
            }
        } catch (error) {
            console.error('Erro ao limpar histórico:', error);
            showNotification('Erro ao limpar histórico', 'error');
        }
    }
}

// Remover favorito
async function removeFavorite(favoriteId) {
    try {
        const response = await fetch(`/api/user/favorites/${favoriteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadUserFavorites();
            showNotification('Favorito removido!', 'success');
        } else {
            showNotification('Erro ao remover favorito', 'error');
        }
    } catch (error) {
        console.error('Erro ao remover favorito:', error);
        showNotification('Erro ao remover favorito', 'error');
    }
}

// Ver detalhes da palavra
function viewWordDetails(word) {
    window.location.href = `/palavra/${encodeURIComponent(word)}`;
}

// Funções auxiliares
function getTypeLabel(type) {
    const labels = {
        'TRANSLATION': 'Tradução',
        'SEARCH': 'Busca',
        'WORD_OF_DAY': 'Palavra do Dia',
        'FAVORITE': 'Favorito'
    };
    return labels[type] || type;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type) {
    // Criar notificação simples
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}
