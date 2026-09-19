/* ============ 艾牧戈智慧牧场 · 动态数据层 v3（localStorage 持久化） ============ */
const DEFAULT_DATA = {
  meta: {
    name:'艾牧戈家庭牧场', nameEn:'AimuGo Family Ranch',
    location:'内蒙古 · 呼伦贝尔市 · 陈巴尔虎旗 · 呼和诺尔草原',
    gps:'49.32°N, 119.44°E', area:30000, grazingArea:22000, hayArea:8000,
    owner:'巴特尔', founded:1998, smartSince:2020,
    climate:'寒温带大陆性季风气候 · 冬季最低 -42℃',
    slogan:'一台手机管牧场，四季轮牧数字化；传统游牧智慧 × 现代科技，做新一代家庭牧场。'
  },
  weather: { place:'陈巴尔虎旗 · 呼和诺尔', temp:-22, feels:-30, icon:'☀️', text:'晴 · 微风',
    wind:'西北风 3-4 级', snow:'积雪 8cm', low:-31, high:-17, tomorrow:-27,
    alert:'夜间低温 · 注意犊牛/羔羊暖棚保温' },

  /* ---------- 栏目（可改名） ---------- */
  nav: [
    { key:'bigscreen',  icon:'🖥️', title:'数据大屏' },
    { key:'dashboard',  icon:'📊', title:'数据总览' },
    { key:'log',        icon:'📒', title:'牧事日志' },
    { key:'ledger',     icon:'💰', title:'经营账本' },
    { key:'labor',      icon:'🧑‍🌾', title:'用工管理' },
    { key:'insurance',  icon:'🛡️', title:'保险理赔' },
    { key:'safety',     icon:'🐺', title:'防狼防盗' },
    { key:'gallery',    icon:'📷', title:'牧场相册' },
    { key:'agent',      icon:'🤖', title:'畜牧业智能体' },
    { key:'cycle',      icon:'🔄', title:'四季循环' },
    { key:'livestock',  icon:'🐑', title:'养殖管理' },
    { key:'grassland',  icon:'🌾', title:'草场分类' },
    { key:'forage',     icon:'🧊', title:'饲草管理' },
    { key:'slaughter',  icon:'🍖', title:'屠宰加工' },
    { key:'vaccine',    icon:'💉', title:'防疫管理' },
    { key:'gov',        icon:'🏛️', title:'政务对接' },
    { key:'devices',    icon:'📡', title:'智慧装备' },
    { key:'products',   icon:'🛍️', title:'产品中心' },
    { key:'tourism',    icon:'🏕️', title:'文旅牧游' },
    { key:'profile',    icon:'🏡', title:'牧场档案' }
  ],

  /* ---------- 养殖 ---------- */
  species: [
    { key:'cattle', name:'牛', emoji:'🐂', color:'#b3541e', breed:'三河牛 / 西门塔尔', count:1286,
      structure:'基础母畜 512 · 种公牛 28 · 育肥牛 336 · 犊牛 410', gps:186, tempAvg:'38.5℃',
      trend:[1040,1088,1132,1168,1202,1246,1286] },
    { key:'sheep', name:'羊', emoji:'🐑', color:'#8a9a5b', breed:'呼伦贝尔羊（短尾羊）', count:8540,
      structure:'基础母羊 5,100 · 种公羊 120 · 育肥羊 1,900 · 羔羊 1,420', gps:64, tempAvg:'39.2℃',
      trend:[8200,8310,8420,8510,8560,8540,8540] },
    { key:'horse', name:'马', emoji:'🐴', color:'#7a5230', breed:'三河马', count:320,
      structure:'基础母马 146 · 种公马 8 · 育成马 96 · 马驹 70', gps:320, tempAvg:'37.8℃',
      trend:[268,278,290,300,308,314,320] },
    { key:'camel', name:'骆驼', emoji:'🐫', color:'#c8925a', breed:'双峰驼', count:86,
      structure:'成年驼 62 · 母驼 54 · 驼羔 24', gps:86, tempAvg:'37.6℃',
      trend:[70,72,75,78,81,84,86] }
  ],
  groups: [
    { id:'G1', name:'基础母畜群', count:5832, desc:'繁殖核心群 · 电子耳标全覆盖', status:'正常' },
    { id:'G2', name:'种公畜群', count:156, desc:'牛 28 · 羊 120 · 马 8', status:'正常' },
    { id:'G3', name:'育肥群', count:2236, desc:'出栏前 90 天 · 智能称重监控', status:'正常' },
    { id:'G4', name:'幼畜群（犊/羔/驹）', count:2008, desc:'恒温暖棚 + 智能饮水', status:'重点看护' }
  ],
  animals: [
    { id:'AN-10218', species:'牛', breed:'三河牛', sex:'母', age:'4岁', weight:'618kg', health:'健康', location:'冬营盘·东区', device:'GPS · 在线', temp:'38.6℃', note:'繁殖核心群' },
    { id:'AN-10234', species:'牛', breed:'西门塔尔', sex:'母', age:'5岁', weight:'672kg', health:'发情预警', location:'冬营盘·东区', device:'GPS · 在线', temp:'38.9℃', note:'今日14:00配种' },
    { id:'AN-20387', species:'羊', breed:'呼伦贝尔羊', sex:'母', age:'3岁', weight:'56kg', health:'待产', location:'产羔暖棚', device:'耳标 · 在线', temp:'39.1℃', note:'预产 2/18' },
    { id:'AN-20412', species:'羊', breed:'呼伦贝尔羊', sex:'公', age:'2岁', weight:'64kg', health:'健康', location:'冬营盘·南区', device:'耳标 · 在线', temp:'39.0℃', note:'育肥出栏候选' },
    { id:'AN-30166', species:'马', breed:'三河马', sex:'母', age:'7岁', weight:'480kg', health:'健康', location:'冬营盘·马圈', device:'GPS · 在线', temp:'37.8℃', note:'骑乘体验用马' },
    { id:'AN-40052', species:'骆驼', breed:'双峰驼', sex:'母', age:'8岁', weight:'560kg', health:'健康', location:'冬营盘·驼圈', device:'GPS · 在线', temp:'37.6℃', note:'雪原穿越用驼' },
    { id:'AN-10241', species:'牛', breed:'三河牛', sex:'公', age:'3岁', weight:'712kg', health:'健康', location:'育肥圈', device:'GPS · 在线', temp:'38.5℃', note:'出栏候选' },
    { id:'AN-20455', species:'羊', breed:'呼伦贝尔羊', sex:'母', age:'1岁', weight:'48kg', health:'健康', location:'冬营盘·南区', device:'耳标 · 在线', temp:'39.2℃', note:'后备母羊' },
    { id:'AN-20473', species:'羊', breed:'呼伦贝尔羊', sex:'母', age:'4岁', weight:'58kg', health:'待驱虫', location:'冬营盘·南区', device:'耳标 · 在线', temp:'39.0℃', note:'计划 2/20 驱虫' }
  ],
  birthRecords: [
    { id:'BR1', date:'2026-01-18', species:'羊', item:'接羔 2860 只', survival:'97.6%', operator:'满都拉', note:'暖棚接羔 · 双羔率 8%' },
    { id:'BR2', date:'2026-02-02', species:'牛', item:'产犊 402 头', survival:'98.0%', operator:'巴特尔', note:'初乳及时饲喂' },
    { id:'BR3', date:'2026-02-10', species:'马', item:'产驹 64 匹', survival:'96.9%', operator:'满都拉', note:'马驹成活良好' },
    { id:'BR4', date:'2026-02-12', species:'骆驼', item:'产驼羔 18 峰', survival:'100%', operator:'巴特尔', note:'冬季驼羔全成活' }
  ],

  /* ---------- 草场分类 ---------- */
  grasslandTypes: [
    { id:'GT1', name:'草甸草原（高草区）', icon:'🌿', color:'#3f8f4f', area:9800, species:'羊草 · 披碱草 · 野大麦', use:'打草 + 轮牧', note:'产草量最高 · 打草场主区' },
    { id:'GT2', name:'典型草原（中草区）', icon:'🌱', color:'#7fb069', area:11200, species:'针茅 · 冷蒿 · 冰草', use:'四季轮牧', note:'载畜量适中 · 轮牧主区' },
    { id:'GT3', name:'低湿地 / 河漫滩', icon:'💧', color:'#5b7fa6', area:3600, species:'芦苇 · 苔草', use:'应急放牧 + 打草', note:'补水草场 · 夏秋利用' },
    { id:'GT4', name:'退牧还草 / 补播改良区', icon:'🌾', color:'#c8925a', area:2800, species:'改良草种混播', use:'禁牧围封', note:'补播改良 · 恢复植被' },
    { id:'GT5', name:'沙化治理区', icon:'🏜️', color:'#b3541e', area:1600, species:'沙蒿 · 锦鸡儿', use:'封育治理', note:'防风固沙 · 禁牧' },
    { id:'GT6', name:'水域 / 道路 / 其他', icon:'🛤️', color:'#8a9a5b', area:1000, species:'—', use:'保护利用', note:'饮水点 · 转场通道' }
  ],
  grassland: {
    total:30000, grazing:22000, hay:8000,
    balance:{ capacity:20000, actual:17172, rate:85.9 },
    ndvi:{ value:0.74, level:'优良', trend:[0.42,0.55,0.66,0.74,0.79,0.76,0.74] },
    seasons: [
      { name:'春营盘', months:'3-5月', area:4600, grass:'返青期', height:'6-9cm', status:'休牧 · 返青保护', color:'#7fb069', progress:30 },
      { name:'夏营盘', months:'6-8月', area:6800, grass:'盛草期', height:'28-36cm', status:'轮牧中', color:'#3f8f4f', progress:75 },
      { name:'秋营盘', months:'9-10月', area:5400, grass:'成熟期', height:'22-30cm', status:'计划 9/1 转入', color:'#c8925a', progress:45 },
      { name:'冬营盘', months:'11-2月', area:5200, grass:'枯草期', height:'10cm', status:'放牧中 · 防风向阳', color:'#5b7fa6', progress:85 }
    ],
    pastures: [
      { id:'PA1', name:'冬营盘 · 东区', type:'典型草原', usage:'放牧场', area:2600, su:1620, height:'9cm', status:'放牧中', util:78 },
      { id:'PA2', name:'冬营盘 · 南区', type:'典型草原', usage:'放牧场', area:2600, su:1520, height:'11cm', status:'放牧中', util:72 },
      { id:'PA3', name:'夏营盘 · 西区', type:'草甸草原', usage:'放牧场', area:3400, su:0, height:'32cm', status:'休牧恢复', util:0 },
      { id:'PA4', name:'夏营盘 · 北区', type:'草甸草原', usage:'放牧场', area:3400, su:1980, height:'28cm', status:'轮牧中', util:58 },
      { id:'PA5', name:'秋营盘 · 高草区', type:'草甸草原', usage:'放牧场', area:5400, su:0, height:'26cm', status:'禁牧 · 留茬', util:0 },
      { id:'PA6', name:'春营盘 · 返青区', type:'典型草原', usage:'放牧场', area:4600, su:0, height:'7cm', status:'休牧', util:0 },
      { id:'PA7', name:'一号打草场', type:'草甸草原', usage:'打草场', area:3200, su:0, height:'34cm', status:'夏末打草', util:0 },
      { id:'PA8', name:'二号打草场', type:'低湿地', usage:'打草场', area:4800, su:0, height:'38cm', status:'打草完成 · 待捆', util:0 }
    ],
    tasks: [
      '3/1 春营盘返青监测 · 休牧至草高 12cm',
      '7/20 一号打草场刈割 · 注意留茬 ≥ 6cm',
      '9/1 秋营盘转场 · 完成车辆与设备检查',
      '11/15 冬营盘防寒加固 · 暖棚检修完成'
    ]
  },

  /* ---------- 饲草 ---------- */
  forageInventory: [
    { id:'F1', name:'干草捆（苜蓿/羊草）', unit:'吨', stock:420, target:500, note:'秋打草入库 · 供冬春补饲' },
    { id:'F2', name:'青贮玉米', unit:'吨', stock:180, target:240, note:'8-9 月青贮制作' },
    { id:'F3', name:'精饲料（玉米/豆粕）', unit:'吨', stock:60, target:80, note:'育肥期补饲' },
    { id:'F4', name:'矿物质舔砖', unit:'吨', stock:3.2, target:4, note:'冬春季防缺乏症' },
    { id:'F5', name:'谷草/秸秆', unit:'吨', stock:40, target:60, note:'应急饲草' }
  ],
  forageRecords: [
    { id:'FR1', date:'2025-08-20', type:'打草入库', item:'干草捆', qty:260, unit:'吨', operator:'巴特尔', note:'一号打草场 · 第一茬' },
    { id:'FR2', date:'2025-09-05', type:'打草入库', item:'干草捆', qty:240, unit:'吨', operator:'巴特尔', note:'二号打草场 · 留茬6cm' },
    { id:'FR3', date:'2025-09-12', type:'青贮制作', item:'青贮玉米', qty:180, unit:'吨', operator:'满都拉', note:'青贮窖 2 座' },
    { id:'FR4', date:'2025-12-01', type:'领用', item:'干草捆', qty:40, unit:'吨', operator:'牧工组', note:'冬季补饲开始' },
    { id:'FR5', date:'2026-01-15', type:'领用', item:'干草捆', qty:30, unit:'吨', operator:'牧工组', note:'深冬补饲' },
    { id:'FR6', date:'2026-02-05', type:'领用', item:'精饲料', qty:8, unit:'吨', operator:'牧工组', note:'育肥牛增补' }
  ],

  /* ---------- 屠宰 ---------- */
  slaughterPlans: [
    { id:'SP1', season:'秋冬季出栏（10-12月）', species:'牛', head:60, note:'育肥牛 60 头 · 检疫后定点屠宰' },
    { id:'SP2', season:'秋冬季出栏（10-12月）', species:'羊', head:800, note:'育肥羊 800 只' },
    { id:'SP3', season:'秋冬季出栏（10-12月）', species:'马', head:20, note:'淘汰老马 · 马肉制品' },
    { id:'SP4', season:'秋冬季出栏（10-12月）', species:'骆驼', head:5, note:'淘汰老驼' }
  ],
  slaughterRecords: [
    { id:'SL1', date:'2026-01-12', species:'牛', head:6, weight:'2.1吨', inspector:'旗动物检疫所', status:'检疫合格', note:'冷鲜肉 1.6 吨入库' },
    { id:'SL2', date:'2026-01-20', species:'羊', head:120, weight:'2.4吨', inspector:'旗动物检疫所', status:'检疫合格', note:'清真分割 · 冷库 -18℃' },
    { id:'SL3', date:'2026-01-28', species:'牛', head:4, weight:'1.4吨', inspector:'旗动物检疫所', status:'检疫合格', note:'礼盒装牛肉' },
    { id:'SL4', date:'2026-02-08', species:'羊', head:60, weight:'1.1吨', inspector:'旗动物检疫所', status:'检疫合格', note:'春节订单' }
  ],

  /* ---------- 防疫 ---------- */
  vaccinePlans: [
    { id:'VP1', season:'春季防疫（3-4月）', vaccine:'口蹄疫 O 型', species:'牛/羊/骆驼', rate:'应免尽免' },
    { id:'VP2', season:'春季防疫（3-4月）', vaccine:'羊三联四防', species:'羊', rate:'应免尽免' },
    { id:'VP3', season:'春季防疫（3-4月）', vaccine:'炭疽', species:'牛/羊/马', rate:'应免尽免' },
    { id:'VP4', season:'秋季防疫（9-10月）', vaccine:'口蹄疫 A 型', species:'牛/羊/骆驼', rate:'应免尽免' },
    { id:'VP5', season:'秋季防疫（9-10月）', vaccine:'小反刍兽疫', species:'羊', rate:'应免尽免' },
    { id:'VP6', season:'全年', vaccine:'布病监测', species:'牛/羊', rate:'每季抽检 20%' }
  ],
  vaccineRecords: [
    { id:'VR1', date:'2025-10-08', species:'牛', group:'全群', vaccine:'口蹄疫 A 型', dose:'6,430 头份', operator:'旗疫控中心', status:'完成' },
    { id:'VR2', date:'2025-10-09', species:'羊', group:'全群', vaccine:'小反刍兽疫', dose:'8,540 头份', operator:'旗疫控中心', status:'完成' },
    { id:'VR3', date:'2026-01-10', species:'牛/羊', group:'出栏群', vaccine:'出栏前检疫', dose:'290 头只', operator:'旗动物检疫所', status:'完成' },
    { id:'VR4', date:'2026-02-06', species:'羊', group:'羔羊', vaccine:'羔羊三联四防', dose:'1,200 头份', operator:'满都拉', status:'完成' }
  ],
  disinfect: [
    { id:'DS1', date:'2026-01-05', item:'产羔暖棚消毒', drug:'戊二醛消毒液', operator:'牧工组', note:'接羔前全面消毒' },
    { id:'DS2', date:'2026-01-30', item:'圈舍消毒', drug:'生石灰 + 烧碱', operator:'牧工组', note:'冬季每周 1 次' },
    { id:'DS3', date:'2026-02-10', item:'屠宰车间消毒', drug:'过氧乙酸', operator:'加工组', note:'批次间消毒' }
  ],

  /* ---------- 智慧装备 ---------- */
  deviceCats: [
    { id:'D1', name:'监控与 AI 识别', icon:'🎥', color:'#2e86ab', desc:'行为识别 · 明火烟雾 · 周界入侵', protocol:'ONVIF / RTSP · 海康/大华 SDK' },
    { id:'D2', name:'电子标识与定位', icon:'🏷️', color:'#3f8f4f', desc:'电子耳标 · GPS/北斗项圈 · 体温', protocol:'RFID(134.2k/UHF) · NB-IoT · BLE' },
    { id:'D3', name:'无人设备', icon:'🛸', color:'#8a5a9e', desc:'无人机 · 四足机器人 · 投料清粪', protocol:'RTK · 4G/5G 图传 · 自主导航' },
    { id:'D4', name:'农机与机械', icon:'🚜', color:'#b3541e', desc:'拖拉机 · 打搂捆 · 青贮 · TMR', protocol:'ISOBUS / CAN · 北斗作业监测' },
    { id:'D5', name:'棚圈设施', icon:'🏠', color:'#c8925a', desc:'恒温暖棚 · 防冻饮水 · 电子围栏', protocol:'Modbus · LoRa · PLC' },
    { id:'D6', name:'网关与供电', icon:'📶', color:'#5b7fa6', desc:'LoRa/4G 网关 · 北斗短报文 · 供电', protocol:'LoRaWAN · TCP/IP · MPPT' }
  ],
  deviceList: [
    { id:'DV1', name:'AI 行为识别摄像机（发情/分娩/异常）', cat:'D1', model:'海康威视 DS-2CD 系列', count:24, where:'冬营盘·产房·棚圈', state:'在线', protocol:'ONVIF / RTSP + AI 算法', battery:'市电+UPS', last:'刚刚' },
    { id:'DV2', name:'全景智能球机', cat:'D1', model:'大华 DH-SD 系列', count:12, where:'营盘高点·草场边界', state:'在线', protocol:'ONVIF / RTSP', battery:'太阳能', last:'1 分钟前' },
    { id:'DV3', name:'AI 明火/烟雾识别热成像', cat:'D1', model:'海康 DS-2TD 热成像', count:6, where:'饲草库·防火重点区', state:'在线', protocol:'热成像 + AI 识别', battery:'市电', last:'刚刚' },
    { id:'DV4', name:'周界电子哨兵（雷达+视觉）', cat:'D1', model:'宇视 智能哨兵', count:4, where:'草场边界', state:'离线', protocol:'4G + AI 越界识别', battery:'太阳能', last:'18 分钟前' },
    { id:'DV5', name:'低频电子耳标', cat:'D2', model:'AMG-LF1', count:8800, where:'羊群', state:'在线', protocol:'134.2kHz RFID', battery:'—', last:'刚刚' },
    { id:'DV6', name:'UHF 电子耳标', cat:'D2', model:'AMG-UHF3', count:1305, where:'牛马驼', state:'在线', protocol:'920MHz UHF RFID', battery:'—', last:'刚刚' },
    { id:'DV7', name:'GPS/北斗定位项圈', cat:'D2', model:'AMG-TG5', count:656, where:'牛马驼+部分羊', state:'在线', protocol:'北斗/GPS · 4G · 短报文', battery:'76-92%', last:'刚刚' },
    { id:'DV8', name:'体温监测耳标', cat:'D2', model:'AMG-TB1', count:420, where:'繁殖母畜', state:'在线', protocol:'BLE 5.0', battery:'68-88%', last:'2 分钟前' },
    { id:'DV9', name:'智能称重/保定通道', cat:'D2', model:'AMG-CW2', count:2, where:'冬营盘·保定栏', state:'在线', protocol:'RS485 + 本地网关', battery:'市电', last:'刚刚' },
    { id:'DV10', name:'巡检无人机（热成像）', cat:'D3', model:'DJI Mavic 3T', count:2, where:'全草场', state:'在线', protocol:'RTK · 4G 图传', battery:'待机', last:'1 小时前' },
    { id:'DV11', name:'四足巡检机器人', cat:'D3', model:'宇树 Unitree Go2', count:1, where:'冬营盘圈舍', state:'在线', protocol:'Wi-Fi/5G · 视觉导航', battery:'78%', last:'3 分钟前' },
    { id:'DV12', name:'智能投料机器人', cat:'D3', model:'AMG-FR2', count:3, where:'育肥棚', state:'在线', protocol:'4G · 自主导航', battery:'82%', last:'刚刚' },
    { id:'DV13', name:'自动清粪机器人', cat:'D3', model:'AMG-CL1', count:2, where:'牛舍·羊圈', state:'检修', protocol:'磁条导航', battery:'—', last:'1 天前' },
    { id:'DV14', name:'拖拉机', cat:'D4', model:'东方红 LX904', count:2, where:'机库', state:'在线', protocol:'北斗作业监测', battery:'柴油', last:'今天' },
    { id:'DV15', name:'打草机（割草压扁）', cat:'D4', model:'库恩 GMD 系列', count:3, where:'打草场', state:'在线', protocol:'ISOBUS', battery:'柴油', last:'昨天' },
    { id:'DV16', name:'搂草机', cat:'D4', model:'纽荷兰 158', count:2, where:'打草场', state:'在线', protocol:'—', battery:'柴油', last:'昨天' },
    { id:'DV17', name:'捆草机', cat:'D4', model:'克拉斯 ROLLANT', count:2, where:'打草场', state:'在线', protocol:'ISOBUS', battery:'柴油', last:'昨天' },
    { id:'DV18', name:'青贮收获机', cat:'D4', model:'约翰迪尔 8000', count:1, where:'青贮窖', state:'在线', protocol:'ISOBUS', battery:'柴油', last:'前天' },
    { id:'DV19', name:'TMR 撒料车', cat:'D4', model:'AMG-TMR', count:1, where:'育肥棚', state:'在线', protocol:'车载称重', battery:'柴油', last:'今天' },
    { id:'DV20', name:'移动式挤奶机', cat:'D4', model:'利拉伐', count:2, where:'奶食品工坊', state:'在线', protocol:'计量/制冷', battery:'市电', last:'今天' },
    { id:'DV21', name:'饲料粉碎/混合机', cat:'D4', model:'AMG-FM3', count:1, where:'饲草库', state:'在线', protocol:'—', battery:'市电', last:'今天' },
    { id:'DV22', name:'恒温暖棚（犊/羔）', cat:'D5', model:'AMG-HS4', count:4, where:'冬营盘', state:'在线', protocol:'Modbus 环控', battery:'市电+光热', last:'刚刚' },
    { id:'DV23', name:'防冻智能饮水槽', cat:'D5', model:'AMG-DW8', count:40, where:'各圈舍', state:'在线', protocol:'LoRa · 温控', battery:'市电+备电', last:'刚刚' },
    { id:'DV24', name:'电子围栏（脉冲+北斗）', cat:'D5', model:'AMG-FL6', count:12, where:'6 块放牧场', state:'在线', protocol:'4G · 脉冲', battery:'太阳能', last:'8 分钟前' },
    { id:'DV25', name:'圈舍环控（通风/采暖）', cat:'D5', model:'AMG-HV5', count:8, where:'各棚圈', state:'在线', protocol:'Modbus', battery:'市电', last:'刚刚' },
    { id:'DV26', name:'刮粪板/清粪系统', cat:'D5', model:'AMG-SC2', count:6, where:'牛舍', state:'在线', protocol:'PLC 定时', battery:'市电', last:'刚刚' },
    { id:'DV27', name:'LoRa 网关基站', cat:'D6', model:'AMG-GW1', count:5, where:'草场中继', state:'在线', protocol:'LoRaWAN · 4G 回传', battery:'市电+备电', last:'刚刚' },
    { id:'DV28', name:'4G/5G 路由器', cat:'D6', model:'华为 5G CPE', count:6, where:'营盘·工坊', state:'在线', protocol:'TCP/IP', battery:'市电', last:'刚刚' },
    { id:'DV29', name:'北斗短报文终端', cat:'D6', model:'AMG-BD9', count:8, where:'偏远草场', state:'在线', protocol:'北斗短报文', battery:'太阳能', last:'5 分钟前' },
    { id:'DV30', name:'风光互补供电', cat:'D6', model:'AMG-PV5', count:10, where:'偏远营盘', state:'在线', protocol:'MPPT 控制器', battery:'蓄电 78%', last:'刚刚' },
    { id:'DV31', name:'柴油应急发电', cat:'D6', model:'潍柴 30kW', count:2, where:'机库', state:'在线', protocol:'—', battery:'柴油', last:'今天' }
  ],

  /* ---------- 产品 ---------- */
  productInventory: [
    { id:'P1', name:'冷鲜牛羊肉', unit:'吨', stock:2.8, price:'¥68/kg', note:'冷链 0-4℃ · 订单式分割' },
    { id:'P2', name:'奶豆腐/奶皮子', unit:'盒', stock:120, price:'¥38/盒', note:'传统工艺 · 冷链' },
    { id:'P3', name:'手工奶酪', unit:'袋', stock:200, price:'¥28/袋', note:'合作社品牌' },
    { id:'P4', name:'羊毛毡/羊绒制品', unit:'件', stock:60, price:'¥188/件', note:'冬季手作' },
    { id:'P5', name:'驼绒被/围巾', unit:'件', stock:40, price:'¥680/件', note:'高端礼盒' },
    { id:'P6', name:'草原文创（蒙古包摆件）', unit:'件', stock:300, price:'¥45/件', note:'牧户游伴手礼' }
  ],
  productRecords: [
    { id:'PR1', date:'2026-01-13', type:'入库', product:'冷鲜牛羊肉', qty:1.6, unit:'吨', amount:'—', customer:'屠宰分割' },
    { id:'PR2', date:'2026-01-18', type:'销售', product:'冷鲜牛羊肉', qty:0.8, unit:'吨', amount:'¥54,400', customer:'北京商超订单' },
    { id:'PR3', date:'2026-01-25', type:'销售', product:'奶豆腐/奶皮子', qty:60, unit:'盒', amount:'¥2,280', customer:'游客采购' },
    { id:'PR4', date:'2026-02-06', type:'销售', product:'驼绒围巾', qty:12, unit:'件', amount:'¥8,160', customer:'企业礼单' },
    { id:'PR5', date:'2026-02-10', type:'销售', product:'草原文创', qty:85, unit:'件', amount:'¥3,825', customer:'牧户游商店' }
  ],

  /* ---------- 文旅牧游 ---------- */
  tourism: {
    products: [
      { id:'TP1', icon:'⛺', name:'蒙古包住宿 · 暖冬版', desc:'地暖蒙古包 · 独立卫浴 · 星空天窗', price:'¥680/晚', season:'全年' },
      { id:'TP2', icon:'🐎', name:'草原骑马体验', desc:'三河马骑乘 · 牧民向导 · 保险齐全', price:'¥180/次', season:'全年' },
      { id:'TP3', icon:'🐫', name:'骆驼骑行 + 雪原穿越', desc:'双峰驼骑行 · 冬季雪原线路', price:'¥260/次', season:'冬季' },
      { id:'TP4', icon:'🥛', name:'传统奶食品工坊', desc:'奶茶 · 奶豆腐 · 黄油制作体验', price:'¥120/人', season:'全年' },
      { id:'TP5', icon:'🔥', name:'篝火晚会 + 蒙古歌舞', desc:'呼麦 · 长调 · 星空篝火', price:'¥98/人', season:'夏秋' },
      { id:'TP6', icon:'🎓', name:'草原研学营（亲子）', desc:'游牧文化 · 生态课堂', price:'¥388/家庭', season:'夏' },
      { id:'TP7', icon:'🛷', name:'冬季那达慕 · 雪地嘉年华', desc:'雪地赛马 · 骆驼爬犁', price:'¥228/人', season:'冬季' },
      { id:'TP8', icon:'🌌', name:'草原星空摄影', desc:'暗夜拍摄点 · 器材租借', price:'¥88/人', season:'全年' }
    ],
    orders: [
      { id:'TO-001', item:'蒙古包住宿 ×2', guest:'王先生 · 北京', date:'2/16 入住', amount:'¥1,360', status:'待接待' },
      { id:'TO-002', item:'草原骑马 ×4 + 奶食工坊 ×2', guest:'李女士 · 上海', date:'2/16 14:00', amount:'¥960', status:'已确认' },
      { id:'TO-003', item:'冬季那达慕 ×6', guest:'家庭团 · 广州', date:'2/17', amount:'¥1,368', status:'已付款' },
      { id:'TO-004', item:'骆驼雪原穿越 ×2', guest:'张先生 · 深圳', date:'2/17 10:00', amount:'¥520', status:'已确认' },
      { id:'TO-005', item:'研学营 ×2 家庭', guest:'亲子团 · 杭州', date:'2/18', amount:'¥776', status:'待付款' }
    ],
    yurts: [
      { name:'暖冬蒙古包 A 区', count:6, fac:'地暖 · 独立卫浴 · Wi-Fi', status:'营业中' },
      { name:'家庭星空包 B 区', count:4, fac:'天窗 · 火墙 · 榻榻米', status:'营业中' },
      { name:'游牧体验毡房', count:3, fac:'传统毡房 · 火炉 · 手作', status:'冬季关闭' }
    ],
    safety:'游客意外险全覆盖 · 持证向导 8 名 · 雪地救援车 2 台 · 距镇卫生院 18km 急救联动'
  },

  /* ---------- 呼伦贝尔特色 ---------- */
  hulunbuir: {
    features: [
      { icon:'🏇', name:'那达慕大会', desc:'赛马 · 摔跤 · 射箭，草原三大竞技' },
      { icon:'⛰️', name:'敖包祭祀', desc:'祈福风调雨顺 · 人畜兴旺' },
      { icon:'🐎', name:'三河马文化', desc:'中国名马 · 骑乘研学' },
      { icon:'🐫', name:'双峰驼文化', desc:'冬季驼队 · 雪原运输体验' },
      { icon:'🥛', name:'奶食品文化', desc:'奶茶 · 奶豆腐 · 黄油 · 奶皮子' },
      { icon:'⛺', name:'蒙古包营造技艺', desc:'传统毡房搭建 · 非遗体验' },
      { icon:'🎤', name:'呼麦与长调', desc:'草原天籁 · 篝火晚会' },
      { icon:'❄️', name:'冰雪那达慕', desc:'雪地赛马 · 冰上阿日嘎' }
    ],
    events: [
      { id:'EV1', date:'3 月中旬', name:'巴尔虎接羔节', place:'春营盘', type:'民俗活动', status:'计划', note:'春季接羔体验' },
      { id:'EV2', date:'5 月下旬', name:'草原那达慕（旗级）', place:'呼和诺尔', type:'那达慕', status:'计划', note:'赛马/摔跤/射箭' },
      { id:'EV3', date:'7 月中旬', name:'家庭牧场那达慕', place:'夏营盘', type:'那达慕', status:'筹备', note:'游客互动竞技' },
      { id:'EV4', date:'8 月', name:'敖包祭祀', place:'夏营盘敖包', type:'祭祀', status:'筹备', note:'祈福仪式' },
      { id:'EV5', date:'11 月下旬', name:'冰雪那达慕', place:'冬营盘', type:'冰雪', status:'计划', note:'雪地赛马·驼拉爬犁' },
      { id:'EV6', date:'12 月', name:'冬季马文化节', place:'冬营盘', type:'冰雪', status:'计划', note:'马匹评比·骑乘' }
    ],
    migration: [
      { id:'MG1', season:'春转场', route:'冬营盘 → 春营盘', distance:'18 km', time:'5 月上旬', status:'待执行', note:'避开返青脆弱期' },
      { id:'MG2', season:'夏转场', route:'春营盘 → 夏营盘', distance:'26 km', time:'6 月上旬', status:'待执行', note:'沿饮水线路转场' },
      { id:'MG3', season:'秋转场', route:'夏营盘 → 秋营盘', distance:'22 km', time:'9 月上旬', status:'计划', note:'配合秋季防疫' },
      { id:'MG4', season:'冬转场', route:'秋营盘 → 冬营盘', distance:'30 km', time:'11 月上旬', status:'已完成', note:'冬前完成防寒加固' }
    ],
    eco: [
      { icon:'❄️', name:'白灾（雪灾）预警', desc:'气象 + 积雪监测联动 · 提前 72h 预警', level:'已接入' },
      { icon:'🔥', name:'草原防火', desc:'热成像 AI + 无人机巡护 · 防火期值守', level:'已接入' },
      { icon:'🐀', name:'草原鼠害防治', desc:'生态灭鼠 · 生物防控 · 无人机监测', level:'已接入' },
      { icon:'🦌', name:'野生动物保护', desc:'黄羊/丹顶鹤栖息地监测 · 围栏通道', level:'已接入' }
    ]
  },

  /* ---------- 牧事日志 ---------- */
  logs: [
    { id:'LG1', date:'2026-02-16', weather:'晴 -22℃', done:'晨巡圈 3 处 · 饮水槽 07 号加热检修 · 产羔暖棚加料', plan:'下午配种 AN-10234 · 检查 5 只待产母羊', note:'今夜寒潮，注意暖棚保温', checked:true },
    { id:'LG2', date:'2026-02-15', weather:'多云 -19℃', done:'电子围栏 3 号站离线排查 · 牛羊转冬营盘西区', plan:'预约旗疫控中心春季疫苗', note:'', checked:true },
    { id:'LG3', date:'2026-02-14', weather:'小雪 -24℃', done:'接羔 12 只 · 初乳饲喂 · 圈舍消毒', plan:'统计双羔率', note:'双羔率 8%', checked:true }
  ],
  /* ---------- 兽药使用与休药期 ---------- */
  medicines: [
    { id:'MD1', date:'2026-02-10', species:'羊', group:'育肥羊 60 只', drug:'伊维菌素（驱虫）', withdrawal:21, operator:'满都拉', note:'出栏前 21 天停药' },
    { id:'MD2', date:'2026-02-06', species:'牛', group:'犊牛 2 头', drug:'青霉素（肺炎治疗）', withdrawal:14, operator:'满都拉', note:'疗程 3 天' },
    { id:'MD3', date:'2026-01-28', species:'羊', group:'羔羊 5 只', drug:'土霉素（腹泻）', withdrawal:28, operator:'巴特尔', note:'已停药观察' }
  ],
  /* ---------- 经营账本 ---------- */
  ledger: [
    { id:'LD1', date:'2026-02-16', type:'收入', category:'牧游', item:'冬季那达慕门票', amount:1368, note:'' },
    { id:'LD2', date:'2026-02-15', type:'收入', category:'产品', item:'驼绒围巾礼单', amount:8160, note:'企业礼单' },
    { id:'LD3', date:'2026-02-10', type:'支出', category:'饲草', item:'精饲料采购', amount:8000, note:'育肥期' },
    { id:'LD4', date:'2026-02-08', type:'收入', category:'产品', item:'冷鲜牛羊肉', amount:54400, note:'北京商超' },
    { id:'LD5', date:'2026-02-05', type:'支出', category:'设备', item:'电子围栏维修', amount:1200, note:'' },
    { id:'LD6', date:'2026-02-02', type:'支出', category:'防疫', item:'春季疫苗采购', amount:4500, note:'' }
  ],
  marketPrice: [
    { species:'牛', unit:'活重', price:'26-32 元/kg', note:'三河牛' },
    { species:'羊', unit:'活重', price:'28-34 元/kg', note:'呼伦贝尔羊' },
    { species:'马', unit:'匹', price:'8,000-15,000 元/匹', note:'三河马' },
    { species:'骆驼', unit:'峰', price:'12,000-18,000 元/峰', note:'双峰驼' }
  ],
  subsidies: [
    { icon:'🌾', name:'草畜平衡奖励', desc:'旗里按亩发放 · 预计 12,000 元/年', status:'待申报' },
    { icon:'🐄', name:'基础母牛扩群补贴', desc:'见犊补母 · 每头 800 元', status:'可申报' },
    { icon:'📡', name:'智慧牧场项目补助', desc:'市里肉牛肉羊智慧牧场项目', status:'申报中' },
    { icon:'🛡️', name:'政策性牲畜保险', desc:'冻死/狼害/疫病可理赔 · 保费财政补贴 80%', status:'已投保' }
  ],

  /* ---------- 用工管理 ---------- */
  workers: [
    { id:'WK1', name:'满都拉', role:'兽医 · 接羔技术', phone:'138****1201', wage:'6,000', wageType:'月薪', status:'在岗', schedule:'常住牧场', note:'国家执业兽医' },
    { id:'WK2', name:'乌云', role:'挤奶工', phone:'139****4522', wage:'4,500', wageType:'月薪', status:'在岗', schedule:'每日早晚', note:'' },
    { id:'WK3', name:'赛音', role:'放牧工', phone:'137****8823', wage:'260', wageType:'日结', status:'在岗', schedule:'接羔季临时', note:'2-4 月' },
    { id:'WK4', name:'娜仁', role:'牧户游服务员', phone:'150****2234', wage:'3,800', wageType:'月薪', status:'休假', schedule:'旺季在岗', note:'5-10 月' }
  ],
  attendance: [
    { id:'AT1', date:'2026-02-16', worker:'满都拉', task:'接羔 + 防疫巡检', hours:8, pay:200, note:'' },
    { id:'AT2', date:'2026-02-15', worker:'赛音', task:'冬营盘放牧', hours:9, pay:260, note:'' },
    { id:'AT3', date:'2026-02-14', worker:'乌云', task:'挤奶 + 奶食工坊', hours:6, pay:180, note:'' }
  ],
  /* ---------- 保险理赔 ---------- */
  insurances: [
    { id:'IN1', date:'2026-01-22', species:'羊', head:3, reason:'冻死（白灾）', est:'¥2,400', status:'理赔中', note:'已拍照 · 无害化处理单已交' },
    { id:'IN2', date:'2026-02-05', species:'牛', head:1, reason:'疫病（疑似肺炎）', est:'¥8,000', status:'已报案', note:'等保险员现场核验' },
    { id:'IN3', date:'2025-11-18', species:'羊', head:2, reason:'狼害', est:'¥1,800', status:'已赔付', note:'已到账' }
  ],
  /* ---------- 防狼防盗 ---------- */
  safety: {
    events: [
      { id:'SF1', time:'2026-02-16 03:12', type:'狼害预警', location:'冬营盘 · 西区', level:'高', status:'已处置', note:'AI 识别 2 个目标 · 声光驱离 + 犬群出动' },
      { id:'SF2', time:'2026-02-13 22:40', type:'围栏告警', location:'电子围栏 3 号', level:'中', status:'处置中', note:'脉冲触发 · 已派巡检' },
      { id:'SF3', time:'2026-02-08 01:05', type:'异常闯入', location:'饲草库', level:'中', status:'已处置', note:'夜视监控发现 · 现场无异常' }
    ],
    measures: [
      { icon:'⚡', name:'电子围栏脉冲', desc:'6 块放牧场 12 套 · 越界即告警' },
      { icon:'🎥', name:'AI 狼影识别', desc:'夜间红外识别狼/犬目标 · 秒级预警' },
      { icon:'🚁', name:'无人机夜巡', desc:'凌晨自动巡场 · 热成像搜救' },
      { icon:'🐕', name:'牧羊犬群', desc:'6 只蒙古獒 · 声光+犬群联动驱离' },
      { icon:'📱', name:'手机推送', desc:'异常事件 30 秒内推送场主手机' }
    ]
  },
  /* ---------- 牧场相册（每日一照） ---------- */
  photos: [
    { id:'PH1', date:'2026-01-28', title:'冬营盘 · 深冬牧归', url:'assets/photos/ranch-winter.jpg', note:'寒潮前的羊群' },
    { id:'PH2', date:'2026-07-05', title:'夏营盘 · 草场', url:'assets/photos/grassland-summer.jpg', note:'盛草期 · NDVI 0.79' },
    { id:'PH3', date:'2026-07-20', title:'打草场 · 第一茬', url:'assets/photos/grassland-hay.jpg', note:'留茬 6cm' },
    { id:'PH4', date:'2026-08-02', title:'畜群 · 夏季转场', url:'assets/photos/ranch-herd.jpg', note:'沿饮水线路转场' }
  ],
  /* ---------- 转场成本 ---------- */
  migrationCosts: [
    { id:'MC1', date:'2025-05-06', route:'冬营盘→春营盘', item:'油料（车+摩托）', amount:650, note:'' },
    { id:'MC2', date:'2025-05-07', route:'冬营盘→春营盘', item:'路上饲草', amount:420, note:'' },
    { id:'MC3', date:'2025-11-02', route:'秋营盘→冬营盘', item:'油料 + 车马费', amount:980, note:'请车 2 台' }
  ],

  /* ---------- 政务对接（防疫/检疫/屠宰/溯源） ---------- */
  gov: {
    systems: [
      { id:'GV1', name:'动物检疫电子出证（牧运通）', scope:'检疫申报 · 合格出证', method:'API 对接', status:'已对接', freq:'实时', endpoint:'POST https://jydz.gov-api.cn/v1/quarantine/apply', note:'出栏检疫合格证明自动同步' },
      { id:'GV2', name:'动物疫病防控直报系统', scope:'疫病报告 · 免疫档案', method:'API 对接', status:'已对接', freq:'实时', endpoint:'POST https://yqfk.gov-api.cn/v1/yqb/report', note:'免疫记录 / 消毒台账自动上报' },
      { id:'GV3', name:'定点屠宰监管平台', scope:'屠宰批次 · 肉品品质检验', method:'API 对接', status:'已对接', freq:'批次实时', endpoint:'POST https://tzjg.gov-api.cn/v1/slaughter/batch', note:'屠宰记录 + 产品溯源同步' },
      { id:'GV4', name:'畜禽标识溯源系统', scope:'耳标备案 · 一畜一码', method:'API 对接', status:'已对接', freq:'实时', endpoint:'POST https://suyuan.gov-api.cn/v1/ear-tag/sync', note:'耳标发放 / 佩戴 / 更换同步' },
      { id:'GV5', name:'兽药/饲料投入品监管', scope:'投入品出入库台账', method:'文件交换', status:'对接中', freq:'每周', endpoint:'FTP/政务邮箱报送', note:'兽药、饲料、疫苗台账报送' },
      { id:'GV6', name:'政务数据共享交换平台', scope:'共享目录 · 跨部门数据', method:'数据共享', status:'待申请', freq:'—', endpoint:'政务外网目录挂接', note:'向旗政数局申请共享目录' }
    ],
    reports: [
      { id:'GR1', time:'2026-02-16 09:32', target:'动物疫病防控直报系统', type:'免疫记录上报', biz:'秋季口蹄疫 A 型 · 6,430 头份', code:'YB20260216001', status:'成功', cost:'0.8s' },
      { id:'GR2', time:'2026-02-15 15:10', target:'动物检疫电子出证', type:'检疫出证', biz:'出栏牛 6 头 · 检疫合格', code:'QZ20260215018', status:'成功', cost:'1.2s' },
      { id:'GR3', time:'2026-02-14 11:05', target:'定点屠宰监管平台', type:'屠宰批次上报', biz:'批次 SL2026021401 · 羊肉 1.1 吨', code:'TZ20260214021', status:'成功', cost:'0.9s' },
      { id:'GR4', time:'2026-02-13 16:40', target:'畜禽标识溯源系统', type:'耳标备案同步', biz:'新增耳标 1,200 枚', code:'EB20260213009', status:'成功', cost:'0.6s' }
    ]
  },

  /* ---------- IoT 实时数据采集（智能硬件自动上报） ---------- */
  iot: {
    enabled: true,
    interval: 5000,
    lastSync: '',
    sources: [
      { metric:'天气温度 / 风速 / 降雪', device:'草原气象站 ×3', protocol:'LoRa → 4G 回传', freq:'1 分钟' },
      { metric:'圈舍温湿度 / 氨气', device:'环控传感器 ×8', protocol:'Modbus / PLC', freq:'10 秒' },
      { metric:'牲畜体温 / 活动量 / 发情', device:'体温耳标 ×420 + GPS/北斗项圈 ×656', protocol:'BLE / LoRa / 北斗', freq:'5 分钟' },
      { metric:'电子耳标在线 / 盘点', device:'RFID 读写通道 ×6', protocol:'UHF RFID 920M', freq:'实时' },
      { metric:'视频 AI 识别（发情/分娩/明火/入侵）', device:'AI 摄像机 ×42', protocol:'ONVIF / RTSP + AI 算法', freq:'实时' },
      { metric:'草场 NDVI / 牧草高度', device:'卫星遥感 + 无人机巡场', protocol:'API 接入', freq:'周更' },
      { metric:'饲草库存 / 地磅称重', device:'称重传感器 + 地磅', protocol:'RS485', freq:'出入库实时' },
      { metric:'设备在线率 / 电量 / 信号', device:'LoRa 网关 ×5 + 终端自检', protocol:'LoRaWAN / TCP/IP', freq:'实时' },
      { metric:'游客人数 / 订单', device:'小程序 + 门禁闸机', protocol:'API', freq:'实时' }
    ]
  },

  /* ---------- 畜牧业智能体 ---------- */
  agent: {
    quick: ['今天牧场整体情况怎么样？','现在存栏多少牲畜？','饲草储备够不够过冬？','有哪些预警要处理？','设备在线率怎么样？','口蹄疫怎么防？','最近有什么民俗活动？','该不该转场了？']
  },

  /* ---------- 四季循环 ---------- */
  months: [
    { m:1, season:'冬', name:'冬营盘', tasks:['冬营盘放牧 + 深冬补饲','接羔准备 · 暖棚检修','冬季那达慕 · 牧户游旺季'] },
    { m:2, season:'冬', name:'冬营盘', tasks:['接羔季启动（羔羊 2,860 只）','春节牧游 + 冷鲜肉销售','出栏前检疫'] },
    { m:3, season:'春', name:'春营盘', tasks:['接羔高峰 · 初乳管理','春季防疫（口蹄疫/羊三联四防）','春营盘返青休牧'] },
    { m:4, season:'春', name:'春营盘', tasks:['剪羊毛','草场补播改良','草原防火 · 转场准备'] },
    { m:5, season:'夏', name:'夏营盘', tasks:['转场夏营盘','夏季轮牧启动','牧户游开季 · 研学营'] },
    { m:6, season:'夏', name:'夏营盘', tasks:['夏季分区轮牧','打草场监测','奶食品加工旺季'] },
    { m:7, season:'夏', name:'夏营盘', tasks:['第一茬打草','夏季那达慕 · 篝火晚会','游客高峰接待'] },
    { m:8, season:'夏', name:'夏营盘', tasks:['第二茬打草','青贮制作','育肥牛精料增补'] },
    { m:9, season:'秋', name:'秋营盘', tasks:['转场秋营盘','秋季防疫（口蹄疫/小反刍）','出栏计划启动'] },
    { m:10, season:'秋', name:'秋营盘', tasks:['出栏屠宰高峰','产品加工入库','饲草储备入库核验'] },
    { m:11, season:'冬', name:'冬营盘', tasks:['转场冬营盘','屠宰收尾 · 冷库备货','冬储核验 · 设备防寒'] },
    { m:12, season:'冬', name:'冬营盘', tasks:['年终盘点','冰雪那达慕 · 冬季牧游','围栏/暖棚检修'] }
  ],
  seasons: [
    { key:'春', months:'3-5月', name:'春营盘', color:'#7fb069', area:4600, focus:'接羔 · 防疫 · 返青休牧' },
    { key:'夏', months:'6-8月', name:'夏营盘', color:'#3f8f4f', area:6800, focus:'轮牧 · 打草 · 旅游旺季' },
    { key:'秋', months:'9-10月', name:'秋营盘', color:'#c8925a', area:5400, focus:'防疫 · 出栏 · 饲草储备' },
    { key:'冬', months:'11-2月', name:'冬营盘', color:'#5b7fa6', area:5200, focus:'接羔 · 补饲 · 冰雪牧游' }
  ],
  tasks: [
    { icon:'🥶', text:'寒潮蓝色预警：明晨最低 -31℃，暖棚加温至 26℃', time:'10:00', level:'高' },
    { icon:'🚑', text:'牛 AN-10234 号发情确认，安排 14:00 配种', time:'09:30', level:'中' },
    { icon:'🧾', text:'冬季饲草入库核验：干草 420/500 吨', time:'08:40', level:'中' },
    { icon:'🎫', text:'牧户游 2/17 团接待准备：驼队 + 雪地车检查', time:'08:10', level:'低' },
    { icon:'🔧', text:'周界电子哨兵 4 套离线，巡检工单已派发', time:'10:26', level:'高' }
  ]
};

/* ============ 持久化与通用 CRUD（支持 a.b 路径） ============ */
const KEY = 'aimuge-ranch-v3.1';
let DB = loadDB();

function loadDB(){
  try { const raw = localStorage.getItem(KEY); if (raw){ const d = JSON.parse(raw); if (d && d.meta) return d; } } catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}
function saveDB(){ try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e){} }
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
  const devOnline = DB.deviceList.filter(x=>x.state==='在线').reduce((s,x)=>s+x.count,0);
  const devOffline = devTotal - devOnline;
  const devRate = devTotal ? +(devOnline/devTotal*100).toFixed(1) : 0;
  const earTags = DB.deviceList.filter(x=>/耳标/.test(x.name)).reduce((s,x)=>s+x.count,0);
  const kit = devTotal - earTags;
  return { totalAnimals, sheepUnits, foragePct, saleAmount,
    devTotal, devOnline, devOffline, devRate, earTags, kit,
    todayOrders: DB.tourism.orders.length,
    slHead: DB.slaughterRecords.reduce((a,r)=>a+r.head,0) };
}
function currentMonth(){ return new Date().getMonth()+1; }
function currentSeason(){ const m=currentMonth(); if(m>=3&&m<=5)return '春'; if(m>=6&&m<=8)return '夏'; if(m>=9&&m<=10)return '秋'; return '冬'; }
