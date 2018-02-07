var Server;

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
        log( payload );
    });

    Server.connect();
}

function disconnect(){
    log("Disconnecting...");
    Server.disconnect();
}
