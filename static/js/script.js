$(document).ready(function() {
    // --- 1. Authentication Check ---
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/login-page';
        return; // Stop further execution if not logged in
    }

    // --- 2. Global AJAX Setup for Auth Header ---
    $.ajaxSetup({
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
    });

    // --- 3. State Management ---
    let conversationHistory = [];
    let currentChatId = null;

    // --- 4. Helper Functions ---
    function startNewChat() {
        currentChatId = crypto.randomUUID();
        conversationHistory = [];
        $('#chat-box').empty();
        $('#chat-box').append('<div class="message bot-message">안녕! 난 심심이야😊 무슨 이야기할까?</div>');
        console.log(`Started new chat with ID: ${currentChatId}`);
    }

    function loadChat(chatData) {
        if (!chatData || !chatData.messages || !chatData.chat_id) {
            console.error("Invalid chat data provided to loadChat");
            return;
        }
        currentChatId = chatData.chat_id;
        conversationHistory = chatData.messages;
        $('#chat-box').empty();
        conversationHistory.forEach(msg => {
            $('#chat-box').append(`<div class="message ${msg.role}-message">${msg.content}</div>`);
        });
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
        $('#memory-modal').hide();
        console.log(`Loaded chat with ID: ${currentChatId}`);
    }

    // --- 5. Event Handlers ---
    $('#send-btn').on('click', sendMessage);
    $('#user-input').on('keypress', function(e) {
        if (e.which === 13) sendMessage();
    });

    $('#new-chat-btn').on('click', startNewChat);

    $('#logout-btn').on('click', function() {
        localStorage.removeItem('auth_token');
        window.location.href = '/login-page';
    });

    $('#save-btn').on('click', function() {
        if (conversationHistory.length === 0) {
            alert("저장할 대화 내용이 없습니다.");
            return;
        }
        $.ajax({
            url: '/save-chat',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                chat_id: currentChatId,
                history: conversationHistory
            }),
            success: function(response) {
                alert("대화가 저장되었습니다!");
                console.log(response.message);
            },
            error: function(xhr) {
                alert(`대화 저장 실패: ${xhr.responseJSON?.message || 'Unknown error'}`);
            }
        });
    });

    $('#memory-btn').on('click', function() {
        $.ajax({
            url: '/get-conversations',
            type: 'GET',
            success: function(response) {
                const memoryList = $('#memory-list');
                memoryList.empty();
                if (response.conversations && response.conversations.length > 0) {
                    response.conversations.forEach(conv => {
                        const firstUserMessage = conv.messages.find(m => m.role === 'user')?.content || '(제목 없음)';
                        const convDiv = $(`<div class="conversation-item"></div>`);
                        convDiv.append(`<p class="conversation-title">${firstUserMessage.substring(0, 30)}...</p>`);
                        convDiv.append(`<p class="conversation-date">Saved: ${new Date(conv.saved_at).toLocaleString()}</p>`);
                        convDiv.data('conversation', conv);
                        convDiv.on('click', function() {
                            loadChat($(this).data('conversation'));
                        });
                        memoryList.append(convDiv);
                    });
                } else {
                    memoryList.append('<p>저장된 대화가 없습니다.</p>');
                }
                $('#memory-modal').show();
            },
            error: function(xhr) {
                alert(`저장된 대화 로딩 실패: ${xhr.responseJSON?.message || 'Unknown error'}`);
            }
        });
    });

    // Modal close handlers
    $('.close-btn').on('click', function() {
        $('#memory-modal').hide();
    });
    $(window).on('click', function(event) {
        if ($(event.target).is('#memory-modal')) {
            $('#memory-modal').hide();
        }
    });

    // --- 6. Core Functions ---
    function sendMessage() {
        const userInput = $('#user-input').val();
        if (userInput.trim() === '') return;

        const userMessage = { "role": "user", "content": userInput };
        conversationHistory.push(userMessage);
        $('#chat-box').append(`<div class="message user-message">${userInput}</div>`);
        $('#user-input').val('');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);

        $('#chat-box').append('<div class="message bot-message typing-indicator">...</div>');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);

        $.ajax({
            url: '/chat',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                message: userInput,
                history: conversationHistory.slice(0, -1)
            }),
            success: function(response) {
                $('.typing-indicator').remove();
                const botMessage = { "role": "assistant", "content": response.reply };
                conversationHistory.push(botMessage);
                $('#chat-box').append(`<div class="message bot-message">${response.reply}</div>`);
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            },
            error: function(xhr) {
                $('.typing-indicator').remove();
                if (xhr.status === 401) {
                    alert("인증이 만료되었습니다. 다시 로그인해 주세요.");
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login-page';
                } else {
                    $('#chat-box').append('<div class="message bot-message">죄송해요, 오류가 발생했어요.</div>');
                    $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
                }
            }
        });
    }

    // --- 7. Initial load ---
    startNewChat();
});