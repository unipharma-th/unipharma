// UNIPHARMA Purchasing Management — Mock Data
const DB = (() => {
  const BRANCHES = [
    { id:'PTN', code:'00', name:'สาขาประตูน้ำ',   nameEN:'Pratu Nam',      color:'#1177cc',
      address:'491/4 ถนนราชปรารภ แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ 10400',
      addressEN:'491/4 Ratchaprarop Rd, Makkasan, Ratchathewi, Bangkok 10400',
      openTime:'8:00–21:00', phone:'080 005 5690' },
    { id:'RAM', code:'01', name:'สาขารามคำแหง',  nameEN:'Ramkhamhaeng',   color:'#06b6d4',
      address:'2041/4 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240',
      addressEN:'2041/4 Ramkhamhaeng Rd, Hua Mak, Bang Kapi, Bangkok 10240',
      openTime:'10:00–19:00', phone:'092 938 1325' },
    { id:'CNX', code:'02', name:'สาขาเชียงใหม่',  nameEN:'Chiang Mai',     color:'#16a34a',
      address:'ถนนท่าแพ ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50100',
      addressEN:'Tha Phae Road, Chang Khlan, Mueang Chiang Mai, Chiang Mai 50100',
      openTime:'10:00–19:00', phone:'092 530 3160' }
  ];

  const CATEGORIES = [
    { id:'CAT01', name:'โรคหัวใจและหลอดเลือด', nameEN:'Cardiovascular Disease (CVD)', color:'#f87171',
      subs:[{id:'S0101',name:'ยาลดความดันโลหิต',nameEN:'Antihypertensives'},
            {id:'S0102',name:'ยาลดไขมันในเลือด',nameEN:'Lipid-Lowering Agents'},
            {id:'S0103',name:'ยาต้านการแข็งตัวของเลือด',nameEN:'Anticoagulants'},
            {id:'S0104',name:'ยาต้านเกล็ดเลือด',nameEN:'Antiplatelet Agents'},
            {id:'S0105',name:'ยาขับปัสสาวะ',nameEN:'Diuretics'}] },
    { id:'CAT02', name:'โรคติดเชื้อ', nameEN:'Infectious Disease', color:'#fb923c',
      subs:[{id:'S0201',name:'ยาปฏิชีวนะ',nameEN:'Antibiotics'},
            {id:'S0202',name:'ยาต้านไวรัส',nameEN:'Antivirals'},
            {id:'S0203',name:'ยาต้านเชื้อรา',nameEN:'Antifungals'},
            {id:'S0204',name:'ยาต้านปรสิต',nameEN:'Antiparasitic Agents'}] },
    { id:'CAT03', name:'โรคระบบทางเดินหายใจ', nameEN:'Respiratory Disease', color:'#22d3ee',
      subs:[{id:'S0301',name:'ยาขยายหลอดลม',nameEN:'Bronchodilators'},
            {id:'S0302',name:'ยาสูดพ่นสเตียรอยด์',nameEN:'Inhaled Corticosteroids'},
            {id:'S0303',name:'ยาแก้ไอ/ละลายเสมหะ',nameEN:'Antitussives / Mucolytics'},
            {id:'S0304',name:'ยาแก้แพ้',nameEN:'Antihistamines'}] },
    { id:'CAT04', name:'โรคเบาหวานและต่อมไร้ท่อ', nameEN:'Diabetes & Endocrinology', color:'#c084fc',
      subs:[{id:'S0401',name:'ยาลดน้ำตาลในเลือด',nameEN:'Antidiabetics / Hypoglycemics'},
            {id:'S0402',name:'อินซูลิน',nameEN:'Insulin'},
            {id:'S0403',name:'ยาไทรอยด์',nameEN:'Thyroid Agents'},
            {id:'S0404',name:'ยาคุมกำเนิด',nameEN:'Contraception'},
            {id:'S0405',name:'ยาฮอร์โมน',nameEN:'Hormonal Therapy'}] },
    { id:'CAT05', name:'โรคระบบทางเดินอาหาร', nameEN:'Gastrointestinal Diseases', color:'#4ade80',
      subs:[{id:'S0501',name:'ยาลดกรด/ยาแผลกระเพาะ',nameEN:'Antacids / Antiulcer Agents'},
            {id:'S0502',name:'ยาแก้ท้องเสีย',nameEN:'Antidiarrheals'},
            {id:'S0503',name:'ยาระบาย',nameEN:'Laxatives'},
            {id:'S0504',name:'ยาแก้คลื่นไส้/อาเจียน',nameEN:'Antiemetics'},
            {id:'S0505',name:'โรคลำไส้แปรปรวน',nameEN:'Irritable Bowel Syndrome'},
            {id:'S0506',name:'โรคริดสีดวงทวาร',nameEN:'Hemorrhoids'},
            {id:'S0507',name:'ยาบำรุงตับ',nameEN:'Liver Medication'}] },
    { id:'CAT06', name:'โรคระบบประสาทและจิตเวช', nameEN:'Neurological & Psychiatric Disorders', color:'#818cf8',
      subs:[{id:'S0601',name:'ยาแก้ปวด/ลดไข้',nameEN:'Analgesics / Antipyretics'},
            {id:'S0602',name:'ยากันชัก',nameEN:'Antiepileptics'},
            {id:'S0603',name:'ยาต้านซึมเศร้า',nameEN:'Antidepressants'},
            {id:'S0604',name:'ยาคลายกังวล/ยานอนหลับ',nameEN:'Anxiolytics / Sedatives'},
            {id:'S0605',name:'ยารักษาโรคจิต',nameEN:'Antipsychotics'},
            {id:'S0606',name:'ยารักษาพาร์กินสัน',nameEN:'Anti-Parkinson Agents'},
            {id:'S0607',name:'ยารักษาอัลไซเมอร์',nameEN:"Alzheimer's Disease"}] },
    { id:'CAT07', name:'โรคมะเร็ง', nameEN:'Malignant Tumors / Oncology', color:'#f472b6',
      subs:[{id:'S0701',name:'ยาเคมีบำบัด',nameEN:'Chemotherapy Agents'},
            {id:'S0702',name:'ยามุ่งเป้า',nameEN:'Targeted Therapy'},
            {id:'S0703',name:'ยาภูมิคุ้มกันบำบัด',nameEN:'Immunotherapy'},
            {id:'S0704',name:'ยาฮอร์โมน',nameEN:'Hormonal Therapy'}] },
    { id:'CAT08', name:'โรคภูมิคุ้มกันและภูมิแพ้', nameEN:'Allergy & Immunology', color:'#fbbf24',
      subs:[{id:'S0801',name:'ยากดภูมิคุ้มกัน',nameEN:'Immunosuppressants'},
            {id:'S0802',name:'ยาแก้แพ้/อีพิเนฟริน',nameEN:'Antiallergics / Epinephrine'}] },
    { id:'CAT09', name:'โรคกระดูกและข้อ', nameEN:'Orthopedic Diseases', color:'#a3e635',
      subs:[{id:'S0901',name:'ยาแก้อักเสบ/ปวดข้อ',nameEN:'Anti-inflammatory / Analgesics'},
            {id:'S0902',name:'ยารักษาโรคเกาต์',nameEN:'Antigout Agents'},
            {id:'S0903',name:'ยาป้องกันกระดูกพรุน',nameEN:'Osteoporosis Agents'}] },
    { id:'CAT10', name:'ยาจำหน่ายหน้าเคาเตอร์', nameEN:'OTC Drugs (Over-the-Counter)', color:'#2dd4bf',
      subs:[{id:'S1001',name:'ยาแก้ปวด/พาราเซตามอล',nameEN:'Analgesics / Paracetamol (OTC)'},
            {id:'S1002',name:'ยาแก้ท้องเสีย OTC',nameEN:'Antidiarrheals (OTC)'},
            {id:'S1003',name:'ยาแก้ไอ OTC',nameEN:'Cough Remedies (OTC)'},
            {id:'S1004',name:'ยาแก้เมารถ/เรือ',nameEN:'Motion Sickness Medication'},
            {id:'S1005',name:'ยาขับลม/ลดแก๊ส',nameEN:'Carminatives / Antiflatulents'},
            {id:'S1006',name:'ยาแก้ท้องเฟ้อ/อาหารไม่ย่อย',nameEN:'Digestive Aids (OTC)'},
            {id:'S1007',name:'เวชสำอาง',nameEN:'Cosmeceutical'}] },
    { id:'CAT11', name:'โรคตา', nameEN:'Ophthalmic', color:'#60a5fa',
      subs:[{id:'S1101',name:'ยาหยอดตา',nameEN:'Eye Drops'},
            {id:'S1102',name:'ยาป้ายตา',nameEN:'Eye Ointments'},
            {id:'S1103',name:'อุปกรณ์ตา',nameEN:'Ophthalmic Devices'}] },
    { id:'CAT12', name:'โรคไต', nameEN:'Kidney Medications', color:'#38bdf8',
      subs:[{id:'S1201',name:'ยาบำรุงไต',nameEN:'Renal Protective Agents'},
            {id:'S1202',name:'ยาลดของเสียในเลือด',nameEN:'Uremic Toxin Reducers'}] },
    { id:'CAT13', name:'เวชภัณฑ์ทางการแพทย์', nameEN:'Medical Supplies', color:'#94a3b8',
      subs:[{id:'S1301',name:'อุปกรณ์การแพทย์',nameEN:'Medical Devices'},
            {id:'S1302',name:'วัสดุสิ้นเปลือง',nameEN:'Consumable Supplies'},
            {id:'S1303',name:'เครื่องมือตรวจวัด',nameEN:'Diagnostic Equipment'}] },
    { id:'CAT14', name:'อาหารเสริมและวิตามิน', nameEN:'Supplements & Vitamins', color:'#34d399',
      subs:[{id:'S1401',name:'วิตามินรวม',nameEN:'Multivitamins'},
            {id:'S1402',name:'แร่ธาตุ',nameEN:'Minerals'},
            {id:'S1403',name:'อาหารเสริมทั่วไป',nameEN:'General Supplements'}] },
    { id:'CAT15', name:'อุปกรณ์ที่ไม่จัดหมวดหมู่', nameEN:'Uncategorized Equipment', color:'#cbd5e1',
      subs:[{id:'S1501',name:'ของแถม',nameEN:'Freebie / Complimentary Gift'},
            {id:'S1502',name:'สินค้าเบ็ดเตล็ด',nameEN:'Miscellaneous Items'}] }
  ];

  // Drug records loaded synchronously from drugs.json (faster than inline JS parse)
  const R = (() => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'drugs.json', false);
      xhr.send();
      return JSON.parse(xhr.responseText);
    } catch(e) { console.warn('[DB] drugs.json load failed:', e); return []; }
  })();

  const DRUGS = R.map(d=>{
    const [code,nameTH,nameEN,unit,catId,subId,hasVatN,costEx,sellEx,sPTN,sRAM,sCNX,minStock,supplierId,orderCount,cPTN,cRAM,cCNX]=d;
    const hasVat=!!hasVatN; const vatRate=hasVat?7:0;
    const costInc=hasVat?+(costEx*1.07).toFixed(2):costEx;
    const sellInc=hasVat?+(sellEx*1.07).toFixed(2):sellEx;
    const profitEx=+(sellEx-costEx).toFixed(2);
    const profitMargin=sellEx>0?+((profitEx/sellEx)*100).toFixed(1):0;
    return {code,nameTH,nameEN,unit,catId,subId,hasVat,vatRate,costEx,costInc,sellEx,sellInc,profitEx,profitMargin,
            costByBranch:{PTN:cPTN||null,RAM:cRAM||null,CNX:cCNX||null},
            stock:{PTN:sPTN,RAM:sRAM,CNX:sCNX},totalStock:sPTN+sRAM+sCNX,minStock,supplierId,orderCount};
  });

  const SUPPLIERS = [];
  const COMP_PRICES = {};
  const PURCHASE_ORDERS = [];
  const STOCK_MOVEMENTS = [];

  const UNITS = [
    // 1. หน่วยเม็ดยา (Dosage Forms)
    { code:'TAB',      th:'เม็ด',               en:'Tablet',                    group:'dosage' },
    { code:'CAP',      th:'แคปซูล',             en:'Capsule',                   group:'dosage' },
    { code:'SGC',      th:'ซอฟต์เจล',           en:'Softgel Capsule',           group:'dosage' },
    { code:'ECT',      th:'เม็ดเคลือบลำไส้',    en:'Enteric-coated Tablet',     group:'dosage' },
    { code:'FCT',      th:'เม็ดเคลือบฟิล์ม',   en:'Film-coated Tablet',        group:'dosage' },
    { code:'CHEW',     th:'เม็ดเคี้ยว',          en:'Chewable Tablet',           group:'dosage' },
    { code:'ODT',      th:'เม็ดละลายในปาก',     en:'Orally Disintegrating Tablet',group:'dosage' },
    { code:'LOZ',      th:'ยาอม',               en:'Lozenge',                   group:'dosage' },
    { code:'PAST',     th:'ยาอมชนิดเม็ด',        en:'Pastille',                  group:'dosage' },
    { code:'POW',      th:'ผงยา',               en:'Powder',                    group:'dosage' },
    { code:'GRAN',     th:'เม็ดแกรนูล',          en:'Granules',                  group:'dosage' },
    { code:'SACH',     th:'ยาผงชนิดซอง',         en:'Sachet',                    group:'dosage' },
    { code:'SUPP',     th:'ยาเหน็บ',             en:'Suppository',               group:'dosage' },
    { code:'PESS',     th:'ยาเหน็บช่องคลอด',     en:'Pessary',                   group:'dosage' },
    // 2. หน่วยของเหลว (Liquid Forms)
    { code:'ML',       th:'มิลลิลิตร',           en:'Milliliter',                group:'liquid' },
    { code:'L',        th:'ลิตร',               en:'Liter',                     group:'liquid' },
    { code:'CC',       th:'ซีซี',               en:'Cubic Centimeter',          group:'liquid' },
    { code:'DROP',     th:'หยด',               en:'Drop',                      group:'liquid' },
    { code:'SPRAY',    th:'สเปรย์',             en:'Spray',                     group:'liquid' },
    { code:'SYRUP',    th:'ยาน้ำเชื่อม',         en:'Syrup',                     group:'liquid' },
    { code:'SOL',      th:'สารละลาย',            en:'Solution',                  group:'liquid' },
    { code:'SUSP',     th:'ยาแขวนตะกอน',         en:'Suspension',                group:'liquid' },
    { code:'EMUL',     th:'อิมัลชัน',            en:'Emulsion',                  group:'liquid' },
    { code:'GARGLE',   th:'น้ำยากลั้วคอ',         en:'Gargle',                    group:'liquid' },
    { code:'MOUTHWASH',th:'น้ำยาบ้วนปาก',         en:'Mouthwash',                 group:'liquid' },
    // 3. หน่วยทางการแพทย์ (Medical Units)
    { code:'AMP',      th:'หลอดยา',             en:'Ampoule',                   group:'medical' },
    { code:'VIAL',     th:'ไวอัล',              en:'Vial',                      group:'medical' },
    { code:'PFS',      th:'กระบอกฉีดยาพร้อมใช้', en:'Prefilled Syringe',         group:'medical' },
    { code:'SYR',      th:'กระบอกฉีดยา',        en:'Syringe',                   group:'medical' },
    { code:'NEEDLE',   th:'เข็ม',               en:'Needle',                    group:'medical' },
    { code:'KIT',      th:'ชุดตรวจ/ชุดอุปกรณ์',  en:'Kit',                       group:'medical' },
    { code:'TEST',     th:'ชุดทดสอบ',            en:'Test',                      group:'medical' },
    { code:'DOSE',     th:'โดส',               en:'Dose',                      group:'medical' },
    { code:'IU',       th:'หน่วยสากล',           en:'International Unit',        group:'medical' },
    { code:'UNIT',     th:'หน่วย',              en:'Unit',                      group:'medical' },
    { code:'PATCH',    th:'แผ่นแปะยา',           en:'Patch',                     group:'medical' },
    { code:'INHALER',  th:'เครื่องพ่นยา',        en:'Inhaler',                   group:'medical' },
    { code:'PEN',      th:'ปากกาฉีดยา',          en:'Injection Pen',             group:'medical' },
    // 4. หน่วยบรรจุ / การขาย (Packaging & Sales Units)
    { code:'EA',       th:'ชิ้น',               en:'Each',                      group:'packaging' },
    { code:'PC',       th:'ชิ้น (PC)',           en:'Piece',                     group:'packaging' },
    { code:'PCS',      th:'หลายชิ้น',            en:'Pieces',                    group:'packaging' },
    { code:'STRIP',    th:'แผง',                en:'Blister Strip',             group:'packaging' },
    { code:'BOX',      th:'กล่อง',              en:'Box',                       group:'packaging' },
    { code:'CTN',      th:'ลัง',               en:'Carton',                    group:'packaging' },
    { code:'CASE',     th:'ลังใหญ่',             en:'Case',                      group:'packaging' },
    { code:'PK',       th:'แพ็ก',              en:'Pack',                      group:'packaging' },
    { code:'SET',      th:'ชุด',               en:'Set',                       group:'packaging' },
    { code:'BAG',      th:'ถุง',               en:'Bag',                       group:'packaging' },
    { code:'POUCH',    th:'ซอง',               en:'Pouch',                     group:'packaging' },
    { code:'BTL',      th:'ขวด',               en:'Bottle',                    group:'packaging' },
    { code:'JAR',      th:'กระปุก',             en:'Jar',                       group:'packaging' },
    { code:'CAN',      th:'กระป๋อง',            en:'Can',                       group:'packaging' },
    { code:'TUBE',     th:'หลอด',              en:'Tube',                      group:'packaging' },
    { code:'ROLL',     th:'ม้วน',              en:'Roll',                      group:'packaging' },
    { code:'REAM',     th:'รีม',               en:'Ream',                      group:'packaging' },
    { code:'PAIR',     th:'คู่',               en:'Pair',                      group:'packaging' },
    { code:'DOZ',      th:'โหล',               en:'Dozen',                     group:'packaging' },
    { code:'INNER',    th:'แพ็กใน',             en:'Inner Pack',                group:'packaging' },
    { code:'SHRINK',   th:'แพ็กหด',             en:'Shrink Pack',               group:'packaging' },
    { code:'DISPLAY',  th:'กล่องโชว์',           en:'Display Box',               group:'packaging' },
    { code:'PALLET',   th:'พาเลท',             en:'Pallet',                    group:'packaging' },
  ];

  return {BRANCHES,CATEGORIES,DRUGS,SUPPLIERS,COMP_PRICES,PURCHASE_ORDERS,STOCK_MOVEMENTS,UNITS};
})();
