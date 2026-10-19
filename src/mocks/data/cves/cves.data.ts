
export interface ICVEs {
    id: string;
    vectorString: string;
    score: number;
    severity: string;
    date: string;
    cwe: string;
    cvss: string;
}

export const mockCVEData: ICVEs[] = [
    {
        id: 'CVE-2017-7728',
        vectorString: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:L',
        score: 6.3,
        severity: 'Medium',
        date: '15 / sep / 25',
        cwe: 'CWE-89: CWE-89 SQL Injection',
        cvss: '6.3 (v3)',
    },
    {
        id: 'PENTEST-2022-238',
        vectorString: 'AVN/ACI/Au:S/C:P/P/A:P',
        score: 5.7,
        severity: 'Medium',
        date: '12 / sep / 25',
        cwe: 'CWE-79: Improper Neutralization',
        cvss: '5.7 (v3)',
    },
    {
        id: 'CVE-2023-4521',
        vectorString: 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:H/I:N/A:N',
        score: 4.8,
        severity: 'Medium',
        date: '10 / sep / 25',
        cwe: 'CWE-20: Input Validation',
        cvss: '4.8 (v3)',
    },
    {
        id: 'CVE-2021-1234',
        vectorString: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
        score: 7.8,
        severity: 'High',
        date: '08 / sep / 25',
        cwe: 'CWE-200: Information Exposure',
        cvss: '7.8 (v3)',
    },
    {
        id: 'PENTEST-2023-567',
        vectorString: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
        score: 9.8,
        severity: 'Critical',
        date: '05 / sep / 25',
        cwe: 'CWE-89: CWE-89 SQL Injection',
        cvss: '9.8 (v3)',
    },
    {
        id: 'CVE-2022-3456',
        vectorString: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:L',
        score: 6.3,
        severity: 'Medium',
        date: '03 / sep / 25',
        cwe: 'CWE-79: Improper Neutralization',
        cvss: '6.3 (v3)',
    },
    {
        id: 'CVE-2020-5678',
        vectorString: 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:H/I:N/A:N',
        score: 4.8,
        severity: 'Low',
        date: '01 / sep / 25',
        cwe: 'CWE-20: Input Validation',
        cvss: '4.8 (v3)',
    },
    {
        id: 'CVE-2019-8901',
        vectorString: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
        score: 7.8,
        severity: 'High',
        date: '28 / ago / 25',
        cwe: 'CWE-200: Information Exposure',
        cvss: '7.8 (v3)',
    },
];
