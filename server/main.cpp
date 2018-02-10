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
using namespace std;
int count;
std::pair<int, int> canvas;
struct Ball {
	int width = 10;
	int height = 10;
	int posX;
	int posY;
	int velocityX = 0;
	int velocityY = 0;
};

Ball ball;
struct Paddle {
	int width = 100;
	int height = 5;
	int posX;
	int posY;
	int speed = 4;
	int score = 0;
};

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

    if (message == "quit")
    {
        os << "quit";
        for (int i = 0; i < clientIDs.size(); i++)
		{
            server.wsSend(clientIDs[i], os.str());
        }
        gameOn = false;
    }

	if (message == "l") {
		player1.posX = fmin(0, player1.posX - player1.speed);
        // os << "l";
        // for (int i = 0; i < clientIDs.size(); i++){
        //     server.wsSend(clientIDs[i], os.str());
        // }
	}
	if (message == "r") {
		player1.posX = fmax(canvas.first-player1.posX, player1.posX + player1.speed);
        // os << "r";
        // for (int i = 0; i < clientIDs.size(); i++){
        //     server.wsSend(clientIDs[i], os.str());
        // }
	}
    
    

}

/* called once per select() loop */
void periodicHandler() {
	static time_t next = time(NULL) + (float)0.3;
    if (gameOn == true)
    {
	time_t current = time(NULL);
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
        next = time(NULL) + (float)0.3;
	// cout << os.str()<<std::endl;
	}	
		/*
        ostringstream os;
		//Deprecated ctime API in Windows 10
		char timecstring[26];
		ctime_s(timecstring, sizeof(timecstring), &current);
		string timestring(timecstring);
        timestring = timestring.substr(0, timestring.size() - 1);
        os << timestring;

        vector<int> clientIDs = server.getClientIDs();
        for (int i = 0; i < clientIDs.size(); i++)
            server.wsSend(clientIDs[i], os.str());
		
        next = time(NULL) + (float)0.03;
    }*/
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
