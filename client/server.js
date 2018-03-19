//====================================
//       connection to Server
//====================================

var Server;
var identity;
var seq = 1;
var gameOn = false;
var posCalc;

//client prediction
var constructBuffer = [];
var recvedBuffer = [];

//interpolation
var toInterpolate = [];
var interpolatedBuffer = [];

//fps controlling
var stop = false;
var now, elapsed;
var then = 0;
var fps = 60;
var fpsInterval = 1000 / fps;

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
        
        // Legacy: m3 timestamp print, may result browser crash 
        // log("server sends message:" + payload);
        // var milliseconds = (new Date).getTime();
        // log ("client received at: " + milliseconds);
        
        //initial clientGameState
        if (payload.trim() === "init")
        {
            idnetity = document.getElementById("userid").value;
        }

        //quit game
        else if (payload.trim() === "quit")
        {
            gameOn = false;
            log ("Game Over");
            disconnect();
            game.quit();
        }
        //receive new serverGameState
        else
        {
            recvedBuffer.push(payload);
            toInterpolate.push(payload);
            var l = toInterpolate.length;
            if (l >= 3 && !gameOn)
            {
                gameOn = true;
                beginLoop();
            }
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
    gameOn = false;
    send(identity.value+":"+"quit"); 
}




//============================
//          Interpolation
//============================

function stn(gs)
{
    var result = new Array();
    var s = gs.split("_");
    for (var i=0; i<13; ++i)
    {
        result.push(Number(s[i]));
    }
    return result;
}

// //return an array of interpolated gs
function Interpolation(gs1, gs2)
{
    var s1 = stn(gs1);
    var s2 = stn(gs2);
    var i1 = [ s1[0], s1[1], s1[2], s1[3], s1[5], s1[6], s1[8], s1[9], s1[11], s1[12] ];
    var i2 = [], i3 = [], i4 = [], i5 = [], i6 = [], i7 = [], i8 = [], i9 = [], i10 = [];
    
    //ball positive on X
    if (s2[0] > s1[0])
    {
        i2.push(s1[0] + 1);
        i3.push(s1[0] + 2);
        i4.push(s1[0] + 3);
        i5.push(s1[0] + 4);
		/*
        i6.push(s1[0] + 5);
        i7.push(s1[0] + 6);
        i8.push(s1[0] + 7);
        i9.push(s1[0] + 8);
        i10.push(s1[0] + 9);
		*/

    }
    else
    {
        i2.push(s1[0] - 1);
        i3.push(s1[0] - 2);
        i4.push(s1[0] - 3);
        i5.push(s1[0] - 4);
		/*
        i6.push(s1[0] - 5);
        i7.push(s1[0] - 6);
        i8.push(s1[0] - 7);
        i9.push(s1[0] - 8);
        i10.push(s1[0] - 9);
		*/
    }
    
    //ball positive on Y
    if (s2[1] > s1[1])
    {
    	i2.push(s1[1] + 1);
    	i3.push(s1[1] + 2);
    	i4.push(s1[1] + 3);
    	i5.push(s1[1] + 4);
		/*
    	i6.push(s1[1] + 5);
    	i7.push(s1[1] + 6);
    	i8.push(s1[1] + 7);
    	i9.push(s1[1] + 8);
    	i10.push(s1[1] + 9);
		*/
    }
    else
    {
    	i2.push(s1[1] - 1);
    	i3.push(s1[1] - 2);
    	i4.push(s1[1] - 3);
    	i5.push(s1[1] - 4);
		/*
    	i6.push(s1[1] - 5);
    	i7.push(s1[1] - 6);
    	i8.push(s1[1] - 7);
    	i9.push(s1[1] - 8);
    	i10.push(s1[1] - 9);
		*/
    }

    // log ("calculate player position");
    
    for (var i = 0; i<4; ++i)
    {
        if (i == 0)
            var iX = 2; //2, 5, 8, 11
        else if (i == 1)
            var iX = 5;
        else if (i == 2)
            var iX = 8;
        else if (i == 3)
            var iX = 11;
        var iY = iX+1; //3, 6, 9, 12
        var xDelta = s2[iX] - s1[iX];
        var xAct = Math.floor(xDelta/5);
        var yDelta = s2[iY] - s2[iY];
        var yAct = Math.floor(yDelta/5);
        
        if (xDelta >= 0)
        {
            i2.push(s1[iX] + xAct);
            i3.push(s1[iX] + 2*xAct);
            i4.push(s1[iX] + 3*xAct);
            i5.push(s1[iX] + 4 * xAct);
			/*
            i6.push(s1[iX] + 5 * xAct);
            i7.push(s1[iX] + 6 * xAct);
            i8.push(s1[iX] + 7 * xAct);
            i9.push(s1[iX] + 8 * xAct);
            i10.push(s1[iX] + 9 * xAct);
			*/
        }
        else
        {
        	i2.push(s1[iX] - xAct);
        	i3.push(s1[iX] - 2 * xAct);
        	i4.push(s1[iX] - 3 * xAct);
        	i5.push(s1[iX] - 4 * xAct);
			/*
        	i6.push(s1[iX] - 5 * xAct);
        	i7.push(s1[iX] - 6 * xAct);
        	i8.push(s1[iX] - 7 * xAct);
        	i9.push(s1[iX] - 8 * xAct);
        	i10.push(s1[iX] - 9 * xAct);
			*/
        }
        
        if (yDelta >= 0)
        {
            i2.push(s1[iY] + yAct);
            i3.push(s1[iY] + 2*yAct);
            i4.push(s1[iY] + 3*yAct);
            i5.push(s1[iY] + 4 * yAct);
			/*
            i6.push(s1[iY] + 5 * yAct);
            i7.push(s1[iY] + 6 * yAct);
            i8.push(s1[iY] + 7 * yAct);
            i9.push(s1[iY] + 8 * yAct);
            i10.push(s1[iY] + 9 * yAct);
			*/
        }
        else
        {
        	i2.push(s1[iY] - yAct);
        	i3.push(s1[iY] - 2 * yAct);
        	i4.push(s1[iY] - 3 * yAct);
        	i5.push(s1[iY] - 4 * yAct);
			/*
        	i6.push(s1[iY] - 5 * yAct);
        	i7.push(s1[iY] - 6 * yAct);
        	i8.push(s1[iY] - 7 * yAct);
        	i9.push(s1[iY] - 8 * yAct);
        	i10.push(s1[iY] - 9 * yAct);
			*/
        }
    }
    
    var i11 = [ s2[0], s2[1], s2[2], s2[3], s2[5], s2[6], s2[8], s2[9], s2[11], s2[12] ];
    
    var result = new Array();
    result.push(i1);
    result.push(i2);
    result.push(i3);
    result.push(i4);
    result.push(i5);
	/*
    result.push(i6);
    result.push(i7);
    result.push(i8);
    result.push(i9);
    result.push(i10);
	*/
    result.push(i11);
    
    return result;
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
        
        // this.ball.x = Number(s[0]);
        // this.ball.y = Number(s[1]);
        
        if (identity == this.score1.userID)
        {
            this.p1.x = Number(s[2]);
            this.p1.y = Number(s[3]);
            this.score1.value = Number(s[4]);
        }
        
        if (identity == this.score2.userID)
        {
            this.p2.x = Number(s[5]);
            this.p2.y = Number(s[6]);
            this.score2.value = Number(s[7]);
        }
        
        if (identity == this.score3.userID)
        {
            this.p3.x = Number(s[8]);
            this.p3.y = Number(s[9]);
            this.score3.value = Number(s[10]);
        }

        if (identity == this.score4.userID)
        {
            this.p4.x = Number(s[11]);
            this.p4.y = Number(s[12]);
            this.score4.value = Number(s[13]);
        }
        
        this.score1.userID = s[14];
        this.score2.userID = s[15];
        this.score3.userID = s[16];
        this.score4.userID = s[17];
}

Game.prototype.iupdate = function (iGS)
{
	//log("iGS: " + iGS);
    this.ball.x = Number(iGS[0]);
    this.ball.y = Number(iGS[1]);

    
    if (identity == this.score1.userID)
    {
    	this.p2.x = Number(iGS[4]);
    	this.p2.y = Number(iGS[5]);
    	this.p3.x = Number(iGS[6]);
    	this.p3.y = Number(iGS[7]);
        this.p4.x = Number(iGS[8]);
        this.p4.y = Number(iGS[9]);
    }
    
    else if (identity == this.score2.userID)
    {
    	this.p1.x = Number(iGS[2]);
    	this.p1.y = Number(iGS[3]);
        this.p3.x = Number(iGS[6]);
        this.p3.y = Number(iGS[7]);
        this.p4.x = Number(iGS[8]);
        this.p4.y = Number(iGS[9]);
    }
        
    else if (identity == this.score3.userID)
    {
    	this.p1.x = Number(iGS[2]);
    	this.p1.y = Number(iGS[3]);
    	this.p2.x = Number(iGS[4]);
    	this.p2.y = Number(iGS[5]);
        this.p4.x = Number(iGS[8]);
        this.p4.y = Number(iGS[9]);
    }
    
    else if (identity == this.score4.userID)
    {
    	this.p1.x = Number(iGS[2]);
    	this.p1.y = Number(iGS[3]);
    	this.p2.x = Number(iGS[4]);
    	this.p2.y = Number(iGS[5]);
    	this.p3.x = Number(iGS[6]);
    	this.p3.y = Number(iGS[7]);

    }
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
            var tmp = this.p4.y - 4;
            this.p4.y = Math.max(0, tmp);
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
            var tmp = this.height - this.p4.height;
            var tmp2 = this.p4.y + 4;
            this.p4.y = Math.min(tmp, tmp2);
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
    if (gameOn)
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
    if (toInterpolate.length >= 3)
    {
        var gs1 = toInterpolate[0], gs2 = toInterpolate[1];
        var renderGS = new Array();
        renderGS = Interpolation(gs1, gs2);
        for (var i=0; i<renderGS.length; ++i)
        {
        	var tmp = renderGS[i];
            interpolatedBuffer.push(tmp);
        }
        
        toInterpolate.splice(0,2);
    }

    // log ("oustside interpolation");
    now = Date.now();
    elapsed = now - then;

    if (gameOn && elapsed > fpsInterval)
    {
        then = now - (elapsed % fpsInterval);
        //input -> update -> render
        game.control();
        game.draw();
        
        //received serverGameState
        if (recvedBuffer.length != 0)
        {
            var s = recvedBuffer[0].split("_");

            game.score1.value = Number(s[4]);
            game.score2.value = Number(s[7]);
            game.score3.value = Number(s[10]);
            game.score4.value = Number(s[13]);

            game.score1.userID = s[14];
            game.score2.userID = s[15];
            game.score3.userID = s[16];
            game.score4.userID = s[17];

            //log ("server GameState: " + recvedBuffer[0]);
            
            //player 1
            if (identity == s[14])
            {
                var del; 
                for (var i=0; i<constructBuffer.length; ++i)
                {
                    //the predicted clientGameState to compare
                    var gs = constructBuffer[i];
                    //check seq
                    if (gs[5][0] == s[18])
                    {
                        //log ("find the seq");
                        del = i;
                        //preicted clientGameState != serverGameState -> re-render
                        if (gs[1][0].toString() !=  s[2])
                        {
                            //log ("incorrect rendering");
                            //log ("prediction: " + gs[1][0] + " " + "server: " + s[2]);
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
                        del = i;
                        //preicted clientGameState != serverGameState -> re-render
                        if (gs[4][1].toString() !=  s[12])
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

            //remove the first serverGameState in buffer, b/c client already comfirmed it
            if (recvedBuffer.length > 0)
            {
                recvedBuffer.splice(0,1);
            }

        	//render 1 gs from InterpolationBuffer and discard it
            for (var r = 0; r < interpolatedBuffer.length; ++r)
            {
            	game.iupdate(interpolatedBuffer[r]);
            	game.draw();
            	interpolatedBuffer.splice(0,1);
            }
			/*
            if (interpolatedBuffer.length >= 1) {
            	game.iupdate(interpolatedBuffer[0]);
            	game.iupdate(interpolatedBuffer[1]);
            	game.draw();
            	interpolatedBuffer.splice(0, 1);
            }
			*/

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