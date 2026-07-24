"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/chronic-tracking/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/chronic-tracking/index!./src/pagesPet/chronic-tracking/index.tsx":
/*!********************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/chronic-tracking/index!./src/pagesPet/chronic-tracking/index.tsx ***!
  \********************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ChronicTrackingPage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var _stores_authStore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../stores/authStore */ "./src/stores/authStore.ts");
/* harmony import */ var _stores_petStore__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../stores/petStore */ "./src/stores/petStore.ts");
/* harmony import */ var _services_chronicService__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../services/chronicService */ "./src/services/chronicService.ts");
/* harmony import */ var _services_syncService__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../services/syncService */ "./src/services/syncService.ts");
/* harmony import */ var _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../types/chronicTypes */ "./src/types/chronicTypes.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");

















function ChronicTrackingPage() {
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__.useThemeClass)();
  var user = (0,_stores_authStore__WEBPACK_IMPORTED_MODULE_3__.useAuthStore)(function (state) {
    return state.user;
  });
  var _usePetStore = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_4__.usePetStore)(),
    currentPet = _usePetStore.currentPet,
    pets = _usePetStore.pets,
    fetchPets = _usePetStore.fetchPets;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState, 2),
    records = _useState2[0],
    setRecords = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
      active: 0,
      managed: 0,
      resolved: 0,
      total: 0,
      overdueCheckups: 0
    }),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState3, 2),
    stats = _useState4[0],
    setStats = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState5, 2),
    upcomingCheckups = _useState6[0],
    setUpcomingCheckups = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState7, 2),
    trendData = _useState8[0],
    setTrendData = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState9, 2),
    showAdd = _useState0[0],
    setShowAdd = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null),
    _useState10 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState1, 2),
    editingRecord = _useState10[0],
    setEditingRecord = _useState10[1];
  var _useState11 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('list'),
    _useState12 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState11, 2),
    activeTab = _useState12[0],
    setActiveTab = _useState12[1];
  var _useState13 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState14 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState13, 2),
    syncing = _useState14[0],
    setSyncing = _useState14[1];
  var _useState15 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('idle'),
    _useState16 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState15, 2),
    syncStatus = _useState16[0],
    setSyncStatus = _useState16[1];
  var pet = currentPet || pets[0];
  var loadData = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function () {
    if (!pet || !user) return;
    var petRecords = (0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.getChronicRecords)(pet.id, user.id);
    setRecords(petRecords);
    setStats((0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.getChronicStats)(pet.id, user.id));
    setUpcomingCheckups((0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.getUpcomingCheckups)(pet.id, user.id, 7));
    setTrendData((0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.getChronicTrendData)(pet.id, user.id, 30));
  }, [pet, user]);
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__.useDidShow)(function () {
    if (user && !pets.length) {
      fetchPets(user.id);
    }
  });
  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    loadData();
  }, [loadData]);
  var handleSync = /*#__PURE__*/function () {
    var _ref = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee() {
      var syncService, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (user) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setSyncing(true);
            setSyncStatus('syncing');
            _context.p = 2;
            syncService = (0,_services_syncService__WEBPACK_IMPORTED_MODULE_6__.getSyncService)(user.id);
            _context.n = 3;
            return syncService.syncAll();
          case 3:
            setSyncStatus('synced');
            setTimeout(function () {
              return setSyncStatus('idle');
            }, 2000);
            loadData();
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            setSyncStatus('error');
            setTimeout(function () {
              return setSyncStatus('idle');
            }, 2000);
          case 5:
            _context.p = 5;
            setSyncing(false);
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4, 5, 6]]);
    }));
    return function handleSync() {
      return _ref.apply(this, arguments);
    };
  }();
  var handleAdd = function handleAdd(data) {
    if (!pet || !user) return;
    (0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.addChronicRecord)(pet.id, user.id, data);
    setShowAdd(false);
    loadData();
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
      title: '添加成功',
      icon: 'success'
    });
  };
  var handleUpdate = function handleUpdate(id, updates) {
    if (!pet || !user) return;
    (0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.updateChronicRecord)(pet.id, user.id, id, updates);
    setEditingRecord(null);
    loadData();
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
      title: '更新成功',
      icon: 'success'
    });
  };
  var handleDelete = function handleDelete(id) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showModal({
      title: '确认删除',
      content: '确定要删除这条慢性病记录吗？',
      success: function success(res) {
        if (res.confirm && pet && user) {
          (0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.deleteChronicRecord)(pet.id, user.id, id);
          loadData();
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  };
  if (!pet) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-empty",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-empty-text",
        children: "\u8BF7\u5148\u6DFB\u52A0\u5BA0\u7269"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.ScrollView, {
    className: "chronic-page ".concat(themeClass),
    scrollY: true,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-header",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-header-top",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-title",
            children: "\u6162\u6027\u75C5\u8FFD\u8E2A"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-subtitle",
            children: [pet.name, " \u7684\u5065\u5EB7\u6863\u6848"]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-sync-btn",
          onClick: handleSync,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-sync-icon",
            children: syncing ? '⏳' : syncStatus === 'synced' ? '✅' : '☁️'
          })
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-summary",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-summary-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-summary-number",
          children: stats.active
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-summary-label",
          children: "\u6D3B\u8DC3\u4E2D"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-summary-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-summary-number",
          children: stats.managed
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-summary-label",
          children: "\u5DF2\u63A7\u5236"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-summary-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-summary-number",
          children: stats.resolved
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-summary-label",
          children: "\u5DF2\u5EB7\u590D"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-summary-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-summary-number ".concat(stats.overdueCheckups > 0 ? 'chronic-summary-number--warn' : ''),
          children: stats.overdueCheckups
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-summary-label",
          children: "\u903E\u671F\u590D\u67E5"
        })]
      })]
    }), stats.overdueCheckups > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-alert",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-alert-icon",
        children: "\u26A0\uFE0F"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-alert-text",
        children: ["\u6709 ", stats.overdueCheckups, " \u9879\u590D\u67E5\u5DF2\u903E\u671F\uFF0C\u8BF7\u5C3D\u5FEB\u5B89\u6392"]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-tabs",
      children: ['list', 'trend', 'reminders'].map(function (tab) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-tab ".concat(activeTab === tab ? 'chronic-tab--active' : ''),
          onClick: function onClick() {
            return setActiveTab(tab);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            children: tab === 'list' ? '记录' : tab === 'trend' ? '趋势' : '提醒'
          })
        }, tab);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-actions",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-add-btn",
        onClick: function onClick() {
          return setShowAdd(true);
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-add-icon",
          children: "+"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          children: "\u6DFB\u52A0\u8BB0\u5F55"
        })]
      })
    }), activeTab === 'list' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-content",
      children: [records.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-empty-state",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-empty-icon",
          children: "\uD83E\uDE7A"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-empty-title",
          children: "\u6682\u65E0\u6162\u6027\u75C5\u8BB0\u5F55"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-empty-hint",
          children: "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u5BA0\u7269\u7684\u6162\u6027\u75C5\u4FE1\u606F"
        })]
      }), records.map(function (record) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(ChronicRecordCard, {
          record: record,
          onUpdate: handleUpdate,
          onDelete: handleDelete,
          onEdit: setEditingRecord
        }, record.id);
      })]
    }), activeTab === 'trend' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-content",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(ChronicTrendChart, {
        data: trendData,
        records: records
      })
    }), activeTab === 'reminders' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-content",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(ChronicReminders, {
        upcoming: upcomingCheckups,
        petName: pet.name,
        onRecordClick: function onRecordClick(record) {
          setActiveTab('list');
        }
      })
    }), showAdd && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(ChronicFormModal, {
      mode: "add",
      onSubmit: handleAdd,
      onClose: function onClose() {
        return setShowAdd(false);
      }
    }), editingRecord && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(ChronicFormModal, {
      mode: "edit",
      record: editingRecord,
      onSubmit: function onSubmit(data) {
        return handleUpdate(editingRecord.id, data);
      },
      onClose: function onClose() {
        return setEditingRecord(null);
      }
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-bottom-safe"
    })]
  });
}
function ChronicRecordCard(_ref2) {
  var record = _ref2.record,
    onUpdate = _ref2.onUpdate,
    onDelete = _ref2.onDelete,
    onEdit = _ref2.onEdit;
  var _useState17 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState18 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState17, 2),
    expanded = _useState18[0],
    setExpanded = _useState18[1];
  var isOverdue = record.nextCheckupDate && new Date(record.nextCheckupDate) < new Date() && record.status !== 'resolved';
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
    className: "chronic-card",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-card-header",
      onClick: function onClick() {
        return setExpanded(!expanded);
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-main",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-card-title-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-card-title",
            children: record.condition
          }), isOverdue && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-card-overdue-badge",
            children: "\u903E\u671F"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-card-tags",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-card-tag",
            style: {
              backgroundColor: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_SEVERITY_MAP[record.severity].color + '20',
              color: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_SEVERITY_MAP[record.severity].color
            },
            children: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_SEVERITY_MAP[record.severity].label
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-card-tag",
            style: {
              backgroundColor: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_STATUS_MAP[record.status].color + '20',
              color: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_STATUS_MAP[record.status].color
            },
            children: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_STATUS_MAP[record.status].label
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-card-arrow",
        children: expanded ? '▼' : '▶'
      })]
    }), expanded && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-card-body",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-label",
          children: "\u786E\u8BCA\u65E5\u671F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-value",
          children: record.diagnosedDate
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-label",
          children: "\u4E3B\u6CBB\u533B\u751F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-value",
          children: record.vetName || '未填写'
        })]
      }), record.vetContact && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-label",
          children: "\u8054\u7CFB\u65B9\u5F0F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-value",
          children: record.vetContact
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-label",
          children: "\u7528\u836F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-value",
          children: record.medications.length > 0 ? record.medications.join('、') : '无'
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-label",
          children: "\u75C7\u72B6"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-value",
          children: record.symptoms.length > 0 ? record.symptoms.join('、') : '无'
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-label",
          children: "\u4E0B\u6B21\u590D\u67E5"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-value ".concat(isOverdue ? 'chronic-card-overdue' : ''),
          children: [record.nextCheckupDate || '未设置', isOverdue && ' (已逾期)']
        })]
      }), record.notes && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-label",
          children: "\u5907\u6CE8"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-card-value",
          children: record.notes
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-card-actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-card-btn chronic-card-btn-primary",
          onClick: function onClick() {
            return onUpdate(record.id, {
              status: record.status === 'active' ? 'managed' : 'active'
            });
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            children: record.status === 'active' ? '标记为已控制' : '标记为活跃'
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-card-btn chronic-card-btn-edit",
          onClick: function onClick() {
            return onEdit(record);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            children: "\u7F16\u8F91"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-card-btn chronic-card-btn-danger",
          onClick: function onClick() {
            return onDelete(record.id);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            children: "\u5220\u9664"
          })
        })]
      })]
    })]
  });
}
function ChronicTrendChart(_ref3) {
  var data = _ref3.data,
    records = _ref3.records;
  if (records.length === 0) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-empty-state",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-empty-icon",
        children: "\uD83D\uDCCA"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-empty-title",
        children: "\u6682\u65E0\u8D8B\u52BF\u6570\u636E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-empty-hint",
        children: "\u6DFB\u52A0\u6162\u6027\u75C5\u8BB0\u5F55\u540E\u5C06\u5C55\u793A\u5065\u5EB7\u8D8B\u52BF"
      })]
    });
  }
  var maxConditions = Math.max.apply(Math, [1].concat((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_13__["default"])(data.map(function (d) {
    return d.conditions.length;
  }))));
  var activeConditions = records.filter(function (r) {
    return r.status !== 'resolved';
  }).map(function (r) {
    return r.condition;
  });
  var uniqueConditions = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_13__["default"])(new Set(activeConditions));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
    className: "chronic-trend",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-trend-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-trend-title",
        children: "30\u5929\u75BE\u75C5\u6D3B\u8DC3\u8D8B\u52BF"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-trend-subtitle",
        children: "\u6BCF\u65E5\u6D3B\u8DC3\u75BE\u75C5\u6570\u91CF\u53D8\u5316"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-trend-chart",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-trend-y-axis",
        children: [maxConditions, Math.ceil(maxConditions * 0.75), Math.ceil(maxConditions * 0.5), Math.ceil(maxConditions * 0.25), 0].map(function (v) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-trend-y-label",
            children: v
          }, v);
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.ScrollView, {
        className: "chronic-trend-canvas",
        scrollX: true,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-trend-bars",
          style: {
            width: "".concat(data.length * 12, "px")
          },
          children: data.map(function (point, index) {
            var height = maxConditions > 0 ? point.conditions.length / maxConditions * 100 : 0;
            var hasSevere = point.severityCounts.severe > 0;
            var hasModerate = point.severityCounts.moderate > 0;
            var barColor = '#52c41a';
            if (hasSevere) barColor = '#f5222d';else if (hasModerate) barColor = '#faad14';
            var showLabel = index % 5 === 0 || point.conditions.length > 0;
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
              className: "chronic-trend-bar-wrap",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
                className: "chronic-trend-bar-bg",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
                  className: "chronic-trend-bar",
                  style: {
                    height: "".concat(Math.max(height, point.conditions.length > 0 ? 8 : 2), "%"),
                    backgroundColor: barColor
                  }
                })
              }), showLabel && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
                className: "chronic-trend-bar-label",
                children: point.date.slice(5)
              })]
            }, point.date);
          })
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-trend-legend",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-trend-legend-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-trend-legend-dot",
          style: {
            backgroundColor: '#f5222d'
          }
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-trend-legend-text",
          children: "\u542B\u91CD\u5EA6"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-trend-legend-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-trend-legend-dot",
          style: {
            backgroundColor: '#faad14'
          }
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-trend-legend-text",
          children: "\u542B\u4E2D\u5EA6"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-trend-legend-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-trend-legend-dot",
          style: {
            backgroundColor: '#52c41a'
          }
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-trend-legend-text",
          children: "\u4EC5\u8F7B\u5EA6"
        })]
      })]
    }), uniqueConditions.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-trend-conditions",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-trend-conditions-title",
        children: "\u5F53\u524D\u6D3B\u8DC3\u75BE\u75C5\uFF1A"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-trend-conditions-list",
        children: uniqueConditions.map(function (condition) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-trend-condition-tag",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-trend-condition-text",
              children: condition
            })
          }, condition);
        })
      })]
    })]
  });
}
function ChronicReminders(_ref4) {
  var upcoming = _ref4.upcoming,
    petName = _ref4.petName;
  if (upcoming.length === 0) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-empty-state",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-empty-icon",
        children: "\uD83D\uDCC5"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-empty-title",
        children: "\u6682\u65E0\u63D0\u9192"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
        className: "chronic-empty-hint",
        children: "\u672A\u67657\u5929\u6CA1\u6709\u5F85\u590D\u67E5\u9879\u76EE\uFF0C\u592A\u68D2\u4E86\uFF01"
      })]
    });
  }
  var overdue = upcoming.filter(function (u) {
    return u.isOverdue;
  });
  var upcomingList = upcoming.filter(function (u) {
    return !u.isOverdue;
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
    className: "chronic-reminders",
    children: [overdue.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-reminders-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-reminders-section-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-reminders-section-icon",
          children: "\u26A0\uFE0F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-reminders-section-title",
          children: ["\u5DF2\u903E\u671F (", overdue.length, ")"]
        })]
      }), overdue.map(function (item) {
        var payload = (0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.generateChronicReminderPayload)(item.record, petName, item.daysUntil);
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-reminder-card chronic-reminder-card--urgent",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-reminder-badge",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-reminder-badge-text",
              children: ["\u903E\u671F ", Math.abs(item.daysUntil), " \u5929"]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-reminder-body",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-reminder-condition",
              children: item.record.condition
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-reminder-date",
              children: ["\u5E94\u4E8E ", item.record.nextCheckupDate, " \u590D\u67E5"]
            }), item.record.vetName && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-reminder-vet",
              children: ["\u533B\u751F\uFF1A", item.record.vetName]
            })]
          })]
        }, item.record.id);
      })]
    }), upcomingList.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-reminders-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-reminders-section-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-reminders-section-icon",
          children: "\uD83D\uDCC5"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-reminders-section-title",
          children: ["\u5373\u5C06\u5230\u671F (", upcomingList.length, ")"]
        })]
      }), upcomingList.map(function (item) {
        var payload = (0,_services_chronicService__WEBPACK_IMPORTED_MODULE_5__.generateChronicReminderPayload)(item.record, petName, item.daysUntil);
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-reminder-card ".concat(item.daysUntil <= 3 ? 'chronic-reminder-card--soon' : ''),
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-reminder-badge ".concat(item.daysUntil <= 3 ? 'chronic-reminder-badge--soon' : ''),
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-reminder-badge-text",
              children: item.daysUntil === 0 ? '今天' : "".concat(item.daysUntil, " \u5929\u540E")
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-reminder-body",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-reminder-condition",
              children: item.record.condition
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-reminder-date",
              children: ["\u590D\u67E5\u65E5\u671F\uFF1A", item.record.nextCheckupDate]
            }), item.record.vetName && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
              className: "chronic-reminder-vet",
              children: ["\u533B\u751F\uFF1A", item.record.vetName]
            })]
          })]
        }, item.record.id);
      })]
    })]
  });
}
function ChronicFormModal(_ref5) {
  var _record$medications, _record$symptoms;
  var mode = _ref5.mode,
    record = _ref5.record,
    onSubmit = _ref5.onSubmit,
    onClose = _ref5.onClose;
  var _useState19 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
      condition: (record === null || record === void 0 ? void 0 : record.condition) || '',
      diagnosedDate: (record === null || record === void 0 ? void 0 : record.diagnosedDate) || '',
      severity: (record === null || record === void 0 ? void 0 : record.severity) || 'mild',
      status: (record === null || record === void 0 ? void 0 : record.status) || 'active',
      medications: (record === null || record === void 0 || (_record$medications = record.medications) === null || _record$medications === void 0 ? void 0 : _record$medications.join('、')) || '',
      vetName: (record === null || record === void 0 ? void 0 : record.vetName) || '',
      vetContact: (record === null || record === void 0 ? void 0 : record.vetContact) || '',
      nextCheckupDate: (record === null || record === void 0 ? void 0 : record.nextCheckupDate) || '',
      notes: (record === null || record === void 0 ? void 0 : record.notes) || '',
      symptoms: (record === null || record === void 0 || (_record$symptoms = record.symptoms) === null || _record$symptoms === void 0 ? void 0 : _record$symptoms.join('、')) || ''
    }),
    _useState20 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState19, 2),
    form = _useState20[0],
    setForm = _useState20[1];
  var _useState21 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState22 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState21, 2),
    showConditionPicker = _useState22[0],
    setShowConditionPicker = _useState22[1];
  var handleDateChange = function handleDateChange(field) {
    return function (e) {
      setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])({}, form), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_15__["default"])({}, field, e.detail.value)));
    };
  };
  var handleInput = function handleInput(field) {
    return function (e) {
      setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])({}, form), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_15__["default"])({}, field, e.detail.value)));
    };
  };
  var handleSelectCondition = function handleSelectCondition(condition) {
    setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])({}, form), {}, {
      condition: condition
    }));
    setShowConditionPicker(false);
  };
  var handleSubmit = function handleSubmit() {
    if (!form.condition.trim()) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
        title: '请输入疾病名称',
        icon: 'none'
      });
      return;
    }
    if (!form.diagnosedDate) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
        title: '请选择确诊日期',
        icon: 'none'
      });
      return;
    }
    onSubmit({
      condition: form.condition.trim(),
      diagnosedDate: form.diagnosedDate,
      severity: form.severity,
      status: form.status,
      medications: form.medications.split(/[,，、]/).map(function (s) {
        return s.trim();
      }).filter(Boolean),
      vetName: form.vetName.trim(),
      vetContact: form.vetContact.trim(),
      nextCheckupDate: form.nextCheckupDate,
      notes: form.notes.trim(),
      symptoms: form.symptoms.split(/[,，、]/).map(function (s) {
        return s.trim();
      }).filter(Boolean)
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
    className: "chronic-modal-overlay",
    onClick: onClose,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
      className: "chronic-modal",
      onClick: function onClick(e) {
        return e.stopPropagation();
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-modal-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-modal-title",
          children: mode === 'add' ? '添加慢性病记录' : '编辑慢性病记录'
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
          className: "chronic-modal-close",
          onClick: onClose,
          children: "\xD7"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.ScrollView, {
        className: "chronic-modal-body",
        scrollY: true,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u75BE\u75C5\u540D\u79F0 *"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-form-condition-input",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Input, {
              className: "chronic-form-input chronic-form-input--condition",
              placeholder: "\u5982\uFF1A\u6162\u6027\u80BE\u75C5\u3001\u5FC3\u810F\u75C5\u7B49",
              value: form.condition,
              onInput: handleInput('condition'),
              onFocus: function onFocus() {
                return setShowConditionPicker(true);
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
              className: "chronic-form-condition-toggle",
              onClick: function onClick() {
                return setShowConditionPicker(!showConditionPicker);
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
                children: showConditionPicker ? '▲' : '▼'
              })
            })]
          }), showConditionPicker && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-condition-picker",
            children: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_COMMON_CONDITIONS.map(function (c) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
                className: "chronic-condition-option ".concat(form.condition === c ? 'chronic-condition-option--active' : ''),
                onClick: function onClick() {
                  return handleSelectCondition(c);
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
                  children: c
                })
              }, c);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u786E\u8BCA\u65E5\u671F *"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Picker, {
            mode: "date",
            value: form.diagnosedDate,
            onChange: handleDateChange('diagnosedDate'),
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
              className: "chronic-form-picker",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
                children: form.diagnosedDate || '请选择日期'
              })
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u4E25\u91CD\u7A0B\u5EA6"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-form-severity",
            children: ['mild', 'moderate', 'severe'].map(function (s) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
                className: "chronic-severity-option ".concat(form.severity === s ? 'chronic-severity-active' : ''),
                style: form.severity === s ? {
                  backgroundColor: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_SEVERITY_MAP[s].color,
                  borderColor: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_SEVERITY_MAP[s].color
                } : {},
                onClick: function onClick() {
                  return setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])({}, form), {}, {
                    severity: s
                  }));
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
                  children: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_SEVERITY_MAP[s].label
                })
              }, s);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u72B6\u6001"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
            className: "chronic-form-severity",
            children: ['active', 'managed', 'resolved'].map(function (s) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
                className: "chronic-severity-option ".concat(form.status === s ? 'chronic-severity-active' : ''),
                style: form.status === s ? {
                  backgroundColor: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_STATUS_MAP[s].color,
                  borderColor: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_STATUS_MAP[s].color
                } : {},
                onClick: function onClick() {
                  return setForm((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_14__["default"])({}, form), {}, {
                    status: s
                  }));
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
                  children: _types_chronicTypes__WEBPACK_IMPORTED_MODULE_7__.CHRONIC_STATUS_MAP[s].label
                })
              }, s);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u4E3B\u6CBB\u533B\u751F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Input, {
            className: "chronic-form-input",
            placeholder: "\u533B\u751F\u59D3\u540D",
            value: form.vetName,
            onInput: handleInput('vetName')
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u8054\u7CFB\u65B9\u5F0F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Input, {
            className: "chronic-form-input",
            placeholder: "\u7535\u8BDD\u6216\u5FAE\u4FE1",
            value: form.vetContact,
            onInput: handleInput('vetContact')
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u7528\u836F\uFF08\u7528\u9017\u53F7\u5206\u9694\uFF09"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Input, {
            className: "chronic-form-input",
            placeholder: "\u5982\uFF1A\u8D1D\u90A3\u666E\u5229\u3001\u585E\u7C73",
            value: form.medications,
            onInput: handleInput('medications')
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u75C7\u72B6\uFF08\u7528\u9017\u53F7\u5206\u9694\uFF09"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Input, {
            className: "chronic-form-input",
            placeholder: "\u5982\uFF1A\u591A\u996E\u591A\u5C3F\u3001\u98DF\u6B32\u4E0B\u964D",
            value: form.symptoms,
            onInput: handleInput('symptoms')
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u4E0B\u6B21\u590D\u67E5\u65E5\u671F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Picker, {
            mode: "date",
            value: form.nextCheckupDate,
            onChange: handleDateChange('nextCheckupDate'),
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
              className: "chronic-form-picker",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
                children: form.nextCheckupDate || '请选择日期'
              })
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-form-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            className: "chronic-form-label",
            children: "\u5907\u6CE8"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Textarea, {
            className: "chronic-form-textarea",
            placeholder: "\u5176\u4ED6\u9700\u8981\u8BB0\u5F55\u7684\u4FE1\u606F",
            value: form.notes,
            onInput: handleInput('notes')
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
        className: "chronic-modal-footer",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-modal-btn chronic-modal-btn-cancel",
          onClick: onClose,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            children: "\u53D6\u6D88"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.View, {
          className: "chronic-modal-btn chronic-modal-btn-confirm",
          onClick: handleSubmit,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_12__.Text, {
            children: "\u4FDD\u5B58"
          })
        })]
      })]
    })
  });
}

/***/ }),

/***/ "./src/pagesPet/chronic-tracking/index.tsx":
/*!*************************************************!*\
  !*** ./src/pagesPet/chronic-tracking/index.tsx ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_chronic_tracking_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/chronic-tracking/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/chronic-tracking/index!./src/pagesPet/chronic-tracking/index.tsx");


var config = {};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_chronic_tracking_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/chronic-tracking/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_chronic_tracking_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/types/chronicTypes.ts":
/*!***********************************!*\
  !*** ./src/types/chronicTypes.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CHRONIC_COMMON_CONDITIONS": function() { return /* binding */ CHRONIC_COMMON_CONDITIONS; },
/* harmony export */   "CHRONIC_SEVERITY_MAP": function() { return /* binding */ CHRONIC_SEVERITY_MAP; },
/* harmony export */   "CHRONIC_STATUS_MAP": function() { return /* binding */ CHRONIC_STATUS_MAP; }
/* harmony export */ });
var CHRONIC_COMMON_CONDITIONS = ['慢性肾病', '心脏病', '糖尿病', '甲状腺功能减退', '关节炎', '皮肤病', '过敏性皮炎', '胰腺炎', '肝病', '牙周病', '肥胖症', '泌尿道结石', '髋关节发育不良', '白内障', '癫痫'];
var CHRONIC_SEVERITY_MAP = {
  mild: {
    label: '轻度',
    color: '#52c41a'
  },
  moderate: {
    label: '中度',
    color: '#faad14'
  },
  severe: {
    label: '重度',
    color: '#f5222d'
  }
};
var CHRONIC_STATUS_MAP = {
  active: {
    label: '活跃中',
    color: '#1890ff'
  },
  managed: {
    label: '已控制',
    color: '#52c41a'
  },
  resolved: {
    label: '已康复',
    color: '#8c8c8c'
  }
};

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["pagesPet/sub-vendors","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/chronic-tracking/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map