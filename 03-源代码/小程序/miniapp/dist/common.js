(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["common"],{

/***/ "./src/components/PageLoading.tsx":
/*!****************************************!*\
  !*** ./src/components/PageLoading.tsx ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ PageLoading; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");



function PageLoading(_ref) {
  var _ref$text = _ref.text,
    text = _ref$text === void 0 ? '加载中...' : _ref$text;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
    className: "page-loading",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
      className: "page-loading__spinner"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
      className: "page-loading__text",
      children: text
    })]
  });
}

/***/ }),

/***/ "./src/components/PetAvatar.tsx":
/*!**************************************!*\
  !*** ./src/components/PetAvatar.tsx ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ PetAvatar; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _engines_petAvatar__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../engines/petAvatar */ "./src/engines/petAvatar/index.ts");
/* harmony import */ var _engines_petAvatar_outfitRenderer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../engines/petAvatar/outfitRenderer */ "./src/engines/petAvatar/outfitRenderer.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");






function PetAvatar(_ref) {
  var species = _ref.species,
    petName = _ref.petName,
    expressionContext = _ref.expressionContext,
    _ref$size = _ref.size,
    size = _ref$size === void 0 ? 100 : _ref$size,
    _ref$showDiary = _ref.showDiary,
    showDiary = _ref$showDiary === void 0 ? false : _ref$showDiary,
    _ref$showLabel = _ref.showLabel,
    showLabel = _ref$showLabel === void 0 ? false : _ref$showLabel,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? '' : _ref$className,
    customExpression = _ref.customExpression,
    outfitSlots = _ref.outfitSlots;
  var expression = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return customExpression || (0,_engines_petAvatar__WEBPACK_IMPORTED_MODULE_1__.calculateExpression)(expressionContext);
  }, [customExpression, expressionContext]);
  var outfitLayers = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return outfitSlots ? (0,_engines_petAvatar_outfitRenderer__WEBPACK_IMPORTED_MODULE_2__.resolveOutfitLayers)(outfitSlots, species) : [];
  }, [outfitSlots, species]);
  var faceUri = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return (0,_engines_petAvatar__WEBPACK_IMPORTED_MODULE_1__.getPetFaceDataUri)(expression, species, size, outfitLayers);
  }, [expression, species, size, outfitLayers]);
  var diary = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    if (!showDiary) return null;
    return (0,_engines_petAvatar__WEBPACK_IMPORTED_MODULE_1__.generateDiaryForToday)(expressionContext.todayEntry, expressionContext.streakDays, expressionContext.isBirthday, expressionContext.isRecovery);
  }, [showDiary, expressionContext]);
  var animationClass = "pet-avatar__image--".concat(expression.animation);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "pet-avatar ".concat(className),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "pet-avatar__face",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Image, {
        className: "pet-avatar__image ".concat(animationClass),
        src: faceUri,
        mode: "aspectFit",
        style: {
          width: "".concat(size, "px"),
          height: "".concat(size, "px")
        },
        lazyLoad: true
      })
    }), showLabel && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "pet-avatar__label",
      style: {
        backgroundColor: expression.color
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "pet-avatar__label-text",
        children: expression.label
      })
    }), diary && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "pet-avatar__diary",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "pet-avatar__diary-emoji",
        children: diary.emoji
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "pet-avatar__diary-text",
        children: ["\"", diary.text, "\""]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "pet-avatar__diary-author",
        children: ["\u2014\u2014 ", petName]
      })]
    })]
  });
}

/***/ }),

/***/ "./src/config/index.ts":
/*!*****************************!*\
  !*** ./src/config/index.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CONFIG": function() { return /* binding */ CONFIG; }
/* harmony export */ });
var CONFIG = {
  API_BASE_URL: "http://localhost:3000" || 0,
  USE_MOCK: true,
  STORAGE_KEYS: {
    TOKEN: 'xhh_token',
    USER: 'xhh_user',
    REFRESH_TOKEN: 'xhh_refresh_token'
  }
};

/***/ }),

/***/ "./src/constants/wardrobe.ts":
/*!***********************************!*\
  !*** ./src/constants/wardrobe.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ACCESSORY_SLOTS": function() { return /* binding */ ACCESSORY_SLOTS; },
/* harmony export */   "MAX_TRY_ON_HISTORY": function() { return /* binding */ MAX_TRY_ON_HISTORY; },
/* harmony export */   "OUTFIT_SAVE_DEBOUNCE_MS": function() { return /* binding */ OUTFIT_SAVE_DEBOUNCE_MS; },
/* harmony export */   "SLOT_LABELS": function() { return /* binding */ SLOT_LABELS; },
/* harmony export */   "SLOT_Z_INDEX": function() { return /* binding */ SLOT_Z_INDEX; },
/* harmony export */   "THEME_GENERATION_POLL_INTERVAL": function() { return /* binding */ THEME_GENERATION_POLL_INTERVAL; },
/* harmony export */   "THEME_MAX_RETRIES": function() { return /* binding */ THEME_MAX_RETRIES; },
/* harmony export */   "WARDROBE_ERROR_CODES": function() { return /* binding */ WARDROBE_ERROR_CODES; }
/* harmony export */ });
var ACCESSORY_SLOTS = ['head', 'neck', 'back', 'body', 'feet'];
var SLOT_Z_INDEX = {
  feet: 1,
  body: 2,
  back: 3,
  neck: 5,
  head: 10
};
var SLOT_LABELS = {
  head: '头部',
  neck: '颈部',
  back: '背部',
  body: '身体',
  feet: '足部'
};
var WARDROBE_ERROR_CODES = {
  ACCESSORY_NOT_FOUND: 'WARDROBE_001',
  SLOT_MISMATCH: 'WARDROBE_002',
  SPECIES_INCOMPATIBLE: 'WARDROBE_003',
  NOT_OWNED: 'WARDROBE_010',
  MEMBERSHIP_EXPIRED: 'WARDROBE_011',
  LIMITED_EXPIRED: 'WARDROBE_012',
  NO_BASE_AVATAR: 'WARDROBE_020',
  QUOTA_EXCEEDED: 'WARDROBE_021',
  THEME_INACTIVE: 'WARDROBE_022',
  MODERATION_BLOCKED: 'WARDROBE_023',
  PET_NOT_FOUND: 'WARDROBE_030',
  TASK_NOT_FOUND: 'WARDROBE_031',
  TASK_IN_PROGRESS: 'WARDROBE_040',
  RATE_LIMITED: 'WARDROBE_050',
  SYSTEM_ERROR: 'WARDROBE_099'
};
var MAX_TRY_ON_HISTORY = 20;
var THEME_GENERATION_POLL_INTERVAL = 2000;
var THEME_MAX_RETRIES = 2;
var OUTFIT_SAVE_DEBOUNCE_MS = 300;

/***/ }),

/***/ "./src/data/wardrobe/accessories.ts":
/*!******************************************!*\
  !*** ./src/data/wardrobe/accessories.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAccessoriesBySlot": function() { return /* binding */ getAccessoriesBySlot; },
/* harmony export */   "getAccessoryById": function() { return /* binding */ getAccessoryById; }
/* harmony export */ });
/* unused harmony exports ACCESSORIES, getDefaultAccessories */
var CDN_BASE = 'https://cdn.example.com/wardrobe';
var ACCESSORIES = [{
  id: 'hat_bowler',
  name: '礼帽',
  slot: 'head',
  svgPath: 'svgFragments/hat_bowler.svg',
  speciesCompat: [],
  unlockSource: 'default',
  unlockCondition: {},
  sortOrder: 101,
  isActive: true
}, {
  id: 'hat_baseball',
  name: '棒球帽',
  slot: 'head',
  svgPath: 'svgFragments/hat_baseball.svg',
  speciesCompat: [],
  unlockSource: 'default',
  unlockCondition: {},
  sortOrder: 102,
  isActive: true
}, {
  id: 'scarf_red',
  name: '红围巾',
  slot: 'neck',
  svgPath: 'svgFragments/scarf_red.svg',
  speciesCompat: [],
  unlockSource: 'default',
  unlockCondition: {},
  sortOrder: 201,
  isActive: true
}, {
  id: 'bell_small',
  name: '小铃铛',
  slot: 'neck',
  svgPath: 'svgFragments/bell_small.svg',
  speciesCompat: [],
  unlockSource: 'default',
  unlockCondition: {},
  sortOrder: 202,
  isActive: true
}, {
  id: 'backpack_small',
  name: '小背包',
  slot: 'back',
  svgPath: 'svgFragments/backpack_small.svg',
  speciesCompat: [],
  unlockSource: 'default',
  unlockCondition: {},
  sortOrder: 301,
  isActive: true
}, {
  id: 'tshirt_blue',
  name: '蓝T恤',
  slot: 'body',
  svgPath: 'svgFragments/tshirt_blue.svg',
  speciesCompat: [],
  unlockSource: 'default',
  unlockCondition: {},
  sortOrder: 401,
  isActive: true
}, {
  id: 'socks_small',
  name: '小袜子',
  slot: 'feet',
  svgPath: 'svgFragments/socks_small.svg',
  speciesCompat: [],
  unlockSource: 'default',
  unlockCondition: {},
  sortOrder: 501,
  isActive: true
}, {
  id: 'shoes_canvas',
  name: '帆布鞋',
  slot: 'feet',
  svgPath: 'svgFragments/shoes_canvas.svg',
  speciesCompat: [],
  unlockSource: 'default',
  unlockCondition: {},
  sortOrder: 502,
  isActive: true
}, {
  id: 'crown_gold',
  name: '金皇冠',
  slot: 'head',
  svgPath: "".concat(CDN_BASE, "/crown_gold.svg"),
  speciesCompat: [],
  unlockSource: 'achievement',
  unlockCondition: {
    achievementId: 'crown_gold'
  },
  sortOrder: 103,
  isActive: true
}, {
  id: 'bow_ribbon',
  name: '蝴蝶结',
  slot: 'head',
  svgPath: "".concat(CDN_BASE, "/bow_ribbon.svg"),
  speciesCompat: [],
  unlockSource: 'achievement',
  unlockCondition: {
    achievementId: 'bow_ribbon'
  },
  sortOrder: 104,
  isActive: true
}, {
  id: 'medal_star',
  name: '星星勋章',
  slot: 'neck',
  svgPath: "".concat(CDN_BASE, "/medal_star.svg"),
  speciesCompat: [],
  unlockSource: 'achievement',
  unlockCondition: {
    achievementId: 'medal_star'
  },
  sortOrder: 203,
  isActive: true
}, {
  id: 'chain_star',
  name: '星星项链',
  slot: 'neck',
  svgPath: "".concat(CDN_BASE, "/chain_star.svg"),
  speciesCompat: [],
  unlockSource: 'achievement',
  unlockCondition: {
    achievementId: 'chain_star'
  },
  sortOrder: 204,
  isActive: true
}, {
  id: 'wings_butterfly',
  name: '蝴蝶翅膀',
  slot: 'back',
  svgPath: "".concat(CDN_BASE, "/wings_butterfly.svg"),
  speciesCompat: [],
  unlockSource: 'achievement',
  unlockCondition: {
    achievementId: 'wings_butterfly'
  },
  sortOrder: 302,
  isActive: true
}, {
  id: 'balloon_red',
  name: '红气球',
  slot: 'back',
  svgPath: "".concat(CDN_BASE, "/balloon_red.svg"),
  speciesCompat: [],
  unlockSource: 'achievement',
  unlockCondition: {
    achievementId: 'balloon_red'
  },
  sortOrder: 303,
  isActive: true
}, {
  id: 'suit_superhero',
  name: '超级英雄装',
  slot: 'body',
  svgPath: "".concat(CDN_BASE, "/suit_superhero.svg"),
  speciesCompat: [],
  unlockSource: 'achievement',
  unlockCondition: {
    achievementId: 'suit_superhero'
  },
  sortOrder: 402,
  isActive: true
}, {
  id: 'shoes_sport',
  name: '运动鞋',
  slot: 'feet',
  svgPath: "".concat(CDN_BASE, "/shoes_sport.svg"),
  speciesCompat: [],
  unlockSource: 'achievement',
  unlockCondition: {
    achievementId: 'shoes_sport'
  },
  sortOrder: 503,
  isActive: true
}, {
  id: 'hat_christmas',
  name: '圣诞帽',
  slot: 'head',
  svgPath: "".concat(CDN_BASE, "/hat_christmas.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 6
  },
  sortOrder: 105,
  isActive: true
}, {
  id: 'hat_graduation',
  name: '学士帽',
  slot: 'head',
  svgPath: "".concat(CDN_BASE, "/hat_graduation.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 8
  },
  sortOrder: 106,
  isActive: true
}, {
  id: 'hat_lady',
  name: '淑女帽',
  slot: 'head',
  svgPath: "".concat(CDN_BASE, "/hat_lady.svg"),
  speciesCompat: ['cat'],
  unlockSource: 'paid',
  unlockCondition: {
    price: 10
  },
  sortOrder: 107,
  isActive: true
}, {
  id: 'scarf_christmas',
  name: '圣诞围巾',
  slot: 'neck',
  svgPath: "".concat(CDN_BASE, "/scarf_christmas.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 6
  },
  sortOrder: 205,
  isActive: true
}, {
  id: 'bowtie',
  name: '领结',
  slot: 'neck',
  svgPath: "".concat(CDN_BASE, "/bowtie.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 5
  },
  sortOrder: 206,
  isActive: true
}, {
  id: 'necklace_gem',
  name: '宝石项链',
  slot: 'neck',
  svgPath: "".concat(CDN_BASE, "/necklace_gem.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 12
  },
  sortOrder: 207,
  isActive: true
}, {
  id: 'backpack_rocket',
  name: '火箭背包',
  slot: 'back',
  svgPath: "".concat(CDN_BASE, "/backpack_rocket.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 15
  },
  sortOrder: 304,
  isActive: true
}, {
  id: 'guitar_small',
  name: '小吉他',
  slot: 'back',
  svgPath: "".concat(CDN_BASE, "/guitar_small.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 10
  },
  sortOrder: 305,
  isActive: true
}, {
  id: 'wings_angel',
  name: '天使翅膀',
  slot: 'back',
  svgPath: "".concat(CDN_BASE, "/wings_angel.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 18
  },
  sortOrder: 306,
  isActive: true
}, {
  id: 'kimono',
  name: '和服',
  slot: 'body',
  svgPath: "".concat(CDN_BASE, "/kimono.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 20
  },
  sortOrder: 403,
  isActive: true
}, {
  id: 'boots_hiking',
  name: '登山靴',
  slot: 'feet',
  svgPath: "".concat(CDN_BASE, "/boots_hiking.svg"),
  speciesCompat: [],
  unlockSource: 'paid',
  unlockCondition: {
    price: 8
  },
  sortOrder: 504,
  isActive: true
}, {
  id: 'shoes_princess',
  name: '公主鞋',
  slot: 'feet',
  svgPath: "".concat(CDN_BASE, "/shoes_princess.svg"),
  speciesCompat: ['cat'],
  unlockSource: 'paid',
  unlockCondition: {
    price: 12
  },
  sortOrder: 505,
  isActive: true
}, {
  id: 'horn_unicorn',
  name: '独角兽角',
  slot: 'head',
  svgPath: "".concat(CDN_BASE, "/horn_unicorn.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 1
  },
  sortOrder: 108,
  isActive: true
}, {
  id: 'hairpin_sakura',
  name: '樱花发簪',
  slot: 'head',
  svgPath: "".concat(CDN_BASE, "/hairpin_sakura.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 1
  },
  sortOrder: 109,
  isActive: true
}, {
  id: 'hat_pumpkin',
  name: '南瓜帽',
  slot: 'head',
  svgPath: "".concat(CDN_BASE, "/hat_pumpkin.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 2
  },
  sortOrder: 110,
  isActive: true
}, {
  id: 'ribbon_rainbow',
  name: '彩虹缎带',
  slot: 'neck',
  svgPath: "".concat(CDN_BASE, "/ribbon_rainbow.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 1
  },
  sortOrder: 208,
  isActive: true
}, {
  id: 'pendant_moon',
  name: '月亮吊坠',
  slot: 'neck',
  svgPath: "".concat(CDN_BASE, "/pendant_moon.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 2
  },
  sortOrder: 209,
  isActive: true
}, {
  id: 'scarf_snowflake',
  name: '雪花围巾',
  slot: 'neck',
  svgPath: "".concat(CDN_BASE, "/scarf_snowflake.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 1
  },
  sortOrder: 210,
  isActive: true
}, {
  id: 'wings_bat',
  name: '蝙蝠翅膀',
  slot: 'back',
  svgPath: "".concat(CDN_BASE, "/wings_bat.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 2
  },
  sortOrder: 307,
  isActive: true
}, {
  id: 'wings_fairy',
  name: '精灵翅膀',
  slot: 'back',
  svgPath: "".concat(CDN_BASE, "/wings_fairy.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 3
  },
  sortOrder: 308,
  isActive: true
}, {
  id: 'wings_dragon',
  name: '龙翅膀',
  slot: 'back',
  svgPath: "".concat(CDN_BASE, "/wings_dragon.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 3
  },
  sortOrder: 309,
  isActive: true
}, {
  id: 'suit_rainbow',
  name: '彩虹套装',
  slot: 'body',
  svgPath: "".concat(CDN_BASE, "/suit_rainbow.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 2
  },
  sortOrder: 404,
  isActive: true
}, {
  id: 'suit_starry',
  name: '星空套装',
  slot: 'body',
  svgPath: "".concat(CDN_BASE, "/suit_starry.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 3
  },
  sortOrder: 405,
  isActive: true
}, {
  id: 'paws_glow',
  name: '发光爪垫',
  slot: 'feet',
  svgPath: "".concat(CDN_BASE, "/paws_glow.svg"),
  speciesCompat: [],
  unlockSource: 'member',
  unlockCondition: {
    memberLevel: 2
  },
  sortOrder: 506,
  isActive: true
}];
function getAccessoriesBySlot(slot) {
  return ACCESSORIES.filter(function (a) {
    return a.slot === slot;
  });
}
function getDefaultAccessories() {
  return ACCESSORIES.filter(function (a) {
    return a.unlockSource === 'default';
  });
}
function getAccessoryById(id) {
  return ACCESSORIES.find(function (a) {
    return a.id === id;
  });
}

/***/ }),

/***/ "./src/engines/petAvatar/diaryEngine.ts":
/*!**********************************************!*\
  !*** ./src/engines/petAvatar/diaryEngine.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "generateDiaryEntry": function() { return /* binding */ generateDiaryEntry; },
/* harmony export */   "generateDiaryForToday": function() { return /* binding */ generateDiaryForToday; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");

var DIARY_TEMPLATES = {
  all_normal: [{
    text: '今天便便很正常，我很舒服~',
    tone: 'happy',
    emoji: '💩'
  }, {
    text: '今天精神不错，主人陪我玩了好久！',
    tone: 'happy',
    emoji: '🎾'
  }, {
    text: '今天吃得香睡得香，是快乐的一天~',
    tone: 'happy',
    emoji: '😋'
  }, {
    text: '一切正常！主人今天给我梳毛了，好舒服~',
    tone: 'happy',
    emoji: '✨'
  }],
  appetite: [{
    text: '今天不太想吃东西，可能天气太热了...',
    tone: 'tired',
    emoji: '🥵'
  }, {
    text: '今天的饭不太合胃口，主人别担心~',
    tone: 'neutral',
    emoji: '🍚'
  }, {
    text: '胃口不太好，但主人给我开了罐头！',
    tone: 'neutral',
    emoji: '🥫'
  }],
  spirit: [{
    text: '有点懒洋洋的，想多睡一会儿...',
    tone: 'tired',
    emoji: '😴'
  }, {
    text: '今天不想动，就让我当一天懒虫吧~',
    tone: 'tired',
    emoji: '🛋️'
  }, {
    text: '精神不太好，但主人的摸摸让我很开心',
    tone: 'neutral',
    emoji: '🤚'
  }],
  poop: [{
    text: '今天肚子不太舒服，主人要留意哦...',
    tone: 'sick',
    emoji: '🤒'
  }, {
    text: '便便有点稀，可能是昨天吃多了...',
    tone: 'neutral',
    emoji: '💩'
  }],
  weight: [{
    text: '主人说我胖了！该减肥了...',
    tone: 'neutral',
    emoji: '⚖️'
  }, {
    text: '体重下降了，主人很担心我',
    tone: 'sick',
    emoji: '📉'
  }],
  exercise: [{
    text: '今天不想运动，让我歇歇吧~',
    tone: 'tired',
    emoji: '😮‍💨'
  }],
  other: [{
    text: '今天有点不太对劲，主人多看看我~',
    tone: 'sick',
    emoji: '🤒'
  }],
  streak_3: [{
    text: '连续3天状态满分！我是健康小标兵~',
    tone: 'proud',
    emoji: '⭐'
  }],
  streak_7: [{
    text: '连续7天打卡！主人好认真，我也要加油！',
    tone: 'proud',
    emoji: '🏆'
  }],
  streak_30: [{
    text: '连续30天！我和主人都是最棒的搭档！',
    tone: 'proud',
    emoji: '👑'
  }],
  birthday: [{
    text: '今天是我的生日！谢谢主人陪我~',
    tone: 'happy',
    emoji: '🎂'
  }, {
    text: '又长大一岁了，要更乖才行！',
    tone: 'happy',
    emoji: '🎁'
  }],
  recovery: [{
    text: '今天好多了！谢谢主人的照顾~',
    tone: 'happy',
    emoji: '💪'
  }, {
    text: '恢复中！很快就能活蹦乱跳了！',
    tone: 'happy',
    emoji: '🏃'
  }],
  default: [{
    text: '今天也是普通而幸福的一天~',
    tone: 'happy',
    emoji: '💕'
  }, {
    text: '有主人在身边，每天都是好日子~',
    tone: 'happy',
    emoji: '🏠'
  }]
};
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateDiaryEntry(entry, streakDays, isBirthday, isRecovery) {
  if (isBirthday) {
    return pickRandom(DIARY_TEMPLATES.birthday);
  }
  if (isRecovery) {
    return pickRandom(DIARY_TEMPLATES.recovery);
  }
  if (streakDays >= 30) {
    return pickRandom(DIARY_TEMPLATES.streak_30);
  }
  if (streakDays >= 7) {
    return pickRandom(DIARY_TEMPLATES.streak_7);
  }
  if (streakDays >= 3 && !entry.hasAnomaly) {
    return pickRandom(DIARY_TEMPLATES.streak_3);
  }
  if (entry.hasAnomaly && entry.anomalyItems) {
    var _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__["default"])(entry.anomalyItems),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var anomaly = _step.value;
        if (DIARY_TEMPLATES[anomaly]) {
          return pickRandom(DIARY_TEMPLATES[anomaly]);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  if (!entry.hasAnomaly) {
    return pickRandom(DIARY_TEMPLATES.all_normal);
  }
  return pickRandom(DIARY_TEMPLATES.default);
}
function generateDiaryForToday(entry, streakDays, isBirthday, isRecovery) {
  if (!entry) {
    return {
      text: '今天还没打卡呢，主人快来~',
      tone: 'neutral',
      emoji: '⏰'
    };
  }
  return generateDiaryEntry(entry, streakDays, isBirthday, isRecovery);
}

/***/ }),

/***/ "./src/engines/petAvatar/expressionEngine.ts":
/*!***************************************************!*\
  !*** ./src/engines/petAvatar/expressionEngine.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EXPRESSION_MAP": function() { return /* binding */ EXPRESSION_MAP; },
/* harmony export */   "calculateExpression": function() { return /* binding */ calculateExpression; }
/* harmony export */ });
/* unused harmony exports getExpressionForFoodResult, getExpressionForSymptomResult, getExpressionForVaccineDue */
var EXPRESSION_MAP = {
  happy: {
    expression: 'happy',
    label: '开心',
    color: '#4CAF50',
    eyes: 'happy',
    mouth: 'smile',
    accessory: 'blush',
    animation: 'bounce'
  },
  worried: {
    expression: 'worried',
    label: '担心',
    color: '#FF9800',
    eyes: 'half',
    mouth: 'frown',
    accessory: 'cold_bubble',
    animation: 'pulse'
  },
  concerned: {
    expression: 'concerned',
    label: '关注',
    color: '#FF5722',
    eyes: 'round',
    mouth: 'worried',
    accessory: 'hospital',
    animation: 'shake'
  },
  anxious: {
    expression: 'anxious',
    label: '紧急',
    color: '#F44336',
    eyes: 'wide',
    mouth: 'gasp',
    accessory: 'sweat',
    animation: 'flash'
  },
  sleepy: {
    expression: 'sleepy',
    label: '瞌睡',
    color: '#9E9E9E',
    eyes: 'closed',
    mouth: 'zzz',
    accessory: 'drool',
    animation: 'float'
  },
  proud: {
    expression: 'proud',
    label: '骄傲',
    color: '#FFD700',
    eyes: 'sparkle',
    mouth: 'big_smile',
    accessory: 'crown',
    animation: 'glow'
  },
  excited: {
    expression: 'excited',
    label: '兴奋',
    color: '#FF69B4',
    eyes: 'star',
    mouth: 'open_smile',
    accessory: 'confetti',
    animation: 'jump'
  },
  scared: {
    expression: 'scared',
    label: '惊恐',
    color: '#E91E63',
    eyes: 'shocked',
    mouth: 'gasp',
    accessory: 'warning',
    animation: 'tremble'
  }
};
function calculateExpression(ctx) {
  if (ctx.isDeceased) {
    return EXPRESSION_MAP.sleepy;
  }
  if (ctx.isBirthday) {
    return EXPRESSION_MAP.excited;
  }
  if (ctx.isVaccineComplete) {
    return EXPRESSION_MAP.proud;
  }
  if (ctx.isRecovery) {
    return EXPRESSION_MAP.happy;
  }
  if (ctx.streakDays >= 7) {
    return EXPRESSION_MAP.proud;
  }
  if (!ctx.todayEntry) {
    return EXPRESSION_MAP.sleepy;
  }
  if (ctx.riskLevel === 'emergency') {
    return EXPRESSION_MAP.anxious;
  }
  if (ctx.riskLevel === 'high') {
    return EXPRESSION_MAP.concerned;
  }
  if (ctx.anomalyCount >= 2) {
    return EXPRESSION_MAP.worried;
  }
  if (ctx.anomalyCount === 1) {
    return EXPRESSION_MAP.worried;
  }
  return EXPRESSION_MAP.happy;
}
function getExpressionForFoodResult(isSafe) {
  return isSafe ? EXPRESSION_MAP.happy : EXPRESSION_MAP.scared;
}
function getExpressionForSymptomResult(riskLevel) {
  switch (riskLevel) {
    case 'emergency':
      return EXPRESSION_MAP.anxious;
    case 'high':
      return EXPRESSION_MAP.concerned;
    case 'medium':
      return EXPRESSION_MAP.worried;
    default:
      return EXPRESSION_MAP.happy;
  }
}
function getExpressionForVaccineDue(isOverdue) {
  return isOverdue ? EXPRESSION_MAP.worried : EXPRESSION_MAP.happy;
}

/***/ }),

/***/ "./src/engines/petAvatar/index.ts":
/*!****************************************!*\
  !*** ./src/engines/petAvatar/index.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EXPRESSION_MAP": function() { return /* reexport safe */ _expressionEngine__WEBPACK_IMPORTED_MODULE_0__.EXPRESSION_MAP; },
/* harmony export */   "calculateExpression": function() { return /* reexport safe */ _expressionEngine__WEBPACK_IMPORTED_MODULE_0__.calculateExpression; },
/* harmony export */   "generateDiaryForToday": function() { return /* reexport safe */ _diaryEngine__WEBPACK_IMPORTED_MODULE_2__.generateDiaryForToday; },
/* harmony export */   "getPetFaceDataUri": function() { return /* reexport safe */ _svgRenderer__WEBPACK_IMPORTED_MODULE_1__.getPetFaceDataUri; }
/* harmony export */ });
/* harmony import */ var _expressionEngine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./expressionEngine */ "./src/engines/petAvatar/expressionEngine.ts");
/* harmony import */ var _svgRenderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./svgRenderer */ "./src/engines/petAvatar/svgRenderer.ts");
/* harmony import */ var _diaryEngine__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./diaryEngine */ "./src/engines/petAvatar/diaryEngine.ts");
/* harmony import */ var _seedreamAdapter__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./seedreamAdapter */ "./src/engines/petAvatar/seedreamAdapter.ts");





/***/ }),

/***/ "./src/engines/petAvatar/outfitRenderer.ts":
/*!*************************************************!*\
  !*** ./src/engines/petAvatar/outfitRenderer.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "composeOutfitLayers": function() { return /* binding */ composeOutfitLayers; },
/* harmony export */   "resolveOutfitLayers": function() { return /* binding */ resolveOutfitLayers; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var _constants_wardrobe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../constants/wardrobe */ "./src/constants/wardrobe.ts");
/* harmony import */ var _data_wardrobe_accessories__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../data/wardrobe/accessories */ "./src/data/wardrobe/accessories.ts");




function composeOutfitLayers(layers) {
  if (layers.length === 0) return '';
  var sorted = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(layers).sort(function (a, b) {
    return a.zIndex - b.zIndex;
  });
  return sorted.map(function (layer) {
    var transformAttr = layer.transform ? " transform=\"".concat(layer.transform, "\"") : '';
    return "<g".concat(transformAttr, ">").concat(layer.svgPath, "</g>");
  }).join('');
}
function resolveOutfitLayers(slots, species) {
  var entries = Object.entries(slots);
  var layers = entries.filter(function (_ref) {
    var _ref2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_ref, 2),
      _slot = _ref2[0],
      accessoryId = _ref2[1];
    return accessoryId != null && accessoryId !== '';
  }).map(function (_ref3) {
    var _ref4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_ref3, 2),
      slot = _ref4[0],
      accessoryId = _ref4[1];
    var def = (0,_data_wardrobe_accessories__WEBPACK_IMPORTED_MODULE_1__.getAccessoryById)(accessoryId);
    return {
      slot: slot,
      accessoryId: def ? def.id : null,
      svgPath: def ? def.svgPath : '',
      zIndex: _constants_wardrobe__WEBPACK_IMPORTED_MODULE_0__.SLOT_Z_INDEX[slot],
      transform: species === 'cat' ? 'scale(0.85, 0.9)' : undefined
    };
  });
  return layers.sort(function (a, b) {
    return a.zIndex - b.zIndex;
  });
}

/***/ }),

/***/ "./src/engines/petAvatar/seedreamAdapter.ts":
/*!**************************************************!*\
  !*** ./src/engines/petAvatar/seedreamAdapter.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "seedreamAdapter": function() { return /* binding */ seedreamAdapter; }
/* harmony export */ });
/* unused harmony export SeedreamAdapter */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_classCallCheck_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createClass_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createClass.js */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _svgRenderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./svgRenderer */ "./src/engines/petAvatar/svgRenderer.ts");
/* harmony import */ var _expressionEngine__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./expressionEngine */ "./src/engines/petAvatar/expressionEngine.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../config */ "./src/config/index.ts");










function buildPetPrompt(params) {
  var speciesName = params.species === 'dog' ? '狗' : '猫';
  var breedText = params.breed ? "".concat(params.breed) : '';
  var colorText = params.color ? "".concat(params.color, "\u8272") : '';
  var styleText = params.style === 'realistic' ? '写实风格' : '可爱卡通风格';
  return "\u4E00\u53EA".concat(colorText).concat(breedText).concat(speciesName, "\uFF0C").concat(params.expression.label, "\u7684\u8868\u60C5\uFF0C").concat(styleText, "\uFF0C\u9AD8\u8D28\u91CF\uFF0C\u5E72\u51C0\u80CC\u666F");
}
var SeedreamAdapter = /*#__PURE__*/function () {
  function SeedreamAdapter() {
    var useStub = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_classCallCheck_js__WEBPACK_IMPORTED_MODULE_4__["default"])(this, SeedreamAdapter);
    (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_5__["default"])(this, "useStub", void 0);
    this.useStub = useStub;
  }
  return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createClass_js__WEBPACK_IMPORTED_MODULE_6__["default"])(SeedreamAdapter, [{
    key: "generatePetImage",
    value: function () {
      var _generatePetImage = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().m(function _callee(params) {
        var result, _t;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (!this.useStub) {
                _context.n = 1;
                break;
              }
              return _context.a(2, this.generateStubImage(params));
            case 1:
              _context.p = 1;
              _context.n = 2;
              return this.generateRealImage(params);
            case 2:
              result = _context.v;
              if (result.success) {
                _context.n = 3;
                break;
              }
              return _context.a(2, this.generateStubImage(params));
            case 3:
              return _context.a(2, result);
            case 4:
              _context.p = 4;
              _t = _context.v;
              return _context.a(2, this.generateStubImage(params));
          }
        }, _callee, this, [[1, 4]]);
      }));
      function generatePetImage(_x) {
        return _generatePetImage.apply(this, arguments);
      }
      return generatePetImage;
    }()
  }, {
    key: "generateStubImage",
    value: function generateStubImage(params) {
      var dataUri = (0,_svgRenderer__WEBPACK_IMPORTED_MODULE_1__.getPetFaceDataUri)(params.expression, params.species, 256);
      return {
        success: true,
        imageUrl: dataUri
      };
    }
  }, {
    key: "generateRealImage",
    value: function () {
      var _generateRealImage = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().m(function _callee2(params) {
        var prompt, apiParams, token, res, data;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              prompt = buildPetPrompt(params);
              apiParams = {
                prompt: prompt,
                imageSize: 'square',
                negativePrompt: '低质量, 模糊, 变形, 多余肢体, 文字, 水印',
                style: params.style === 'realistic' ? 'realistic' : 'cartoon'
              };
              token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_config__WEBPACK_IMPORTED_MODULE_3__.CONFIG.STORAGE_KEYS.TOKEN);
              _context2.n = 1;
              return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
                url: "".concat(_config__WEBPACK_IMPORTED_MODULE_3__.CONFIG.API_BASE_URL, "/api/avatar/generate"),
                method: 'POST',
                data: apiParams,
                header: (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({
                  'Content-Type': 'application/json'
                }, token ? {
                  'Authorization': "Bearer ".concat(token)
                } : {})
              });
            case 1:
              res = _context2.v;
              if (!(res.statusCode === 200)) {
                _context2.n = 3;
                break;
              }
              data = res.data;
              if (!(data.success && data.imageUrl)) {
                _context2.n = 2;
                break;
              }
              return _context2.a(2, {
                success: true,
                imageUrl: data.imageUrl
              });
            case 2:
              return _context2.a(2, {
                success: false,
                error: data.error || '生成失败'
              });
            case 3:
              if (!(res.statusCode === 402)) {
                _context2.n = 4;
                break;
              }
              return _context2.a(2, {
                success: false,
                error: '生成次数已用完'
              });
            case 4:
              if (!(res.statusCode === 429)) {
                _context2.n = 5;
                break;
              }
              return _context2.a(2, {
                success: false,
                error: '请求过于频繁，请稍后再试'
              });
            case 5:
              return _context2.a(2, {
                success: false,
                error: "\u8BF7\u6C42\u5931\u8D25: ".concat(res.statusCode)
              });
          }
        }, _callee2);
      }));
      function generateRealImage(_x2) {
        return _generateRealImage.apply(this, arguments);
      }
      return generateRealImage;
    }()
  }, {
    key: "generateAchievementImage",
    value: function () {
      var _generateAchievementImage = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().m(function _callee3(achievementType, petName, species) {
        var expression, dataUri, prompt, apiParams, token, res, data, _expression, _dataUri, _expression2, _dataUri2, _t2;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              if (!this.useStub) {
                _context3.n = 1;
                break;
              }
              expression = _expressionEngine__WEBPACK_IMPORTED_MODULE_2__.EXPRESSION_MAP.excited;
              dataUri = (0,_svgRenderer__WEBPACK_IMPORTED_MODULE_1__.getPetFaceDataUri)(expression, species, 256);
              return _context3.a(2, {
                success: true,
                imageUrl: dataUri
              });
            case 1:
              _context3.p = 1;
              prompt = "".concat(petName, "\u83B7\u5F97").concat(achievementType, "\u6210\u5C31\uFF0C\u5E86\u795D\u573A\u666F\uFF0C\u53EF\u7231\u5361\u901A\u98CE\u683C\uFF0C\u9AD8\u8D28\u91CF");
              apiParams = {
                prompt: prompt,
                imageSize: 'square',
                style: 'cartoon'
              };
              token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_config__WEBPACK_IMPORTED_MODULE_3__.CONFIG.STORAGE_KEYS.TOKEN);
              _context3.n = 2;
              return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
                url: "".concat(_config__WEBPACK_IMPORTED_MODULE_3__.CONFIG.API_BASE_URL, "/api/avatar/generate"),
                method: 'POST',
                data: apiParams,
                header: (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({
                  'Content-Type': 'application/json'
                }, token ? {
                  'Authorization': "Bearer ".concat(token)
                } : {})
              });
            case 2:
              res = _context3.v;
              if (!(res.statusCode === 200)) {
                _context3.n = 3;
                break;
              }
              data = res.data;
              if (!(data.success && data.imageUrl)) {
                _context3.n = 3;
                break;
              }
              return _context3.a(2, {
                success: true,
                imageUrl: data.imageUrl
              });
            case 3:
              _expression = _expressionEngine__WEBPACK_IMPORTED_MODULE_2__.EXPRESSION_MAP.excited;
              _dataUri = (0,_svgRenderer__WEBPACK_IMPORTED_MODULE_1__.getPetFaceDataUri)(_expression, species, 256);
              return _context3.a(2, {
                success: true,
                imageUrl: _dataUri
              });
            case 4:
              _context3.p = 4;
              _t2 = _context3.v;
              _expression2 = _expressionEngine__WEBPACK_IMPORTED_MODULE_2__.EXPRESSION_MAP.excited;
              _dataUri2 = (0,_svgRenderer__WEBPACK_IMPORTED_MODULE_1__.getPetFaceDataUri)(_expression2, species, 256);
              return _context3.a(2, {
                success: true,
                imageUrl: _dataUri2
              });
          }
        }, _callee3, this, [[1, 4]]);
      }));
      function generateAchievementImage(_x3, _x4, _x5) {
        return _generateAchievementImage.apply(this, arguments);
      }
      return generateAchievementImage;
    }()
  }]);
}();
var shouldUseStub = !"http://localhost:3000";
var seedreamAdapter = new SeedreamAdapter(shouldUseStub);

/***/ }),

/***/ "./src/engines/petAvatar/svgRenderer.ts":
/*!**********************************************!*\
  !*** ./src/engines/petAvatar/svgRenderer.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getPetFaceDataUri": function() { return /* binding */ getPetFaceDataUri; }
/* harmony export */ });
/* unused harmony exports buildSvgFace, svgToDataUri */
/* harmony import */ var _outfitRenderer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./outfitRenderer */ "./src/engines/petAvatar/outfitRenderer.ts");

var DOG_BASE = {
  body: '<ellipse cx="50" cy="55" rx="42" ry="38" fill="#F5DEB3"/>',
  ears: '<ellipse cx="18" cy="25" rx="12" ry="18" fill="#D2B48C" transform="rotate(-15 18 25)"/><ellipse cx="82" cy="25" rx="12" ry="18" fill="#D2B48C" transform="rotate(15 82 25)"/>'
};
var CAT_BASE = {
  body: '<ellipse cx="50" cy="55" rx="40" ry="36" fill="#D3D3D3"/>',
  ears: '<polygon points="15,30 10,8 30,22" fill="#A9A9A9"/><polygon points="85,30 90,8 70,22" fill="#A9A9A9"/>'
};
var EYE_DEFS = {
  happy: '<path d="M32 48 Q38 42 44 48" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M56 48 Q62 42 68 48" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  half: '<ellipse cx="38" cy="48" rx="5" ry="4" fill="#333"/><ellipse cx="62" cy="48" rx="5" ry="4" fill="#333"/><rect x="32" y="44" width="12" height="6" fill="#F5DEB3" rx="2"/><rect x="56" y="44" width="12" height="6" fill="#F5DEB3" rx="2"/>',
  round: '<circle cx="38" cy="48" r="6" fill="#333"/><circle cx="62" cy="48" r="6" fill="#333"/><circle cx="39" cy="47" r="2" fill="#fff"/><circle cx="63" cy="47" r="2" fill="#fff"/>',
  wide: '<circle cx="38" cy="48" r="7" fill="#333"/><circle cx="62" cy="48" r="7" fill="#333"/><circle cx="40" cy="46" r="2.5" fill="#fff"/><circle cx="64" cy="46" r="2.5" fill="#fff"/>',
  closed: '<path d="M32 48 Q38 52 44 48" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M56 48 Q62 52 68 48" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  sparkle: '<polygon points="38,42 40,46 44,46 41,49 42,53 38,51 34,53 35,49 32,46 36,46" fill="#FFD700"/><polygon points="62,42 64,46 68,46 65,49 66,53 62,51 58,53 59,49 56,46 60,46" fill="#FFD700"/>',
  star: '<text x="38" y="52" font-size="16" fill="#FFD700" text-anchor="middle">⭐</text><text x="62" y="52" font-size="16" fill="#FFD700" text-anchor="middle">⭐</text>',
  shocked: '<circle cx="38" cy="48" r="8" fill="#fff" stroke="#333" stroke-width="2"/><circle cx="62" cy="48" r="8" fill="#fff" stroke="#333" stroke-width="2"/><circle cx="38" cy="48" r="3" fill="#333"/><circle cx="62" cy="48" r="3" fill="#333"/>'
};
var MOUTH_DEFS = {
  smile: '<path d="M38 62 Q50 72 62 62" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  frown: '<path d="M38 66 Q50 58 62 66" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  worried: '<path d="M38 64 Q44 60 50 64 Q56 60 62 64" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>',
  gasp: '<circle cx="50" cy="63" r="6" fill="#333"/><circle cx="49" cy="61" r="1.5" fill="#fff"/>',
  zzz: '<text x="70" y="30" font-size="12" fill="#9E9E9E" font-weight="bold">Z</text><text x="78" y="22" font-size="14" fill="#9E9E9E" font-weight="bold">Z</text><text x="86" y="14" font-size="16" fill="#9E9E9E" font-weight="bold">Z</text>',
  big_smile: '<path d="M35 58 Q50 78 65 58" stroke="#333" stroke-width="2.5" fill="#FF6B6B" stroke-linecap="round"/><path d="M42 63 Q46 67 50 63" stroke="#fff" stroke-width="1" fill="none"/><path d="M50 63 Q54 67 58 63" stroke="#fff" stroke-width="1" fill="none"/>',
  open_smile: '<ellipse cx="50" cy="62" rx="12" ry="8" fill="#FF6B6B"/><path d="M42 60 Q50 68 58 60" stroke="#fff" stroke-width="1.5" fill="none"/>'
};
var ACCESSORY_DEFS = {
  blush: '<circle cx="28" cy="54" r="6" fill="#FFB6C1" opacity="0.5"/><circle cx="72" cy="54" r="6" fill="#FFB6C1" opacity="0.5"/>',
  cold_bubble: '<ellipse cx="75" cy="20" rx="10" ry="6" fill="#B3E5FC" opacity="0.7"/><text x="75" y="23" font-size="8" fill="#0288D1" text-anchor="middle">🤧</text>',
  hospital: '<text x="25" y="30" font-size="14">🏥</text>',
  sweat: '<text x="25" y="35" font-size="10">💧</text><text x="75" y="38" font-size="8">💧</text>',
  drool: '<ellipse cx="50" cy="72" rx="4" ry="6" fill="#B3E5FC" opacity="0.6"/>',
  crown: '<text x="50" y="15" font-size="18" text-anchor="middle">👑</text>',
  confetti: '<text x="20" y="20" font-size="10">🎉</text><text x="80" y="25" font-size="8">✨</text>',
  warning: '<text x="75" y="25" font-size="14">⚠️</text>'
};
function buildSvgFace(expression) {
  var species = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'dog';
  var size = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 120;
  var outfitLayers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
  var base = species === 'cat' ? CAT_BASE : DOG_BASE;
  var eyes = EYE_DEFS[expression.eyes] || EYE_DEFS.happy;
  var mouth = MOUTH_DEFS[expression.mouth] || MOUTH_DEFS.smile;
  var accessory = ACCESSORY_DEFS[expression.accessory] || '';
  var outfitSvg = (0,_outfitRenderer__WEBPACK_IMPORTED_MODULE_0__.composeOutfitLayers)(outfitLayers);
  var svg = "\n    <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"".concat(size, "\" height=\"").concat(size, "\">\n      <defs>\n        <filter id=\"shadow\">\n          <feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"2\" flood-opacity=\"0.1\"/>\n        </filter>\n      </defs>\n      <g filter=\"url(#shadow)\">\n        ").concat(base.body, "\n        ").concat(base.ears, "\n        <ellipse cx=\"38\" cy=\"45\" rx=\"12\" ry=\"10\" fill=\"#fff\" opacity=\"0.3\"/>\n        <ellipse cx=\"62\" cy=\"45\" rx=\"12\" ry=\"10\" fill=\"#fff\" opacity=\"0.3\"/>\n        <ellipse cx=\"50\" cy=\"50\" rx=\"8\" ry=\"5\" fill=\"#333\" opacity=\"0.15\"/>\n        ").concat(eyes, "\n        ").concat(mouth, "\n        ").concat(accessory, "\n      </g>\n      ").concat(outfitSvg, "\n    </svg>\n  ").trim();
  return svg;
}
function svgToDataUri(svg) {
  var encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return "data:image/svg+xml,".concat(encoded);
}
function getPetFaceDataUri(expression) {
  var species = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'dog';
  var size = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 120;
  var outfitLayers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
  var svg = buildSvgFace(expression, species, size, outfitLayers);
  return svgToDataUri(svg);
}

/***/ }),

/***/ "./src/hooks/useThemeClass.ts":
/*!************************************!*\
  !*** ./src/hooks/useThemeClass.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useThemeClass": function() { return /* binding */ useThemeClass; },
/* harmony export */   "useThemeKey": function() { return /* binding */ useThemeKey; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _stores_themeStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../stores/themeStore */ "./src/stores/themeStore.ts");





/**
 * 返回当前主题 key（如 "sakura-dream"）
 * 不依赖 Zustand 订阅（Taro 3 + Zustand v3 中 selector 不可靠触发重渲染）
 * 改用 local state + Taro.eventCenter 监听变更
 *
 * 每个页面挂载/显示时自动调用 applyNativeBars 确保导航栏和标签栏颜色正确
 */
function useThemeKey() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(function () {
      return _stores_themeStore__WEBPACK_IMPORTED_MODULE_2__.useThemeStore.getState().current;
    }),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    theme = _useState2[0],
    setTheme = _useState2[1];

  // 页面挂载时应用原生导航栏
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    _stores_themeStore__WEBPACK_IMPORTED_MODULE_2__.useThemeStore.getState().applyNativeBars(_stores_themeStore__WEBPACK_IMPORTED_MODULE_2__.useThemeStore.getState().current);
  }, []);

  // 页面每次显示时重新应用（从其他页面返回时导航栏可能被重置）
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.useDidShow)(function () {
    _stores_themeStore__WEBPACK_IMPORTED_MODULE_2__.useThemeStore.getState().applyNativeBars(_stores_themeStore__WEBPACK_IMPORTED_MODULE_2__.useThemeStore.getState().current);
  });
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    // 同步一次 store 最新值
    setTheme(_stores_themeStore__WEBPACK_IMPORTED_MODULE_2__.useThemeStore.getState().current);
    var handler = function handler(t) {
      setTheme(t);
    };
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().eventCenter.on('themeChange', handler);
    return function () {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().eventCenter.off('themeChange', handler);
    };
  }, []);
  return theme;
}

/**
 * 返回当前主题对应的 CSS 类名（如 "theme-sakura-dream"）
 */
function useThemeClass() {
  var theme = useThemeKey();
  return "theme-".concat(theme);
}

/***/ }),

/***/ "./src/services/aiProvider.ts":
/*!************************************!*\
  !*** ./src/services/aiProvider.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "chat": function() { return /* binding */ chat; },
/* harmony export */   "guardCheck": function() { return /* binding */ guardCheck; }
/* harmony export */ });
/* unused harmony export guardCheckOutput */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config/index.ts");




function chat(_x) {
  return _chat.apply(this, arguments);
}
function _chat() {
  _chat = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee(request) {
    var token, res, body, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.TOKEN);
          _context.p = 1;
          _context.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.API_BASE_URL, "/api/ai/chat"),
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
              Authorization: "Bearer ".concat(token)
            },
            data: request
          });
        case 2:
          res = _context.v;
          if (!(res.statusCode === 200)) {
            _context.n = 3;
            break;
          }
          body = res.data;
          return _context.a(2, body.reply);
        case 3:
          return _context.a(2, 'AI服务暂不可用，请稍后再试');
        case 4:
          _context.p = 4;
          _t = _context.v;
          return _context.a(2, '网络异常，请检查网络连接后重试');
      }
    }, _callee, null, [[1, 4]]);
  }));
  return _chat.apply(this, arguments);
}
function guardCheck(_x2) {
  return _guardCheck.apply(this, arguments);
}
function _guardCheck() {
  _guardCheck = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee2(text) {
    var token, res, _t2;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.TOKEN);
          _context2.p = 1;
          _context2.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.API_BASE_URL, "/api/ai/guard"),
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
              Authorization: "Bearer ".concat(token)
            },
            data: {
              text: text
            }
          });
        case 2:
          res = _context2.v;
          if (!(res.statusCode === 200)) {
            _context2.n = 3;
            break;
          }
          return _context2.a(2, res.data);
        case 3:
          return _context2.a(2, {
            isHarmful: false,
            score: 0,
            isCrisis: false
          });
        case 4:
          _context2.p = 4;
          _t2 = _context2.v;
          return _context2.a(2, {
            isHarmful: false,
            score: 0,
            isCrisis: false
          });
      }
    }, _callee2, null, [[1, 4]]);
  }));
  return _guardCheck.apply(this, arguments);
}
function guardCheckOutput(_x3) {
  return _guardCheckOutput.apply(this, arguments);
}
function _guardCheckOutput() {
  _guardCheckOutput = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee3(text) {
    var token, res, _t3;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.TOKEN);
          _context3.p = 1;
          _context3.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.API_BASE_URL, "/api/ai/guard/output"),
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
              Authorization: "Bearer ".concat(token)
            },
            data: {
              text: text
            }
          });
        case 2:
          res = _context3.v;
          if (!(res.statusCode === 200)) {
            _context3.n = 3;
            break;
          }
          return _context3.a(2, res.data);
        case 3:
          return _context3.a(2, {
            isUnsafeMedicalAdvice: false
          });
        case 4:
          _context3.p = 4;
          _t3 = _context3.v;
          return _context3.a(2, {
            isUnsafeMedicalAdvice: false
          });
      }
    }, _callee3, null, [[1, 4]]);
  }));
  return _guardCheckOutput.apply(this, arguments);
}

/***/ }),

/***/ "./src/services/api.ts":
/*!*****************************!*\
  !*** ./src/services/api.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "api": function() { return /* binding */ api; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config/index.ts");
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/storage */ "./src/utils/storage.ts");
/* harmony import */ var _mock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./mock */ "./src/services/mock.ts");
/* provided dependency */ var URLSearchParams = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js")["URLSearchParams"];







function request(_x, _x2) {
  return _request.apply(this, arguments);
}
function _request() {
  _request = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee1(path, options) {
    var method, urlParams, _petId, period, _petId2, month, petId, startDate, endDate, _petId3, _urlParams, _startDate, _endDate, token, url, searchParams, res, body, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context1) {
      while (1) switch (_context1.p = _context1.n) {
        case 0:
          if (!useMock()) {
            _context1.n = 7;
            break;
          }
          method = (options === null || options === void 0 ? void 0 : options.method) || 'GET';
          if (!(method === 'GET' && path.includes('/trends'))) {
            _context1.n = 3;
            break;
          }
          urlParams = new URLSearchParams((options === null || options === void 0 ? void 0 : options.params) || {});
          if (!path.includes('/trends/summary')) {
            _context1.n = 1;
            break;
          }
          _petId = path.match(/\/pets\/([^/]+)\/trends/)[1];
          period = urlParams.get('period') || 'week';
          return _context1.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getTrendSummary(_petId, period));
        case 1:
          if (!path.includes('/trends/report')) {
            _context1.n = 2;
            break;
          }
          _petId2 = path.match(/\/pets\/([^/]+)\/trends/)[1];
          month = urlParams.get('month') || new Date().toISOString().slice(0, 7);
          return _context1.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getMonthlyReport(_petId2, month));
        case 2:
          petId = path.match(/\/pets\/([^/]+)\/trends/)[1];
          startDate = urlParams.get('startDate') || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
          endDate = urlParams.get('endDate') || new Date().toISOString().slice(0, 10);
          return _context1.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getTrendData(petId, startDate, endDate));
        case 3:
          if (!(method === 'GET' && path.includes('/checkins') && (path.includes('startDate') || path.includes('endDate') || options !== null && options !== void 0 && options.params && (options.params.startDate || options.params.endDate)))) {
            _context1.n = 4;
            break;
          }
          _petId3 = path.match(/\/pets\/([^/]+)\/checkins/)[1];
          _urlParams = new URLSearchParams((options === null || options === void 0 ? void 0 : options.params) || {});
          _startDate = _urlParams.get('startDate') || '2020-01-01';
          _endDate = _urlParams.get('endDate') || new Date().toISOString().slice(0, 10);
          return _context1.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getHealthCheckinsByDateRange(_petId3, _startDate, _endDate));
        case 4:
          console.warn("[Mock] API ".concat(method, " ").concat(path, " - \u8FD4\u56DE mock \u7A7A\u6570\u636E"));
          if (!(method === 'GET')) {
            _context1.n = 5;
            break;
          }
          return _context1.a(2, []);
        case 5:
          if (!(method === 'POST' || method === 'PUT')) {
            _context1.n = 6;
            break;
          }
          return _context1.a(2, (options === null || options === void 0 ? void 0 : options.data) || {});
        case 6:
          return _context1.a(2, undefined);
        case 7:
          token = _utils_storage__WEBPACK_IMPORTED_MODULE_2__.storage.getToken();
          url = _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.API_BASE_URL + path;
          if (options !== null && options !== void 0 && options.params) {
            searchParams = new URLSearchParams(options.params);
            url += '?' + searchParams.toString();
          }
          _context1.p = 8;
          _context1.n = 9;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: url,
            method: (options === null || options === void 0 ? void 0 : options.method) || 'GET',
            data: options === null || options === void 0 ? void 0 : options.data,
            header: (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_6__["default"])({
              'Content-Type': 'application/json'
            }, token ? {
              Authorization: "Bearer ".concat(token)
            } : {})
          });
        case 9:
          res = _context1.v;
          body = res.data;
          if (!(body.code === 0)) {
            _context1.n = 10;
            break;
          }
          return _context1.a(2, body.data);
        case 10:
          throw new Error(body.message || '请求失败');
        case 11:
          _context1.p = 11;
          _t = _context1.v;
          if (!(_t.message === 'request:fail')) {
            _context1.n = 12;
            break;
          }
          throw new Error('网络异常，请检查网络连接');
        case 12:
          throw _t;
        case 13:
          return _context1.a(2);
      }
    }, _callee1, null, [[8, 11]]);
  }));
  return _request.apply(this, arguments);
}
function useMock() {
  return _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.USE_MOCK;
}
var api = {
  get: function get(path, params) {
    return request(path, {
      method: 'GET',
      params: params
    });
  },
  post: function post(path, data) {
    return request(path, {
      method: 'POST',
      data: data
    });
  },
  put: function put(path, data) {
    return request(path, {
      method: 'PUT',
      data: data
    });
  },
  delete: function _delete(path) {
    return request(path, {
      method: 'DELETE'
    });
  },
  login: function () {
    var _login = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee(code) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            if (!useMock()) {
              _context.n = 1;
              break;
            }
            return _context.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.login(code));
          case 1:
            return _context.a(2, request('/auth/login', {
              method: 'POST',
              data: {
                provider: 'wechat',
                code: code
              }
            }));
        }
      }, _callee);
    }));
    function login(_x3) {
      return _login.apply(this, arguments);
    }
    return login;
  }(),
  getUser: function () {
    var _getUser = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee2() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            if (!useMock()) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getUser());
          case 1:
            return _context2.a(2, request('/auth/session'));
        }
      }, _callee2);
    }));
    function getUser() {
      return _getUser.apply(this, arguments);
    }
    return getUser;
  }(),
  getPets: function () {
    var _getPets = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee3(userId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            if (!useMock()) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getPets(userId));
          case 1:
            return _context3.a(2, request('/pets', {
              params: {
                userId: userId
              }
            }));
        }
      }, _callee3);
    }));
    function getPets(_x4) {
      return _getPets.apply(this, arguments);
    }
    return getPets;
  }(),
  getPet: function () {
    var _getPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee4(petId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            if (!useMock()) {
              _context4.n = 1;
              break;
            }
            return _context4.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getPet(petId));
          case 1:
            return _context4.a(2, request("/pets/".concat(petId)));
        }
      }, _callee4);
    }));
    function getPet(_x5) {
      return _getPet.apply(this, arguments);
    }
    return getPet;
  }(),
  createPet: function () {
    var _createPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee5(data) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context5) {
        while (1) switch (_context5.n) {
          case 0:
            if (!useMock()) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.createPet(data));
          case 1:
            return _context5.a(2, request('/pets', {
              method: 'POST',
              data: data
            }));
        }
      }, _callee5);
    }));
    function createPet(_x6) {
      return _createPet.apply(this, arguments);
    }
    return createPet;
  }(),
  updatePet: function () {
    var _updatePet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee6(petId, data) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context6) {
        while (1) switch (_context6.n) {
          case 0:
            if (!useMock()) {
              _context6.n = 1;
              break;
            }
            return _context6.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.updatePet(petId, data));
          case 1:
            return _context6.a(2, request("/pets/".concat(petId), {
              method: 'PUT',
              data: data
            }));
        }
      }, _callee6);
    }));
    function updatePet(_x7, _x8) {
      return _updatePet.apply(this, arguments);
    }
    return updatePet;
  }(),
  deletePet: function () {
    var _deletePet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee7(petId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context7) {
        while (1) switch (_context7.n) {
          case 0:
            if (!useMock()) {
              _context7.n = 1;
              break;
            }
            return _context7.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.deletePet(petId));
          case 1:
            return _context7.a(2, request("/pets/".concat(petId), {
              method: 'DELETE'
            }));
        }
      }, _callee7);
    }));
    function deletePet(_x9) {
      return _deletePet.apply(this, arguments);
    }
    return deletePet;
  }(),
  getCheckins: function () {
    var _getCheckins = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee8(petId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context8) {
        while (1) switch (_context8.n) {
          case 0:
            if (!useMock()) {
              _context8.n = 1;
              break;
            }
            return _context8.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getCheckins(petId));
          case 1:
            return _context8.a(2, request("/pets/".concat(petId, "/checkins")));
        }
      }, _callee8);
    }));
    function getCheckins(_x0) {
      return _getCheckins.apply(this, arguments);
    }
    return getCheckins;
  }(),
  createCheckin: function () {
    var _createCheckin = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee9(data) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context9) {
        while (1) switch (_context9.n) {
          case 0:
            if (!useMock()) {
              _context9.n = 1;
              break;
            }
            return _context9.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.createCheckin(data));
          case 1:
            return _context9.a(2, request("/pets/".concat(data.petId, "/checkins"), {
              method: 'POST',
              data: data
            }));
        }
      }, _callee9);
    }));
    function createCheckin(_x1) {
      return _createCheckin.apply(this, arguments);
    }
    return createCheckin;
  }(),
  getMembership: function () {
    var _getMembership = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee0(userId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context0) {
        while (1) switch (_context0.n) {
          case 0:
            if (!useMock()) {
              _context0.n = 1;
              break;
            }
            return _context0.a(2, _mock__WEBPACK_IMPORTED_MODULE_3__.mockApi.getMembership(userId));
          case 1:
            return _context0.a(2, request("/membership/status", {
              params: {
                userId: userId
              }
            }));
        }
      }, _callee0);
    }));
    function getMembership(_x10) {
      return _getMembership.apply(this, arguments);
    }
    return getMembership;
  }()
};

/***/ }),

/***/ "./src/services/checkinService.ts":
/*!****************************************!*\
  !*** ./src/services/checkinService.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getCheckinStats": function() { return /* binding */ getCheckinStats; },
/* harmony export */   "getCheckins": function() { return /* binding */ getCheckins; },
/* harmony export */   "getCheckinsByDateRange": function() { return /* binding */ getCheckinsByDateRange; },
/* harmony export */   "getTodayCheckin": function() { return /* binding */ getTodayCheckin; }
/* harmony export */ });
/* unused harmony exports createCheckin, getLatestCheckin, calculateConsecutiveAnomalyDays */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/storage */ "./src/utils/storage.ts");
/* harmony import */ var _syncHelper__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./syncHelper */ "./src/services/syncHelper.ts");
/* harmony import */ var _utils_petOwnership__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/petOwnership */ "./src/utils/petOwnership.ts");








function userKey(key, userId) {
  return "".concat(key, "_").concat(userId);
}
function getStorageKey(petId, userId) {
  return userKey("checkins_".concat(petId), userId);
}
function generateId() {
  return "".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 9));
}
function getLocalCheckins(petId, userId) {
  return (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(getStorageKey(petId, userId)) || [];
}
function saveLocalCheckins(petId, userId, entries) {
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(getStorageKey(petId, userId), entries);
}
function mapRiskLevel(legacy) {
  switch (legacy) {
    case 'normal':
      return 'low';
    case 'caution':
      return 'medium';
    case 'warning':
      return 'high';
    case 'emergency':
      return 'emergency';
  }
}
function calculateRiskLevel(entry) {
  var legacy = 'normal';
  if (entry.poopLevel === 1) legacy = 'emergency';else if (entry.appetiteLevel === 6) legacy = 'emergency';else if (entry.appetiteLevel === 1 && entry.spiritLevel === 1) legacy = 'emergency';else if (entry.poopLevel === 2 && entry.appetiteLevel <= 2 && entry.spiritLevel <= 2) legacy = 'emergency';else if (entry.appetiteLevel === 5 && entry.poopLevel <= 2) legacy = 'emergency';else if (entry.appetiteLevel <= 2 && entry.spiritLevel <= 2) legacy = 'warning';else if (entry.poopLevel === 2) legacy = 'warning';else if (entry.appetiteLevel <= 2) legacy = 'warning';else if (entry.spiritLevel <= 2) legacy = 'warning';else if (entry.appetiteLevel === 5 && entry.spiritLevel <= 2) legacy = 'warning';else if (entry.appetiteLevel === 5) legacy = 'caution';else if (entry.hasAnomaly) legacy = 'caution';else if (entry.appetiteLevel === 3 || entry.spiritLevel === 3) legacy = 'caution';
  return mapRiskLevel(legacy);
}
function generateAiFeedback(entry, riskLevel) {
  var symptoms = [];
  if (entry.appetiteLevel <= 2) symptoms.push('食欲异常');
  if (entry.appetiteLevel === 6) symptoms.push('呕吐');
  if (entry.appetiteLevel === 5) symptoms.push('食欲亢进');
  if (entry.spiritLevel <= 2) symptoms.push('精神状态异常');
  if (entry.poopLevel <= 2) symptoms.push('排便异常');
  if (entry.hasAnomaly) symptoms.push("\u5F02\u5E38\u9879\uFF1A".concat(entry.anomalyItems.join('、')));
  var symptomText = symptoms.length > 0 ? "\u5177\u4F53\u75C7\u72B6\uFF1A".concat(symptoms.join('、'), "\u3002") : '';
  switch (riskLevel) {
    case 'emergency':
      return "\u26A0\uFE0F \u68C0\u6D4B\u5230\u7D27\u6025\u5065\u5EB7\u4FE1\u53F7\uFF01\u5EFA\u8BAE\u7ACB\u5373\u8054\u7CFB\u5BA0\u7269\u533B\u9662\u3002".concat(symptomText);
    case 'high':
      return "\uD83D\uDD14 \u60A8\u7684\u5BA0\u7269\u51FA\u73B0\u4E86\u4E00\u4E9B\u9700\u8981\u5173\u6CE8\u7684\u75C7\u72B6\u3002\u5EFA\u8BAE\u5BC6\u5207\u89C2\u5BDF\uFF0C\u5982\u6301\u7EED\u6076\u5316\u8BF7\u5C31\u533B\u3002".concat(symptomText);
    case 'medium':
      return "\uD83D\uDCA1 \u60A8\u7684\u5BA0\u7269\u6709\u4E9B\u5C0F\u5F02\u5E38\uFF0C\u5EFA\u8BAE\u591A\u89C2\u5BDF\u3002".concat(symptomText);
    case 'low':
      return '✅ 您的宠物今天状态不错！继续保持良好的照顾习惯。';
  }
}
function entryDateStr(entry) {
  if (entry.createdAt instanceof Date) {
    return entry.createdAt.toISOString().slice(0, 10);
  }
  return String(entry.createdAt).slice(0, 10);
}
function getCheckins(_x, _x2) {
  return _getCheckins.apply(this, arguments);
}
function _getCheckins() {
  _getCheckins = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee(petId, userId) {
    var result, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          (0,_utils_petOwnership__WEBPACK_IMPORTED_MODULE_3__.requirePetOwnership)(petId, userId);
          _context.p = 1;
          _context.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/pets/".concat(petId, "/checkins"));
        case 2:
          result = _context.v;
          saveLocalCheckins(petId, userId, result);
          return _context.a(2, result);
        case 3:
          _context.p = 3;
          _t = _context.v;
          return _context.a(2, getLocalCheckins(petId, userId));
      }
    }, _callee, null, [[1, 3]]);
  }));
  return _getCheckins.apply(this, arguments);
}
function getCheckinsByDateRange(_x3, _x4, _x5, _x6) {
  return _getCheckinsByDateRange.apply(this, arguments);
}
function _getCheckinsByDateRange() {
  _getCheckinsByDateRange = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee2(petId, userId, startDate, endDate) {
    var result, all, _t2;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          (0,_utils_petOwnership__WEBPACK_IMPORTED_MODULE_3__.requirePetOwnership)(petId, userId);
          _context2.p = 1;
          _context2.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/pets/".concat(petId, "/checkins?startDate=").concat(startDate, "&endDate=").concat(endDate));
        case 2:
          result = _context2.v;
          return _context2.a(2, result);
        case 3:
          _context2.p = 3;
          _t2 = _context2.v;
          all = getLocalCheckins(petId, userId);
          return _context2.a(2, all.filter(function (e) {
            var dateStr = entryDateStr(e);
            return dateStr >= startDate && dateStr <= endDate;
          }));
      }
    }, _callee2, null, [[1, 3]]);
  }));
  return _getCheckinsByDateRange.apply(this, arguments);
}
function createCheckin(_x7) {
  return _createCheckin.apply(this, arguments);
}
function _createCheckin() {
  _createCheckin = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee3(data) {
    var riskLevel, aiFeedback, now, newEntry, result, local, todayStr, existingIndex, _local, _todayStr, _existingIndex, _t3;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          (0,_utils_petOwnership__WEBPACK_IMPORTED_MODULE_3__.requirePetOwnership)(data.petId, data.userId);
          riskLevel = calculateRiskLevel(data);
          aiFeedback = generateAiFeedback(data, riskLevel);
          now = new Date();
          newEntry = {
            id: generateId(),
            petId: data.petId,
            userId: data.userId,
            poopLevel: data.poopLevel,
            appetiteLevel: data.appetiteLevel,
            spiritLevel: data.spiritLevel,
            exerciseLevel: data.exerciseLevel,
            weight: data.weight,
            hasAnomaly: data.hasAnomaly,
            anomalyItems: data.anomalyItems,
            aiFeedback: aiFeedback,
            riskLevel: riskLevel,
            note: data.note,
            createdAt: now
          };
          _context3.p = 1;
          _context3.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/api/pets/".concat(data.petId, "/checkins"), newEntry);
        case 2:
          result = _context3.v;
          local = getLocalCheckins(data.petId, data.userId);
          todayStr = entryDateStr(newEntry);
          existingIndex = local.findIndex(function (e) {
            return entryDateStr(e) === todayStr;
          });
          if (existingIndex !== -1) {
            local[existingIndex] = result;
          } else {
            local.push(result);
          }
          saveLocalCheckins(data.petId, data.userId, local);
          (0,_syncHelper__WEBPACK_IMPORTED_MODULE_2__.queueSync)('pet_health_entries', newEntry.id, 'insert', newEntry, data.userId);
          return _context3.a(2, result);
        case 3:
          _context3.p = 3;
          _t3 = _context3.v;
          _local = getLocalCheckins(data.petId, data.userId);
          _todayStr = entryDateStr(newEntry);
          _existingIndex = _local.findIndex(function (e) {
            return entryDateStr(e) === _todayStr;
          });
          if (_existingIndex !== -1) {
            _local[_existingIndex] = newEntry;
          } else {
            _local.push(newEntry);
          }
          saveLocalCheckins(data.petId, data.userId, _local);
          (0,_syncHelper__WEBPACK_IMPORTED_MODULE_2__.queueSync)('pet_health_entries', newEntry.id, 'insert', newEntry, data.userId);
          return _context3.a(2, newEntry);
      }
    }, _callee3, null, [[1, 3]]);
  }));
  return _createCheckin.apply(this, arguments);
}
function getTodayCheckin(_x8, _x9) {
  return _getTodayCheckin.apply(this, arguments);
}
function _getTodayCheckin() {
  _getTodayCheckin = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee4(petId, userId) {
    var today, result, local, _t4;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          today = new Date().toISOString().slice(0, 10);
          _context4.p = 1;
          _context4.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/pets/".concat(petId, "/checkins/today?date=").concat(today));
        case 2:
          result = _context4.v;
          return _context4.a(2, result);
        case 3:
          _context4.p = 3;
          _t4 = _context4.v;
          local = getLocalCheckins(petId, userId);
          return _context4.a(2, local.find(function (e) {
            return entryDateStr(e) === today;
          }) || null);
      }
    }, _callee4, null, [[1, 3]]);
  }));
  return _getTodayCheckin.apply(this, arguments);
}
function getCheckinStats(_x0, _x1) {
  return _getCheckinStats.apply(this, arguments);
}
function _getCheckinStats() {
  _getCheckinStats = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee5(petId, userId) {
    var result, local, _t5;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context5) {
      while (1) switch (_context5.p = _context5.n) {
        case 0:
          _context5.p = 0;
          _context5.n = 1;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/pets/".concat(petId, "/checkins/stats"));
        case 1:
          result = _context5.v;
          return _context5.a(2, result);
        case 2:
          _context5.p = 2;
          _t5 = _context5.v;
          local = getLocalCheckins(petId, userId);
          return _context5.a(2, calculateLocalStats(local));
      }
    }, _callee5, null, [[0, 2]]);
  }));
  return _getCheckinStats.apply(this, arguments);
}
function getLatestCheckin(_x10, _x11) {
  return _getLatestCheckin.apply(this, arguments);
}
function _getLatestCheckin() {
  _getLatestCheckin = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee6(petId, userId) {
    var result, local, _t6;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          _context6.p = 0;
          _context6.n = 1;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/pets/".concat(petId, "/checkins/latest"));
        case 1:
          result = _context6.v;
          return _context6.a(2, result);
        case 2:
          _context6.p = 2;
          _t6 = _context6.v;
          local = getLocalCheckins(petId, userId);
          if (!(local.length === 0)) {
            _context6.n = 3;
            break;
          }
          return _context6.a(2, null);
        case 3:
          return _context6.a(2, local.reduce(function (latest, entry) {
            return entryDateStr(entry) > entryDateStr(latest) ? entry : latest;
          }));
      }
    }, _callee6, null, [[0, 2]]);
  }));
  return _getLatestCheckin.apply(this, arguments);
}
function calculateConsecutiveAnomalyDays(entries) {
  var sorted = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(entries).sort(function (a, b) {
    var aStr = entryDateStr(a);
    var bStr = entryDateStr(b);
    return bStr.localeCompare(aStr);
  });
  var seenDates = new Set();
  var count = 0;
  var _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_7__["default"])(sorted),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var entry = _step.value;
      var dateStr = entryDateStr(entry);
      if (seenDates.has(dateStr)) continue;
      seenDates.add(dateStr);
      if (entry.hasAnomaly) {
        count++;
      } else {
        break;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return count;
}
function calculateLocalStats(entries) {
  var now = new Date();
  var todayStr = now.toISOString().slice(0, 10);
  var weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  var weekStartStr = weekStart.toISOString().slice(0, 10);
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var monthStartStr = monthStart.toISOString().slice(0, 10);
  var sortedDates = entries.map(function (e) {
    return entryDateStr(e);
  }).filter(function (d, i, arr) {
    return arr.indexOf(d) === i;
  }).sort().reverse();
  var streak = 0;
  var checkDate = new Date(todayStr);
  var _iterator2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_7__["default"])(sortedDates),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var dateStr = _step2.value;
      var expected = checkDate.toISOString().slice(0, 10);
      if (dateStr === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  var consecutiveAnomalyDays = calculateConsecutiveAnomalyDays(entries);
  var anomalyEntries = entries.filter(function (e) {
    return e.hasAnomaly;
  });
  var totalAnomalyDays = anomalyEntries.length;
  var lastAnomalyDate = anomalyEntries.length > 0 ? entryDateStr(anomalyEntries.sort(function (a, b) {
    return entryDateStr(b).localeCompare(entryDateStr(a));
  })[0]) : null;
  return {
    totalCheckins: entries.length,
    streak: streak,
    lastCheckinDate: sortedDates.length > 0 ? sortedDates[0] : null,
    weeklyCount: entries.filter(function (e) {
      return entryDateStr(e) >= weekStartStr;
    }).length,
    monthlyCount: entries.filter(function (e) {
      return entryDateStr(e) >= monthStartStr;
    }).length,
    consecutiveAnomalyDays: consecutiveAnomalyDays,
    totalAnomalyDays: totalAnomalyDays,
    lastAnomalyDate: lastAnomalyDate
  };
}

/***/ }),

/***/ "./src/services/familyService.ts":
/*!***************************************!*\
  !*** ./src/services/familyService.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "familyService": function() { return /* binding */ familyService; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");
/* harmony import */ var _mock__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./mock */ "./src/services/mock.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../config */ "./src/config/index.ts");





var useMock = function useMock() {
  return _config__WEBPACK_IMPORTED_MODULE_2__.CONFIG.USE_MOCK;
};
var familyService = {
  getFamilies: function getFamilies() {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee() {
      var data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            if (!useMock()) {
              _context.n = 1;
              break;
            }
            return _context.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.getFamilies());
          case 1:
            _context.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.get('/api/families');
          case 2:
            data = _context.v;
            return _context.a(2, data || []);
        }
      }, _callee);
    }))();
  },
  createFamily: function createFamily(name) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee2() {
      var data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            if (!useMock()) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.createFamily(name));
          case 1:
            _context2.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.post('/api/families', {
              name: name
            });
          case 2:
            data = _context2.v;
            return _context2.a(2, data);
        }
      }, _callee2);
    }))();
  },
  getMembers: function getMembers(familyId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee3() {
      var data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            if (!useMock()) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.getMembers(familyId));
          case 1:
            _context3.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/families/".concat(familyId, "/members"));
          case 2:
            data = _context3.v;
            return _context3.a(2, data || []);
        }
      }, _callee3);
    }))();
  },
  addMember: function addMember(familyId, petId, role) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee4() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            if (!useMock()) {
              _context4.n = 1;
              break;
            }
            return _context4.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.addMember(familyId, petId, role));
          case 1:
            _context4.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/api/families/".concat(familyId, "/members"), {
              pet_id: petId,
              role: role
            });
          case 2:
            return _context4.a(2);
        }
      }, _callee4);
    }))();
  },
  removeMember: function removeMember(familyId, memberId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee5() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context5) {
        while (1) switch (_context5.n) {
          case 0:
            if (!useMock()) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.removeMember(familyId, memberId));
          case 1:
            _context5.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api["delete"]("/api/families/".concat(familyId, "/members/").concat(memberId));
          case 2:
            return _context5.a(2);
        }
      }, _callee5);
    }))();
  },
  updateMemberRole: function updateMemberRole(familyId, memberId, role) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee6() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context6) {
        while (1) switch (_context6.n) {
          case 0:
            if (!useMock()) {
              _context6.n = 1;
              break;
            }
            return _context6.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.updateMemberRole(familyId, memberId, role));
          case 1:
            _context6.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.put("/api/families/".concat(familyId, "/members/").concat(memberId), {
              role: role
            });
          case 2:
            return _context6.a(2);
        }
      }, _callee6);
    }))();
  },
  getLineage: function getLineage(petId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee7() {
      var data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context7) {
        while (1) switch (_context7.n) {
          case 0:
            if (!useMock()) {
              _context7.n = 1;
              break;
            }
            return _context7.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.getLineage(petId));
          case 1:
            _context7.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/pets/".concat(petId, "/lineage"));
          case 2:
            data = _context7.v;
            return _context7.a(2, {
              parents: (data === null || data === void 0 ? void 0 : data.parents) || [],
              children: (data === null || data === void 0 ? void 0 : data.children) || []
            });
        }
      }, _callee7);
    }))();
  },
  addLineage: function addLineage(parentId, childId, litterDate) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee8() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context8) {
        while (1) switch (_context8.n) {
          case 0:
            if (!useMock()) {
              _context8.n = 1;
              break;
            }
            return _context8.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.addLineage(parentId, childId, litterDate));
          case 1:
            _context8.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/api/pets/".concat(childId, "/lineage"), {
              parent_id: parentId,
              child_id: childId,
              litter_date: litterDate
            });
          case 2:
            return _context8.a(2);
        }
      }, _callee8);
    }))();
  },
  removeLineage: function removeLineage(lineageId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee9() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context9) {
        while (1) switch (_context9.n) {
          case 0:
            if (!useMock()) {
              _context9.n = 1;
              break;
            }
            return _context9.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.removeLineage(lineageId));
          case 1:
            _context9.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api["delete"]("/api/lineage/".concat(lineageId));
          case 2:
            return _context9.a(2);
        }
      }, _callee9);
    }))();
  },
  getFamilyPhotos: function getFamilyPhotos(familyId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee0() {
      var data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context0) {
        while (1) switch (_context0.n) {
          case 0:
            if (!useMock()) {
              _context0.n = 1;
              break;
            }
            return _context0.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.getFamilyPhotos(familyId));
          case 1:
            _context0.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/families/".concat(familyId, "/photos"));
          case 2:
            data = _context0.v;
            return _context0.a(2, data || []);
        }
      }, _callee0);
    }))();
  },
  saveFamilyPhoto: function saveFamilyPhoto(familyId, photoUrl, memberCount, memberNames) {
    var _arguments = arguments;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee1() {
      var photoType, description, data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context1) {
        while (1) switch (_context1.n) {
          case 0:
            photoType = _arguments.length > 4 && _arguments[4] !== undefined ? _arguments[4] : 'generated';
            description = _arguments.length > 5 ? _arguments[5] : undefined;
            if (!useMock()) {
              _context1.n = 1;
              break;
            }
            return _context1.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.saveFamilyPhoto(familyId, photoUrl, memberCount, memberNames, photoType, description));
          case 1:
            _context1.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/api/families/".concat(familyId, "/photos"), {
              photo_url: photoUrl,
              member_count: memberCount,
              member_names: memberNames,
              photo_type: photoType,
              description: description
            });
          case 2:
            data = _context1.v;
            return _context1.a(2, data);
        }
      }, _callee1);
    }))();
  },
  deleteFamilyPhoto: function deleteFamilyPhoto(photoId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee10() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context10) {
        while (1) switch (_context10.n) {
          case 0:
            if (!useMock()) {
              _context10.n = 1;
              break;
            }
            return _context10.a(2, _mock__WEBPACK_IMPORTED_MODULE_1__.mockApi.deleteFamilyPhoto(photoId));
          case 1:
            _context10.n = 2;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api["delete"]("/api/photos/".concat(photoId));
          case 2:
            return _context10.a(2);
        }
      }, _callee10);
    }))();
  }
};

/***/ }),

/***/ "./src/services/membershipService.ts":
/*!*******************************************!*\
  !*** ./src/services/membershipService.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MEMBERSHIP_PLANS": function() { return /* binding */ MEMBERSHIP_PLANS; },
/* harmony export */   "cancelMembership": function() { return /* binding */ cancelMembership; },
/* harmony export */   "checkFeatureAccess": function() { return /* binding */ checkFeatureAccess; },
/* harmony export */   "completeWechatPayment": function() { return /* binding */ completeWechatPayment; },
/* harmony export */   "getMembershipStatus": function() { return /* binding */ getMembershipStatus; },
/* harmony export */   "getOrders": function() { return /* binding */ getOrders; },
/* harmony export */   "getPetCountLimit": function() { return /* binding */ getPetCountLimit; },
/* harmony export */   "getQuotaLimit": function() { return /* binding */ getQuotaLimit; },
/* harmony export */   "isMember": function() { return /* binding */ isMember; },
/* harmony export */   "markPaywallShown": function() { return /* binding */ markPaywallShown; },
/* harmony export */   "restorePurchase": function() { return /* binding */ restorePurchase; },
/* harmony export */   "shouldShowPaywall": function() { return /* binding */ shouldShowPaywall; }
/* harmony export */ });
/* unused harmony exports MEMBERSHIP_BENEFITS, createPaymentOrder, requestWechatPayment, pollOrderStatus, confirmPayment */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/storage */ "./src/utils/storage.ts");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");






var MEMBERSHIP_KEY = 'membership';
var ORDERS_KEY = 'membership_orders';
var PAYWALL_SHOWN_KEY = 'paywall_shown';
var MEMBERSHIP_PLANS = [{
  plan: 'monthly',
  label: '月度会员',
  price: 9.9,
  originalPrice: 9.9,
  discountLabel: '',
  durationDays: 30
}, {
  plan: 'quarterly',
  label: '季度会员',
  price: 25.9,
  originalPrice: 29.7,
  discountLabel: '省3.8元',
  durationDays: 90
}, {
  plan: 'yearly',
  label: '年度会员',
  price: 88,
  originalPrice: 118.8,
  discountLabel: '省30.8元',
  durationDays: 365
}];
var MEMBERSHIP_BENEFITS = [{
  featureKey: 'pet_count',
  featureName: '宠物档案',
  freeValue: '最多2只',
  memberValue: '最多5只',
  isHighlight: false
}, {
  featureKey: 'checkin',
  featureName: '3秒健康打卡',
  freeValue: '✅',
  memberValue: '✅',
  isHighlight: false
}, {
  featureKey: 'vaccine',
  featureName: '疫苗驱虫日历',
  freeValue: '✅',
  memberValue: '✅',
  isHighlight: false
}, {
  featureKey: 'food_query',
  featureName: '食物安全查询',
  freeValue: '每日5次',
  memberValue: '不限',
  isHighlight: true
}, {
  featureKey: 'symptom_check',
  featureName: 'AI症状初筛',
  freeValue: '每日2次',
  memberValue: '不限',
  isHighlight: true
}, {
  featureKey: 'health_trend',
  featureName: '健康趋势图',
  freeValue: '7天',
  memberValue: '不限',
  isHighlight: true
}, {
  featureKey: 'health_report',
  featureName: '健康报告导出',
  freeValue: '❌',
  memberValue: '✅',
  isHighlight: false
}, {
  featureKey: 'chronic_tracking',
  featureName: '慢性病追踪',
  freeValue: '❌',
  memberValue: '✅',
  isHighlight: false
}, {
  featureKey: 'feeding_advice',
  featureName: '个性化喂养建议',
  freeValue: '❌',
  memberValue: '✅',
  isHighlight: false
}];
var FREE_QUOTA_LIMITS = {
  checkin: 5,
  food_query: 5,
  symptom_check: 2,
  health_trend: 7,
  pet_count: 2
};
var MEMBER_QUOTA_LIMITS = {
  checkin: Infinity,
  food_query: Infinity,
  symptom_check: Infinity,
  health_trend: Infinity,
  pet_count: 5
};
function userKey(userId, key) {
  return "".concat(key, "_").concat(userId);
}
function generateId() {
  return "order_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 9));
}
function getLocalMembership(userId) {
  var stored = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, MEMBERSHIP_KEY));
  if (stored) {
    if (stored.tier === 'member' && stored.expiresAt) {
      var expiresAt = new Date(stored.expiresAt).getTime();
      if (Date.now() > expiresAt) {
        var expired = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])({}, stored), {}, {
          tier: 'free',
          status: 'expired'
        });
        (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, MEMBERSHIP_KEY), expired);
        return expired;
      }
    }
    return stored;
  }
  return {
    userId: userId,
    tier: 'free',
    plan: null,
    status: 'none',
    expiresAt: null,
    startedAt: null,
    cancelledAt: null,
    paymentOrderId: null,
    price: null
  };
}
function saveLocalMembership(userId, info) {
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, MEMBERSHIP_KEY), info);
}
function getLocalOrders(userId) {
  return (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, ORDERS_KEY)) || [];
}
function saveLocalOrders(userId, orders) {
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, ORDERS_KEY), orders);
}
function getMembershipStatus(_x) {
  return _getMembershipStatus.apply(this, arguments);
}
function _getMembershipStatus() {
  _getMembershipStatus = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee(userId) {
    var result, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (userId) {
            _context.n = 1;
            break;
          }
          throw new Error('[MembershipService] userId is required');
        case 1:
          _context.p = 1;
          _context.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/membership');
        case 2:
          result = _context.v;
          saveLocalMembership(userId, result);
          return _context.a(2, result);
        case 3:
          _context.p = 3;
          _t = _context.v;
          return _context.a(2, getLocalMembership(userId));
      }
    }, _callee, null, [[1, 3]]);
  }));
  return _getMembershipStatus.apply(this, arguments);
}
function isMember(_x2) {
  return _isMember.apply(this, arguments);
}
function _isMember() {
  _isMember = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee2(userId) {
    var info;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          _context2.n = 1;
          return getMembershipStatus(userId);
        case 1:
          info = _context2.v;
          return _context2.a(2, info.tier === 'member' && info.status === 'active');
      }
    }, _callee2);
  }));
  return _isMember.apply(this, arguments);
}
function getQuotaLimit(_x3, _x4) {
  return _getQuotaLimit.apply(this, arguments);
}
function _getQuotaLimit() {
  _getQuotaLimit = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee3(featureKey, userId) {
    var _limits$featureKey;
    var memberFlag, limits;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          _context3.n = 1;
          return isMember(userId);
        case 1:
          memberFlag = _context3.v;
          limits = memberFlag ? MEMBER_QUOTA_LIMITS : FREE_QUOTA_LIMITS;
          return _context3.a(2, (_limits$featureKey = limits[featureKey]) !== null && _limits$featureKey !== void 0 ? _limits$featureKey : 0);
      }
    }, _callee3);
  }));
  return _getQuotaLimit.apply(this, arguments);
}
function getPetCountLimit(_x5) {
  return _getPetCountLimit.apply(this, arguments);
}
function _getPetCountLimit() {
  _getPetCountLimit = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee4(userId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context4) {
      while (1) switch (_context4.n) {
        case 0:
          return _context4.a(2, getQuotaLimit('pet_count', userId));
      }
    }, _callee4);
  }));
  return _getPetCountLimit.apply(this, arguments);
}
function createPaymentOrder(_x6, _x7) {
  return _createPaymentOrder.apply(this, arguments);
}
function _createPaymentOrder() {
  _createPaymentOrder = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee5(userId, plan) {
    var productId, result, orders, order, planConfig, orderId, _result, _orders, _order, _t2;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context5) {
      while (1) switch (_context5.p = _context5.n) {
        case 0:
          if (userId) {
            _context5.n = 1;
            break;
          }
          throw new Error('[MembershipService] userId is required');
        case 1:
          productId = "membership_".concat(plan);
          _context5.p = 2;
          _context5.n = 3;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.post('/orders', {
            productId: productId,
            channel: 'wechat'
          });
        case 3:
          result = _context5.v;
          // 保存订单到本地
          orders = getLocalOrders(userId);
          order = {
            id: result.orderId,
            userId: userId,
            plan: plan,
            amount: result.amount,
            status: 'pending',
            channel: 'wechat',
            createdAt: result.createdAt,
            paidAt: null
          };
          orders.unshift(order);
          saveLocalOrders(userId, orders);
          return _context5.a(2, result);
        case 4:
          _context5.p = 4;
          _t2 = _context5.v;
          // 离线模式：生成本地订单
          planConfig = MEMBERSHIP_PLANS.find(function (p) {
            return p.plan === plan;
          });
          orderId = generateId();
          _result = {
            orderId: orderId,
            amount: (planConfig === null || planConfig === void 0 ? void 0 : planConfig.price) || 0,
            channel: 'wechat',
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          _orders = getLocalOrders(userId);
          _order = {
            id: orderId,
            userId: userId,
            plan: plan,
            amount: _result.amount,
            status: 'pending',
            channel: 'wechat',
            createdAt: _result.createdAt,
            paidAt: null
          };
          _orders.unshift(_order);
          saveLocalOrders(userId, _orders);
          return _context5.a(2, _result);
      }
    }, _callee5, null, [[2, 4]]);
  }));
  return _createPaymentOrder.apply(this, arguments);
}
function requestWechatPayment(_x8) {
  return _requestWechatPayment.apply(this, arguments);
}

/**
 * 完整的微信支付流程
 * 1. 创建订单 → 2. 发起支付 → 3. 轮询结果 → 4. 确认支付
 */
function _requestWechatPayment() {
  _requestWechatPayment = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee6(params) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context6) {
      while (1) switch (_context6.n) {
        case 0:
          return _context6.a(2, new Promise(function (resolve) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().requestPayment({
              timeStamp: params.timeStamp,
              nonceStr: params.nonceStr,
              package: params.package,
              signType: params.signType,
              paySign: params.paySign,
              success: function success() {
                return resolve(true);
              },
              fail: function fail(err) {
                var _err$errMsg;
                if ((_err$errMsg = err.errMsg) !== null && _err$errMsg !== void 0 && _err$errMsg.includes('cancel')) {
                  resolve(false);
                } else {
                  resolve(false);
                }
              },
              complete: function complete() {
                // 支付完成后的清理工作
              }
            });
          }));
      }
    }, _callee6);
  }));
  return _requestWechatPayment.apply(this, arguments);
}
function completeWechatPayment(_x9, _x0) {
  return _completeWechatPayment.apply(this, arguments);
}
function _completeWechatPayment() {
  _completeWechatPayment = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee7(userId, plan) {
    var order, paid, paymentStatus, _t3;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context7) {
      while (1) switch (_context7.p = _context7.n) {
        case 0:
          _context7.p = 0;
          _context7.n = 1;
          return createPaymentOrder(userId, plan);
        case 1:
          order = _context7.v;
          if (order.paymentParams) {
            _context7.n = 2;
            break;
          }
          return _context7.a(2, {
            success: false,
            error: '获取支付参数失败'
          });
        case 2:
          _context7.n = 3;
          return requestWechatPayment(order.paymentParams);
        case 3:
          paid = _context7.v;
          if (paid) {
            _context7.n = 4;
            break;
          }
          return _context7.a(2, {
            success: false,
            error: '用户取消支付'
          });
        case 4:
          _context7.n = 5;
          return pollOrderStatus(order.orderId);
        case 5:
          paymentStatus = _context7.v;
          if (!(paymentStatus === 'success' || paymentStatus === 'paid')) {
            _context7.n = 7;
            break;
          }
          _context7.n = 6;
          return confirmPayment(userId, order.orderId);
        case 6:
          return _context7.a(2, {
            success: true,
            orderId: order.orderId
          });
        case 7:
          return _context7.a(2, {
            success: false,
            error: "\u652F\u4ED8\u72B6\u6001\u5F02\u5E38: ".concat(paymentStatus)
          });
        case 8:
          _context7.p = 8;
          _t3 = _context7.v;
          return _context7.a(2, {
            success: false,
            error: _t3 instanceof Error ? _t3.message : '支付流程异常'
          });
      }
    }, _callee7, null, [[0, 8]]);
  }));
  return _completeWechatPayment.apply(this, arguments);
}
function pollOrderStatus(_x1) {
  return _pollOrderStatus.apply(this, arguments);
}
function _pollOrderStatus() {
  _pollOrderStatus = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee8(orderId) {
    var maxAttempts,
      interval,
      i,
      order,
      _args8 = arguments,
      _t4;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context8) {
      while (1) switch (_context8.p = _context8.n) {
        case 0:
          maxAttempts = _args8.length > 1 && _args8[1] !== undefined ? _args8[1] : 10;
          interval = _args8.length > 2 && _args8[2] !== undefined ? _args8[2] : 2000;
          i = 0;
        case 1:
          if (!(i < maxAttempts)) {
            _context8.n = 9;
            break;
          }
          _context8.p = 2;
          _context8.n = 3;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.get("/orders/".concat(orderId));
        case 3:
          order = _context8.v;
          if (!(order.status === 'success' || order.status === 'paid')) {
            _context8.n = 4;
            break;
          }
          return _context8.a(2, 'success');
        case 4:
          if (!(order.status === 'failed' || order.status === 'refunded')) {
            _context8.n = 5;
            break;
          }
          return _context8.a(2, order.status);
        case 5:
          _context8.n = 7;
          break;
        case 6:
          _context8.p = 6;
          _t4 = _context8.v;
        case 7:
          _context8.n = 8;
          return new Promise(function (resolve) {
            return setTimeout(resolve, interval);
          });
        case 8:
          i++;
          _context8.n = 1;
          break;
        case 9:
          return _context8.a(2, 'pending');
      }
    }, _callee8, null, [[2, 6]]);
  }));
  return _pollOrderStatus.apply(this, arguments);
}
function confirmPayment(_x10, _x11) {
  return _confirmPayment.apply(this, arguments);
}
function _confirmPayment() {
  _confirmPayment = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee9(userId, orderId) {
    var result;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context9) {
      while (1) switch (_context9.n) {
        case 0:
          if (userId) {
            _context9.n = 1;
            break;
          }
          throw new Error('[MembershipService] userId is required');
        case 1:
          _context9.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.post('/membership/payment-callback', {
            orderId: orderId
          });
        case 2:
          result = _context9.v;
          saveLocalMembership(userId, result);
          return _context9.a(2, result);
      }
    }, _callee9);
  }));
  return _confirmPayment.apply(this, arguments);
}
function cancelMembership(_x12) {
  return _cancelMembership.apply(this, arguments);
}
function _cancelMembership() {
  _cancelMembership = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee0(userId) {
    var result, info, updated, _t5;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context0) {
      while (1) switch (_context0.p = _context0.n) {
        case 0:
          if (userId) {
            _context0.n = 1;
            break;
          }
          throw new Error('[MembershipService] userId is required');
        case 1:
          _context0.p = 1;
          _context0.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.post('/membership/cancel', {});
        case 2:
          result = _context0.v;
          saveLocalMembership(userId, result);
          return _context0.a(2, result);
        case 3:
          _context0.p = 3;
          _t5 = _context0.v;
          info = getLocalMembership(userId);
          if (!(info.tier !== 'member')) {
            _context0.n = 4;
            break;
          }
          throw new Error('[MembershipService] Not a member');
        case 4:
          updated = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])({}, info), {}, {
            cancelledAt: new Date().toISOString()
          });
          saveLocalMembership(userId, updated);
          return _context0.a(2, updated);
      }
    }, _callee0, null, [[1, 3]]);
  }));
  return _cancelMembership.apply(this, arguments);
}
function restorePurchase(_x13) {
  return _restorePurchase.apply(this, arguments);
}
function _restorePurchase() {
  _restorePurchase = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee1(userId) {
    var result, _t6;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context1) {
      while (1) switch (_context1.p = _context1.n) {
        case 0:
          if (userId) {
            _context1.n = 1;
            break;
          }
          throw new Error('[MembershipService] userId is required');
        case 1:
          _context1.p = 1;
          _context1.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.post('/membership/restore', {});
        case 2:
          result = _context1.v;
          saveLocalMembership(userId, result);
          return _context1.a(2, result);
        case 3:
          _context1.p = 3;
          _t6 = _context1.v;
          return _context1.a(2, getLocalMembership(userId));
      }
    }, _callee1, null, [[1, 3]]);
  }));
  return _restorePurchase.apply(this, arguments);
}
function getOrders(_x14) {
  return _getOrders.apply(this, arguments);
}
function _getOrders() {
  _getOrders = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee10(userId) {
    var result, _t7;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context10) {
      while (1) switch (_context10.p = _context10.n) {
        case 0:
          if (userId) {
            _context10.n = 1;
            break;
          }
          throw new Error('[MembershipService] userId is required');
        case 1:
          _context10.p = 1;
          _context10.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/membership/orders');
        case 2:
          result = _context10.v;
          saveLocalOrders(userId, result);
          return _context10.a(2, result);
        case 3:
          _context10.p = 3;
          _t7 = _context10.v;
          return _context10.a(2, getLocalOrders(userId));
      }
    }, _callee10, null, [[1, 3]]);
  }));
  return _getOrders.apply(this, arguments);
}
function shouldShowPaywall(_x15, _x16) {
  return _shouldShowPaywall.apply(this, arguments);
}
function _shouldShowPaywall() {
  _shouldShowPaywall = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee11(userId, featureKey) {
    var memberFlag, todayKey, shownKey, shown;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context11) {
      while (1) switch (_context11.n) {
        case 0:
          if (userId) {
            _context11.n = 1;
            break;
          }
          return _context11.a(2, false);
        case 1:
          _context11.n = 2;
          return isMember(userId);
        case 2:
          memberFlag = _context11.v;
          if (!memberFlag) {
            _context11.n = 3;
            break;
          }
          return _context11.a(2, false);
        case 3:
          todayKey = new Date().toISOString().slice(0, 10);
          shownKey = userKey(userId, "".concat(PAYWALL_SHOWN_KEY, "_").concat(featureKey, "_").concat(todayKey));
          shown = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(shownKey);
          return _context11.a(2, !shown);
      }
    }, _callee11);
  }));
  return _shouldShowPaywall.apply(this, arguments);
}
function markPaywallShown(_x17, _x18) {
  return _markPaywallShown.apply(this, arguments);
}
function _markPaywallShown() {
  _markPaywallShown = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee12(userId, featureKey) {
    var todayKey, shownKey;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context12) {
      while (1) switch (_context12.n) {
        case 0:
          todayKey = new Date().toISOString().slice(0, 10);
          shownKey = userKey(userId, "".concat(PAYWALL_SHOWN_KEY, "_").concat(featureKey, "_").concat(todayKey));
          (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(shownKey, true);
        case 1:
          return _context12.a(2);
      }
    }, _callee12);
  }));
  return _markPaywallShown.apply(this, arguments);
}
function checkFeatureAccess(_x19, _x20) {
  return _checkFeatureAccess.apply(this, arguments);
}
function _checkFeatureAccess() {
  _checkFeatureAccess = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee13(userId, featureKey) {
    var result, _FREE_QUOTA_LIMITS$fe, _getStorage, memberFlag, limit, todayKey, usageKey, usedToday, remaining, _t8;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context13) {
      while (1) switch (_context13.p = _context13.n) {
        case 0:
          if (userId) {
            _context13.n = 1;
            break;
          }
          throw new Error('[MembershipService] userId is required');
        case 1:
          _context13.p = 1;
          _context13.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.get("/quotas/check?featureKey=".concat(featureKey));
        case 2:
          result = _context13.v;
          return _context13.a(2, result);
        case 3:
          _context13.p = 3;
          _t8 = _context13.v;
          _context13.n = 4;
          return isMember(userId);
        case 4:
          memberFlag = _context13.v;
          if (!memberFlag) {
            _context13.n = 5;
            break;
          }
          return _context13.a(2, {
            allowed: true,
            remaining: Infinity,
            isMember: true
          });
        case 5:
          limit = (_FREE_QUOTA_LIMITS$fe = FREE_QUOTA_LIMITS[featureKey]) !== null && _FREE_QUOTA_LIMITS$fe !== void 0 ? _FREE_QUOTA_LIMITS$fe : 0;
          if (!(limit === 0)) {
            _context13.n = 6;
            break;
          }
          return _context13.a(2, {
            allowed: false,
            remaining: 0,
            isMember: false
          });
        case 6:
          todayKey = new Date().toISOString().slice(0, 10);
          usageKey = userKey(userId, "quota_".concat(featureKey, "_").concat(todayKey));
          usedToday = (_getStorage = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(usageKey)) !== null && _getStorage !== void 0 ? _getStorage : 0;
          remaining = Math.max(0, limit - usedToday);
          return _context13.a(2, {
            allowed: remaining > 0,
            remaining: remaining,
            isMember: false
          });
      }
    }, _callee13, null, [[1, 3]]);
  }));
  return _checkFeatureAccess.apply(this, arguments);
}

/***/ }),

/***/ "./src/services/mock.ts":
/*!******************************!*\
  !*** ./src/services/mock.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mockApi": function() { return /* binding */ mockApi; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");






var mockUsers = [{
  id: 'user_001',
  nickname: '宠物家长',
  avatar: 'https://via.placeholder.com/100',
  phone: '13800138000',
  createdAt: '2024-01-01T00:00:00Z'
}];
var mockPets = [{
  id: 'pet_001',
  userId: 'user_001',
  name: '小橘',
  species: 'cat',
  breed: '橘猫',
  gender: 'male',
  birthday: '2023-06-15',
  weight: 5.2,
  avatar: 'https://via.placeholder.com/100',
  isDeceased: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z'
}, {
  id: 'pet_002',
  userId: 'user_001',
  name: '旺财',
  species: 'dog',
  breed: '金毛',
  gender: 'male',
  birthday: '2022-03-10',
  weight: 28.5,
  avatar: 'https://via.placeholder.com/100',
  isDeceased: false,
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z'
}];
var mockCheckins = [{
  id: 'ck_001',
  petId: 'pet_001',
  userId: 'user_001',
  date: '2024-07-22',
  mood: 'happy',
  appetite: 'good',
  stool: 'normal',
  weight: 5.2,
  note: '今天精神很好',
  createdAt: '2024-07-22T08:00:00Z'
}, {
  id: 'ck_002',
  petId: 'pet_001',
  userId: 'user_001',
  date: '2024-07-21',
  mood: 'normal',
  appetite: 'normal',
  stool: 'normal',
  createdAt: '2024-07-21T08:00:00Z'
}, {
  id: 'ck_003',
  petId: 'pet_002',
  userId: 'user_001',
  date: '2024-07-22',
  mood: 'happy',
  appetite: 'good',
  stool: 'normal',
  weight: 28.5,
  createdAt: '2024-07-22T08:00:00Z'
}];
function generateMockHealthEntries() {
  var now = new Date();
  var entries = [];
  var petId = 'pet_001';
  for (var i = 0; i < 60; i++) {
    var date = new Date(now);
    date.setDate(date.getDate() - i);
    var appetiteLevel = i % 10 === 0 ? 1 : i % 8 === 0 ? 6 : i % 5 === 0 ? 2 : 3;
    var spiritLevel = i % 12 === 0 ? 1 : i % 7 === 0 ? 2 : i % 6 === 0 ? 5 : 4;
    var poopLevel = i % 15 === 0 ? 1 : i % 10 === 0 ? 2 : i % 7 === 0 ? 4 : 3;
    var exerciseLevel = i % 5 === 0 ? 1 : i % 4 === 0 ? 3 : 2;
    var weightBase = 5.2;
    var weightVariation = Math.sin(i * 0.3) * 0.15 + (i < 30 ? 0 : (i - 30) * 0.01);
    var weight = parseFloat((weightBase + weightVariation).toFixed(2));
    var hasAnomaly = appetiteLevel <= 2 || spiritLevel <= 2 || poopLevel <= 2;
    var anomalyItems = [];
    if (appetiteLevel <= 2) anomalyItems.push('appetite');
    if (spiritLevel <= 2) anomalyItems.push('spirit');
    if (poopLevel <= 2) anomalyItems.push('poop');
    var riskLevel = 'low';
    if (poopLevel === 1 || appetiteLevel === 6 || appetiteLevel === 1 && spiritLevel === 1) {
      riskLevel = 'emergency';
    } else if (appetiteLevel <= 2 && spiritLevel <= 2) {
      riskLevel = 'high';
    } else if (appetiteLevel <= 2 || poopLevel <= 2 || hasAnomaly) {
      riskLevel = 'medium';
    }
    entries.push({
      id: "he_".concat(String(i).padStart(3, '0')),
      petId: petId,
      userId: 'user_001',
      appetiteLevel: appetiteLevel,
      spiritLevel: spiritLevel,
      poopLevel: poopLevel,
      exerciseLevel: exerciseLevel,
      weight: weight,
      hasAnomaly: hasAnomaly,
      anomalyItems: anomalyItems,
      riskLevel: riskLevel,
      note: i % 5 === 0 ? '今日状态记录' : undefined,
      createdAt: date
    });
  }
  return entries;
}
var mockHealthEntries = generateMockHealthEntries();
var mockMemberships = [{
  id: 'mem_001',
  userId: 'user_001',
  level: 'free',
  status: 'active',
  startDate: '2024-01-01',
  endDate: '2099-12-31',
  createdAt: '2024-01-01T00:00:00Z'
}];
var mockFamilies = [{
  id: 'fam_001',
  userId: 'user_001',
  name: '星澜小筑',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z'
}];
var mockFamilyMembers = [{
  id: 'fmem_001',
  familyId: 'fam_001',
  petId: 'pet_001',
  role: '老大',
  joinedAt: '2024-01-01T00:00:00Z'
}, {
  id: 'fmem_002',
  familyId: 'fam_001',
  petId: 'pet_002',
  role: '团宠',
  joinedAt: '2024-02-01T00:00:00Z'
}];
var mockFamilyPhotos = [{
  id: 'fph_001',
  familyId: 'fam_001',
  userId: 'user_001',
  photoUrl: '',
  photoType: 'generated',
  memberCount: 2,
  memberNames: ['小橘', '旺财'],
  createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
}, {
  id: 'fph_002',
  familyId: 'fam_001',
  userId: 'user_001',
  photoUrl: '',
  photoType: 'uploaded',
  description: '小橘第一次洗澡的搞笑瞬间',
  memberCount: 1,
  memberNames: ['小橘'],
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
}];
var mockLineages = [];
function generateMockMoments() {
  var now = new Date();
  var moments = [{
    id: 'mom_001',
    userId: 'user_001',
    familyId: 'fam_001',
    petId: 'pet_001',
    type: 'checkin',
    content: {
      petName: '小橘',
      petEmoji: '🐱',
      action: '完成了今日健康打卡',
      appetite: '胃口很好',
      mood: '精神饱满',
      score: 95
    },
    createdAt: new Date(now.getTime() - 2 * 3600000).toISOString()
  }, {
    id: 'mom_002',
    userId: 'user_001',
    familyId: 'fam_001',
    petId: 'pet_002',
    type: 'checkin',
    content: {
      petName: '旺财',
      petEmoji: '🐕',
      action: '完成了今日健康打卡',
      appetite: '正常',
      mood: '活泼',
      score: 88
    },
    createdAt: new Date(now.getTime() - 5 * 3600000).toISOString()
  }, {
    id: 'mom_003',
    userId: 'user_001',
    familyId: 'fam_001',
    petId: 'pet_001',
    type: 'milestone',
    content: {
      petName: '小橘',
      petEmoji: '🐱',
      title: '小橘满1岁了！',
      description: '从一只小奶猫成长为亭亭玉立的大猫咪'
    },
    photos: ['https://via.placeholder.com/400x300/FFE4C4/333?text=小橘1岁'],
    createdAt: new Date(now.getTime() - 24 * 3600000).toISOString()
  }, {
    id: 'mom_004',
    userId: 'user_001',
    familyId: 'fam_001',
    petId: 'pet_002',
    type: 'photo',
    content: {
      petName: '旺财',
      petEmoji: '🐕',
      description: '带旺财去公园散步，遇到了好多小伙伴'
    },
    photos: ['https://via.placeholder.com/400x300/98FB98/333?text=公园散步'],
    createdAt: new Date(now.getTime() - 36 * 3600000).toISOString()
  }, {
    id: 'mom_005',
    userId: 'user_001',
    familyId: 'fam_001',
    petId: 'pet_001',
    type: 'memory',
    content: {
      petName: '小橘',
      petEmoji: '🐱',
      description: '一年前的今天，小橘第一次来到家里，躲在沙发下面不敢出来'
    },
    createdAt: new Date(now.getTime() - 48 * 3600000).toISOString()
  }, {
    id: 'mom_006',
    userId: 'user_001',
    familyId: 'fam_001',
    petId: 'pet_002',
    type: 'milestone',
    content: {
      petName: '旺财',
      petEmoji: '🐕',
      title: '学会新技能：握手',
      description: '旺财今天学会了握手，聪明的小家伙！'
    },
    createdAt: new Date(now.getTime() - 60 * 3600000).toISOString()
  }, {
    id: 'mom_007',
    userId: 'user_001',
    familyId: 'fam_001',
    petId: 'pet_001',
    type: 'checkin',
    content: {
      petName: '小橘',
      petEmoji: '🐱',
      action: '体重突破5kg',
      appetite: '吃得有点多',
      mood: '懒洋洋',
      score: 78
    },
    createdAt: new Date(now.getTime() - 72 * 3600000).toISOString()
  }, {
    id: 'mom_008',
    userId: 'user_001',
    familyId: 'fam_001',
    petId: 'pet_002',
    type: 'photo',
    content: {
      petName: '旺财',
      petEmoji: '🐕',
      description: '旺财的新玩具，玩得不亦乐乎'
    },
    photos: ['https://via.placeholder.com/400x300/FFD700/333?text=新玩具'],
    createdAt: new Date(now.getTime() - 96 * 3600000).toISOString()
  }];
  return moments;
}
var mockMoments = generateMockMoments();
var delay = 300;
function wait(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms !== null && ms !== void 0 ? ms : delay);
  });
}
var mockApi = {
  login: function () {
    var _login = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee(code) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return wait();
          case 1:
            return _context.a(2, {
              user: mockUsers[0],
              token: 'mock_token_' + Date.now(),
              refreshToken: 'mock_refresh_' + Date.now()
            });
        }
      }, _callee);
    }));
    function login(_x) {
      return _login.apply(this, arguments);
    }
    return login;
  }(),
  getUser: function () {
    var _getUser = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee2() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            _context2.n = 1;
            return wait();
          case 1:
            return _context2.a(2, mockUsers[0]);
        }
      }, _callee2);
    }));
    function getUser() {
      return _getUser.apply(this, arguments);
    }
    return getUser;
  }(),
  getPets: function () {
    var _getPets = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee3(userId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            _context3.n = 1;
            return wait();
          case 1:
            return _context3.a(2, mockPets.filter(function (p) {
              return p.userId === userId;
            }));
        }
      }, _callee3);
    }));
    function getPets(_x2) {
      return _getPets.apply(this, arguments);
    }
    return getPets;
  }(),
  getPet: function () {
    var _getPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee4(petId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            _context4.n = 1;
            return wait();
          case 1:
            return _context4.a(2, mockPets.find(function (p) {
              return p.id === petId;
            }) || null);
        }
      }, _callee4);
    }));
    function getPet(_x3) {
      return _getPet.apply(this, arguments);
    }
    return getPet;
  }(),
  createPet: function () {
    var _createPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee5(data) {
      var pet;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context5) {
        while (1) switch (_context5.n) {
          case 0:
            _context5.n = 1;
            return wait();
          case 1:
            pet = {
              id: 'pet_' + Date.now(),
              userId: 'user_001',
              name: data.name || '',
              species: data.species || 'cat',
              breed: data.breed || '',
              gender: data.gender || 'male',
              birthday: data.birthday || '',
              weight: data.weight || 0,
              avatar: data.avatar || '',
              isDeceased: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            mockPets.push(pet);
            return _context5.a(2, pet);
        }
      }, _callee5);
    }));
    function createPet(_x4) {
      return _createPet.apply(this, arguments);
    }
    return createPet;
  }(),
  updatePet: function () {
    var _updatePet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee6(petId, data) {
      var idx;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context6) {
        while (1) switch (_context6.n) {
          case 0:
            _context6.n = 1;
            return wait();
          case 1:
            idx = mockPets.findIndex(function (p) {
              return p.id === petId;
            });
            if (!(idx === -1)) {
              _context6.n = 2;
              break;
            }
            throw new Error('Pet not found');
          case 2:
            mockPets[idx] = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])({}, mockPets[idx]), data), {}, {
              updatedAt: new Date().toISOString()
            });
            return _context6.a(2, mockPets[idx]);
        }
      }, _callee6);
    }));
    function updatePet(_x5, _x6) {
      return _updatePet.apply(this, arguments);
    }
    return updatePet;
  }(),
  deletePet: function () {
    var _deletePet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee7(petId) {
      var idx;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context7) {
        while (1) switch (_context7.n) {
          case 0:
            _context7.n = 1;
            return wait();
          case 1:
            idx = mockPets.findIndex(function (p) {
              return p.id === petId;
            });
            if (idx !== -1) mockPets.splice(idx, 1);
          case 2:
            return _context7.a(2);
        }
      }, _callee7);
    }));
    function deletePet(_x7) {
      return _deletePet.apply(this, arguments);
    }
    return deletePet;
  }(),
  getCheckins: function () {
    var _getCheckins = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee8(petId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context8) {
        while (1) switch (_context8.n) {
          case 0:
            _context8.n = 1;
            return wait();
          case 1:
            return _context8.a(2, mockCheckins.filter(function (c) {
              return c.petId === petId;
            }).sort(function (a, b) {
              return b.date.localeCompare(a.date);
            }));
        }
      }, _callee8);
    }));
    function getCheckins(_x8) {
      return _getCheckins.apply(this, arguments);
    }
    return getCheckins;
  }(),
  createCheckin: function () {
    var _createCheckin = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee9(data) {
      var checkin;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context9) {
        while (1) switch (_context9.n) {
          case 0:
            _context9.n = 1;
            return wait();
          case 1:
            checkin = {
              id: 'ck_' + Date.now(),
              petId: data.petId || '',
              userId: 'user_001',
              date: data.date || new Date().toISOString().split('T')[0],
              mood: data.mood || 'normal',
              appetite: data.appetite || 'normal',
              stool: data.stool || 'normal',
              weight: data.weight,
              temperature: data.temperature,
              note: data.note,
              createdAt: new Date().toISOString()
            };
            mockCheckins.push(checkin);
            return _context9.a(2, checkin);
        }
      }, _callee9);
    }));
    function createCheckin(_x9) {
      return _createCheckin.apply(this, arguments);
    }
    return createCheckin;
  }(),
  getMembership: function () {
    var _getMembership = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee0(userId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context0) {
        while (1) switch (_context0.n) {
          case 0:
            _context0.n = 1;
            return wait();
          case 1:
            return _context0.a(2, mockMemberships.find(function (m) {
              return m.userId === userId;
            }) || null);
        }
      }, _callee0);
    }));
    function getMembership(_x0) {
      return _getMembership.apply(this, arguments);
    }
    return getMembership;
  }(),
  // --- Family mock APIs ---
  getFamilies: function () {
    var _getFamilies = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee1() {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context1) {
        while (1) switch (_context1.n) {
          case 0:
            _context1.n = 1;
            return wait();
          case 1:
            return _context1.a(2, [].concat(mockFamilies));
        }
      }, _callee1);
    }));
    function getFamilies() {
      return _getFamilies.apply(this, arguments);
    }
    return getFamilies;
  }(),
  createFamily: function () {
    var _createFamily = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee10(name) {
      var family;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context10) {
        while (1) switch (_context10.n) {
          case 0:
            _context10.n = 1;
            return wait();
          case 1:
            family = {
              id: 'fam_' + Date.now(),
              userId: 'user_001',
              name: name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            mockFamilies.push(family);
            return _context10.a(2, family);
        }
      }, _callee10);
    }));
    function createFamily(_x1) {
      return _createFamily.apply(this, arguments);
    }
    return createFamily;
  }(),
  getMembers: function () {
    var _getMembers = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee11(familyId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context11) {
        while (1) switch (_context11.n) {
          case 0:
            _context11.n = 1;
            return wait();
          case 1:
            return _context11.a(2, mockFamilyMembers.filter(function (m) {
              return m.familyId === familyId;
            }));
        }
      }, _callee11);
    }));
    function getMembers(_x10) {
      return _getMembers.apply(this, arguments);
    }
    return getMembers;
  }(),
  addMember: function () {
    var _addMember = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee12(familyId, petId, role) {
      var member;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context12) {
        while (1) switch (_context12.n) {
          case 0:
            _context12.n = 1;
            return wait();
          case 1:
            member = {
              id: 'fmem_' + Date.now(),
              familyId: familyId,
              petId: petId,
              role: role,
              joinedAt: new Date().toISOString()
            };
            mockFamilyMembers.push(member);
          case 2:
            return _context12.a(2);
        }
      }, _callee12);
    }));
    function addMember(_x11, _x12, _x13) {
      return _addMember.apply(this, arguments);
    }
    return addMember;
  }(),
  removeMember: function () {
    var _removeMember = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee13(familyId, memberId) {
      var idx;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context13) {
        while (1) switch (_context13.n) {
          case 0:
            _context13.n = 1;
            return wait();
          case 1:
            idx = mockFamilyMembers.findIndex(function (m) {
              return m.familyId === familyId && m.id === memberId;
            });
            if (idx !== -1) mockFamilyMembers.splice(idx, 1);
          case 2:
            return _context13.a(2);
        }
      }, _callee13);
    }));
    function removeMember(_x14, _x15) {
      return _removeMember.apply(this, arguments);
    }
    return removeMember;
  }(),
  updateMemberRole: function () {
    var _updateMemberRole = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee14(familyId, memberId, role) {
      var member;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context14) {
        while (1) switch (_context14.n) {
          case 0:
            _context14.n = 1;
            return wait();
          case 1:
            member = mockFamilyMembers.find(function (m) {
              return m.familyId === familyId && m.id === memberId;
            });
            if (member) member.role = role;
          case 2:
            return _context14.a(2);
        }
      }, _callee14);
    }));
    function updateMemberRole(_x16, _x17, _x18) {
      return _updateMemberRole.apply(this, arguments);
    }
    return updateMemberRole;
  }(),
  getLineage: function () {
    var _getLineage = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee15(petId) {
      var parents, children;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context15) {
        while (1) switch (_context15.n) {
          case 0:
            _context15.n = 1;
            return wait();
          case 1:
            parents = mockLineages.filter(function (l) {
              return l.childId === petId;
            });
            children = mockLineages.filter(function (l) {
              return l.parentId === petId;
            });
            return _context15.a(2, {
              parents: parents,
              children: children
            });
        }
      }, _callee15);
    }));
    function getLineage(_x19) {
      return _getLineage.apply(this, arguments);
    }
    return getLineage;
  }(),
  addLineage: function () {
    var _addLineage = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee16(parentId, childId, litterDate) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context16) {
        while (1) switch (_context16.n) {
          case 0:
            _context16.n = 1;
            return wait();
          case 1:
            mockLineages.push({
              id: 'lin_' + Date.now(),
              parentId: parentId,
              childId: childId,
              litterDate: litterDate
            });
          case 2:
            return _context16.a(2);
        }
      }, _callee16);
    }));
    function addLineage(_x20, _x21, _x22) {
      return _addLineage.apply(this, arguments);
    }
    return addLineage;
  }(),
  removeLineage: function () {
    var _removeLineage = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee17(lineageId) {
      var idx;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context17) {
        while (1) switch (_context17.n) {
          case 0:
            _context17.n = 1;
            return wait();
          case 1:
            idx = mockLineages.findIndex(function (l) {
              return l.id === lineageId;
            });
            if (idx !== -1) mockLineages.splice(idx, 1);
          case 2:
            return _context17.a(2);
        }
      }, _callee17);
    }));
    function removeLineage(_x23) {
      return _removeLineage.apply(this, arguments);
    }
    return removeLineage;
  }(),
  getFamilyPhotos: function () {
    var _getFamilyPhotos = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee18(familyId) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context18) {
        while (1) switch (_context18.n) {
          case 0:
            _context18.n = 1;
            return wait();
          case 1:
            return _context18.a(2, mockFamilyPhotos.filter(function (p) {
              return p.familyId === familyId;
            }).sort(function (a, b) {
              return b.createdAt.localeCompare(a.createdAt);
            }));
        }
      }, _callee18);
    }));
    function getFamilyPhotos(_x24) {
      return _getFamilyPhotos.apply(this, arguments);
    }
    return getFamilyPhotos;
  }(),
  saveFamilyPhoto: function () {
    var _saveFamilyPhoto = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee19(familyId, photoUrl, memberCount, memberNames) {
      var photoType,
        description,
        photo,
        _args19 = arguments;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context19) {
        while (1) switch (_context19.n) {
          case 0:
            photoType = _args19.length > 4 && _args19[4] !== undefined ? _args19[4] : 'generated';
            description = _args19.length > 5 ? _args19[5] : undefined;
            _context19.n = 1;
            return wait();
          case 1:
            photo = {
              id: 'fph_' + Date.now(),
              familyId: familyId,
              userId: 'user_001',
              photoUrl: photoUrl,
              photoType: photoType,
              description: description,
              memberCount: memberCount,
              memberNames: memberNames,
              createdAt: new Date().toISOString()
            };
            mockFamilyPhotos.push(photo);
            return _context19.a(2, photo);
        }
      }, _callee19);
    }));
    function saveFamilyPhoto(_x25, _x26, _x27, _x28) {
      return _saveFamilyPhoto.apply(this, arguments);
    }
    return saveFamilyPhoto;
  }(),
  deleteFamilyPhoto: function () {
    var _deleteFamilyPhoto = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee20(photoId) {
      var idx;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context20) {
        while (1) switch (_context20.n) {
          case 0:
            _context20.n = 1;
            return wait();
          case 1:
            idx = mockFamilyPhotos.findIndex(function (p) {
              return p.id === photoId;
            });
            if (idx !== -1) mockFamilyPhotos.splice(idx, 1);
          case 2:
            return _context20.a(2);
        }
      }, _callee20);
    }));
    function deleteFamilyPhoto(_x29) {
      return _deleteFamilyPhoto.apply(this, arguments);
    }
    return deleteFamilyPhoto;
  }(),
  getHealthCheckinsByDateRange: function () {
    var _getHealthCheckinsByDateRange = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee21(petId, startDate, endDate) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context21) {
        while (1) switch (_context21.n) {
          case 0:
            _context21.n = 1;
            return wait();
          case 1:
            return _context21.a(2, mockHealthEntries.filter(function (e) {
              var dateStr = e.createdAt instanceof Date ? e.createdAt.toISOString().slice(0, 10) : String(e.createdAt).slice(0, 10);
              return e.petId === petId && dateStr >= startDate && dateStr <= endDate;
            }));
        }
      }, _callee21);
    }));
    function getHealthCheckinsByDateRange(_x30, _x31, _x32) {
      return _getHealthCheckinsByDateRange.apply(this, arguments);
    }
    return getHealthCheckinsByDateRange;
  }(),
  getTrendData: function () {
    var _getTrendData = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee22(petId, startDate, endDate) {
      var entries;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context22) {
        while (1) switch (_context22.n) {
          case 0:
            _context22.n = 1;
            return wait(200);
          case 1:
            entries = mockHealthEntries.filter(function (e) {
              var dateStr = e.createdAt instanceof Date ? e.createdAt.toISOString().slice(0, 10) : String(e.createdAt).slice(0, 10);
              return e.petId === petId && dateStr >= startDate && dateStr <= endDate;
            });
            return _context22.a(2, entries.map(function (e) {
              return {
                date: e.createdAt instanceof Date ? e.createdAt.toISOString().slice(0, 10) : String(e.createdAt).slice(0, 10),
                weight: e.weight,
                appetite: e.appetiteLevel === 1 ? 'none' : e.appetiteLevel === 2 ? 'decreased' : e.appetiteLevel === 3 ? 'normal' : e.appetiteLevel === 4 ? 'increased' : e.appetiteLevel === 5 ? 'increased' : 'vomiting',
                energy: e.spiritLevel === 1 ? 'lethargic' : e.spiritLevel === 2 ? 'low' : e.spiritLevel === 3 ? 'normal' : e.spiritLevel === 4 ? 'normal' : 'high',
                stool: e.poopLevel === 1 ? 'bloody' : e.poopLevel === 2 ? 'diarrhea' : e.poopLevel === 3 ? 'normal' : e.poopLevel === 4 ? 'soft' : 'constipation',
                vomiting: e.appetiteLevel === 6,
                riskLevel: e.riskLevel,
                hasAbnormal: e.riskLevel !== 'low'
              };
            }));
        }
      }, _callee22);
    }));
    function getTrendData(_x33, _x34, _x35) {
      return _getTrendData.apply(this, arguments);
    }
    return getTrendData;
  }(),
  getTrendSummary: function () {
    var _getTrendSummary = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee23(petId, period) {
      var now, days, startDate, startStr, endStr, dataPoints, withWeight, sorted, weightChange, weightChangePercent, weightTrend, appetiteStats, stoolStats, _iterator, _step, dp, abnormalDays, totalDays, aiParts;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context23) {
        while (1) switch (_context23.n) {
          case 0:
            _context23.n = 1;
            return wait(300);
          case 1:
            now = new Date();
            days = 7;
            if (period === 'month') days = 30;else if (period === 'quarter') days = 90;
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - days);
            startStr = startDate.toISOString().slice(0, 10);
            endStr = now.toISOString().slice(0, 10);
            _context23.n = 2;
            return mockApi.getTrendData(petId, startStr, endStr);
          case 2:
            dataPoints = _context23.v;
            withWeight = dataPoints.filter(function (d) {
              return d.weight !== undefined && d.weight !== null;
            });
            sorted = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(withWeight).sort(function (a, b) {
              return a.date.localeCompare(b.date);
            });
            weightChange = sorted.length >= 2 ? sorted[sorted.length - 1].weight - sorted[0].weight : 0;
            weightChangePercent = sorted.length >= 2 && sorted[0].weight !== 0 ? weightChange / sorted[0].weight * 100 : 0;
            weightTrend = 'stable';
            if (weightChangePercent > 5) weightTrend = 'increasing';else if (weightChangePercent < -5) weightTrend = 'decreasing';
            appetiteStats = {
              normal: 0,
              decreased: 0,
              increased: 0,
              none: 0
            };
            stoolStats = {
              normal: 0,
              soft: 0,
              diarrhea: 0,
              constipation: 0,
              bloody: 0
            };
            _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_4__["default"])(dataPoints);
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                dp = _step.value;
                if (dp.appetite) appetiteStats[dp.appetite] = (appetiteStats[dp.appetite] || 0) + 1;
                if (dp.stool) stoolStats[dp.stool] = (stoolStats[dp.stool] || 0) + 1;
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            abnormalDays = dataPoints.filter(function (d) {
              return d.hasAbnormal;
            }).length;
            totalDays = dataPoints.length;
            aiParts = [];
            if (weightTrend === 'stable') aiParts.push('体重保持稳定，这是健康的好迹象。');else if (weightTrend === 'increasing') aiParts.push("\u4F53\u91CD\u589E\u957F".concat(weightChangePercent.toFixed(1), "%\uFF0C\u5EFA\u8BAE\u5173\u6CE8\u996E\u98DF\u548C\u8FD0\u52A8\u91CF\u3002"));else aiParts.push("\u4F53\u91CD\u4E0B\u964D".concat(Math.abs(weightChangePercent).toFixed(1), "%\uFF0C\u5EFA\u8BAE\u5BC6\u5207\u89C2\u5BDF\u3002"));
            aiParts.push('食欲整体正常，饮食状况良好。');
            aiParts.push('排便情况整体正常。');
            if (abnormalDays / totalDays < 0.1) aiParts.push('整体健康状况良好，继续保持！');
            return _context23.a(2, {
              petId: petId,
              period: period,
              weightTrend: weightTrend,
              weightChange: parseFloat(weightChange.toFixed(2)),
              weightChangePercent: parseFloat(weightChangePercent.toFixed(1)),
              appetiteStats: appetiteStats,
              stoolStats: stoolStats,
              abnormalDays: abnormalDays,
              totalDays: totalDays,
              aiAnalysis: aiParts.join('')
            });
        }
      }, _callee23);
    }));
    function getTrendSummary(_x36, _x37) {
      return _getTrendSummary.apply(this, arguments);
    }
    return getTrendSummary;
  }(),
  getMonthlyReport: function () {
    var _getMonthlyReport = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee24(petId, month) {
      var _month$split$map, _month$split$map2, year, monthNum, startDate, lastDay, endDate, summary;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context24) {
        while (1) switch (_context24.n) {
          case 0:
            _context24.n = 1;
            return wait(300);
          case 1:
            _month$split$map = month.split('-').map(Number), _month$split$map2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_month$split$map, 2), year = _month$split$map2[0], monthNum = _month$split$map2[1];
            startDate = "".concat(year, "-").concat(String(monthNum).padStart(2, '0'), "-01");
            lastDay = new Date(year, monthNum, 0).getDate();
            endDate = "".concat(year, "-").concat(String(monthNum).padStart(2, '0'), "-").concat(String(lastDay).padStart(2, '0'));
            _context24.n = 2;
            return mockApi.getTrendSummary(petId, 'month');
          case 2:
            summary = _context24.v;
            return _context24.a(2, {
              petId: petId,
              month: month,
              summary: summary,
              highlights: ['体重保持稳定', '食欲整体良好', '排便情况正常'],
              concerns: [],
              recommendations: ['建议定期进行年度体检']
            });
        }
      }, _callee24);
    }));
    function getMonthlyReport(_x38, _x39) {
      return _getMonthlyReport.apply(this, arguments);
    }
    return getMonthlyReport;
  }(),
  getMoments: function () {
    var _getMoments = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee25(familyId, limit) {
      var result;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context25) {
        while (1) switch (_context25.n) {
          case 0:
            _context25.n = 1;
            return wait(200);
          case 1:
            result = mockMoments.filter(function (m) {
              return m.familyId === familyId;
            });
            result.sort(function (a, b) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            if (limit && limit > 0) {
              result = result.slice(0, limit);
            }
            return _context25.a(2, result);
        }
      }, _callee25);
    }));
    function getMoments(_x40, _x41) {
      return _getMoments.apply(this, arguments);
    }
    return getMoments;
  }(),
  getNewMoments: function () {
    var _getNewMoments = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee26(familyId, since) {
      var sinceTime, result;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context26) {
        while (1) switch (_context26.n) {
          case 0:
            _context26.n = 1;
            return wait(150);
          case 1:
            sinceTime = new Date(since).getTime();
            result = mockMoments.filter(function (m) {
              return m.familyId === familyId && new Date(m.createdAt).getTime() > sinceTime;
            });
            result.sort(function (a, b) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            return _context26.a(2, result);
        }
      }, _callee26);
    }));
    function getNewMoments(_x42, _x43) {
      return _getNewMoments.apply(this, arguments);
    }
    return getNewMoments;
  }()
};

/***/ }),

/***/ "./src/services/namingService.ts":
/*!***************************************!*\
  !*** ./src/services/namingService.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "interpretName": function() { return /* binding */ interpretName; },
/* harmony export */   "recommendNames": function() { return /* binding */ recommendNames; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_interopRequireWildcard_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/interopRequireWildcard.js */ "./node_modules/@babel/runtime/helpers/esm/interopRequireWildcard.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _aiProvider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./aiProvider */ "./src/services/aiProvider.ts");
/* harmony import */ var _utils_ruleGuard__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/ruleGuard */ "./src/utils/ruleGuard.ts");
/* harmony import */ var _utils_authGuard__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/authGuard */ "./src/utils/authGuard.ts");






function sanitizeInput(text) {
  return text.replace(/[<>\n\r]/g, '').substring(0, 50);
}
function interpretName(_x, _x2, _x3) {
  return _interpretName.apply(this, arguments);
}
function _interpretName() {
  _interpretName = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee(name, breed, birthDate) {
    var safeName, safeBreed, safeBirthDate, ruleResult, guardResult, _yield$import, buildInterpretPrompt, prompt;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          (0,_utils_authGuard__WEBPACK_IMPORTED_MODULE_1__.requireAuth)();
          safeName = sanitizeInput(name);
          safeBreed = sanitizeInput(breed);
          safeBirthDate = sanitizeInput(birthDate);
          ruleResult = (0,_utils_ruleGuard__WEBPACK_IMPORTED_MODULE_4__.checkInput)(safeName + safeBreed + safeBirthDate);
          if (!ruleResult.blocked) {
            _context.n = 1;
            break;
          }
          return _context.a(2, '抱歉，检测到不安全的输入，请使用其他名字重试。');
        case 1:
          _context.n = 2;
          return (0,_aiProvider__WEBPACK_IMPORTED_MODULE_0__.guardCheck)(safeName + safeBreed);
        case 2:
          guardResult = _context.v;
          if (!guardResult.isHarmful) {
            _context.n = 3;
            break;
          }
          return _context.a(2, '抱歉，检测到不安全的输入，请使用其他名字重试。');
        case 3:
          _context.n = 4;
          return Promise.resolve().then(function () {
            return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_interopRequireWildcard_js__WEBPACK_IMPORTED_MODULE_5__["default"])(__webpack_require__(/*! ../utils/namingPrompts */ "./src/utils/namingPrompts.ts"));
          });
        case 4:
          _yield$import = _context.v;
          buildInterpretPrompt = _yield$import.buildInterpretPrompt;
          prompt = buildInterpretPrompt(safeName, safeBreed, safeBirthDate);
          _context.n = 5;
          return (0,_aiProvider__WEBPACK_IMPORTED_MODULE_0__.chat)({
            messages: [{
              role: 'system',
              content: '你是一位精通中国传统文化的取名大师。'
            }, {
              role: 'user',
              content: prompt
            }],
            temperature: 0.8
          });
        case 5:
          return _context.a(2, _context.v);
      }
    }, _callee);
  }));
  return _interpretName.apply(this, arguments);
}
function recommendNames(_x4, _x5, _x6) {
  return _recommendNames.apply(this, arguments);
}
function _recommendNames() {
  _recommendNames = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee2(breed, birthDate, gender) {
    var safeBreed, safeBirthDate, safeGender, ruleResult, _yield$import2, buildRecommendPrompt, season, prompt;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          (0,_utils_authGuard__WEBPACK_IMPORTED_MODULE_1__.requireAuth)();
          safeBreed = sanitizeInput(breed);
          safeBirthDate = sanitizeInput(birthDate);
          safeGender = sanitizeInput(gender);
          ruleResult = (0,_utils_ruleGuard__WEBPACK_IMPORTED_MODULE_4__.checkInput)(safeBreed + safeGender);
          if (!ruleResult.blocked) {
            _context2.n = 1;
            break;
          }
          return _context2.a(2, '抱歉，检测到不安全的输入，请使用其他内容重试。');
        case 1:
          _context2.n = 2;
          return Promise.resolve().then(function () {
            return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_interopRequireWildcard_js__WEBPACK_IMPORTED_MODULE_5__["default"])(__webpack_require__(/*! ../utils/namingPrompts */ "./src/utils/namingPrompts.ts"));
          });
        case 2:
          _yield$import2 = _context2.v;
          buildRecommendPrompt = _yield$import2.buildRecommendPrompt;
          season = getBirthSeason(safeBirthDate);
          prompt = buildRecommendPrompt(safeBreed, safeBirthDate, safeGender, season);
          _context2.n = 3;
          return (0,_aiProvider__WEBPACK_IMPORTED_MODULE_0__.chat)({
            messages: [{
              role: 'system',
              content: '你是一位精通中国文化的宠物取名大师。'
            }, {
              role: 'user',
              content: prompt
            }],
            temperature: 0.9
          });
        case 3:
          return _context2.a(2, _context2.v);
      }
    }, _callee2);
  }));
  return _recommendNames.apply(this, arguments);
}
function getBirthSeason(dateStr) {
  var month = new Date(dateStr).getMonth() + 1;
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

/***/ }),

/***/ "./src/services/petService.ts":
/*!************************************!*\
  !*** ./src/services/petService.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createPet": function() { return /* binding */ createPet; },
/* harmony export */   "deletePet": function() { return /* binding */ deletePet; },
/* harmony export */   "getPetById": function() { return /* binding */ getPetById; },
/* harmony export */   "getPets": function() { return /* binding */ getPets; },
/* harmony export */   "markDeceased": function() { return /* binding */ markDeceased; },
/* harmony export */   "setCurrentPet": function() { return /* binding */ setCurrentPet; },
/* harmony export */   "updatePet": function() { return /* binding */ updatePet; }
/* harmony export */ });
/* unused harmony export getCurrentPet */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/storage */ "./src/utils/storage.ts");
/* harmony import */ var _syncHelper__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./syncHelper */ "./src/services/syncHelper.ts");






var PETS_KEY = 'pets';
var CURRENT_PET_ID_KEY = 'current_pet_id';
var HEALTH_ENTRIES_KEY = 'health_entries';
var VACCINATIONS_KEY = 'vaccinations';
var VACCINE_REMINDERS_KEY = 'vaccine_reminders';
var FOOD_QUERY_HISTORY_KEY = 'food_query_history';
var CHECKIN_STATS_KEY = 'checkin_stats';
function generateId() {
  return "".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 9));
}
function userKey(userId, key) {
  return "".concat(key, "_").concat(userId);
}
function getLocalPets(userId) {
  return (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, PETS_KEY)) || [];
}
function saveLocalPets(userId, pets) {
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, PETS_KEY), pets);
}
function getPets(_x) {
  return _getPets.apply(this, arguments);
}
function _getPets() {
  _getPets = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee(userId) {
    var result, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (userId) {
            _context.n = 1;
            break;
          }
          throw new Error('[PetService] userId is required');
        case 1:
          _context.p = 1;
          _context.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.get('/api/pets');
        case 2:
          result = _context.v;
          saveLocalPets(userId, result);
          return _context.a(2, result);
        case 3:
          _context.p = 3;
          _t = _context.v;
          return _context.a(2, getLocalPets(userId));
      }
    }, _callee, null, [[1, 3]]);
  }));
  return _getPets.apply(this, arguments);
}
function getPetById(_x2, _x3) {
  return _getPetById.apply(this, arguments);
}
function _getPetById() {
  _getPetById = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee2(userId, id) {
    var result, localPets, index, _localPets, _t2;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          if (userId) {
            _context2.n = 1;
            break;
          }
          throw new Error('[PetService] userId is required');
        case 1:
          _context2.p = 1;
          _context2.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/api/pets/".concat(id));
        case 2:
          result = _context2.v;
          localPets = getLocalPets(userId);
          index = localPets.findIndex(function (p) {
            return p.id === id;
          });
          if (index !== -1) {
            localPets[index] = result;
          } else {
            localPets.push(result);
          }
          saveLocalPets(userId, localPets);
          return _context2.a(2, result);
        case 3:
          _context2.p = 3;
          _t2 = _context2.v;
          _localPets = getLocalPets(userId);
          return _context2.a(2, _localPets.find(function (p) {
            return p.id === id;
          }) || null);
      }
    }, _callee2, null, [[1, 3]]);
  }));
  return _getPetById.apply(this, arguments);
}
function createPet(_x4, _x5) {
  return _createPet.apply(this, arguments);
}
function _createPet() {
  _createPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee3(userId, data) {
    var now, newPet, result, localPets, _localPets2, _t3;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          if (userId) {
            _context3.n = 1;
            break;
          }
          throw new Error('[PetService] userId is required');
        case 1:
          now = new Date().toISOString();
          newPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__["default"])({
            id: generateId()
          }, data), {}, {
            createdAt: now,
            updatedAt: now
          });
          _context3.p = 2;
          _context3.n = 3;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.post('/api/pets', newPet);
        case 3:
          result = _context3.v;
          localPets = getLocalPets(userId);
          localPets.push(result);
          saveLocalPets(userId, localPets);
          (0,_syncHelper__WEBPACK_IMPORTED_MODULE_2__.queueSync)('pet_profiles', newPet.id, 'insert', newPet, userId);
          return _context3.a(2, result);
        case 4:
          _context3.p = 4;
          _t3 = _context3.v;
          _localPets2 = getLocalPets(userId);
          _localPets2.push(newPet);
          saveLocalPets(userId, _localPets2);
          (0,_syncHelper__WEBPACK_IMPORTED_MODULE_2__.queueSync)('pet_profiles', newPet.id, 'insert', newPet, userId);
          return _context3.a(2, newPet);
      }
    }, _callee3, null, [[2, 4]]);
  }));
  return _createPet.apply(this, arguments);
}
function updatePet(_x6, _x7, _x8) {
  return _updatePet.apply(this, arguments);
}
function _updatePet() {
  _updatePet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee4(userId, id, data) {
    var result, localPets, index, _localPets3, _index, updated, _t4;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          if (userId) {
            _context4.n = 1;
            break;
          }
          throw new Error('[PetService] userId is required');
        case 1:
          _context4.p = 1;
          _context4.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api.put("/api/pets/".concat(id), data);
        case 2:
          result = _context4.v;
          localPets = getLocalPets(userId);
          index = localPets.findIndex(function (p) {
            return p.id === id;
          });
          if (index !== -1) {
            localPets[index] = result;
            saveLocalPets(userId, localPets);
          }
          (0,_syncHelper__WEBPACK_IMPORTED_MODULE_2__.queueSync)('pet_profiles', id, 'update', result, userId);
          return _context4.a(2, result);
        case 3:
          _context4.p = 3;
          _t4 = _context4.v;
          _localPets3 = getLocalPets(userId);
          _index = _localPets3.findIndex(function (p) {
            return p.id === id;
          });
          if (!(_index === -1)) {
            _context4.n = 4;
            break;
          }
          throw new Error('Pet not found');
        case 4:
          updated = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__["default"])({}, _localPets3[_index]), data), {}, {
            id: id,
            updatedAt: new Date().toISOString()
          });
          _localPets3[_index] = updated;
          saveLocalPets(userId, _localPets3);
          (0,_syncHelper__WEBPACK_IMPORTED_MODULE_2__.queueSync)('pet_profiles', id, 'update', updated, userId);
          return _context4.a(2, updated);
      }
    }, _callee4, null, [[1, 3]]);
  }));
  return _updatePet.apply(this, arguments);
}
function deletePetRelatedData(userId, petId) {
  var healthEntries = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, HEALTH_ENTRIES_KEY)) || [];
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, HEALTH_ENTRIES_KEY), healthEntries.filter(function (e) {
    return e.petId !== petId;
  }));
  var vaccinations = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, VACCINATIONS_KEY)) || [];
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, VACCINATIONS_KEY), vaccinations.filter(function (v) {
    return v.petId !== petId;
  }));
  var reminders = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, VACCINE_REMINDERS_KEY)) || [];
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, VACCINE_REMINDERS_KEY), reminders.filter(function (r) {
    return r.petId !== petId;
  }));
  var foodHistory = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, FOOD_QUERY_HISTORY_KEY)) || [];
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, FOOD_QUERY_HISTORY_KEY), foodHistory.filter(function (f) {
    return f.petId !== petId;
  }));
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.removeStorage)(userKey(userId, "".concat(CHECKIN_STATS_KEY, "_").concat(petId)));
}
function deletePet(_x9, _x0) {
  return _deletePet.apply(this, arguments);
}
function _deletePet() {
  _deletePet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee5(userId, id) {
    var localPets, currentId, _localPets4, _currentId, _t5;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context5) {
      while (1) switch (_context5.p = _context5.n) {
        case 0:
          if (userId) {
            _context5.n = 1;
            break;
          }
          throw new Error('[PetService] userId is required');
        case 1:
          _context5.p = 1;
          _context5.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_0__.api["delete"]("/api/pets/".concat(id));
        case 2:
          localPets = getLocalPets(userId);
          saveLocalPets(userId, localPets.filter(function (p) {
            return p.id !== id;
          }));
          deletePetRelatedData(userId, id);
          (0,_syncHelper__WEBPACK_IMPORTED_MODULE_2__.queueSync)('pet_profiles', id, 'delete', {
            id: id
          }, userId);
          currentId = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, CURRENT_PET_ID_KEY));
          if (currentId === id) {
            (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.removeStorage)(userKey(userId, CURRENT_PET_ID_KEY));
          }
          _context5.n = 4;
          break;
        case 3:
          _context5.p = 3;
          _t5 = _context5.v;
          _localPets4 = getLocalPets(userId);
          saveLocalPets(userId, _localPets4.filter(function (p) {
            return p.id !== id;
          }));
          deletePetRelatedData(userId, id);
          (0,_syncHelper__WEBPACK_IMPORTED_MODULE_2__.queueSync)('pet_profiles', id, 'delete', {
            id: id
          }, userId);
          _currentId = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, CURRENT_PET_ID_KEY));
          if (_currentId === id) {
            (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.removeStorage)(userKey(userId, CURRENT_PET_ID_KEY));
          }
        case 4:
          return _context5.a(2);
      }
    }, _callee5, null, [[1, 3]]);
  }));
  return _deletePet.apply(this, arguments);
}
function markDeceased(_x1, _x10, _x11) {
  return _markDeceased.apply(this, arguments);
}
function _markDeceased() {
  _markDeceased = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee6(userId, id, date) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context6) {
      while (1) switch (_context6.n) {
        case 0:
          return _context6.a(2, updatePet(userId, id, {
            isDeceased: true,
            deceasedDate: date
          }));
      }
    }, _callee6);
  }));
  return _markDeceased.apply(this, arguments);
}
function getCurrentPet(_x12) {
  return _getCurrentPet.apply(this, arguments);
}
function _getCurrentPet() {
  _getCurrentPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee7(userId) {
    var currentId, pets;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context7) {
      while (1) switch (_context7.n) {
        case 0:
          if (userId) {
            _context7.n = 1;
            break;
          }
          throw new Error('[PetService] userId is required');
        case 1:
          currentId = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(userKey(userId, CURRENT_PET_ID_KEY));
          if (currentId) {
            _context7.n = 4;
            break;
          }
          _context7.n = 2;
          return getPets(userId);
        case 2:
          pets = _context7.v;
          if (!(pets.length === 0)) {
            _context7.n = 3;
            break;
          }
          return _context7.a(2, null);
        case 3:
          return _context7.a(2, pets[0]);
        case 4:
          return _context7.a(2, getPetById(userId, currentId));
      }
    }, _callee7);
  }));
  return _getCurrentPet.apply(this, arguments);
}
function setCurrentPet(_x13, _x14) {
  return _setCurrentPet.apply(this, arguments);
}
function _setCurrentPet() {
  _setCurrentPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee8(userId, id) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          if (userId) {
            _context8.n = 1;
            break;
          }
          throw new Error('[PetService] userId is required');
        case 1:
          (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(userKey(userId, CURRENT_PET_ID_KEY), id);
        case 2:
          return _context8.a(2);
      }
    }, _callee8);
  }));
  return _setCurrentPet.apply(this, arguments);
}

/***/ }),

/***/ "./src/services/syncHelper.ts":
/*!************************************!*\
  !*** ./src/services/syncHelper.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "queueSync": function() { return /* binding */ queueSync; }
/* harmony export */ });
/* unused harmony exports trySyncAll, trySyncTable */
/* harmony import */ var _syncService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./syncService */ "./src/services/syncService.ts");

function queueSync(table, recordId, action, data, userId) {
  try {
    var service = (0,_syncService__WEBPACK_IMPORTED_MODULE_0__.getSyncService)(userId);
    service.queueForSync(table, recordId, action, data);
  } catch (_unused) {
    // 同步失败不影响本地操作
  }
}
function trySyncAll(userId) {
  try {
    var service = (0,_syncService__WEBPACK_IMPORTED_MODULE_0__.getSyncService)(userId);
    service.syncAll().catch(function () {});
  } catch (_unused2) {
    // 静默失败
  }
}
function trySyncTable(table, userId) {
  try {
    var service = (0,_syncService__WEBPACK_IMPORTED_MODULE_0__.getSyncService)(userId);
    service.pushTable(table).catch(function () {});
    service.pullTable(table).catch(function () {});
  } catch (_unused3) {
    // 静默失败
  }
}

/***/ }),

/***/ "./src/services/syncService.ts":
/*!*************************************!*\
  !*** ./src/services/syncService.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getSyncService": function() { return /* binding */ getSyncService; }
/* harmony export */ });
/* unused harmony export SyncService */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectWithoutProperties_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js */ "./node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_classCallCheck_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createClass_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createClass.js */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");
/* harmony import */ var _utils_crypto__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/crypto */ "./src/utils/crypto.ts");
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/storage */ "./src/utils/storage.ts");








var _excluded = ["userId"];



var SYNC_STATUS_KEY = 'sync_status';
var SYNC_QUEUE_KEY = 'sync_queue';
var SYNC_LAST_KEY = 'sync_last_timestamps';
var SENSITIVE_TABLES = ['emotion_triggers', 'pet_grief_sessions'];
var TABLE_ENDPOINTS = {
  pet_profiles: {
    list: '/api/pets',
    item: function item(id) {
      return "/api/pets/".concat(id);
    }
  },
  pet_health_entries: {
    list: '/api/checkins',
    item: function item(id) {
      return "/api/checkins/".concat(id);
    }
  },
  pet_vaccinations: {
    list: '/api/vaccines',
    item: function item(id) {
      return "/api/vaccines/".concat(id);
    }
  },
  pet_symptom_checks: {
    list: '/api/symptom-checks',
    item: function item(id) {
      return "/api/symptom-checks/".concat(id);
    }
  },
  pet_food_queries: {
    list: '/api/food-queries',
    item: function item(id) {
      return "/api/food-queries/".concat(id);
    }
  },
  emotion_triggers: null,
  pet_grief_sessions: null,
  pet_outfits: null
};
function getSyncTimestamps() {
  return (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.getStorage)(SYNC_LAST_KEY) || {};
}
function setSyncTimestamp(table) {
  var timestamps = getSyncTimestamps();
  timestamps[table] = new Date().toISOString();
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.setStorage)(SYNC_LAST_KEY, timestamps);
}
function getSyncQueue() {
  return (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.getStorage)(SYNC_QUEUE_KEY) || [];
}
function saveSyncQueue(queue) {
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.setStorage)(SYNC_QUEUE_KEY, queue);
}
function getSyncStatuses() {
  return (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.getStorage)(SYNC_STATUS_KEY) || [];
}
function saveSyncStatuses(statuses) {
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.setStorage)(SYNC_STATUS_KEY, statuses);
}
function generateRecordId() {
  return "sync_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 9));
}
var SyncService = /*#__PURE__*/function () {
  function SyncService(userId) {
    (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_classCallCheck_js__WEBPACK_IMPORTED_MODULE_3__["default"])(this, SyncService);
    (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_4__["default"])(this, "userId", void 0);
    this.userId = userId;
  }
  return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createClass_js__WEBPACK_IMPORTED_MODULE_5__["default"])(SyncService, [{
    key: "setUserId",
    value: function setUserId(userId) {
      this.userId = userId;
    }
  }, {
    key: "encryptData",
    value: function encryptData(data) {
      return (0,_utils_crypto__WEBPACK_IMPORTED_MODULE_1__.encrypt)(JSON.stringify(data), this.userId);
    }
  }, {
    key: "decryptData",
    value: function decryptData(encrypted) {
      var decrypted = (0,_utils_crypto__WEBPACK_IMPORTED_MODULE_1__.decrypt)(encrypted, this.userId);
      if (!decrypted) return null;
      try {
        return JSON.parse(decrypted);
      } catch (_unused) {
        return null;
      }
    }
  }, {
    key: "isAvailable",
    value: function isAvailable() {
      return !!this.userId;
    }
  }, {
    key: "queueForSync",
    value: function queueForSync(table, recordId, action, data) {
      var queue = getSyncQueue();
      var rawData = SENSITIVE_TABLES.includes(table) ? this.encryptData(data) : JSON.stringify(data);
      queue.push({
        id: generateRecordId(),
        table_name: table,
        record_id: recordId,
        action: action,
        data: rawData,
        synced: false,
        created_at: new Date().toISOString()
      });
      if (queue.length > 200) {
        queue.splice(0, queue.length - 200);
      }
      saveSyncQueue(queue);
      this.updateStatus(table);
    }
  }, {
    key: "pushTable",
    value: function () {
      var _pushTable = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().m(function _callee(table) {
        var mapping, queue, pending, pushed, lastError, _iterator, _step, record, parsed, _parsedUserId, restData, payload, _t, _t2;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (this.isAvailable()) {
                _context.n = 1;
                break;
              }
              return _context.a(2, {
                pushed: 0,
                error: '云端不可用'
              });
            case 1:
              mapping = TABLE_ENDPOINTS[table];
              if (mapping) {
                _context.n = 2;
                break;
              }
              return _context.a(2, {
                pushed: 0,
                error: '不支持的表'
              });
            case 2:
              queue = getSyncQueue();
              pending = queue.filter(function (r) {
                return r.table_name === table && !r.synced;
              });
              if (!(pending.length === 0)) {
                _context.n = 3;
                break;
              }
              return _context.a(2, {
                pushed: 0,
                error: null
              });
            case 3:
              pushed = 0;
              lastError = null;
              _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_8__["default"])(pending);
              _context.p = 4;
              _iterator.s();
            case 5:
              if ((_step = _iterator.n()).done) {
                _context.n = 12;
                break;
              }
              record = _step.value;
              _context.p = 6;
              parsed = JSON.parse(record.data);
              if (!(record.action === 'delete')) {
                _context.n = 8;
                break;
              }
              _context.n = 7;
              return _api__WEBPACK_IMPORTED_MODULE_0__.api["delete"](mapping.item(record.record_id));
            case 7:
              _context.n = 9;
              break;
            case 8:
              _parsedUserId = parsed.userId, restData = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectWithoutProperties_js__WEBPACK_IMPORTED_MODULE_9__["default"])(parsed, _excluded);
              payload = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_10__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_10__["default"])({}, restData), {}, {
                id: record.record_id,
                userId: this.userId,
                syncedAt: new Date().toISOString()
              });
              _context.n = 9;
              return _api__WEBPACK_IMPORTED_MODULE_0__.api.put(mapping.item(record.record_id), payload);
            case 9:
              record.synced = true;
              pushed++;
              _context.n = 11;
              break;
            case 10:
              _context.p = 10;
              _t = _context.v;
              lastError = _t instanceof Error ? _t.message : '同步失败';
            case 11:
              _context.n = 5;
              break;
            case 12:
              _context.n = 14;
              break;
            case 13:
              _context.p = 13;
              _t2 = _context.v;
              _iterator.e(_t2);
            case 14:
              _context.p = 14;
              _iterator.f();
              return _context.f(14);
            case 15:
              saveSyncQueue(queue);
              if (pushed > 0) {
                setSyncTimestamp(table);
              }
              this.updateStatus(table);
              return _context.a(2, {
                pushed: pushed,
                error: lastError
              });
          }
        }, _callee, this, [[6, 10], [4, 13, 14, 15]]);
      }));
      function pushTable(_x) {
        return _pushTable.apply(this, arguments);
      }
      return pushTable;
    }()
  }, {
    key: "pullTable",
    value: function () {
      var _pullTable = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().m(function _callee2(table) {
        var mapping, params, result, pulled, _iterator2, _step2, record, data, decrypted, storageKey, _t3, _t4, _t5;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              if (this.isAvailable()) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2, {
                pulled: 0,
                error: '云端不可用'
              });
            case 1:
              mapping = TABLE_ENDPOINTS[table];
              if (mapping) {
                _context2.n = 2;
                break;
              }
              return _context2.a(2, {
                pulled: 0,
                error: null
              });
            case 2:
              _context2.p = 2;
              params = {
                limit: '100'
              };
              _context2.n = 3;
              return _api__WEBPACK_IMPORTED_MODULE_0__.api.get(mapping.list, params);
            case 3:
              result = _context2.v;
              if (!(!result || result.length === 0)) {
                _context2.n = 4;
                break;
              }
              return _context2.a(2, {
                pulled: 0,
                error: null
              });
            case 4:
              pulled = 0;
              _iterator2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_8__["default"])(result);
              _context2.p = 5;
              _iterator2.s();
            case 6:
              if ((_step2 = _iterator2.n()).done) {
                _context2.n = 10;
                break;
              }
              record = _step2.value;
              _context2.p = 7;
              data = record;
              if (SENSITIVE_TABLES.includes(table) && record.data) {
                decrypted = this.decryptData(record.data);
                if (decrypted) {
                  data = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_10__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_10__["default"])({}, record), {}, {
                    data: decrypted
                  });
                }
              }
              storageKey = "".concat(table, "_").concat(record.id);
              (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.setStorage)(storageKey, data);
              pulled++;
              _context2.n = 9;
              break;
            case 8:
              _context2.p = 8;
              _t3 = _context2.v;
              return _context2.a(3, 9);
            case 9:
              _context2.n = 6;
              break;
            case 10:
              _context2.n = 12;
              break;
            case 11:
              _context2.p = 11;
              _t4 = _context2.v;
              _iterator2.e(_t4);
            case 12:
              _context2.p = 12;
              _iterator2.f();
              return _context2.f(12);
            case 13:
              if (pulled > 0) {
                setSyncTimestamp(table);
              }
              this.updateStatus(table);
              return _context2.a(2, {
                pulled: pulled,
                error: null
              });
            case 14:
              _context2.p = 14;
              _t5 = _context2.v;
              return _context2.a(2, {
                pulled: 0,
                error: _t5 instanceof Error ? _t5.message : '拉取失败'
              });
          }
        }, _callee2, this, [[7, 8], [5, 11, 12, 13], [2, 14]]);
      }));
      function pullTable(_x2) {
        return _pullTable.apply(this, arguments);
      }
      return pullTable;
    }()
  }, {
    key: "syncAll",
    value: function () {
      var _syncAll = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().m(function _callee3() {
        var tables, totalPushed, totalPulled, errors, _i, _tables, table, pushResult, pullResult;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              tables = ['pet_profiles', 'pet_health_entries', 'pet_vaccinations', 'pet_symptom_checks', 'pet_food_queries', 'emotion_triggers', 'pet_grief_sessions'];
              totalPushed = 0;
              totalPulled = 0;
              errors = [];
              _i = 0, _tables = tables;
            case 1:
              if (!(_i < _tables.length)) {
                _context3.n = 5;
                break;
              }
              table = _tables[_i];
              _context3.n = 2;
              return this.pushTable(table);
            case 2:
              pushResult = _context3.v;
              totalPushed += pushResult.pushed;
              if (pushResult.error) {
                errors.push("".concat(table, " push: ").concat(pushResult.error));
              }
              _context3.n = 3;
              return this.pullTable(table);
            case 3:
              pullResult = _context3.v;
              totalPulled += pullResult.pulled;
              if (pullResult.error) {
                errors.push("".concat(table, " pull: ").concat(pullResult.error));
              }
            case 4:
              _i++;
              _context3.n = 1;
              break;
            case 5:
              return _context3.a(2, {
                success: errors.length === 0,
                pushed: totalPushed,
                pulled: totalPulled,
                errors: errors
              });
          }
        }, _callee3, this);
      }));
      function syncAll() {
        return _syncAll.apply(this, arguments);
      }
      return syncAll;
    }()
  }, {
    key: "exportAllData",
    value: function () {
      var _exportAllData = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().m(function _callee4() {
        var tables, exportData, _i2, _tables2, table, storageKey, data;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              tables = ['pet_profiles', 'pet_health_entries', 'pet_vaccinations', 'pet_symptom_checks', 'pet_food_queries'];
              exportData = {
                exportedAt: new Date().toISOString(),
                userId: this.userId
              };
              for (_i2 = 0, _tables2 = tables; _i2 < _tables2.length; _i2++) {
                table = _tables2[_i2];
                storageKey = "".concat(table, "_list");
                data = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.getStorage)(storageKey);
                if (data) {
                  exportData[table] = data;
                }
              }
              return _context4.a(2, exportData);
          }
        }, _callee4, this);
      }));
      function exportAllData() {
        return _exportAllData.apply(this, arguments);
      }
      return exportAllData;
    }()
  }, {
    key: "importData",
    value: function () {
      var _importData = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().m(function _callee5(data) {
        var errors, imported, tables, _i3, _tables3, table, records, _iterator3, _step3, record, storageKey;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              errors = [];
              imported = 0;
              tables = ['pet_profiles', 'pet_health_entries', 'pet_vaccinations', 'pet_symptom_checks', 'pet_food_queries'];
              _i3 = 0, _tables3 = tables;
            case 1:
              if (!(_i3 < _tables3.length)) {
                _context5.n = 4;
                break;
              }
              table = _tables3[_i3];
              records = data[table];
              if (!(!records || !Array.isArray(records))) {
                _context5.n = 2;
                break;
              }
              return _context5.a(3, 3);
            case 2:
              _iterator3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_8__["default"])(records);
              try {
                for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                  record = _step3.value;
                  try {
                    storageKey = "".concat(table, "_").concat(record.id || generateRecordId());
                    (0,_utils_storage__WEBPACK_IMPORTED_MODULE_2__.setStorage)(storageKey, record);
                    imported++;
                  } catch (err) {
                    errors.push("".concat(table, ": ").concat(err instanceof Error ? err.message : '导入失败'));
                  }
                }
              } catch (err) {
                _iterator3.e(err);
              } finally {
                _iterator3.f();
              }
            case 3:
              _i3++;
              _context5.n = 1;
              break;
            case 4:
              return _context5.a(2, {
                imported: imported,
                errors: errors
              });
          }
        }, _callee5);
      }));
      function importData(_x3) {
        return _importData.apply(this, arguments);
      }
      return importData;
    }()
  }, {
    key: "clearCloudData",
    value: function () {
      var _clearCloudData = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().m(function _callee6() {
        var tables, lastError, _i4, _tables4, table, mapping, records, _iterator4, _step4, record, _t6, _t7;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().w(function (_context6) {
          while (1) switch (_context6.p = _context6.n) {
            case 0:
              if (this.isAvailable()) {
                _context6.n = 1;
                break;
              }
              return _context6.a(2, {
                success: false,
                error: '云端不可用'
              });
            case 1:
              tables = ['pet_profiles', 'pet_health_entries', 'pet_vaccinations', 'pet_symptom_checks', 'pet_food_queries'];
              lastError = null;
              _i4 = 0, _tables4 = tables;
            case 2:
              if (!(_i4 < _tables4.length)) {
                _context6.n = 14;
                break;
              }
              table = _tables4[_i4];
              mapping = TABLE_ENDPOINTS[table];
              if (mapping) {
                _context6.n = 3;
                break;
              }
              return _context6.a(3, 13);
            case 3:
              _context6.p = 3;
              _context6.n = 4;
              return _api__WEBPACK_IMPORTED_MODULE_0__.api.get(mapping.list);
            case 4:
              records = _context6.v;
              _iterator4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_8__["default"])(records);
              _context6.p = 5;
              _iterator4.s();
            case 6:
              if ((_step4 = _iterator4.n()).done) {
                _context6.n = 8;
                break;
              }
              record = _step4.value;
              _context6.n = 7;
              return _api__WEBPACK_IMPORTED_MODULE_0__.api["delete"](mapping.item(record.id));
            case 7:
              _context6.n = 6;
              break;
            case 8:
              _context6.n = 10;
              break;
            case 9:
              _context6.p = 9;
              _t6 = _context6.v;
              _iterator4.e(_t6);
            case 10:
              _context6.p = 10;
              _iterator4.f();
              return _context6.f(10);
            case 11:
              _context6.n = 13;
              break;
            case 12:
              _context6.p = 12;
              _t7 = _context6.v;
              lastError = _t7 instanceof Error ? _t7.message : '删除失败';
            case 13:
              _i4++;
              _context6.n = 2;
              break;
            case 14:
              return _context6.a(2, {
                success: !lastError,
                error: lastError
              });
          }
        }, _callee6, this, [[5, 9, 10, 11], [3, 12]]);
      }));
      function clearCloudData() {
        return _clearCloudData.apply(this, arguments);
      }
      return clearCloudData;
    }()
  }, {
    key: "getStatus",
    value: function getStatus(table) {
      var statuses = getSyncStatuses();
      var existing = statuses.find(function (s) {
        return s.table === table;
      });
      if (existing) return existing;
      var queue = getSyncQueue();
      var pendingCount = queue.filter(function (r) {
        return r.table_name === table && !r.synced;
      }).length;
      return {
        table: table,
        lastPushAt: null,
        lastPullAt: null,
        pendingCount: pendingCount,
        error: null
      };
    }
  }, {
    key: "getAllStatuses",
    value: function getAllStatuses() {
      var _this = this;
      var tables = ['pet_profiles', 'pet_health_entries', 'pet_vaccinations', 'pet_symptom_checks', 'pet_food_queries', 'emotion_triggers', 'pet_grief_sessions'];
      return tables.map(function (t) {
        return _this.getStatus(t);
      });
    }
  }, {
    key: "updateStatus",
    value: function updateStatus(table) {
      var statuses = getSyncStatuses();
      var existing = statuses.findIndex(function (s) {
        return s.table === table;
      });
      var queue = getSyncQueue();
      var pendingCount = queue.filter(function (r) {
        return r.table_name === table && !r.synced;
      }).length;
      var newStatus = {
        table: table,
        lastPushAt: new Date().toISOString(),
        lastPullAt: new Date().toISOString(),
        pendingCount: pendingCount,
        error: null
      };
      if (existing !== -1) {
        statuses[existing] = newStatus;
      } else {
        statuses.push(newStatus);
      }
      saveSyncStatuses(statuses);
    }
  }]);
}();
var syncServiceInstance = null;
function getSyncService(userId) {
  if (!syncServiceInstance && userId) {
    syncServiceInstance = new SyncService(userId);
  }
  if (userId && syncServiceInstance) {
    syncServiceInstance.setUserId(userId);
  }
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(userId || '');
  }
  return syncServiceInstance;
}

/***/ }),

/***/ "./src/stores/authStore.ts":
/*!*********************************!*\
  !*** ./src/stores/authStore.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useAuthStore": function() { return /* binding */ useAuthStore; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! zustand */ "./node_modules/zustand/esm/index.js");
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../services/api */ "./src/services/api.ts");
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/storage */ "./src/utils/storage.ts");





var useAuthStore = (0,zustand__WEBPACK_IMPORTED_MODULE_2__["default"])(function (set, get) {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    initialize: function () {
      var _initialize = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee() {
        var token, user, freshUser, _t;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (!get().isInitialized) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              set({
                isLoading: true
              });
              _context.p = 2;
              token = _utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage.getToken();
              if (!token) {
                _context.n = 5;
                break;
              }
              user = _utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage.getUser();
              if (!user) {
                _context.n = 3;
                break;
              }
              set({
                user: user,
                token: token,
                isAuthenticated: true,
                isInitialized: true,
                isLoading: false
              });
              return _context.a(2);
            case 3:
              _context.n = 4;
              return _services_api__WEBPACK_IMPORTED_MODULE_0__.api.getUser();
            case 4:
              freshUser = _context.v;
              _utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage.setUser(freshUser);
              set({
                user: freshUser,
                token: token,
                isAuthenticated: true,
                isInitialized: true,
                isLoading: false
              });
              return _context.a(2);
            case 5:
              _context.n = 7;
              break;
            case 6:
              _context.p = 6;
              _t = _context.v;
              _utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage.clear();
            case 7:
              set({
                isInitialized: true,
                isLoading: false
              });
            case 8:
              return _context.a(2);
          }
        }, _callee, null, [[2, 6]]);
      }));
      function initialize() {
        return _initialize.apply(this, arguments);
      }
      return initialize;
    }(),
    login: function () {
      var _login = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee2() {
        var res, _t2;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              set({
                isLoading: true
              });
              _context2.p = 1;
              _context2.n = 2;
              return _services_api__WEBPACK_IMPORTED_MODULE_0__.api.login('mock_code');
            case 2:
              res = _context2.v;
              _utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage.setToken(res.token);
              _utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage.setRefreshToken(res.refreshToken);
              _utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage.setUser(res.user);
              set({
                user: res.user,
                token: res.token,
                isAuthenticated: true,
                isLoading: false
              });
              _context2.n = 4;
              break;
            case 3:
              _context2.p = 3;
              _t2 = _context2.v;
              set({
                isLoading: false
              });
              throw _t2;
            case 4:
              return _context2.a(2);
          }
        }, _callee2, null, [[1, 3]]);
      }));
      function login() {
        return _login.apply(this, arguments);
      }
      return login;
    }(),
    logout: function () {
      var _logout = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee3() {
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              _utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage.clear();
              set({
                user: null,
                token: null,
                isAuthenticated: false
              });
            case 1:
              return _context3.a(2);
          }
        }, _callee3);
      }));
      function logout() {
        return _logout.apply(this, arguments);
      }
      return logout;
    }()
  };
});

/***/ }),

/***/ "./src/stores/familyStore.ts":
/*!***********************************!*\
  !*** ./src/stores/familyStore.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useFamilyStore": function() { return /* binding */ useFamilyStore; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! zustand */ "./node_modules/zustand/esm/index.js");
/* harmony import */ var _services_familyService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../services/familyService */ "./src/services/familyService.ts");






var useFamilyStore = (0,zustand__WEBPACK_IMPORTED_MODULE_1__["default"])(function (set, get) {
  return {
    families: [],
    currentFamily: null,
    members: [],
    photos: [],
    photosLoading: false,
    loading: false,
    error: null,
    fetchFamilies: function () {
      var _fetchFamilies = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee() {
        var families, members, _t;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              set({
                loading: true,
                error: null
              });
              _context.p = 1;
              _context.n = 2;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.getFamilies();
            case 2:
              families = _context.v;
              set({
                families: families
              });
              if (!(families.length > 0 && !get().currentFamily)) {
                _context.n = 4;
                break;
              }
              set({
                currentFamily: families[0]
              });
              _context.n = 3;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.getMembers(families[0].id);
            case 3:
              members = _context.v;
              set({
                members: members
              });
            case 4:
              _context.n = 6;
              break;
            case 5:
              _context.p = 5;
              _t = _context.v;
              set({
                error: '加载家庭列表失败'
              });
            case 6:
              _context.p = 6;
              set({
                loading: false
              });
              return _context.f(6);
            case 7:
              return _context.a(2);
          }
        }, _callee, null, [[1, 5, 6, 7]]);
      }));
      function fetchFamilies() {
        return _fetchFamilies.apply(this, arguments);
      }
      return fetchFamilies;
    }(),
    setCurrentFamily: function () {
      var _setCurrentFamily = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee2(family) {
        var members, _t2;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              set({
                currentFamily: family,
                loading: true,
                error: null
              });
              _context2.p = 1;
              _context2.n = 2;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.getMembers(family.id);
            case 2:
              members = _context2.v;
              set({
                members: members
              });
              _context2.n = 4;
              break;
            case 3:
              _context2.p = 3;
              _t2 = _context2.v;
              set({
                error: '加载家庭成员失败'
              });
            case 4:
              _context2.p = 4;
              set({
                loading: false
              });
              return _context2.f(4);
            case 5:
              return _context2.a(2);
          }
        }, _callee2, null, [[1, 3, 4, 5]]);
      }));
      function setCurrentFamily(_x) {
        return _setCurrentFamily.apply(this, arguments);
      }
      return setCurrentFamily;
    }(),
    createFamily: function () {
      var _createFamily = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee3(name) {
        var family, _t3;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              set({
                loading: true,
                error: null
              });
              _context3.p = 1;
              _context3.n = 2;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.createFamily(name);
            case 2:
              family = _context3.v;
              set(function (state) {
                return {
                  families: [].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(state.families), [family]),
                  currentFamily: family,
                  members: []
                };
              });
              _context3.n = 4;
              break;
            case 3:
              _context3.p = 3;
              _t3 = _context3.v;
              set({
                error: '创建家庭失败'
              });
            case 4:
              _context3.p = 4;
              set({
                loading: false
              });
              return _context3.f(4);
            case 5:
              return _context3.a(2);
          }
        }, _callee3, null, [[1, 3, 4, 5]]);
      }));
      function createFamily(_x2) {
        return _createFamily.apply(this, arguments);
      }
      return createFamily;
    }(),
    addMember: function () {
      var _addMember = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee4(petId, role) {
        var family, members, _t4;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              family = get().currentFamily;
              if (family) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2);
            case 1:
              set({
                error: null
              });
              _context4.p = 2;
              _context4.n = 3;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.addMember(family.id, petId, role);
            case 3:
              _context4.n = 4;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.getMembers(family.id);
            case 4:
              members = _context4.v;
              set({
                members: members
              });
              _context4.n = 6;
              break;
            case 5:
              _context4.p = 5;
              _t4 = _context4.v;
              set({
                error: '添加成员失败'
              });
            case 6:
              return _context4.a(2);
          }
        }, _callee4, null, [[2, 5]]);
      }));
      function addMember(_x3, _x4) {
        return _addMember.apply(this, arguments);
      }
      return addMember;
    }(),
    removeMember: function () {
      var _removeMember = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee5(memberId) {
        var family, _t5;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context5) {
          while (1) switch (_context5.p = _context5.n) {
            case 0:
              family = get().currentFamily;
              if (family) {
                _context5.n = 1;
                break;
              }
              return _context5.a(2);
            case 1:
              set({
                error: null
              });
              _context5.p = 2;
              _context5.n = 3;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.removeMember(family.id, memberId);
            case 3:
              set(function (state) {
                return {
                  members: state.members.filter(function (m) {
                    return m.id !== memberId;
                  })
                };
              });
              _context5.n = 5;
              break;
            case 4:
              _context5.p = 4;
              _t5 = _context5.v;
              set({
                error: '移除成员失败'
              });
            case 5:
              return _context5.a(2);
          }
        }, _callee5, null, [[2, 4]]);
      }));
      function removeMember(_x5) {
        return _removeMember.apply(this, arguments);
      }
      return removeMember;
    }(),
    updateMemberRole: function () {
      var _updateMemberRole = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee6(memberId, role) {
        var family, _t6;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context6) {
          while (1) switch (_context6.p = _context6.n) {
            case 0:
              family = get().currentFamily;
              if (family) {
                _context6.n = 1;
                break;
              }
              return _context6.a(2);
            case 1:
              set({
                error: null
              });
              _context6.p = 2;
              _context6.n = 3;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.updateMemberRole(family.id, memberId, role);
            case 3:
              set(function (state) {
                return {
                  members: state.members.map(function (m) {
                    return m.id === memberId ? (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_5__["default"])({}, m), {}, {
                      role: role
                    }) : m;
                  })
                };
              });
              _context6.n = 5;
              break;
            case 4:
              _context6.p = 4;
              _t6 = _context6.v;
              set({
                error: '更新角色失败'
              });
            case 5:
              return _context6.a(2);
          }
        }, _callee6, null, [[2, 4]]);
      }));
      function updateMemberRole(_x6, _x7) {
        return _updateMemberRole.apply(this, arguments);
      }
      return updateMemberRole;
    }(),
    fetchPhotos: function () {
      var _fetchPhotos = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee7() {
        var family, photos, _t7;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context7) {
          while (1) switch (_context7.p = _context7.n) {
            case 0:
              family = get().currentFamily;
              if (family) {
                _context7.n = 1;
                break;
              }
              return _context7.a(2);
            case 1:
              set({
                photosLoading: true,
                error: null
              });
              _context7.p = 2;
              _context7.n = 3;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.getFamilyPhotos(family.id);
            case 3:
              photos = _context7.v;
              set({
                photos: photos
              });
              _context7.n = 5;
              break;
            case 4:
              _context7.p = 4;
              _t7 = _context7.v;
              set({
                error: '加载相册失败'
              });
            case 5:
              _context7.p = 5;
              set({
                photosLoading: false
              });
              return _context7.f(5);
            case 6:
              return _context7.a(2);
          }
        }, _callee7, null, [[2, 4, 5, 6]]);
      }));
      function fetchPhotos() {
        return _fetchPhotos.apply(this, arguments);
      }
      return fetchPhotos;
    }(),
    savePhoto: function () {
      var _savePhoto = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee8(photoUrl, memberCount, memberNames) {
        var photoType,
          description,
          family,
          photo,
          _args8 = arguments,
          _t8;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context8) {
          while (1) switch (_context8.p = _context8.n) {
            case 0:
              photoType = _args8.length > 3 && _args8[3] !== undefined ? _args8[3] : 'generated';
              description = _args8.length > 4 ? _args8[4] : undefined;
              family = get().currentFamily;
              if (family) {
                _context8.n = 1;
                break;
              }
              return _context8.a(2);
            case 1:
              set({
                error: null
              });
              _context8.p = 2;
              _context8.n = 3;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.saveFamilyPhoto(family.id, photoUrl, memberCount, memberNames, photoType, description);
            case 3:
              photo = _context8.v;
              set(function (state) {
                return {
                  photos: [photo].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(state.photos))
                };
              });
              _context8.n = 5;
              break;
            case 4:
              _context8.p = 4;
              _t8 = _context8.v;
              set({
                error: '保存照片失败'
              });
            case 5:
              return _context8.a(2);
          }
        }, _callee8, null, [[2, 4]]);
      }));
      function savePhoto(_x8, _x9, _x0) {
        return _savePhoto.apply(this, arguments);
      }
      return savePhoto;
    }(),
    deletePhoto: function () {
      var _deletePhoto = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee9(photoId) {
        var _t9;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context9) {
          while (1) switch (_context9.p = _context9.n) {
            case 0:
              set({
                error: null
              });
              _context9.p = 1;
              _context9.n = 2;
              return _services_familyService__WEBPACK_IMPORTED_MODULE_0__.familyService.deleteFamilyPhoto(photoId);
            case 2:
              set(function (state) {
                return {
                  photos: state.photos.filter(function (p) {
                    return p.id !== photoId;
                  })
                };
              });
              _context9.n = 4;
              break;
            case 3:
              _context9.p = 3;
              _t9 = _context9.v;
              set({
                error: '删除照片失败'
              });
            case 4:
              return _context9.a(2);
          }
        }, _callee9, null, [[1, 3]]);
      }));
      function deletePhoto(_x1) {
        return _deletePhoto.apply(this, arguments);
      }
      return deletePhoto;
    }()
  };
});

/***/ }),

/***/ "./src/stores/membershipStore.ts":
/*!***************************************!*\
  !*** ./src/stores/membershipStore.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useMembershipStore": function() { return /* binding */ useMembershipStore; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! zustand */ "./node_modules/zustand/esm/index.js");
/* harmony import */ var _services_membershipService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../services/membershipService */ "./src/services/membershipService.ts");




var useMembershipStore = (0,zustand__WEBPACK_IMPORTED_MODULE_1__["default"])(function (set, get) {
  return {
    userId: null,
    membership: null,
    orders: [],
    isLoading: false,
    error: null,
    initUser: function () {
      var _initUser = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee(userId) {
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              set({
                userId: userId
              });
              _context.n = 1;
              return get().fetchMembership(userId);
            case 1:
              return _context.a(2);
          }
        }, _callee);
      }));
      function initUser(_x) {
        return _initUser.apply(this, arguments);
      }
      return initUser;
    }(),
    fetchMembership: function () {
      var _fetchMembership = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee2(userId) {
        var _info$plan, _info$startedAt, _info$expiresAt, info, membership, _t;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              set({
                isLoading: true
              });
              _context2.p = 1;
              _context2.n = 2;
              return (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.getMembershipStatus)(userId);
            case 2:
              info = _context2.v;
              membership = {
                id: '',
                userId: userId,
                level: info.tier === 'member' ? (_info$plan = info.plan) !== null && _info$plan !== void 0 ? _info$plan : 'monthly' : 'free',
                status: info.status === 'none' ? 'expired' : info.status,
                startDate: (_info$startedAt = info.startedAt) !== null && _info$startedAt !== void 0 ? _info$startedAt : '',
                endDate: (_info$expiresAt = info.expiresAt) !== null && _info$expiresAt !== void 0 ? _info$expiresAt : '',
                createdAt: ''
              };
              set({
                membership: membership,
                isLoading: false
              });
              _context2.n = 4;
              break;
            case 3:
              _context2.p = 3;
              _t = _context2.v;
              set({
                isLoading: false
              });
            case 4:
              return _context2.a(2);
          }
        }, _callee2, null, [[1, 3]]);
      }));
      function fetchMembership(_x2) {
        return _fetchMembership.apply(this, arguments);
      }
      return fetchMembership;
    }(),
    fetchOrders: function () {
      var _fetchOrders = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee3() {
        var _get, userId, orders, _t2;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              _get = get(), userId = _get.userId;
              if (userId) {
                _context3.n = 1;
                break;
              }
              return _context3.a(2);
            case 1:
              _context3.p = 1;
              _context3.n = 2;
              return (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.getOrders)(userId);
            case 2:
              orders = _context3.v;
              set({
                orders: orders
              });
              _context3.n = 4;
              break;
            case 3:
              _context3.p = 3;
              _t2 = _context3.v;
            case 4:
              return _context3.a(2);
          }
        }, _callee3, null, [[1, 3]]);
      }));
      function fetchOrders() {
        return _fetchOrders.apply(this, arguments);
      }
      return fetchOrders;
    }(),
    subscribePlan: function () {
      var _subscribePlan = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee4(plan) {
        var _get2, userId, result, error, _t3;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              _get2 = get(), userId = _get2.userId;
              if (userId) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2, {
                success: false,
                error: '用户未登录'
              });
            case 1:
              set({
                isLoading: true,
                error: null
              });
              _context4.p = 2;
              _context4.n = 3;
              return (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.completeWechatPayment)(userId, plan);
            case 3:
              result = _context4.v;
              if (!result.success) {
                _context4.n = 4;
                break;
              }
              _context4.n = 4;
              return get().fetchMembership(userId);
            case 4:
              set({
                isLoading: false
              });
              return _context4.a(2, result);
            case 5:
              _context4.p = 5;
              _t3 = _context4.v;
              error = _t3 instanceof Error ? _t3.message : '订阅失败';
              set({
                isLoading: false,
                error: error
              });
              return _context4.a(2, {
                success: false,
                error: error
              });
          }
        }, _callee4, null, [[2, 5]]);
      }));
      function subscribePlan(_x3) {
        return _subscribePlan.apply(this, arguments);
      }
      return subscribePlan;
    }(),
    cancelSubscription: function () {
      var _cancelSubscription = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee5() {
        var _get3, userId, error, _t4;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context5) {
          while (1) switch (_context5.p = _context5.n) {
            case 0:
              _get3 = get(), userId = _get3.userId;
              if (userId) {
                _context5.n = 1;
                break;
              }
              return _context5.a(2);
            case 1:
              set({
                isLoading: true,
                error: null
              });
              _context5.p = 2;
              _context5.n = 3;
              return (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.cancelMembership)(userId);
            case 3:
              _context5.n = 4;
              return get().fetchMembership(userId);
            case 4:
              set({
                isLoading: false
              });
              _context5.n = 6;
              break;
            case 5:
              _context5.p = 5;
              _t4 = _context5.v;
              error = _t4 instanceof Error ? _t4.message : '取消订阅失败';
              set({
                isLoading: false,
                error: error
              });
            case 6:
              return _context5.a(2);
          }
        }, _callee5, null, [[2, 5]]);
      }));
      function cancelSubscription() {
        return _cancelSubscription.apply(this, arguments);
      }
      return cancelSubscription;
    }(),
    restorePurchaseStatus: function () {
      var _restorePurchaseStatus = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee6() {
        var _get4, userId, error, _t5;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context6) {
          while (1) switch (_context6.p = _context6.n) {
            case 0:
              _get4 = get(), userId = _get4.userId;
              if (userId) {
                _context6.n = 1;
                break;
              }
              return _context6.a(2);
            case 1:
              set({
                isLoading: true,
                error: null
              });
              _context6.p = 2;
              _context6.n = 3;
              return (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.restorePurchase)(userId);
            case 3:
              _context6.n = 4;
              return get().fetchMembership(userId);
            case 4:
              set({
                isLoading: false
              });
              _context6.n = 6;
              break;
            case 5:
              _context6.p = 5;
              _t5 = _context6.v;
              error = _t5 instanceof Error ? _t5.message : '恢复购买失败';
              set({
                isLoading: false,
                error: error
              });
            case 6:
              return _context6.a(2);
          }
        }, _callee6, null, [[2, 5]]);
      }));
      function restorePurchaseStatus() {
        return _restorePurchaseStatus.apply(this, arguments);
      }
      return restorePurchaseStatus;
    }(),
    checkAccess: function () {
      var _checkAccess = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee7(featureKey) {
        var _get5, userId;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              _get5 = get(), userId = _get5.userId;
              if (userId) {
                _context7.n = 1;
                break;
              }
              return _context7.a(2, {
                allowed: false,
                remaining: 0,
                isMember: false
              });
            case 1:
              return _context7.a(2, (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.checkFeatureAccess)(userId, featureKey));
          }
        }, _callee7);
      }));
      function checkAccess(_x4) {
        return _checkAccess.apply(this, arguments);
      }
      return checkAccess;
    }(),
    shouldShowPaywallForFeature: function () {
      var _shouldShowPaywallForFeature = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee8(featureKey) {
        var _get6, userId;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              _get6 = get(), userId = _get6.userId;
              if (userId) {
                _context8.n = 1;
                break;
              }
              return _context8.a(2, false);
            case 1:
              return _context8.a(2, (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.shouldShowPaywall)(userId, featureKey));
          }
        }, _callee8);
      }));
      function shouldShowPaywallForFeature(_x5) {
        return _shouldShowPaywallForFeature.apply(this, arguments);
      }
      return shouldShowPaywallForFeature;
    }(),
    markPaywallShownForFeature: function () {
      var _markPaywallShownForFeature = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee9(featureKey) {
        var _get7, userId;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context9) {
          while (1) switch (_context9.n) {
            case 0:
              _get7 = get(), userId = _get7.userId;
              if (userId) {
                _context9.n = 1;
                break;
              }
              return _context9.a(2);
            case 1:
              _context9.n = 2;
              return (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.markPaywallShown)(userId, featureKey);
            case 2:
              return _context9.a(2);
          }
        }, _callee9);
      }));
      function markPaywallShownForFeature(_x6) {
        return _markPaywallShownForFeature.apply(this, arguments);
      }
      return markPaywallShownForFeature;
    }(),
    getPetLimit: function () {
      var _getPetLimit = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee0() {
        var _get8, userId;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context0) {
          while (1) switch (_context0.n) {
            case 0:
              _get8 = get(), userId = _get8.userId;
              if (userId) {
                _context0.n = 1;
                break;
              }
              return _context0.a(2, 2);
            case 1:
              return _context0.a(2, (0,_services_membershipService__WEBPACK_IMPORTED_MODULE_0__.getPetCountLimit)(userId));
          }
        }, _callee0);
      }));
      function getPetLimit() {
        return _getPetLimit.apply(this, arguments);
      }
      return getPetLimit;
    }(),
    clearError: function clearError() {
      return set({
        error: null
      });
    }
  };
});

/***/ }),

/***/ "./src/stores/petStore.ts":
/*!********************************!*\
  !*** ./src/stores/petStore.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "usePetStore": function() { return /* binding */ usePetStore; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! zustand */ "./node_modules/zustand/esm/index.js");
/* harmony import */ var _services_petService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../services/petService */ "./src/services/petService.ts");






var usePetStore = (0,zustand__WEBPACK_IMPORTED_MODULE_2__["default"])(function (set, get) {
  return {
    userId: null,
    pets: [],
    currentPet: null,
    isLoading: false,
    error: null,
    avatar2DTaskId: null,
    avatar3DTaskId: null,
    initUser: function () {
      var _initUser = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee(userId) {
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              set({
                userId: userId
              });
              _context.n = 1;
              return get().fetchPets(userId);
            case 1:
              return _context.a(2);
          }
        }, _callee);
      }));
      function initUser(_x) {
        return _initUser.apply(this, arguments);
      }
      return initUser;
    }(),
    fetchPets: function () {
      var _fetchPets = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee2(userId) {
        var pets, _get, currentPet, _t;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              set({
                isLoading: true,
                error: null
              });
              _context2.p = 1;
              _context2.n = 2;
              return (0,_services_petService__WEBPACK_IMPORTED_MODULE_1__.getPets)(userId);
            case 2:
              pets = _context2.v;
              _get = get(), currentPet = _get.currentPet;
              set({
                pets: pets,
                isLoading: false,
                currentPet: currentPet ? pets.find(function (p) {
                  return p.id === currentPet.id;
                }) || pets[0] || null : pets[0] || null
              });
              _context2.n = 4;
              break;
            case 3:
              _context2.p = 3;
              _t = _context2.v;
              set({
                isLoading: false,
                error: _t instanceof Error ? _t.message : '获取宠物列表失败'
              });
            case 4:
              return _context2.a(2);
          }
        }, _callee2, null, [[1, 3]]);
      }));
      function fetchPets(_x2) {
        return _fetchPets.apply(this, arguments);
      }
      return fetchPets;
    }(),
    addPet: function () {
      var _addPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee3(data) {
        var _get2, userId, pet, _t2;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              _get2 = get(), userId = _get2.userId;
              if (userId) {
                _context3.n = 1;
                break;
              }
              throw new Error('用户未登录');
            case 1:
              set({
                isLoading: true,
                error: null
              });
              _context3.p = 2;
              _context3.n = 3;
              return (0,_services_petService__WEBPACK_IMPORTED_MODULE_1__.createPet)(userId, data);
            case 3:
              pet = _context3.v;
              set(function (state) {
                return {
                  pets: [].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(state.pets), [pet]),
                  currentPet: state.currentPet || pet,
                  isLoading: false
                };
              });
              return _context3.a(2, pet);
            case 4:
              _context3.p = 4;
              _t2 = _context3.v;
              set({
                isLoading: false,
                error: _t2 instanceof Error ? _t2.message : '添加宠物失败'
              });
              throw _t2;
            case 5:
              return _context3.a(2);
          }
        }, _callee3, null, [[2, 4]]);
      }));
      function addPet(_x3) {
        return _addPet.apply(this, arguments);
      }
      return addPet;
    }(),
    updatePet: function () {
      var _updatePet2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee4(id, data) {
        var _get3, userId, updated, _t3;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              _get3 = get(), userId = _get3.userId;
              if (userId) {
                _context4.n = 1;
                break;
              }
              throw new Error('用户未登录');
            case 1:
              set({
                isLoading: true,
                error: null
              });
              _context4.p = 2;
              _context4.n = 3;
              return (0,_services_petService__WEBPACK_IMPORTED_MODULE_1__.updatePet)(userId, id, data);
            case 3:
              updated = _context4.v;
              set(function (state) {
                var _state$currentPet;
                return {
                  pets: state.pets.map(function (p) {
                    return p.id === id ? updated : p;
                  }),
                  currentPet: ((_state$currentPet = state.currentPet) === null || _state$currentPet === void 0 ? void 0 : _state$currentPet.id) === id ? updated : state.currentPet,
                  isLoading: false
                };
              });
              _context4.n = 5;
              break;
            case 4:
              _context4.p = 4;
              _t3 = _context4.v;
              set({
                isLoading: false,
                error: _t3 instanceof Error ? _t3.message : '更新宠物失败'
              });
              throw _t3;
            case 5:
              return _context4.a(2);
          }
        }, _callee4, null, [[2, 4]]);
      }));
      function updatePet(_x4, _x5) {
        return _updatePet2.apply(this, arguments);
      }
      return updatePet;
    }(),
    removePet: function () {
      var _removePet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee5(id) {
        var _get4, userId, _t4;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context5) {
          while (1) switch (_context5.p = _context5.n) {
            case 0:
              _get4 = get(), userId = _get4.userId;
              if (userId) {
                _context5.n = 1;
                break;
              }
              throw new Error('用户未登录');
            case 1:
              set({
                isLoading: true,
                error: null
              });
              _context5.p = 2;
              _context5.n = 3;
              return (0,_services_petService__WEBPACK_IMPORTED_MODULE_1__.deletePet)(userId, id);
            case 3:
              set(function (state) {
                var _state$currentPet2;
                var remainingPets = state.pets.filter(function (p) {
                  return p.id !== id;
                });
                return {
                  pets: remainingPets,
                  currentPet: ((_state$currentPet2 = state.currentPet) === null || _state$currentPet2 === void 0 ? void 0 : _state$currentPet2.id) === id ? remainingPets[0] || null : state.currentPet,
                  isLoading: false
                };
              });
              _context5.n = 5;
              break;
            case 4:
              _context5.p = 4;
              _t4 = _context5.v;
              set({
                isLoading: false,
                error: _t4 instanceof Error ? _t4.message : '删除宠物失败'
              });
              throw _t4;
            case 5:
              return _context5.a(2);
          }
        }, _callee5, null, [[2, 4]]);
      }));
      function removePet(_x6) {
        return _removePet.apply(this, arguments);
      }
      return removePet;
    }(),
    markPetDeceased: function () {
      var _markPetDeceased = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee6(id, date) {
        var _get5, userId, updated, _t5;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context6) {
          while (1) switch (_context6.p = _context6.n) {
            case 0:
              _get5 = get(), userId = _get5.userId;
              if (userId) {
                _context6.n = 1;
                break;
              }
              throw new Error('用户未登录');
            case 1:
              set({
                isLoading: true,
                error: null
              });
              _context6.p = 2;
              _context6.n = 3;
              return (0,_services_petService__WEBPACK_IMPORTED_MODULE_1__.markDeceased)(userId, id, date);
            case 3:
              updated = _context6.v;
              set(function (state) {
                var _state$currentPet3;
                return {
                  pets: state.pets.map(function (p) {
                    return p.id === id ? updated : p;
                  }),
                  currentPet: ((_state$currentPet3 = state.currentPet) === null || _state$currentPet3 === void 0 ? void 0 : _state$currentPet3.id) === id ? updated : state.currentPet,
                  isLoading: false
                };
              });
              _context6.n = 5;
              break;
            case 4:
              _context6.p = 4;
              _t5 = _context6.v;
              set({
                isLoading: false,
                error: _t5 instanceof Error ? _t5.message : '标记离世失败'
              });
              throw _t5;
            case 5:
              return _context6.a(2);
          }
        }, _callee6, null, [[2, 4]]);
      }));
      function markPetDeceased(_x7, _x8) {
        return _markPetDeceased.apply(this, arguments);
      }
      return markPetDeceased;
    }(),
    switchPet: function () {
      var _switchPet = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee7(id) {
        var _get6, userId, pet, _t6;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context7) {
          while (1) switch (_context7.p = _context7.n) {
            case 0:
              _get6 = get(), userId = _get6.userId;
              if (userId) {
                _context7.n = 1;
                break;
              }
              throw new Error('用户未登录');
            case 1:
              _context7.p = 1;
              pet = get().pets.find(function (p) {
                return p.id === id;
              });
              if (!pet) {
                _context7.n = 2;
                break;
              }
              set({
                currentPet: pet
              });
              _context7.n = 2;
              return (0,_services_petService__WEBPACK_IMPORTED_MODULE_1__.setCurrentPet)(userId, id);
            case 2:
              _context7.n = 4;
              break;
            case 3:
              _context7.p = 3;
              _t6 = _context7.v;
              set({
                error: _t6 instanceof Error ? _t6.message : '切换宠物失败'
              });
              throw _t6;
            case 4:
              return _context7.a(2);
          }
        }, _callee7, null, [[1, 3]]);
      }));
      function switchPet(_x9) {
        return _switchPet.apply(this, arguments);
      }
      return switchPet;
    }(),
    clearError: function clearError() {
      set({
        error: null
      });
    },
    setAvatar2DTaskId: function setAvatar2DTaskId(taskId) {
      set({
        avatar2DTaskId: taskId
      });
      if (taskId) {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync('xhh_avatar_2d_task_id', taskId);
      } else {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync('xhh_avatar_2d_task_id');
      }
    },
    setAvatar3DTaskId: function setAvatar3DTaskId(taskId) {
      set({
        avatar3DTaskId: taskId
      });
      if (taskId) {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync('xhh_avatar_3d_task_id', taskId);
      } else {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync('xhh_avatar_3d_task_id');
      }
    }
  };
});

/***/ }),

/***/ "./src/stores/themeStore.ts":
/*!**********************************!*\
  !*** ./src/stores/themeStore.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "THEME_LIST": function() { return /* binding */ THEME_LIST; },
/* harmony export */   "useThemeStore": function() { return /* binding */ useThemeStore; }
/* harmony export */ });
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! zustand */ "./node_modules/zustand/esm/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);


var THEME_LIST = [
// —— 日间模式（亮色系）——
{
  key: 'sakura-dream-light',
  name: '樱语花境',
  emoji: '🌸',
  desc: '亮粉色系，温柔明亮如樱花雨',
  primaryColor: '#D08AA8',
  mode: 'light',
  navbarBg: '#FFF0F5',
  navbarFrontColor: '#000000',
  tabBarBg: '#FFFFFF',
  tabBarColor: '#A89898',
  tabBarSelectedColor: '#D08AA8',
  tabBarBorderStyle: 'white'
}, {
  key: 'forest-dew-light',
  name: '森林晨露',
  emoji: '🌿',
  desc: '亮绿色系，清新自然如晨间森林',
  primaryColor: '#6AAA88',
  mode: 'light',
  navbarBg: '#F0F8F4',
  navbarFrontColor: '#000000',
  tabBarBg: '#FFFFFF',
  tabBarColor: '#90A098',
  tabBarSelectedColor: '#6AAA88',
  tabBarBorderStyle: 'white'
}, {
  key: 'twilight-coast-light',
  name: '暮色海岸',
  emoji: '🌊',
  desc: '亮蓝色系，清新通透如海天一色',
  primaryColor: '#6A98B8',
  mode: 'light',
  navbarBg: '#F0F5FA',
  navbarFrontColor: '#000000',
  tabBarBg: '#FFFFFF',
  tabBarColor: '#909CA8',
  tabBarSelectedColor: '#6A98B8',
  tabBarBorderStyle: 'white'
}, {
  key: 'honey-glow-light',
  name: '暖阳蜜语',
  emoji: '🍯',
  desc: '亮橙色系，温暖明亮如午后阳光',
  primaryColor: '#C89868',
  mode: 'light',
  navbarBg: '#FFF8F0',
  navbarFrontColor: '#000000',
  tabBarBg: '#FFFFFF',
  tabBarColor: '#A89878',
  tabBarSelectedColor: '#C89868',
  tabBarBorderStyle: 'white'
},
// —— 夜间模式（暗色系）——
{
  key: 'sakura-dream',
  name: '樱语花境',
  emoji: '🌸',
  desc: '暗粉色系，柔雾玫瑰如夜樱低语',
  primaryColor: '#C88EA8',
  mode: 'dark',
  navbarBg: '#1A1418',
  navbarFrontColor: '#ffffff',
  tabBarBg: '#1A1418',
  tabBarColor: '#786870',
  tabBarSelectedColor: '#C88EA8',
  tabBarBorderStyle: 'black'
}, {
  key: 'forest-dew',
  name: '森林晨露',
  emoji: '🌿',
  desc: '暗绿色系，雾霭鼠尾草如夜林漫步',
  primaryColor: '#8EA898',
  mode: 'dark',
  navbarBg: '#141A16',
  navbarFrontColor: '#ffffff',
  tabBarBg: '#141A16',
  tabBarColor: '#687868',
  tabBarSelectedColor: '#8EA898',
  tabBarBorderStyle: 'black'
}, {
  key: 'twilight-coast',
  name: '暮色海岸',
  emoji: '🌊',
  desc: '暗蓝色系，雾蓝海天色静谧深邃',
  primaryColor: '#8EA8B8',
  mode: 'dark',
  navbarBg: '#14181A',
  navbarFrontColor: '#ffffff',
  tabBarBg: '#14181A',
  tabBarColor: '#687078',
  tabBarSelectedColor: '#8EA8B8',
  tabBarBorderStyle: 'black'
}, {
  key: 'honey-glow',
  name: '暖阳蜜语',
  emoji: '🍯',
  desc: '暗橙色系，蜂蜜琥珀色温暖醇厚',
  primaryColor: '#C8A078',
  mode: 'dark',
  navbarBg: '#1A1610',
  navbarFrontColor: '#ffffff',
  tabBarBg: '#1A1610',
  tabBarColor: '#787060',
  tabBarSelectedColor: '#C8A078',
  tabBarBorderStyle: 'black'
}];
var THEME_STORAGE_KEY = 'xhh_theme';
var DEFAULT_THEME = 'sakura-dream-light';
function getStoredTheme() {
  try {
    var raw = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(THEME_STORAGE_KEY);
    if (raw && THEME_LIST.some(function (t) {
      return t.key === raw;
    })) return raw;
  } catch (_unused) {}
  return DEFAULT_THEME;
}

/** 根据主题 key 查找元数据 */
function getMeta(theme) {
  var _THEME_LIST$find;
  return (_THEME_LIST$find = THEME_LIST.find(function (t) {
    return t.key === theme;
  })) !== null && _THEME_LIST$find !== void 0 ? _THEME_LIST$find : THEME_LIST[0];
}

/** 动态更新微信原生导航栏和标签栏颜色 */
function applyNativeBars(theme) {
  var meta = getMeta(theme);
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setNavigationBarColor({
    frontColor: meta.navbarFrontColor,
    backgroundColor: meta.navbarBg,
    animation: {
      duration: 300,
      timingFunc: 'easeInOut'
    }
  }).catch(function () {});
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setTabBarStyle({
    color: meta.tabBarColor,
    selectedColor: meta.tabBarSelectedColor,
    backgroundColor: meta.tabBarBg,
    borderStyle: meta.tabBarBorderStyle
  }).catch(function () {});
}
var useThemeStore = (0,zustand__WEBPACK_IMPORTED_MODULE_1__["default"])(function (set) {
  return {
    current: getStoredTheme(),
    loadTheme: function loadTheme() {
      var theme = getStoredTheme();
      set({
        current: theme
      });
      applyNativeBars(theme);
    },
    setTheme: function setTheme(theme) {
      try {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(THEME_STORAGE_KEY, theme);
      } catch (_unused2) {}
      set({
        current: theme
      });
      applyNativeBars(theme);
      // 通过事件中心通知各页面组件重渲染（Taro 小程序中 Zustand v3 selector 不可靠）
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().eventCenter.trigger('themeChange', theme);
    },
    applyNativeBars: applyNativeBars
  };
});

/***/ }),

/***/ "./src/utils/authGuard.ts":
/*!********************************!*\
  !*** ./src/utils/authGuard.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAuthenticatedUserId": function() { return /* binding */ getAuthenticatedUserId; },
/* harmony export */   "isAuthenticated": function() { return /* binding */ isAuthenticated; },
/* harmony export */   "requireAuth": function() { return /* binding */ requireAuth; }
/* harmony export */ });
/* unused harmony exports AuthenticationError, requireAuthAsync */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_typeof_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/typeof.js */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createClass_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createClass.js */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_classCallCheck_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_callSuper_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/callSuper.js */ "./node_modules/@babel/runtime/helpers/esm/callSuper.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_inherits_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/inherits.js */ "./node_modules/@babel/runtime/helpers/esm/inherits.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_wrapNativeSuper_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js */ "./node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jwt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./jwt */ "./src/utils/jwt.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../config */ "./src/config/index.ts");











var _CONFIG$STORAGE_KEYS = _config__WEBPACK_IMPORTED_MODULE_2__.CONFIG.STORAGE_KEYS,
  TOKEN = _CONFIG$STORAGE_KEYS.TOKEN,
  USER = _CONFIG$STORAGE_KEYS.USER,
  REFRESH_TOKEN = _CONFIG$STORAGE_KEYS.REFRESH_TOKEN;
var AuthenticationError = /*#__PURE__*/function (_Error) {
  function AuthenticationError(message) {
    var _this;
    (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_classCallCheck_js__WEBPACK_IMPORTED_MODULE_3__["default"])(this, AuthenticationError);
    _this = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_callSuper_js__WEBPACK_IMPORTED_MODULE_4__["default"])(this, AuthenticationError, [message]);
    _this.name = 'AuthenticationError';
    return _this;
  }
  (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_inherits_js__WEBPACK_IMPORTED_MODULE_5__["default"])(AuthenticationError, _Error);
  return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createClass_js__WEBPACK_IMPORTED_MODULE_6__["default"])(AuthenticationError);
}(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_wrapNativeSuper_js__WEBPACK_IMPORTED_MODULE_7__["default"])(Error));
function getAuthenticatedUserId() {
  var token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(TOKEN);
  if (!token) {
    throw new AuthenticationError('未登录，请先登录');
  }
  if (!(0,_jwt__WEBPACK_IMPORTED_MODULE_1__.isTokenFormatValid)(token)) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(TOKEN);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(REFRESH_TOKEN);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(USER);
    throw new AuthenticationError('登录已过期，请重新登录');
  }
  var userRaw = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(USER);
  if (!userRaw) {
    throw new AuthenticationError('用户信息缺失，请重新登录');
  }
  try {
    var user = JSON.parse(userRaw);
    if (!(user !== null && user !== void 0 && user.id)) {
      throw new AuthenticationError('用户ID缺失，请重新登录');
    }
    return user.id;
  } catch (e) {
    if (e instanceof AuthenticationError) throw e;
    if ((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_typeof_js__WEBPACK_IMPORTED_MODULE_8__["default"])(userRaw) === 'object' && userRaw !== null && 'id' in userRaw) {
      return userRaw.id;
    }
    throw new AuthenticationError('用户信息损坏，请重新登录');
  }
}
function requireAuthAsync() {
  return _requireAuthAsync.apply(this, arguments);
}
function _requireAuthAsync() {
  _requireAuthAsync = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee() {
    var token, userId;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(TOKEN);
          if (!(!token || !(0,_jwt__WEBPACK_IMPORTED_MODULE_1__.isTokenFormatValid)(token))) {
            _context.n = 1;
            break;
          }
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(TOKEN);
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(REFRESH_TOKEN);
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(USER);
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().navigateTo({
            url: '/pages/login/index'
          });
          throw new AuthenticationError('登录已过期，请重新登录');
        case 1:
          userId = getAuthenticatedUserId();
          return _context.a(2, {
            userId: userId,
            token: token
          });
      }
    }, _callee);
  }));
  return _requireAuthAsync.apply(this, arguments);
}
function requireAuth() {
  var token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(TOKEN);
  if (!token || !(0,_jwt__WEBPACK_IMPORTED_MODULE_1__.isTokenFormatValid)(token)) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(TOKEN);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(REFRESH_TOKEN);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(USER);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().navigateTo({
      url: '/pages/login/index'
    });
    throw new AuthenticationError('登录已过期，请重新登录');
  }
  var userId = getAuthenticatedUserId();
  return {
    userId: userId,
    token: token
  };
}
function isAuthenticated() {
  var token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(TOKEN);
  return !!token && (0,_jwt__WEBPACK_IMPORTED_MODULE_1__.isTokenFormatValid)(token);
}

/***/ }),

/***/ "./src/utils/crypto.ts":
/*!*****************************!*\
  !*** ./src/utils/crypto.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CryptoJS": function() { return /* binding */ CryptoJS; },
/* harmony export */   "decrypt": function() { return /* binding */ decrypt; },
/* harmony export */   "encrypt": function() { return /* binding */ encrypt; }
/* harmony export */ });
/* unused harmony export generateId */
/* harmony import */ var crypto_js_aes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! crypto-js/aes */ "./node_modules/crypto-js/aes.js");
/* harmony import */ var crypto_js_aes__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(crypto_js_aes__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var crypto_js_sha256__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! crypto-js/sha256 */ "./node_modules/crypto-js/sha256.js");
/* harmony import */ var crypto_js_sha256__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(crypto_js_sha256__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! crypto-js/enc-utf8 */ "./node_modules/crypto-js/enc-utf8.js");
/* harmony import */ var crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var crypto_js_enc_base64__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! crypto-js/enc-base64 */ "./node_modules/crypto-js/enc-base64.js");
/* harmony import */ var crypto_js_enc_base64__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(crypto_js_enc_base64__WEBPACK_IMPORTED_MODULE_3__);




var APP_SALT =  false || 'xhh-v2-aes-salt-2026-dev';
function deriveKey(userId) {
  return crypto_js_sha256__WEBPACK_IMPORTED_MODULE_1___default()(APP_SALT + ':' + userId).toString();
}
function encrypt(data, userId) {
  var key = deriveKey(userId);
  return crypto_js_aes__WEBPACK_IMPORTED_MODULE_0___default().encrypt(data, key).toString();
}
function decrypt(encrypted, userId) {
  try {
    var key = deriveKey(userId);
    var bytes = crypto_js_aes__WEBPACK_IMPORTED_MODULE_0___default().decrypt(encrypted, key);
    return bytes.toString((crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_2___default()));
  } catch (_unused) {
    return '';
  }
}
function generateId() {
  return "".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 9));
}
var CryptoJS = {
  AES: (crypto_js_aes__WEBPACK_IMPORTED_MODULE_0___default()),
  SHA256: (crypto_js_sha256__WEBPACK_IMPORTED_MODULE_1___default()),
  enc: {
    Utf8: (crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_2___default()),
    Base64: (crypto_js_enc_base64__WEBPACK_IMPORTED_MODULE_3___default())
  }
};

/***/ }),

/***/ "./src/utils/jwt.ts":
/*!**************************!*\
  !*** ./src/utils/jwt.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isTokenFormatValid": function() { return /* binding */ isTokenFormatValid; }
/* harmony export */ });
/* unused harmony exports parseJwt, isTokenExpired, getTokenExpiry, isTokenExpiringSoon, verifyToken, validateTokenWithServer */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./crypto */ "./src/utils/crypto.ts");



function base64UrlDecode(str) {
  var base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(_crypto__WEBPACK_IMPORTED_MODULE_0__.CryptoJS.enc.Utf8.stringify(_crypto__WEBPACK_IMPORTED_MODULE_0__.CryptoJS.enc.Base64.parse(base64)));
}
function parseJwt(token) {
  try {
    var parts = token.split('.');
    if (parts.length !== 3) return null;
    var payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload);
  } catch (_unused) {
    return null;
  }
}
function isTokenExpired(token) {
  var payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  var exp = payload.exp;
  return Date.now() >= exp * 1000;
}
function getTokenExpiry(token) {
  var payload = parseJwt(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
}
function isTokenExpiringSoon(token) {
  var expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry - Date.now() < 30 * 60 * 1000;
}
function isTokenFormatValid(token) {
  if (!token || token.split('.').length !== 3) return false;
  return !isTokenExpired(token);
}

/** @deprecated Use isTokenFormatValid for local checks or validateTokenWithServer for security-critical operations */
var verifyToken = isTokenFormatValid;
function validateTokenWithServer(_x) {
  return _validateTokenWithServer.apply(this, arguments);
}
function _validateTokenWithServer() {
  _validateTokenWithServer = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee(token) {
    var supabaseUrl, res, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (isTokenFormatValid(token)) {
            _context.n = 1;
            break;
          }
          return _context.a(2, false);
        case 1:
          _context.p = 1;
          supabaseUrl = "";
          if (supabaseUrl) {
            _context.n = 2;
            break;
          }
          return _context.a(2, isTokenFormatValid(token));
        case 2:
          _context.n = 3;
          return fetch("".concat(supabaseUrl, "/auth/v1/user"), {
            headers: {
              'Authorization': "Bearer ".concat(token),
              'apikey':  false || ''
            }
          });
        case 3:
          res = _context.v;
          return _context.a(2, res.ok);
        case 4:
          _context.p = 4;
          _t = _context.v;
          return _context.a(2, isTokenFormatValid(token));
      }
    }, _callee, null, [[1, 4]]);
  }));
  return _validateTokenWithServer.apply(this, arguments);
}

/***/ }),

/***/ "./src/utils/namingPrompts.ts":
/*!************************************!*\
  !*** ./src/utils/namingPrompts.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "buildInterpretPrompt": function() { return /* binding */ buildInterpretPrompt; },
/* harmony export */   "buildRecommendPrompt": function() { return /* binding */ buildRecommendPrompt; }
/* harmony export */ });
function buildInterpretPrompt(name, breed, birthDate) {
  return "\u4F60\u662F\u4E00\u4F4D\u7CBE\u901A\u4E2D\u56FD\u4F20\u7EDF\u6587\u5316\u7684\u53D6\u540D\u5927\u5E08\u3002\u8BF7\u4ECE\u4EE5\u4E0B\u89D2\u5EA6\u5206\u6790\u5BA0\u7269\u540D\u5B57\uFF1A\n\n\u540D\u5B57\uFF1A".concat(name, "\n\u54C1\u79CD\uFF1A").concat(breed, "\n\u51FA\u751F\u65E5\u671F\uFF1A").concat(birthDate, "\n\n\u8BF7\u4ECE\u4EE5\u4E0B\u7EF4\u5EA6\u89E3\u8BFB\uFF08\u63A7\u5236\u57285-8\u53E5\u8BDD\u5185\uFF09\uFF1A\n1. \u4E94\u884C\u5C5E\u6027\uFF08\u6839\u636E\u540D\u5B57\u5B57\u7684\u4E94\u884C\uFF09\n2. \u5B88\u62A4\u661F\u5BBF\uFF08\u4E8C\u5341\u516B\u661F\u5BBF\u4E4B\u4E00\uFF09\n3. \u8BD7\u8BCD\u5178\u6545\u51FA\u5904\n4. \u5BD3\u610F\u4E0E\u7EFC\u5408\u8BC4\u4EF7\n\n\u4F7F\u7528\u6E29\u6696\u3001\u96C5\u81F4\u7684\u8BED\u6C14\uFF0C\u5F15\u7528\u7ECF\u5178\u8BD7\u53E5\uFF08\u6807\u6CE8\u51FA\u5904\uFF09\uFF0C\u8BA9\u7528\u6237\u611F\u53D7\u5230\u6587\u5316\u6DF1\u5EA6\u3002");
}
function buildRecommendPrompt(breed, birthDate, gender, season) {
  return "\u4E3A\u4E00\u53EA".concat(breed, "\u63A8\u83503\u4E2A\u4E2D\u6587\u5BA0\u7269\u540D\u5B57\u3002\u51FA\u751F\u65E5\u671F").concat(birthDate, "\uFF0C").concat(season, "\u5929\uFF0C").concat(gender, "\u3002\n\n\u6BCF\u4E2A\u540D\u5B57\u4ECE\u4EE5\u4E0B\u89D2\u5EA6\u89E3\u8BFB\uFF1A\n1. \u6765\u6E90\uFF08\u8BD7\u8BCD/\u5178\u6545/\u5C71\u5DDD\u5730\u540D/\u661F\u5BBF\uFF09\n2. \u4E94\u884C\u5C5E\u6027\u53CA\u4E0E\u51FA\u751F\u5B63\u8282\u7684\u5173\u8054\n3. \u5BD3\u610F\u7B80\u8FF0\n\n\u63A8\u8350\u8981\u6C42\uFF1A\n- \u540D\u5B572-3\u4E2A\u6C49\u5B57\n- \u53E4\u5178\u96C5\u81F4\n- \u6709\u6587\u5316\u5E95\u8574\n- \u907F\u514D\u8FC7\u4E8E\u5E38\u89C1\u7684\u540D\u5B57\n\n\u8F93\u51FA\u683C\u5F0F\uFF1A\n\u2460 \u300C\u540D\u5B57\u300D\n\u6765\u6E90\uFF1Axxx\n\u4E94\u884C\uFF1Axxx\uFF08\u4E0E\u5B63\u8282xxx\u7684\u5173\u8054\uFF09\n\u5BD3\u610F\uFF1Axxx");
}

/***/ }),

/***/ "./src/utils/petOwnership.ts":
/*!***********************************!*\
  !*** ./src/utils/petOwnership.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "requirePetOwnership": function() { return /* binding */ requirePetOwnership; }
/* harmony export */ });
/* unused harmony export isPetOwnerLocal */
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./storage */ "./src/utils/storage.ts");

var PETS_KEY = 'pets';
function userKey(userId, key) {
  return "".concat(key, "_").concat(userId);
}
function isPetOwnerLocal(petId, userId) {
  if (!petId || !userId) return false;
  var pets = (0,_storage__WEBPACK_IMPORTED_MODULE_0__.getStorage)(userKey(userId, PETS_KEY)) || [];
  return pets.some(function (p) {
    return p.id === petId;
  });
}
function requirePetOwnership(petId, userId) {
  if (!userId) {
    throw new Error('[PetOwnership] userId is required');
  }
  if (!petId) {
    throw new Error('[PetOwnership] petId is required');
  }
  if (!isPetOwnerLocal(petId, userId)) {
    throw new Error('[PetOwnership] 无权访问该宠物数据');
  }
}

/***/ }),

/***/ "./src/utils/ruleGuard.ts":
/*!********************************!*\
  !*** ./src/utils/ruleGuard.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "checkInput": function() { return /* binding */ checkInput; }
/* harmony export */ });
/* unused harmony export sanitizeOutput */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");

var SELF_HARM_KEYWORDS = ['自杀', '自残', '自伤', '不想活了', '活不下去', '结束生命', '了结自己', '死了一了百了'];
var ANIMAL_ABUSE_KEYWORDS = ['虐待', '毒杀', '下毒', '打死', '弄死', '杀猫', '杀狗', '安乐死自己', '怎么让宠物死'];
var PRIVACY_PATTERNS = [/1[3-9]\d{9}/, /\d{17}[\dXx]/, /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/];
var TOXIC_FOOD_NAMES = ['巧克力', '可可', '葡萄', '洋葱', '大蒜', '木糖醇', '牛油果', '酒精', '咖啡', '茶', '夏威夷果', '生面团', '韭菜', '葱', '啤酒', '红酒', '白酒', '咖啡因', '百合', '郁金香', '水仙', '夹竹桃', '蓖麻'];
function checkInput(text) {
  var _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__["default"])(SELF_HARM_KEYWORDS),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var kw = _step.value;
      if (text.includes(kw)) {
        return {
          blocked: true,
          isCrisis: true,
          reason: '检测到自我伤害倾向',
          action: 'crisis_intervention'
        };
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var _iterator2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__["default"])(ANIMAL_ABUSE_KEYWORDS),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _kw = _step2.value;
      if (text.includes(_kw)) {
        return {
          blocked: true,
          isCrisis: false,
          reason: '检测到虐待动物倾向',
          action: 'block'
        };
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  var _iterator3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__["default"])(PRIVACY_PATTERNS),
    _step3;
  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var pattern = _step3.value;
      if (pattern.test(text)) {
        return {
          blocked: true,
          isCrisis: false,
          reason: '检测到疑似隐私信息',
          action: 'block'
        };
      }
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
  return {
    blocked: false,
    isCrisis: false,
    action: 'pass'
  };
}
function sanitizeOutput(text) {
  var maxLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 150;
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

/***/ }),

/***/ "./src/utils/storage.ts":
/*!******************************!*\
  !*** ./src/utils/storage.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getStorage": function() { return /* binding */ getStorage; },
/* harmony export */   "getStorageArray": function() { return /* binding */ getStorageArray; },
/* harmony export */   "removeStorage": function() { return /* binding */ removeStorage; },
/* harmony export */   "setStorage": function() { return /* binding */ setStorage; },
/* harmony export */   "setStorageUserId": function() { return /* binding */ setStorageUserId; },
/* harmony export */   "storage": function() { return /* binding */ storage; }
/* harmony export */ });
/* unused harmony export clearAllStorage */
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config/index.ts");


var storage = {
  getToken: function getToken() {
    try {
      return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.TOKEN) || null;
    } catch (_unused) {
      return null;
    }
  },
  setToken: function setToken(token) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.TOKEN, token);
  },
  removeToken: function removeToken() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.TOKEN);
  },
  getUser: function getUser() {
    try {
      var raw = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch (_unused2) {
      return null;
    }
  },
  setUser: function setUser(user) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  },
  removeUser: function removeUser() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.USER);
  },
  getRefreshToken: function getRefreshToken() {
    try {
      return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.REFRESH_TOKEN) || null;
    } catch (_unused3) {
      return null;
    }
  },
  setRefreshToken: function setRefreshToken(token) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  removeRefreshToken: function removeRefreshToken() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  },
  clear: function clear() {
    storage.removeToken();
    storage.removeUser();
    storage.removeRefreshToken();
  }
};
var _currentUserId = '';
function setStorageUserId(userId) {
  _currentUserId = userId;
}
function _getKey(key) {
  return _currentUserId ? "".concat(_currentUserId, "_").concat(key) : key;
}
function getStorage(key) {
  try {
    var raw = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(_getKey(key));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_unused4) {
    return null;
  }
}
function getStorageArray(key) {
  var data = getStorage(key);
  return Array.isArray(data) ? data : [];
}
function setStorage(key, value) {
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(_getKey(key), JSON.stringify(value));
}
function removeStorage(key) {
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(_getKey(key));
}
function clearAllStorage() {
  storage.clear();
  var info = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageInfoSync();
  info.keys.forEach(function (key) {
    if (key.startsWith(_currentUserId + '_')) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(key);
    }
  });
}

/***/ }),

/***/ "?9157":
/*!************************!*\
  !*** crypto (ignored) ***!
  \************************/
/***/ (function() {

/* (ignored) */

/***/ })

}]);
//# sourceMappingURL=common.js.map