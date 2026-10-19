
export interface IBlockedAttacks {
    id: string;
    attackType: string;
    severity: string;
    blockedBy: string;
    timestamp: string;
    sourceIp: string;
    sourceCidr: string;
    relatedCVE: string;
    location: string;
    attempts: number;
}

export const mockBlockedAttacksData: IBlockedAttacks[] = [
    {
        id: '1',
        attackType: 'SQL Injection',
        severity: 'Critical',
        blockedBy: 'System',
        timestamp: '05/09/25 at 12:20',
        sourceIp: '192.168.1.45',
        sourceCidr: '192.168.1.0/24',
        relatedCVE: 'CVE-2017-7728',
        location: 'China',
        attempts: 3,
    },
    {
        id: '2',
        attackType: 'XSS Attempt',
        severity: 'Medium',
        blockedBy: 'Honeypot',
        timestamp: '05/09/25 at 12:10',
        sourceIp: '192.168.1.45',
        sourceCidr: '192.168.1.0/24',
        relatedCVE: 'N/A',
        location: 'United Kingdom',
        attempts: 4,
    },
    {
        id: '3',
        attackType: 'Brute Force',
        severity: 'Critical',
        blockedBy: 'System',
        timestamp: '05/09/25 at 12:20',
        sourceIp: '192.168.1.45',
        sourceCidr: '192.168.1.0/24',
        relatedCVE: 'CVE-2017-7728',
        location: 'China',
        attempts: 3,
    },
    {
        id: '4',
        attackType: 'XSS Attempt',
        severity: 'Medium',
        blockedBy: 'Honeypot',
        timestamp: '05/09/25 at 12:10',
        sourceIp: '192.168.1.45',
        sourceCidr: '192.168.1.0/24',
        relatedCVE: 'N/A',
        location: 'United Kingdom',
        attempts: 4,
    },
    {
        id: '5',
        attackType: 'XSS Attempt',
        severity: 'Critical',
        blockedBy: 'System',
        timestamp: '05/09/25 at 12:20',
        sourceIp: '192.168.1.45',
        sourceCidr: '192.168.1.0/24',
        relatedCVE: 'CVE-2017-7728',
        location: 'China',
        attempts: 3,
    },
    {
        id: '6',
        attackType: 'XSS Attempt',
        severity: 'Medium',
        blockedBy: 'Honeypot',
        timestamp: '05/09/25 at 12:10',
        sourceIp: '192.168.1.45',
        sourceCidr: '192.168.1.0/24',
        relatedCVE: 'N/A',
        location: 'United Kingdom',
        attempts: 4,
    },
    {
        id: '7',
        attackType: 'SQL Injection',
        severity: 'Critical',
        blockedBy: 'System',
        timestamp: '05/09/25 at 12:20',
        sourceIp: '192.168.1.45',
        sourceCidr: '192.168.1.0/24',
        relatedCVE: 'CVE-2017-7728',
        location: 'China',
        attempts: 3,
    },
    {
        id: '8',
        attackType: 'Brute Force',
        severity: 'Medium',
        blockedBy: 'Honeypot',
        timestamp: '05/09/25 at 12:10',
        sourceIp: '192.168.1.45',
        sourceCidr: '192.168.1.0/24',
        relatedCVE: 'N/A',
        location: 'United Kingdom',
        attempts: 4,
    },
];
