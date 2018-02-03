//game
function Game() {

    //initialize canvas
    var canvas = document.getElementById("game");
    this.width = canvas.width;
    this.height = canvas.height;
    this.context = canvas.getContext("2d");
    this.context.fillStyle = "white";
    this.keys = new KeyListener();

    //initialize 2 paddles
    this.p1 = new Paddle(5, 0);
    this.p1.y = this.height/2 - this.p1.height/2;
    this.display1 = new Display(this.width/4, 25);
    this.p2 = new Paddle(this.width - 5 - 2, 0)
    this.p2.y = this.height/2 - this.p2.height/2;
    this.display2 = new Display(this.width*3/4, 25);


    //initailzie the ball
    this.ball = new Ball();
    this.ball.x = this.width/2;
    this.ball.y = this.height/2;
    this.ball.vy = Math.floor(Math.random()*12 - 6);
    this.ball.vx = 7 - Math.abs(this.ball.vy);
}

Game.prototype.draw = function()
{
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.fillRect(this.width/2, 0, 2, this.height);

    this.ball.draw(this.context);

    this.p1.draw(this.context);
    this.p2.draw(this.context);

    this.display1.draw(this.context);
    this.display2.draw(this.context);

    
}

Game.prototype.update = function ()
{
    if (this.paused)
        return;

    this.ball.update;
    this.display1.value = this.p1.score;
    this.display1.value = this.p2.score;
    
    //control
    if (this.keys.isPressed(83))
    {
        this.p1.y = Math.min(this.height - this.p1.height, this.p1.y + 10);
    }
    else if (this.keys.isPressed(87))
    {
        this.p1.y = Math.max(0 , this.p1.y - 10);
    }
    if (this.keys.isPressed(40)) 
    {
        this.p2.y = Math.min(this.height - this.p2.height, this.p2.y + 10);
    } else if (this.keys.isPressed(38)) 
    {
        this.p2.y = Math.max(0, this.p2.y - 10);
    }

    //update ball
    this.ball.update();
    if (this.ball.x > this.width || this.ball.x + this.ball.width < 0)
    {
        this.ball.vx = -this.ball.vx;
    }
    else if (this.ball.y > this.height || this.ball.y + this.ball.height < 0)
    {
        this.ball.vy = -this.ball.vy;
    }

    //update the scores
    if (this.ball.x >= this.width)
        this.score(this.p1);
    else if (this.ball.x + this.ball.width <= 0)
        this.score(this.p2);
};

Game.prototype.score = function(p)
{
    //player scores
    p.score++;
    var player = p ==this.p1 ? 0 : 1;

    // this.ball.x = this.width/2;
    // this.ball.y = p.y + p.height/2;

    // this.ball.vy = Math.floor(Math.random() * 12 - 6);
    // this.ball.vx = 7 - Math.abs(this.ball.vy);
    // if (player == 1)
    //     this.ball.vx *= -1;
};

function Display (x, y) {
    this.x = x;
    this.y = y;
    this.value = 0;
}

Display.prototype.draw = function (p)
{
    p.fillText(this.value, this.x, this.y);
};


//paddle
function Paddle (x,y) {
    this.x = x;
    this.y = y;
    this.width = 2;
    this.height = 28;
    this.score = 0;
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
//ball
function Ball() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.width = 4;
    this.height = 4;
};

Ball.prototype.update = function ()
{
    this.x += this.vx;
    this.y += this.vy;
};

Ball.prototype.draw = function (p)
{
    p.fillRect(this.x, this.y, this.width, this.height);
};



//loop
var game = new Game();
function MainLoop() {
    game.update();
    game.draw();
    setTimeout(MainLoop, 33.3333);
}

MainLoop();