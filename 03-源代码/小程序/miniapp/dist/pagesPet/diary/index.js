"use strict";require("../sub-vendors.js");require("../sub-common/6445d8bdf2172a6fd6abee9a9e2cae24.js");require("../sub-common/a80d2ee33a59c94051f538ac359a531d.js");require("../sub-common/ad46eb011750498141202c06d6a54fd7.js");require("../sub-common/53c676dc54a90fa031d0d212976af696.js");require("../sub-common/768a8bdc99340ebc9871b27d737f9bf1.js");require("../sub-common/084a7625e5a94df19215dd3f71376275.js");require("../sub-common/362017fe540ca8d425bcc5fff5d81d56.js");require("../sub-common/bdd8c1063b7c478b3c5853b4e19995be.js");require("../sub-common/1da61588ccaed5095fd84b784215335a.js");require("../sub-common/bf906669438a96f38844c3c6f39d29bc.js");require("../sub-common/78e9a69780f50dc8eb415f90e4b0d1aa.js");require("../sub-common/279a1bdd2c9ebe3d0d313e7747fad397.js");require("../sub-common/45e56c8104d647f68948a147e442abb2.js");require("../sub-common/bc25f333f02ba8949d7db976155bfa6c.js");require("../sub-common/64d5377f280d43652f807f9764e6a048.js");require("../sub-common/4a0fb236aec95d03c6cb34b8d767b071.js");require("../sub-common/2fe9cda489814e13d999f65f4d58d377.js");require("../sub-common/4cb0167d5bf595dc3142958e17c39595.js");require("../sub-common/80674d8b64db1a1b538dfc57835b8217.js");require("../sub-common/42b17aff974a80b56214363e606bec25.js");require("../sub-common/aef81bd8d1559364bab920eb83d1742f.js");require("../sub-common/c63586835e3128dc3b689ef08f52b55e.js");require("../sub-common/256cb1bae39d15a7a40be3f8bde632a0.js");require("../sub-common/9cc4022de774e2f25907d46ebfa12c51.js");require("../sub-common/4b205c701c0d48481f802d217e8afa2e.js");require("../sub-common/e4e942ddc5c4dcce577167a76482cfa9.js");require("../sub-common/b00a3814ea8cbaeefb7563be69846338.js");require("../sub-common/3b5ebbc81c104203dd0f5dc7633051c8.js");require("../sub-common/98b4553375a10962cb604457c57bccce.js");require("../sub-common/13a958176945920d55994cca5c26bf4a.js");require("../sub-common/0e65fc53ef4c577a6e69d70c0d745e82.js");require("../sub-common/aa214bc7fb0682c95501a7cd626652b2.js");require("../sub-common/a042cc083218774b9f99b3d73ca7d8b4.js");require("../sub-common/0c7fbab6d76d62b695e8f5b2f603b921.js");require("../sub-common/96df096222dcab34e85ae95de2e6e225.js");require("../sub-common/2efb7245bee0172d30c17c5db16eea33.js");require("../sub-common/60e2e2b495e215df6e4ec63764e84b05.js");require("../sub-common/06f24cd9387af06f06fe308b91b87256.js");require("../sub-common/e4ff0f7a9239f0ee5b257f28d854dd5b.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/diary/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/diary/index!./src/pagesPet/diary/index.tsx":
/*!**********************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/diary/index!./src/pagesPet/diary/index.tsx ***!
  \**********************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ PetDiaryPage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var _components_PetSwitcher__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../components/PetSwitcher */ "./src/components/PetSwitcher.tsx");
/* harmony import */ var _components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../components */ "./src/components/index.ts");
/* harmony import */ var _stores_petStore__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../stores/petStore */ "./src/stores/petStore.ts");
/* harmony import */ var _stores_authStore__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../stores/authStore */ "./src/stores/authStore.ts");
/* harmony import */ var _stores_checkinStore__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../stores/checkinStore */ "./src/stores/checkinStore.ts");
/* harmony import */ var _services_diaryService__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../services/diaryService */ "./src/services/diaryService.ts");
/* harmony import */ var _engines_petSafety_MedicalDisclaimer__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../engines/petSafety/MedicalDisclaimer */ "./src/engines/petSafety/MedicalDisclaimer.ts");
/* harmony import */ var _hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../hooks/useAnalytics */ "./src/hooks/useAnalytics.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");

















var TONE_COLORS = {
  happy: '#52C41A',
  neutral: '#8C8C8C',
  tired: '#FAAD14',
  sick: '#FF4D4F',
  proud: '#FF8C42'
};
var TONE_LABELS = {
  happy: '开心',
  neutral: '平静',
  tired: '疲惫',
  sick: '不舒服',
  proud: '骄傲'
};
function formatDateDisplay(dateStr) {
  var parts = dateStr.split('-');
  if (parts.length >= 3) {
    return "".concat(parts[1], "\u6708").concat(parts[2], "\u65E5");
  }
  return dateStr;
}
function formatFullDate(dateStr) {
  var parts = dateStr.split('-');
  if (parts.length >= 3) {
    var year = parts[0];
    var month = parts[1];
    var day = parts[2];
    var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var d = new Date("".concat(year, "-").concat(month, "-").concat(day));
    var weekDay = weekDays[d.getDay()];
    return "".concat(month, "\u6708").concat(day, "\u65E5 ").concat(weekDay);
  }
  return dateStr;
}
function PetDiaryPage() {
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__.useThemeClass)();
  var _usePetStore = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_5__.usePetStore)(),
    pets = _usePetStore.pets,
    currentPet = _usePetStore.currentPet,
    fetchPets = _usePetStore.fetchPets,
    switchPet = _usePetStore.switchPet;
  var user = (0,_stores_authStore__WEBPACK_IMPORTED_MODULE_6__.useAuthStore)(function (s) {
    return s.user;
  });
  var _useCheckinStore = (0,_stores_checkinStore__WEBPACK_IMPORTED_MODULE_7__.useCheckinStore)(),
    checkins = _useCheckinStore.checkins,
    fetchCheckins = _useCheckinStore.fetchCheckins,
    checkinLoading = _useCheckinStore.isLoading,
    initUser = _useCheckinStore.initUser;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__["default"])(_useState, 2),
    diaryRecords = _useState2[0],
    setDiaryRecords = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__["default"])(_useState3, 2),
    isLoading = _useState4[0],
    setIsLoading = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(''),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__["default"])(_useState5, 2),
    error = _useState6[0],
    setError = _useState6[1];
  var _useAnalytics = (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_10__.useAnalytics)(),
    trackPageView = _useAnalytics.trackPageView,
    trackEvent = _useAnalytics.trackEvent;
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__.useShareAppMessage)(function () {
    return {
      title: '星寰海 - 宠物日记',
      path: '/pagesPet/diary/index'
    };
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__.useShareTimeline)(function () {
    return {
      title: '星寰海 - 宠物日记'
    };
  });
  (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_10__.usePageView)('diary');
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__.useDidShow)(function () {
    if (user !== null && user !== void 0 && user.id) {
      fetchPets(user.id);
    }
  });
  var loadDiaryData = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee() {
    var records, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          setError('');
          setIsLoading(true);
          _context.p = 1;
          if (!(!(currentPet !== null && currentPet !== void 0 && currentPet.id) || !(user !== null && user !== void 0 && user.id))) {
            _context.n = 2;
            break;
          }
          setIsLoading(false);
          return _context.a(2);
        case 2:
          _context.n = 3;
          return initUser(user.id);
        case 3:
          _context.n = 4;
          return fetchCheckins(currentPet.id);
        case 4:
          records = (0,_services_diaryService__WEBPACK_IMPORTED_MODULE_8__.generateDiaryFromEntries)(checkins, currentPet.birthDate || null);
          setDiaryRecords(records);
          _context.n = 6;
          break;
        case 5:
          _context.p = 5;
          _t = _context.v;
          setError(_t instanceof Error ? _t.message : '加载失败，请重试');
        case 6:
          _context.p = 6;
          setIsLoading(false);
          return _context.f(6);
        case 7:
          return _context.a(2);
      }
    }, _callee, null, [[1, 5, 6, 7]]);
  })), [currentPet === null || currentPet === void 0 ? void 0 : currentPet.id, user === null || user === void 0 ? void 0 : user.id, checkins, initUser, fetchCheckins]);
  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    if (currentPet !== null && currentPet !== void 0 && currentPet.id && user !== null && user !== void 0 && user.id) {
      loadDiaryData();
    }
  }, [loadDiaryData]);
  var handlePetSwitch = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (petId) {
    switchPet(petId);
  }, [switchPet]);
  var handleShareEntry = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (record) {
    trackEvent('share_diary', {
      date: record.date,
      tone: record.diary.tone
    });
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showShareMenu({
      withShareTicket: true
    });
  }, []);
  var expressionContext = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
    var _lastEntry$anomalyIte;
    if (!currentPet) return null;
    var lastEntry = diaryRecords.length > 0 ? diaryRecords[0].entry : null;
    return {
      todayEntry: lastEntry,
      hasAnomaly: (lastEntry === null || lastEntry === void 0 ? void 0 : lastEntry.hasAnomaly) || false,
      anomalyCount: (lastEntry === null || lastEntry === void 0 || (_lastEntry$anomalyIte = lastEntry.anomalyItems) === null || _lastEntry$anomalyIte === void 0 ? void 0 : _lastEntry$anomalyIte.length) || 0,
      riskLevel: (lastEntry === null || lastEntry === void 0 ? void 0 : lastEntry.riskLevel) || null,
      streakDays: diaryRecords.length,
      isBirthday: false,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false
    };
  }, [currentPet, diaryRecords]);
  var disclaimerText = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
    return new _engines_petSafety_MedicalDisclaimer__WEBPACK_IMPORTED_MODULE_9__.MedicalDisclaimer().getCheckinDisclaimer(false);
  }, []);
  if (isLoading && pets.length === 0) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "pet-diary",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components__WEBPACK_IMPORTED_MODULE_4__.PageLoading, {})
    });
  }
  if (error && pets.length === 0) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "pet-diary",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components__WEBPACK_IMPORTED_MODULE_4__.PageError, {
        message: error,
        onRetry: loadDiaryData
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
    className: "pet-diary ".concat(themeClass),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_PetSwitcher__WEBPACK_IMPORTED_MODULE_3__["default"], {
      pets: pets,
      currentPetId: (currentPet === null || currentPet === void 0 ? void 0 : currentPet.id) || null,
      onSwitch: handlePetSwitch
    }), currentPet && expressionContext && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "pet-diary__avatar",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components__WEBPACK_IMPORTED_MODULE_4__.PetAvatar, {
        species: currentPet.species,
        petName: currentPet.name,
        expressionContext: expressionContext,
        size: 80,
        showLabel: true
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "pet-diary__header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "pet-diary__title",
        children: "\u5BA0\u7269\u65E5\u8BB0"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "pet-diary__subtitle",
        children: [(currentPet === null || currentPet === void 0 ? void 0 : currentPet.name) || '', "\u7684\u6210\u957F\u8BB0\u5F55"]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.ScrollView, {
      scrollY: true,
      className: "pet-diary__content",
      enhanced: true,
      showScrollbar: false,
      children: isLoading ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "pet-diary__loading",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "pet-diary__loading-text",
          children: "\u52A0\u8F7D\u4E2D..."
        })
      }) : error ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "pet-diary__error",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "pet-diary__error-text",
          children: error
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
          className: "pet-diary__retry-btn",
          onClick: loadDiaryData,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
            className: "pet-diary__retry-text",
            children: "\u91CD\u8BD5"
          })
        })]
      }) : diaryRecords.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "pet-diary__empty",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "pet-diary__empty-icon",
          children: "\uD83D\uDCD4"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "pet-diary__empty-text",
          children: "\u8FD8\u6CA1\u6709\u65E5\u8BB0\u54E6~"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "pet-diary__empty-hint",
          children: "\u6BCF\u5929\u6253\u5361\u540E\u4F1A\u81EA\u52A8\u751F\u6210\u4E00\u7BC7\u65E5\u8BB0"
        })]
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "pet-diary__timeline",
        children: diaryRecords.map(function (record, index) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
            className: "pet-diary__entry",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
              className: "pet-diary__entry-left",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
                className: "pet-diary__dot",
                style: {
                  backgroundColor: TONE_COLORS[record.diary.tone] || '#8C8C8C'
                }
              }), index < diaryRecords.length - 1 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
                className: "pet-diary__line"
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
              className: "pet-diary__entry-right",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
                className: "pet-diary__entry-header",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                  className: "pet-diary__entry-date",
                  children: formatFullDate(record.date)
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
                  className: "pet-diary__tone-badge",
                  style: {
                    backgroundColor: TONE_COLORS[record.diary.tone] || '#8C8C8C'
                  },
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                    className: "pet-diary__tone-text",
                    children: TONE_LABELS[record.diary.tone] || record.diary.tone
                  })
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
                className: "pet-diary__entry-body",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                  className: "pet-diary__entry-emoji",
                  children: record.diary.emoji
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                  className: "pet-diary__entry-text",
                  children: ["\"", record.diary.text, "\""]
                })]
              }), record.entry.note && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
                className: "pet-diary__entry-note",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                  className: "pet-diary__note-label",
                  children: "\uD83D\uDCDD \u5907\u6CE8\uFF1A"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                  className: "pet-diary__note-text",
                  children: record.entry.note
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
                className: "pet-diary__entry-share",
                onClick: function onClick() {
                  return handleShareEntry(record);
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                  className: "pet-diary__share-text",
                  children: "\uD83D\uDCE4 \u5206\u4EAB\u8FD9\u7BC7\u65E5\u8BB0"
                })
              })]
            })]
          }, record.entry.id);
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "pet-diary__disclaimer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "pet-diary__disclaimer-text",
        children: disclaimerText
      })
    })]
  });
}

/***/ }),

/***/ "./src/pagesPet/diary/index.tsx":
/*!**************************************!*\
  !*** ./src/pagesPet/diary/index.tsx ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_diary_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/diary/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/diary/index!./src/pagesPet/diary/index.tsx");


var config = {"navigationBarTitleText":"宠物日记","enablePullDownRefresh":false};
_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_diary_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"].enableShareTimeline = true
_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_diary_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"].enableShareAppMessage = true
var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_diary_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/diary/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_diary_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/services/diaryService.ts":
/*!**************************************!*\
  !*** ./src/services/diaryService.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "generateDiaryFromEntries": function() { return /* binding */ generateDiaryFromEntries; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var _engines_petAvatar_diaryEngine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../engines/petAvatar/diaryEngine */ "./src/engines/petAvatar/diaryEngine.ts");



function entryDateStr(entry) {
  if (entry.createdAt instanceof Date) {
    return entry.createdAt.toISOString().slice(0, 10);
  }
  return String(entry.createdAt).slice(0, 10);
}
function isSameDay(dateStr, target) {
  var parts = dateStr.split('-');
  if (parts.length < 3) return false;
  return parts[0] === String(target.getFullYear()) && parts[1] === String(target.getMonth() + 1).padStart(2, '0') && parts[2] === String(target.getDate()).padStart(2, '0');
}
function calculateStreakAtTime(entries, beforeDate) {
  var uniqueDates = new Set();
  var _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_1__["default"])(entries),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var entry = _step.value;
      var ds = entryDateStr(entry);
      if (ds <= beforeDate.toISOString().slice(0, 10)) {
        uniqueDates.add(ds);
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var sorted = Array.from(uniqueDates).sort();
  var streak = 0;
  var checkDate = new Date(beforeDate);
  for (var i = sorted.length - 1; i >= 0; i--) {
    if (isSameDay(sorted[i], checkDate)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
function generateDiaryFromEntries(entries, petBirthDate) {
  var sorted = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(entries).sort(function (a, b) {
    var da = entryDateStr(a);
    var db = entryDateStr(b);
    return db.localeCompare(da);
  });
  var birthDate = petBirthDate ? new Date(petBirthDate) : null;
  return sorted.map(function (entry) {
    var entryDate = entryDateStr(entry);
    var entryTime = new Date(entry.createdAt || new Date());
    var streakAtTime = calculateStreakAtTime(sorted, entryTime);
    var isBirthday = birthDate ? isSameDay(entryDate, birthDate) : false;
    var diary = (0,_engines_petAvatar_diaryEngine__WEBPACK_IMPORTED_MODULE_0__.generateDiaryEntry)(entry, streakAtTime, isBirthday, false);
    return {
      date: entryDate,
      diary: diary,
      entry: entry
    };
  });
}

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["sub-common/6445d8bdf2172a6fd6abee9a9e2cae24","sub-common/a80d2ee33a59c94051f538ac359a531d","sub-common/ad46eb011750498141202c06d6a54fd7","sub-common/53c676dc54a90fa031d0d212976af696","sub-common/768a8bdc99340ebc9871b27d737f9bf1","sub-common/084a7625e5a94df19215dd3f71376275","sub-common/362017fe540ca8d425bcc5fff5d81d56","sub-common/bdd8c1063b7c478b3c5853b4e19995be","sub-common/1da61588ccaed5095fd84b784215335a","sub-common/0904437f0939f2a23241ccd89a80af6d","sub-common/b1e7b2b66e55366c340f4a448106b498","sub-common/199e252700f972072afe3fa171a0b540","sub-common/2e53ada7e38073b7659abf8bad0e0af7","sub-common/921ca0dd3d58895503b2311b2d7a8cf2","sub-common/bf906669438a96f38844c3c6f39d29bc","sub-common/78e9a69780f50dc8eb415f90e4b0d1aa","sub-common/279a1bdd2c9ebe3d0d313e7747fad397","sub-common/45e56c8104d647f68948a147e442abb2","sub-common/bc25f333f02ba8949d7db976155bfa6c","sub-common/64d5377f280d43652f807f9764e6a048","sub-common/4a0fb236aec95d03c6cb34b8d767b071","sub-common/2fe9cda489814e13d999f65f4d58d377","sub-common/4cb0167d5bf595dc3142958e17c39595","sub-common/80674d8b64db1a1b538dfc57835b8217","sub-common/42b17aff974a80b56214363e606bec25","sub-common/aef81bd8d1559364bab920eb83d1742f","sub-common/a59b40dd1739c7c7f9cbc15e8bac2ab6","sub-common/c63586835e3128dc3b689ef08f52b55e","sub-common/256cb1bae39d15a7a40be3f8bde632a0","sub-common/9cc4022de774e2f25907d46ebfa12c51","sub-common/4b205c701c0d48481f802d217e8afa2e","sub-common/e4e942ddc5c4dcce577167a76482cfa9","sub-common/b00a3814ea8cbaeefb7563be69846338","sub-common/3b5ebbc81c104203dd0f5dc7633051c8","sub-common/89dea285aabaa71ad3d3deff3fff950f","sub-common/98b4553375a10962cb604457c57bccce","sub-common/c75ae219edac2f8d1c7f3f654ca16ab4","sub-common/13a958176945920d55994cca5c26bf4a","sub-common/aa66f76f4d2ba58b7fbc6e142e9f2478","sub-common/dee4e49341537ac47cb8b4a447b9b09b","sub-common/0e65fc53ef4c577a6e69d70c0d745e82","sub-common/3c48f53d767a3eb27fcad73f8c71e1a5","sub-common/aa214bc7fb0682c95501a7cd626652b2","sub-common/b3c9b278d06e1853214d284a082aa1f0","sub-common/3da8a110c99c542a4a4d4fa252635d50","sub-common/a042cc083218774b9f99b3d73ca7d8b4","sub-common/0c7fbab6d76d62b695e8f5b2f603b921","sub-common/d4a8f4b0c5be10f952fbb86d8c302cca","sub-common/b862022fa82f41ebb5e40efb0cccd5c6","sub-common/d3cd10732f86fe1419d072a75fbffd86","sub-common/cb549f44e5e3825b036bddda696727ff","sub-common/442d5987633ae6ba86abf302616028d3","sub-common/96df096222dcab34e85ae95de2e6e225","sub-common/2efb7245bee0172d30c17c5db16eea33","sub-common/4092b25868fc9facbc7e8fb28aa20dc1","sub-common/60e2e2b495e215df6e4ec63764e84b05","sub-common/321f05981306faf245fc648345b52a06","sub-common/b09e30daaf73fdf94c651896cc11de11","sub-common/4d10824e8cf6dd14fef4075724149556","sub-common/06f24cd9387af06f06fe308b91b87256","sub-common/b4cda49b9fde5065b8b67cb988098dd4","sub-common/e4ff0f7a9239f0ee5b257f28d854dd5b","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/diary/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map