import { TcpSniffer } from "./TcpSniffer.ts"
import { PushButtons } from "./PushButtons.ts"

var truc = new PushButtons("udp", "127.0.0.1", 5000);

//truc.press(1, 2, 3);

var machin = new PushButtons("tcp", "127.0.0.1", 5001);
//machin.press(1, 2, 3);


var tcp = new TcpSniffer(60010);
tcp.on('message', ()=>machin.press(1, 2, 3));

tcp.start();