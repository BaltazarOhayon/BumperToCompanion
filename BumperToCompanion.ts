import { TcpSniffer } from "./TcpSniffer.ts"
import { PushButtons } from "./PushButtons.ts"

var truc = new PushButtons("udp", "127.0.0.1", 5000);

truc.push(1,2,3);