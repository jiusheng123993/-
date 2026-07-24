"use strict";require("../sub-common/6445d8bdf2172a6fd6abee9a9e2cae24.js");require("../sub-common/a80d2ee33a59c94051f538ac359a531d.js");require("../sub-common/bdd8c1063b7c478b3c5853b4e19995be.js");require("../sub-common/1da61588ccaed5095fd84b784215335a.js");require("../sub-common/a9a68db88e68e31a6990d19803c6390e.js");require("../sub-common/b668272e463c24db98367b55ee1ede84.js");require("../sub-common/914d491715a6edc71df0bca5b204e9c2.js");require("../sub-common/8e9e3160e7a3b06d42389337fa063587.js");require("../sub-common/0587757cd1ffb49610efd208fc1a021c.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesUser/settings/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesUser/settings/index!./src/pagesUser/settings/index.tsx":
/*!******************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesUser/settings/index!./src/pagesUser/settings/index.tsx ***!
  \******************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ SettingsPage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _stores_authStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../stores/authStore */ "./src/stores/authStore.ts");
/* harmony import */ var _stores_settingsStore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../stores/settingsStore */ "./src/stores/settingsStore.ts");
/* harmony import */ var _stores_themeStore__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../stores/themeStore */ "./src/stores/themeStore.ts");
/* harmony import */ var _hooks_useMembership__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../hooks/useMembership */ "./src/hooks/useMembership.ts");
/* harmony import */ var _hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../hooks/useAnalytics */ "./src/hooks/useAnalytics.ts");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../constants */ "./src/constants/index.ts");
/* harmony import */ var _services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../services/dataPrivacyService */ "./src/services/dataPrivacyService.ts");
/* harmony import */ var _components_AccountDeletionConfirm__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../components/AccountDeletionConfirm */ "./src/components/AccountDeletionConfirm.tsx");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");

















function SettingsPage() {
  var user = (0,_stores_authStore__WEBPACK_IMPORTED_MODULE_2__.useAuthStore)(function (s) {
    return s.user;
  });
  var logout = (0,_stores_authStore__WEBPACK_IMPORTED_MODULE_2__.useAuthStore)(function (s) {
    return s.logout;
  });
  var isMember = (0,_hooks_useMembership__WEBPACK_IMPORTED_MODULE_5__.useMembership)().isMember;
  var notification = (0,_stores_settingsStore__WEBPACK_IMPORTED_MODULE_3__.useSettingsStore)(function (s) {
    return s.notification;
  });
  var loadSettings = (0,_stores_settingsStore__WEBPACK_IMPORTED_MODULE_3__.useSettingsStore)(function (s) {
    return s.loadSettings;
  });
  var updateNotification = (0,_stores_settingsStore__WEBPACK_IMPORTED_MODULE_3__.useSettingsStore)(function (s) {
    return s.updateNotification;
  });
  var clearCache = (0,_stores_settingsStore__WEBPACK_IMPORTED_MODULE_3__.useSettingsStore)(function (s) {
    return s.clearCache;
  });
  var exportData = (0,_stores_settingsStore__WEBPACK_IMPORTED_MODULE_3__.useSettingsStore)(function (s) {
    return s.exportData;
  });
  var currentTheme = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_10__.useThemeKey)();
  var setTheme = _stores_themeStore__WEBPACK_IMPORTED_MODULE_4__.useThemeStore.getState().setTheme;
  var _useAnalytics = (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_6__.useAnalytics)(),
    trackPageView = _useAnalytics.trackPageView,
    trackEvent = _useAnalytics.trackEvent;
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_10__.useThemeClass)();
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__["default"])(_useState, 2),
    privacyStatus = _useState2[0],
    setPrivacyStatus = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__["default"])(_useState3, 2),
    showDeletionModal = _useState4[0],
    setShowDeletionModal = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__["default"])(_useState5, 2),
    deletionConfirmCode = _useState6[0],
    setDeletionConfirmCode = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__["default"])(_useState7, 2),
    deletionLoading = _useState8[0],
    setDeletionLoading = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_12__["default"])(_useState9, 2),
    exportingData = _useState0[0],
    setExportingData = _useState0[1];
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    loadSettings();
    setPrivacyStatus((0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.getDataPrivacyStatus)());
  }, [loadSettings]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    trackPageView('settings');
  }, [trackPageView]);
  var deletionCountdown = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    if (!(privacyStatus !== null && privacyStatus !== void 0 && privacyStatus.accountDeletionRequested) || !privacyStatus.accountDeletionScheduledAt) {
      return null;
    }
    var scheduled = new Date(privacyStatus.accountDeletionScheduledAt);
    var now = new Date();
    var diffMs = scheduled.getTime() - now.getTime();
    if (diffMs <= 0) return '即将执行';
    var days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return "".concat(days, "\u5929\u540E");
  }, [privacyStatus === null || privacyStatus === void 0 ? void 0 : privacyStatus.accountDeletionRequested, privacyStatus === null || privacyStatus === void 0 ? void 0 : privacyStatus.accountDeletionScheduledAt]);
  var handleToggleNotification = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (key, value) {
    trackEvent('toggle_notification', {
      key: key,
      value: value
    });
    updateNotification(key, value);
  }, [updateNotification, trackEvent]);
  var handleClearCache = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
      title: '清除缓存',
      content: '确认清除所有本地缓存数据？',
      success: function success(res) {
        if (res.confirm) {
          trackEvent('clear_cache');
          clearCache();
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '缓存已清除',
            icon: 'success'
          });
        }
      }
    });
  }, [clearCache, trackEvent]);
  var handleExportData = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee() {
    var data, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (isMember) {
            _context.n = 1;
            break;
          }
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '会员专属功能',
            icon: 'none'
          });
          return _context.a(2);
        case 1:
          _context.p = 1;
          data = exportData();
          _context.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().setClipboardData({
            data: data
          });
        case 2:
          trackEvent('export_data');
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '数据已复制到剪贴板',
            icon: 'success'
          });
          _context.n = 4;
          break;
        case 3:
          _context.p = 3;
          _t = _context.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '导出失败',
            icon: 'none'
          });
        case 4:
          return _context.a(2);
      }
    }, _callee, null, [[1, 3]]);
  })), [isMember, exportData, trackEvent]);
  var handleExportAllData = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee3() {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          if (user !== null && user !== void 0 && user.id) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2);
        case 1:
          if (!exportingData) {
            _context3.n = 2;
            break;
          }
          return _context3.a(2);
        case 2:
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
            title: '导出全部数据',
            content: '将导出您在星寰海的所有个人数据（云端+本地），生成JSON文件。是否继续？',
            success: function () {
              var _success = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee2(res) {
                var result, _t2;
                return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context2) {
                  while (1) switch (_context2.p = _context2.n) {
                    case 0:
                      if (res.confirm) {
                        _context2.n = 1;
                        break;
                      }
                      return _context2.a(2);
                    case 1:
                      setExportingData(true);
                      _context2.p = 2;
                      _context2.n = 3;
                      return (0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.exportAllUserData)(user.id);
                    case 3:
                      result = _context2.v;
                      if (!(result.success && result.data)) {
                        _context2.n = 5;
                        break;
                      }
                      _context2.n = 4;
                      return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().setClipboardData({
                        data: result.data
                      });
                    case 4:
                      trackEvent('export_all_data');
                      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                        title: "\u5DF2\u5BFC\u51FA".concat(result.totalRecords, "\u6761\u8BB0\u5F55"),
                        icon: 'success'
                      });
                      setPrivacyStatus((0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.getDataPrivacyStatus)());
                      _context2.n = 6;
                      break;
                    case 5:
                      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                        title: result.error || '导出失败',
                        icon: 'none'
                      });
                    case 6:
                      _context2.n = 8;
                      break;
                    case 7:
                      _context2.p = 7;
                      _t2 = _context2.v;
                      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                        title: '导出失败',
                        icon: 'none'
                      });
                    case 8:
                      _context2.p = 8;
                      setExportingData(false);
                      return _context2.f(8);
                    case 9:
                      return _context2.a(2);
                  }
                }, _callee2, null, [[2, 7, 8, 9]]);
              }));
              function success(_x) {
                return _success.apply(this, arguments);
              }
              return success;
            }()
          });
        case 3:
          return _context3.a(2);
      }
    }, _callee3);
  })), [user === null || user === void 0 ? void 0 : user.id, exportingData, trackEvent]);
  var handleDeleteCloudData = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    if (!(user !== null && user !== void 0 && user.id)) return;
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
      title: '删除云端数据',
      content: '此操作将永久删除您在云端的全部数据，且无法恢复！本地数据不受影响。确定要继续吗？',
      confirmColor: '#FF4D4F',
      success: function () {
        var _success2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee4(res) {
          var result, _t3;
          return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context4) {
            while (1) switch (_context4.p = _context4.n) {
              case 0:
                if (res.confirm) {
                  _context4.n = 1;
                  break;
                }
                return _context4.a(2);
              case 1:
                _context4.p = 1;
                _context4.n = 2;
                return (0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.deleteUserData)(user.id);
              case 2:
                result = _context4.v;
                if (result.success) {
                  trackEvent('delete_cloud_data');
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                    title: "\u5DF2\u5220\u9664".concat(result.deletedTables.length, "\u7C7B\u6570\u636E"),
                    icon: 'success'
                  });
                  setPrivacyStatus((0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.getDataPrivacyStatus)());
                } else {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                    title: result.error || '删除失败',
                    icon: 'none'
                  });
                }
                _context4.n = 4;
                break;
              case 3:
                _context4.p = 3;
                _t3 = _context4.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              case 4:
                return _context4.a(2);
            }
          }, _callee4, null, [[1, 3]]);
        }));
        function success(_x2) {
          return _success2.apply(this, arguments);
        }
        return success;
      }()
    });
  }, [user === null || user === void 0 ? void 0 : user.id, trackEvent]);
  var handleRequestDeletion = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    trackEvent('request_account_deletion');
    var code = (0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.generateDeletionConfirmCode)();
    setDeletionConfirmCode(code);
    setShowDeletionModal(true);
  }, [trackEvent]);
  var handleDeletionConfirm = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/function () {
    var _ref3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee5(reason, customReason, code) {
      var result, _t4;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            if (user !== null && user !== void 0 && user.id) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2);
          case 1:
            setDeletionLoading(true);
            _context5.p = 2;
            _context5.n = 3;
            return (0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.requestAccountDeletion)(user.id, {
              reason: reason,
              customReason: customReason,
              confirmCode: code
            });
          case 3:
            result = _context5.v;
            if (result.success) {
              trackEvent('confirm_account_deletion', {
                reason: reason
              });
              setShowDeletionModal(false);
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                title: "\u6CE8\u9500\u7533\u8BF7\u5DF2\u63D0\u4EA4\uFF0C".concat(result.gracePeriodDays, "\u5929\u51B7\u9759\u671F"),
                icon: 'none',
                duration: 3000
              });
              setPrivacyStatus((0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.getDataPrivacyStatus)());
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                title: result.error || '注销失败',
                icon: 'none'
              });
            }
            _context5.n = 5;
            break;
          case 4:
            _context5.p = 4;
            _t4 = _context5.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '注销请求失败',
              icon: 'none'
            });
          case 5:
            _context5.p = 5;
            setDeletionLoading(false);
            return _context5.f(5);
          case 6:
            return _context5.a(2);
        }
      }, _callee5, null, [[2, 4, 5, 6]]);
    }));
    return function (_x3, _x4, _x5) {
      return _ref3.apply(this, arguments);
    };
  }(), [user === null || user === void 0 ? void 0 : user.id, trackEvent]);
  var handleDeletionCancel = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setShowDeletionModal(false);
  }, []);
  var handleCancelDeletion = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee7() {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context7) {
      while (1) switch (_context7.n) {
        case 0:
          if (user !== null && user !== void 0 && user.id) {
            _context7.n = 1;
            break;
          }
          return _context7.a(2);
        case 1:
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
            title: '取消注销',
            content: '确认取消账号注销申请？取消后您的账号将恢复正常使用。',
            success: function () {
              var _success3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee6(res) {
                var success;
                return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context6) {
                  while (1) switch (_context6.n) {
                    case 0:
                      if (res.confirm) {
                        _context6.n = 1;
                        break;
                      }
                      return _context6.a(2);
                    case 1:
                      _context6.n = 2;
                      return (0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.cancelAccountDeletion)(user.id);
                    case 2:
                      success = _context6.v;
                      if (success) {
                        _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                          title: '已取消注销',
                          icon: 'success'
                        });
                        setPrivacyStatus((0,_services_dataPrivacyService__WEBPACK_IMPORTED_MODULE_8__.getDataPrivacyStatus)());
                      } else {
                        _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                          title: '取消失败，请稍后重试',
                          icon: 'none'
                        });
                      }
                    case 3:
                      return _context6.a(2);
                  }
                }, _callee6);
              }));
              function success(_x6) {
                return _success3.apply(this, arguments);
              }
              return success;
            }()
          });
        case 2:
          return _context7.a(2);
      }
    }, _callee7);
  })), [user === null || user === void 0 ? void 0 : user.id]);
  var handleAgreement = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (type) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
      url: "/pagesUser/agreement/index?type=".concat(type)
    });
  }, []);
  var handleThemeChange = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (theme) {
    trackEvent('change_theme', {
      theme: theme
    });
    setTheme(theme);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
      title: '主题已切换',
      icon: 'success',
      duration: 1000
    });
  }, [setTheme, trackEvent]);
  var handleLogout = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmColor: '#FF6B35',
      success: function () {
        var _success4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().m(function _callee8(res) {
          return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_14__["default"])().w(function (_context8) {
            while (1) switch (_context8.n) {
              case 0:
                if (!res.confirm) {
                  _context8.n = 2;
                  break;
                }
                trackEvent('logout');
                _context8.n = 1;
                return logout();
              case 1:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().reLaunch({
                  url: '/pages/login/index'
                });
              case 2:
                return _context8.a(2);
            }
          }, _callee8);
        }));
        function success(_x7) {
          return _success4.apply(this, arguments);
        }
        return success;
      }()
    });
  }, [logout, trackEvent]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
    className: 'settings-page ' + themeClass,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__section-title",
        children: "\u8D26\u53F7\u7BA1\u7406"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u5FAE\u4FE1\u7ED1\u5B9A"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-value settings-page__item-value--bound",
          children: "\u5DF2\u7ED1\u5B9A"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        onClick: function onClick() {
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '手机绑定功能开发中',
            icon: 'none'
          });
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u624B\u673A\u53F7\u7ED1\u5B9A"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-value",
          children: "\u672A\u7ED1\u5B9A"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__section-title",
        children: "\u901A\u77E5\u8BBE\u7F6E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u6253\u5361\u63D0\u9192"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Switch, {
          checked: notification.checkinReminder,
          onChange: function onChange(e) {
            return handleToggleNotification('checkinReminder', e.detail.value);
          },
          color: "#4A90D9"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u75AB\u82D7\u9A71\u866B\u63D0\u9192"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Switch, {
          checked: notification.vaccineReminder,
          onChange: function onChange(e) {
            return handleToggleNotification('vaccineReminder', e.detail.value);
          },
          color: "#4A90D9"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u5065\u5EB7\u5F02\u5E38\u63D0\u9192"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Switch, {
          checked: notification.healthAlert,
          onChange: function onChange(e) {
            return handleToggleNotification('healthAlert', e.detail.value);
          },
          color: "#4A90D9"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__section-title",
        children: "\u4E3B\u9898\u5207\u6362"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__theme-group-title",
        children: "\u2600\uFE0F \u65E5\u95F4\u6A21\u5F0F"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__theme-grid",
        children: _stores_themeStore__WEBPACK_IMPORTED_MODULE_4__.THEME_LIST.filter(function (t) {
          return t.mode === 'light';
        }).map(function (theme) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
            className: "settings-page__theme-card ".concat(currentTheme === theme.key ? 'settings-page__theme-card--active' : ''),
            onClick: function onClick() {
              return handleThemeChange(theme.key);
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
              className: "settings-page__theme-preview",
              style: {
                background: "linear-gradient(135deg, ".concat(theme.primaryColor, ", ").concat(theme.primaryColor, "88)")
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                className: "settings-page__theme-preview-emoji",
                children: theme.emoji
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
              className: "settings-page__theme-info",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                className: "settings-page__theme-name",
                children: theme.name
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                className: "settings-page__theme-desc",
                children: theme.desc
              })]
            }), currentTheme === theme.key && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
              className: "settings-page__theme-check",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                children: "\u2713"
              })
            })]
          }, theme.key);
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__theme-group-title",
        children: "\uD83C\uDF19 \u591C\u95F4\u6A21\u5F0F"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__theme-grid",
        children: _stores_themeStore__WEBPACK_IMPORTED_MODULE_4__.THEME_LIST.filter(function (t) {
          return t.mode === 'dark';
        }).map(function (theme) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
            className: "settings-page__theme-card ".concat(currentTheme === theme.key ? 'settings-page__theme-card--active' : ''),
            onClick: function onClick() {
              return handleThemeChange(theme.key);
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
              className: "settings-page__theme-preview",
              style: {
                background: "linear-gradient(135deg, ".concat(theme.primaryColor, ", ").concat(theme.primaryColor, "88)")
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                className: "settings-page__theme-preview-emoji",
                children: theme.emoji
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
              className: "settings-page__theme-info",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                className: "settings-page__theme-name",
                children: theme.name
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                className: "settings-page__theme-desc",
                children: theme.desc
              })]
            }), currentTheme === theme.key && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
              className: "settings-page__theme-check",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
                children: "\u2713"
              })
            })]
          }, theme.key);
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__section-title",
        children: "\u6570\u636E\u7BA1\u7406"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        onClick: handleClearCache,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u6E05\u9664\u7F13\u5B58"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-arrow",
          children: "\u203A"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        onClick: handleExportData,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u5FEB\u901F\u5BFC\u51FA"
        }), !isMember && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-badge",
          children: "\u4F1A\u5458"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-arrow",
          children: "\u203A"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        onClick: handleExportAllData,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u5BFC\u51FA\u5168\u90E8\u6570\u636E"
        }), exportingData && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-loading",
          children: "\u5BFC\u51FA\u4E2D..."
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-arrow",
          children: "\u203A"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        onClick: handleDeleteCloudData,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label settings-page__item-label--danger",
          children: "\u5220\u9664\u4E91\u7AEF\u6570\u636E"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-arrow",
          children: "\u203A"
        })]
      })]
    }), (privacyStatus === null || privacyStatus === void 0 ? void 0 : privacyStatus.accountDeletionRequested) && deletionCountdown && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__deletion-notice",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "deletion-notice__title",
        children: "\u8D26\u53F7\u6CE8\u9500\u4E2D"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "deletion-notice__desc",
        children: ["\u60A8\u7684\u8D26\u53F7\u5C06\u4E8E", deletionCountdown, "\u88AB\u6C38\u4E45\u6CE8\u9500\u5220\u9664\u3002\u51B7\u9759\u671F\u5185\u53EF\u53D6\u6D88\u3002"]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "deletion-notice__action",
        onClick: handleCancelDeletion,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "deletion-notice__cancel",
          children: "\u53D6\u6D88\u6CE8\u9500"
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__section-title",
        children: "\u8D26\u53F7\u5B89\u5168"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        onClick: handleRequestDeletion,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label settings-page__item-label--danger",
          children: "\u6CE8\u9500\u8D26\u53F7"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-arrow",
          children: "\u203A"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__section-title",
        children: "\u5173\u4E8E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        onClick: function onClick() {
          return handleAgreement('user');
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u7528\u6237\u534F\u8BAE"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-arrow",
          children: "\u203A"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        onClick: function onClick() {
          return handleAgreement('privacy');
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u9690\u79C1\u653F\u7B56"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-arrow",
          children: "\u203A"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-label",
          children: "\u5F53\u524D\u7248\u672C"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
          className: "settings-page__item-value",
          children: _constants__WEBPACK_IMPORTED_MODULE_7__.APP_VERSION
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__logout",
      onClick: handleLogout,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.Text, {
        className: "settings-page__logout-text",
        children: "\u9000\u51FA\u767B\u5F55"
      })
    }), showDeletionModal && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
      className: "settings-page__modal",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_15__.View, {
        className: "settings-page__modal-content",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_AccountDeletionConfirm__WEBPACK_IMPORTED_MODULE_9__.AccountDeletionConfirm, {
          confirmCode: deletionConfirmCode,
          onConfirm: handleDeletionConfirm,
          onCancel: handleDeletionCancel,
          loading: deletionLoading
        })
      })
    })]
  });
}

/***/ }),

/***/ "./src/memory-body/store/miniProgramMemoryBodyStore.ts":
/*!*************************************************************!*\
  !*** ./src/memory-body/store/miniProgramMemoryBodyStore.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MiniProgramMemoryBodyStore": function() { return /* binding */ MiniProgramMemoryBodyStore; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_classCallCheck_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createClass_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createClass.js */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/storage */ "./src/utils/storage.ts");



var STORAGE_KEYS = {
  HEALTH_ENTRIES: 'health_entries',
  MEMORY_INDEX: 'memory_index',
  SCHEDULE_EVENTS: 'schedule_events'
};
var MiniProgramMemoryBodyStore = /*#__PURE__*/function () {
  function MiniProgramMemoryBodyStore() {
    (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_classCallCheck_js__WEBPACK_IMPORTED_MODULE_1__["default"])(this, MiniProgramMemoryBodyStore);
  }
  return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createClass_js__WEBPACK_IMPORTED_MODULE_2__["default"])(MiniProgramMemoryBodyStore, [{
    key: "clearHealthEntries",
    value: function clearHealthEntries() {
      (0,_utils_storage__WEBPACK_IMPORTED_MODULE_0__.setStorage)(STORAGE_KEYS.HEALTH_ENTRIES, []);
      (0,_utils_storage__WEBPACK_IMPORTED_MODULE_0__.setStorage)(STORAGE_KEYS.MEMORY_INDEX, {});
    }
  }, {
    key: "clearAll",
    value: function clearAll() {
      (0,_utils_storage__WEBPACK_IMPORTED_MODULE_0__.setStorage)(STORAGE_KEYS.HEALTH_ENTRIES, []);
      (0,_utils_storage__WEBPACK_IMPORTED_MODULE_0__.setStorage)(STORAGE_KEYS.MEMORY_INDEX, {});
      (0,_utils_storage__WEBPACK_IMPORTED_MODULE_0__.setStorage)(STORAGE_KEYS.SCHEDULE_EVENTS, []);
    }
  }]);
}();

/***/ }),

/***/ "./src/pagesUser/settings/index.tsx":
/*!******************************************!*\
  !*** ./src/pagesUser/settings/index.tsx ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesUser_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesUser/settings/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesUser/settings/index!./src/pagesUser/settings/index.tsx");


var config = {"navigationBarTitleText":"设置"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesUser_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesUser/settings/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesUser_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/services/dataPrivacyService.ts":
/*!********************************************!*\
  !*** ./src/services/dataPrivacyService.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "cancelAccountDeletion": function() { return /* binding */ cancelAccountDeletion; },
/* harmony export */   "deleteUserData": function() { return /* binding */ deleteUserData; },
/* harmony export */   "exportAllUserData": function() { return /* binding */ exportAllUserData; },
/* harmony export */   "generateDeletionConfirmCode": function() { return /* binding */ generateDeletionConfirmCode; },
/* harmony export */   "getDataPrivacyStatus": function() { return /* binding */ getDataPrivacyStatus; },
/* harmony export */   "requestAccountDeletion": function() { return /* binding */ requestAccountDeletion; }
/* harmony export */ });
/* unused harmony export verifyDeletionConfirmCode */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/storage */ "./src/utils/storage.ts");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");






var PRIVACY_STATUS_KEY = 'data_privacy_status';
var DELETION_CONFIRM_KEY = 'account_deletion_confirm_code';
var ALL_USER_TABLES = ['pet_profiles', 'pet_health_entries', 'pet_food_queries', 'pet_symptom_checks', 'pet_vaccinations', 'pet_health_trends', 'emotion_triggers', 'pet_grief_sessions', 'memory_events', 'usage_quotas', 'memberships', 'orders', 'payment_records', 'entitlements', 'devices', 'personas', 'sync_log'];
var EXPORT_TABLES = ['pet_profiles', 'pet_health_entries', 'pet_food_queries', 'pet_symptom_checks', 'pet_vaccinations', 'pet_health_trends', 'emotion_triggers', 'pet_grief_sessions', 'memory_events', 'memberships'];
function getPrivacyStatus() {
  return (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(PRIVACY_STATUS_KEY) || {
    lastExportAt: null,
    lastDeleteAt: null,
    accountDeletionRequested: false,
    accountDeletionScheduledAt: null,
    totalDataSize: 0,
    totalRecords: 0
  };
}
function savePrivacyStatus(status) {
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(PRIVACY_STATUS_KEY, status);
}
function exportAllUserData(_x) {
  return _exportAllUserData.apply(this, arguments);
}
function _exportAllUserData() {
  _exportAllUserData = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee4(userId) {
    var allData, totalRecords, exportEndpoints, _iterator, _step, table, fetcher, data, localData, localKeys, _i, _localKeys, key, value, jsonData, now, status, _t4, _t5, _t6;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          _context4.p = 0;
          allData = {};
          totalRecords = 0;
          exportEndpoints = {
            pet_profiles: function () {
              var _pet_profiles = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee() {
                var _t;
                return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context) {
                  while (1) switch (_context.p = _context.n) {
                    case 0:
                      _context.p = 0;
                      _context.n = 1;
                      return _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/api/pets');
                    case 1:
                      return _context.a(2, _context.v);
                    case 2:
                      _context.p = 2;
                      _t = _context.v;
                      return _context.a(2, []);
                  }
                }, _callee, null, [[0, 2]]);
              }));
              function pet_profiles() {
                return _pet_profiles.apply(this, arguments);
              }
              return pet_profiles;
            }(),
            memberships: function () {
              var _memberships = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee2() {
                var r, _t2;
                return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context2) {
                  while (1) switch (_context2.p = _context2.n) {
                    case 0:
                      _context2.p = 0;
                      _context2.n = 1;
                      return _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/api/membership/status');
                    case 1:
                      r = _context2.v;
                      return _context2.a(2, [r]);
                    case 2:
                      _context2.p = 2;
                      _t2 = _context2.v;
                      return _context2.a(2, []);
                  }
                }, _callee2, null, [[0, 2]]);
              }));
              function memberships() {
                return _memberships.apply(this, arguments);
              }
              return memberships;
            }(),
            pet_food_queries: function () {
              var _pet_food_queries = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee3() {
                var _t3;
                return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context3) {
                  while (1) switch (_context3.p = _context3.n) {
                    case 0:
                      _context3.p = 0;
                      _context3.n = 1;
                      return _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/api/food/history');
                    case 1:
                      return _context3.a(2, _context3.v);
                    case 2:
                      _context3.p = 2;
                      _t3 = _context3.v;
                      return _context3.a(2, []);
                  }
                }, _callee3, null, [[0, 2]]);
              }));
              function pet_food_queries() {
                return _pet_food_queries.apply(this, arguments);
              }
              return pet_food_queries;
            }()
          };
          _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_5__["default"])(EXPORT_TABLES);
          _context4.p = 1;
          _iterator.s();
        case 2:
          if ((_step = _iterator.n()).done) {
            _context4.n = 9;
            break;
          }
          table = _step.value;
          _context4.p = 3;
          fetcher = exportEndpoints[table];
          if (!fetcher) {
            _context4.n = 5;
            break;
          }
          _context4.n = 4;
          return fetcher();
        case 4:
          data = _context4.v;
          allData[table] = data;
          totalRecords += data.length;
          _context4.n = 6;
          break;
        case 5:
          allData[table] = [];
        case 6:
          _context4.n = 8;
          break;
        case 7:
          _context4.p = 7;
          _t4 = _context4.v;
          allData[table] = [];
        case 8:
          _context4.n = 2;
          break;
        case 9:
          _context4.n = 11;
          break;
        case 10:
          _context4.p = 10;
          _t5 = _context4.v;
          _iterator.e(_t5);
        case 11:
          _context4.p = 11;
          _iterator.f();
          return _context4.f(11);
        case 12:
          localData = {};
          localKeys = ['xhh_checkin_data', 'xhh_pet_data', 'xhh_notification_data', 'xhh_subscribe_status', 'xhh_settings'];
          for (_i = 0, _localKeys = localKeys; _i < _localKeys.length; _i++) {
            key = _localKeys[_i];
            try {
              value = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(key);
              if (value) localData[key] = value;
            } catch (_unused4) {
              // ignore
            }
          }
          allData['_local_storage'] = [localData];
          jsonData = JSON.stringify(allData, null, 2);
          now = new Date().toISOString();
          status = getPrivacyStatus();
          status.lastExportAt = now;
          status.totalRecords = totalRecords;
          status.totalDataSize = jsonData.length;
          savePrivacyStatus(status);
          return _context4.a(2, {
            success: true,
            data: jsonData,
            exportedAt: now,
            tables: EXPORT_TABLES,
            totalRecords: totalRecords
          });
        case 13:
          _context4.p = 13;
          _t6 = _context4.v;
          return _context4.a(2, {
            success: false,
            error: _t6 instanceof Error ? _t6.message : '导出失败',
            exportedAt: new Date().toISOString(),
            tables: [],
            totalRecords: 0
          });
      }
    }, _callee4, null, [[3, 7], [1, 10, 11, 12], [0, 13]]);
  }));
  return _exportAllUserData.apply(this, arguments);
}
function deleteUserData(_x2, _x3) {
  return _deleteUserData.apply(this, arguments);
}
function _deleteUserData() {
  _deleteUserData = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee5(userId, tableNames) {
    var tablesToDelete, deletedRecords, deletedTables, _iterator2, _step2, table, pets, _iterator3, _step3, pet, now, status, _t7, _t8, _t9, _t0;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context5) {
      while (1) switch (_context5.p = _context5.n) {
        case 0:
          _context5.p = 0;
          tablesToDelete = tableNames || ALL_USER_TABLES;
          deletedRecords = 0;
          deletedTables = [];
          _iterator2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_5__["default"])(tablesToDelete);
          _context5.p = 1;
          _iterator2.s();
        case 2:
          if ((_step2 = _iterator2.n()).done) {
            _context5.n = 16;
            break;
          }
          table = _step2.value;
          _context5.p = 3;
          if (!(table === 'pet_profiles')) {
            _context5.n = 13;
            break;
          }
          _context5.n = 4;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/api/pets');
        case 4:
          pets = _context5.v;
          _iterator3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_5__["default"])(pets);
          _context5.p = 5;
          _iterator3.s();
        case 6:
          if ((_step3 = _iterator3.n()).done) {
            _context5.n = 9;
            break;
          }
          pet = _step3.value;
          _context5.n = 7;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api["delete"]("/api/pets/".concat(pet.id));
        case 7:
          deletedRecords++;
        case 8:
          _context5.n = 6;
          break;
        case 9:
          _context5.n = 11;
          break;
        case 10:
          _context5.p = 10;
          _t7 = _context5.v;
          _iterator3.e(_t7);
        case 11:
          _context5.p = 11;
          _iterator3.f();
          return _context5.f(11);
        case 12:
          deletedTables.push(table);
        case 13:
          _context5.n = 15;
          break;
        case 14:
          _context5.p = 14;
          _t8 = _context5.v;
        case 15:
          _context5.n = 2;
          break;
        case 16:
          _context5.n = 18;
          break;
        case 17:
          _context5.p = 17;
          _t9 = _context5.v;
          _iterator2.e(_t9);
        case 18:
          _context5.p = 18;
          _iterator2.f();
          return _context5.f(18);
        case 19:
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().clearStorageSync();
          now = new Date().toISOString();
          status = getPrivacyStatus();
          status.lastDeleteAt = now;
          savePrivacyStatus(status);
          return _context5.a(2, {
            success: true,
            deletedAt: now,
            deletedTables: deletedTables,
            deletedRecords: deletedRecords
          });
        case 20:
          _context5.p = 20;
          _t0 = _context5.v;
          return _context5.a(2, {
            success: false,
            error: _t0 instanceof Error ? _t0.message : '删除失败',
            deletedAt: new Date().toISOString(),
            deletedTables: [],
            deletedRecords: 0
          });
      }
    }, _callee5, null, [[5, 10, 11, 12], [3, 14], [1, 17, 18, 19], [0, 20]]);
  }));
  return _deleteUserData.apply(this, arguments);
}
function generateDeletionConfirmCode() {
  var code = Math.random().toString(36).substring(2, 8).toUpperCase();
  (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.setStorage)(DELETION_CONFIRM_KEY, code);
  return code;
}
function verifyDeletionConfirmCode(inputCode) {
  var storedCode = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_1__.getStorage)(DELETION_CONFIRM_KEY);
  return storedCode === inputCode;
}
function requestAccountDeletion(_x4, _x5) {
  return _requestAccountDeletion.apply(this, arguments);
}
function _requestAccountDeletion() {
  _requestAccountDeletion = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee6(userId, request) {
    var scheduledAt, status, _t1;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          if (verifyDeletionConfirmCode(request.confirmCode)) {
            _context6.n = 1;
            break;
          }
          return _context6.a(2, {
            success: false,
            error: '确认码不正确',
            gracePeriodDays: 30
          });
        case 1:
          _context6.p = 1;
          _context6.n = 2;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.post('/api/auth/delete-account', {
            reason: request.reason,
            custom_reason: request.customReason
          });
        case 2:
          scheduledAt = new Date();
          scheduledAt.setDate(scheduledAt.getDate() + 30);
          status = getPrivacyStatus();
          status.accountDeletionRequested = true;
          status.accountDeletionScheduledAt = scheduledAt.toISOString();
          savePrivacyStatus(status);
          return _context6.a(2, {
            success: true,
            scheduledDeletionAt: scheduledAt.toISOString(),
            gracePeriodDays: 30
          });
        case 3:
          _context6.p = 3;
          _t1 = _context6.v;
          return _context6.a(2, {
            success: false,
            error: _t1 instanceof Error ? _t1.message : '注销请求失败',
            gracePeriodDays: 30
          });
      }
    }, _callee6, null, [[1, 3]]);
  }));
  return _requestAccountDeletion.apply(this, arguments);
}
function cancelAccountDeletion(_x6) {
  return _cancelAccountDeletion.apply(this, arguments);
}
function _cancelAccountDeletion() {
  _cancelAccountDeletion = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee7(userId) {
    var status, _t10;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context7) {
      while (1) switch (_context7.p = _context7.n) {
        case 0:
          _context7.p = 0;
          _context7.n = 1;
          return _api__WEBPACK_IMPORTED_MODULE_2__.api.post('/api/auth/cancel-deletion');
        case 1:
          status = getPrivacyStatus();
          status.accountDeletionRequested = false;
          status.accountDeletionScheduledAt = null;
          savePrivacyStatus(status);
          return _context7.a(2, true);
        case 2:
          _context7.p = 2;
          _t10 = _context7.v;
          return _context7.a(2, false);
      }
    }, _callee7, null, [[0, 2]]);
  }));
  return _cancelAccountDeletion.apply(this, arguments);
}
function getDataPrivacyStatus() {
  return getPrivacyStatus();
}

/***/ }),

/***/ "./src/stores/settingsStore.ts":
/*!*************************************!*\
  !*** ./src/stores/settingsStore.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useSettingsStore": function() { return /* binding */ useSettingsStore; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! zustand */ "./node_modules/zustand/esm/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _services_subscribeService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../services/subscribeService */ "./src/services/subscribeService.ts");
/* harmony import */ var _memory_body_store_miniProgramMemoryBodyStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../memory-body/store/miniProgramMemoryBodyStore */ "./src/memory-body/store/miniProgramMemoryBodyStore.ts");
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/storage */ "./src/utils/storage.ts");







var memoryStore = new _memory_body_store_miniProgramMemoryBodyStore__WEBPACK_IMPORTED_MODULE_2__.MiniProgramMemoryBodyStore();
var NOTIFICATION_KEY = 'xhh_notification_settings';
var PET_DATA_KEY = 'pet_data';
var CHECKIN_DATA_KEY = 'checkin_data';
var DEFAULT_NOTIFICATION = {
  checkinReminder: true,
  vaccineReminder: true,
  healthAlert: true
};
function loadNotificationFromStorage() {
  try {
    var _parsed$checkinRemind, _parsed$vaccineRemind, _parsed$healthAlert;
    var raw = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(NOTIFICATION_KEY);
    if (!raw) return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, DEFAULT_NOTIFICATION);
    var parsed = JSON.parse(raw);
    return {
      checkinReminder: (_parsed$checkinRemind = parsed.checkinReminder) !== null && _parsed$checkinRemind !== void 0 ? _parsed$checkinRemind : true,
      vaccineReminder: (_parsed$vaccineRemind = parsed.vaccineReminder) !== null && _parsed$vaccineRemind !== void 0 ? _parsed$vaccineRemind : true,
      healthAlert: (_parsed$healthAlert = parsed.healthAlert) !== null && _parsed$healthAlert !== void 0 ? _parsed$healthAlert : true
    };
  } catch (_unused) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, DEFAULT_NOTIFICATION);
  }
}
function saveNotificationToStorage(settings) {
  try {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(NOTIFICATION_KEY, JSON.stringify(settings));
  } catch (_unused2) {}
}
function clearStorageKey(key) {
  try {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(key);
  } catch (_unused3) {}
}
var useSettingsStore = (0,zustand__WEBPACK_IMPORTED_MODULE_5__["default"])(function (set, get) {
  return {
    notification: (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, DEFAULT_NOTIFICATION),
    isLoading: false,
    error: null,
    loadSettings: function loadSettings() {
      var settings = loadNotificationFromStorage();
      set({
        notification: settings
      });
    },
    updateNotification: function updateNotification(key, value) {
      var current = get().notification;
      var updated = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, current), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_6__["default"])({}, key, value));
      saveNotificationToStorage(updated);
      set({
        notification: updated
      });
    },
    clearCache: function clearCache() {
      set({
        isLoading: true
      });
      try {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().clearStorageSync();
        set({
          notification: (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, DEFAULT_NOTIFICATION),
          isLoading: false
        });
      } catch (_unused4) {
        set({
          isLoading: false,
          error: '清除缓存失败'
        });
      }
    },
    clearCheckinData: function clearCheckinData() {
      set({
        isLoading: true
      });
      try {
        clearStorageKey(CHECKIN_DATA_KEY);
        memoryStore.clearHealthEntries();
        set({
          isLoading: false
        });
      } catch (_unused5) {
        set({
          isLoading: false,
          error: '清除打卡记录失败'
        });
      }
    },
    clearPetData: function clearPetData() {
      set({
        isLoading: true
      });
      try {
        clearStorageKey(PET_DATA_KEY);
        set({
          isLoading: false
        });
      } catch (_unused6) {
        set({
          isLoading: false,
          error: '清除宠物数据失败'
        });
      }
    },
    clearAllData: function clearAllData() {
      set({
        isLoading: true
      });
      try {
        memoryStore.clearAll();
        clearStorageKey(PET_DATA_KEY);
        clearStorageKey(CHECKIN_DATA_KEY);
        (0,_services_subscribeService__WEBPACK_IMPORTED_MODULE_1__.clearSubscribeStatus)();
        set({
          notification: (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, DEFAULT_NOTIFICATION),
          isLoading: false
        });
      } catch (_unused7) {
        set({
          isLoading: false,
          error: '清除所有数据失败'
        });
      }
    },
    exportData: function exportData() {
      var checkinData = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_3__.getStorageArray)(CHECKIN_DATA_KEY);
      var petData = (0,_utils_storage__WEBPACK_IMPORTED_MODULE_3__.getStorageArray)(PET_DATA_KEY);
      var exportPayload = {
        exportDate: new Date().toISOString(),
        version: '2.0.0',
        data: {
          checkinData: checkinData,
          petData: petData,
          notification: get().notification
        }
      };
      return JSON.stringify(exportPayload, null, 2);
    }
  };
});

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["sub-common/6445d8bdf2172a6fd6abee9a9e2cae24","sub-common/a80d2ee33a59c94051f538ac359a531d","sub-common/bdd8c1063b7c478b3c5853b4e19995be","sub-common/1da61588ccaed5095fd84b784215335a","sub-common/0904437f0939f2a23241ccd89a80af6d","sub-common/a9a68db88e68e31a6990d19803c6390e","sub-common/b668272e463c24db98367b55ee1ede84","sub-common/914d491715a6edc71df0bca5b204e9c2","sub-common/8e9e3160e7a3b06d42389337fa063587","sub-common/0587757cd1ffb49610efd208fc1a021c","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesUser/settings/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map