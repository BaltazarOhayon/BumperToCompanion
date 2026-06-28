import { TcpSniffer } from "./TcpSniffer.ts"
import { CompanionCo } from "./CompanionCo.ts"

const truc = new CompanionCo("udp", "127.0.0.1", 5000);

truc.press(1, 2, 3);

const machin = new CompanionCo("tcp", "127.0.0.1", 5001);
machin.press(1, 2, 3);


const tcp = new TcpSniffer(60010);
tcp.on('message', ()=>machin.press(1, 2, 3));

tcp.start();