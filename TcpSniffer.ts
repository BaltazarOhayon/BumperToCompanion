import { ChildProcessWithoutNullStreams, SendHandle, Serializable, spawn } from 'child_process';
import EventEmitter from 'events';


class TcpDump extends EventEmitter {
	public static lineRegex =
		/^(?<time>\d{2}:\d{2}:\d{2}.\d+) (?<netProto>\w+) (?<srcIp>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\.(?<srcPort>\d{1,5}) > (?<destIp>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\.(?<destPort>\d{1,5}): (?<payload>.*)$/;

	private spawnProcess: ChildProcessWithoutNullStreams | null = null;

	public constructor(private readonly options: ITcpDumpOptions) {
		super();
	}

	private buildSpawnArgs(): string[] {
		const args: string[] = [];

		// args.push('-v'); // There seems to be a bug in TcpDump where the verbose closing parenthesis is missing
		args.push('-n');

		args.push('-i', this.options.interface ?? 'any');

		args.push('-K'); // Don’t attempt to verify TCP, UDP and IP checksums.
		args.push('-g'); // Do not insert line break after IP header in verbose mode for easier parsing.
		args.push('-l'); // Make STDOUT line buffered. (required to get semi-real-time, otherwise have to wait for a minute each time)

		const filter = this.buildSpawnArgFilter();
		args.push(filter);

		return args;
	}

	private buildSpawnArgFilter(): string {
		const filters: string[] = [];

		if (this.options.sourcePort) filters.push(`src port ${this.options.sourcePort}`);

		if (this.options.sourceHost) filters.push(`src host ${this.options.sourceHost}`);

		if (this.options.destinationPort)
			filters.push(`dst port ${this.options.destinationPort}`);

		if (this.options.destinationHost)
			filters.push(`dst host ${this.options.destinationHost}`);

		if (this.options.filters) filters.push(`(${this.options.filters.join(' and ')})`);

		return filters.join(' and ');
	}

	private handleSpawnStdoutData(message: Serializable, sendHandle: SendHandle): void {
		const messageLines = message.toString().split('\n');

		for (const messageLine of messageLines) {
			if (!messageLine || messageLine === '') continue;

			const parsedLine = TcpDump.parseTcpDumpMessageLine(messageLine);
			this.emit('message', parsedLine);
		}
	}

	private handleSpawnProcessExit(code: number | null, signal: NodeJS.Signals | null): void {
		console.debug('SPAWN EXITED', code, signal);
	}

	private handleSpawnProcessError(error: Error): void {
		console.error('SPAWN ERROR', error);
	}

	public start() {
		const spawnProcessArgs = this.buildSpawnArgs();

		const spawnProcess = spawn('tcpdump', spawnProcessArgs, {});

		spawnProcess.on('exit', this.handleSpawnProcessExit.bind(this));
		spawnProcess.on('error', this.handleSpawnProcessError.bind(this));

		// spawnProcess.stderr.on('data', this.handleSpawnStdoutData.bind(this));
		spawnProcess.stdout.on('data', this.handleSpawnStdoutData.bind(this));

		this.spawnProcess = spawnProcess;

		this.emit('started');

		return spawnProcess;
	}

	public stop() {
		if (!this.spawnProcess) return;
		this.spawnProcess.stdout.removeAllListeners();
		this.spawnProcess.removeAllListeners();
		this.spawnProcess.kill();

		this.spawnProcess = null;
	}

	public static parseTcpDumpMessageLine(line: string): ITcpDumpLine {
		const output: ITcpDumpLine = { raw: line };

		const lineRegexMatches = line.match(TcpDump.lineRegex);
		if (!lineRegexMatches || !lineRegexMatches.groups) return output;

		output.timestamp = lineRegexMatches.groups['time'];
		output.networkProtocol = lineRegexMatches.groups['netProto'];
		output.sourceIp = lineRegexMatches.groups['srcIp'];
		output.sourcePort = +lineRegexMatches.groups['srcPort'];
		output.destinationIp = lineRegexMatches.groups['destIp'];
		output.destinationPort = +lineRegexMatches.groups['destPort'];
		output.payload = lineRegexMatches.groups['payload'];

		return output;
	}
}

interface ITcpDumpLine {
	raw: string;

	timestamp?: string;
	networkProtocol?: string;

	sourceIp?: string;
	sourcePort?: number;
	destinationIp?: string;
	destinationPort?: number;
	payload?: string;
}

interface ITcpDumpOptions {
	sourceHost?: string;
	sourcePort?: number;
	destinationHost?: string;
	destinationPort?: number;

	interface?: string;

	filters?: string[];
}


export class TcpSniffer extends TcpDump{
	public constructor(destination_port: number,callback: Function) {
		super({
			destinationPort: destination_port,
			filters: ['tcp', 'tcp[tcpflags] == tcp-syn'],
		});
	}

}