/**
 * Mock Data - Threat Map
 *
 * Dados simulados para a tela de Threat's Map (Mapa de Ameaças).
 * Representa ameaças detectadas no sistema com suas classificações e status.
 */

export interface ThreatMapEntry {
  threat_id: string;
  timestamp: string; // ISO 8601
  threat_type: 'spam' | 'infection' | 'malware' | 'phishing' | 'ddos' | 'intrusion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  target_ip?: string;
  port?: number;
  protocol?: string;
  status: 'active' | 'blocked' | 'resolved' | 'investigating';
  description: string;
  affected_systems?: string[];
  detection_method: string;
  tags: string[];
  location?: {
    country: string;
    city?: string;
    coordinates?: [number, number]; // [lat, lng]
  };
}

/**
 * Dataset completo de ameaças
 * Total: 100 registros para simular paginação realista
 */
export const threatMapData: ThreatMapEntry[] = [
  // Critical Threats
  {
    threat_id: 'TH-001',
    timestamp: '2025-12-29T10:45:23.123Z',
    threat_type: 'infection',
    severity: 'critical',
    source_ip: '45.142.212.61',
    port: 443,
    protocol: 'HTTPS',
    status: 'blocked',
    description: 'Trojan.GenericKD.67890123 detected attempting to establish C2 communication',
    affected_systems: ['web-server-01', 'database-primary'],
    detection_method: 'IDS Signature Match',
    tags: ['infection', 'trojan', 'c2-communication'],
    location: {
      country: 'Russia',
      city: 'Moscow',
      coordinates: [55.7558, 37.6173],
    },
  },
  {
    threat_id: 'TH-002',
    timestamp: '2025-12-29T10:30:15.456Z',
    threat_type: 'spam',
    severity: 'medium',
    source_ip: '198.51.100.42',
    port: 25,
    protocol: 'SMTP',
    status: 'blocked',
    description: 'Mass email campaign detected from compromised server',
    detection_method: 'Email Gateway Filter',
    tags: ['spam', 'email', 'botnet'],
    location: {
      country: 'United States',
      city: 'New York',
      coordinates: [40.7128, -74.0060],
    },
  },
  {
    threat_id: 'TH-003',
    timestamp: '2025-12-29T10:15:42.789Z',
    threat_type: 'malware',
    severity: 'critical',
    source_ip: '203.0.113.87',
    port: 8080,
    protocol: 'HTTP',
    status: 'investigating',
    description: 'Ransomware signature detected in network traffic',
    affected_systems: ['file-server-02'],
    detection_method: 'Behavioral Analysis',
    tags: ['malware', 'ransomware', 'encryption'],
    location: {
      country: 'China',
      city: 'Beijing',
      coordinates: [39.9042, 116.4074],
    },
  },
  {
    threat_id: 'TH-004',
    timestamp: '2025-12-29T10:00:11.234Z',
    threat_type: 'phishing',
    severity: 'high',
    source_ip: '192.0.2.15',
    status: 'blocked',
    description: 'Phishing attempt mimicking corporate login page',
    detection_method: 'URL Reputation',
    tags: ['phishing', 'social-engineering', 'credential-theft'],
    location: {
      country: 'Nigeria',
      city: 'Lagos',
      coordinates: [6.5244, 3.3792],
    },
  },
  {
    threat_id: 'TH-005',
    timestamp: '2025-12-29T09:45:33.567Z',
    threat_type: 'ddos',
    severity: 'critical',
    source_ip: '198.18.0.123',
    target_ip: '10.0.1.50',
    port: 80,
    protocol: 'HTTP',
    status: 'active',
    description: 'DDoS attack in progress - 50,000 requests per second',
    detection_method: 'Traffic Anomaly Detection',
    tags: ['ddos', 'flood', 'botnet'],
    location: {
      country: 'Ukraine',
      city: 'Kyiv',
      coordinates: [50.4501, 30.5234],
    },
  },
  {
    threat_id: 'TH-006',
    timestamp: '2025-12-29T09:30:22.890Z',
    threat_type: 'intrusion',
    severity: 'high',
    source_ip: '172.16.254.1',
    port: 22,
    protocol: 'SSH',
    status: 'blocked',
    description: 'Brute force SSH attack detected - 500 failed attempts',
    detection_method: 'Failed Authentication Monitor',
    tags: ['intrusion', 'brute-force', 'ssh'],
    location: {
      country: 'India',
      city: 'Mumbai',
      coordinates: [19.0760, 72.8777],
    },
  },
  {
    threat_id: 'TH-007',
    timestamp: '2025-12-29T09:15:11.123Z',
    threat_type: 'spam',
    severity: 'low',
    source_ip: '203.0.113.45',
    port: 587,
    protocol: 'SMTP',
    status: 'resolved',
    description: 'Low volume spam emails from residential IP',
    detection_method: 'SPF/DKIM Validation',
    tags: ['spam', 'email'],
    location: {
      country: 'Brazil',
      city: 'São Paulo',
      coordinates: [-23.5505, -46.6333],
    },
  },
  {
    threat_id: 'TH-008',
    timestamp: '2025-12-29T09:00:44.456Z',
    threat_type: 'infection',
    severity: 'medium',
    source_ip: '192.168.1.105',
    status: 'investigating',
    description: 'Suspicious PowerShell activity detected on endpoint',
    affected_systems: ['workstation-42'],
    detection_method: 'EDR Alert',
    tags: ['infection', 'powershell', 'lateral-movement'],
    location: {
      country: 'Germany',
      city: 'Berlin',
      coordinates: [52.5200, 13.4050],
    },
  },
  {
    threat_id: 'TH-009',
    timestamp: '2025-12-29T08:45:33.789Z',
    threat_type: 'malware',
    severity: 'high',
    source_ip: '198.51.100.88',
    port: 445,
    protocol: 'SMB',
    status: 'blocked',
    description: 'WannaCry-like ransomware propagation attempt',
    detection_method: 'SMB Anomaly Detection',
    tags: ['malware', 'ransomware', 'worm'],
    location: {
      country: 'North Korea',
      city: 'Pyongyang',
      coordinates: [39.0392, 125.7625],
    },
  },
  {
    threat_id: 'TH-010',
    timestamp: '2025-12-29T08:30:22.012Z',
    threat_type: 'phishing',
    severity: 'medium',
    source_ip: '203.0.113.99',
    status: 'resolved',
    description: 'Phishing email with malicious attachment quarantined',
    detection_method: 'Attachment Sandbox Analysis',
    tags: ['phishing', 'malicious-attachment', 'pdf-exploit'],
    location: {
      country: 'France',
      city: 'Paris',
      coordinates: [48.8566, 2.3522],
    },
  },

  // Additional entries for pagination testing
  ...Array.from({ length: 90 }, (_, i) => ({
    threat_id: `TH-${String(i + 11).padStart(3, '0')}`,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    threat_type: ['spam', 'infection', 'malware', 'phishing', 'ddos', 'intrusion'][
      Math.floor(Math.random() * 6)
    ] as ThreatMapEntry['threat_type'],
    severity: ['low', 'medium', 'high', 'critical'][
      Math.floor(Math.random() * 4)
    ] as ThreatMapEntry['severity'],
    source_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    port: [22, 25, 80, 443, 445, 587, 8080, 3389][Math.floor(Math.random() * 8)],
    protocol: ['HTTP', 'HTTPS', 'SSH', 'SMTP', 'SMB', 'RDP'][Math.floor(Math.random() * 6)],
    status: ['active', 'blocked', 'resolved', 'investigating'][
      Math.floor(Math.random() * 4)
    ] as ThreatMapEntry['status'],
    description: [
      'Suspicious network activity detected',
      'Malware signature match',
      'Unauthorized access attempt',
      'Data exfiltration detected',
      'Command and control traffic',
      'Port scanning activity',
      'Credential stuffing attack',
      'Zero-day exploit attempt',
    ][Math.floor(Math.random() * 8)],
    detection_method: [
      'IDS Signature',
      'Behavioral Analysis',
      'ML Detection',
      'SIEM Correlation',
      'Threat Intelligence',
    ][Math.floor(Math.random() * 5)],
    tags: [
      ['malware', 'trojan'],
      ['spam', 'botnet'],
      ['phishing', 'social-engineering'],
      ['ddos', 'flood'],
      ['intrusion', 'reconnaissance'],
    ][Math.floor(Math.random() * 5)],
    location: {
      country: ['USA', 'Russia', 'China', 'Iran', 'Brazil', 'India'][
        Math.floor(Math.random() * 6)
      ],
      coordinates: [Math.random() * 180 - 90, Math.random() * 360 - 180] as [number, number],
    },
  })),
];
