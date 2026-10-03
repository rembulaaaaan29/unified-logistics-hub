// Unified Logistics Hub - Master Data & State Model

const USER_ROLES = [
  { id: 'cs', name: 'Customer Service Team', code: 'CS-SPEC', permissions: 'Full Operational Control & DO Alert Management' },
  { id: 'customs', name: 'Customs Team', code: 'CUST-SPEC', permissions: 'PIB Declaration, HS BTKI Audit, LARTAS Approval' },
  { id: 'finance', name: 'Finance Team', code: 'FIN-SPEC', permissions: 'eVoucher Generation & Financial Settlement' },
  { id: 'logistics', name: 'Logistics Team', code: 'LOG-SPEC', permissions: 'TMS Transport Instruction & Fleet Dispatch' },
  { id: 'ops', name: 'Operations Manager', code: 'OPS-MGR', permissions: 'Executive Control Tower, SLA & Cycle Time Monitoring' },
  { id: 'admin', name: 'System Administrator', code: 'SYS-ADMIN', permissions: 'Full System Access, Routing Rules & API Config' },
  { id: 'auditor', name: 'Auditor (Read Only)', code: 'AUD-RO', permissions: 'Immutable Audit Trail & Data Lineage Inspection' }
];

const SYSTEM_NODES = {
  incustoms: { id: 'incustoms', name: 'NODE 1: InCustoms AI (Intake Engine)', status: 'online', health: 99.8, latency: '120ms', syncCount: 1420, icon: 'fa-brain', tech: 'Multimodal LayoutLM v2.4' },
  homerpa: { id: 'homerpa', name: 'NODE 2: Home RPA (The Orchestrator)', status: 'online', health: 99.5, latency: '45ms', syncCount: 3890, icon: 'fa-robot', tech: 'State Machine & Rules Engine' },
  vplus: { id: 'vplus', name: 'NODE 3: VPLUS / LOT (The Core Record)', status: 'online', health: 98.9, latency: '210ms', syncCount: 1280, icon: 'fa-ship', tech: 'Source of Truth & AJU/SPPB' },
  evoucher: { id: 'evoucher', name: 'NODE 4: UNO Portal / eVoucher (Financial Gateway)', status: 'warning', health: 94.2, latency: '540ms', syncCount: 940, icon: 'fa-file-invoice-dollar', tech: 'Voucher Settlement & Billing' },
  tms: { id: 'tms', name: 'NODE 5: TMS (The Execution Arm)', status: 'online', health: 100.0, latency: '35ms', syncCount: 1850, icon: 'fa-truck-fast', tech: 'Transport Instruction & POD' }
};

const DO_ALERTS = [
  {
    id: 'ALT-8021',
    severity: 'critical',
    title: 'Customs Clearance Delayed - Physical Inspection Required',
    shipmentId: 'JOB-2026-0891',
    blNumber: 'MSK982301948',
    containerNo: 'TGBU-940128-4',
    message: 'Customs status flagged Red Channel (Jalur Merah). Physical container inspection scheduled at Tanjung Priok Terminal 3.',
    timestamp: '10 mins ago',
    type: 'Customs Delay',
    actionText: 'Inspect Clearance Details',
    node: 'vplus'
  },
  {
    id: 'ALT-8022',
    severity: 'critical',
    title: 'Low AI Confidence Score on HS Code (42%)',
    shipmentId: 'JOB-2026-0895',
    blNumber: 'EGLV-40192831',
    containerNo: 'TEMU-882194-0',
    message: 'LayoutLM extracted HS Code 8471.30.10 with low confidence (42%). Description mismatch with Commercial Invoice line item #4.',
    timestamp: '24 mins ago',
    type: 'AI Confidence Warning',
    actionText: 'Review Extraction Workbench',
    node: 'incustoms'
  },
  {
    id: 'ALT-8023',
    severity: 'warning',
    title: 'eVoucher Data Sync Failed - Gateway Timeout',
    shipmentId: 'JOB-2026-0899',
    blNumber: 'COSU-63910284',
    containerNo: 'OOCL-301928-9',
    message: 'Home RPA failed to sync customs guarantee voucher to eVoucher node after 3 automatic retries.',
    timestamp: '42 mins ago',
    type: 'Sync Failure',
    actionText: 'Trigger RPA Re-Sync',
    node: 'evoucher'
  },
  {
    id: 'ALT-8024',
    severity: 'warning',
    title: 'HS Code Restricted (LARTAS Permit Missing)',
    shipmentId: 'JOB-2026-0902',
    blNumber: 'ONEY-77382019',
    containerNo: 'NYKU-440192-1',
    message: 'HS Code 8517.62.59 requires Ministry of Communication & IT (POSTEL) Import Permit prior to PIB submission.',
    timestamp: '1 hour ago',
    type: 'HS Code Compliance',
    actionText: 'Validate HS Code',
    node: 'incustoms'
  },
  {
    id: 'ALT-8025',
    severity: 'info',
    title: 'Approaching Delivery Deadline (TMS Dispatch Pending)',
    shipmentId: 'JOB-2026-0888',
    blNumber: 'CMAU-10293847',
    containerNo: 'CMAU-883920-5',
    message: 'Customs cleared 2 hours ago. Free time at terminal expires in 18 hours. Fleet dispatch pending in TMS.',
    timestamp: '2 hours ago',
    type: 'Delivery SLA Alert',
    actionText: 'Assign TMS Fleet',
    node: 'tms'
  }
];

const SHIPMENT_DATA = [
  {
    id: 'JOB-2026-0891',
    blNumber: 'MSK982301948',
    containerNo: 'TGBU-940128-4',
    size: '40ft HC',
    importer: 'PT Indonesia Tech Global',
    consignee: 'PT Tech Global Warehouse Cikarang',
    originPort: 'Shanghai Port (CNSHA)',
    destPort: 'Tanjung Priok (IDTPP)',
    vessel: 'MAERSK MC-KINNEY / V.2608W',
    hsCode: '8471.30.90',
    hsStatus: 'valid',
    hsRisk: 'low',
    goodsDescription: 'Portable Automatic Data Processing Machines (Laptops 15")',
    aiConfidence: 98.4,
    customsStatus: 'Jalur Merah (Physical Inspection)',
    customsStatusCode: 'red_channel',
    rpaStatus: 'Synced (Auto Polled)',
    vplusStatus: 'Ready for Gate Pass',
    evoucherStatus: 'Guarantee Issued',
    tmsStatus: 'Truck Assigned (B-9842-UIO)',
    overallStatus: 'Customs Delay',
    statusClass: 'status-danger',
    eta: '2026-08-10 14:00',
    lastSync: '2 mins ago',
    hasDoAlert: true,
    alertId: 'ALT-8021',
    syncFlow: {
      inCustoms: { status: 'success', time: '10:12:04', confidence: '98.4%' },
      homeRPA: { status: 'success', time: '10:12:15', retries: 0 },
      vplus: { status: 'success', time: '10:12:22', refNo: 'VPLUS-88291' },
      eVoucher: { status: 'success', time: '10:12:30', voucherNo: 'EV-2026-9921' },
      tms: { status: 'pending', time: 'Awaiting Gate Clearance', fleetNo: 'B-9842-UIO' }
    }
  },
  {
    id: 'JOB-2026-0895',
    blNumber: 'EGLV-40192831',
    containerNo: 'TEMU-882194-0',
    size: '20ft Standard',
    importer: 'PT Nusantara Electrindo',
    consignee: 'PT Nusantara Factory Karawang',
    originPort: 'Shenzhen (CNSZX)',
    destPort: 'Tanjung Priok (IDTPP)',
    vessel: 'EVER GIVEN / V.094E',
    hsCode: '8471.30.10',
    hsStatus: 'flagged',
    hsRisk: 'high',
    goodsDescription: 'Industrial Micro-Controller Logic Units & Display Modules',
    aiConfidence: 42.1,
    customsStatus: 'PIB Draft Pending Verification',
    customsStatusCode: 'pending_verify',
    rpaStatus: 'Sync Paused (Awaiting CS Approval)',
    vplusStatus: 'Pre-Arrival Registered',
    evoucherStatus: 'Pending Guarantee Request',
    tmsStatus: 'Unassigned',
    overallStatus: 'Low AI Confidence',
    statusClass: 'status-warning',
    eta: '2026-08-11 09:30',
    lastSync: '12 mins ago',
    hasDoAlert: true,
    alertId: 'ALT-8022',
    syncFlow: {
      inCustoms: { status: 'warning', time: '11:45:00', confidence: '42.1% (Low)' },
      homeRPA: { status: 'paused', time: '11:45:10', retries: 0 },
      vplus: { status: 'success', time: '11:40:00', refNo: 'VPLUS-91022' },
      eVoucher: { status: 'pending', time: 'Waiting InCustoms Fix' },
      tms: { status: 'pending', time: 'Waiting Customs Clearance' }
    }
  },
  {
    id: 'JOB-2026-0899',
    blNumber: 'COSU-63910284',
    containerNo: 'OOCL-301928-9',
    size: '40ft Reefer',
    importer: 'PT Cold Logistics Indonesia',
    consignee: 'PT Cold Storage Marunda',
    originPort: 'Busan Port (KRPUS)',
    destPort: 'Tanjung Perak (IDSUB)',
    vessel: 'COSCO SHIPPING PLANET / V.088W',
    hsCode: '0303.89.10',
    hsStatus: 'valid',
    hsRisk: 'low',
    goodsDescription: 'Frozen Mackerel Fish Fillets Grade A',
    aiConfidence: 96.8,
    customsStatus: 'Jalur Hijau (SPPB Released)',
    customsStatusCode: 'cleared',
    rpaStatus: 'Sync Error (eVoucher Retry Exceeded)',
    vplusStatus: 'SPPB Verified',
    evoucherStatus: 'Sync Failed (504 Gateway)',
    tmsStatus: 'Scheduled Cold Fleet (B-9011-CXZ)',
    overallStatus: 'Sync Failed',
    statusClass: 'status-danger',
    eta: '2026-08-10 11:00',
    lastSync: '18 mins ago',
    hasDoAlert: true,
    alertId: 'ALT-8023',
    syncFlow: {
      inCustoms: { status: 'success', time: '09:10:00', confidence: '96.8%' },
      homeRPA: { status: 'error', time: '09:15:30', retries: 3, errorMsg: 'eVoucher HTTP 504 Timeout' },
      vplus: { status: 'success', time: '09:11:20', refNo: 'VPLUS-87102' },
      eVoucher: { status: 'error', time: 'Failed Sync', errorMsg: 'Connection Reset' },
      tms: { status: 'success', time: '09:12:00', fleetNo: 'B-9011-CXZ' }
    }
  },
  {
    id: 'JOB-2026-0902',
    blNumber: 'ONEY-77382019',
    containerNo: 'NYKU-440192-1',
    size: '40ft HC',
    importer: 'PT Telecom Solutions Express',
    consignee: 'PT Telecom Distribution Hub BSD',
    originPort: 'Yokohama (JPYOK)',
    destPort: 'Tanjung Priok (IDTPP)',
    vessel: 'ONE APUS / V.014E',
    hsCode: '8517.62.59',
    hsStatus: 'invalid_lartas',
    hsRisk: 'high',
    goodsDescription: 'Wireless Enterprise Optical Router Transceivers',
    aiConfidence: 91.5,
    customsStatus: 'PIB Rejected (LARTAS Permit Required)',
    customsStatusCode: 'rejected_lartas',
    rpaStatus: 'Synced (Auto Polled)',
    vplusStatus: 'Pre-Arrival Registered',
    evoucherStatus: 'Guarantee On Hold',
    tmsStatus: 'Unassigned',
    overallStatus: 'HS Code Violation',
    statusClass: 'status-danger',
    eta: '2026-08-12 08:00',
    lastSync: '35 mins ago',
    hasDoAlert: true,
    alertId: 'ALT-8024',
    syncFlow: {
      inCustoms: { status: 'success', time: '08:30:00', confidence: '91.5%' },
      homeRPA: { status: 'success', time: '08:30:10', retries: 0 },
      vplus: { status: 'success', time: '08:30:25', refNo: 'VPLUS-90211' },
      eVoucher: { status: 'warning', time: '08:31:00', note: 'Blocked by LARTAS' },
      tms: { status: 'pending', time: 'Blocked by Customs' }
    }
  },
  {
    id: 'JOB-2026-0888',
    blNumber: 'CMAU-10293847',
    containerNo: 'CMAU-883920-5',
    size: '20ft Standard',
    importer: 'PT Auto Parts Manufacturing',
    consignee: 'PT Auto Factory Plant 2 Sunter',
    originPort: 'Nagoya (JPNGO)',
    destPort: 'Tanjung Priok (IDTPP)',
    vessel: 'CMA CGM ANTOINE / V.301W',
    hsCode: '8708.29.90',
    hsStatus: 'valid',
    hsRisk: 'low',
    goodsDescription: 'Automotive Engine Gaskets & Metal Stampings',
    aiConfidence: 99.1,
    customsStatus: 'Jalur Hijau (SPPB Released)',
    customsStatusCode: 'cleared',
    rpaStatus: 'Synced (Auto Polled)',
    vplusStatus: 'Gate Pass Issued (#GP-99120)',
    evoucherStatus: 'Guarantee Settled',
    tmsStatus: 'Awaiting Fleet Dispatch',
    overallStatus: 'Customs Cleared',
    statusClass: 'status-success',
    eta: '2026-08-10 09:00',
    lastSync: '5 mins ago',
    hasDoAlert: true,
    alertId: 'ALT-8025',
    syncFlow: {
      inCustoms: { status: 'success', time: '07:20:00', confidence: '99.1%' },
      homeRPA: { status: 'success', time: '07:20:10', retries: 0 },
      vplus: { status: 'success', time: '07:20:20', refNo: 'VPLUS-84192' },
      eVoucher: { status: 'success', time: '07:20:30', voucherNo: 'EV-2026-7782' },
      tms: { status: 'warning', time: 'Dispatch SLA Warning (<18h)' }
    }
  },
  {
    id: 'JOB-2026-0880',
    blNumber: 'HLCU-90219482',
    containerNo: 'HLXU-772019-3',
    size: '40ft HC',
    importer: 'PT Chemical Industry Supplies',
    consignee: 'PT Chemical Plant Merak',
    originPort: 'Hamburg (DEHAM)',
    destPort: 'Tanjung Priok (IDTPP)',
    vessel: 'HAPAG LLOYD EXPRESS / V.042E',
    hsCode: '2905.11.00',
    hsStatus: 'valid',
    hsRisk: 'low',
    goodsDescription: 'Methanol Pure Grade (Industrial Solvent)',
    aiConfidence: 97.9,
    customsStatus: 'Jalur Hijau (SPPB Released)',
    customsStatusCode: 'cleared',
    rpaStatus: 'Synced (Auto Polled)',
    vplusStatus: 'Gate Pass Cleared',
    evoucherStatus: 'Guarantee Settled',
    tmsStatus: 'Delivered to Consignee (Pod Verified)',
    overallStatus: 'Completed',
    statusClass: 'status-success',
    eta: '2026-08-09 16:00',
    lastSync: '1 hour ago',
    hasDoAlert: false,
    alertId: null,
    syncFlow: {
      inCustoms: { status: 'success', time: 'Yesterday 15:00', confidence: '97.9%' },
      homeRPA: { status: 'success', time: 'Yesterday 15:01', retries: 0 },
      vplus: { status: 'success', time: 'Yesterday 15:02', refNo: 'VPLUS-81092' },
      eVoucher: { status: 'success', time: 'Yesterday 15:03', voucherNo: 'EV-2026-6610' },
      tms: { status: 'success', time: 'Yesterday 17:30', fleetNo: 'B-9192-TUU' }
    }
  }
];

const AI_EXTRACTION_SAMPLES = {
  'JOB-2026-0895': {
    documentName: 'Commercial_Invoice_EGLV4019.pdf',
    documentType: 'Commercial Invoice & Packing List',
    pageCount: 3,
    overallConfidence: 42.1,
    fields: [
      { key: 'invoice_no', name: 'Invoice Number', value: 'INV-2026/SZ-09412', confidence: 99.2, status: 'high', bbox: { x: 55, y: 18, w: 30, h: 4 } },
      { key: 'bl_number', name: 'Bill of Lading', value: 'EGLV-40192831', confidence: 98.7, status: 'high', bbox: { x: 55, y: 24, w: 28, h: 4 } },
      { key: 'importer_npwp', name: 'Importer NPWP Tax ID', value: '01.382.910.4-015.000', confidence: 95.0, status: 'high', bbox: { x: 12, y: 32, w: 35, h: 4 } },
      { key: 'hs_code', name: 'HS Tariff Code', value: '8471.30.10', confidence: 42.1, status: 'low', rawOcr: '847I.3O.IO', bbox: { x: 62, y: 58, w: 22, h: 5 }, suggestions: ['8471.30.90 (ADP Units)', '8537.10.99 (Logic Controllers)', '8504.40.90 (Power Modules)'] },
      { key: 'goods_desc', name: 'Goods Description', value: 'Industrial Micro-Controller Logic Units & Display Modules', confidence: 58.4, status: 'medium', rawOcr: 'Indstrial Micro-Contrller Lgc Units', bbox: { x: 12, y: 58, w: 48, h: 12 }, suggestions: ['Industrial Micro-Controller Logic Units & Display Modules', 'Printed Circuit Board Assemblies'] },
      { key: 'total_cif_usd', name: 'Total CIF Value (USD)', value: '148,500.00', confidence: 97.5, status: 'high', bbox: { x: 65, y: 76, w: 25, h: 5 } },
      { key: 'gross_weight_kg', name: 'Gross Weight (KG)', value: '4,280.00', confidence: 91.3, status: 'high', bbox: { x: 65, y: 83, w: 25, h: 5 } }
    ],
    auditTrail: [
      { timestamp: '2026-08-10 11:45:00', user: 'AI InCustoms (LayoutLM v2.4)', action: 'Automated Document OCR & Token Extraction Completed' },
      { timestamp: '2026-08-10 11:45:05', user: 'Automated Rules Engine', action: 'Flagged Field "hs_code" (Score 42.1% < Threshold 80.0%)' },
      { timestamp: '2026-08-10 11:45:10', user: 'Home RPA Orchestrator', action: 'Hold State Triggered. Dispatched DO Alert ALT-8022 to CS Team' }
    ]
  }
};

const HS_RULES_DATABASE = [
  { code: '8471.30.90', description: 'Portable automatic data processing machines, weighing not more than 10 kg', bm: '0%', ppn: '11%', pph: '2.5%', lartas: false, category: 'Electronics' },
  { code: '8471.30.10', description: 'Laptops and palmtop computers with specialized military/security encryption', bm: '5%', ppn: '11%', pph: '2.5%', lartas: true, permitReq: 'Ministry of Defence & DEPRIN', category: 'Secured Computing' },
  { code: '8517.62.59', description: 'Machines for reception, conversion and transmission of data (Wireless Routers)', bm: '0%', ppn: '11%', pph: '2.5%', lartas: true, permitReq: 'POSTEL SDPPI Import Approval', category: 'Telecommunications' },
  { code: '0303.89.10', description: 'Frozen Mackerel (Scomber scombrus, Scomber australasicus)', bm: '5%', ppn: '0%', pph: '2.5%', lartas: true, permitReq: 'BKIPM Quarantine Clearance & Import Allocation', category: 'Perishables / Food' },
  { code: '8708.29.90', description: 'Parts and accessories of motor vehicle bodies including stampings', bm: '10%', ppn: '11%', pph: '2.5%', lartas: false, category: 'Automotive' },
  { code: '2905.11.00', description: 'Methanol (Methyl alcohol) saturated monohydric alcohols', bm: '0%', ppn: '11%', pph: '2.5%', lartas: true, permitReq: 'BAPETEN / Ministry of Industry Chemical Permit', category: 'Chemicals' }
];

const RPA_LOGS = [
  { id: 'LOG-9921', time: '15:38:12', node: 'Home RPA', level: 'info', message: 'Polled Customs CEISA 4.0 API. 6 Active Job Orders Checked.' },
  { id: 'LOG-9920', time: '15:36:45', node: 'VPLUS', level: 'success', message: 'Synchronized Gate Pass #GP-99120 to VPLUS Node for JOB-2026-0888.' },
  { id: 'LOG-9919', time: '15:35:10', node: 'eVoucher', level: 'error', message: 'Gateway Timeout connecting to eVoucher endpoint (https://evoucher.customs.go.id/api/v2). Retry #3 queued.' },
  { id: 'LOG-9918', time: '15:32:00', node: 'InCustoms', level: 'warn', message: 'Low AI confidence extraction detected on JOB-2026-0895 (Score: 42.1%). Exception routed to Workbench.' },
  { id: 'LOG-9917', time: '15:30:00', node: 'TMS', level: 'info', message: 'Dispatched automated fleet availability check to TMS for 2 cleared containers.' }
];

// Export to global scope
window.HUB_DATA = {
  USER_ROLES,
  SYSTEM_NODES,
  DO_ALERTS,
  SHIPMENT_DATA,
  AI_EXTRACTION_SAMPLES,
  HS_RULES_DATABASE,
  RPA_LOGS
};
