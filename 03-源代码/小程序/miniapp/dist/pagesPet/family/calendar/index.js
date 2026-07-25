"use strict";require("../../sub-vendors.js");require("../../sub-common/ad46eb011750498141202c06d6a54fd7.js");require("../../sub-common/768a8bdc99340ebc9871b27d737f9bf1.js");require("../../sub-common/084a7625e5a94df19215dd3f71376275.js");require("../../sub-common/362017fe540ca8d425bcc5fff5d81d56.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/family/calendar/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/family/calendar/index!./src/pagesPet/family/calendar/index.tsx":
/*!******************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/family/calendar/index!./src/pagesPet/family/calendar/index.tsx ***!
  \******************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ FamilyCalendar; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_calendarService__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../services/calendarService */ "./src/services/calendarService.ts");
/* harmony import */ var _stores_familyStore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../stores/familyStore */ "./src/stores/familyStore.ts");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../logger */ "./src/logger/index.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");











var WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
var EVENT_TYPE_CONFIG = {
  vaccine: {
    emoji: '💉',
    color: '#E8A838',
    label: '疫苗'
  },
  deworm: {
    emoji: '🪱',
    color: '#8CAD7E',
    label: '驱虫'
  },
  checkin: {
    emoji: '✅',
    color: '#5B9A9B',
    label: '打卡'
  }
};
function FamilyCalendar() {
  var today = new Date();
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(today.getFullYear()),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState, 2),
    year = _useState2[0],
    setYear = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(today.getMonth() + 1),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState3, 2),
    month = _useState4[0],
    setMonth = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState5, 2),
    selectedDay = _useState6[0],
    setSelectedDay = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState7, 2),
    events = _useState8[0],
    setEvents = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState9, 2),
    loading = _useState0[0],
    setLoading = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState10 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState1, 2),
    error = _useState10[0],
    setError = _useState10[1];
  var _useFamilyStore = (0,_stores_familyStore__WEBPACK_IMPORTED_MODULE_3__.useFamilyStore)(),
    members = _useFamilyStore.members,
    fetchFamilies = _useFamilyStore.fetchFamilies;
  var loadEvents = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().m(function _callee() {
    var result, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          setLoading(true);
          setError(null);
          _context.p = 1;
          _context.n = 2;
          return (0,_services_calendarService__WEBPACK_IMPORTED_MODULE_2__.getFamilyCalendarEvents)(members, year, month);
        case 2:
          result = _context.v;
          setEvents(result);
          _context.n = 4;
          break;
        case 3:
          _context.p = 3;
          _t = _context.v;
          _logger__WEBPACK_IMPORTED_MODULE_4__.logger.error('familyCalendar', '加载日历事件失败', _t);
          setError('加载失败，请重试');
        case 4:
          _context.p = 4;
          setLoading(false);
          return _context.f(4);
        case 5:
          return _context.a(2);
      }
    }, _callee, null, [[1, 3, 4, 5]]);
  })), [members, year, month]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    fetchFamilies();
  }, []);
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.useDidShow)(function () {
    loadEvents();
  });
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    if (members.length > 0) {
      loadEvents();
    }
  }, [year, month]);
  var daysInMonth = new Date(year, month, 0).getDate();
  var firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  var todayDate = today.getDate();
  var isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  var days = [];
  for (var i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (var d = 1; d <= daysInMonth; d++) days.push(d);
  var selectedEvents = selectedDay ? (0,_services_calendarService__WEBPACK_IMPORTED_MODULE_2__.getEventsByDay)(events, selectedDay) : [];
  var handlePrevMonth = function handlePrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  };
  var handleNextMonth = function handleNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  };
  var handleDayClick = function handleDayClick(d) {
    if (d !== null) {
      setSelectedDay(d === selectedDay ? null : d);
    }
  };
  var handleRetry = function handleRetry() {
    loadEvents();
  };
  if (error) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "calendar-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "calendar-error",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "calendar-error__text",
          children: error
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          className: "calendar-error__btn",
          onClick: handleRetry,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
            children: "\u91CD\u8BD5"
          })
        })]
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
    className: "calendar-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "calendar-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "calendar-header__nav",
        onClick: handlePrevMonth,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          children: "\u25C0"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "calendar-header__title",
        children: [year, "\u5E74", month, "\u6708"]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "calendar-header__nav",
        onClick: handleNextMonth,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          children: "\u25B6"
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "calendar-weekdays",
      children: WEEK_DAYS.map(function (w) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "calendar-weekdays__item",
          children: w
        }, w);
      })
    }), loading && events.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "calendar-loading",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "calendar-loading__text",
        children: "\u52A0\u8F7D\u4E2D..."
      })
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "calendar-grid",
      children: days.map(function (d, idx) {
        var isToday = isCurrentMonth && d === todayDate;
        var hasEvent = d !== null && (0,_services_calendarService__WEBPACK_IMPORTED_MODULE_2__.hasEventsOnDay)(events, d);
        var isSelected = d === selectedDay;
        if (d === null) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "calendar-grid__cell calendar-grid__cell--empty"
          }, idx);
        }
        var dayEvents = (0,_services_calendarService__WEBPACK_IMPORTED_MODULE_2__.getEventsByDay)(events, d);
        var hasEmergency = dayEvents.some(function (e) {
          return e.riskLevel === 'emergency' || e.riskLevel === 'high';
        });
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          className: "calendar-grid__cell ".concat(isToday ? 'calendar-grid__cell--today' : '', " ").concat(isSelected ? 'calendar-grid__cell--selected' : ''),
          onClick: function onClick() {
            return handleDayClick(d);
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
            className: "calendar-grid__day",
            children: d
          }), hasEvent && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "calendar-grid__dot ".concat(hasEmergency ? 'calendar-grid__dot--danger' : '')
          })]
        }, idx);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.ScrollView, {
      className: "calendar-events",
      scrollY: true,
      children: selectedDay ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "calendar-events__date",
          children: [month, "\u6708", selectedDay, "\u65E5 \xB7 \u4E8B\u4EF6"]
        }), loading ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "calendar-events__loading",
          children: "\u52A0\u8F7D\u4E2D..."
        }) : selectedEvents.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "calendar-events__empty",
          children: "\u6682\u65E0\u4E8B\u4EF6"
        }) : selectedEvents.map(function (ev, idx) {
          var config = EVENT_TYPE_CONFIG[ev.type];
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "calendar-events__item",
            style: {
              borderLeftColor: config.color
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
              className: "calendar-events__item-emoji",
              children: config.emoji
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "calendar-events__item-body",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "calendar-events__item-title",
                children: ev.title
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
                className: "calendar-events__item-meta",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                  className: "calendar-events__item-pet",
                  children: ev.petName
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                  className: "calendar-events__item-type",
                  style: {
                    color: config.color
                  },
                  children: config.label
                })]
              })]
            })]
          }, idx);
        })]
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "calendar-events__placeholder",
        children: members.length === 0 ? '暂无家庭成员，请先添加宠物' : '点击日期查看事件'
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "calendar-footer",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "calendar-footer__btn",
        onClick: function onClick() {
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
            url: '/pagesPet/vaccine/index'
          });
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "calendar-footer__btn-text",
          children: "\u75AB\u82D7\u7BA1\u7406"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "calendar-footer__btn",
        onClick: function onClick() {
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
            url: '/pagesPet/checkin/index'
          });
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "calendar-footer__btn-text",
          children: "\u5065\u5EB7\u6253\u5361"
        })
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pagesPet/family/calendar/index.tsx":
/*!************************************************!*\
  !*** ./src/pagesPet/family/calendar/index.tsx ***!
  \************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_family_calendar_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/family/calendar/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/family/calendar/index!./src/pagesPet/family/calendar/index.tsx");


var config = {"navigationBarTitleText":"家庭日历"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_family_calendar_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/family/calendar/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_family_calendar_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/services/calendarService.ts":
/*!*****************************************!*\
  !*** ./src/services/calendarService.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getEventsByDay": function() { return /* binding */ getEventsByDay; },
/* harmony export */   "getFamilyCalendarEvents": function() { return /* binding */ getFamilyCalendarEvents; },
/* harmony export */   "hasEventsOnDay": function() { return /* binding */ hasEventsOnDay; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _vaccineService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vaccineService */ "./src/services/vaccineService.ts");
/* harmony import */ var _checkinService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./checkinService */ "./src/services/checkinService.ts");
/* harmony import */ var _utils_authGuard__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/authGuard */ "./src/utils/authGuard.ts");






function getMonthDateRange(year, month) {
  var m = String(month).padStart(2, '0');
  var daysInMonth = new Date(year, month, 0).getDate();
  return {
    startDate: "".concat(year, "-").concat(m, "-01"),
    endDate: "".concat(year, "-").concat(m, "-").concat(String(daysInMonth).padStart(2, '0'))
  };
}
function getVaccineEventType(record) {
  return record.type === 'deworm' ? 'deworm' : 'vaccine';
}
function getVaccineEventTitle(record) {
  return record.category || record.type;
}
function getCheckinRiskEmoji(level) {
  switch (level) {
    case 'emergency':
      return '⚠️ ';
    case 'high':
      return '🔔 ';
    case 'medium':
      return '💡 ';
    default:
      return '';
  }
}

/**
 * 获取指定月份所有家庭成员的日历事件
 * 合并疫苗/驱虫记录和健康打卡记录
 */
function getFamilyCalendarEvents(_x, _x2, _x3) {
  return _getFamilyCalendarEvents.apply(this, arguments);
}

/**
 * 获取指定日期的所有事件
 */
function _getFamilyCalendarEvents() {
  _getFamilyCalendarEvents = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee(members, year, month) {
    var userId, _getMonthDateRange, startDate, endDate, allEvents, membersWithNames, _iterator, _step, member, vaccineRecords, _iterator2, _step2, record, eventDate, day, checkinEntries, _iterator3, _step3, entry, dateStr, _day, riskEmoji, _t, _t2, _t3, _t4;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (!(!(0,_utils_authGuard__WEBPACK_IMPORTED_MODULE_2__.isAuthenticated)() || members.length === 0)) {
            _context.n = 1;
            break;
          }
          return _context.a(2, []);
        case 1:
          _context.p = 1;
          userId = (0,_utils_authGuard__WEBPACK_IMPORTED_MODULE_2__.getAuthenticatedUserId)();
          _context.n = 3;
          break;
        case 2:
          _context.p = 2;
          _t = _context.v;
          return _context.a(2, []);
        case 3:
          _getMonthDateRange = getMonthDateRange(year, month), startDate = _getMonthDateRange.startDate, endDate = _getMonthDateRange.endDate;
          allEvents = [];
          membersWithNames = members.map(function (m) {
            return {
              petId: m.petId,
              petName: m.petName || m.name || '宠物'
            };
          });
          _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_5__["default"])(membersWithNames);
          _context.p = 4;
          _iterator.s();
        case 5:
          if ((_step = _iterator.n()).done) {
            _context.n = 19;
            break;
          }
          member = _step.value;
          _context.p = 6;
          _context.n = 7;
          return (0,_vaccineService__WEBPACK_IMPORTED_MODULE_0__.getRecordsByMonth)(member.petId, year, month);
        case 7:
          vaccineRecords = _context.v;
          if (!(vaccineRecords.length > 0)) {
            _context.n = 15;
            break;
          }
          _iterator2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_5__["default"])(vaccineRecords);
          _context.p = 8;
          _iterator2.s();
        case 9:
          if ((_step2 = _iterator2.n()).done) {
            _context.n = 12;
            break;
          }
          record = _step2.value;
          eventDate = record.date || record.nextDate;
          if (eventDate) {
            _context.n = 10;
            break;
          }
          return _context.a(3, 11);
        case 10:
          day = new Date(eventDate).getDate();
          allEvents.push({
            date: day,
            petName: member.petName,
            petId: member.petId,
            title: getVaccineEventTitle(record),
            type: getVaccineEventType(record)
          });
        case 11:
          _context.n = 9;
          break;
        case 12:
          _context.n = 14;
          break;
        case 13:
          _context.p = 13;
          _t2 = _context.v;
          _iterator2.e(_t2);
        case 14:
          _context.p = 14;
          _iterator2.f();
          return _context.f(14);
        case 15:
          _context.n = 16;
          return (0,_checkinService__WEBPACK_IMPORTED_MODULE_1__.getCheckinsByDateRange)(member.petId, userId, startDate, endDate);
        case 16:
          checkinEntries = _context.v;
          if (checkinEntries.length > 0) {
            _iterator3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_5__["default"])(checkinEntries);
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                entry = _step3.value;
                dateStr = String(entry.createdAt).slice(0, 10);
                _day = new Date(dateStr).getDate();
                riskEmoji = getCheckinRiskEmoji(entry.riskLevel);
                allEvents.push({
                  date: _day,
                  petName: member.petName,
                  petId: member.petId,
                  title: "".concat(riskEmoji, "\u5065\u5EB7\u6253\u5361"),
                  type: 'checkin',
                  riskLevel: entry.riskLevel
                });
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          }
          _context.n = 18;
          break;
        case 17:
          _context.p = 17;
          _t3 = _context.v;
          return _context.a(3, 18);
        case 18:
          _context.n = 5;
          break;
        case 19:
          _context.n = 21;
          break;
        case 20:
          _context.p = 20;
          _t4 = _context.v;
          _iterator.e(_t4);
        case 21:
          _context.p = 21;
          _iterator.f();
          return _context.f(21);
        case 22:
          return _context.a(2, allEvents);
      }
    }, _callee, null, [[8, 13, 14, 15], [6, 17], [4, 20, 21, 22], [1, 2]]);
  }));
  return _getFamilyCalendarEvents.apply(this, arguments);
}
function getEventsByDay(events, day) {
  return events.filter(function (e) {
    return e.date === day;
  });
}

/**
 * 检查某天是否有事件
 */
function hasEventsOnDay(events, day) {
  return events.some(function (e) {
    return e.date === day;
  });
}

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["sub-common/ad46eb011750498141202c06d6a54fd7","sub-common/768a8bdc99340ebc9871b27d737f9bf1","sub-common/084a7625e5a94df19215dd3f71376275","sub-common/362017fe540ca8d425bcc5fff5d81d56","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/family/calendar/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map