#include <stdlib.h>
#include <iostream>
#include <string>
#include <sstream>
#include <time.h>
#include "websocket.h"
#include <cstdlib>
#include <thread>
#define NUM_THREADS 4
using namespace std;
int count;
float xPos;
float yPos;

webSocket server1;
/* called when a client connects */
void openHandler(int clientID) {
	vector<int> clientIDs = server1.getClientIDs();
	int a = clientIDs.size();
	//server1.wsSend(clientIDs[0], std::to_string(a));
	if (clientIDs.size() > 1) {
		for (int i = 2; i < clientIDs.size(); i++) {
			server1.wsClose(i);
		}
	}
    /*ostringstream os;
    os << "Stranger " << clientID << " has joined.";

    vector<int> clientIDs = server1.getClientIDs();
    for (int i = 0; i < clientIDs.size(); i++){
        if (clientIDs[i] != clientID)
            server1.wsSend(clientIDs[i], os.str());
    }
    server1.wsSend(clientID, "Welcome!");*/
}

/* called when a client disconnects */
void closeHandler(int clientID){
    ostringstream os;
    //os << "Stranger " << clientID << " has leaved.";

    vector<int> clientIDs = server1.getClientIDs();
    for (int i = 0; i < clientIDs.size(); i++){
        if (clientIDs[i] != clientID)
            server1.wsSend(clientIDs[i], os.str());
    }
}

/* called when a client sends a message to the server */
void messageHandler(int clientID, string message){
    ostringstream os;
    //os << "Stranger " << clientID << " says: " << message;

    vector<int> clientIDs = server1.getClientIDs();
    for (int i = 0; i < clientIDs.size(); i++){
        if (clientIDs[i] != clientID)
            server1.wsSend(clientIDs[i], os.str());
    }
}

/* called once per select() loop */
void periodicHandler(){
    static time_t next = time(NULL) + (float)0.3;
    time_t current = time(NULL);
    if (current >= next){
        ostringstream os;
		//Deprecated ctime API in Windows 10
		char timecstring[26];
		ctime_s(timecstring, sizeof(timecstring), &current);
		string timestring(timecstring);
        timestring = timestring.substr(0, timestring.size() - 1);
        os << timestring;

        vector<int> clientIDs = server1.getClientIDs();
        for (int i = 0; i < clientIDs.size(); i++)
            server1.wsSend(clientIDs[i], os.str());

        next = time(NULL) + (float)0.3;
    }
}
void ss1(int port) {
	server1.setOpenHandler(openHandler);
	server1.setCloseHandler(closeHandler);
	server1.setMessageHandler(messageHandler);
	server1.setPeriodicHandler(periodicHandler);
	server1.startServer(port);
}

int main(int argc, char *argv[]){
	int port;
    cout << "Please set server port: ";
    cin >> port;
	ss1(port);
	//port1 = 1000;
    /* set event handler */

	
    //server.setPeriodicHandler(periodicHandler);

    /* start the chatroom server, listen to ip '127.0.0.1' and port '8000' */

    return 1;
}
