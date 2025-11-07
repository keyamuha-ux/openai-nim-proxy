// API Configuration
const API_CONFIG = {
    endpoint: 'https://api.llm7.io/v1/chat/completions',
    apiKey: 'nRUhyQL3//kMwqUSTYT5G+J7j2I4nARBo4izRh6GbjlEjG4zUGKsJ/4JDFNOh4wnEABacxV2tohJ84P1zoBEEHtZkDH09rJJy/E6BlghkOs8NKVFkTbZqmI=',
    model: 'mistral-small-3.2-24b-instruct'
};

// Global variables
let bots = JSON.parse(localStorage.getItem('aiChatBots')) || [];
let currentBot = null;
let chatHistory = JSON.parse(localStorage.getItem('aiChatHistory')) || {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadBots();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    const avatarInput = document.getElementById('botAvatar');
    avatarInput.addEventListener('change', function(e) {
        previewAvatar(e.target.files[0]);
    });
}

// Bot Management
function loadBots() {
    const botsList = document.getElementById('botsList');
    botsList.innerHTML = '';

    bots.forEach((bot, index) => {
        const botElement = document.createElement('div');
        botElement.className = 'bot-item';
        if (currentBot && currentBot.id === bot.id) {
            botElement.classList.add('active');
        }

        botElement.innerHTML = `
            <img src="${bot.avatar || 'https://via.placeholder.com/40'}" alt="${bot.name}" class="bot-item-avatar">
            <div class="bot-item-info">
                <h4>${bot.name}</h4>
                <p>${bot.description || 'No description'}</p>
            </div>
        `;

        botElement.addEventListener('click', () => selectBot(bot.id));
        botsList.appendChild(botElement);
    });
}

function createBot() {
    const name = document.getElementById('botName').value.trim();
    const description = document.getElementById('botDescription').value.trim();
    const personality = document.getElementById('botPersonality').value.trim();
    const avatarFile = document.getElementById('botAvatar').files[0];

    if (!name) {
        alert('Please enter a bot name');
        return;
    }

    const newBot = {
        id: Date.now().toString(),
        name: name,
        description: description,
        personality: personality,
        avatar: null,
        createdAt: new Date().toISOString()
    };

    // Handle avatar image
    if (avatarFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newBot.avatar = e.target.result;
            saveBot(newBot);
        };
        reader.readAsDataURL(avatarFile);
    } else {
        saveBot(newBot);
    }
}

function saveBot(bot) {
    bots.push(bot);
    localStorage.setItem('aiChatBots', JSON.stringify(bots));
    closeCreateBotModal();
    loadBots();
    selectBot(bot.id);
}

function selectBot(botId) {
    currentBot = bots.find(bot => bot.id === botId);
    
    // Update UI
    document.getElementById('currentBotName').textContent = currentBot.name;
    document.getElementById('currentBotStatus').textContent = 'Online';
    document.getElementById('currentBotStatus').classList.add('online');
    
    const avatarElement = document.getElementById('currentBotAvatar');
    avatarElement.src = currentBot.avatar || 'https://via.placeholder.com/50';
    avatarElement.style.display = 'block';

    // Enable chat
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendButton').disabled = false;

    // Load chat history
    loadChatHistory(botId);
    loadBots(); // Refresh bot list to show active state
}

// Chat Functions
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message || !currentBot) return;

    // Add user message to chat
    addMessageToChat('user', message, null);
    messageInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        const response = await generateAIResponse(message);
        removeTypingIndicator();
        addMessageToChat('bot', response, currentBot.avatar);
        
        // Save to chat history
        saveChatHistory(currentBot.id, 'user', message);
        saveChatHistory(currentBot.id, 'bot', response);
    } catch (error) {
        removeTypingIndicator();
        addMessageToChat('bot', 'Sorry, I encountered an error. Please try again.', currentBot.avatar);
        console.error('Error generating response:', error);
    }
}

async function generateAIResponse(userMessage) {
    const response = await fetch(API_CONFIG.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: API_CONFIG.model,
            messages: [
                {
                    role: 'system',
                    content: currentBot.personality || 'You are a helpful AI assistant.'
                },
                ...getChatHistoryForAPI(currentBot.id),
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function getChatHistoryForAPI(botId) {
    const history = chatHistory[botId] || [];
    return history.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
    }));
}

function addMessageToChat(sender, message, avatar) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    const avatarUrl = sender === 'bot' ? (avatar || 'https://via.placeholder.com/35') : 'https://via.placeholder.com/35?text=You';
    
    messageElement.innerHTML = `
        ${sender === 'bot' ? `<img src="${avatarUrl}" alt="${sender}" class="message-avatar">` : ''}
        <div class="message-bubble">${escapeHtml(message)}</div>
        ${sender === 'user' ? `<img src="${avatarUrl}" alt="${sender}" class="message-avatar">` : ''}
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('messagesContainer');
    const typingElement = document.createElement('div');
    typingElement.className = 'message bot';
    typingElement.id = 'typingIndicator';
    typingElement.innerHTML = `
        <img src="${currentBot.avatar || 'https://via.placeholder.com/35'}" alt="Bot" class="message-avatar">
        <div class="message-bubble">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Chat History Management
function loadChatHistory(botId) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';

    const history = chatHistory[botId] || [];
    
    if (history.length === 0) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h3>Chat with ${currentBot.name}</h3>
                <p>Start a conversation with your AI bot!</p>
            </div>
        `;
        return;
    }

    history.forEach(msg => {
        addMessageToChat(msg.sender, msg.message, msg.sender === 'bot' ? currentBot.avatar : null);
    });
}

function saveChatHistory(botId, sender, message) {
    if (!chatHistory[botId]) {
        chatHistory[botId] = [];
    }
    
    chatHistory[botId].push({
        sender: sender,
        message: message,
        timestamp: new Date().toISOString()
    });

    // Keep only last 50 messages per bot
    if (chatHistory[botId].length > 50) {
        chatHistory[botId] = chatHistory[botId].slice(-50);
    }

    localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
}

// Modal Functions
function showCreateBotModal() {
    document.getElementById('createBotModal').style.display = 'block';
    document.getElementById('botName').focus();
}

function closeCreateBotModal() {
    document.getElementById('createBotModal').style.display = 'none';
    resetCreateBotForm();
}

function resetCreateBotForm() {
    document.getElementById('botName').value = '';
    document.getElementById('botDescription').value = '';
    document.getElementById('botPersonality').value = '';
    document.getElementById('botAvatar').value = '';
    document.getElementById('avatarPreview').innerHTML = 'Preview';
}

function previewAvatar(file) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatarPreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

// Utility Functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, '<br>');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('createBotModal');
    if (event.target === modal) {
        closeCreateBotModal();
    }
};
