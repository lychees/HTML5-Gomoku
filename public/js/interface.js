
$(function(){

//$(document).ready(function(){
    var game = new Game($(".go-board"), $(".board tbody"));

    var adjustSize = adjustSizeGen();

    $(window).resize(adjustSize);

    adjustSize();
    $.mobile.defaultDialogTransition = 'flip';
    $.mobile.defaultPageTransition = 'flip';
    
    $('#mode-select input[type="radio"]').on('change', function(){
        gameData.mode=$(this).val();
    });

    $('#net-select input[type="radio"]').on('change', function(){
        gameData.net=$(this).val();
    });

    $('#create-or-join-select input[type="radio"]').on('change', function(){
        gameData.create_or_join=$(this).val();
    });

    $('#room-input input[type="text"]').on('change', function(){
        gameData.room_id=$(this).val();
    });

    $('#nickname-input input[type="text"]').on('change', function(){
        gameData.nickname=$(this).val();
    });

    $('#color-select input[type="radio"]').on('change', function(){
        gameData.color=$(this).val();
    });
    
    $('#level-select input[type="radio"]').on('change', function(){
        gameData.level=$(this).val();
    });
    
    $('.back-to-game').on('tap',function(){
        $.mobile.changePage('#game-page');
    });


    $("#start-game").on('click',function(){
        try{
            game.white.worker.terminate();
            game.black.worker.terminate();
        }catch(e){}
        if(gameData.mode==='vshuman'){
            game.mode = 'hvh';
            if (gameData.net == 'offline') {
                game.init(new HumanPlayer("black"), new HumanPlayer("white"));
            }
            else{
                if (gameData.create_or_join == 'create'){
                    //console.log("!");
                    var socket = io();
                    socket.emit('create room');
                }
                else{
                    var socket = io();
                    //console.log(gameData.room_id);
                    socket.emit('join room', gameData.room_id);
                }
                return;
                //game.init(new HumanPlayer("black"), new HumanPlayer("white"));
            }
        }else{
            var color, other;
            if(gameData.color==='black'){
                color='black';
                other='white';
            }else{
                color='white';
                other='black';
            }
            game.mode=gameData.level;
            game.init(new HumanPlayer(color), new AIPlayer(game.mode, other));
        }
        game.init(new HumanPlayer("black"), new HumanPlayer("white"));
        $.mobile.changePage('#game-page');
        game.start();
        setTimeout(function(){$('.back-to-game').button('enable');},100);
    });

    $("#undo-button").on('tap', function(){
        game.undo();
    });
    
    $('.fullscreen-wrapper').on('tap', function(){
        $(this).hide();
        $.mobile.changePage('#game-won');
    });
    
    $('#new-game').page();
    $('#game-won').page();
    gameData.load();
    $('.back-to-game').button('disable');
    $.mobile.changePage('#new-game',{changeHash: false});

    window.gameInfo = (function(){
        var blinking = false,
            text = "",
            color = "";

        var self = {};

        self.getBlinking = function(){
            return blinking;
        };

        var mainObj = $("#game-info");
        self.setBlinking = function(val){
            if(val !== blinking){
                blinking = val;
                if(val){
                    mainObj.addClass("blinking");
                }else{
                    mainObj.removeClass("blinking");
                }
            }
        };

        self.getText = function(){
            return text;
        };

        var textObj = $("#game-info>.cont");
        self.setText = function(val){
            text = val;
            textObj.html(val);
        };

        self.getColor = function(){
            return color;
        };

        var colorObj = $("#game-info>.go");
        self.setColor = function(color){
            colorObj.removeClass("white").removeClass("black");
            if(color){
                colorObj.addClass(color);
            }
        };

        return self;
    })();
//});

function showWinDialog(game){
    gameInfo.setBlinking(false);
    if(game.mode === 'hvh'){
        var who=(function(string){ return string.charAt(0).toUpperCase() + string.slice(1);})(game.getCurrentPlayer().color);
        $("#game-won h4").html(who+' Won!');
        gameInfo.value=who+' won.'
        $("#win-content").html(who+' won the game. Play again?');
        $('#happy-outer').fadeIn(500);
    }else{
        if(game.getCurrentPlayer() instanceof HumanPlayer){
            $("#game-won h4").html('You Won!');
            $("#win-content").html('You won the game. Play again?');
            gameInfo.value='You won.'
            $('#sad-outer').fadeIn(500);
        }else{
            $("#game-won h4").html('You Lost.');
            $("#win-content").html('Meh. You lost to the computer. Play again?');
            gameInfo.value='Computer won.'
            $('#happy-outer').fadeIn(500);
        }
    }
}



    // chat

    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // Initialize variables
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box

    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page

    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();

    var socket = io();


    /*function getInitMessage(){
     for (var i in data) addChatMessage(i);
     }*/

    function addParticipantsMessage (data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "当前有 1 名玩家在线";
        } else {
            message += "当前有 " + data.numUsers + " 名玩家在线";
        }


        log(message);
    }

    // Sets the client's username
    function setUsername(name) {
        username = name;
        if (username) {
            socket.emit('change nickname', username);
        }
    }

    // Sends a chat message
    function sendMessage () {
        var message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputMessage.val('');
            addChatMessage({
                username: username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', message);
        }
    }

    // Log a message
    function log (message, options) {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    function addChatMessage (data, options) {
        // Don't fade the message in if there is an 'X was typing'

        //console.log(data); console.log(data.username);

        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));
        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual chat typing message
    function addChatTyping (data) {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping (data) {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement (el, options) {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput (input) {
        return $('<div/>').text(input).text();
    }

    // Updates the typing event
    function updateTyping () {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    // Gets the 'X is typing' messages of a user
    function getTypingMessages (data) {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    function getUsernameColor (username) {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Keyboard events

    $window.keydown(function (event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                //setUsername();
            }
        }
    });

    $inputMessage.on('input', function() {
        updateTyping();
    });

    // Click events

    // Focus input when clicking anywhere on login page
    $loginPage.click(function () {
        $currentInput.focus();
    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', function (data) {
        gameData['id'] = data.id;
        connected = true;
        // Display the welcome message
        var message = "";
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);

        console.log(data.msgs);
        for (var i in data.msgs){
            addChatMessage(data.msgs[i]);
        }

        //getInitMessage(data);
    });

    socket.on('create room', function (data) {
        var message = '玩家 ';
        message += data.room_owner;
        message += ' 创建了编号为 ' + data.room_id +  ' 的房间';
        log(message);
    });



    socket.on('find room', function (data) {
        var message = '玩家 ';
        message += data.room_guest_nickname;
        message += ' 加入了编号为 ' + data.room_id +  ' 的房间';
        log(message);

        //console.log(username);
        var username = gameData['nickname'];
        //console.log(username);

        var id = gameData['id'];

        if (id == data.room_owner) {
            game.mode = 'hvh';
            game.init(new HumanPlayer("black"), new HumanPlayer("white"));
            $.mobile.changePage('#game-page');
            game.start();
            setTimeout(function () {
                $('.back-to-game').button('enable');
            }, 100);
        }
        else if (id == data.room_guest){
            game.mode = 'hvh';
            game.init(new HumanPlayer("black"), new HumanPlayer("white"));
            $.mobile.changePage('#game-page');
            game.start();
            setTimeout(function () {
                $('.back-to-game').button('enable');
            }, 100);
        }
    });

    socket.on('no room', function () {
        var message = '找不到编号为 '+ gameData.room_id  +  ' 的房间';
        log(message);
    });

    socket.on('new message', function (data) {
        addChatMessage(data);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
        log(data.username + ' joined');
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
        log(data.username + ' left');
        addParticipantsMessage(data);
        removeChatTyping(data);
    });

    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', function (data) {
        addChatTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', function (data) {
        removeChatTyping(data);
    });

    $( document ).ready(function(){

        //console.log()
        socket.emit('add user', gameData.nickname);

        $('#chat-box-input').hover(function(){
                $('#chat-box-area').show(300);
                $('#chat-box-area').css("pointer-events", "auto");
            },
            function(){}
        );
        $('#chat-box').hover(function(){},
            function(){
                $('#chat-box-area').hide(300);
                $('#chat-box-area').css("pointer-events", "none");
            }
        );
    });




});;