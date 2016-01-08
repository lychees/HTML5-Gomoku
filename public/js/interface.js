
$(function(){

    var user_id;
    var room_id;

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
        console.log(message);
        // if there is a non-empty message and a socket connection
        //if (message && connected) {
            $inputMessage.val('');
            /*addChatMessage({
                id: gameData['id'],
                nickname: gameData['nickname'],
                message: message
            });*/
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', message);
        //}
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

        var $usernameDiv = $('<span class="nickname"/>')
            .text(data.nickname)
            .css('color', getUsernameColor(data.id));
        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.nickname)
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
        if (event.which === 13){

            sendMessage();
            socket.emit('stop typing');
            typing = false;

            /*if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                //setUsername();
            }*/
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

        console.log("your id is:" + data.id);
        gameData['id'] = data.id;

        user_id = data.id;

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

        room_id = data.room_id;

        if (data.room_owner == user_id){
            alert("你创建了编号为" + data.room_id + '的房间');
        }

        var message = '玩家 ';
        message += data.room_owner_nickname;
        message += ' 创建了编号为 ' + data.room_id +  ' 的房间';
        log(message);
    });



    socket.on('find room', function (data) {
        room_id = data.room_id;

        var message = '玩家 ';
        message += data.room_guest_nickname;
        message += ' 加入了编号为 ' + data.room_id +  ' 的房间';
        log(message);

        //console.log(username);
        //var username = gameData['nickname'];
        //console.log(username);

        //var id = gameData['id']; //!
        var id = user_id;
        console.log(id);

        if (id == data.room_owner) {
            game.mode = 'hvh';
            //game.init(new HumanPlayer("black"), new HumanPlayer("white"));
            game.init(new LocalHumanPlayer("black"), new RemoteHumanPlayer("white"));
            $.mobile.changePage('#game-page');
            game.start();
            setTimeout(function () {
                $('.back-to-game').button('enable');
            }, 100);
        }
        else if (id == data.room_guest){
            game.mode = 'hvh';
            //game.init(new HumanPlayer("black"), new HumanPlayer("white"));
            game.init(new RemoteHumanPlayer("black"), new LocalHumanPlayer("white"));
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


    // ---------------- game.js

    function Game(boardElm, boardBackgroundElm){
        this.mode = "hvh";
        this.rounds = 0;

        var white, black,
            playing = false,
            history = [],
            players = {},
            currentColor = "black";

        this.board = new Board(boardElm, boardBackgroundElm);

        this.board.clicked = function(r, c){
            console.log("!!!");
            var p = players[currentColor];
            if(p instanceof HumanPlayer){
                p.setGo(r, c);
            }
        };

        this.getCurrentPlayer = function(){
            return players[currentColor];
        };

        this.setCurrentColor = function(color){
            currentColor = color;
        };

        this.toHuman = function(color){
            this.board.setClickable(true, color);
        };

        this.toOthers = function(){
            this.board.setClickable(false);
        };

        this.update = function(r, c, color){
            if(playing){
                this.rounds++;
                this.board.updateMap(r, c, color);
                black.watch(r, c, color);
                white.watch(r, c, color);
                setTimeout(progress, 0);
            }
        };

        function progress(){
            if(currentColor === 'black'){
                white.myTurn();
            }else{
                black.myTurn();
            }
        }

        this.setGo = function(r, c){
            this.segGo(r, c, currentColor);
        };

        this.setGo = function(r, c, color){
            if(!playing || this.board.isSet(r, c))return false;
            history.push({
                r: r,
                c: c,
                color:color
            });
            this.board.highlight(r, c);
            this.board.setGo(r, c, color);

            var result = this.board.getGameResult(r, c, color);

            if(result === "draw"){
                this.draw();
            }else if(result === "win"){
                this.win();
                this.board.winChange(r, c, color);
            }else{
                this.update(r, c, color);
            }
            return true;
        };

        this.undo = function(){
            if(!playing){
                if(!history.length)return;
                var last = history.pop();
                this.board.unsetGo(last.r,last.c);
                white.watch(last.r,last.c,'remove');
                black.watch(last.r,last.c,'remove');
                return;
            }
            do{
                if(!history.length)return;
                var last = history.pop();
                this.board.unsetGo(last.r,last.c);
                white.watch(last.r,last.c,'remove');
                black.watch(last.r,last.c,'remove');
            }while(players[last.color] instanceof AIPlayer);
            var last = history[history.length - 1];
            if(history.length > 0) this.board.highlight(last.r, last.c);
            else this.board.unHighlight();
            players[last.color].other.myTurn();
            for(var col in {'black':'','white':''}){
                if(players[col] instanceof AIPlayer && players[col].computing){
                    players[col].cancel++;
                }
            }
        };

        this.draw = function(){
            playing = false;
            this.board.setClickable(false);
        };

        this.win = function(){
            playing = false;
            this.board.setClickable(false);
            showWinDialog(this);
        };

        this.init = function(player1, player2){
            console.log(player1, player2);
            this.rounds = 0;
            history = [];
            this.board.init();
            players = {};
            players[player1.color] = player1;
            players[player2.color] = player2;
            white = players['white'];
            black = players['black'];
            white.game = this;
            black.game = this;
            white.other = black;
            black.other = white;
            if(!(black instanceof HumanPlayer)){
                this.board.setWarning(0, true);
            }

            if(!(white instanceof HumanPlayer)){
                this.board.setWarning(1, true);
            }
        };

        this.start = function(){
            playing = true;
            players.black.myTurn();
        };
    }

    // --------- Player.js

// Agents that represent either a player or an AI
    function Player(color){
        this.color = color;
    }

    Player.prototype.myTurn = function(){
        this.game.setCurrentColor(this.color);
        //game.setCurrentColor(this.color);
        gameInfo.setText((function(string){
            return string.charAt(0).toUpperCase() + string.slice(1);
        })(this.color)+"'s turn.");
        gameInfo.setColor(this.color);
        gameInfo.setBlinking(false);
    };

    Player.prototype.watch = function(){};

    Player.prototype.setGo = function(r,c){
        return this.game.setGo(r, c, this.color);
    };

    function HumanPlayer(color, game){
        Player.call(this, color, game);
    }

    HumanPlayer.prototype = new Player();

    HumanPlayer.prototype.myTurn = function(){
        Player.prototype.myTurn.call(this);
        this.game.toHuman(this.color);
        if(this.other instanceof AIPlayer){
            gameInfo.setText('Your turn');
        }
    };

    function LocalHumanPlayer(color, game){
        HumanPlayer.call(this, color, game);
    }
    LocalHumanPlayer.prototype = new HumanPlayer();
    LocalHumanPlayer.prototype.myTurn = function(){
        HumanPlayer.prototype.myTurn.call(this);
        this.game.toHuman(this.color);
        gameInfo.setText('Your turn');
    };



    function RemoteHumanPlayer(color, game){
        HumanPlayer.call(this, color, game);
    }
    RemoteHumanPlayer.prototype = new HumanPlayer();
    RemoteHumanPlayer.prototype.myTurn = function(){
        HumanPlayer.prototype.myTurn.call(this);
        this.game.toOthers();
        gameInfo.setText("Thinking...");
        gameInfo.setBlinking(true);
        //this.move();
    };


    LocalHumanPlayer.prototype.setGo = function(r,c){
        //console.log("set go: ", r, c);
        log("你下了" + r + ' '+ c + '位置');
        socket.emit('move', {
            r: r,
            c: c,
            user_id: user_id,
            room_id: room_id
        });
        return this.game.setGo(r, c, this.color);
    };

    RemoteHumanPlayer.prototype.setGo = function(r,c){
        //console.log("set go: ", r, c);
        //console.log(data);
        log("你的对手下了" + r + ' '+ c + '位置');        ;
        return this.game.setGo(r, c, this.color);
    };

    socket.on('move', function (data) {
        if (data.user_id == user_id) {

            console.log(data);

            game.board.clicked(data.r, data.c);
            //log(data.username + ' joined');
            //addParticipantsMessage(data);
            //game.board.clicked(data.r, data.c);
            //game.setGo(data.r, data.c);
        }

    });


    function AIPlayer(mode, color, game){
        Player.call(this, color, game);
        this.computing = false;
        this.cancel = 0;
        this.mode = mode;
        this.worker = new Worker('js/ai-worker.js');
        var self=this;
        this.worker.onmessage=function(e){
            switch(e.data.type){
                /*case 'error':
                 console.log(e.data.message);
                 break;*/
                case 'decision':
                    self.computing=false;
                    if(self.cancel>0){
                        self.cancel--;
                    }else{
                        self.setGo(e.data.r,e.data.c);
                    }
                    break;
                case 'starting':
                    self.computing=true;
                    break;
                case 'alert':
                    alert(e.data.msg);
                    break;
                default:
                    console.log(e.data);
            }
        };
        this.worker.postMessage({
            type: 'ini',
            color: color,
            mode: mode
        });
    }

    AIPlayer.prototype = new Player();

    AIPlayer.prototype.myTurn = function(){
        Player.prototype.myTurn.call(this);
        this.game.toOthers();
        gameInfo.setText("Thinking...");
        gameInfo.setBlinking(true);
        this.move();
    };

    AIPlayer.prototype.watch = function(r, c, color){
        this.worker.postMessage({
            type: 'watch',
            r: r,
            c: c,
            color: color
        });
    };

    AIPlayer.prototype.move = function(){
        if(this.game.rounds === 0){
            this.setGo(7, 7);
        }else if(this.game.rounds === 1){
            var moves=[
                [6,6],
                [6,7],
                [6,8],
                [7,6],
                [7,7],
                [7,8],
                [8,6],
                [8,7],
                [8,8]
            ];
            while(true){
                var ind=Math.floor(Math.random()*moves.length);
                if(this.setGo(moves[ind][0], moves[ind][1])){
                    return;
                }else{
                    moves.splice(ind,1);
                }
            }
        }else{
            this.worker.postMessage({
                type: 'compute'
            });
        }
    };

});;