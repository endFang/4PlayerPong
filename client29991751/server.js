var Server;
var gameOn = 0;

function log( text ) {
    $log = $('#log');
    //Add text to log
    $log.append(($log.val()?"\n":'')+text);
    //Autoscroll
    $log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
}

function send( text ) {
    Server.send( 'message', text );
}

function connect(){
    log('Connecting...');
    Server = new FancyWebSocket('ws://' + document.getElementById('ip').value + ':' + document.getElementById('port').value);

    $('#message').keypress(function(e) {
        if ( e.keyCode == 13 && this.value ) {
            log( 'You: ' + this.value );
            send( this.value );

            $(this).val('');
        }
    });


    //Let the user know we're connected
    Server.bind('open', function() {
        document.getElementById("cntBtn").disabled = true;
        log( "Connected." );
    });

    //OH NOES! Disconnection occurred.
    Server.bind('close', function( data ) {
        document.getElementById("cntBtn").disabled = false;
        log( "Disconnected." );
    });

    //Log any messages sent from server
    Server.bind('message', function( payload ) {
        //initial gameState
        if (payload.trim() === "init")
        {
            gameOn = 1;
            Loop(payload);
        }
        //quit game
        else if (payload.trim() === "quit")
        {
            gameOn = 0;
            game.quit();
        }
        //receive new gameState
        else
        {
            Loop(payload);
            // log (payload);
        }
    });

    Server.connect();

}

function disconnect(){
    log("Disconnecting...");
    Server.disconnect();
}


function startGame() {
    send("id:"+document.getElementById("userid").value);
    send("init");
}

function quitGame() { send("quit"); }


//Pong
function Game() {

    //initialize gametable
    var canvas = document.getElementById("game");
    this.width = canvas.width;
    this.height = canvas.height;
    this.context = canvas.getContext("2d");
    this.context.fillStyle = "white";
    this.keys = new KeyListener();

    //initialize paddles
    this.p1 = new Paddle(this.width/2, 0, 100, 5);
    // this.p1.y = this.height - this.p1.height*5;
    this.score1 = new Display(this.width/4, 480)


    //initailzie the ball
    this.ball = new Ball();
    // this.ball.x = this.width/2;
    // this.ball.y = this.height/2;
    // this.ball.vy = 5;
    // this.ball.vx = 5;
}


// Game.prototype.score = function(p) {
//     p.score++;
// }
Game.prototype.draw = function()
{
    this.context.clearRect(0, 0, this.width, this.height);
    this.ball.draw(this.context);
    this.p1.draw(this.context);
    this.score1.draw(this.context);
}

Game.prototype.update = function (payload)
{
        var input = payload;
        var s = payload.split("_");
        this.ball.x = s[0];
        this.ball.y = s[1];
        this.p1.x = s[2];
        this.p1.y = s[3];
        this.score1.value = Number(s[4]);
}


Game.prototype.control = function ()
{
    if (this.keys.isPressed(68)){
        send("r");
    }
    else if (this.keys.isPressed(65)){
        send("l");
    }
}

Game.prototype.quit = function()
{
    this.context.clearRect(0, 0, this.width, this.height);
}


//ball
function Ball() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.width = 10;
    this.height = 10;
};

// Ball.prototype.update = function ()
// {
//     this.x += this.vx;
//     this.y += this.vy;
// };

Ball.prototype.draw = function (p)
{
    p.fillRect(this.x, this.y, this.width, this.height);
};


//paddle
function Paddle (x,y,w,h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    // this.score = 0;
}

Paddle.prototype.draw = function (p)
{
    p.fillRect(this.x, this.y, this.width, this.height);
}

//input
//bind(): tell the callback that "this" actually points to our KeyListener isntance(this3)
function KeyListener () {
    this.pressedKeys = [];
    this.keydown = function (e) { this.pressedKeys[e.keyCode] = true;};
    this.keyup = function(e){this.pressedKeys[e.keyCode] = false;};
    document.addEventListener("keydown", this.keydown.bind(this));
    document.addEventListener("keyup", this.keyup.bind(this));
}

KeyListener.prototype.isPressed = function (key)
{
    return this.pressedKeys[key] ? true : false;
}

KeyListener.prototype.addKeyPressListener = function (key)
{
    docuemtn.addKeyPressListener("keypress", function(e){
        if (e.keyCode == keyCode)
            callback(e);
    })
}

//display
function Display (x, y) {
    this.x = x;
    this.y = y;
    this.value = 0;
}

Display.prototype.draw = function (p){
    p.font = "20px Georgia";
    p.fillText(this.value, this.x, this.y);
    p.fillText(document.getElementById("userid").value, this.x, this.y+15);
}

//loop
var game = new Game();

function Loop(payload) {
    if (gameOn == 1)
    {
        game.control();
        game.update(payload);
        game.draw();
    }
}




//pong legacy code
/*
Game.prototype.update = function ()
{
    if (this.paused)
        return;

    this.ball.update();

    this.score1.value = this.p1.score;
    
    // control
    if (this.keys.isPressed(68)){
        this.p1.x = Math.min(this.width - this.p1.width, this.p1.x + 4);
        send("r");
    }
    else if (this.keys.isPressed(65)){
        this.p1.x = Math.max(0 , this.p1.x - 4);
        send("l");
    }

    //collision detection
    //left and right
    if ((this.ball.vx < 0 && this.ball.x < 0) ||
            (this.ball.vx > 0 && this.ball.x + this.ball.width > this.width)) {
        this.ball.vx = -this.ball.vx;
    }

    //bottom and top
    if ((this.ball.vy < 0))
    {
        //top
        if (this.ball.y < 0)
            this.ball.vy = -this.ball.vy;
    }
    else
    {
        //bottom
        if (this.p1.y <= this.ball.y + this.ball.height)
            //  && this.p1.y > this.ball.y - this.ball.vy + this.ball.height)
        {
            //collision distance
            var d = this.ball.y + this.ball.height - this.p1.y;
            //time
            var t = d/this.ball.vy;
            //x translate
            var x = this.ball.vx*t + (this.ball.x - this.ball.vx)
            if (x >= this.p1.x && x + this.ball.width <= this.p1.x + this.p1.width )
            {
                // this.ball.y = this.p1.y - this.ball.height;
                // this.ball.x = Math.floor(this.ball.x-this.ball.vx+this.ball.vx*k);
                this.ball.vy = -this.ball.vy;
                this.score(this.p1);
            }
        }
        if (this.ball.y > this.height)
            this.ball.vy = -this.ball.vy;
    }

};
*/