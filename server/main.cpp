#include <stdlib.h>
#include <iostream>
#include <iomanip>
#include <string>
#include <sstream>
#include <time.h>
#include "websocket.h"
#include <cstdlib>
#include <cmath>
#include <vector>
#include <chrono>

	using namespace std;
using namespace std::chrono;


//time interval
#define INTERVAL_MS 10
int interval_clocks = CLOCKS_PER_SEC * INTERVAL_MS / 1000;

//latency
milliseconds rlatency = milliseconds(200);
milliseconds slatency = milliseconds(200);

//user
int user;
int _i;

//somthing
int from_side = 20;
int paddlex = 100;
int paddley = 5;

//canvas attributes
std::pair<int, int> canvas(600, 500);  //(x,y)


									   //buffer
vector< pair<string, time_point<std::chrono::system_clock> > > receivedBuffer;
vector< pair<string, time_point<std::chrono::system_clock> > > sendBuffer;

//==================
//  game state component
//==================
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

struct Ball {
	int width;
	int height;
	int posX;
	int posY;
	int velocityX;
	int velocityY;
	int lastHit;
	double speed;
	int maxAngle;

	Ball()
		:width(10), height(10), velocityX(5), velocityY(5), lastHit(0), speed(7), maxAngle(45)
	{}

	void paddleCollision(const Paddle& player) {
		//speed += acceleration;

		if (lastHit == 1 || lastHit == 2) {
			double disFromCenter = (posX + (width / 2)) - (player.posX + (player.width / 2)); //ballCenterX - paddleCenterX
			double ratio = disFromCenter / (player.width / 2);
			calculateVelocity(maxAngle * ratio);

			if (lastHit == 2)
				velocityY = -velocityY;
		}
		else { //(lastHit == 3 || lastHit == 4)
			double disFromCenter = (posY + (height / 2)) - (player.posY + (player.height / 2)); //ballCenterY - paddleCenterY
			double ratio = disFromCenter / (player.height / 2);
			calculateVelocity(maxAngle * ratio);

			//rotate calculated velocity
			int tempx = velocityX;
			if (lastHit == 3)
				velocityX = -velocityY;
			else
				velocityX = velocityY;
			velocityY = tempx;
			//cout << "Velocity: " << velocityX << ", " << velocityY << endl;
		}
	}

	void calculateVelocity(double angleDegrees) {
		double radians = angleDegrees * 3.14159265 / 180;
		velocityX = roundNumber(speed * sin(radians));
		velocityY = roundNumber(-speed * cos(radians));
	}

	int roundNumber(double num) {
		if (num > 0.0)
			num += 0.5;
		else
			num -= 0.5;
		return (int)num;
	}
};


Ball ball;
Paddle player1(paddlex, paddley, canvas.first / 2, canvas.second - from_side);
Paddle player2(paddlex, paddley, canvas.first / 2, from_side);
Paddle player3(paddley, paddlex, from_side, canvas.second / 2);
Paddle player4(paddley, paddlex, canvas.first - from_side, canvas.second / 2);

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
void closeHandler(int clientID) {
	ostringstream os;

	vector<int> clientIDs = server.getClientIDs();
	for (int i = 0; i < clientIDs.size(); i++) {
		if (clientIDs[i] != clientID)
			server.wsSend(clientIDs[i], os.str());
	}
}

/* called when a client sends a message to the server */
void messageHandler(int clientID, string message) {
	ostringstream os;

	receivedBuffer.push_back(std::pair < std::string, time_point<std::chrono::system_clock> >(message, std::chrono::system_clock::now()+rlatency));

}

/* called once per select() loop */
void periodicHandler() {
	

	ostringstream os;
	time_point<std::chrono::system_clock> now = std::chrono::system_clock::now();
	vector<int> clientIDs = server.getClientIDs();
	if (!gameOn) {
		if(!receivedBuffer.empty() && receivedBuffer.front().second<=now && receivedBuffer.front().first.substr(receivedBuffer.front().first.find(":")+1) == "init"){
			++user;
			cout << "inside main: " << user << endl;
			_i = receivedBuffer.front().first.find(":")-1;
			string userID = receivedBuffer.front().first.substr(0,_i);

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
			if (!receivedBuffer.empty())
				cout << receivedBuffer.front().first << endl;
			receivedBuffer.erase(receivedBuffer.begin());
		}
	}
	static time_t next = clock() + interval_clocks;
	if (gameOn)
	{
		vector<int> deleter;
		for (int i = 0; i < receivedBuffer.size(); i++)
		{
			if (receivedBuffer[i].second <= now) {
				cout << "here";
				if (receivedBuffer.front().first.substr(receivedBuffer.front().first.find(":") + 1) == "l") {
					_i = receivedBuffer[i].first.find(":") - 1;
					string userID = receivedBuffer[i].first.substr(0, _i);

					// cout << userID << endl;
					if (userID == player1.id)
						player1.posX = fmax(0, player1.posX - player1.speed);
					else if (userID == player2.id)
						player2.posX = fmax(0, player2.posX - player2.speed);
					else if (userID == player3.id)
						player3.posY = fmax(0, player3.posY - player3.speed);
					else if (userID == player4.id)
						player4.posY = fmin(canvas.second - player4.height, player4.posY + player4.speed);
				}
				if (receivedBuffer.front().first.substr(receivedBuffer.front().first.find(":") + 1) == "r")
				{
					_i = receivedBuffer[i].first.find(":") - 1;
					string userID = receivedBuffer[i].first.substr(0, _i);
					if (userID == player1.id)
						player1.posX = fmin(canvas.first - player1.width, player1.posX + player1.speed);

					else if (userID == player2.id)
						player2.posX = fmin(canvas.first - player2.width, player2.posX + player2.speed);

					else if (userID == player3.id)
						player3.posY = fmin(canvas.second - player3.height, player3.posY + player3.speed);

					else if (userID == player4.id)
						player4.posY = fmax(0, player4.posY - player4.speed);
				}
				if (receivedBuffer[i].first == "quit")
				{
					os << "quit";
					for (int i = 0; i < clientIDs.size(); i++)
					{
						server.wsSend(clientIDs[i], os.str());
					}
					gameOn = false;
					--user;
				}
				deleter.push_back(i);
			}
		}
		for (int i = deleter.size()-1; i >= 0; i--) {
			receivedBuffer.erase(receivedBuffer.begin() + i);
		}
		
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
						ball.lastHit = 3;
						//ball.velocityX = -ball.velocityX;
						ball.paddleCollision(player3);
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
					if (ball.posY >= player4.posY && ball.posY + ball.height <= player4.posY + player4.height)
					{
						ball.lastHit = 4;
						//ball.velocityX = -ball.velocityX;
						ball.paddleCollision(player4);
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
						ball.lastHit = 2;
						//ball.velocityY = -ball.velocityY;
						ball.paddleCollision(player2);
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
						ball.lastHit = 1;
						//ball.velocityY = -ball.velocityY;
						ball.paddleCollision(player1);
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
			/*
			vector<int> clientIDs = server.getClientIDs();
			for (int i = 0; i < clientIDs.size(); i++) {
				server.wsSend(clientIDs[i], os.str());
			}
			*/
			
			vector<int> clientIDs = server.getClientIDs();
			sendBuffer.push_back(std::pair<std::string, time_point<std::chrono::system_clock> >(os.str(), now + slatency));
			vector<int> deletes;
			int toSend = -1;

			for (int i = 0; i < sendBuffer.size(); i++) {
				if (sendBuffer[i].second <= now) {
					deletes.push_back(i);
					if (toSend != -1 && now - sendBuffer[i].second <= now - sendBuffer[toSend].second) {
						toSend = i;
					}
					else if (toSend == -1) {
						toSend = i;
					}
				}
			}
			if (toSend != -1)
			{
				for (int i = 0; i < clientIDs.size(); i++) {
					server.wsSend(clientIDs[i], sendBuffer[toSend].first);
				}
			}
			for (int i = deletes.size()-1; i >= 0; i--) {
				sendBuffer.erase(sendBuffer.begin() + deletes[i]);
			}
			
			next = clock() + interval_clocks;
			// cout << os.str()<<std::endl;
		}
	}
}


int main(int argc, char *argv[]) {
	gameOn = false;

	//Ball ball;
	ball.posX = canvas.first / 2;
	ball.posY = canvas.second / 2;
	ball.velocityX = 5;
	ball.velocityY = 5;

	/* set event handler */
	server.setOpenHandler(openHandler);
	server.setCloseHandler(closeHandler);
	server.setMessageHandler(messageHandler);
	server.setPeriodicHandler(periodicHandler);
	server.startServer(8000);
	/* start the chatroom server, listen to ip '127.0.0.1' and port '8000' */

	return 1;
}