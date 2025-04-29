document.addEventListener('DOMContentLoaded', () => {
  const homeContainer = document.querySelector('.home-container');
  const chatContainer = document.querySelector('.chat-container');
  const usernameInput = document.getElementById('username');
  const roomCodeInput = document.getElementById('room-code');
  const joinBtn = document.getElementById('join-btn');
  const createBtn = document.getElementById('create-btn');
  const currentRoomSpan = document.getElementById('current-room');
  const messagesContainer = document.getElementById('messages-container');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const userCount = document.getElementById('user-count');
  const leaveBtn = document.getElementById('leave-btn');
  const usersList = document.getElementById('users-list');

  let socket;
  let currentRoom = '';
  let username = '';
  let userAvatar = localStorage.getItem('userAvatar') || 'https://via.placeholder.com/80';
  let isTyping = false;
  let lastTypingTime;
  let picker;
  let localMessageHistory = JSON.parse(localStorage.getItem('messageHistory')) || {};

  // Initialize socket once
  function initSocket() {
    if (socket) return; // already initialized
    socket = io();

    socket.on('roomData', (data) => {
      currentRoom = data.roomCode;
      currentRoomSpan.textContent = currentRoom;
      sessionStorage.setItem('chatRoom', currentRoom);
      sessionStorage.setItem('username', username);

      updateUserList(data.users);
      homeContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
      messageInput.focus();
    });

    socket.on('message', (message) => {
      displayMessage(message);
      saveMessageToHistory(currentRoom, message);
    });

    socket.on('fileMessage', (message) => {
      displayMessage(message);
      saveMessageToHistory(currentRoom, message);
    });

    socket.on('userList', updateUserList);
    socket.on('typing', data => showTyping(data.username));
    socket.on('stopTyping', hideTyping);
  }

  // Emoji Picker Initialization
  function initEmojiPicker() {
    picker = new EmojiButton({ position: 'top-end' });
    picker.on('emoji', emoji => messageInput.value += emoji);
    document.getElementById('emoji-btn').addEventListener('click', () => picker.togglePicker());
  }

  // Avatar Selection Handling
  document.getElementById('avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        userAvatar = reader.result;
        localStorage.setItem('userAvatar', userAvatar);
        document.getElementById('avatar-preview').src = userAvatar;
      };
      reader.readAsDataURL(file);
    }
  });

  // Show Error Messages
  function showError(element, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    element.parentNode.insertBefore(errorElement, element.nextSibling);
    setTimeout(() => errorElement.remove(), 3000);
  }

  // Display a Single Message
  function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
      <div class="message-header">
        <img src="${message.avatar || userAvatar}" class="message-avatar">
        <div>
          <span class="sender">${message.user}</span>
          <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
      ${message.file ? `
        <div class="file-message">
          ${message.file.type.startsWith('image/')
            ? `<img src="${message.file.data}" style="max-width: 200px;">`
            : `<a href="${message.file.data}" download="${message.file.name}">Download ${message.file.name}</a>`}
        </div>` : 
        `<div class="message-text">${message.text}</div>`}
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Updated: Active User List shows only names
  function updateUserList(users) {
    usersList.innerHTML = users.map(user => `
      <div class="user-item">
        <span>${user.name}</span>
      </div>
    `).join('');
    userCount.textContent = `👥 ${users.length} user${users.length !== 1 ? 's' : ''}`;
  }

  // Save Messages to localStorage
  function saveMessageToHistory(roomCode, message) {
    localMessageHistory[roomCode] = [...(localMessageHistory[roomCode] || []), message];
    localStorage.setItem('messageHistory', JSON.stringify(localMessageHistory));
  }

  // Load Stored Messages
  function loadLocalHistory(roomCode) {
    messagesContainer.innerHTML = '';
    const messages = localMessageHistory[roomCode] || [];
    messages.forEach(displayMessage);
  }

  // Typing Indicator
  function showTyping(user) {
    if (!document.querySelector('.typing-indicator')) {
      const el = document.createElement('div');
      el.className = 'typing-indicator';
      el.textContent = `${user} is typing...`;
      messagesContainer.appendChild(el);
    }
  }
  function hideTyping() {
    document.querySelectorAll('.typing-indicator').forEach(el => el.remove());
  }

  // Input & Send Handlers
  messageInput.addEventListener('input', () => {
    if (!isTyping) {
      isTyping = true;
      socket.emit('typing', { roomCode: currentRoom, username });
    }
    lastTypingTime = Date.now();
    setTimeout(() => {
      if (Date.now() - lastTypingTime >= 3000 && isTyping) {
        socket.emit('stopTyping', { roomCode: currentRoom });
        isTyping = false;
      }
    }, 3000);
  });

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());

  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    socket.emit('sendMessage', {
      roomCode: currentRoom,
      message: text,
      username,
      avatar: userAvatar
    });
    messageInput.value = '';
  }

  // File Upload
  document.getElementById('file-btn').addEventListener('click', () =>
    document.getElementById('file-input').click()
  );
  document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file?.size > 10 * 1024 * 1024) return alert('File size exceeds 10MB');
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('sendFile', {
        roomCode: currentRoom,
        file: {
          name: file.name,
          type: file.type,
          data: reader.result,
          size: file.size
        },
        username,
        avatar: userAvatar
      });
    };
    reader.readAsDataURL(file);
  });

  // Join / Create / Leave Room
  joinBtn.addEventListener('click', () => {
    document.querySelectorAll('.error-message').forEach(e => e.remove());
    username = usernameInput.value.trim();
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    if (!username) return showError(usernameInput, 'Please enter your name');
    if (!roomCode) return showError(roomCodeInput, 'Please enter room code');

    messagesContainer.innerHTML = '';
    initSocket();
    socket.emit('joinRoom', { roomCode, username, avatar: userAvatar });
  });

  createBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (!username) return showError(usernameInput, 'Please enter your name');
    roomCodeInput.value = Math.random().toString(36).substring(2,8).toUpperCase();
    messagesContainer.innerHTML = '';
    initSocket();
    socket.emit('joinRoom', { roomCode: roomCodeInput.value, username, avatar: userAvatar });
  });

  leaveBtn.addEventListener('click', () => {
    if (socket) socket.emit('leaveRoom', { roomCode: currentRoom });
    sessionStorage.clear();
    homeContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
  });

  window.addEventListener('beforeunload', () => {
    if (socket) socket.emit('leaveRoom', { roomCode: currentRoom });
  });

  // Auto-Restore Session on Load
  initSocket();
  const savedRoom = sessionStorage.getItem('chatRoom');
  const savedUser = sessionStorage.getItem('username');
  if (savedRoom && savedUser) {
    currentRoom = savedRoom;
    username = savedUser;
    homeContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    currentRoomSpan.textContent = currentRoom;
    loadLocalHistory(currentRoom);
    socket.emit('joinRoom', { roomCode: currentRoom, username, avatar: userAvatar });
  }

  initEmojiPicker();
});
