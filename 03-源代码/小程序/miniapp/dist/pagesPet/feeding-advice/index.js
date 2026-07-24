"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/feeding-advice/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/feeding-advice/index!./src/pagesPet/feeding-advice/index.tsx":
/*!****************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/feeding-advice/index!./src/pagesPet/feeding-advice/index.tsx ***!
  \****************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ FeedingAdvicePage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var _stores_authStore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../stores/authStore */ "./src/stores/authStore.ts");
/* harmony import */ var _stores_petStore__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../stores/petStore */ "./src/stores/petStore.ts");
/* harmony import */ var _services_feedingService__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../services/feedingService */ "./src/services/feedingService.ts");
/* harmony import */ var _services_chronicService__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../services/chronicService */ "./src/services/chronicService.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");














var STORAGE_KEY = 'feeding_records';
function getStorage(key) {
  try {
    var data = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync("xhh_".concat(key));
    return data ? JSON.parse(data) : null;
  } catch (_unused) {
    return null;
  }
}
function setStorage(key, value) {
  try {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync("xhh_".concat(key), JSON.stringify(value));
  } catch (_unused2) {
    // ignore
  }
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
var ADVICE_PRIORITY_CONFIG = {
  high: {
    bg: 'rgba(245, 34, 45, 0.08)',
    border: 'rgba(245, 34, 45, 0.2)'
  },
  medium: {
    bg: 'rgba(250, 173, 20, 0.08)',
    border: 'rgba(250, 173, 20, 0.2)'
  },
  low: {
    bg: 'rgba(82, 196, 26, 0.06)',
    border: 'rgba(82, 196, 26, 0.15)'
  }
};
function FeedingAdvicePage() {
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__.useThemeClass)();
  var user = (0,_stores_authStore__WEBPACK_IMPORTED_MODULE_3__.useAuthStore)(function (state) {
    return state.user;
  });
  var _usePetStore = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_4__.usePetStore)(),
    currentPet = _usePetStore.currentPet,
    pets = _usePetStore.pets,
    fetchPets = _usePetStore.fetchPets;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState, 2),
    records = _useState2[0],
    setRecords = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState3, 2),
    advice = _useState4[0],
    setAdvice = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState5, 2),
    mealPlan = _useState6[0],
    setMealPlan = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState7, 2),
    profile = _useState8[0],
    setProfile = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState9, 2),
    showAdd = _useState0[0],
    setShowAdd = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('advice'),
    _useState10 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState1, 2),
    activeTab = _useState10[0],
    setActiveTab = _useState10[1];
  var pet = currentPet || pets[0];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__.useDidShow)(function () {
    if (user && !pets.length) {
      fetchPets(user.id);
    }
  });
  var loadData = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function () {
    if (!pet || !user) return;
    var all = getStorage(STORAGE_KEY) || {};
    var petRecords = (all[pet.id] || []).sort(function (a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    setRecords(petRecords);
    var chronicRecords = (0,_services_chronicService__WEBPACK_IMPORTED_MODULE_6__.getChronicRecords)(pet.id, user.id);
    var feedingProfile = (0,_services_feedingService__WEBPACK_IMPORTED_MODULE_5__.buildFeedingProfile)(pet, chronicRecords);
    setProfile(feedingProfile);
    setMealPlan((0,_services_feedingService__WEBPACK_IMPORTED_MODULE_5__.getMealPlan)(feedingProfile));
    var latestRecord = petRecords[0];
    var personalizedAdvice = (0,_services_feedingService__WEBPACK_IMPORTED_MODULE_5__.generatePersonalizedAdvice)(feedingProfile, latestRecord === null || latestRecord === void 0 ? void 0 : latestRecord.appetite, latestRecord === null || latestRecord === void 0 ? void 0 : latestRecord.stool);
    setAdvice(personalizedAdvice);
  }, [pet, user]);
  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    loadData();
  }, [loadData]);
  var saveRecords = function saveRecords(newRecords) {
    if (!pet || !user) return;
    var all = getStorage(STORAGE_KEY) || {};
    all[pet.id] = newRecords;
    setStorage(STORAGE_KEY, all);
    setRecords(newRecords.sort(function (a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }));
  };
  var handleAdd = function handleAdd(data) {
    var newRecord = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, data), {}, {
      id: generateId(),
      petId: pet.id,
      createdAt: new Date().toISOString()
    });
    saveRecords([newRecord].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_10__["default"])(records)));
    setShowAdd(false);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
      title: '记录成功',
      icon: 'success'
    });
    loadData();
  };
  var handleDelete = function handleDelete(id) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showModal({
      title: '确认删除',
      content: '确定要删除这条饮食记录吗？',
      success: function success(res) {
        if (res.confirm) {
          saveRecords(records.filter(function (r) {
            return r.id !== id;
          }));
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  };
  if (!pet) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-empty",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
        className: "feeding-empty-text",
        children: "\u8BF7\u5148\u6DFB\u52A0\u5BA0\u7269"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.ScrollView, {
    className: "feeding-page ".concat(themeClass),
    scrollY: true,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
        className: "feeding-title",
        children: "\u5582\u517B\u5EFA\u8BAE"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
        className: "feeding-subtitle",
        children: [pet.name, " \u7684\u4E2A\u6027\u5316\u996E\u98DF\u7BA1\u7406"]
      })]
    }), profile && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-profile-cards",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-profile-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-profile-value",
          children: [profile.ageMonths, "\u4E2A\u6708"]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-profile-label",
          children: "\u5E74\u9F84"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-profile-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-profile-value",
          children: [profile.weight, "kg"]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-profile-label",
          children: "\u4F53\u91CD"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-profile-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-profile-value",
          children: profile.chronicConditions.length
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-profile-label",
          children: "\u6162\u6027\u75C5"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-profile-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-profile-value",
          children: profile.allergies.length
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-profile-label",
          children: "\u8FC7\u654F\u9879"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-tabs",
      children: ['advice', 'plan', 'records'].map(function (tab) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-tab ".concat(activeTab === tab ? 'feeding-tab--active' : ''),
          onClick: function onClick() {
            return setActiveTab(tab);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            children: tab === 'advice' ? '智能建议' : tab === 'plan' ? '喂食计划' : '饮食记录'
          })
        }, tab);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-actions",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-add-btn",
        onClick: function onClick() {
          return setShowAdd(true);
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-add-icon",
          children: "+"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          children: "\u8BB0\u5F55\u4ECA\u65E5\u996E\u98DF"
        })]
      })
    }), activeTab === 'advice' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-content",
      children: [advice.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-empty-state",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-empty-icon",
          children: "\uD83D\uDCA1"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-empty-title",
          children: "\u6682\u65E0\u5EFA\u8BAE"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-empty-hint",
          children: "\u5B8C\u5584\u5BA0\u7269\u4FE1\u606F\u5E76\u8BB0\u5F55\u996E\u98DF\u540E\u5C06\u751F\u6210\u4E2A\u6027\u5316\u5EFA\u8BAE"
        })]
      }), advice.map(function (item, index) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-advice-card",
          style: {
            background: ADVICE_PRIORITY_CONFIG[item.priority].bg,
            borderLeftColor: item.priority === 'high' ? '#f5222d' : item.priority === 'medium' ? '#faad14' : '#52c41a'
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-advice-header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
              className: "feeding-advice-icon",
              children: item.icon
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
              className: "feeding-advice-title",
              children: item.title
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-advice-content",
            children: item.content
          })]
        }, index);
      })]
    }), activeTab === 'plan' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-content",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-plan-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-plan-title",
          children: "\u6BCF\u65E5\u5582\u98DF\u8BA1\u5212"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-plan-subtitle",
          children: ["\u57FA\u4E8E ", pet.name, " \u7684\u54C1\u79CD\u3001\u5E74\u9F84\u3001\u4F53\u91CD\u548C\u5065\u5EB7\u72B6\u51B5\u5236\u5B9A"]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-plan-timeline",
        children: mealPlan.map(function (meal, index) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-plan-item",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
              className: "feeding-plan-time-line",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-plan-dot"
              }), index < mealPlan.length - 1 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-plan-line"
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
              className: "feeding-plan-card",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-plan-card-header",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                  className: "feeding-plan-time",
                  children: meal.time
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                  className: "feeding-plan-ratio",
                  children: meal.ratio
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                className: "feeding-plan-label",
                children: meal.label
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                className: "feeding-plan-tip",
                children: meal.label === '早餐' ? '早晨喂食帮助开启一天的代谢' : meal.label === '午餐' ? '中午补充能量' : meal.label === '晚餐' ? '晚餐在睡前2小时完成' : '少量夜宵避免夜间饥饿'
              })]
            })]
          }, index);
        })
      }), profile && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-plan-tips",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-plan-tips-title",
          children: "\uD83D\uDCA1 \u5582\u517B\u5C0F\u8D34\u58EB"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-plan-tip-item",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-plan-tip-text",
            children: "\u2022 \u56FA\u5B9A\u5582\u98DF\u65F6\u95F4\uFF0C\u5E2E\u52A9\u5BA0\u7269\u5EFA\u7ACB\u89C4\u5F8B\u7684\u6D88\u5316\u8282\u594F"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-plan-tip-item",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-plan-tip-text",
            children: "\u2022 \u6BCF\u6B21\u5582\u98DF\u524D\u540E\u68C0\u67E5\u6BDB\u53D1\u3001\u773C\u775B\u3001\u8033\u6735\u72B6\u6001"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-plan-tip-item",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-plan-tip-text",
            children: "\u2022 \u4F7F\u7528\u6162\u98DF\u7897\u53EF\u4EE5\u5E2E\u52A9\u5403\u996D\u592A\u5FEB\u7684\u5BA0\u7269"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-plan-tip-item",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-plan-tip-text",
            children: "\u2022 \u786E\u4FDD\u968F\u65F6\u6709\u65B0\u9C9C\u5E72\u51C0\u7684\u996E\u6C34"
          })
        })]
      })]
    }), activeTab === 'records' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-content",
      children: [records.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-empty-state",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-empty-icon",
          children: "\uD83C\uDF7D\uFE0F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-empty-title",
          children: "\u6682\u65E0\u996E\u98DF\u8BB0\u5F55"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-empty-hint",
          children: "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u8BB0\u5F55\u4ECA\u65E5\u996E\u98DF"
        })]
      }), records.map(function (record) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-record-card",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-record-header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
              className: "feeding-record-date",
              children: record.date
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
              className: "feeding-record-header-right",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                className: "feeding-record-appetite feeding-appetite-".concat(record.appetite),
                children: record.appetite === 'good' ? '食欲好' : record.appetite === 'normal' ? '食欲一般' : '食欲差'
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-record-delete",
                onClick: function onClick() {
                  return handleDelete(record.id);
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                  className: "feeding-record-delete-icon",
                  children: "\xD7"
                })
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-record-body",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
              className: "feeding-record-food",
              children: [record.foodType, " ", record.brand ? "(".concat(record.brand, ")") : '']
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
              className: "feeding-record-amount",
              children: [record.amount, record.unit, " \xB7 ", record.mealTime]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
              className: "feeding-record-tags",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                className: "feeding-record-tag feeding-stool-".concat(record.stool),
                children: ["\uD83D\uDCA9 ", record.stool === 'normal' ? '正常' : record.stool === 'loose' ? '软便' : '便秘']
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                className: "feeding-record-tag feeding-energy-".concat(record.energy),
                children: ["\u26A1 ", record.energy === 'high' ? '精力充沛' : record.energy === 'normal' ? '精神一般' : '精神差']
              })]
            }), record.notes && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
              className: "feeding-record-notes",
              children: record.notes
            })]
          })]
        }, record.id);
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-bottom-safe"
    }), showAdd && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(AddFeedingModal, {
      onSubmit: handleAdd,
      onClose: function onClose() {
        return setShowAdd(false);
      }
    })]
  });
}
var UNIT_OPTIONS = ['g', 'kg', '杯', '勺'];
function AddFeedingModal(_ref) {
  var onSubmit = _ref.onSubmit,
    onClose = _ref.onClose;
  var today = new Date().toISOString().split('T')[0];
  var _useState11 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
      date: today,
      foodType: '',
      brand: '',
      amount: '',
      unit: 'g',
      mealTime: '早餐',
      appetite: 'good',
      stool: 'normal',
      energy: 'normal',
      notes: ''
    }),
    _useState12 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState11, 2),
    form = _useState12[0],
    setForm = _useState12[1];
  var handleDateChange = function handleDateChange(e) {
    setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, form), {}, {
      date: e.detail.value
    }));
  };
  var handleUnitChange = function handleUnitChange(e) {
    setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, form), {}, {
      unit: UNIT_OPTIONS[e.detail.value]
    }));
  };
  var handleInput = function handleInput(field) {
    return function (e) {
      setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, form), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_12__["default"])({}, field, e.detail.value)));
    };
  };
  var handleSubmit = function handleSubmit() {
    if (!form.foodType.trim()) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
        title: '请输入食物类型',
        icon: 'none'
      });
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
        title: '请输入有效分量',
        icon: 'none'
      });
      return;
    }
    onSubmit((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, form), {}, {
      amount: Number(form.amount)
    }));
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
    className: "feeding-modal-overlay",
    onClick: onClose,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
      className: "feeding-modal",
      onClick: function onClick(e) {
        return e.stopPropagation();
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-modal-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-modal-title",
          children: "\u8BB0\u5F55\u996E\u98DF"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
          className: "feeding-modal-close",
          onClick: onClose,
          children: "\xD7"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.ScrollView, {
        className: "feeding-modal-body",
        scrollY: true,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u65E5\u671F *"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Picker, {
            mode: "date",
            value: form.date,
            onChange: handleDateChange,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
              className: "feeding-form-picker",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                children: form.date
              })
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u98DF\u7269\u7C7B\u578B *"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Input, {
            className: "feeding-form-input",
            placeholder: "\u5982\uFF1A\u5E72\u7CAE\u3001\u6E7F\u7CAE\u3001\u81EA\u5236\u7B49",
            value: form.foodType,
            onInput: handleInput('foodType')
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u54C1\u724C"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Input, {
            className: "feeding-form-input",
            placeholder: "\u5982\uFF1A\u7687\u5BB6\u3001\u6E34\u671B\u7B49",
            value: form.brand,
            onInput: handleInput('brand')
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u5206\u91CF *"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-form-amount",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Input, {
              className: "feeding-form-input feeding-form-amount-input",
              placeholder: "0",
              type: "number",
              value: form.amount,
              onInput: handleInput('amount')
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Picker, {
              mode: "selector",
              range: UNIT_OPTIONS,
              value: UNIT_OPTIONS.indexOf(form.unit),
              onChange: handleUnitChange,
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-form-unit",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                  children: form.unit
                })
              })
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u9910\u6B21"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-form-meals",
            children: ['早餐', '午餐', '晚餐', '加餐'].map(function (meal) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-meal-option ".concat(form.mealTime === meal ? 'feeding-meal-active' : ''),
                onClick: function onClick() {
                  return setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, form), {}, {
                    mealTime: meal
                  }));
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                  children: meal
                })
              }, meal);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u98DF\u6B32"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-form-rating",
            children: [{
              value: 'good',
              label: '好'
            }, {
              value: 'normal',
              label: '一般'
            }, {
              value: 'poor',
              label: '差'
            }].map(function (item) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-rating-option ".concat(form.appetite === item.value ? 'feeding-rating-active' : ''),
                onClick: function onClick() {
                  return setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, form), {}, {
                    appetite: item.value
                  }));
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                  className: "feeding-rating-label",
                  children: item.label
                })
              }, item.value);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u4FBF\u4FBF"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-form-rating",
            children: [{
              value: 'normal',
              label: '正常'
            }, {
              value: 'loose',
              label: '软便'
            }, {
              value: 'hard',
              label: '便秘'
            }].map(function (item) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-rating-option ".concat(form.stool === item.value ? 'feeding-rating-active' : ''),
                onClick: function onClick() {
                  return setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, form), {}, {
                    stool: item.value
                  }));
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                  className: "feeding-rating-label",
                  children: item.label
                })
              }, item.value);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u7CBE\u795E\u72B6\u6001"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
            className: "feeding-form-rating",
            children: [{
              value: 'high',
              label: '活跃'
            }, {
              value: 'normal',
              label: '正常'
            }, {
              value: 'low',
              label: '疲倦'
            }].map(function (item) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
                className: "feeding-rating-option ".concat(form.energy === item.value ? 'feeding-rating-active' : ''),
                onClick: function onClick() {
                  return setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, form), {}, {
                    energy: item.value
                  }));
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
                  className: "feeding-rating-label",
                  children: item.label
                })
              }, item.value);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            className: "feeding-form-label",
            children: "\u5907\u6CE8"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Textarea, {
            className: "feeding-form-textarea",
            placeholder: "\u5176\u4ED6\u9700\u8981\u8BB0\u5F55\u7684\u4FE1\u606F",
            value: form.notes,
            onInput: handleInput('notes')
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
        className: "feeding-modal-footer",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-modal-btn feeding-modal-btn-cancel",
          onClick: onClose,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            children: "\u53D6\u6D88"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.View, {
          className: "feeding-modal-btn feeding-modal-btn-confirm",
          onClick: handleSubmit,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_11__.Text, {
            children: "\u4FDD\u5B58"
          })
        })]
      })]
    })
  });
}

/***/ }),

/***/ "./src/pagesPet/feeding-advice/index.tsx":
/*!***********************************************!*\
  !*** ./src/pagesPet/feeding-advice/index.tsx ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_feeding_advice_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/feeding-advice/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/feeding-advice/index!./src/pagesPet/feeding-advice/index.tsx");


var config = {};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_feeding_advice_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/feeding-advice/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_feeding_advice_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/services/feedingService.ts":
/*!****************************************!*\
  !*** ./src/services/feedingService.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "buildFeedingProfile": function() { return /* binding */ buildFeedingProfile; },
/* harmony export */   "generatePersonalizedAdvice": function() { return /* binding */ generatePersonalizedAdvice; },
/* harmony export */   "getMealPlan": function() { return /* binding */ getMealPlan; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");

var BREED_FEEDING_GUIDE = {
  '金毛': {
    tips: ['金毛易肥胖，控制每日热量摄入', '建议分2-3餐喂养，避免一次进食过多', '可添加关节保健品预防髋关节问题'],
    sensitiveTo: ['高脂肪食物', '过量零食']
  },
  '拉布拉多': {
    tips: ['拉布拉多食欲旺盛，需严格控制分量', '使用慢食碗减慢进食速度', '定期称重监控体重变化'],
    sensitiveTo: ['高热量食物', '人类餐桌食物']
  },
  '柯基': {
    tips: ['柯基易肥胖，严格控制零食', '注意腰椎健康，控制体重', '建议低脂配方'],
    sensitiveTo: ['高热量食物', '过量碳水化合物']
  },
  '法斗': {
    tips: ['法斗易过敏，选择低敏配方', '控制体重减轻呼吸道负担', '小颗粒狗粮更易咀嚼'],
    sensitiveTo: ['谷物', '鸡肉（部分个体）', '人工添加剂']
  },
  '橘猫': {
    tips: ['橘猫易发胖，严格控制每日食量', '增加互动喂食增加活动量', '选择高蛋白低碳水配方'],
    sensitiveTo: ['过量碳水化合物', '高脂肪零食']
  },
  '布偶': {
    tips: ['布偶猫肠胃敏感，选择易消化配方', '注意毛球管理，定期化毛', '保持水分摄入预防泌尿道问题'],
    sensitiveTo: ['突然换粮', '劣质蛋白质']
  },
  '英短': {
    tips: ['英短易发胖，控制热量摄入', '注意泌尿道健康，保证饮水', '选择含牛磺酸的优质猫粮'],
    sensitiveTo: ['高镁食物', '过量零食']
  },
  '美短': {
    tips: ['美短活动量大，保证蛋白质摄入', '注意口腔健康，定期洁齿', '选择含Omega-3的配方'],
    sensitiveTo: ['劣质填充物']
  }
};
var CHRONIC_FEEDING_ADVICE = {
  '慢性肾病': {
    tips: ['选择低磷配方肾脏处方粮', '保证充足新鲜饮水', '控制蛋白质摄入量但保证优质蛋白'],
    avoid: ['高磷食物', '高盐零食', '人类调味食物']
  },
  '心脏病': {
    tips: ['选择低钠配方心脏处方粮', '控制饮水量遵医嘱', '补充牛磺酸和Omega-3'],
    avoid: ['高盐食物', '高脂肪食物', '过量零食']
  },
  '糖尿病': {
    tips: ['选择高纤维低GI处方粮', '定时定量喂养，不可随意加餐', '与胰岛素注射时间配合'],
    avoid: ['高糖食物', '高碳水化合物', '含糖零食']
  },
  '胰腺炎': {
    tips: ['选择超低脂易消化处方粮', '少食多餐，减轻胰腺负担', '避免突然换粮'],
    avoid: ['高脂肪食物', '油炸食物', '肥肉']
  },
  '关节炎': {
    tips: ['控制体重减轻关节负担', '补充葡萄糖胺和软骨素', '选择含Omega-3的抗炎配方'],
    avoid: ['高热量导致肥胖的食物']
  },
  '泌尿道结石': {
    tips: ['选择泌尿道处方粮控制pH值', '增加饮水量，考虑湿粮', '定期复查尿液'],
    avoid: ['高镁食物', '高钙零食', '过咸食物']
  },
  '肝病': {
    tips: ['选择肝脏处方粮，易消化高营养', '少食多餐，减轻肝脏负担', '补充维生素E和S-腺苷蛋氨酸'],
    avoid: ['高铜食物', '高脂肪食物', '加工食品']
  }
};
function buildFeedingProfile(pet, chronicRecords, allergies, isNeutered) {
  var birthDate = new Date(pet.birthDate);
  var now = new Date();
  var ageMonths = Math.max(0, (now.getFullYear() - birthDate.getFullYear()) * 12 + now.getMonth() - birthDate.getMonth());
  var isPuppyKitten = pet.species === 'dog' ? ageMonths < 12 : ageMonths < 12;
  var isSenior = pet.species === 'dog' ? ageMonths >= 84 : ageMonths >= 120;
  var bodyCondition = 'normal';
  return {
    pet: pet,
    ageMonths: ageMonths,
    weight: pet.weight || 0,
    bodyCondition: bodyCondition,
    chronicConditions: chronicRecords.filter(function (r) {
      return r.status === 'active';
    }),
    allergies: allergies || [],
    isPuppyKitten: isPuppyKitten,
    isSenior: isSenior,
    isNeutered: isNeutered !== null && isNeutered !== void 0 ? isNeutered : false
  };
}
function generatePersonalizedAdvice(profile, recentAppetite, recentStool) {
  var advice = [];
  var pet = profile.pet,
    ageMonths = profile.ageMonths,
    weight = profile.weight,
    chronicConditions = profile.chronicConditions,
    allergies = profile.allergies,
    isPuppyKitten = profile.isPuppyKitten,
    isSenior = profile.isSenior,
    isNeutered = profile.isNeutered;
  var dailyCalories = calculateDailyCalories(profile);
  var dailyAmount = calculateDailyAmount(profile, dailyCalories);
  advice.push({
    type: 'daily_amount',
    title: '每日建议喂食量',
    content: "".concat(pet.name, "\u6BCF\u65E5\u5EFA\u8BAE\u70ED\u91CF\u7EA6 ").concat(dailyCalories, " kcal\uFF0C\u7EA6\u5408\u5E72\u7CAE ").concat(dailyAmount, "g\uFF08\u5206 ").concat(isPuppyKitten ? '3-4' : isSenior ? '2-3' : '2', " \u9910\uFF09"),
    priority: 'high',
    icon: '⚖️'
  });
  if (isPuppyKitten) {
    advice.push({
      type: 'meal_frequency',
      title: '幼年宠物喂养要点',
      content: "".concat(pet.species === 'dog' ? '幼犬' : '幼猫', "\u9700\u8981\u66F4\u9891\u7E41\u7684\u8FDB\u98DF\uFF083-4\u9910/\u5929\uFF09\uFF0C\u9009\u62E9").concat(pet.species === 'dog' ? '幼犬' : '幼猫', "\u4E13\u7528\u914D\u65B9\uFF0C\u4FDD\u8BC1\u5145\u8DB3\u86CB\u767D\u8D28\u548C\u9499\u8D28\u3002"),
      priority: 'high',
      icon: '🍼'
    });
  }
  if (isSenior) {
    advice.push({
      type: 'meal_frequency',
      title: '老年宠物喂养调整',
      content: '老年宠物代谢减慢，建议选择低热量高纤维配方，可添加关节保健品和抗氧化剂，注意观察牙齿咀嚼能力。',
      priority: 'high',
      icon: '🧓'
    });
  }
  if (isNeutered) {
    advice.push({
      type: 'food_type',
      title: '绝育后饮食注意',
      content: '绝育后代谢降低约20-30%，建议选择绝育专用配方或减少日常喂食量15-20%，定期称重防止肥胖。',
      priority: 'medium',
      icon: '✂️'
    });
  }
  var breedGuide = BREED_FEEDING_GUIDE[pet.breed];
  if (breedGuide) {
    advice.push({
      type: 'breed_specific',
      title: "".concat(pet.breed, "\u54C1\u79CD\u5582\u517B\u6307\u5357"),
      content: breedGuide.tips.join('；'),
      priority: 'medium',
      icon: '🐾'
    });
  }
  var _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_0__["default"])(chronicConditions),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var condition = _step.value;
      var chronicAdvice = CHRONIC_FEEDING_ADVICE[condition.condition];
      if (chronicAdvice) {
        advice.push({
          type: 'chronic',
          title: "".concat(condition.condition, "\u996E\u98DF\u7BA1\u7406"),
          content: chronicAdvice.tips.join('；'),
          priority: 'high',
          icon: '🩺'
        });
        if (chronicAdvice.avoid.length > 0) {
          advice.push({
            type: 'warning',
            title: "".concat(condition.condition, "\u9700\u907F\u514D\u7684\u98DF\u7269"),
            content: "\u8BF7\u907F\u514D\uFF1A".concat(chronicAdvice.avoid.join('、')),
            priority: 'high',
            icon: '⚠️'
          });
        }
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  if (allergies.length > 0) {
    advice.push({
      type: 'allergy',
      title: '过敏提醒',
      content: "".concat(pet.name, "\u5BF9\u4EE5\u4E0B\u7269\u8D28\u8FC7\u654F\uFF1A").concat(allergies.join('、'), "\u3002\u8BF7\u4ED4\u7EC6\u68C0\u67E5\u98DF\u7269\u6210\u5206\u8868\uFF0C\u907F\u514D\u542B\u8FD9\u4E9B\u6210\u5206\u7684\u98DF\u54C1\u3002"),
      priority: 'high',
      icon: '🚫'
    });
  }
  if (recentAppetite === 'poor') {
    advice.push({
      type: 'warning',
      title: '近期食欲不佳',
      content: '宠物最近食欲不佳，建议检查食物新鲜度，可尝试加热湿粮增加香气，或更换口味。如持续不佳请咨询兽医。',
      priority: 'high',
      icon: '😕'
    });
  }
  if (recentStool === 'loose') {
    advice.push({
      type: 'warning',
      title: '软便饮食建议',
      content: '建议选择易消化配方，可添加益生菌和南瓜泥帮助调理肠胃，避免突然换粮和油腻食物。',
      priority: 'high',
      icon: '💧'
    });
  } else if (recentStool === 'hard') {
    advice.push({
      type: 'supplement',
      title: '便秘饮食建议',
      content: '增加饮水量和膳食纤维，可适量添加南瓜泥、橄榄油或益生菌，湿粮比干粮更有助于缓解便秘。',
      priority: 'medium',
      icon: '💊'
    });
  }
  advice.push({
    type: 'supplement',
    title: '推荐营养补充',
    content: getSupplementAdvice(profile),
    priority: 'low',
    icon: '💊'
  });
  return advice;
}
function calculateDailyCalories(profile) {
  var pet = profile.pet,
    weight = profile.weight,
    isPuppyKitten = profile.isPuppyKitten,
    isSenior = profile.isSenior,
    isNeutered = profile.isNeutered;
  var kg = weight || (pet.species === 'cat' ? 4 : 15);
  var rer = 70 * Math.pow(kg, 0.75);
  var factor = 1.6;
  if (isPuppyKitten) factor = 2.5;else if (isSenior) factor = 1.2;else if (isNeutered) factor = 1.4;
  if (pet.species === 'cat') {
    factor *= 0.9;
  }
  return Math.round(rer * factor);
}
function calculateDailyAmount(profile, calories) {
  var kcalPerGram = 3.8;
  return Math.round(calories / kcalPerGram);
}
function getSupplementAdvice(profile) {
  var parts = [];
  if (profile.isPuppyKitten) {
    parts.push('DHA促进大脑发育');
  }
  if (profile.isSenior) {
    parts.push('葡萄糖胺/软骨素保护关节');
    parts.push('抗氧化剂（维生素E、C）');
  }
  if (profile.pet.species === 'cat') {
    parts.push('牛磺酸（猫咪必需）');
  }
  if (profile.chronicConditions.some(function (c) {
    return c.condition === '关节炎';
  })) {
    parts.push('Omega-3脂肪酸抗炎');
  }
  if (profile.chronicConditions.some(function (c) {
    return c.condition === '慢性肾病';
  })) {
    parts.push('Omega-3脂肪酸（遵医嘱）');
    parts.push('B族维生素');
  }
  parts.push('益生菌维护肠道健康');
  if (parts.length === 0) {
    parts.push('根据体检结果遵医嘱补充');
  }
  return parts.join('、');
}
function getMealPlan(profile) {
  if (profile.isPuppyKitten) {
    return [{
      time: '07:00',
      label: '早餐',
      ratio: '25%'
    }, {
      time: '12:00',
      label: '午餐',
      ratio: '25%'
    }, {
      time: '17:00',
      label: '晚餐',
      ratio: '25%'
    }, {
      time: '21:00',
      label: '夜宵',
      ratio: '25%'
    }];
  }
  if (profile.isSenior) {
    return [{
      time: '08:00',
      label: '早餐',
      ratio: '40%'
    }, {
      time: '18:00',
      label: '晚餐',
      ratio: '60%'
    }];
  }
  return [{
    time: '08:00',
    label: '早餐',
    ratio: '40%'
  }, {
    time: '18:00',
    label: '晚餐',
    ratio: '60%'
  }];
}

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["pagesPet/sub-vendors","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/feeding-advice/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map