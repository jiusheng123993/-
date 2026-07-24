"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/index/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Index; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var _stores_petStore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../stores/petStore */ "./src/stores/petStore.ts");
/* harmony import */ var _services_namingService__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../services/namingService */ "./src/services/namingService.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../config */ "./src/config/index.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");
















function calcAge(birthDate) {
  if (!birthDate) return '';
  var birth = new Date(birthDate);
  var now = new Date();
  var years = now.getFullYear() - birth.getFullYear();
  var months = now.getMonth() - birth.getMonth();
  var totalMonths = years * 12 + months;
  if (totalMonths < 12) return "".concat(totalMonths, "\u6708");
  var ageYears = Math.floor(totalMonths / 12);
  var remainingMonths = totalMonths % 12;
  if (remainingMonths === 0) return "".concat(ageYears, "\u5C81");
  return "".concat(ageYears, "\u5C81").concat(remainingMonths, "\u6708");
}

// 从真实宠物数据获取信息，而非硬编码
function usePetInfo() {
  var _ref;
  var pet = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_3__.usePetStore)(function (s) {
    return s.currentPet;
  });
  var pets = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_3__.usePetStore)(function (s) {
    return s.pets;
  });
  var activePet = (_ref = pet !== null && pet !== void 0 ? pet : pets[0]) !== null && _ref !== void 0 ? _ref : null;
  return {
    name: (activePet === null || activePet === void 0 ? void 0 : activePet.name) || '',
    emoji: (activePet === null || activePet === void 0 ? void 0 : activePet.species) === 'cat' ? '🐱' : (activePet === null || activePet === void 0 ? void 0 : activePet.species) === 'dog' ? '🐕' : '🐾',
    breed: (activePet === null || activePet === void 0 ? void 0 : activePet.breed) || '',
    age: activePet !== null && activePet !== void 0 && activePet.birthDate ? calcAge(activePet.birthDate) : '',
    hasPet: pets.length > 0,
    activePet: activePet
  };
}
var CHECKIN_ITEMS = [{
  key: 'stool',
  emoji: '💩',
  label: '大便情况',
  question: '{name}今天的大便怎么样？',
  options: [{
    label: '成型正常',
    score: 5
  }, {
    label: '偏软但不稀',
    score: 3
  }, {
    label: '拉稀/软便',
    score: 1
  }, {
    label: '没拉 / 未观察',
    score: 0
  }]
}, {
  key: 'pee',
  emoji: '💧',
  label: '小便情况',
  question: '小便颜色和频率正常吗？',
  options: [{
    label: '清亮，次数正常',
    score: 5
  }, {
    label: '颜色偏黄',
    score: 3
  }, {
    label: '频次异常',
    score: 1
  }, {
    label: '没注意',
    score: 0
  }]
}, {
  key: 'appetite',
  emoji: '🍖',
  label: '食欲状况',
  question: '{name}今天吃饭怎么样？',
  options: [{
    label: '胃口很好，光盘',
    score: 5
  }, {
    label: '正常吃完',
    score: 4
  }, {
    label: '吃得比较少',
    score: 2
  }, {
    label: '完全不吃',
    score: 1
  }]
}, {
  key: 'energy',
  emoji: '⚡',
  label: '精神活力',
  question: '{name}今天精神头怎么样？',
  options: [{
    label: '活力满满，拆家选手',
    score: 5
  }, {
    label: '正常活动',
    score: 4
  }, {
    label: '有点蔫，不太想动',
    score: 2
  }, {
    label: '趴着不动，精神差',
    score: 1
  }]
}, {
  key: 'weight',
  emoji: '⚖',
  label: '体重确认',
  question: '体重今天称了吗？（参考：上周28.0kg）',
  options: [{
    label: '28.0kg 左右，稳定',
    score: 5
  }, {
    label: '27.5-27.9kg，小幅下降',
    score: 3
  }, {
    label: '28.5kg 以上，小幅上升',
    score: 3
  }, {
    label: '今天没称',
    score: 0
  }]
}];
var FOOD_DATA = {
  '巧克力': {
    safe: false,
    risk: 'P0',
    icon: '🍫',
    desc: '巧克力含有可可碱，对狗有剧毒。即使少量也可能导致呕吐、腹泻、心率异常，严重可致死。',
    advice: '绝对禁止！如果误食请立即联系兽医。'
  },
  '葡萄': {
    safe: false,
    risk: 'P0',
    icon: '🍇',
    desc: '葡萄和葡萄干对犬类有肾毒性，少量即可导致急性肾衰竭。',
    advice: '绝对禁止！即使是1-2颗也可能造成伤害。'
  },
  '苹果': {
    safe: true,
    risk: 'P4',
    icon: '🍎',
    desc: '苹果果肉富含维生素，但要去核去籽（含氰化物），切成小块每次不超过1/4个。',
    advice: '安全适量，去核切小块作为零食。'
  },
  '鸡胸肉': {
    safe: true,
    risk: 'P4',
    icon: '🍗',
    desc: '煮熟的鸡胸肉是优质蛋白质来源，低脂肪，白水煮熟即可。',
    advice: '安全推荐！煮熟无调味，适量喂食。'
  },
  '胡萝卜': {
    safe: true,
    risk: 'P4',
    icon: '🥕',
    desc: '低热量健康零食，富含β-胡萝卜素和纤维，可生吃磨牙或煮熟。',
    advice: '安全推荐！洗净切小块。'
  },
  '洋葱': {
    safe: false,
    risk: 'P0',
    icon: '🧅',
    desc: '洋葱含硫代硫酸盐，破坏红细胞导致溶血性贫血，生熟都有毒。',
    advice: '绝对禁止！任何形式的洋葱都不能吃。'
  },
  '西瓜': {
    safe: true,
    risk: 'P4',
    icon: '🍉',
    desc: '西瓜果肉是安全的水分补充零食（去籽去皮），夏天适量喂食可补水。',
    advice: '安全适量，去籽去皮。'
  },
  '牛油果': {
    safe: false,
    risk: 'P1',
    icon: '🥑',
    desc: '含有persin对狗可能引起呕吐腹泻，果核有窒息风险。',
    advice: '不推荐！安全起见不要喂。'
  }
};
var SYMPTOM_STEPS = [{
  key: 'symptom',
  title: '第1步：主要症状',
  question: '出现了什么症状？',
  options: ['呕吐 / 反胃', '腹泻 / 软便', '食欲不振', '精神萎靡 / 嗜睡', '皮肤瘙痒 / 掉毛', '咳嗽 / 打喷嚏']
}, {
  key: 'duration',
  title: '第2步：持续时间',
  question: '这个症状持续多久了？',
  options: ['刚开始，不到半天', '今天一整天了', '2-3天了', '超过3天了']
}, {
  key: 'severity',
  title: '第3步：严重程度',
  question: '症状的严重程度如何？',
  options: ['轻微的，不太影响日常', '中等，能看出不舒服', '比较严重，明显异常', '非常严重，需要急救']
}, {
  key: 'other',
  title: '第4步：其他信息',
  question: '还有没有其他异常？',
  options: ['没有其他异常', '体温偏高 / 发烧', '有外伤或肿块', '眼睛/鼻子有分泌物']
}];
var NAMING_STEPS = [{
  key: 'gender',
  question: '新宝贝是男生还是女生呀？',
  options: ['男生 ♂', '女生 ♀', '还不知道 / 无所谓']
}, {
  key: 'style',
  question: '你喜欢什么风格的名字？',
  options: ['古风诗意（如：墨韵、云栖）', '可爱萌系（如：团团、布丁）', '食物系列（如：年糕、汤圆）', '自然元素（如：星河、山月）']
}];
var PLUS_MENU_ITEMS = [{
  icon: '📋',
  label: '健康打卡',
  sub: '5项日常检查，1分钟完成',
  bg: 'rgba(232,168,56,0.12)'
}, {
  icon: '✨',
  label: 'AI 取名',
  sub: '智能推荐 + 寓意解读',
  bg: 'rgba(91,154,155,0.12)'
}, {
  icon: '📸',
  label: '记录回忆',
  sub: '上传照片 + 写一段话',
  bg: 'rgba(140,173,126,0.12)'
}, {
  icon: '🐱',
  label: '品种百科',
  sub: '40+品种特征和护理要点',
  bg: 'rgba(166,143,120,0.12)'
}, {
  icon: '🏠',
  label: '看家庭',
  sub: '家人动态 + 家庭周报',
  bg: 'rgba(224,133,107,0.12)'
}];
var messageIdCounter = 0;
function genId() {
  return "msg_".concat(++messageIdCounter, "_").concat(Date.now());
}
function generateNames(style) {
  if (style.includes('古风')) return [{
    name: '墨韵',
    meaning: '墨香氤氲，韵味悠长。适合气质优雅的宝贝',
    score: 95
  }, {
    name: '云栖',
    meaning: '云深不知处，栖居于心。安静温柔的好名字',
    score: 92
  }, {
    name: '霁月',
    meaning: '雨过天晴，月明如洗。寓意拨云见日，好运连连',
    score: 88
  }];
  if (style.includes('可爱')) return [{
    name: '布丁',
    meaning: '甜甜蜜蜜，软软糯糯。让人忍不住想rua',
    score: 93
  }, {
    name: '泡芙',
    meaning: '外表酥脆内心柔软，可爱又有个性',
    score: 90
  }, {
    name: '奶糖',
    meaning: '奶香四溢，甜而不腻。治愈系首选',
    score: 87
  }];
  if (style.includes('食物')) return [{
    name: '年糕',
    meaning: '年年高升，黏人暖心。适合粘人的小可爱',
    score: 94
  }, {
    name: '汤圆',
    meaning: '团团圆圆，白白胖胖。寓意家庭美满幸福',
    score: 91
  }, {
    name: '麻薯',
    meaning: 'Q弹软糯，外表朴素内有惊喜。独一无二的小特别',
    score: 85
  }];
  return [{
    name: '星河',
    meaning: '璀璨星河，独一无二。愿它成为你生命中最亮的光',
    score: 96
  }, {
    name: '山月',
    meaning: '山间明月，清辉婉转。安静而坚定的陪伴',
    score: 90
  }, {
    name: '朝露',
    meaning: '清晨的露珠，纯净珍贵。每一天都是新的开始',
    score: 87
  }];
}
function parseRecommendResult(text) {
  var results = [];
  var lines = text.split('\n').filter(function (l) {
    return l.trim();
  });
  var _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_7__["default"])(lines),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var line = _step.value;
      var scoreMatch = line.match(/(\d{1,3})\s*分/);
      var nameMatch = line.match(/[「【《]?\s*(.{1,8})\s*[」】》]?[:：\s]+(.+)/);
      if (nameMatch) {
        results.push({
          name: nameMatch[1].replace(/[「」【】《》]/g, '').trim(),
          meaning: nameMatch[2].trim(),
          score: scoreMatch ? parseInt(scoreMatch[1]) : 85
        });
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  if (results.length === 0) {
    var nameRegex = /(\d+)[.、]\s*[「【《]?\s*(.{1,8})\s*[」】》]?\s*[:：\s-]+(.+)/g;
    var match;
    while ((match = nameRegex.exec(text)) !== null) {
      results.push({
        name: match[2].replace(/[「」【】《》]/g, '').trim(),
        meaning: match[3].trim(),
        score: parseInt(match[1]) * 10
      });
    }
  }
  return results.slice(0, 5);
}
function Index() {
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__.useThemeClass)();
  var petInfo = usePetInfo();
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState, 2),
    messages = _useState2[0],
    setMessages = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(''),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState3, 2),
    inputValue = _useState4[0],
    setInputValue = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState5, 2),
    plusMenuOpen = _useState6[0],
    setPlusMenuOpen = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState7, 2),
    isTyping = _useState8[0],
    setIsTyping = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(-1),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState9, 2),
    checkinStep = _useState0[0],
    setCheckinStep = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({}),
    _useState10 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState1, 2),
    checkinData = _useState10[0],
    setCheckinData = _useState10[1];
  var _useState11 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(-1),
    _useState12 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState11, 2),
    symptomStep = _useState12[0],
    setSymptomStep = _useState12[1];
  var _useState13 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({}),
    _useState14 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState13, 2),
    symptomData = _useState14[0],
    setSymptomData = _useState14[1];
  var _useState15 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(-1),
    _useState16 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState15, 2),
    namingStep = _useState16[0],
    setNamingStep = _useState16[1];
  var _useState17 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({}),
    _useState18 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState17, 2),
    namingData = _useState18[0],
    setNamingData = _useState18[1];
  var _useState19 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState20 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState19, 2),
    foodActive = _useState20[0],
    setFoodActive = _useState20[1];
  var _useState21 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true),
    _useState22 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState21, 2),
    showGreetingQuickActions = _useState22[0],
    setShowGreetingQuickActions = _useState22[1];
  var scrollRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
  var scrollToBottom = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function () {
    setTimeout(function () {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 999999;
      }
    }, 100);
  }, []);
  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);
  var addMessage = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (msg) {
    var newMsg = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, msg), {}, {
      id: genId()
    });
    setMessages(function (prev) {
      return [].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_10__["default"])(prev), [newMsg]);
    });
  }, []);
  var addAiMsg = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (content, options) {
    addMessage({
      type: 'ai',
      content: content,
      options: options
    });
  }, [addMessage]);
  var addUserMsg = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (content) {
    addMessage({
      type: 'user',
      content: content
    });
  }, [addMessage]);
  var handleSend = function handleSend() {
    var text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    setPlusMenuOpen(false);
    setShowGreetingQuickActions(false);
    addUserMsg(text);
    setIsTyping(true);
    setTimeout(function () {
      setIsTyping(false);
      if (text.includes('打卡') || text.includes('健康')) {
        startCheckin();
      } else if (text.includes('食物') || text.includes('能不能吃') || text.includes('可以吃')) {
        startFoodCheck();
      } else if (text.includes('症状') || text.includes('不舒服') || text.includes('生病')) {
        startSymptomCheck();
      } else if (text.includes('取名') || text.includes('名字')) {
        startNaming();
      } else if (text.includes('趋势') || text.includes('报告')) {
        addAiMsg('想要查看健康趋势吗？\n\n可以跳转到健康趋势页面查看完整的健康数据图表和历史记录～');
      } else {
        addAiMsg('收到啦！我记下了 ✦\n\n你还可以试试：\n· 💩 打卡记录今天的健康状况\n· 🔍 查询某种食物能不能吃\n· 💊 做一次症状初筛评估\n· ✨ 让我帮新宠物取个好名字');
      }
    }, 800);
  };
  var handleQuickAction = function handleQuickAction(action) {
    setShowGreetingQuickActions(false);
    if (action === 'checkin') startCheckin();else if (action === 'food') startFoodCheck();else if (action === 'symptom') startSymptomCheck();
  };
  var handlePlusMenuItem = function handlePlusMenuItem(index) {
    setPlusMenuOpen(false);
    switch (index) {
      case 0:
        startCheckin();
        break;
      case 1:
        startNaming();
        break;
      case 2:
        addAiMsg('要记录一段回忆吗？在输入框写下这个值得记住的瞬间～');
        break;
      case 3:
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().navigateTo({
          url: '/pagesPet/breed/index'
        });
        break;
      case 4:
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().switchTab({
          url: '/pages/family/index'
        });
        break;
    }
  };
  var startCheckin = function startCheckin() {
    setCheckinData({});
    setCheckinStep(0);
    addAiMsg('好的！让我们来做个快速打卡 ✦\n\n一共5项，大概1分钟完成～我们从第一项开始：');
    setTimeout(function () {
      return askCheckinItem(0);
    }, 600);
  };
  var askCheckinItem = function askCheckinItem(step) {
    setCheckinStep(step);
    if (step >= CHECKIN_ITEMS.length) {
      finishCheckin();
      return;
    }
    var item = CHECKIN_ITEMS[step];
    var progress = "".concat(step + 1, "/5");
    addAiMsg("".concat(item.emoji, " ").concat(progress, " ").concat(item.label, "\n").concat(item.question.replace(/\{name\}/g, petInfo.name)), item.options.map(function (o) {
      return o.label;
    }));
  };
  var selectCheckinOption = function selectCheckinOption(label) {
    var item = CHECKIN_ITEMS[checkinStep];
    var option = item.options.find(function (o) {
      return o.label === label;
    });
    if (!option) return;
    addUserMsg(label);
    setCheckinData(function (prev) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, prev), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_11__["default"])({}, item.key, {
        label: label,
        score: option.score
      }));
    });
    var next = checkinStep + 1;
    setCheckinStep(next);
    setTimeout(function () {
      return askCheckinItem(next);
    }, 400);
  };
  var finishCheckin = function finishCheckin() {
    var entries = Object.entries(checkinData);
    var total = entries.reduce(function (s, _ref2) {
      var _ref3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_ref2, 2),
        v = _ref3[1];
      return s + v.score;
    }, 0);
    var maxScore = entries.length * 5;
    var rate = Math.round(total / maxScore * 100);
    setCheckinStep(-1);
    var stats = entries.map(function (_ref4) {
      var _ref5 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_ref4, 2),
        k = _ref5[0],
        v = _ref5[1];
      var item = CHECKIN_ITEMS.find(function (it) {
        return it.key === k;
      });
      return {
        label: (item === null || item === void 0 ? void 0 : item.label) || k,
        value: v.label,
        emoji: item === null || item === void 0 ? void 0 : item.emoji
      };
    });
    var card = {
      type: 'checkin_result',
      data: {},
      title: '📊 今日健康报告',
      score: rate,
      maxScore: 100,
      stats: stats
    };
    var summary = '打卡完成！健康报告出炉 ✦';
    if (rate >= 90) summary += '\n\n太棒了！状态满分 ✦ 继续保持！';else if (rate >= 70) summary += '\n\n整体还不错！有些项目需要注意一下～';else summary += '\n\n状态不太理想，建议多观察。可以做个症状初筛看看。';
    addMessage({
      type: 'ai',
      content: summary,
      card: card
    });
  };
  var startFoodCheck = function startFoodCheck() {
    setFoodActive(true);
    var foodList = Object.keys(FOOD_DATA);
    addAiMsg('请选择你想查询的食物，我来帮你分析：', foodList);
  };
  var selectFood = function selectFood(foodName) {
    addUserMsg("\u67E5\u4E00\u4E0B\u300C".concat(foodName, "\u300D"));
    setFoodActive(false);
    setIsTyping(true);
    setTimeout(function () {
      setIsTyping(false);
      var d = FOOD_DATA[foodName];
      if (!d) {
        addAiMsg('抱歉，我暂时没有这种食物的数据。');
        return;
      }
      var verdict = d.safe ? '✅ 可以吃（适量）' : '🚫 不能吃';
      var card = {
        type: 'food_result',
        data: {},
        title: '📋 分析结果',
        safe: d.safe,
        risk: d.risk,
        icon: d.icon,
        foodName: foodName,
        desc: d.desc,
        advice: d.advice
      };
      var summary = "".concat(d.icon, " ").concat(foodName, " ").concat(verdict);
      if (d.risk === 'P0') {
        summary += '\n\n🚨 这是高风险食物，请务必远离！';
      }
      addMessage({
        type: 'ai',
        content: summary,
        card: card
      });
    }, 700);
  };
  var startSymptomCheck = function startSymptomCheck() {
    setSymptomData({});
    setSymptomStep(0);
    addAiMsg('了解！让我做一个症状初筛 ✦\n\n⚠ 这是AI预评估，不能替代专业兽医诊断。如果情况紧急请直接就医。\n\n一共4个问题：');
    setTimeout(function () {
      return askSymptomItem(0);
    }, 600);
  };
  var askSymptomItem = function askSymptomItem(step) {
    setSymptomStep(step);
    if (step >= SYMPTOM_STEPS.length) {
      finishSymptomCheck();
      return;
    }
    var s = SYMPTOM_STEPS[step];
    addAiMsg("".concat(s.title, "\n").concat(s.question.replace(/\{name\}/g, petInfo.name)), s.options);
  };
  var selectSymptomOption = function selectSymptomOption(text) {
    var s = SYMPTOM_STEPS[symptomStep];
    addUserMsg(text);
    setSymptomData(function (prev) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, prev), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_11__["default"])({}, s.key, text));
    });
    var next = symptomStep + 1;
    setSymptomStep(next);
    setTimeout(function () {
      return askSymptomItem(next);
    }, 400);
  };
  var finishSymptomCheck = function finishSymptomCheck() {
    setSymptomStep(-1);
    var severity = symptomData.severity || '';
    var riskLevel = 'low';
    var riskLabel = '暂不严重';
    var riskColor = '#8CAD7E';
    var advice = '👍 看起来暂时不严重，继续观察即可。保持正常饮食和作息。';
    if (severity.includes('非常严重')) {
      riskLevel = 'critical';
      riskLabel = '紧急';
      riskColor = '#E04040';
      advice = '🚨 症状紧急！建议立即带它前往最近的宠物医院。不要等待，不要自行用药。';
    } else if (severity.includes('比较严重')) {
      riskLevel = 'high';
      riskLabel = '建议尽快就医';
      riskColor = '#E0856B';
      advice = '⚠ 症状比较明显，建议24小时内去看兽医。暂时保持安静，提供充足的清水。';
    } else if (severity.includes('中等')) {
      riskLevel = 'mid';
      riskLabel = '可先观察';
      riskColor = '#E8A838';
      advice = '⚡ 可以先在家观察1-2天。如果症状加重再考虑就医。';
    }
    var symptomInfo = [{
      label: '主要症状',
      value: symptomData.symptom || '-'
    }, {
      label: '持续时间',
      value: symptomData.duration || '-'
    }, {
      label: '严重程度',
      value: severity || '-'
    }, {
      label: '其他',
      value: symptomData.other || '-'
    }];
    var card = {
      type: 'symptom_result',
      data: {},
      title: '📋 症状评估报告',
      riskLevel: riskLevel,
      risk: riskLabel,
      symptomInfo: symptomInfo,
      advice: advice,
      hospitalList: riskLevel === 'critical' || riskLevel === 'high' ? ['🏥 瑞鹏宠物医院 · 1.2km', '🏥 美联众合 · 2.5km', '🏥 芭比堂 · 3.1km'] : undefined
    };
    var summary = "\u521D\u7B5B\u5B8C\u6210 \u2726\n\n\u98CE\u9669\u7B49\u7EA7\uFF1A".concat(riskLabel);
    addMessage({
      type: 'ai',
      content: summary,
      card: card
    });
  };
  var startNaming = function startNaming() {
    setNamingData({});
    setNamingStep(0);
    addAiMsg('要给新宝贝取名字吗？太开心了！让我来帮你 ✦\n\n请先告诉我一些基本信息～');
    setTimeout(function () {
      return askNamingItem(0);
    }, 500);
  };
  var askNamingItem = function askNamingItem(step) {
    setNamingStep(step);
    if (step >= NAMING_STEPS.length) {
      finishNaming();
      return;
    }
    var s = NAMING_STEPS[step];
    addAiMsg(s.question.replace(/\{name\}/g, petInfo.name), s.options);
  };
  var selectNamingOption = function selectNamingOption(text) {
    var s = NAMING_STEPS[namingStep];
    addUserMsg(text);
    setNamingData(function (prev) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, prev), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_11__["default"])({}, s.key, text));
    });
    var next = namingStep + 1;
    setNamingStep(next);
    setTimeout(function () {
      return askNamingItem(next);
    }, 400);
  };
  var finishNaming = /*#__PURE__*/function () {
    var _ref6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_12__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])().m(function _callee() {
      var style, genderText, names, pet, breed, birthDate, gender, result, parsed, card, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            setNamingStep(-1);
            style = namingData.style || '';
            genderText = namingData.gender || '';
            names = [];
            if (_config__WEBPACK_IMPORTED_MODULE_5__.CONFIG.USE_MOCK) {
              _context.n = 4;
              break;
            }
            _context.p = 1;
            pet = _stores_petStore__WEBPACK_IMPORTED_MODULE_3__.usePetStore.getState().currentPet;
            breed = (pet === null || pet === void 0 ? void 0 : pet.breed) || '未知品种';
            birthDate = (pet === null || pet === void 0 ? void 0 : pet.birthDate) || '';
            gender = genderText.includes('男') ? 'male' : genderText.includes('女') ? 'female' : 'unknown';
            _context.n = 2;
            return (0,_services_namingService__WEBPACK_IMPORTED_MODULE_4__.recommendNames)(breed, birthDate, gender);
          case 2:
            result = _context.v;
            parsed = parseRecommendResult(result);
            if (parsed.length > 0) {
              names = parsed;
            }
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
          case 4:
            if (names.length === 0) {
              names = generateNames(style);
            }
            card = {
              type: 'naming_cards',
              data: {},
              names: names
            };
            addMessage({
              type: 'ai',
              content: '基于你的偏好，我为你推荐以下名字 ✦',
              card: card
            });
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[1, 3]]);
    }));
    return function finishNaming() {
      return _ref6.apply(this, arguments);
    };
  }();
  var getCurrentFlowType = function getCurrentFlowType() {
    if (checkinStep >= 0) return 'checkin';
    if (symptomStep >= 0) return 'symptom';
    if (namingStep >= 0) return 'naming';
    return null;
  };
  var handleOptionClick = function handleOptionClick(option) {
    var flowType = getCurrentFlowType();
    if (flowType === 'checkin') selectCheckinOption(option);else if (flowType === 'symptom') selectSymptomOption(option);else if (flowType === 'naming') selectNamingOption(option);else if (foodActive) selectFood(option);
  };
  var renderMessageContent = function renderMessageContent(msg) {
    return msg.content.split('\n').map(function (line, i) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        children: [line, i < msg.content.split('\n').length - 1 && '\n']
      }, i);
    });
  };
  var renderCard = function renderCard(card) {
    switch (card.type) {
      case 'checkin_result':
        {
          var _card$stats;
          var starCount = card.score !== undefined ? Math.round(card.score / 20) : 0;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-card",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "msg-card-title",
              children: card.title
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "score-stars",
              children: [1, 2, 3, 4, 5].map(function (i) {
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  children: i <= starCount ? '★' : '☆'
                }, i);
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-stat",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-stat-label",
                children: "\u7EFC\u5408\u8BC4\u5206"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-stat-val",
                children: [card.score, " \u5206"]
              })]
            }), (_card$stats = card.stats) === null || _card$stats === void 0 ? void 0 : _card$stats.map(function (stat, si) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-card-stat",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-card-stat-label",
                  children: [stat.emoji || '', " ", stat.label]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-card-stat-val",
                  children: stat.value
                })]
              }, si);
            })]
          });
        }
      case 'food_result':
        {
          var isSafe = card.safe !== false;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-card",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "msg-card-title",
              children: card.title
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "msg-card-text",
              children: card.desc
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-alert ".concat(isSafe ? 'msg-card-alert--safe' : 'msg-card-alert--danger'),
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                children: [isSafe ? '👍 建议：' : '⚠ 建议：', card.advice]
              })
            }), !isSafe && card.risk === 'P0' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-hospital",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-title",
                children: "\uD83C\uDFE5 \u5982\u679C\u8BEF\u98DF\uFF0C\u8BF7\u7ACB\u5373\u5C31\u533B"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-item",
                children: "\uD83C\uDFE5 \u745E\u9E4F\u5BA0\u7269\u533B\u9662 \xB7 1.2km"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-item",
                children: "\uD83C\uDFE5 \u7F8E\u8054\u4F17\u5408 \xB7 2.5km"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-item",
                children: "\uD83C\uDFE5 \u82AD\u6BD4\u5802 \xB7 3.1km"
              })]
            })]
          });
        }
      case 'symptom_result':
        {
          var _card$symptomInfo;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-card",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "msg-card-title",
              children: card.title
            }), (_card$symptomInfo = card.symptomInfo) === null || _card$symptomInfo === void 0 ? void 0 : _card$symptomInfo.map(function (info, si) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-card-stat",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-card-stat-label",
                  children: info.label
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-card-stat-val",
                  children: info.value
                })]
              }, si);
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-alert ".concat(card.riskLevel === 'critical' || card.riskLevel === 'high' ? 'msg-card-alert--danger' : 'msg-card-alert--safe'),
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                children: card.advice
              })
            }), card.hospitalList && card.hospitalList.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-hospital",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-title",
                children: "\uD83C\uDFE5 \u9644\u8FD1\u7684\u5BA0\u7269\u533B\u9662"
              }), card.hospitalList.map(function (h, hi) {
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-card-hospital-item",
                  children: h
                }, hi);
              })]
            })]
          });
        }
      case 'naming_cards':
        {
          var _card$names;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            children: (_card$names = card.names) === null || _card$names === void 0 ? void 0 : _card$names.map(function (n, ni) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-naming-card",
                children: [ni === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "msg-naming-badge",
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    children: "\u63A8\u8350"
                  })
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-naming-name",
                  children: n.name
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "score-stars",
                  style: {
                    marginBottom: '8rpx'
                  },
                  children: [1, 2, 3, 4, 5].map(function (i) {
                    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                      children: i <= Math.round(n.score / 20) ? '★' : '☆'
                    }, i);
                  })
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-naming-meaning",
                  children: n.meaning
                })]
              }, ni);
            })
          });
        }
      default:
        return null;
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
    className: "chat-home-page ".concat(themeClass),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
      className: "chat-paw-particles",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--1",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--2",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--3",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--4",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--5",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--6",
        children: "\uD83D\uDC3E"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
      className: "chat-stars",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--1",
        children: "\u2726"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--2",
        children: "\u2727"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--3",
        children: "\u2726"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--4",
        children: "\u2727"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--5",
        children: "\u2726"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--6",
        children: "\u2727"
      })]
    }), !petInfo.hasPet ?
    /*#__PURE__*/
    /* 空状态：引导用户添加宠物 */
    (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
      className: "chat-empty",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "chat-empty-icon",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-empty-title",
        children: "\u6B22\u8FCE\u6765\u5230\u661F\u5BF0\u6D77"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-empty-desc",
        children: ["\u6DFB\u52A0\u4F60\u7684\u7B2C\u4E00\u4F4D\u5BA0\u7269\u4F19\u4F34\uFF0C", '\n', "\u5F00\u59CB\u8BB0\u5F55\u6E29\u99A8\u7684\u6BCF\u4E00\u5929"]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "chat-empty-btn",
        onClick: function onClick() {
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().navigateTo({
            url: '/pagesPet/add/index'
          });
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "chat-empty-btn-text",
          children: "+ \u6DFB\u52A0\u5BA0\u7269"
        })
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "chat-top-bar",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-top-left",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-pet-avatar",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: petInfo.emoji
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-top-info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "chat-pet-name",
              children: petInfo.name
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "chat-pet-detail",
              children: [petInfo.breed, " \xB7 ", petInfo.age]
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-switch-btn",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
              title: '切换宠物',
              icon: 'none'
            });
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
            children: "\u5207\u6362"
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.ScrollView, {
        className: "chat-msg-list",
        scrollY: true,
        scrollWithAnimation: true,
        ref: scrollRef,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "msg-row ai",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-avatar",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\uD83E\uDD16"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-bubble-wrap",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-bubble",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                children: ["\u65E9\u5B89\u5440\uFF01\u6211\u662F", petInfo.name, "\u7684AI\u5C0F\u52A9\u624B \u2726", '\n\n', petInfo.name, "\u4ECA\u5929\u600E\u4E48\u6837\uFF1F\u6765\u6253\u4E2A\u5361\u5427\uFF5E \u6216\u8005\u544A\u8BC9\u6211\u4F60\u60F3\u4E86\u89E3\u4EC0\u4E48\uFF1F"]
              })
            }), showGreetingQuickActions && checkinStep < 0 && symptomStep < 0 && namingStep < 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-quick-actions",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-quick-btn",
                onClick: function onClick() {
                  return handleQuickAction('checkin');
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  children: "\uD83D\uDCA9 \u6253\u5361"
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-quick-btn",
                onClick: function onClick() {
                  return handleQuickAction('food');
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  children: "\uD83D\uDD0D \u67E5\u98DF\u7269"
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-quick-btn",
                onClick: function onClick() {
                  return handleQuickAction('symptom');
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  children: "\uD83D\uDC8A \u75C7\u72B6\u521D\u7B5B"
                })
              })]
            })]
          })]
        }), messages.map(function (msg, idx) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-row ".concat(msg.type),
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-avatar",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                children: msg.type === 'ai' ? '🤖' : '😊'
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-bubble-wrap",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-bubble",
                children: renderMessageContent(msg)
              }), msg.card && renderCard(msg.card), idx === messages.length - 1 && msg.type === 'ai' && showGreetingQuickActions && checkinStep < 0 && symptomStep < 0 && namingStep < 0 && !foodActive && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-quick-actions",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "msg-quick-btn",
                  onClick: function onClick() {
                    return handleQuickAction('checkin');
                  },
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    children: "\uD83D\uDCA9 \u6253\u5361"
                  })
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "msg-quick-btn",
                  onClick: function onClick() {
                    return handleQuickAction('food');
                  },
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    children: "\uD83D\uDD0D \u67E5\u98DF\u7269"
                  })
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "msg-quick-btn",
                  onClick: function onClick() {
                    return handleQuickAction('symptom');
                  },
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    children: "\uD83D\uDC8A \u75C7\u72B6\u521D\u7B5B"
                  })
                })]
              }), msg.options && msg.options.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-options-list",
                children: msg.options.map(function (opt, oi) {
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                    className: "msg-option",
                    onClick: function onClick() {
                      return handleOptionClick(opt);
                    },
                    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                      children: opt
                    })
                  }, oi);
                })
              })]
            })]
          }, msg.id);
        }), isTyping && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "msg-row ai",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-avatar",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\uD83E\uDD16"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-bubble typing-bubble",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "typing-dots",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "typing-dot"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "typing-dot"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "typing-dot"
              })]
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-bottom-spacer"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "chat-input-area",
        children: [plusMenuOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.Fragment, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-plus-overlay",
            onClick: function onClick() {
              return setPlusMenuOpen(false);
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-plus-menu",
            children: PLUS_MENU_ITEMS.map(function (item, idx) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "plus-menu-item",
                onClick: function onClick() {
                  return handlePlusMenuItem(idx);
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "plus-menu-icon-wrap",
                  style: {
                    background: item.bg
                  },
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    className: "plus-menu-icon",
                    children: item.icon
                  })
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "plus-menu-text",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    className: "plus-menu-label",
                    children: item.label
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    className: "plus-menu-sub",
                    children: item.sub
                  })]
                })]
              }, idx);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-input-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-plus-btn",
            onClick: function onClick() {
              return setPlusMenuOpen(!plusMenuOpen);
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "chat-plus-text",
              children: "+"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
            className: "chat-input-field",
            value: inputValue,
            onInput: function onInput(e) {
              return setInputValue(e.detail.value);
            },
            onConfirm: handleSend,
            onFocus: function onFocus() {
              return setPlusMenuOpen(false);
            },
            placeholder: "\u8BF4\u8BF4".concat(petInfo.name, "\u4ECA\u5929\u7684\u60C5\u51B5..."),
            placeholderStyle: "color: #556",
            confirmType: "send"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-send-btn",
            onClick: handleSend,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "chat-send-text",
              children: "\u2191"
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-input-safe"
        })]
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/index/index.tsx":
/*!***********************************!*\
  !*** ./src/pages/index/index.tsx ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx");


var config = {"navigationBarTitleText":"星寰海","navigationStyle":"custom"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pages/index/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/index/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map