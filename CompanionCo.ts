import net from 'net';
import dgram from 'dgram';


function stringify(page: number, line: number, column: number){
    return`LOCATION ${page}/${line}/${column} PRESS\n`;
}


class CompanionCoTCP extends net.Socket {
    public constructor(address: string, port: number) {
        super();
        super.connect(port, address, function () {
            console.log("created & connected");
        });
    }

    public press(page: number, line: number, column: number) {
        this.write(stringify(page, line, column));
    }
}


class CompanionCoUDP extends dgram.Socket {
    public constructor(address: string, port: number) {
        super("udp4");
        this.address = address;
        this.port = port;
    }

    private address: string;
    private port: number;

    public press(page: number, line: number, column: number) {
        this.send(stringify(page, line, column), this.port, this.address);
    }


}


export class CompanionCo {
    public constructor(method: 'tcp' | 'udp', address: string, port: number) {
        if (method == 'tcp') {
            return new CompanionCoTCP(address, port);
        }

        if (method == 'udp') {
            return new CompanionCoUDP(address, port);
        }

        throw new Error("Il existe pas ton protocol chaton");
    }
}