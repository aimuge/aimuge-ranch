/* ============ 伊拉特智慧牧场 · 数据层 v5（localStorage 持久化） ============ */
const DEFAULT_DATA = {
  meta: {
    name:'伊拉特智慧牧场', nameEn:'YILATE Smart Ranch',
    owner:'伊拉特',
    location:'内蒙古 · 呼伦贝尔市 · 新巴尔虎左旗 · 吉布胡郎图苏木呼伦嘎查',
    gps:'48.02°N, 118.08°E（场部）', lat:48.02, lon:118.08,
    area:13290, areaSelf:3850, areaRented:9440, grazingArea:11790, hayArea:1500,
    founded:2016, smartSince:2026,
    climate:'寒温带大陆性季风气候 · 极端低温 -45℃ · 积雪期约 140 天',
    slogan:'高寒牧区西门塔尔牛智慧养殖：可视 · 可测 · 可控 · 可预警',
    developer:'内蒙古艾牧戈数智科技有限公司',
    mode:'冬季圈养 · 夏季散养（散养为主、圈养繁育为辅）',
    facilities:[
      { id:'FA1', icon:'🏠', name:'大牛棚圈', desc:'大牛 102 头 · 保温棚圈', detail:'1 栋 · 配套牛只活动区' },
      { id:'FA2', icon:'🐮', name:'犊牛舍', desc:'小牛（犊牛）84 头 · 单独保温', detail:'1 栋 · 恒温看护' },
      { id:'FA3', icon:'🌾', name:'牛只活动区', desc:'自由活动 · 饮水点', detail:'配套运动场' },
      { id:'FA4', icon:'🧊', name:'饲草区', desc:'天然草 900 捆 · 防火防潮', detail:'1 处草垛堆放区 · 监控 1 路' },
      { id:'FA5', icon:'🏘️', name:'生活区', desc:'住区 · 接待 · 蒙古包营地', detail:'监控 1 路' },
      { id:'FA6', icon:'🔧', name:'设备区', desc:'农机停放 · TMR 拌料间', detail:'监控 1 路' }
    ]
  },

  weather: {
    place:'新巴尔虎左旗 · 吉布胡郎图苏木', temp:13, feels:9.9, icon:'☁️', text:'多云 · 北风',
    wind:'北风 18km/h', snow:'降水概率 74%', low:7.5, high:17.2,
    forecast:[
      { day:'明天', icon:'🌦️', high:18.9, low:3.2 },
      { day:'后天', icon:'☁️', high:15.6, low:1.1 },
      { day:'大后天', icon:'⛅', high:19.8, low:7.6 }
    ],
    alert:'今日有阵雨可能，注意饲草防潮；夜间温差较大，犊牛舍保持干燥保温。',
    source:'Open-Meteo', updated:'2026-09-19 09:30'
  },

  pageSettings: {},

  nav: [
    { key:'profile',    icon:'🏡', title:'牧场档案' },
    { key:'bigscreen',  icon:'🖥️', title:'数据大屏' },
    { key:'dashboard',  icon:'📊', title:'日常总览' },
    { key:'log',        icon:'📒', title:'牧事日志' },
    { key:'livestock',  icon:'🐂', title:'养殖管理' },
    { key:'forage',     icon:'🧊', title:'饲草管理' },
    { key:'grassland',  icon:'🌾', title:'草场管理' },
    { key:'vaccine',    icon:'💉', title:'防疫管理' },
    { key:'devices',    icon:'📡', title:'智慧装备' },
    { key:'cycle',      icon:'🔄', title:'四季生产' },
    { key:'ledger',     icon:'💰', title:'经营账本' },
    { key:'labor',      icon:'🧑‍🌾', title:'用工管理' },
    { key:'insurance',  icon:'🛡️', title:'保险理赔' },
    { key:'slaughter',  icon:'🍖', title:'屠宰加工' },
    { key:'products',   icon:'🛍️', title:'产品中心' },
    { key:'tourism',    icon:'🏕️', title:'文旅牧游' },
    { key:'gov',        icon:'🏛️', title:'政务上报' },
    { key:'gallery',    icon:'📷', title:'牧场相册' },
    { key:'admin',      icon:'⚙️', title:'后台管理' },
    { key:'agent',      icon:'👩‍🌾', title:'智能服务小伊' }
  ],

  /* ---------- 养殖：牛 186 头（大牛 102 + 小牛 84） ---------- */
  species: [
    { key:'cattle', name:'牛', emoji:'🐂', color:'#0f766e', breed:'西门塔尔牛', count:186,
      structure:'大牛 102 · 小牛（犊牛）84', gps:20, tempAvg:'38.6℃',
      trend:[150,158,166,172,178,182,186] },
  ],
  groups: [
    { id:'G1', name:'大牛棚圈 · 大牛', count:102, desc:'西门塔尔成年牛 · 保温棚圈 + 活动区', status:'正常' },
    { id:'G2', name:'犊牛舍 · 小牛（犊牛）', count:84, desc:'单独保温 · 犊牛舍恒温看护', status:'重点看护' }
  ],
  animals: [
    { id:'YL-0001', species:'牛', breed:'西门塔尔', sex:'母', age:'4岁', weight:'612kg', health:'发情预警', location:'大牛棚圈', device:'AI 识别 · 在线', temp:'38.8℃', note:'AI 已识别，建议今日配种' },
    { id:'YL-0002', species:'牛', breed:'西门塔尔', sex:'母', age:'5岁', weight:'648kg', health:'待产', location:'犊牛舍', device:'监控 · 在线', temp:'38.9℃', note:'预产期临近，夜间值守' },
    { id:'YL-0003', species:'牛', breed:'西门塔尔', sex:'母', age:'3岁', weight:'556kg', health:'健康', location:'大牛棚圈', device:'电子耳标 · 在线', temp:'38.5℃', note:'体况良好' },
    { id:'YL-0004', species:'牛', breed:'西门塔尔', sex:'母', age:'6岁', weight:'664kg', health:'健康', location:'活动区', device:'北斗项圈 · 在线', temp:'38.6℃', note:'活动量正常' },
    { id:'YL-0024', species:'牛', breed:'西门塔尔', sex:'公', age:'6月龄', weight:'186kg', health:'健康', location:'犊牛舍', device:'电子耳标 · 在线', temp:'38.7℃', note:'犊牛 · 保温观察' },
    { id:'YL-0036', species:'牛', breed:'西门塔尔', sex:'公', age:'18月龄', weight:'486kg', health:'健康', location:'大牛棚圈', device:'自动称重 · 已过称', temp:'38.6℃', note:'育肥出栏候选' }
  ],
  birthRecords: [
    { id:'BR1', date:'2026-03-18', species:'牛', item:'产犊 84 头', survival:'96.0%', operator:'伊拉特', note:'犊牛舍恒温 · 初乳 2 小时内饲喂' },
    { id:'BR2', date:'2026-04-06', species:'牛', item:'犊牛建档 84 头', survival:'100%', operator:'伊拉特', note:'电子耳标建档完成' }
  ],

  /* ---------- 增重分析（数据来自三分群全自动保定称） ---------- */
  growth: {
    targetWeight:650, targetGain:1.10, weighDevice:'三分群全自动保定称',
    animals:[
      { tag:'YL-0036', breed:'西门塔尔', sex:'公', stage:'育肥', start:398, weights:[398,412,428,446,464,482,486], days:[0,14,28,42,56,70,90], current:486, dailyGain:0.98, note:'育肥出栏候选' },
      { tag:'YL-0042', breed:'西门塔尔', sex:'公', stage:'育肥', start:372, weights:[372,388,406,426,452,478,510], days:[0,14,28,42,56,70,90], current:510, dailyGain:1.53, note:'增重最快 · 后期加速' },
      { tag:'YL-0003', breed:'西门塔尔', sex:'母', stage:'成年母牛', start:534, weights:[534,538,542,546,550,552,556], days:[0,14,28,42,56,70,90], current:556, dailyGain:0.24, note:'成年母牛维持体况' },
      { tag:'YL-0024', breed:'西门塔尔', sex:'公', stage:'犊牛', start:142, weights:[142,152,162,171,179,183,186], days:[0,14,28,42,56,70,90], current:186, dailyGain:0.49, note:'犊牛 · 增重偏慢待观察' },
      { tag:'YL-0051', breed:'西门塔尔', sex:'公', stage:'育肥', start:410, weights:[410,420,432,441,449,455,458], days:[0,14,28,42,56,70,90], current:458, dailyGain:0.53, note:'掉膘预警 · 建议调整配方' }
    ]
  },

  /* ---------- 草场：13,290 亩（自家 3,850 + 租赁 9,440） ---------- */
  grasslandTypes: [
    { id:'GT1', name:'草甸草原（打草区）', icon:'🌿', color:'#0f766e', area:2500, species:'披碱草 · 冰草', use:'打草 + 轮牧', note:'打草场 1,500 亩所在' },
    { id:'GT2', name:'典型草原（轮牧区 · 租赁）', icon:'🌱', color:'#14b8a6', area:7600, species:'针茅 · 冷蒿 · 冰草', use:'四季轮牧', note:'牛群放牧主体草场' },
    { id:'GT3', name:'低湿地 / 河漫滩', icon:'💧', color:'#0891b2', area:1490, species:'芦苇 · 苔草', use:'应急放牧', note:'补水草场' },
    { id:'GT4', name:'退牧还草 / 补播改良区', icon:'🌾', color:'#f0b429', area:1200, species:'改良草种混播', use:'禁牧围封', note:'恢复植被' },
    { id:'GT5', name:'沙化治理区', icon:'🏜️', color:'#b3541e', area:500, species:'沙蒿 · 锦鸡儿', use:'封育治理', note:'防风固沙' },
    { id:'GT6', name:'棚圈 / 活动区 / 道路', icon:'🛤️', color:'#64748b', area:0, species:'—', use:'生产设施用地', note:'大牛棚圈 · 犊牛舍 · 活动区 · 饲草区' }
  ],
  grassland: {
    total:13290, grazing:11790, hay:1500,
    balance:{ capacity:6650, actual:1330, rate:20.0 },
    ndvi:{ value:0.72, level:'良好', trend:[0.41,0.53,0.64,0.72,0.77,0.74,0.72] },
    seasons: [
      { name:'春营盘', months:'3-5月', area:2600, grass:'返青期', height:'5-8cm', status:'休牧 · 返青保护', color:'#5eead4', progress:30 },
      { name:'夏营盘', months:'6-8月', area:3600, grass:'盛草期', height:'22-30cm', status:'轮牧中', color:'#14b8a6', progress:70 },
      { name:'秋营盘', months:'9-10月', area:2200, grass:'成熟期', height:'18-26cm', status:'计划 9/1 转入', color:'#f0b429', progress:45 },
      { name:'冬营盘', months:'11-2月', area:3390, grass:'枯草期', height:'7cm', status:'放牧中 · 防风向阳', color:'#0891b2', progress:85 }
    ],
    pastures: [
      { id:'PA1', name:'冬营盘 · 东区', type:'典型草原', usage:'放牧场', area:1200, su:400, height:'7cm', status:'放牧中', util:62 },
      { id:'PA2', name:'冬营盘 · 南区', type:'典型草原', usage:'放牧场', area:1000, su:360, height:'8cm', status:'放牧中', util:58 },
      { id:'PA3', name:'春营盘 · 返青区', type:'典型草原', usage:'放牧场', area:1200, su:0, height:'5cm', status:'休牧', util:0 },
      { id:'PA4', name:'夏营盘 · 西区', type:'草甸草原', usage:'放牧场', area:1100, su:480, height:'24cm', status:'轮牧中', util:52 },
      { id:'PA5', name:'一号打草场', type:'草甸草原', usage:'打草场', area:800, su:0, height:'28cm', status:'夏末打草', util:0 },
      { id:'PA6', name:'二号打草场', type:'低湿地', usage:'打草场', area:700, su:0, height:'32cm', status:'打草完成 · 待捆', util:0 }
    ],
    tasks: [
      '3/1 春营盘返青监测 · 休牧至草高 12cm',
      '7/20 打草场刈割 · 留茬 ≥6cm',
      '9/1 秋营盘转场 · 提前检查运输车辆',
      '11/15 冬营盘防寒加固 · 犊牛舍检修完成'
    ]
  },

  /* ---------- 饲草：天然草 900 捆 ---------- */
  forageInventory: [
    { id:'F1', name:'天然草捆（打草场自产）', unit:'捆', stock:900, target:1000, note:'2026 年打草入库 · 高寒越冬主饲草' },
    { id:'F2', name:'青贮玉米', unit:'吨', stock:30, target:40, note:'泌乳期补饲' },
    { id:'F3', name:'精饲料（玉米/豆粕）', unit:'吨', stock:12, target:16, note:'犊牛与围产期母牛' },
    { id:'F4', name:'矿物质舔砖', unit:'吨', stock:0.5, target:0.8, note:'冬春防缺乏症' }
  ],
  forageRecords: [
    { id:'FR1', date:'2026-08-18', type:'打草入库', item:'天然草捆（打草场自产）', qty:500, unit:'捆', operator:'伊拉特', note:'一号打草场 · 第一茬' },
    { id:'FR2', date:'2026-09-02', type:'打草入库', item:'天然草捆（打草场自产）', qty:400, unit:'捆', operator:'伊拉特', note:'二号打草场 · 合计 900 捆' },
    { id:'FR3', date:'2026-09-10', type:'青贮制作', item:'青贮玉米', qty:30, unit:'吨', operator:'伊拉特', note:'青贮窖 1 座' },
    { id:'FR4', date:'2026-11-20', type:'领用', item:'天然草捆（打草场自产）', qty:120, unit:'捆', operator:'牧工组', note:'冬季补饲开始' },
    { id:'FR5', date:'2026-12-15', type:'领用', item:'精饲料（玉米/豆粕）', qty:2, unit:'吨', operator:'牧工组', note:'犊牛开食料' }
  ],

  /* ---------- 屠宰加工 ---------- */
  slaughterPlans: [
    { id:'SP1', season:'秋冬季出栏（10-12月）', species:'牛', head:62, note:'计划出栏 62 头 · 检疫后定点屠宰' }
  ],
  slaughterRecords: [
    { id:'SL1', date:'2026-01-12', species:'牛', head:4, weight:'1.4吨', inspector:'旗动物检疫所', status:'检疫合格', note:'冷鲜牛肉 1.0 吨入库' },
    { id:'SL2', date:'2026-02-08', species:'牛', head:3, weight:'1.1吨', inspector:'旗动物检疫所', status:'检疫合格', note:'礼盒装草原牛肉' }
  ],

  /* ---------- 防疫 ---------- */
  vaccinePlans: [
    { id:'VP1', season:'春季防疫（3-4月）', vaccine:'口蹄疫 O 型', species:'牛', rate:'应免尽免' },
    { id:'VP2', season:'春季防疫（3-4月）', vaccine:'炭疽', species:'牛', rate:'应免尽免' },
    { id:'VP3', season:'春季防疫（3-4月）', vaccine:'犊牛腹泻疫苗', species:'犊牛', rate:'出生后按程序' },
    { id:'VP4', season:'秋季防疫（9-10月）', vaccine:'口蹄疫 A 型', species:'牛', rate:'应免尽免' },
    { id:'VP5', season:'秋季防疫（9-10月）', vaccine:'牛病毒性腹泻（BVD）', species:'牛', rate:'全群' },
    { id:'VP6', season:'全年', vaccine:'布病监测', species:'牛', rate:'每季抽检 20%' }
  ],
  vaccineRecords: [
    { id:'VR1', date:'2025-10-08', species:'牛', group:'全群', vaccine:'口蹄疫 A 型', dose:'186 头份', operator:'旗疫控中心', status:'完成' },
    { id:'VR2', date:'2026-03-20', species:'牛', group:'犊牛', vaccine:'犊牛腹泻疫苗', dose:'84 头份', operator:'旗疫控中心', status:'完成' },
    { id:'VR3', date:'2026-04-10', species:'牛', group:'全群', vaccine:'炭疽', dose:'186 头份', operator:'旗疫控中心', status:'完成' }
  ],
  medicines: [
    { id:'MD1', date:'2026-03-20', species:'牛', group:'犊牛 12 头', drug:'土霉素（腹泻治疗）', withdrawal:28, operator:'吉日嘎拉', note:'出栏前 28 天停药' },
    { id:'MD2', date:'2026-03-12', species:'牛', group:'母牛 4 头', drug:'青霉素（子宫炎治疗）', withdrawal:14, operator:'旗兽医站', note:'疗程 3 天' },
    { id:'MD3', date:'2026-02-28', species:'牛', group:'全群', drug:'伊维菌素（驱虫）', withdrawal:21, operator:'吉日嘎拉', note:'春季集中驱虫' }
  ],
  disinfect: [
    { id:'DS1', date:'2026-03-10', item:'犊牛舍消毒', drug:'戊二醛消毒液', operator:'吉日嘎拉', note:'产犊前全面消毒' },
    { id:'DS2', date:'2026-03-28', item:'大牛棚圈消毒', drug:'过氧乙酸', operator:'牧工组', note:'每周 1 次' },
    { id:'DS3', date:'2026-04-02', item:'活动区消毒', drug:'生石灰', operator:'牧工组', note:'春季集中消毒' }
  ],

  /* ---------- 智慧装备（含端口协议） ---------- */
  deviceCats: [
    { id:'D1', name:'视频监控与 AI', icon:'🎥', color:'#0891b2', desc:'监控摄像头 · AI 识别', protocol:'ONVIF / RTSP' },
    { id:'D2', name:'电子标识与定位', icon:'🏷️', color:'#0f766e', desc:'电子耳标 · 北斗项圈', protocol:'RFID · 北斗 · MQTT' },
    { id:'D3', name:'饲喂与称重机械', icon:'🚜', color:'#14b8a6', desc:'TMR 拌料机 · 撒料机 · 称重保定架', protocol:'RS485 / Modbus / ISOBUS' },
    { id:'D4', name:'棚圈与门禁设施', icon:'🏠', color:'#f0b429', desc:'犊牛舍温控 · 自动院墙门', protocol:'Modbus / 4G 控制' },
    { id:'D5', name:'网关与供电', icon:'📶', color:'#64748b', desc:'LoRa/4G 网关 · 太阳能', protocol:'LoRaWAN / MQTT' }
  ],
  deviceList: [
    { id:'DV1', name:'视频监控系统（6 路）', cat:'D1', model:'海康威视 · 6 路', count:6, where:'生活区 / 饲草区 / 设备区 / 犊牛舍 / 牛只活动区 / 牛舍内', state:'在线', protocol:'ONVIF / RTSP / GB28181 · rtsp://IP:554/Streaming/Channels/101', battery:'市电 + UPS', last:'刚刚' },
    { id:'DV2', name:'耳标测温（电子耳标 + 测温）', cat:'D2', model:'RFID 读写器 + 测温耳标 200 个', count:200, where:'全场牛只 186 头（200 枚耳标含备件）', state:'在线', protocol:'RFID 134.2kHz + 测温 · TCP/IP / BLE', battery:'耳标电池 2-3 年', last:'刚刚' },
    { id:'DV3', name:'GPS/北斗定位项圈', cat:'D2', model:'AMG-TG5 · 5 个', count:5, where:'放牧牛群（头牛佩戴）', state:'在线', protocol:'北斗 / GPS · 4G · MQTT', battery:'78-92%', last:'刚刚' },
    { id:'DV4', name:'智能巡检机器狗', cat:'D3', model:'四足机器人（宇树 / 云深处）', count:1, where:'牛舍 / 活动区 / 饲草区 夜间巡检', state:'在线', protocol:'HTTP API + RTSP 回传 · 4G/5G / Wi-Fi · 视觉导航', battery:'82% · 续航约 3.5h', last:'5 分钟前' },
    { id:'DV5', name:'三分群全自动保定称', cat:'D4', model:'1 台 · 可对接 200 头过称分群', count:1, where:'大牛棚圈', state:'在线', protocol:'RS485 / Modbus RTU · 分群控制', battery:'市电', last:'刚刚' },
    { id:'DV6', name:'TMR 拌料机', cat:'D4', model:'9 立方 · 车载称重', count:1, where:'饲草区 / 饲料间', state:'在线', protocol:'ISOBUS / 车载称重 · RS485', battery:'柴油', last:'今天' },
    { id:'DV7', name:'撒料机', cat:'D4', model:'牵引式撒料车', count:1, where:'饲喂通道', state:'在线', protocol:'ISOBUS · 车载控制', battery:'柴油', last:'今天' },
    { id:'DV8', name:'饲料粉碎机', cat:'D4', model:'锤片式粉碎机', count:1, where:'饲料间', state:'检修', protocol:'Modbus RTU / 变频器 RS485', battery:'市电', last:'今天' },
    { id:'DV9', name:'智能农机作业终端', cat:'D5', model:'无人机 1 + 无人拖拉机 1 + 打草机 1', count:3, where:'草场 / 打草场', state:'在线', protocol:'RTK / 北斗作业监测 · 4G API', battery:'柴油 / 电池', last:'昨天' }
  ],
  /* 端口连接配置（可在后台填写协议后连接） */
  ports: [
    { id:'PT1', kind:'监控端口', name:'视频监控系统（6 路：生活区/饲草区/设备区/犊牛舍/活动区/牛舍内）', protocol:'RTSP / ONVIF', endpoint:'rtsp://192.168.1.64:554/Streaming/Channels/101', account:'admin', status:'未连接', last:'' },
    { id:'PT2', kind:'耳标端口', name:'耳标测温读写器（200 个耳标）', protocol:'TCP/IP / BLE', endpoint:'tcp://192.168.1.80:8000', account:'—', status:'未连接', last:'' },
    { id:'PT3', kind:'定位端口', name:'北斗定位项圈（5 个）', protocol:'MQTT', endpoint:'mqtt://iot.example.cn:1883/ranch/collar', account:'设备编号', status:'未连接', last:'' },
    { id:'PT4', kind:'机器狗端口', name:'智能巡检机器狗', protocol:'HTTP API / RTSP', endpoint:'http://192.168.1.120:8080/api/robot', account:'设备序列号', status:'未连接', last:'' },
    { id:'PT5', kind:'称重端口', name:'三分群全自动保定称', protocol:'Modbus RTU', endpoint:'modbus://192.168.1.90:502', account:'—', status:'未连接', last:'' },
    { id:'PT6', kind:'饲喂端口', name:'TMR 拌料机', protocol:'ISOBUS', endpoint:'isobus://192.168.1.91:9000', account:'—', status:'未连接', last:'' },
    { id:'PT7', kind:'饲喂端口', name:'撒料机', protocol:'ISOBUS', endpoint:'isobus://192.168.1.92:9000', account:'—', status:'未连接', last:'' },
    { id:'PT8', kind:'粉碎机端口', name:'饲料粉碎机', protocol:'Modbus RTU', endpoint:'modbus://192.168.1.93:502', account:'—', status:'未连接', last:'' },
    { id:'PT9', kind:'农机端口', name:'无人机 / 无人拖拉机 / 打草机', protocol:'RTK / 北斗作业监测', endpoint:'https://api.example.cn/v1/machine/task', account:'终端编号', status:'未连接', last:'' }
  ],

  /* ---------- 产品 ---------- */
  productInventory: [
    { id:'P1', name:'冷鲜草原牛肉', unit:'吨', stock:1.6, price:'¥76/kg', note:'冷链 0-4℃ · 订单式分割' },
    { id:'P2', name:'犊牛（活畜）', unit:'头', stock:8, price:'¥7,500/头', note:'西门塔尔犊牛 · 订单销售' },
    { id:'P3', name:'奶豆腐/奶皮子', unit:'盒', stock:60, price:'¥38/盒', note:'传统工艺 · 冷链' },
    { id:'P4', name:'草原文创（蒙古包摆件）', unit:'件', stock:120, price:'¥45/件', note:'牧户游伴手礼' }
  ],
  productRecords: [
    { id:'PR1', date:'2026-01-13', type:'入库', product:'冷鲜草原牛肉', qty:1.0, unit:'吨', amount:'—', customer:'屠宰分割' },
    { id:'PR2', date:'2026-01-18', type:'销售', product:'冷鲜草原牛肉', qty:0.8, unit:'吨', amount:'¥60,800', customer:'北京商超订单' },
    { id:'PR3', date:'2026-03-20', type:'销售', product:'犊牛（活畜）', qty:4, unit:'头', amount:'¥30,000', customer:'周边养殖户' },
    { id:'PR4', date:'2026-04-20', type:'销售', product:'奶豆腐/奶皮子', qty:30, unit:'盒', amount:'¥1,140', customer:'牧户游商店' }
  ],

  /* ---------- 文旅牧游 ---------- */
  tourism: {
    products: [
      { id:'TP1', icon:'⛺', name:'蒙古包住宿 · 暖冬版', desc:'地暖蒙古包 · 独立卫浴', price:'¥580/晚', season:'全年' },
      { id:'TP2', icon:'🐂', name:'牧牛体验 · 犊牛喂奶', desc:'亲子喂犊牛 · 犊牛舍参观', price:'¥120/人', season:'全年' },
      { id:'TP3', icon:'🌾', name:'草原打草体验', desc:'打草 · 捆草 · 农机作业观摩', price:'¥120/人', season:'夏秋' },
      { id:'TP4', icon:'🥛', name:'传统奶食品工坊', desc:'奶茶 · 奶豆腐 · 黄油制作', price:'¥120/人', season:'全年' },
      { id:'TP5', icon:'🔥', name:'篝火晚会 + 巴尔虎长调', desc:'长调 · 呼麦 · 星空篝火', price:'¥98/人', season:'夏秋' },
      { id:'TP6', icon:'🎓', name:'草原研学营（亲子）', desc:'智慧牧场参观 · 牧事体验', price:'¥388/家庭', season:'夏' },
      { id:'TP7', icon:'🛷', name:'冬季牧场冰雪营', desc:'雪地摄影 · 冰雪研学 · 暖冬蒙古包', price:'¥228/人', season:'冬季' },
      { id:'TP8', icon:'🏭', name:'智慧牧场参观', desc:'监控室 · 耳标 · TMR 饲喂演示', price:'¥88/人', season:'全年' }
    ],
    orders: [
      { id:'TO-001', item:'蒙古包住宿 ×2', guest:'王先生 · 北京', date:'12/16 入住', amount:'¥1,160', status:'待接待' },
      { id:'TO-002', item:'智慧牧场参观 ×6', guest:'考察团 · 呼和浩特', date:'12/17 10:00', amount:'¥528', status:'已确认' },
      { id:'TO-003', item:'牧牛体验 ×4', guest:'李女士 · 上海', date:'12/17 14:00', amount:'¥480', status:'已付款' },
      { id:'TO-004', item:'奶食工坊 ×2', guest:'亲子团 · 杭州', date:'12/18', amount:'¥240', status:'待付款' }
    ],
    yurts: [
      { name:'暖冬蒙古包 A 区', count:3, fac:'地暖 · 独立卫浴 · Wi-Fi', status:'营业中' },
      { name:'家庭星空包 B 区', count:2, fac:'天窗 · 火墙', status:'营业中' },
      { name:'游牧体验毡房', count:2, fac:'传统毡房 · 火炉', status:'冬季关闭' }
    ],
    safety:'游客意外险全覆盖 · 持证牧民向导 4 名 · 雪地救援车 1 台 · 距旗医院 60km 急救联动'
  },

  /* ---------- 呼伦贝尔 / 巴尔虎文化 ---------- */
  hulunbuir: {
    features: [
      { icon:'🏇', name:'巴尔虎那达慕', desc:'摔跤 · 射箭 · 民俗展演' },
      { icon:'⛰️', name:'祭敖包', desc:'祈福风调雨顺 · 人畜兴旺' },
      { icon:'🐂', name:'传统游牧转场', desc:'四季营盘 · 轮牧智慧' },
      { icon:'🐂', name:'西门塔尔牛养殖', desc:'高寒牧区繁育 · 犊牛保育' },
      { icon:'🥛', name:'奶食品文化', desc:'奶茶 · 奶豆腐 · 黄油' },
      { icon:'⛺', name:'蒙古包营造技艺', desc:'传统毡房 · 非遗体验' },
      { icon:'🎤', name:'巴尔虎长调', desc:'草原天籁 · 篝火晚会' },
      { icon:'❄️', name:'冰雪那达慕', desc:'冰雪民俗 · 雪地那达慕' }
    ],
    events: [
      { id:'EV1', date:'4 月中旬', name:'接犊节 · 犊牛保育观摩', place:'伊拉特智慧牧场', type:'民俗活动', status:'筹备', note:'犊牛舍开放参观' },
      { id:'EV2', date:'6 月中旬', name:'祭敖包', place:'呼伦嘎查敖包', type:'祭祀', status:'计划', note:'祈福仪式' },
      { id:'EV3', date:'7 月中旬', name:'巴尔虎那达慕', place:'吉布胡郎图苏木', type:'那达慕', status:'计划', note:'摔跤/射箭/民俗展演' },
      { id:'EV4', date:'8 月', name:'智慧牧场研学营', place:'伊拉特智慧牧场', type:'研学', status:'筹备', note:'监控室/耳标/TMR 演示' },
      { id:'EV5', date:'11 月下旬', name:'冬季牧场开放日', place:'伊拉特智慧牧场', type:'冰雪', status:'计划', note:'冰雪摄影/研学体验' }
    ],
    migration: [
      { id:'MG1', season:'春转场', route:'冬营盘 → 春营盘', distance:'8 km', time:'5 月上旬', status:'待执行', note:'避开返青脆弱期' },
      { id:'MG2', season:'夏转场', route:'春营盘 → 夏营盘', distance:'10 km', time:'6 月上旬', status:'待执行', note:'沿饮水线路转场' },
      { id:'MG3', season:'秋转场', route:'夏营盘 → 秋营盘', distance:'9 km', time:'9 月上旬', status:'计划', note:'配合秋季防疫' },
      { id:'MG4', season:'冬转场', route:'秋营盘 → 冬营盘', distance:'12 km', time:'11 月上旬', status:'已完成', note:'冬前完成防寒加固' }
    ],
    eco: [
      { icon:'❄️', name:'白灾（雪灾）预警', desc:'积雪期约 140 天 · 气象与积雪监测联动', level:'已接入' },
      { icon:'🔥', name:'草原防火', desc:'饲草区热成像识别 · 防火期值守', level:'已接入' },
      { icon:'🩺', name:'疫病防控监测', desc:'体温监测 + 出栏检疫联动预警', level:'已接入' },
      { icon:'💧', name:'饮水防冻监测', desc:'犊牛舍与活动区饮水不冻预警', level:'已接入' }
    ]
  },

  /* ---------- 四季循环 ---------- */
  months: [
    { m:1, season:'冬', name:'冬营盘', tasks:['冬营盘放牧 + 深冬补饲（天然草）','犊牛舍保温 22℃ · 饮水防冻','冷鲜牛肉订单销售'] },
    { m:2, season:'冬', name:'冬营盘', tasks:['围产期母牛看护','寒潮预警响应 · 加料','设备端口巡检'] },
    { m:3, season:'春', name:'春营盘', tasks:['产犊季（84 头）· 初乳管理','春季防疫（口蹄疫/炭疽）','犊牛舍恒温值守'] },
    { m:4, season:'春', name:'春营盘', tasks:['产犊收尾 · 犊牛建档耳标','春营盘返青休牧','打草场返青监测'] },
    { m:5, season:'夏', name:'夏营盘', tasks:['转场夏营盘','发情监测 + 配种计划','牧户游开季'] },
    { m:6, season:'夏', name:'夏营盘', tasks:['分区轮牧','打草场监测','奶食品加工'] },
    { m:7, season:'夏', name:'夏营盘', tasks:['第一茬打草','巴尔虎那达慕','游客接待'] },
    { m:8, season:'夏', name:'夏营盘', tasks:['第二茬打草（累计 900 捆）','青贮制作','育肥牛补饲'] },
    { m:9, season:'秋', name:'秋营盘', tasks:['转场秋营盘','秋季防疫（口蹄疫/BVD）','出栏计划启动'] },
    { m:10, season:'秋', name:'秋营盘', tasks:['育肥牛出栏 16 头','冷鲜牛肉加工入库','天然草 900 捆入库核验'] },
    { m:11, season:'冬', name:'冬营盘', tasks:['转场冬营盘','犊牛舍防寒加固','冬储核验 · 设备防冻'] },
    { m:12, season:'冬', name:'冬营盘', tasks:['年终盘点 · 繁殖率复盘','设备年检与维保','监控/耳标/农机端口联调'] }
  ],
  seasons: [
    { key:'春', months:'3-5月', name:'春营盘', color:'#5eead4', area:1200, focus:'产犊 · 防疫 · 返青休牧' },
    { key:'夏', months:'6-8月', name:'夏营盘', color:'#14b8a6', area:1800, focus:'轮牧 · 打草 · 旅游旺季' },
    { key:'秋', months:'9-10月', name:'秋营盘', color:'#f0b429', area:800, focus:'防疫 · 出栏 · 打草储备' },
    { key:'冬', months:'11-2月', name:'冬营盘', color:'#0891b2', area:2200, focus:'补饲 · 犊牛保温 · 冰雪牧游' }
  ],
  tasks: [
    { icon:'🥶', text:'寒潮预警：明晨 -38℃，犊牛舍加温至 22℃、饮水保持不冻', time:'10:00', level:'高' },
    { icon:'🐂', text:'YL-0001 号母牛发情已确认，今日 14:00 配种', time:'09:30', level:'中' },
    { icon:'🧊', text:'天然草入库核验：900/1000 捆，冬储覆盖至 4 月', time:'08:40', level:'中' },
    { icon:'📡', text:'监控 / 耳标 / 农机端口联调：后台填写协议即可连接', time:'08:20', level:'中' },
    { icon:'⚖️', text:'自动称重保定架：本周完成 84 头犊牛体重采集', time:'08:10', level:'低' }
  ],

  /* ---------- IoT 实时采集 ---------- */
  iot: {
    enabled: true, interval: 5000, lastSync: '',
    sources: [
      { metric:'视频画面 / AI 识别', device:'视频监控 6 路（生活区/饲草区/设备区/犊牛舍/活动区/牛舍内）', protocol:'ONVIF / RTSP', freq:'实时' },
      { metric:'耳标识别 / 体温监测', device:'耳标测温 200 个', protocol:'RFID 134.2kHz + 测温', freq:'实时 / 10 分钟' },
      { metric:'放牧定位 / 活动量', device:'北斗定位项圈 5 个（头牛）', protocol:'北斗 · 4G · MQTT', freq:'5 分钟' },
      { metric:'夜间巡检 / 异常识别', device:'智能巡检机器狗', protocol:'HTTP API + RTSP · 4G/5G', freq:'按班次' },
      { metric:'犊牛舍温度', device:'犊牛舍温控', protocol:'Modbus / PLC', freq:'10 秒' },
      { metric:'体重与体尺', device:'自动称重保定架', protocol:'RS485 / Modbus RTU', freq:'过称即采' },
      { metric:'饲喂量与配方', device:'TMR 拌料机 + 撒料机', protocol:'车载称重 / ISOBUS', freq:'每次投喂' },
      { metric:'草场 NDVI / 牧草高度', device:'卫星遥感 + 无人机', protocol:'API', freq:'周更' },
      { metric:'设备在线率', device:'LoRa/4G 网关', protocol:'LoRaWAN / MQTT', freq:'实时' }
    ]
  },

  /* ---------- 数字人讲解词（后台可改） ---------- */
  narration: [
    { id:'NR1', text:'嗨，大家好！伊拉特智慧牧场位于呼伦贝尔市新巴尔虎左旗吉布胡郎图苏木呼伦嘎查，2016 年建场，以基础母牛繁育为核心产业，现有 2 栋标准化圈舍（配套独立活动区）、基础母牛 186头，采用“散养为主、圈养繁育为辅”的新型现代化智慧牧场。' },
    { id:'NR2', text:'牧场草场共 13,290 亩，其中自家天然散养草场 3,850 亩，租赁草场 9,440 亩；现存栏牛 186 头，其中大牛 102 头、小牛 84 头。' },
    { id:'NR3', text:'牧场建有两个棚圈：大牛棚圈养大牛 102 头，犊牛舍养小牛 84 头，并配套牛只活动区和饲草区；养殖方式是冬季圈养、夏季散养，草场按春夏秋冬四季营盘轮牧。' },
    { id:'NR4', text:'装备方面，全场有 9 项智能设备：视频监控 6 路覆盖生活区、饲草区、设备区、犊牛舍、牛只活动区和牛舍内；耳标测温 200 个、北斗定位项圈 5 个；还有智能巡检机器狗、三分群全自动保定称、TMR 拌料机、撒料机、饲料粉碎机和农机作业终端。' },
    { id:'NR5', text:'目前现状：本年度产犊 84 头，犊牛成活率 96%；计划出栏 62 头；天然草已入库 900 捆，目标 1,000 捆，冬储可覆盖到明年 4 月。' },
    { id:'NR6', text:'所有设备都配有协议连接端口，包括监控、耳标、定位、机器狗、称重、饲喂、粉碎机和农机端口，后期提供协议地址即可直接对接。' }
  ],
  agent: {
    quick: ['今天牧场整体情况怎么样？','现在存栏多少牛？','天然草够不够过冬？','有哪些预警要处理？','监控/耳标/农机怎么接？','犊牛怎么防冻？','设备端口怎么连接？','该不该转场了？']
  },

  /* ---------- 政务对接 ---------- */
  gov: {
    systems: [
      { id:'GV1', name:'动物检疫电子出证（牧运通）', scope:'检疫申报 · 合格出证', method:'API 对接', status:'已对接', freq:'实时', endpoint:'POST https://jydz.gov-api.cn/v1/quarantine/apply', note:'出栏检疫合格证明自动同步' },
      { id:'GV2', name:'动物疫病防控直报系统', scope:'疫病报告 · 免疫档案', method:'API 对接', status:'已对接', freq:'实时', endpoint:'POST https://yqfk.gov-api.cn/v1/yqb/report', note:'免疫记录 / 消毒台账自动上报' },
      { id:'GV3', name:'定点屠宰监管平台', scope:'屠宰批次 · 肉品品质检验', method:'API 对接', status:'已对接', freq:'批次实时', endpoint:'POST https://tzjg.gov-api.cn/v1/slaughter/batch', note:'屠宰记录 + 产品溯源同步' },
      { id:'GV4', name:'畜禽标识溯源系统', scope:'耳标备案 · 一畜一码', method:'API 对接', status:'已对接', freq:'实时', endpoint:'POST https://suyuan.gov-api.cn/v1/ear-tag/sync', note:'耳标发放 / 佩戴同步' }
    ],
    reports: [
      { id:'GR1', time:'2026-03-20 09:32', target:'动物疫病防控直报系统', type:'免疫记录上报', biz:'犊牛腹泻疫苗 · 84 头份', code:'YB20260320001', status:'成功', cost:'0.8s' },
      { id:'GR2', time:'2026-04-06 15:10', target:'动物检疫电子出证', type:'检疫出证', biz:'出栏牛 4 头 · 检疫合格', code:'QZ20260406018', status:'成功', cost:'1.2s' },
      { id:'GR3', time:'2026-04-18 11:05', target:'畜禽标识溯源系统', type:'耳标备案同步', biz:'新增耳标测温 200 个（全场 186 头牛）', code:'EB20260418009', status:'成功', cost:'0.6s' },
    ]
  },

  /* ---------- 牧事日志 / 账本 / 用工 / 保险 ---------- */
  logs: [
    { id:'LG1', date:'2026-03-18', weather:'晴 -24℃', done:'产犊 2 头 · 初乳饲喂 · 犊牛舍温度校准', plan:'夜间值守待产母牛 1 头', note:'犊牛舍保持 22℃', checked:true },
    { id:'LG2', date:'2026-03-17', weather:'小雪 -27℃', done:'监控端口巡检 · 饮水加热检查', plan:'填写耳标端口协议', note:'监控 4 路在线', checked:true },
    { id:'LG3', date:'2026-03-16', weather:'多云 -22℃', done:'TMR 拌料机试机 · 自动称重保定架校准', plan:'整理智慧牧场申报材料', note:'称重数据正常', checked:true }
  ],
  ledger: [
    { id:'LD1', date:'2026-03-20', type:'收入', category:'产品', item:'犊牛销售 4 头', amount:30000, note:'周边养殖户' },
    { id:'LD2', date:'2026-01-18', type:'收入', category:'产品', item:'冷鲜草原牛肉 0.8 吨', amount:60800, note:'北京商超' },
    { id:'LD3', date:'2026-03-05', type:'支出', category:'饲草', item:'精饲料采购 6 吨', amount:19200, note:'犊牛开食料' },
    { id:'LD4', date:'2026-03-10', type:'支出', category:'防疫', item:'春季疫苗采购', amount:5200, note:'口蹄疫 / 炭疽 / 犊牛腹泻' },
    { id:'LD5', date:'2026-02-26', type:'支出', category:'设备', item:'监控与网关维护', amount:3600, note:'端口联调' },
    { id:'LD6', date:'2026-04-20', type:'收入', category:'牧游', item:'牧户游接待（春季）', amount:9860, note:'智慧牧场参观' }
  ],
  marketPrice: [
    { species:'牛（活重）', unit:'元/kg', price:'26-32', note:'西门塔尔' },
    { species:'犊牛', unit:'元/头', price:'7,000-9,000', note:'4-6 月龄西门塔尔' },
    { species:'天然草', unit:'元/捆', price:'18-26', note:'本场自产 · 越冬用' },
    { species:'冷鲜牛肉', unit:'元/kg', price:'68-82', note:'订单分割' }
  ],
  subsidies: [
    { icon:'🐄', name:'基础母牛扩群补贴', desc:'见犊补母 · 按政策标准执行', status:'可申报' },
    { icon:'🌾', name:'草畜平衡奖励', desc:'按自有草场 3,850 亩 + 租赁 9,440 亩核算', status:'待申报' },
    { icon:'🛡️', name:'政策性牲畜保险', desc:'冻死/疫病可理赔 · 保费财政补贴', status:'已投保' }
  ],
  workers: [
    { id:'WK1', name:'伊拉特', role:'场主 · 繁育管理', phone:'139****6688', wage:'—', wageType:'月薪', status:'在岗', schedule:'常住牧场', note:'负责配种与产犊管理' },
    { id:'WK2', name:'吉日嘎拉', role:'兽医 · 接犊技术', phone:'138****1201', wage:'6,000', wageType:'月薪', status:'在岗', schedule:'常住牧场', note:'负责防疫与犊牛保育' },
    { id:'WK3', name:'巴特尔', role:'放牧工', phone:'137****8823', wage:'260', wageType:'日结', status:'在岗', schedule:'日常放牧', note:'负责牛群放牧' },
    { id:'WK4', name:'萨仁', role:'牧户游服务', phone:'150****2234', wage:'3,800', wageType:'月薪', status:'休假', schedule:'旺季在岗', note:'6-10 月' }
  ],
  attendance: [
    { id:'AT1', date:'2026-03-18', worker:'吉日嘎拉', task:'产犊值守 + 犊牛护理', hours:10, pay:300, note:'' },
    { id:'AT2', date:'2026-03-17', worker:'巴特尔', task:'冬营盘放牧', hours:9, pay:260, note:'' },
    { id:'AT3', date:'2026-03-16', worker:'伊拉特', task:'设备端口联调', hours:8, pay:0, note:'场主' }
  ],
  insurances: [
    { id:'IN1', date:'2026-01-22', species:'牛', head:1, reason:'冻死（白灾）', est:'¥8,000', status:'已赔付', note:'已拍照 · 无害化处理单已交' },
    { id:'IN2', date:'2026-03-08', species:'牛', head:1, reason:'疫病（犊牛腹泻）', est:'¥6,800', status:'理赔中', note:'等保险员现场核验' }
  ],
  photos: [
    { id:'PH1', date:'2026-06-05', title:'呼伦贝尔草原 · 夏营盘', url:'assets/photos/grassland-green.jpg', note:'新巴尔虎左旗草原 · 生态优先' },
    { id:'PH2', date:'2026-09-10', title:'呼伦贝尔草原 · 秋季', url:'assets/photos/grassland-golden.jpg', note:'金色牧区 · 打草储备季' },
    { id:'PH4', date:'2026-04-12', title:'蒙古包 · 游牧人家', url:'assets/photos/yurts.jpg', note:'传统游牧生活' }
  ],
  migrationCosts: [
    { id:'MC1', date:'2026-05-06', route:'冬营盘→春营盘', item:'油料（车+摩托）', amount:320, note:'' },
    { id:'MC2', date:'2026-05-07', route:'冬营盘→春营盘', item:'路上饲草', amount:180, note:'' },
    { id:'MC3', date:'2026-11-02', route:'秋营盘→冬营盘', item:'油料 + 车辆费', amount:520, note:'请车 1 台' }
  ]
};

/* ============ 持久化与通用 CRUD（支持 a.b 路径） ============ */
const KEY = 'yilate-ranch-v48';
let DB = loadDB();

function loadDB(){
  try { const raw = localStorage.getItem(KEY); if (raw){ const d = JSON.parse(raw); if (d && d.meta) return d; } } catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}
let cloudPushTimer = null;
function cloudPush(){
  if (!/^https?:$/.test(location.protocol)) return;
  clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(async()=>{
    try {
      await fetch('/api/ranch/state', {
        method:'PUT', credentials:'include',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({ data:DB })
      });
    } catch(e){}
  }, 700);
}
function saveDB(){ try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e){} cloudPush(); }
async function loadCloudState(){
  if (!/^https?:$/.test(location.protocol)) return;
  try {
    const r = await fetch('/api/ranch/state', {credentials:'include', headers:{accept:'application/json'}});
    if (!r.ok) return;
    const d = await r.json();
    if (d && d.data) {
      DB = d.data;
      try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e){}
      window.dispatchEvent(new CustomEvent('ranch-cloud-data', { detail:DB }));
    } else {
      cloudPush();
    }
  } catch(e){}
}
window.addEventListener('DOMContentLoaded', loadCloudState);
function byPath(obj, path){ return path.split('.').reduce((o,k)=> (o==null?undefined:o[k]), obj); }
function setPath(obj, path, val){
  const ks = path.split('.'); const last = ks.pop();
  const t = ks.reduce((o,k)=> (o[k] = o[k] || {}), obj);
  t[last] = val;
}
function uid(prefix){ return (prefix||'ID') + '-' + String(Date.now()).slice(-6); }
function addRecord(path, item){
  const arr = byPath(DB, path) || [];
  item.id = item.id || uid();
  arr.push(item); setPath(DB, path, arr); saveDB(); return item;
}
function updateRecord(path, id, patch){
  const arr = byPath(DB, path) || [];
  const i = arr.findIndex(x=>x.id===id); if (i<0) return;
  arr[i] = Object.assign({}, arr[i], patch); saveDB();
}
function delRecord(path, id){
  const arr = byPath(DB, path) || [];
  setPath(DB, path, arr.filter(x=>x.id!==id)); saveDB();
}
function resetData(){ DB = JSON.parse(JSON.stringify(DEFAULT_DATA)); saveDB(); }

/* ---------- 汇总计算 ---------- */
function compute(){
  const totalAnimals = DB.species.reduce((s,x)=>s+x.count,0);
  const sheepUnits = DB.species.reduce((s,x)=>s+x.count*(x.key==='cattle'||x.key==='horse'?5:x.key==='camel'?7:1),0);
  const foragePct = Math.round(DB.forageInventory.reduce((s,x)=>s+x.stock,0) / DB.forageInventory.reduce((s,x)=>s+x.target,0) * 100);
  const saleAmount = DB.productRecords.filter(r=>r.type==='销售').reduce((s,r)=>s+(parseInt(String(r.amount).replace(/[^\d]/g,''))||0),0);
  const devTotal = DB.deviceList.reduce((s,x)=>s+x.count,0);
  const devOnline = DB.deviceList.filter(x=>x.state==='在线'||String(x.state).includes('在线')).reduce((s,x)=>s+x.count,0);
  const devOffline = devTotal - devOnline;
  const devRate = devTotal ? +(devOnline/devTotal*100).toFixed(1) : 0;
  const earTags = DB.deviceList.filter(x=>/耳标/.test(x.name)).reduce((s,x)=>s+x.count,0);
  const kit = devTotal - earTags;
  const portsOn = (DB.ports||[]).filter(p=>p.status==='已连接').length;
  return { totalAnimals, sheepUnits, foragePct, saleAmount,
    devTotal, devOnline, devOffline, devRate, earTags, kit,
    todayOrders: DB.tourism.orders.length,
    slHead: DB.slaughterRecords.reduce((a,r)=>a+r.head,0),
    cattle: DB.species[0].count, portsOn };
}
function currentMonth(){ return new Date().getMonth()+1; }
function currentSeason(){ const m=currentMonth(); if(m>=3&&m<=5)return '春'; if(m>=6&&m<=8)return '夏'; if(m>=9&&m<=10)return '秋'; return '冬'; }
