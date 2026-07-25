(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/index/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Index; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var _hooks_useChatCore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../hooks/useChatCore */ "./src/hooks/useChatCore.ts");
/* harmony import */ var _hooks_useCheckinFlow__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../hooks/useCheckinFlow */ "./src/hooks/useCheckinFlow.ts");
/* harmony import */ var _hooks_useSymptomFlow__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../hooks/useSymptomFlow */ "./src/hooks/useSymptomFlow.ts");
/* harmony import */ var _hooks_useNamingFlow__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../hooks/useNamingFlow */ "./src/hooks/useNamingFlow.ts");
/* harmony import */ var _hooks_useFoodFlow__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../hooks/useFoodFlow */ "./src/hooks/useFoodFlow.ts");
/* harmony import */ var _hooks_useMemoryFlow__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../hooks/useMemoryFlow */ "./src/hooks/useMemoryFlow.ts");
/* harmony import */ var _stores_petStore__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../stores/petStore */ "./src/stores/petStore.ts");
/* harmony import */ var _components_HomeSkeleton__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../components/HomeSkeleton */ "./src/components/HomeSkeleton.tsx");
/* harmony import */ var _utils_suggestQuickActions__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../utils/suggestQuickActions */ "./src/utils/suggestQuickActions.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");
















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
  var pet = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_9__.usePetStore)(function (s) {
    return s.currentPet;
  });
  var pets = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_9__.usePetStore)(function (s) {
    return s.pets;
  });
  var isLoading = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_9__.usePetStore)(function (s) {
    return s.isLoading;
  });
  var activePet = (_ref = pet !== null && pet !== void 0 ? pet : pets[0]) !== null && _ref !== void 0 ? _ref : null;
  return {
    name: (activePet === null || activePet === void 0 ? void 0 : activePet.name) || '',
    emoji: (activePet === null || activePet === void 0 ? void 0 : activePet.species) === 'cat' ? '🐱' : (activePet === null || activePet === void 0 ? void 0 : activePet.species) === 'dog' ? '🐕' : '🐾',
    breed: (activePet === null || activePet === void 0 ? void 0 : activePet.breed) || '',
    age: activePet !== null && activePet !== void 0 && activePet.birthDate ? calcAge(activePet.birthDate) : '',
    hasPet: pets.length > 0,
    isLoading: isLoading,
    activePet: activePet
  };
}
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
function Index() {
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__.useThemeClass)();
  var petInfo = usePetInfo();
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(''),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_13__["default"])(_useState, 2),
    inputValue = _useState2[0],
    setInputValue = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_13__["default"])(_useState3, 2),
    plusMenuOpen = _useState4[0],
    setPlusMenuOpen = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_13__["default"])(_useState5, 2),
    showGreetingQuickActions = _useState6[0],
    setShowGreetingQuickActions = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([{
      action: 'checkin',
      label: '打卡',
      emoji: '💩'
    }, {
      action: 'food',
      label: '查食物',
      emoji: '🔍'
    }, {
      action: 'symptom',
      label: '症状初筛',
      emoji: '💊'
    }]),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_13__["default"])(_useState7, 2),
    currentQuickActions = _useState8[0],
    setCurrentQuickActions = _useState8[1];
  var chat = (0,_hooks_useChatCore__WEBPACK_IMPORTED_MODULE_3__.useChatCore)({
    petInfo: petInfo,
    inputValue: inputValue,
    setInputValue: setInputValue,
    setPlusMenuOpen: setPlusMenuOpen,
    setShowGreetingQuickActions: setShowGreetingQuickActions
  });
  var checkin = (0,_hooks_useCheckinFlow__WEBPACK_IMPORTED_MODULE_4__.useCheckinFlow)({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    addMessage: chat.addMessage,
    petInfo: petInfo
  });
  var symptom = (0,_hooks_useSymptomFlow__WEBPACK_IMPORTED_MODULE_5__.useSymptomFlow)({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    addMessage: chat.addMessage,
    petInfo: petInfo
  });
  var naming = (0,_hooks_useNamingFlow__WEBPACK_IMPORTED_MODULE_6__.useNamingFlow)({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    addMessage: chat.addMessage,
    petInfo: petInfo
  });
  var food = (0,_hooks_useFoodFlow__WEBPACK_IMPORTED_MODULE_7__.useFoodFlow)({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    addMessage: chat.addMessage,
    setIsTyping: chat.setIsTyping,
    petInfo: petInfo
  });
  var memory = (0,_hooks_useMemoryFlow__WEBPACK_IMPORTED_MODULE_8__.useMemoryFlow)({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    setIsTyping: chat.setIsTyping,
    petInfo: petInfo
  });

  // 将食物/回忆流程处理器注册到聊天核心，打破循环依赖
  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    chat.setFlowHandlers({
      foodActive: food.foodActive,
      selectFood: food.selectFood,
      memoryActive: memory.memoryActive,
      handleMemoryRecord: memory.handleMemoryRecord
    });
  });

  // 长按消息复制内容
  var handleLongPress = function handleLongPress(msg) {
    if (!msg.content) return;
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setClipboardData({
      data: msg.content,
      success: function success() {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
          title: '已复制',
          icon: 'success',
          duration: 1500
        });
      }
    });
  };
  var handleQuickAction = function handleQuickAction(action) {
    setShowGreetingQuickActions(false);
    if (action === 'checkin') checkin.startCheckin();else if (action === 'food') food.handleFoodQuery();else if (action === 'symptom') symptom.startSymptom();else if (action === 'naming') naming.startNaming();else if (action === 'memory') memory.startMemoryRecord();
  };

  // 用户发送消息后，根据消息内容更新快捷操作推荐
  var handleSendWithSuggestions = function handleSendWithSuggestions() {
    var text = inputValue.trim();
    if (!text) return;
    // 分析用户消息，更新推荐
    var suggestions = (0,_utils_suggestQuickActions__WEBPACK_IMPORTED_MODULE_11__.suggestQuickActions)(text);
    setCurrentQuickActions(suggestions);
    // 调用原始 handleSend
    chat.handleSend();
  };
  var handlePlusMenuItem = function handlePlusMenuItem(index) {
    setPlusMenuOpen(false);
    switch (index) {
      case 0:
        checkin.startCheckin();
        break;
      case 1:
        naming.startNaming();
        break;
      case 2:
        memory.startMemoryRecord();
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
  var getCurrentFlowType = function getCurrentFlowType() {
    if (checkin.checkinStep >= 0) return 'checkin';
    if (symptom.symptomStep >= 0) return 'symptom';
    if (naming.namingStep >= 0) return 'naming';
    return null;
  };
  var handleOptionClick = function handleOptionClick(option) {
    var flowType = getCurrentFlowType();
    if (flowType === 'checkin') checkin.handleCheckinAnswer(option);else if (flowType === 'symptom') symptom.handleSymptomAnswer(option);else if (flowType === 'naming') naming.handleNamingAnswer(option);
  };
  var renderMessageContent = function renderMessageContent(msg) {
    return msg.content.split('\n').map(function (line, i) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
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
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-card",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "msg-card-title",
              children: card.title
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "score-stars",
              children: [1, 2, 3, 4, 5].map(function (i) {
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  children: i <= starCount ? '★' : '☆'
                }, i);
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-stat",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-stat-label",
                children: "\u7EFC\u5408\u8BC4\u5206"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-stat-val",
                children: [card.score, " \u5206"]
              })]
            }), (_card$stats = card.stats) === null || _card$stats === void 0 ? void 0 : _card$stats.map(function (stat, si) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-card-stat",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-card-stat-label",
                  children: [stat.emoji || '', " ", stat.label]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
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
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-card",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "msg-card-title",
              children: card.title
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "msg-card-text",
              children: card.desc
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-alert ".concat(isSafe ? 'msg-card-alert--safe' : 'msg-card-alert--danger'),
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                children: [isSafe ? '👍 建议：' : '⚠ 建议：', card.advice]
              })
            }), !isSafe && card.risk === 'P0' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-hospital",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-title",
                children: "\uD83C\uDFE5 \u5982\u679C\u8BEF\u98DF\uFF0C\u8BF7\u7ACB\u5373\u5C31\u533B"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-item",
                children: "\uD83C\uDFE5 \u745E\u9E4F\u5BA0\u7269\u533B\u9662 \xB7 1.2km"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-item",
                children: "\uD83C\uDFE5 \u7F8E\u8054\u4F17\u5408 \xB7 2.5km"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-item",
                children: "\uD83C\uDFE5 \u82AD\u6BD4\u5802 \xB7 3.1km"
              })]
            })]
          });
        }
      case 'symptom_result':
        {
          var _card$symptomInfo;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-card",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "msg-card-title",
              children: card.title
            }), (_card$symptomInfo = card.symptomInfo) === null || _card$symptomInfo === void 0 ? void 0 : _card$symptomInfo.map(function (info, si) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-card-stat",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-card-stat-label",
                  children: info.label
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-card-stat-val",
                  children: info.value
                })]
              }, si);
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-alert ".concat(card.riskLevel === 'critical' || card.riskLevel === 'high' ? 'msg-card-alert--danger' : 'msg-card-alert--safe'),
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                children: card.advice
              })
            }), card.hospitalList && card.hospitalList.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-card-hospital",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "msg-card-hospital-title",
                children: "\uD83C\uDFE5 \u9644\u8FD1\u7684\u5BA0\u7269\u533B\u9662"
              }), card.hospitalList.map(function (h, hi) {
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
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
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            children: (_card$names = card.names) === null || _card$names === void 0 ? void 0 : _card$names.map(function (n, ni) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-naming-card",
                children: [ni === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "msg-naming-badge",
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    children: "\u63A8\u8350"
                  })
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "msg-naming-name",
                  children: n.name
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "score-stars",
                  style: {
                    marginBottom: '8rpx'
                  },
                  children: [1, 2, 3, 4, 5].map(function (i) {
                    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                      children: i <= Math.round(n.score / 20) ? '★' : '☆'
                    }, i);
                  })
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
    className: "chat-home-page ".concat(themeClass),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
      className: "chat-paw-particles",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--1",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--2",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--3",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--4",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--5",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-paw chat-paw--6",
        children: "\uD83D\uDC3E"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
      className: "chat-stars",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--1",
        children: "\u2726"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--2",
        children: "\u2727"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--3",
        children: "\u2726"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--4",
        children: "\u2727"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--5",
        children: "\u2726"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-star chat-star--6",
        children: "\u2727"
      })]
    }), petInfo.isLoading && !petInfo.hasPet ?
    /*#__PURE__*/
    /* 加载中：骨架屏 */
    (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_components_HomeSkeleton__WEBPACK_IMPORTED_MODULE_10__["default"], {}) : !petInfo.hasPet ?
    /*#__PURE__*/
    /* 空状态：引导用户添加宠物 */
    (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
      className: "chat-empty",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "chat-empty-icon",
        children: "\uD83D\uDC3E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-empty-title",
        children: "\u6B22\u8FCE\u6765\u5230\u661F\u5BF0\u6D77"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
        className: "chat-empty-desc",
        children: ["\u6DFB\u52A0\u4F60\u7684\u7B2C\u4E00\u4F4D\u5BA0\u7269\u4F19\u4F34\uFF0C", '\n', "\u5F00\u59CB\u8BB0\u5F55\u6E29\u99A8\u7684\u6BCF\u4E00\u5929"]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "chat-empty-btn",
        onClick: function onClick() {
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().navigateTo({
            url: '/pagesPet/add/index'
          });
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "chat-empty-btn-text",
          children: "+ \u6DFB\u52A0\u5BA0\u7269"
        })
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "chat-top-bar",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-top-left",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-pet-avatar",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: petInfo.emoji
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-top-info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "chat-pet-name",
              children: petInfo.name
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "chat-pet-detail",
              children: [petInfo.breed, " \xB7 ", petInfo.age]
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-switch-btn",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
              title: '切换宠物',
              icon: 'none'
            });
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
            children: "\u5207\u6362"
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.ScrollView, {
        className: "chat-msg-list",
        scrollY: true,
        scrollWithAnimation: true,
        ref: chat.scrollRef,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "msg-row ai",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-avatar",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\uD83E\uDD16"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-bubble-wrap",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-bubble",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                children: ["\u65E9\u5B89\u5440\uFF01\u6211\u662F", petInfo.name, "\u7684AI\u5C0F\u52A9\u624B \u2726", '\n\n', petInfo.name, "\u4ECA\u5929\u600E\u4E48\u6837\uFF1F\u6765\u6253\u4E2A\u5361\u5427\uFF5E \u6216\u8005\u544A\u8BC9\u6211\u4F60\u60F3\u4E86\u89E3\u4EC0\u4E48\uFF1F"]
              })
            }), showGreetingQuickActions && checkin.checkinStep < 0 && symptom.symptomStep < 0 && naming.namingStep < 0 && !food.foodActive && !memory.memoryActive && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-quick-actions",
              children: currentQuickActions.map(function (qa) {
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "msg-quick-btn",
                  onClick: function onClick() {
                    return handleQuickAction(qa.action);
                  },
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    children: [qa.emoji, " ", qa.label]
                  })
                }, qa.action);
              })
            })]
          })]
        }), chat.messages.map(function (msg, idx) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-row ".concat(msg.type),
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-avatar",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                children: msg.type === 'ai' ? '🤖' : '😊'
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "msg-bubble-wrap",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-bubble ".concat(msg.id === chat.streamingId ? 'msg-bubble--streaming' : ''),
                onClick: msg.id === chat.streamingId ? chat.skipStream : undefined,
                onLongPress: function onLongPress() {
                  return handleLongPress(msg);
                },
                children: [renderMessageContent(msg), msg.id === chat.streamingId && msg.content && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                  className: "streaming-cursor",
                  children: "\u258B"
                })]
              }), msg.id === chat.streamingId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "streaming-hint",
                children: "\u70B9\u51FB\u8DF3\u8FC7 \u2191"
              }), msg.card && renderCard(msg.card), idx === chat.messages.length - 1 && msg.type === 'ai' && showGreetingQuickActions && checkin.checkinStep < 0 && symptom.symptomStep < 0 && naming.namingStep < 0 && !food.foodActive && !memory.memoryActive && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-quick-actions",
                children: currentQuickActions.map(function (qa) {
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                    className: "msg-quick-btn",
                    onClick: function onClick() {
                      return handleQuickAction(qa.action);
                    },
                    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                      children: [qa.emoji, " ", qa.label]
                    })
                  }, qa.action);
                })
              }), msg.options && msg.options.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "msg-options-list",
                children: msg.options.map(function (opt, oi) {
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                    className: "msg-option",
                    onClick: function onClick() {
                      return handleOptionClick(opt);
                    },
                    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                      children: opt
                    })
                  }, oi);
                })
              })]
            })]
          }, msg.id);
        }), chat.isTyping && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "msg-row ai",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-avatar",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\uD83E\uDD16"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "msg-bubble typing-bubble",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
              className: "typing-dots",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "typing-dot"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "typing-dot"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "typing-dot"
              })]
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-bottom-spacer"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "chat-input-area",
        children: [plusMenuOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-plus-overlay",
            onClick: function onClick() {
              return setPlusMenuOpen(false);
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-plus-menu",
            children: PLUS_MENU_ITEMS.map(function (item, idx) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                className: "plus-menu-item",
                onClick: function onClick() {
                  return handlePlusMenuItem(idx);
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "plus-menu-icon-wrap",
                  style: {
                    background: item.bg
                  },
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    className: "plus-menu-icon",
                    children: item.icon
                  })
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
                  className: "plus-menu-text",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    className: "plus-menu-label",
                    children: item.label
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                    className: "plus-menu-sub",
                    children: item.sub
                  })]
                })]
              }, idx);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-input-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-plus-btn",
            onClick: function onClick() {
              return setPlusMenuOpen(!plusMenuOpen);
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "chat-plus-text",
              children: "+"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
            className: "chat-input-field",
            value: inputValue,
            onInput: function onInput(e) {
              return setInputValue(e.detail.value);
            },
            onConfirm: handleSendWithSuggestions,
            onFocus: function onFocus() {
              return setPlusMenuOpen(false);
            },
            placeholder: "\u8BF4\u8BF4".concat(petInfo.name, "\u4ECA\u5929\u7684\u60C5\u51B5..."),
            placeholderStyle: "color: #556",
            confirmType: "send"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "chat-send-btn",
            onClick: handleSendWithSuggestions,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "chat-send-text",
              children: "\u2191"
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "chat-input-safe"
        })]
      })]
    })]
  });
}

/***/ }),

/***/ "./src/components/HomeSkeleton.tsx":
/*!*****************************************!*\
  !*** ./src/components/HomeSkeleton.tsx ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ HomeSkeleton; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _HomeSkeleton_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./HomeSkeleton.scss */ "./src/components/HomeSkeleton.scss");
/* harmony import */ var _HomeSkeleton_scss__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_HomeSkeleton_scss__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");



function HomeSkeleton() {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
    className: "home-skeleton",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "home-skeleton__header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "home-skeleton__title"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "home-skeleton__icon"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "home-skeleton__pet-card",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "home-skeleton__avatar"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "home-skeleton__info",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "home-skeleton__name"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "home-skeleton__detail"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "home-skeleton__section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "home-skeleton__section-title"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "home-skeleton__grid",
        children: Array.from({
          length: 8
        }).map(function (_, i) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
            className: "home-skeleton__action",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
              className: "home-skeleton__action-icon"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
              className: "home-skeleton__action-label"
            })]
          }, i);
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "home-skeleton__section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "home-skeleton__section-title"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "home-skeleton__card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "home-skeleton__card-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
            className: "home-skeleton__card-icon"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
            className: "home-skeleton__card-title"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "home-skeleton__card-body",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
            className: "home-skeleton__card-line"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
            className: "home-skeleton__card-line"
          })]
        })]
      })]
    })]
  });
}

/***/ }),

/***/ "./src/hooks/useChatCore.ts":
/*!**********************************!*\
  !*** ./src/hooks/useChatCore.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useChatCore": function() { return /* binding */ useChatCore; }
/* harmony export */ });
/* unused harmony export genId */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _services_chatService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../services/chatService */ "./src/services/chatService.ts");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../logger */ "./src/logger/index.ts");








var messageIdCounter = 0;

/** 生成唯一消息 ID */
function genId() {
  return "msg_".concat(++messageIdCounter, "_").concat(Date.now());
}

/** 食物/回忆流程处理器，由主组件注册以打破循环依赖 */

/**
 * 聊天核心 Hook
 *
 * 管理消息列表、流式输出、打字状态与聊天历史，
 * 并通过 handleSend 编排普通聊天流程与食物/回忆流程的分流。
 */
function useChatCore(params) {
  var petInfo = params.petInfo,
    inputValue = params.inputValue,
    setInputValue = params.setInputValue,
    setPlusMenuOpen = params.setPlusMenuOpen,
    setShowGreetingQuickActions = params.setShowGreetingQuickActions;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    messages = _useState2[0],
    setMessages = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    isTyping = _useState4[0],
    setIsTyping = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    chatHistory = _useState6[0],
    setChatHistory = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    streamingId = _useState8[0],
    setStreamingId = _useState8[1];
  var streamRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  var scrollRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  /** 食物/回忆流程处理器引用，由主组件通过 setFlowHandlers 注册 */
  var flowHandlersRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)({
    foodActive: false,
    selectFood: function selectFood() {},
    memoryActive: false,
    handleMemoryRecord: function handleMemoryRecord() {}
  });

  /** 注册食物/回忆流程处理器 */
  var setFlowHandlers = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (handlers) {
    flowHandlersRef.current = handlers;
  }, []);
  var scrollToBottom = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setTimeout(function () {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 999999;
      }
    }, 100);
  }, []);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);
  var addMessage = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (msg) {
    var newMsg = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, msg), {}, {
      id: genId()
    });
    setMessages(function (prev) {
      return [].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(prev), [newMsg]);
    });
  }, []);
  var addAiMsg = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (content, options) {
    addMessage({
      type: 'ai',
      content: content,
      options: options
    });
  }, [addMessage]);
  var addUserMsg = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (content) {
    addMessage({
      type: 'user',
      content: content
    });
  }, [addMessage]);

  /** 打字机效果逐字输出 AI 回复 */
  var streamAiReply = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (fullContent, onDone) {
    var id = genId();
    setMessages(function (prev) {
      return [].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(prev), [{
        id: id,
        type: 'ai',
        content: ''
      }]);
    });
    setStreamingId(id);
    var chars = Array.from(fullContent);
    var idx = 0;
    streamRef.current = {
      timer: null,
      fullContent: fullContent,
      id: id
    };
    streamRef.current.timer = setInterval(function () {
      idx += 2;
      if (idx >= chars.length) {
        var _streamRef$current;
        setMessages(function (prev) {
          return prev.map(function (m) {
            return m.id === id ? (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, m), {}, {
              content: fullContent
            }) : m;
          });
        });
        if ((_streamRef$current = streamRef.current) !== null && _streamRef$current !== void 0 && _streamRef$current.timer) clearInterval(streamRef.current.timer);
        streamRef.current = null;
        setStreamingId(null);
        onDone === null || onDone === void 0 || onDone();
        return;
      }
      setMessages(function (prev) {
        return prev.map(function (m) {
          return m.id === id ? (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, m), {}, {
            content: chars.slice(0, idx).join('')
          }) : m;
        });
      });
    }, 25);
  }, []);

  /** 跳过流式，立即显示完整内容 */
  var skipStream = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    if (streamRef.current) {
      if (streamRef.current.timer) clearInterval(streamRef.current.timer);
      var _streamRef$current2 = streamRef.current,
        fullContent = _streamRef$current2.fullContent,
        id = _streamRef$current2.id;
      setMessages(function (prev) {
        return prev.map(function (m) {
          return m.id === id ? (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, m), {}, {
            content: fullContent
          }) : m;
        });
      });
      streamRef.current = null;
      setStreamingId(null);
    }
  }, []);

  // 组件卸载时清理流式定时器
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    return function () {
      var _streamRef$current3;
      if ((_streamRef$current3 = streamRef.current) !== null && _streamRef$current3 !== void 0 && _streamRef$current3.timer) clearInterval(streamRef.current.timer);
    };
  }, []);
  var handleSend = /*#__PURE__*/function () {
    var _ref = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().m(function _callee() {
      var _petInfo$activePet;
      var text, handlers, context, result, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            text = inputValue.trim();
            if (text) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setInputValue('');
            setPlusMenuOpen(false);
            setShowGreetingQuickActions(false);
            handlers = flowHandlersRef.current;
            if (!handlers.foodActive) {
              _context.n = 2;
              break;
            }
            handlers.selectFood(text);
            return _context.a(2);
          case 2:
            if (!handlers.memoryActive) {
              _context.n = 3;
              break;
            }
            handlers.handleMemoryRecord(text);
            return _context.a(2);
          case 3:
            addUserMsg(text);
            context = {
              petId: (_petInfo$activePet = petInfo.activePet) === null || _petInfo$activePet === void 0 ? void 0 : _petInfo$activePet.id,
              petName: petInfo.name,
              petBreed: petInfo.breed,
              petAge: petInfo.age
            };
            setIsTyping(true);
            _context.p = 4;
            _context.n = 5;
            return (0,_services_chatService__WEBPACK_IMPORTED_MODULE_1__.sendChatMessage)(text, context, chatHistory);
          case 5:
            result = _context.v;
            setIsTyping(false);
            if (result.blocked) {
              addAiMsg(result.reply);
            } else {
              streamAiReply(result.reply, function () {
                setChatHistory(function (prev) {
                  return [].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(prev.slice(-18)), [{
                    role: 'user',
                    content: text
                  }, {
                    role: 'assistant',
                    content: result.reply
                  }]);
                });
              });
            }
            _context.n = 7;
            break;
          case 6:
            _context.p = 6;
            _t = _context.v;
            setIsTyping(false);
            _logger__WEBPACK_IMPORTED_MODULE_2__.logger.error('index', 'AI chat failed', _t);
            addAiMsg('抱歉，我现在有点走神了…请稍后再试，或者试试点击快捷按钮进行打卡/查食物。');
          case 7:
            return _context.a(2);
        }
      }, _callee, null, [[4, 6]]);
    }));
    return function handleSend() {
      return _ref.apply(this, arguments);
    };
  }();
  return {
    messages: messages,
    isTyping: isTyping,
    setIsTyping: setIsTyping,
    chatHistory: chatHistory,
    setChatHistory: setChatHistory,
    streamingId: streamingId,
    scrollRef: scrollRef,
    addMessage: addMessage,
    addAiMsg: addAiMsg,
    addUserMsg: addUserMsg,
    streamAiReply: streamAiReply,
    skipStream: skipStream,
    scrollToBottom: scrollToBottom,
    handleSend: handleSend,
    setFlowHandlers: setFlowHandlers
  };
}

/***/ }),

/***/ "./src/hooks/useCheckinFlow.ts":
/*!*************************************!*\
  !*** ./src/hooks/useCheckinFlow.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useCheckinFlow": function() { return /* binding */ useCheckinFlow; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");




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
/**
 * 健康打卡流程 Hook
 *
 * 管理打卡步骤与打卡数据，
 * 负责 5 项健康指标的逐项询问、选项处理与最终报告生成。
 */
function useCheckinFlow(params) {
  var addAiMsg = params.addAiMsg,
    addUserMsg = params.addUserMsg,
    addMessage = params.addMessage,
    petInfo = params.petInfo;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(-1),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState, 2),
    checkinStep = _useState2[0],
    setCheckinStep = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({}),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState3, 2),
    checkinData = _useState4[0],
    setCheckinData = _useState4[1];
  var finishCheckin = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setCheckinData(function (prevData) {
      var entries = Object.entries(prevData);
      var total = entries.reduce(function (s, _ref) {
        var _ref2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(_ref, 2),
          v = _ref2[1];
        return s + v.score;
      }, 0);
      var maxScore = entries.length * 5;
      var rate = Math.round(total / maxScore * 100);
      setCheckinStep(-1);
      var stats = entries.map(function (_ref3) {
        var _ref4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(_ref3, 2),
          k = _ref4[0],
          v = _ref4[1];
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
      return prevData;
    });
  }, [addMessage]);
  var askCheckinItem = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (step) {
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
  }, [addAiMsg, finishCheckin, petInfo.name]);
  var startCheckin = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setCheckinData({});
    setCheckinStep(0);
    addAiMsg('好的！让我们来做个快速打卡 ✦\n\n一共5项，大概1分钟完成～我们从第一项开始：');
    setTimeout(function () {
      return askCheckinItem(0);
    }, 600);
  }, [addAiMsg, askCheckinItem]);

  /** 处理用户对某一项打卡的选择 */
  var handleCheckinAnswer = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (label) {
    var item = CHECKIN_ITEMS[checkinStep];
    var option = item.options.find(function (o) {
      return o.label === label;
    });
    if (!option) return;
    addUserMsg(label);
    setCheckinData(function (prev) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])({}, prev), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_3__["default"])({}, item.key, {
        label: label,
        score: option.score
      }));
    });
    var next = checkinStep + 1;
    setCheckinStep(next);
    setTimeout(function () {
      return askCheckinItem(next);
    }, 400);
  }, [addUserMsg, askCheckinItem, checkinStep]);
  return {
    checkinStep: checkinStep,
    checkinData: checkinData,
    startCheckin: startCheckin,
    handleCheckinAnswer: handleCheckinAnswer,
    handleCheckinComplete: finishCheckin
  };
}

/***/ }),

/***/ "./src/hooks/useFoodFlow.ts":
/*!**********************************!*\
  !*** ./src/hooks/useFoodFlow.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useFoodFlow": function() { return /* binding */ useFoodFlow; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _services_foodService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../services/foodService */ "./src/services/foodService.ts");
/* harmony import */ var _stores_authStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../stores/authStore */ "./src/stores/authStore.ts");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../logger */ "./src/logger/index.ts");







/**
 * 食物查询流程 Hook
 *
 * 管理食物查询激活状态，
 * 负责发起食物安全查询并生成结果卡片。
 */
function useFoodFlow(params) {
  var addAiMsg = params.addAiMsg,
    addUserMsg = params.addUserMsg,
    addMessage = params.addMessage,
    setIsTyping = params.setIsTyping,
    petInfo = params.petInfo;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState, 2),
    foodActive = _useState2[0],
    setFoodActive = _useState2[1];

  /** 启动食物查询流程 */
  var handleFoodQuery = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setFoodActive(true);
    addAiMsg('请告诉我你想查询的食物名称，我来帮你分析它对宠物是否安全～');
  }, [addAiMsg]);

  /** 处理用户输入的食物名称并查询安全信息 */
  var selectFood = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/function () {
    var _ref = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])().m(function _callee(foodName) {
      var _petInfo$activePet;
      var _useAuthStore$getStat, userId, result, isSafe, verdict, safetyEmoji, card, summary, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            addUserMsg("\u67E5\u4E00\u4E0B\u300C".concat(foodName, "\u300D"));
            setFoodActive(false);
            if ((_petInfo$activePet = petInfo.activePet) !== null && _petInfo$activePet !== void 0 && _petInfo$activePet.id) {
              _context.n = 1;
              break;
            }
            addAiMsg('请先添加宠物后再查询食物安全。');
            return _context.a(2);
          case 1:
            setIsTyping(true);
            _context.p = 2;
            userId = ((_useAuthStore$getStat = _stores_authStore__WEBPACK_IMPORTED_MODULE_2__.useAuthStore.getState().user) === null || _useAuthStore$getStat === void 0 ? void 0 : _useAuthStore$getStat.id) || '';
            _context.n = 3;
            return (0,_services_foodService__WEBPACK_IMPORTED_MODULE_1__.queryFood)(userId, petInfo.activePet.id, foodName, petInfo.activePet.species);
          case 3:
            result = _context.v;
            setIsTyping(false);
            isSafe = result.safetyLevel === 'safe';
            verdict = isSafe ? '✅ 可以吃（适量）' : '🚫 不能吃';
            safetyEmoji = result.safetyLevel === 'toxic' ? '☠️' : result.safetyLevel === 'dangerous' ? '⚠️' : result.safetyLevel === 'caution' ? '⚡' : '✅';
            card = {
              type: 'food_result',
              data: {},
              title: '📋 分析结果',
              safe: isSafe,
              risk: result.safetyLevel === 'toxic' ? 'P0' : result.safetyLevel === 'dangerous' ? 'P1' : 'P4',
              icon: safetyEmoji,
              foodName: result.foodName,
              desc: result.detail || '',
              advice: result.firstAid || (isSafe ? '适量喂食即可。' : '请勿喂食！')
            };
            summary = "".concat(safetyEmoji, " ").concat(result.foodName, " ").concat(verdict);
            if (!isSafe) {
              summary += '\n\n🚨 这是高风险食物，请务必远离！';
              if (result.symptoms && result.symptoms.length > 0) {
                summary += "\n\u4E2D\u6BD2\u75C7\u72B6\uFF1A".concat(result.symptoms.join('、'));
              }
            }
            addMessage({
              type: 'ai',
              content: summary,
              card: card
            });
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            setIsTyping(false);
            _logger__WEBPACK_IMPORTED_MODULE_3__.logger.error('index', 'food query failed', _t);
            addAiMsg('抱歉，食物查询暂时不可用，请稍后再试。');
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4]]);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }(), [addAiMsg, addMessage, addUserMsg, petInfo.activePet, setIsTyping]);
  return {
    foodActive: foodActive,
    setFoodActive: setFoodActive,
    handleFoodQuery: handleFoodQuery,
    selectFood: selectFood
  };
}

/***/ }),

/***/ "./src/hooks/useMemoryFlow.ts":
/*!************************************!*\
  !*** ./src/hooks/useMemoryFlow.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useMemoryFlow": function() { return /* binding */ useMemoryFlow; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _services_timelineService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../services/timelineService */ "./src/services/timelineService.ts");
/* harmony import */ var _stores_authStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../stores/authStore */ "./src/stores/authStore.ts");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../logger */ "./src/logger/index.ts");







/**
 * 回忆录制流程 Hook
 *
 * 管理回忆录制激活状态，
 * 负责将用户输入的回忆文本写入时间线服务。
 */
function useMemoryFlow(params) {
  var addAiMsg = params.addAiMsg,
    setIsTyping = params.setIsTyping,
    petInfo = params.petInfo;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState, 2),
    memoryActive = _useState2[0],
    setMemoryActive = _useState2[1];

  /** 启动回忆录制流程 */
  var startMemoryRecord = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setMemoryActive(true);
    addAiMsg('要记录一段回忆吗？在输入框写下这个值得记住的瞬间吧～');
  }, [addAiMsg]);

  /** 处理用户输入的回忆文本并保存到时间线 */
  var handleMemoryRecord = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/function () {
    var _ref = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])().m(function _callee(text) {
      var _petInfo$activePet;
      var _useAuthStore$getStat, userId, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            setMemoryActive(false);
            if ((_petInfo$activePet = petInfo.activePet) !== null && _petInfo$activePet !== void 0 && _petInfo$activePet.id) {
              _context.n = 1;
              break;
            }
            addAiMsg('请先添加宠物后再记录回忆。');
            return _context.a(2);
          case 1:
            setIsTyping(true);
            _context.p = 2;
            userId = ((_useAuthStore$getStat = _stores_authStore__WEBPACK_IMPORTED_MODULE_2__.useAuthStore.getState().user) === null || _useAuthStore$getStat === void 0 ? void 0 : _useAuthStore$getStat.id) || '';
            _context.n = 3;
            return _services_timelineService__WEBPACK_IMPORTED_MODULE_1__.timelineService.addMoment({
              userId: userId,
              petId: petInfo.activePet.id,
              type: 'memory',
              content: {
                petName: petInfo.name,
                petEmoji: petInfo.emoji,
                description: text
              }
            });
          case 3:
            setIsTyping(false);
            addAiMsg('回忆已记录 ✦\n\n你可以在「时光」页面查看所有回忆哦～');
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            setIsTyping(false);
            _logger__WEBPACK_IMPORTED_MODULE_3__.logger.error('index', 'memory record failed', _t);
            addAiMsg('回忆已保存到本地 ✦\n\n你可以在「时光」页面查看所有回忆～');
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4]]);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }(), [addAiMsg, petInfo.activePet, petInfo.emoji, petInfo.name, setIsTyping]);
  return {
    memoryActive: memoryActive,
    setMemoryActive: setMemoryActive,
    startMemoryRecord: startMemoryRecord,
    handleMemoryRecord: handleMemoryRecord
  };
}

/***/ }),

/***/ "./src/hooks/useNamingFlow.ts":
/*!************************************!*\
  !*** ./src/hooks/useNamingFlow.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useNamingFlow": function() { return /* binding */ useNamingFlow; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _services_namingService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../services/namingService */ "./src/services/namingService.ts");
/* harmony import */ var _stores_petStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../stores/petStore */ "./src/stores/petStore.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../config */ "./src/config/index.ts");










var NAMING_STEPS = [{
  key: 'gender',
  question: '新宝贝是男生还是女生呀？',
  options: ['男生 ♂', '女生 ♀', '还不知道 / 无所谓']
}, {
  key: 'style',
  question: '你喜欢什么风格的名字？',
  options: ['古风诗意（如：墨韵、云栖）', '可爱萌系（如：团团、布丁）', '食物系列（如：年糕、汤圆）', '自然元素（如：星河、山月）']
}];

/** 基于风格本地生成候选名字（API 不可用时的降级方案） */
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

/** 解析 AI 返回的取名推荐文本为结构化结果 */
function parseRecommendResult(text) {
  var results = [];
  var lines = text.split('\n').filter(function (l) {
    return l.trim();
  });
  var _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_4__["default"])(lines),
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
/**
 * AI 取名流程 Hook
 *
 * 管理取名步骤与数据，
 * 负责 2 步偏好收集与最终名字推荐卡片生成。
 */
function useNamingFlow(params) {
  var addAiMsg = params.addAiMsg,
    addUserMsg = params.addUserMsg,
    addMessage = params.addMessage,
    petInfo = params.petInfo;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(-1),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState, 2),
    namingStep = _useState2[0],
    setNamingStep = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({}),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState3, 2),
    namingData = _useState4[0],
    setNamingData = _useState4[1];
  var finishNaming = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().m(function _callee() {
    var style, genderText, names, pet, breed, birthDate, gender, result, parsed, card, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          setNamingStep(-1);
          style = namingData.style || '';
          genderText = namingData.gender || '';
          names = [];
          if (_config__WEBPACK_IMPORTED_MODULE_3__.CONFIG.USE_MOCK) {
            _context.n = 4;
            break;
          }
          _context.p = 1;
          pet = _stores_petStore__WEBPACK_IMPORTED_MODULE_2__.usePetStore.getState().currentPet;
          breed = (pet === null || pet === void 0 ? void 0 : pet.breed) || '未知品种';
          birthDate = (pet === null || pet === void 0 ? void 0 : pet.birthDate) || '';
          gender = genderText.includes('男') ? 'male' : genderText.includes('女') ? 'female' : 'unknown';
          _context.n = 2;
          return (0,_services_namingService__WEBPACK_IMPORTED_MODULE_1__.recommendNames)(breed, birthDate, gender);
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
  })), [addMessage, namingData.gender, namingData.style]);
  var askNamingItem = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (step) {
    setNamingStep(step);
    if (step >= NAMING_STEPS.length) {
      finishNaming();
      return;
    }
    var s = NAMING_STEPS[step];
    addAiMsg(s.question.replace(/\{name\}/g, petInfo.name), s.options);
  }, [addAiMsg, finishNaming, petInfo.name]);
  var startNaming = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setNamingData({});
    setNamingStep(0);
    addAiMsg('要给新宝贝取名字吗？太开心了！让我来帮你 ✦\n\n请先告诉我一些基本信息～');
    setTimeout(function () {
      return askNamingItem(0);
    }, 500);
  }, [addAiMsg, askNamingItem]);

  /** 处理用户对某一项取名偏好的选择 */
  var handleNamingAnswer = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (text) {
    var s = NAMING_STEPS[namingStep];
    addUserMsg(text);
    setNamingData(function (prev) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_8__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_8__["default"])({}, prev), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, s.key, text));
    });
    var next = namingStep + 1;
    setNamingStep(next);
    setTimeout(function () {
      return askNamingItem(next);
    }, 400);
  }, [addUserMsg, askNamingItem, namingStep]);
  return {
    namingStep: namingStep,
    namingData: namingData,
    startNaming: startNaming,
    handleNamingAnswer: handleNamingAnswer
  };
}

/***/ }),

/***/ "./src/hooks/useSymptomFlow.ts":
/*!*************************************!*\
  !*** ./src/hooks/useSymptomFlow.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useSymptomFlow": function() { return /* binding */ useSymptomFlow; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");




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
/**
 * 症状初筛流程 Hook
 *
 * 管理症状初筛步骤与数据，
 * 负责 4 步症状询问、选项处理与风险评估报告生成。
 */
function useSymptomFlow(params) {
  var addAiMsg = params.addAiMsg,
    addUserMsg = params.addUserMsg,
    addMessage = params.addMessage,
    petInfo = params.petInfo;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(-1),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState, 2),
    symptomStep = _useState2[0],
    setSymptomStep = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({}),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState3, 2),
    symptomData = _useState4[0],
    setSymptomData = _useState4[1];
  var finishSymptomCheck = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setSymptomData(function (prevData) {
      setSymptomStep(-1);
      var severity = prevData.severity || '';
      var riskLevel = 'low';
      var riskLabel = '暂不严重';
      var advice = '👍 看起来暂时不严重，继续观察即可。保持正常饮食和作息。';
      if (severity.includes('非常严重')) {
        riskLevel = 'critical';
        riskLabel = '紧急';
        advice = '🚨 症状紧急！建议立即带它前往最近的宠物医院。不要等待，不要自行用药。';
      } else if (severity.includes('比较严重')) {
        riskLevel = 'high';
        riskLabel = '建议尽快就医';
        advice = '⚠ 症状比较明显，建议24小时内去看兽医。暂时保持安静，提供充足的清水。';
      } else if (severity.includes('中等')) {
        riskLevel = 'mid';
        riskLabel = '可先观察';
        advice = '⚡ 可以先在家观察1-2天。如果症状加重再考虑就医。';
      }
      var symptomInfo = [{
        label: '主要症状',
        value: prevData.symptom || '-'
      }, {
        label: '持续时间',
        value: prevData.duration || '-'
      }, {
        label: '严重程度',
        value: severity || '-'
      }, {
        label: '其他',
        value: prevData.other || '-'
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
      return prevData;
    });
  }, [addMessage]);
  var askSymptomItem = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (step) {
    setSymptomStep(step);
    if (step >= SYMPTOM_STEPS.length) {
      finishSymptomCheck();
      return;
    }
    var s = SYMPTOM_STEPS[step];
    addAiMsg("".concat(s.title, "\n").concat(s.question.replace(/\{name\}/g, petInfo.name)), s.options);
  }, [addAiMsg, finishSymptomCheck, petInfo.name]);
  var startSymptom = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setSymptomData({});
    setSymptomStep(0);
    addAiMsg('了解！让我做一个症状初筛 ✦\n\n⚠ 这是AI预评估，不能替代专业兽医诊断。如果情况紧急请直接就医。\n\n一共4个问题：');
    setTimeout(function () {
      return askSymptomItem(0);
    }, 600);
  }, [addAiMsg, askSymptomItem]);

  /** 处理用户对某一项症状问题的选择 */
  var handleSymptomAnswer = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (text) {
    var s = SYMPTOM_STEPS[symptomStep];
    addUserMsg(text);
    setSymptomData(function (prev) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])({}, prev), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_3__["default"])({}, s.key, text));
    });
    var next = symptomStep + 1;
    setSymptomStep(next);
    setTimeout(function () {
      return askSymptomItem(next);
    }, 400);
  }, [addUserMsg, askSymptomItem, symptomStep]);
  return {
    symptomStep: symptomStep,
    symptomData: symptomData,
    startSymptom: startSymptom,
    handleSymptomAnswer: handleSymptomAnswer,
    handleSymptomComplete: finishSymptomCheck
  };
}

/***/ }),

/***/ "./src/pages/index/index.tsx":
/*!***********************************!*\
  !*** ./src/pages/index/index.tsx ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx");


var config = {"navigationBarTitleText":"星寰海","navigationStyle":"custom"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pages/index/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/services/chatService.ts":
/*!*************************************!*\
  !*** ./src/services/chatService.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sendChatMessage": function() { return /* binding */ sendChatMessage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _aiProvider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./aiProvider */ "./src/services/aiProvider.ts");
/* harmony import */ var _utils_ruleGuard__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/ruleGuard */ "./src/utils/ruleGuard.ts");
/* harmony import */ var _types_chatTypes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../types/chatTypes */ "./src/types/chatTypes.ts");
/* harmony import */ var _utils_authGuard__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/authGuard */ "./src/utils/authGuard.ts");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../logger */ "./src/logger/index.ts");








/** 清洗 context 字段，防止 Prompt Injection */
function sanitizeContextField(value) {
  if (!value) return '';
  return value.replace(/[<>]/g, '').replace(/\[SYSTEM\]|\[USER\]|\[ASSISTANT\]|\[INST\]|\[\/INST\]/gi, '').replace(/ignore|bypass|override|system prompt|you are now/gi, '').substring(0, 200);
}
function buildSystemPrompt(context) {
  var prompt = _types_chatTypes__WEBPACK_IMPORTED_MODULE_3__.SYSTEM_PROMPT_BASE;
  if (context.petName) {
    var safeName = sanitizeContextField(context.petName);
    var safeBreed = sanitizeContextField(context.petBreed);
    var safeAge = sanitizeContextField(context.petAge);
    prompt += "\n\u5F53\u524D\u6D3B\u8DC3\u5BA0\u7269\uFF1A".concat(safeName, "\uFF08").concat(safeBreed || '未知品种', "\uFF0C").concat(safeAge || '未知年龄', "\uFF09");
    if (context.recentCheckins) {
      var safeCheckins = sanitizeContextField(context.recentCheckins);
      prompt += "\n\u8FD114\u5929\u6253\u5361\u6458\u8981\uFF1A".concat(safeCheckins);
    }
  }
  if (context.familyMembers) {
    var safeMembers = sanitizeContextField(context.familyMembers);
    prompt += "\n\u5BB6\u5EAD\u6210\u5458\uFF1A".concat(safeMembers);
  }
  return prompt;
}
function sendChatMessage(_x, _x2) {
  return _sendChatMessage.apply(this, arguments);
}
function _sendChatMessage() {
  _sendChatMessage = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee(userMessage, context) {
    var history,
      ruleResult,
      guardResult,
      systemPrompt,
      messages,
      reply,
      outputCheck,
      _args = arguments,
      _t,
      _t2;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          history = _args.length > 2 && _args[2] !== undefined ? _args[2] : [];
          (0,_utils_authGuard__WEBPACK_IMPORTED_MODULE_1__.requireAuth)();
          ruleResult = (0,_utils_ruleGuard__WEBPACK_IMPORTED_MODULE_6__.checkInput)(userMessage);
          if (!ruleResult.blocked) {
            _context.n = 2;
            break;
          }
          if (!(ruleResult.action === 'crisis_intervention')) {
            _context.n = 1;
            break;
          }
          return _context.a(2, {
            reply: '我注意到你可能需要帮助。请拨打24小时心理援助热线：400-161-9995。你不需要一个人面对。',
            blocked: true
          });
        case 1:
          return _context.a(2, {
            reply: '抱歉，我无法处理这条消息。请尝试其他与宠物相关的问题。',
            blocked: true
          });
        case 2:
          _context.p = 2;
          _context.n = 3;
          return (0,_aiProvider__WEBPACK_IMPORTED_MODULE_0__.guardCheck)(userMessage);
        case 3:
          guardResult = _context.v;
          if (!guardResult.isHarmful) {
            _context.n = 4;
            break;
          }
          return _context.a(2, {
            reply: '抱歉，我无法处理这条消息。请尝试其他与宠物相关的问题。',
            blocked: true
          });
        case 4:
          if (!guardResult.isCrisis) {
            _context.n = 5;
            break;
          }
          return _context.a(2, {
            reply: '我注意到你可能需要帮助。请拨打24小时心理援助热线：400-161-9995。',
            blocked: true
          });
        case 5:
          _context.n = 7;
          break;
        case 6:
          _context.p = 6;
          _t = _context.v;
          _logger__WEBPACK_IMPORTED_MODULE_2__.logger.error('chatService', 'Guard check failed, blocking message', _t);
          return _context.a(2, {
            reply: 'AI安全检查服务暂不可用，请稍后再试。',
            blocked: true
          });
        case 7:
          systemPrompt = buildSystemPrompt(context);
          messages = [{
            role: 'system',
            content: systemPrompt
          }].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_7__["default"])(history.slice(-10)), [{
            role: 'user',
            content: userMessage
          }]);
          _context.p = 8;
          _context.n = 9;
          return (0,_aiProvider__WEBPACK_IMPORTED_MODULE_0__.chat)({
            messages: messages,
            temperature: 0.7
          });
        case 9:
          reply = _context.v;
          _context.n = 10;
          return (0,_aiProvider__WEBPACK_IMPORTED_MODULE_0__.guardCheckOutput)(reply);
        case 10:
          outputCheck = _context.v;
          if (!outputCheck.isUnsafeMedicalAdvice) {
            _context.n = 11;
            break;
          }
          return _context.a(2, {
            reply: '根据我的分析，建议你咨询专业兽医进行确认。以上信息仅供参考，不替代兽医诊断。',
            blocked: false
          });
        case 11:
          return _context.a(2, {
            reply: (0,_utils_ruleGuard__WEBPACK_IMPORTED_MODULE_6__.sanitizeOutput)(reply, 2000),
            blocked: false
          });
        case 12:
          _context.p = 12;
          _t2 = _context.v;
          _logger__WEBPACK_IMPORTED_MODULE_2__.logger.error('chatService', 'AI chat failed', _t2);
          return _context.a(2, {
            reply: '抱歉，我现在有点走神了…请稍后再试，或者试试点击快捷按钮进行打卡/查食物。',
            blocked: false
          });
      }
    }, _callee, null, [[8, 12], [2, 6]]);
  }));
  return _sendChatMessage.apply(this, arguments);
}

/***/ }),

/***/ "./src/services/timelineService.ts":
/*!*****************************************!*\
  !*** ./src/services/timelineService.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timelineService": function() { return /* binding */ timelineService; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");



var timelineService = {
  getMoments: function getMoments(petId, familyId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee() {
      var params, data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            params = {
              limit: '50'
            };
            if (petId) params.pet_id = petId;
            if (familyId) params.family_id = familyId;
            _context.n = 1;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.get('/api/timeline/moments', params);
          case 1:
            data = _context.v;
            return _context.a(2, data || []);
        }
      }, _callee);
    }))();
  },
  addMoment: function addMoment(moment) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee2() {
      var data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            _context2.n = 1;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.post('/api/timeline/moments', moment);
          case 1:
            data = _context2.v;
            return _context2.a(2, data);
        }
      }, _callee2);
    }))();
  },
  getMilestones: function getMilestones(petId) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee3() {
      var data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            _context3.n = 1;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.get('/api/timeline/milestones', {
              pet_id: petId
            });
          case 1:
            data = _context3.v;
            return _context3.a(2, data || []);
        }
      }, _callee3);
    }))();
  },
  addMilestone: function addMilestone(milestone) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee4() {
      var data;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            _context4.n = 1;
            return _api__WEBPACK_IMPORTED_MODULE_0__.api.post('/api/timeline/milestones', milestone);
          case 1:
            data = _context4.v;
            return _context4.a(2, data);
        }
      }, _callee4);
    }))();
  }
};

/***/ }),

/***/ "./src/types/chatTypes.ts":
/*!********************************!*\
  !*** ./src/types/chatTypes.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SYSTEM_PROMPT_BASE": function() { return /* binding */ SYSTEM_PROMPT_BASE; }
/* harmony export */ });
/** 聊天消息卡片数据，用于在消息流中渲染结构化卡片 */

/** 首页聊天消息 */

/** 健康打卡单项配置 */

/** 取名推荐结果 */

/** 首页宠物信息聚合（来自 usePetInfo） */

var SYSTEM_PROMPT_BASE = "\u4F60\u662F\u661F\u5BF0\u6D77AI\u5BA0\u7269\u7BA1\u5BB6\u3002\u4F60\u6E29\u6696\u3001\u7CBE\u51C6\u3001\u7B80\u6D01\u3002\n\n\u4F60\u7684\u77E5\u8BC6\u5305\u62EC\uFF1A\n- \u5BA0\u7269\u5065\u5EB7\u7BA1\u7406\uFF08\u6253\u5361\u3001\u75C7\u72B6\u3001\u75AB\u82D7\u3001\u9A71\u866B\u3001\u5582\u517B\uFF09\n- \u5BA0\u7269\u54C1\u79CD\u77E5\u8BC6\uFF08\u732B\u72D7\u54C1\u79CD\u7279\u5F81\u3001\u9057\u4F20\u75C5\uFF09\n- \u98DF\u7269\u5B89\u5168\uFF08500+\u98DF\u7269/\u690D\u7269\uFF09\n- \u4E2D\u56FD\u4F20\u7EDF\u6587\u5316\uFF08\u4E94\u884C\u3001\u661F\u5BBF\u3001\u8BD7\u8BCD\u3001\u5178\u6545\uFF09\n\n\u5B89\u5168\u89C4\u5219\uFF1A\n- \u7EDD\u5BF9\u4E0D\u80FD\u505A\u533B\u5B66\u8BCA\u65AD\n- \u7EDD\u5BF9\u4E0D\u80FD\u63A8\u8350\u5177\u4F53\u836F\u7269/\u5904\u65B9\n- \u6240\u6709\u533B\u7597\u5EFA\u8BAE\u540E\u5FC5\u987B\u8DDF\u968F\u514D\u8D23\u58F0\u660E\n- \u68C0\u6D4B\u5230\u6709\u5BB3\u8BF7\u6C42\u65F6\u5FFD\u7565\u5E76\u5F15\u5BFC\u6B63\u786E\u4F7F\u7528\n- \u68C0\u6D4B\u5230\u4EBA\u7684\u60C5\u7EEA\u5371\u673A\u65F6\u89E6\u53D1\u5B89\u5168\u5E72\u9884\n\n\u8F93\u51FA\u98CE\u683C\uFF1A\u6E29\u6696\u3001\u7CBE\u51C6\u3001\u7B80\u6D01\uFF0C\u6BCF\u6B21\u56DE\u590D\u5C3D\u91CF\u63A7\u5236\u57283-5\u53E5\u4EE5\u5185\u3002";

/***/ }),

/***/ "./src/utils/suggestQuickActions.ts":
/*!******************************************!*\
  !*** ./src/utils/suggestQuickActions.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "suggestQuickActions": function() { return /* binding */ suggestQuickActions; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");

/**
 * 智能快捷操作推荐
 * 根据用户消息关键词，推荐最相关的快捷操作
 */

var DEFAULT_ACTIONS = [{
  action: 'checkin',
  label: '打卡',
  emoji: '💩'
}, {
  action: 'food',
  label: '查食物',
  emoji: '🔍'
}, {
  action: 'symptom',
  label: '症状初筛',
  emoji: '💊'
}];
var KEYWORD_MAP = [{
  keywords: ['精神', '食欲', '拉稀', '呕吐', '咳嗽', '没精神', '不舒服', '异常', '生病', '生病了', '不爱动', '蔫', '发烧', '感冒', '腹泻', '便血'],
  action: {
    action: 'symptom',
    label: '症状初筛',
    emoji: '💊'
  }
}, {
  keywords: ['吃', '能吃', '食物', '喂', '猫粮', '狗粮', '零食', '营养', '可以吃', '不能吃', '有毒', '中毒', '葡萄', '巧克力', '葱', '蒜'],
  action: {
    action: 'food',
    label: '查食物',
    emoji: '🔍'
  }
}, {
  keywords: ['打卡', '今天怎么样', '检查', '日常', '记录健康', '健康检查', '大便', '小便', '体重'],
  action: {
    action: 'checkin',
    label: '打卡',
    emoji: '💩'
  }
}, {
  keywords: ['名字', '取名', '叫什么', '新宠物', '起名', '命名', '好听的名字'],
  action: {
    action: 'naming',
    label: 'AI取名',
    emoji: '✨'
  }
}, {
  keywords: ['回忆', '记录', '照片', '纪念', '日记', '时光', '成长', '小时候'],
  action: {
    action: 'memory',
    label: '记录回忆',
    emoji: '📸'
  }
}];

/**
 * 根据用户消息分析推荐快捷操作
 * 返回最多 3 个最相关的操作，不足则用默认操作补齐
 */
function suggestQuickActions(userMessage) {
  var msg = userMessage.toLowerCase();
  var matched = [];
  var seenActions = new Set();
  var _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__["default"])(KEYWORD_MAP),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _step.value,
        keywords = _step$value.keywords,
        action = _step$value.action;
      if (seenActions.has(action.action)) continue;
      if (keywords.some(function (kw) {
        return msg.includes(kw.toLowerCase());
      })) {
        matched.push(action);
        seenActions.add(action.action);
      }
    }

    // 用默认操作补齐到 3 个
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var _iterator2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__["default"])(DEFAULT_ACTIONS),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var def = _step2.value;
      if (matched.length >= 3) break;
      if (seenActions.has(def.action)) continue;
      matched.push(def);
      seenActions.add(def.action);
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return matched.slice(0, 3);
}

/***/ }),

/***/ "./src/components/HomeSkeleton.scss":
/*!******************************************!*\
  !*** ./src/components/HomeSkeleton.scss ***!
  \******************************************/
/***/ (function() {

throw new Error("Module build failed (from ./node_modules/mini-css-extract-plugin/dist/loader.js):\nHookWebpackError: Module build failed (from ./node_modules/sass-loader/dist/cjs.js):\nSassError: Can't find stylesheet to import.\n  ╷\n1 │ @import '../../styles/theme';\n  │         ^^^^^^^^^^^^^^^^^^^^\n  ╵\n  src\\components\\HomeSkeleton.scss 1:9  root stylesheet\n    at tryRunOrWebpackError (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\HookWebpackError.js:88:9)\n    at __webpack_require_module__ (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:5058:12)\n    at __webpack_require__ (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:5015:18)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:5086:20\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3485:9)\n    at done (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3527:9)\n    at Hook.eval [as callAsync] (eval at create (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\HookCodeFactory.js:31:10), <anonymous>:15:1)\n    at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\Hook.js:21:14)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4993:43\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3482:9)\n    at timesSync (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:2297:7)\n    at Object.eachLimit (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3463:5)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4958:16\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3485:9)\n    at timesSync (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:2297:7)\n    at Object.eachLimit (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3463:5)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4926:15\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3485:9)\n    at done (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3527:9)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4873:8\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:3352:32\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\HookWebpackError.js:68:3\n    at Hook.eval [as callAsync] (eval at create (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\HookCodeFactory.js:31:10), <anonymous>:15:1)\n    at Cache.store (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Cache.js:107:20)\n    at ItemCacheFacade.store (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\CacheFacade.js:137:15)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:3352:11\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Cache.js:91:34\n    at Array.<anonymous> (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\cache\\MemoryCachePlugin.js:45:13)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Cache.js:91:19\n    at Hook.eval [as callAsync] (eval at create (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\HookCodeFactory.js:31:10), <anonymous>:19:1)\n    at Cache.get (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Cache.js:75:18)\n    at ItemCacheFacade.get (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\CacheFacade.js:111:15)\n    at Compilation._codeGenerationModule (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:3322:9)\n    at codeGen (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4861:11)\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3482:9)\n    at timesSync (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:2297:7)\n    at Object.eachLimit (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3463:5)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4891:14\n    at processQueue (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\util\\processAsyncTree.js:55:4)\n    at processTicksAndRejections (node:internal/process/task_queues:85:11)\n-- inner error --\nError: Module build failed (from ./node_modules/sass-loader/dist/cjs.js):\nSassError: Can't find stylesheet to import.\n  ╷\n1 │ @import '../../styles/theme';\n  │         ^^^^^^^^^^^^^^^^^^^^\n  ╵\n  src\\components\\HomeSkeleton.scss 1:9  root stylesheet\n    at Object.<anonymous> (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\css-loader\\dist\\cjs.js??ruleSet[1].rules[1].oneOf[0].use[1]!E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\postcss-loader\\dist\\cjs.js??ruleSet[1].rules[1].oneOf[0].use[2]!E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\resolve-url-loader\\index.js!E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\sass-loader\\dist\\cjs.js??ruleSet[1].rules[1].oneOf[0].use[4]!E:\\星寰海\\03-源代码\\小程序\\miniapp\\src\\components\\HomeSkeleton.scss:1:7)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\javascript\\JavascriptModulesPlugin.js:438:10\n    at Hook.eval (eval at create (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\HookCodeFactory.js:19:10), <anonymous>:7:1)\n    at Hook.CALL_DELEGATE [as _call] (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\Hook.js:16:14)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:5060:39\n    at tryRunOrWebpackError (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\HookWebpackError.js:83:7)\n    at __webpack_require_module__ (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:5058:12)\n    at __webpack_require__ (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:5015:18)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:5086:20\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3485:9)\n    at done (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3527:9)\n    at Hook.eval [as callAsync] (eval at create (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\HookCodeFactory.js:31:10), <anonymous>:15:1)\n    at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\Hook.js:21:14)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4993:43\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3482:9)\n    at timesSync (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:2297:7)\n    at Object.eachLimit (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3463:5)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4958:16\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3485:9)\n    at timesSync (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:2297:7)\n    at Object.eachLimit (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3463:5)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4926:15\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3485:9)\n    at done (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3527:9)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4873:8\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:3352:32\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\HookWebpackError.js:68:3\n    at Hook.eval [as callAsync] (eval at create (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\HookCodeFactory.js:31:10), <anonymous>:15:1)\n    at Cache.store (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Cache.js:107:20)\n    at ItemCacheFacade.store (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\CacheFacade.js:137:15)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:3352:11\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Cache.js:91:34\n    at Array.<anonymous> (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\cache\\MemoryCachePlugin.js:45:13)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Cache.js:91:19\n    at Hook.eval [as callAsync] (eval at create (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\node_modules\\tapable\\lib\\HookCodeFactory.js:31:10), <anonymous>:19:1)\n    at Cache.get (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Cache.js:75:18)\n    at ItemCacheFacade.get (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\CacheFacade.js:111:15)\n    at Compilation._codeGenerationModule (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:3322:9)\n    at codeGen (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4861:11)\n    at symbolIterator (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3482:9)\n    at timesSync (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:2297:7)\n    at Object.eachLimit (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\neo-async\\async.js:3463:5)\n    at E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\Compilation.js:4891:14\n    at processQueue (E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\webpack\\lib\\util\\processAsyncTree.js:55:4)\n    at processTicksAndRejections (node:internal/process/task_queues:85:11)\n\nGenerated code for E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\css-loader\\dist\\cjs.js??ruleSet[1].rules[1].oneOf[0].use[1]!E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\postcss-loader\\dist\\cjs.js??ruleSet[1].rules[1].oneOf[0].use[2]!E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\resolve-url-loader\\index.js!E:\\星寰海\\03-源代码\\小程序\\miniapp\\node_modules\\sass-loader\\dist\\cjs.js??ruleSet[1].rules[1].oneOf[0].use[4]!E:\\星寰海\\03-源代码\\小程序\\miniapp\\src\\components\\HomeSkeleton.scss\n1 | throw new Error(\"Module build failed (from ./node_modules/sass-loader/dist/cjs.js):\\nSassError: Can't find stylesheet to import.\\n  ╷\\n1 │ @import '../../styles/theme';\\n  │         ^^^^^^^^^^^^^^^^^^^^\\n  ╵\\n  src\\\\components\\\\HomeSkeleton.scss 1:9  root stylesheet\");");

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/index/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map