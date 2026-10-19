
export interface IHoneypots {
    id: string;
    name: string;
    attackerIp: string;
    targetBridge: string;
    protocol: string;
    attackerRep: { status: string, level: string },
    origin: string,
    systemMessage: string,
}


export const mockHoneypotData: IHoneypots[] = [
    {
        id: '1',
        name: 'Honeypot0202',
        attackerIp: '193.920.38.0',
        targetBridge: 'Jump host',
        protocol: 'SOCKS/CONNECT',
        attackerRep: { status: 'malicious', level: 'Malicious' },
        origin: 'Argentina',
        systemMessage: 'An account failed to log on',
    },
    {
        id: '2',
        name: 'Honeypot0202',
        attackerIp: '193.920.38.0',
        targetBridge: 'Jump host',
        protocol: 'HTTP(S)',
        attackerRep: { status: 'suspicious', level: 'Suspicious' },
        origin: 'China',
        systemMessage: 'Failed password for invalid user admin',
    },
    {
        id: '3',
        name: 'Honeypot0202',
        attackerIp: '193.920.38.0',
        targetBridge: 'Jump host',
        protocol: 'SOCKS/CONNECT',
        attackerRep: { status: 'malicious', level: 'Malicious' },
        origin: 'Argentina',
        systemMessage: 'An account failed to log on',
    },
    {
        id: '4',
        name: 'Honeypot0202',
        attackerIp: '193.920.38.0',
        targetBridge: 'Jump host',
        protocol: 'HTTP(S)',
        attackerRep: { status: 'suspicious', level: 'Suspicious' },
        origin: 'China',
        systemMessage: 'Failed password for invalid user admin',
    },
    {
        id: '5',
        name: 'Honeypot0202',
        attackerIp: '193.920.38.0',
        targetBridge: 'Jump host',
        protocol: 'SOCKS/CONNECT',
        attackerRep: { status: 'malicious', level: 'Malicious' },
        origin: 'Argentina',
        systemMessage: 'An account failed to log on',
    },
    {
        id: '6',
        name: 'Honeypot0202',
        attackerIp: '193.920.38.0',
        targetBridge: 'Jump host',
        protocol: 'HTTP(S)',
        attackerRep: { status: 'suspicious', level: 'Suspicious' },
        origin: 'China',
        systemMessage: 'Failed password for invalid user admin',
    },
    {
        id: '7',
        name: 'Honeypot0202',
        attackerIp: '193.920.38.0',
        targetBridge: 'Jump host',
        protocol: 'SOCKS/CONNECT',
        attackerRep: { status: 'malicious', level: 'Malicious' },
        origin: 'Argentina',
        systemMessage: 'An account failed to log on',
    },
    {
        id: '8',
        name: 'Honeypot0202',
        attackerIp: '193.920.38.0',
        targetBridge: 'Jump host',
        protocol: 'HTTP(S)',
        attackerRep: { status: 'suspicious', level: 'Suspicious' },
        origin: 'China',
        systemMessage: 'Failed password for invalid user admin',
    },
];



