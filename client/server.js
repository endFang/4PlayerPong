//====================================
//       connection to Server
//====================================

var Server;
var identity;
var seq = 1;
var gameOn = 0;
var posCalc;

var constructBuffer = [];
var recvedBuffer = [];

$( "#start" ).click(function() {
    $(this).attr("disabled", "disabled");
    $("#quit").removeAttr("disabled");
 });
 $( "#quit" ).click(function() {
      $(this).attr("disabled", "disabled");
      $("#start").removeAttr("disabled");
 });


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
        // log (payload);
        
        // Legacy: m3 timestamp print, may result browser crash 
        // log("server sends message:" + payload);
        // var milliseconds = (new Date).getTime();
        // log ("client received at: " + milliseconds);
        
        //initial clientGameState
        if (payload.trim() === "init")
        {
            gameOn = 1;
            idnetity = document.getElementById("userid").value;
            beginLoop();
        }

        //quit game
        else if (payload.trim() === "quit")
        {
            gameOn = 0;
            log ("Game Over");
            disconnect();
            game.quit();
        }
        //receive new serverGameState
        else
        {
            recvedBuffer.push(payload);
        }
    });

    Server.connect();

}

function disconnect(){
    log("Disconnecting...");
    Server.disconnect();
}


function startGame() {
    identity = document.getElementById("userid").value;
    send(identity+":"+"init"); 
}

function quitGame() { 
    gameOn = 0;
    send(identity.value+":"+"quit"); 
}



//========================================
//               Pong
//========================================

//====================
//       Ball
//====================
function Ball() {
    this.x = 0;
    this.y = 0;
    this.width = 10;
    this.height = 10;
};


Ball.prototype.draw = function (p)
{
    p.fillRect(this.x, this.y, this.width, this.height);
};


//====================
//       Paddle
//====================
function Paddle (x,y,w,h) {
    this.x = Number(x);
    this.y = Number(y);
    this.width = Number(w);
    this.height = Number(h);
}

Paddle.prototype.draw = function (p)
{
    p.fillRect(this.x, this.y, this.width, this.height);
}


//================================
//       Display for ID & Score
//================================
function Display (x, y) {
    this.x = x;
    this.y = y;
    this.value = 0;
    this.userID;
}

Display.prototype.draw = function (p){
    p.font = "20px Georgia";
    p.fillText(this.value, this.x, this.y);
    p.fillText(this.userID, this.x, this.y+15);
}


//====================
//       Game State
//====================
function Game() {
    //initialize clientGameState
    var canvas = document.getElementById("game");
    this.width = canvas.width;
    this.height = canvas.height;
    this.context = canvas.getContext("2d");
    this.context.fillStyle = "white";
    this.keys = new KeyListener();

    //initialize paddles
    this.p1 = new Paddle(this.width/2, 480, 100, 5);
    this.score1 = new Display(this.width/4, 480)

    this.p2 = new Paddle(this.width/2, 20, 100, 5);
    this.score2 = new Display(this.width*3/4, 20)

    this.p3 = new Paddle(20, this.height/2, 5, 100);
    this.score3 = new Display(20, this.height/4)

    this.p4 = new Paddle(580, this.height/2, 5, 100);
    this.score4 = new Display(550, this.height*3/4)

    //initailzie ball
    this.ball = new Ball();

}


Game.prototype.draw = function()
{
    this.context.clearRect(0, 0, this.width, this.height);
    this.ball.draw(this.context);
    
    this.p1.draw(this.context);
    this.score1.draw(this.context);
    
    this.p2.draw(this.context);
    this.score2.draw(this.context);
    
    this.p3.draw(this.context);
    this.score3.draw(this.context);
    
    this.p4.draw(this.context);
    this.score4.draw(this.context);
}


//Update clientGameState based on serverGameState
Game.prototype.update = function (payload)
{
        var input = payload;
        var s = payload.split("_");
        
        this.ball.x = Number(s[0]);
        this.ball.y = Number(s[1]);
        
        this.p1.x = Number(s[2]);
        this.p1.y = Number(s[3]);
        this.score1.value = Number(s[4]);

        this.p2.x = Number(s[5]);
        this.p3.y = Number(s[6]);
        this.score2.value = Number(s[7]);

        this.p3.x = Number(s[8]);
        this.p3.y = Number(s[9]);
        this.score3.value = Number(s[10]);

        this.p4.x = Number(s[11]);
        this.p4.y = Number(s[12]);
        this.score4.value = Number(s[13]);

        this.score1.userID = s[14];
        this.score2.userID = s[15];
        this.score3.userID = s[16];
        this.score4.userID = s[17];
}


Game.prototype.control = function ()
{
    if (this.keys.isPressed(68)){
        //move paddle to right 1 unit
        //predict clientGameState
        
        if (identity == this.score1.userID)
        {
            var tmp = this.width - this.p1.width;
            var tmp2 = this.p1.x + 4;
            this.p1.x = Math.min(tmp, tmp2);
        }
        else if (identity == this.score2.userID)
        {
            var tmp = this.width - this.p2.width;
            var tmp2 = this.p2.x + 4;
            this.p2.x = Math.min(tmp, tmp2);
        }
        else if (identity == this.score3.userID)
        {
            var tmp = this.height - this.p3.height;
            var tmp2 = this.p3.y + 4;
            this.p3.y = Math.min(tmp, tmp2);
        }
        else if (identity == this.score4.userID)
        {
            log ("old p4 pos: " + this.p4.y);
            var tmp = this.p4.y - 4;
            this.p4.y = Math.max(0, tmp);
            log ("new p4 pos: " + this.p4.y + " seq: " + seq);
        }
        
        //store predicted clientGameState for later comparison
        var gs = [[this.ball.x, this.ball.y],
                    [this.p1.x, this.p1.y],
                    [this.p2.x, this.p2.y],
                    [this.p3.x, this.p3.y],
                    [this.p4.x, this.p4.y], 
                    [seq]];
        constructBuffer.push(gs);

        //send input to server
        send(seq.toString()+ "_"+identity+":"+"moveR");
        ++seq;
    }
    else if (this.keys.isPressed(65)){
        //move paddle to left 1 unit
        //predict clientGameState
        if (identity == this.score1.userID)
        {
            var tmp = this.p1.x - 4;
            this.p1.x = Math.max(0, tmp);
        }
        else if (identity == this.score2.userID)
        {
            var tmp = this.p2.x - 4;
            this.p2.x = Math.max(0, tmp);
        }
        else if (identity == this.score3.userID)
        {
            var tmp = this.p3.y - 4;
            this.p3.y = Math.max(0, tmp);
        }
        else if (identity == this.score4.userID)
        {
            log ("old p4 pos: " + this.p4.y);
            var tmp = this.height - this.p4.height;
            var tmp2 = this.p4.y + 4;
            this.p4.y = Math.min(tmp, tmp2);
            log ("new p4 pos: " + this.p4.y + " seq: " + seq);
        }

        //store predicted clientGameState for later comparison
        var gs = [[this.ball.x, this.ball.y],
                    [this.p1.x, this.p1.y],
                    [this.p2.x, this.p2.y],
                    [this.p3.x, this.p3.y],
                    [this.p4.x, this.p4.y], 
                    [seq]];
        constructBuffer.push(gs);

        //send input to server
        send(seq.toString()+ "_"+identity+":"+"moveL");
        ++seq;
    }
}

Game.prototype.quit = function()
{
    this.context.clearRect(0, 0, this.width, this.height);
}



//==============================
//         Game Loop
//==============================
var game = new Game();

//draw the initial clientGameState
function beginLoop() {
    if (gameOn == 1)
    {
        game.draw();
    }
    Loop();
}



//=====================================================
//                  payload index 
//  index 0, 1            |           ball x, y
//  index 2, 3            |           p1 x, y
//  index 4               |           p1 score
//  index 5, 6            |           p2 x, y
//  index 7               |           p2 score
//  index 8, 9            |           p3 x, y
//  index 10              |           p3 score
//  index 11, 12          |           p4 x, y
//  index 13              |           p4 score
//  index 14, 15, 16, 17  |           userID for p1, p2, p3, p4
//  index 18, 19, 20, 21  |           seq for p1, p2, p3, p4
//=====================================================

//Main game loop
function Loop() {
    if (gameOn == 1)
    {
        //takes input and update clientGameState
        game.control();
        //render clientGameState
        game.draw();

        //received serverGameState
        if (recvedBuffer.length != 0)
        {
            log("serverGameState: " + recvedBuffer[0]);
            // log ("current p1.x: " + game.p1.x + " seq: " + seq);
            log ("current p4.y: " + game.p4.y + " seq: " + seq);
            var s = recvedBuffer[0].split("_");
            game.ball.x = Number(s[0]);
            game.ball.y = s[1];
        
            // game.p1.x = s[2];
            // game.p1.y = s[3];
            game.score1.value = Number(s[4]);

            // game.p2.x = s[5];
            // game.p3.y = s[6];
            game.score2.value = Number(s[7]);

            // game.p3.x = s[8];
            // game.p3.y = s[9];
            game.score3.value = Number(s[10]);

            // game.p4.x = s[11];
            // game.p4.y = s[12];
            game.score4.value = Number(s[13]);

            game.score1.userID = s[14];
            game.score2.userID = s[15];
            game.score3.userID = s[16];
            game.score4.userID = s[17];
            
            //player 1
            if (identity == s[14] && constructBuffer.length > 0)
            {
                var del; 
                for (var i=0; i<constructBuffer.length; ++i)
                {
                    //the predicted clientGameState to compare
                    var gs = constructBuffer[i];
                    //check seq
                    if (gs[5][0] == s[18])
                    {
                        del = i;
                        //preicted clientGameState != serverGameState -> re-render
                        if (gs[1][0].toString() !=  s[2])
                        {
                            game.update(recvedBuffer[0]);
                            game.draw();
                        }
                        recvedBuffer.splice(0,1);
                        break;
                    }
                }
                
                //remove all prediction before this prediction
                constructBuffer.splice(0,del+1);
            }
            
            // player 2
            else if (identity == s[15])
            {
                var del; 
                for (var i=0; i<constructBuffer.length; ++i)
                {
                    //the predicted clientGameState to compare
                    var gs = constructBuffer[i];
                    //check seq
                    if (gs[5][0] == s[19])
                    {
                        
                        del = i;
                        //preicted clientGameState != serverGameState -> re-render
                        if (gs[2][0].toString() !=  s[5])
                        {
                            game.update(recvedBuffer[0]);
                            game.draw();
                        }
                        recvedBuffer.splice(0,1);
                        break;
                    }
                }
                
                //remove all prediction before this prediction
                constructBuffer.splice(0,del+1);
            }

            //player 3
            else if (identity == s[16])
            {
                var del; 
                for (var i=0; i<constructBuffer.length; ++i)
                {
                    //the predicted clientGameState to compare
                    var gs = constructBuffer[i];
                    //check seq
                    if (gs[5][0] == s[20])
                    {
                        del = i;
                        //preicted clientGameState != serverGameState -> re-re der
                        if (gs[3][1].toString() !=  s[9])
                        {
                            game.update(recvedBuffer[0]);
                            game.draw();
                        }
                        recvedBuffer.splice(0,1);
                        break;
                    }
                }
                //remove all prediction before this prediction
                constructBuffer.splice(0,del+1);
            }

            //player 4
            else if (identity == s[17])
            {
                var del; 
                for (var i=0; i<constructBuffer.length; ++i)
                {
                    //the predicted clientGameState to compare
                    var gs = constructBuffer[i];
                    //check seq
                    if (gs[5][0] == s[21])
                    {
                        log ("find seq: " + s[21]);
                        del = i;
                        //preicted clientGameState != serverGameState -> re-render
                        if (gs[4][1].toString() !=  s[12])
                        {
                            log ("incorrect render");
                            game.update(recvedBuffer[0]);
                            game.draw();
                        }
                        recvedBuffer.splice(0,1);
                        break;
                    }
                }
                //remove all prediction before this prediction
                constructBuffer.splice(0,del+1);
            }

            //remove the first serverGameState in buffer, b/c client already comfirmed it
            if (recvedBuffer.length > 0)
            {
                recvedBuffer.splice(0,1);
            }
        }
    }
    requestAnimationFrame(Loop);


    //legacy code before m4
    // if (gameOn == 1)
    // {
    //     game.control();
    //     game.update(payload);
    //     game.draw();
    // }
}



//input
//bind(): tell the callback that "this" actually points to our KeyListener isntance(this3)
function KeyListener () {
    this.pressedKeys = [];
    this.keydown = function (e) { 
        this.pressedKeys[e.keyCode] = true; 
    };
    this.keyup = function(e){ 
        this.pressedKeys[e.keyCode] = false; 
    };
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



//======================
//      Alex Function
//======================

function getNextState(s1, s2) {
    var sp1 = s1.split("_");
    var s1x = sp1[0];
    var s1y = sp1[1];

    var sp2 = s2.split("_");
    var s2x = sp2[0];
    var s2y = sp2[1];

    var ydiff = s2y - s1y;
    var xdiff = s2x - s1x;
    var ynew = s2y + ydiff;
    var xnew = s2x + xdiff;
    
    if (ynew < 0) {
        ynew = -ynew;
    }
    //replace with canvas sizes instead of numbers
    else if(ynew>500){
        ynew = -(500 - ynew);
    }

    if (xnew < 0) {
        xnew = -xnew;
    }
    //replace with canvase size instead of numbers
    else if (xnew > 600) {
        xnew = -(600 - xnew);
    }

    var s3 = xnew + "_" + ynew;
    for (var i = 2; i < 18; i++)
    {
        s3 += "_" + sp2[i];
    }
    return s3;

    //if want to return just the ball predicted location, would be just xnew and ynew

}