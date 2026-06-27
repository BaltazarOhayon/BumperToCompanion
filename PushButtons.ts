import net from 'net';
import dgram from 'dgram';

class PushButtonsTCP extends net.Socket{
    public constructor(address: string, port: number) {
        super();
        super.connect(port, address, function () {
            console.log("created & connected");
        });
    }



}



class PushButtonsUDP extends dgram.Socket{
    public constructor(address: string, port: number) {
        super("udp4");
        this.address = address;
        this.port = port;
    }

    private address: string;
    private port: number;

    public push(page: number, line: number, column: number) {
        this.send(this.parsebutton(page, line, column), this.port, this.address);
    }



    private parsebutton(page: number, line: number, column: number) {
        var parsed = "LOCATION " + page + "/" + line + "/" + column + " PRESS";
        return parsed;
    }
}







export class PushButtons{
    public constructor(method: string, address: string, port: number) {
        if (method == 'tcp') {
            return new PushButtonsTCP(address, port);
        }

        if (method == 'udp') {
            return new PushButtonsUDP(address, port);
        }
        if (method != 'tcp' && method !='udp') {
            throw new Error("Il existe pas ton protocol chaton");
        }
    }
}