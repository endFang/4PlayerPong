#include <stdlib.h>
#include <iostream>
#include <iomanip>
#include <string>
#include <sstream>
#include <time.h>
#include "websocket.h"
#include <cstdlib>
#include <thread>
#include <cmath>
#define NUM_THREADS 4

#define INTERVAL_MS 0.1
int interval_clocks = CLOCKS_PER_SEC * INTERVAL_MS / 1000;

//#define PI 3.14159265

using namespace std;

int count;
std::pair<int, int> canvas;  //(x,y)

struct Ball {
	int width = 10;
	int height = 10;
	int posX;
	int posY;
	int speed;
	int acceleration;
	int velocityX = 0;
	int velocityY = 0;
	int maxAngle = 45;  //maximum angle of return when ball hits paddle

	Ball() {

	}

	Ball(int positionX, int positionY, int initialSpeed, int angleDegrees) {
		posX = positionX;
		posY = positionY;
		speed = initialSpeed;
		calculateVelocity(angleDegrees);
	}

	void calculateVelocity(double angleDegrees) {
		speed = 5;
		//cout << "calculateVelocity\n";
		cout << "angleDegrees " << angleDegrees << endl;
		double radians = angleDegrees * 3.14159265 / 180;
		cout << "radians " << radians << endl;
		velocityX = speed * (int)sin(radians);
		cout << "velocity: " << velocityX;
		velocityY = -speed * (int)cos(radians);
		cout << " " << velocityY << endl;
	}

	void paddleCollision(int paddleX, int paddleWidth) {
		//speed += acceleration;
		double paddleCenterX = paddleX + paddleWidth / 2;
		//cout << "paddleCenter " << paddleCenterX << endl;
		double disFromCenter = (posX + (width / 2)) - paddleCenterX; //ballCenterX - paddleCenterX
		//cout << "disFromCenter " << disFromCenter << endl;
		double ratio = disFromCenter / (paddleWidth / 2);
		cout << "ratio " << ratio << endl;
		calculateVelocity(maxAngle * ratio);

		//if (disFromCenter < 0) //if the ball hit the left side of the paddle
		//	velocityX = -velocityX;
	}
};

struct Paddle {
	string id;
	int width = 100;
	int height = 5;
	int posX;
	int posY;
	int speed = 5; //4
	int score = 0;

	Paddle() {

	}

	Paddle(int Width, int Height, int positionX, int positionY) {
		width = Width;
		height = Height;
		posX = positionX;
		posY = positionY;
	}
};

Ball ball;
Paddle player1;
webSocket server;
bool gameOn;

/* called when a client connects */
void openHandler(int clientID) {
	vector<int> clientIDs = server.getClientIDs();
	if (clientIDs.size() > 1) {
		for (int i = 1; i < clientIDs.size(); i++) {
			server.wsClose(i);
		}
	}
}

/* called when a client disconnects */
void closeHandler(int clientID){
    ostringstream os;
    //os << "Stranger " << clientID << " has leaved.";

    vector<int> clientIDs = server.getClientIDs();
    for (int i = 0; i < clientIDs.size(); i++){
        if (clientIDs[i] != clientID)
            server.wsSend(clientIDs[i], os.str());
    }
}

/* called when a client sends a message to the server */
void messageHandler(int clientID, string message){
    ostringstream os;
    //os << "Stranger " << clientID << " says: " << message;

    vector<int> clientIDs = server.getClientIDs();
    if (message == "init")
    {
        os << "init";
        for (int i = 0; i < clientIDs.size(); i++)
		{
            server.wsSend(clientIDs[i], os.str());
        }
        gameOn = true;
    }

    else if (message == "quit")
    {
        os << "quit";
        for (int i = 0; i < clientIDs.size(); i++)
		{
            server.wsSend(clientIDs[i], os.str());
        }
        gameOn = false;
    }

	else if (message.find("id:") == 0)
	{
		player1.id = message;
	}

	else if (message == "l") {
		player1.posX = fmax(0, player1.posX - player1.speed);
	}
	else if (message == "r") {
		player1.posX = fmin(canvas.first-player1.width, player1.posX + player1.speed);
	}
    
    

}

/* called once per select() loop */
void periodicHandler() {
	static time_t next = clock() + interval_clocks;
    if (gameOn == true)
    {
		clock_t current = clock();
		if (current >= next) {
			ball.posX += ball.velocityX;
			ball.posY += ball.velocityY;
			if ((ball.velocityX < 0 && ball.posX < 0) ||
				(ball.velocityX > 0 && ball.posX + ball.width > canvas.first)) {
				ball.velocityX = -ball.velocityX;
			}

			//bottom and top
			if (ball.velocityY < 0)
			{
				//top
				if (ball.posY < 0)
					ball.velocityY = -ball.velocityY;
			}
			else
			{
				//bottom
				if (player1.posY <= ball.posY + ball.height)
					//  && this.p1.y > this.ball.y - this.ball.vy + this.ball.height)
				{
					//collision distance
					int d = ball.posY + ball.height - player1.posY;
					//time
					int t = d / ball.velocityY;
					//x translate
					int x = ball.velocityX*t + (ball.posX - ball.velocityX);
					if (x >= player1.posX && x + ball.width <= player1.posX + player1.width)
					{
						ball.velocityY = -ball.velocityY;
						//ball.paddleCollision(player1.posX, player1.width);  //Will return ball with pong physics
						player1.score++;
					}
				}
				if (ball.posY > canvas.second)
					ball.velocityY = -ball.velocityY;
			}

			ostringstream os;
			os << setfill('0') << setw(3) << ball.posX << "_";
			os << setfill('0') << setw(3) << ball.posY << "_";
			os << setfill('0') << setw(3) << player1.posX<< "_";
			os << setfill('0') << setw(3) << player1.posY<< "_";
			os << setfill('0') << setw(2) << player1.score;
			vector<int> clientIDs = server.getClientIDs();
			for (int i = 0; i < clientIDs.size(); i++){
				server.wsSend(clientIDs[i], os.str());
			}
			next = clock() + interval_clocks;
			// cout << os.str()<<std::endl;
		}	
    }
}


int main(int argc, char *argv[]){
	
    gameOn = false;

	canvas.first = 600;
	canvas.second = 500;
	//Ball ball;
	ball.posX = canvas.first / 2;
	ball.posY = canvas.second / 2;
	ball.velocityX = 5;
	ball.velocityY = 5;
	//Paddle player1;
	player1.posX = canvas.first / 2;
	player1.posY = canvas.second- 25;


	//port1 = 1000;
    /* set event handler */

	
    //server.setPeriodicHandler(periodicHandler);
	server.setOpenHandler(openHandler);
	server.setCloseHandler(closeHandler);
	server.setMessageHandler(messageHandler);
	server.setPeriodicHandler(periodicHandler);
	server.startServer(8000);
    /* start the chatroom server, listen to ip '127.0.0.1' and port '8000' */

    return 1;
}
