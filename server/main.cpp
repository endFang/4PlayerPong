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

//time interval
#define INTERVAL_MS 10
int interval_clocks = CLOCKS_PER_SEC * INTERVAL_MS / 1000;
int from_side = 20;
int paddlex = 100;
int paddley = 5;
//#define PI 3.14159265

using namespace std;
int user;

std::pair<int, int> canvas (600,500);  //(x,y)

struct Ball {
	int width;
	int height;
	int posX;
	int posY;
	int velocityX;
	int velocityY;
	int lastHit;
	Ball()
		:width(10), height(10), velocityX(5), velocityY(5), lastHit(0)
	{}
};

struct Paddle {
	string id;
	int width;
	int height;
	int posX;
	int posY;
	int speed;
	int score;

	Paddle(int Width, int Height, int positionX, int positionY)
		:speed(4), score(0)
	{
		width = Width;
		height = Height;
		posX = positionX;
		posY = positionY;
	}
};

Ball ball;
Paddle player1(paddlex, paddley, canvas.first / 2, canvas.second-from_side);
Paddle player2(paddlex, paddley, canvas.first / 2, from_side);
Paddle player3(paddley, paddlex, from_side, canvas.second / 2);
Paddle player4(paddley, paddlex, canvas.first-from_side, canvas.second / 2);

webSocket server;
bool gameOn;
void hitWall() {
	if (ball.lastHit == 1) {
		player1.score++;
		ball.lastHit = 0;
	}
	else if (ball.lastHit == 2) {
		player2.score++;
		ball.lastHit = 0;
	}
	else if (ball.lastHit == 3) {
		player3.score++;
		ball.lastHit = 0;
	}
	else if (ball.lastHit == 4) {
		player4.score++;
		ball.lastHit = 0;
	}
}

/* called when a client connects */
void openHandler(int clientID) {
	vector<int> clientIDs = server.getClientIDs();
	if (clientIDs.size() > 4) {
		for (int i = 1; i < clientIDs.size(); i++) {
			server.wsClose(i);
		}
	}
}

/* called when a client disconnects */
void closeHandler(int clientID){
    ostringstream os;

    vector<int> clientIDs = server.getClientIDs();
    for (int i = 0; i < clientIDs.size(); i++){
        if (clientIDs[i] != clientID)
            server.wsSend(clientIDs[i], os.str());
    }
}

/* called when a client sends a message to the server */
void messageHandler(int clientID, string message){
	ostringstream os;
	int _i;

	// cout << message << endl;
    vector<int> clientIDs = server.getClientIDs();
    if (message.find("init") != string::npos)
    {
		++user;
		cout << "inside main: " << user << endl;
		_i = message.find(":")-1;
		string userID = message.substr(0,_i);

		if (user == 1)
			player1.id = userID;
		if (user == 2)
			player2.id = userID;
		if (user == 3)
			player3.id = userID;
		if (user == 4)
		{
			player4.id = userID;
			gameOn = true;
			os << "init";
			for (int i = 0; i < clientIDs.size(); i++)
			{
				server.wsSend(clientIDs[i], os.str());
			}
		}
    }

    else if (message.find("quit") != string::npos)
    {
        os << "quit";
        for (int i = 0; i < clientIDs.size(); i++)
		{
            server.wsSend(clientIDs[i], os.str());
        }
        gameOn = false;
		--user;
		cout << "inside main: " << user << endl;
    }

	else if (message.find("l") != string::npos) {
		_i = message.find(":")-1;
		string userID = message.substr(0,_i);

		// cout << userID << endl;

		if (userID == player1.id)
			player1.posX = fmax(0, player1.posX - player1.speed);
		
		else if (userID == player2.id)
			player2.posX = fmax(0, player2.posX - player2.speed);

		else if (userID == player3.id)
			player3.posY = fmax(0, player3.posY - player3.speed);
		
		else if (userID == player4.id)
			player4.posY = fmin(canvas.second-player4.height, player4.posY + player4.speed);
	}
	else if (message.find("r") != string::npos) {
		_i = message.find(":")-1;
		string userID = message.substr(0,_i);

		// cout << userID << endl;

		if (userID == player1.id)
			player1.posX = fmin(canvas.first-player1.width, player1.posX + player1.speed);
			
		else if (userID == player2.id)
			player2.posX = fmin(canvas.first-player2.width, player2.posX + player2.speed);

		else if (userID == player3.id)
			player3.posY = fmin(canvas.second-player3.height, player3.posY + player3.speed);
		
		else if (userID == player4.id)
			player4.posY = fmax(0, player4.posY - player4.speed);
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

			//left
			if (ball.velocityX < 0) {

				if (player3.posX + player3.width >= ball.posX)
				{
					if (ball.posY >= player3.posY && ball.posY + ball.height <= player3.posY + player3.height)
					{
						ball.velocityX = -ball.velocityX;
						ball.lastHit = 3;
					}
				}

				if (ball.posX < 0) {
					ball.velocityX = -ball.velocityX;
					hitWall();
				}
			}

			//right
			else {//((ball.velocityX > 0 && ball.posX + ball.width > canvas.first)) {
				if (player4.posX <= ball.posX + ball.width)
				{
					//cout << "ball past p4\n";
					if (ball.posY >= player4.posY && ball.posY + ball.height <= player4.posY + player4.height)
					{
						//cout << "ball collision\n";
						ball.velocityX = -ball.velocityX;
						ball.lastHit = 4;
					}
				}

				if (ball.posX + ball.width > canvas.first) {
					ball.velocityX = -ball.velocityX;
					hitWall();
				}
			}

			//bottom and top
			if (ball.velocityY < 0)
			{
				//top
				if (player2.posY + player2.height >= ball.posY)
				{
					if (ball.posX >= player2.posX && ball.posX + ball.width <= player2.posX + player1.width)
					{
						ball.velocityY = -ball.velocityY;
						ball.lastHit = 2;
					}
				}
				if (ball.posY < 0) {
					ball.velocityY = -ball.velocityY;
					hitWall();
				}
			}
			else
			{
				//bottom
				if (player1.posY <= ball.posY + ball.height)

				{
					if (ball.posX >= player1.posX && ball.posX + ball.width <= player1.posX + player1.width)
					{
						ball.velocityY = -ball.velocityY;
						ball.lastHit = 1;
					}
				}
				if (ball.posY > canvas.second) {
					ball.velocityY = -ball.velocityY;
					hitWall();
				}
			}

			ostringstream os;
			os << setfill('0') << setw(3) << ball.posX << "_";
			os << setfill('0') << setw(3) << ball.posY << "_";
			os << setfill('0') << setw(3) << player1.posX << "_";
			os << setfill('0') << setw(3) << player1.posY << "_";
			os << setfill('0') << setw(2) << player1.score << "_";

			os << setfill('0') << setw(3) << player2.posX << "_";
			os << setfill('0') << setw(3) << player2.posY << "_";
			os << setfill('0') << setw(2) << player2.score << "_";

			os << setfill('0') << setw(3) << player3.posX << "_";
			os << setfill('0') << setw(3) << player3.posY << "_";
			os << setfill('0') << setw(2) << player3.score << "_";

			os << setfill('0') << setw(3) << player4.posX << "_";
			os << setfill('0') << setw(3) << player4.posY << "_";
			os << setfill('0') << setw(2) << player4.score << "_";

			os << player1.id << "_";
			os << player2.id << "_";
			os << player3.id << "_";
			os << player4.id;



			vector<int> clientIDs = server.getClientIDs();
			for (int i = 0; i < clientIDs.size(); i++) {
				server.wsSend(clientIDs[i], os.str());
			}
			next = clock() + interval_clocks;
			// cout << os.str()<<std::endl;
		}
	}
}


int main(int argc, char *argv[]){
	
    gameOn = false;
	//Ball ball;
	ball.posX = canvas.first / 2;
	ball.posY = canvas.second / 2;
	ball.velocityX = 5;
	ball.velocityY = 5;

	//Paddle players;
	/*
	player1.posX = canvas.first / 2;
	player1.posY = 480;

	player2.posX = canvas.first / 2;
	player2.posY = 20;

	player3.posX = 20;
	player3.posY = canvas.second/2;

	player4.posX = 580;
	player4.posY = canvas.second/2;
	*/
    /* set event handler */
	server.setOpenHandler(openHandler);
	server.setCloseHandler(closeHandler);
	server.setMessageHandler(messageHandler);
	server.setPeriodicHandler(periodicHandler);
	server.startServer(8000);
    /* start the chatroom server, listen to ip '127.0.0.1' and port '8000' */

    return 1;
}
