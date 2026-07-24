"use strict";require("../../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/family/dashboard/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/family/dashboard/index!./src/pagesPet/family/dashboard/index.tsx":
/*!********************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/family/dashboard/index!./src/pagesPet/family/dashboard/index.tsx ***!
  \********************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ FamilyDashboard; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js */ "./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _stores_familyStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../stores/familyStore */ "./src/stores/familyStore.ts");
/* harmony import */ var _stores_petStore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../stores/petStore */ "./src/stores/petStore.ts");
/* harmony import */ var _stores_authStore__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../stores/authStore */ "./src/stores/authStore.ts");
/* harmony import */ var _services_checkinService__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../services/checkinService */ "./src/services/checkinService.ts");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var _services_familyPhotoService__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../services/familyPhotoService */ "./src/services/familyPhotoService.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");















var ROLE_ICONS = {
  '老大': '👑',
  '团宠': '💖',
  '活力之星': '⚡',
  '守护者': '🛡️',
  '乖宝宝': '🌟',
  '新成员': '🌱'
};
var ROLE_LIST = ['老大', '团宠', '活力之星', '守护者', '新成员', '乖宝宝'];
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}
function FamilyDashboard() {
  var _useFamilyStore = (0,_stores_familyStore__WEBPACK_IMPORTED_MODULE_2__.useFamilyStore)(),
    currentFamily = _useFamilyStore.currentFamily,
    members = _useFamilyStore.members,
    photos = _useFamilyStore.photos,
    photosLoading = _useFamilyStore.photosLoading,
    fetchFamilies = _useFamilyStore.fetchFamilies,
    createFamily = _useFamilyStore.createFamily,
    removeMember = _useFamilyStore.removeMember,
    updateMemberRole = _useFamilyStore.updateMemberRole,
    fetchPhotos = _useFamilyStore.fetchPhotos,
    savePhoto = _useFamilyStore.savePhoto,
    deletePhoto = _useFamilyStore.deletePhoto;
  var _usePetStore = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_3__.usePetStore)(),
    pets = _usePetStore.pets,
    fetchPets = _usePetStore.fetchPets;
  var user = (0,_stores_authStore__WEBPACK_IMPORTED_MODULE_4__.useAuthStore)(function (s) {
    return s.user;
  });
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState, 2),
    creating = _useState2[0],
    setCreating = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({}),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState3, 2),
    todayStatus = _useState4[0],
    setTodayStatus = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState5, 2),
    photoUrl = _useState6[0],
    setPhotoUrl = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState7, 2),
    photoGenerating = _useState8[0],
    setPhotoGenerating = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState9, 2),
    showPhotoPreview = _useState0[0],
    setShowPhotoPreview = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState10 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_9__["default"])(_useState1, 2),
    canvasVisible = _useState10[0],
    setCanvasVisible = _useState10[1];
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_6__.useThemeClass)();
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    fetchFamilies();
  }, []);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    if (currentFamily) {
      fetchPhotos();
    }
  }, [currentFamily]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    if (user) {
      fetchPets(user.id);
    }
  }, [user]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    if (currentFamily && members.length > 0 && user) {
      var loadToday = /*#__PURE__*/function () {
        var _ref = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee() {
          var today, status, _iterator, _step, member, checkin, _t, _t2;
          return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context) {
            while (1) switch (_context.p = _context.n) {
              case 0:
                today = getTodayStr();
                status = {};
                _iterator = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper_js__WEBPACK_IMPORTED_MODULE_12__["default"])(members);
                _context.p = 1;
                _iterator.s();
              case 2:
                if ((_step = _iterator.n()).done) {
                  _context.n = 7;
                  break;
                }
                member = _step.value;
                _context.p = 3;
                _context.n = 4;
                return (0,_services_checkinService__WEBPACK_IMPORTED_MODULE_5__.getTodayCheckin)(member.petId, user.id);
              case 4:
                checkin = _context.v;
                status[member.petId] = {
                  checked: !!checkin,
                  mood: checkin !== null && checkin !== void 0 && checkin.spiritLevel ? checkin.spiritLevel >= 4 ? 'happy' : checkin.spiritLevel >= 2 ? 'normal' : 'sad' : undefined
                };
                _context.n = 6;
                break;
              case 5:
                _context.p = 5;
                _t = _context.v;
                status[member.petId] = {
                  checked: false
                };
              case 6:
                _context.n = 2;
                break;
              case 7:
                _context.n = 9;
                break;
              case 8:
                _context.p = 8;
                _t2 = _context.v;
                _iterator.e(_t2);
              case 9:
                _context.p = 9;
                _iterator.f();
                return _context.f(9);
              case 10:
                setTodayStatus(status);
              case 11:
                return _context.a(2);
            }
          }, _callee, null, [[3, 5], [1, 8, 9, 10]]);
        }));
        return function loadToday() {
          return _ref.apply(this, arguments);
        };
      }();
      loadToday();
    }
  }, [currentFamily, members, user]);
  var familyPets = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    var petMap = new Map(pets.map(function (p) {
      return [p.id, p];
    }));
    return members.map(function (member) {
      return {
        member: member,
        pet: petMap.get(member.petId)
      };
    }).filter(function (item) {
      return item.pet;
    });
  }, [members, pets]);
  var unassignedPets = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    var assignedIds = new Set(members.map(function (m) {
      return m.petId;
    }));
    return pets.filter(function (p) {
      return !assignedIds.has(p.id);
    });
  }, [pets, members]);
  var handleCreateFamily = /*#__PURE__*/function () {
    var _ref2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee2() {
      var error, _t3;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (!creating) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            setCreating(true);
            _context2.p = 2;
            _context2.n = 3;
            return createFamily('星澜小筑');
          case 3:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '家庭创建成功',
              icon: 'success'
            });
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t3 = _context2.v;
            error = _t3;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: error.message || '创建失败',
              icon: 'none'
            });
          case 5:
            _context2.p = 5;
            setCreating(false);
            return _context2.f(5);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 4, 5, 6]]);
    }));
    return function handleCreateFamily() {
      return _ref2.apply(this, arguments);
    };
  }();
  var handleAddMember = /*#__PURE__*/function () {
    var _ref3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee3(pet) {
      var error, _t4;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (currentFamily) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            _context3.p = 1;
            _context3.n = 2;
            return _stores_familyStore__WEBPACK_IMPORTED_MODULE_2__.useFamilyStore.getState().addMember(pet.id);
          case 2:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: "\u5DF2\u9080\u8BF7".concat(pet.name, "\u52A0\u5165\u5BB6\u5EAD"),
              icon: 'success'
            });
            _context3.n = 4;
            break;
          case 3:
            _context3.p = 3;
            _t4 = _context3.v;
            error = _t4;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: error.message || '添加失败',
              icon: 'none'
            });
          case 4:
            return _context3.a(2);
        }
      }, _callee3, null, [[1, 3]]);
    }));
    return function handleAddMember(_x) {
      return _ref3.apply(this, arguments);
    };
  }();
  var handleRemoveMember = function handleRemoveMember(memberId, petName) {
    if (!currentFamily) return;
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
      title: '移出家庭',
      content: "\u786E\u8BA4\u5C06".concat(petName, "\u79FB\u51FA\u5BB6\u5EAD\u5417\uFF1F\u5BA0\u7269\u6570\u636E\u4F1A\u88AB\u4FDD\u7559\u3002"),
      confirmText: '确认移出',
      confirmColor: '#E0856B',
      cancelText: '取消',
      success: function () {
        var _success = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee4(res) {
          var _t5;
          return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context4) {
            while (1) switch (_context4.p = _context4.n) {
              case 0:
                if (!res.confirm) {
                  _context4.n = 4;
                  break;
                }
                _context4.p = 1;
                _context4.n = 2;
                return removeMember(memberId);
              case 2:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                  title: "".concat(petName, "\u5DF2\u79FB\u51FA\u5BB6\u5EAD"),
                  icon: 'success'
                });
                _context4.n = 4;
                break;
              case 3:
                _context4.p = 3;
                _t5 = _context4.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                  title: '操作失败',
                  icon: 'none'
                });
              case 4:
                return _context4.a(2);
            }
          }, _callee4, null, [[1, 3]]);
        }));
        function success(_x2) {
          return _success.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  var handleAssignRole = function handleAssignRole(memberId, petName) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showActionSheet({
      itemList: ROLE_LIST,
      success: function () {
        var _success2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee5(res) {
          var chosen, _t6;
          return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context5) {
            while (1) switch (_context5.p = _context5.n) {
              case 0:
                chosen = ROLE_LIST[res.tapIndex];
                _context5.p = 1;
                _context5.n = 2;
                return updateMemberRole(memberId, chosen);
              case 2:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                  title: "".concat(petName, "\u5DF2\u6210\u4E3A").concat(chosen),
                  icon: 'success'
                });
                _context5.n = 4;
                break;
              case 3:
                _context5.p = 3;
                _t6 = _context5.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                  title: '设置失败',
                  icon: 'none'
                });
              case 4:
                return _context5.a(2);
            }
          }, _callee5, null, [[1, 3]]);
        }));
        function success(_x3) {
          return _success2.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  var handleGeneratePhoto = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee6() {
    var roleMap, photoPets, photoData, result, error, _t7;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          if (!(photoGenerating || !currentFamily || familyPets.length === 0)) {
            _context6.n = 1;
            break;
          }
          return _context6.a(2);
        case 1:
          setPhotoGenerating(true);
          setCanvasVisible(true);
          setShowPhotoPreview(false);
          _context6.n = 2;
          return new Promise(function (resolve) {
            return setTimeout(resolve, 300);
          });
        case 2:
          _context6.p = 2;
          roleMap = {};
          members.forEach(function (m) {
            roleMap[m.petId] = m.role || '';
          });
          photoPets = familyPets.map(function (fp) {
            return fp.pet;
          }).filter(function (p) {
            return !!p;
          });
          photoData = (0,_services_familyPhotoService__WEBPACK_IMPORTED_MODULE_7__.buildFamilyPhotoData)(currentFamily.name, photoPets, roleMap);
          _context6.n = 3;
          return (0,_services_familyPhotoService__WEBPACK_IMPORTED_MODULE_7__.renderFamilyPhoto)(photoData, {
            canvasId: 'family-photo-canvas',
            pixelRatio: 2
          });
        case 3:
          result = _context6.v;
          setPhotoUrl(result.tempFilePath);
          setShowPhotoPreview(true);
          _context6.n = 5;
          break;
        case 4:
          _context6.p = 4;
          _t7 = _context6.v;
          error = _t7;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: error.message || '生成失败，请重试',
            icon: 'none'
          });
        case 5:
          _context6.p = 5;
          setPhotoGenerating(false);
          setCanvasVisible(false);
          return _context6.f(5);
        case 6:
          return _context6.a(2);
      }
    }, _callee6, null, [[2, 4, 5, 6]]);
  })), [photoGenerating, currentFamily, familyPets, members]);
  var handleSavePhoto = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee7() {
    var memberNames, error, _t8;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context7) {
      while (1) switch (_context7.p = _context7.n) {
        case 0:
          if (photoUrl) {
            _context7.n = 1;
            break;
          }
          return _context7.a(2);
        case 1:
          _context7.p = 1;
          _context7.n = 2;
          return (0,_services_familyPhotoService__WEBPACK_IMPORTED_MODULE_7__.saveFamilyPhoto)(photoUrl);
        case 2:
          memberNames = familyPets.map(function (fp) {
            var _fp$pet;
            return (_fp$pet = fp.pet) === null || _fp$pet === void 0 ? void 0 : _fp$pet.name;
          }).filter(function (n) {
            return !!n;
          });
          _context7.n = 3;
          return savePhoto(photoUrl, familyPets.length, memberNames);
        case 3:
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '已保存到相册',
            icon: 'success'
          });
          _context7.n = 5;
          break;
        case 4:
          _context7.p = 4;
          _t8 = _context7.v;
          error = _t8;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: error.message || '保存失败',
            icon: 'none'
          });
        case 5:
          return _context7.a(2);
      }
    }, _callee7, null, [[1, 4]]);
  })), [photoUrl, familyPets, savePhoto]);
  var handleSharePhoto = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().m(function _callee8() {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_11__["default"])().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          if (photoUrl) {
            _context8.n = 1;
            break;
          }
          return _context8.a(2);
        case 1:
          _context8.n = 2;
          return (0,_services_familyPhotoService__WEBPACK_IMPORTED_MODULE_7__.shareFamilyPhoto)(photoUrl);
        case 2:
          return _context8.a(2);
      }
    }, _callee8);
  })), [photoUrl]);
  if (!currentFamily) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "family-dashboard ".concat(themeClass),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-empty",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-empty-icon",
          children: "\uD83C\uDFE1"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-empty-text",
          children: "\u8FD8\u6CA1\u6709\u521B\u5EFA\u5BB6\u5EAD"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-empty-btn",
          style: {
            opacity: creating ? 0.6 : 1
          },
          onClick: handleCreateFamily,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            children: creating ? '创建中...' : '创建家庭'
          })
        })]
      })
    });
  }
  var checkedCount = Object.values(todayStatus).filter(function (s) {
    return s.checked;
  }).length;
  var totalMembers = members.length;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
    className: "family-dashboard ".concat(themeClass),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "fd-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
        className: "fd-title",
        children: currentFamily.name
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
        className: "fd-subtitle",
        children: [totalMembers, "\u4F4D\u5BB6\u4EBA"]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "fd-section",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-health-board",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-health-board-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-health-board-icon",
            children: "\uD83C\uDFE5"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-health-board-title",
            children: "\u4ECA\u65E5\u5065\u5EB7\u770B\u677F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-health-board-date",
            children: getTodayStr()
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-health-summary",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-health-stat",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-health-stat-num",
              children: checkedCount
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-health-stat-label",
              children: "\u5DF2\u6253\u5361"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-health-divider"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-health-stat",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-health-stat-num",
              children: totalMembers - checkedCount
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-health-stat-label",
              children: "\u672A\u6253\u5361"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-health-divider"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-health-stat",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-health-stat-num",
              children: [Math.round(checkedCount / Math.max(totalMembers, 1) * 100), "%"]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-health-stat-label",
              children: "\u6253\u5361\u7387"
            })]
          })]
        }), familyPets.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-health-members",
          children: familyPets.map(function (_ref7) {
            var member = _ref7.member,
              pet = _ref7.pet;
            if (!pet) return null;
            var status = todayStatus[member.petId];
            var isChecked = status === null || status === void 0 ? void 0 : status.checked;
            var emoji = pet.species === 'cat' ? '🐱' : '🐕';
            var roleIcon = member.role ? ROLE_ICONS[member.role] || '' : '';
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-health-member ".concat(isChecked ? 'fd-health-member--checked' : ''),
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                className: "fd-health-member-avatar ".concat(isChecked ? 'fd-health-member-avatar--checked' : ''),
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  children: emoji
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-health-member-name",
                children: pet.name
              }), isChecked ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                className: "fd-health-checked-badge",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  className: "fd-health-checked-text",
                  children: "\u2705 \u5DF2\u6253\u5361"
                })
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                className: "fd-health-pending-badge",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  className: "fd-health-pending-text",
                  children: "\u23F3 \u5F85\u6253\u5361"
                })
              }), roleIcon && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-health-member-role",
                children: [roleIcon, " ", member.role]
              })]
            }, member.petId);
          })
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "fd-section",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-photo-section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-photo-header",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-photo-header-left",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-photo-header-icon",
              children: "\uD83D\uDCF8"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-photo-header-title",
              children: "\u5168\u5BB6\u798F"
            })]
          })
        }), familyPets.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-photo-empty",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-photo-empty-icon",
            children: "\uD83D\uDCF7"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-photo-empty-text",
            children: ["\u9080\u8BF7\u6BDB\u5B69\u5B50\u52A0\u5165\u5BB6\u5EAD\uFF0C", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("br", {}), "\u8BB0\u5F55\u6E29\u6696\u7684\u5168\u5BB6\u798F"]
          })]
        }) : showPhotoPreview && photoUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-photo-preview",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-photo-preview-img-wrap",
            onClick: function onClick() {
              return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().previewImage({
                urls: [photoUrl],
                current: photoUrl
              });
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-photo-preview-img",
              style: {
                backgroundImage: "url(".concat(photoUrl, ")")
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-photo-preview-tap",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                children: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE"
              })
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-photo-preview-actions",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-photo-btn fd-photo-btn--outline",
              onClick: handleSavePhoto,
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-photo-btn-text",
                children: "\uD83D\uDCBE \u4FDD\u5B58\u5230\u76F8\u518C"
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-photo-btn fd-photo-btn--primary",
              onClick: handleSharePhoto,
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-photo-btn-text",
                children: "\uD83D\uDCE4 \u5206\u4EAB\u7ED9\u5BB6\u4EBA"
              })
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-photo-regenerate",
            onClick: handleGeneratePhoto,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-photo-regenerate-text",
              children: "\uD83D\uDD04 \u91CD\u65B0\u751F\u6210"
            })
          })]
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-photo-generate",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-photo-generate-preview",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-photo-generate-frame",
              children: [familyPets.slice(0, 6).map(function (_ref8, idx) {
                var pet = _ref8.pet;
                if (!pet) return null;
                var angle = idx / Math.min(familyPets.length, 6) * 360;
                var radius = 60;
                var x = 50 + Math.cos((angle - 90) * Math.PI / 180) * radius;
                var y = 50 + Math.sin((angle - 90) * Math.PI / 180) * radius;
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                  className: "fd-photo-generate-avatar",
                  style: {
                    left: "".concat(x, "%"),
                    top: "".concat(y, "%")
                  },
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                    children: pet.species === 'cat' ? '🐱' : '🐕'
                  })
                }, pet.id);
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                className: "fd-photo-generate-center",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  children: "\uD83C\uDFE1"
                })
              })]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-photo-generate-info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-photo-generate-label",
              children: [familyPets.length, "\u4F4D\u6BDB\u5B69\u5B50"]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-photo-generate-desc",
              children: "\u5C06\u5BB6\u5EAD\u6210\u5458\u7684\u5934\u50CF\u5408\u6210\u4E3A\u4E00\u5F20\u7CBE\u7F8E\u7684\u5168\u5BB6\u798F"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-photo-generate-btn ".concat(photoGenerating ? 'fd-photo-generate-btn--loading' : ''),
            onClick: handleGeneratePhoto,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-photo-generate-btn-text",
              children: photoGenerating ? '⏳ 生成中...' : '✨ 生成全家福'
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Canvas, {
          className: "fd-photo-canvas",
          canvasId: "family-photo-canvas",
          id: "family-photo-canvas",
          style: {
            display: canvasVisible ? 'block' : 'none',
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '750px',
            height: '1000px'
          },
          type: "2d"
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "fd-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-section-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-section-title",
          children: "\uD83D\uDC65 \u5BB6\u5EAD\u6210\u5458"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-section-count",
          children: [totalMembers, "\u4F4D"]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-members-grid",
        children: familyPets.map(function (_ref9, idx) {
          var member = _ref9.member,
            pet = _ref9.pet;
          if (!pet) return null;
          var roleIcon = member.role ? ROLE_ICONS[member.role] || '' : '';
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-member-card",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-member-top",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                className: "fd-member-avatar-wrap",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  children: pet.species === 'cat' ? '🐱' : '🐕'
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                className: "fd-member-role-btn",
                onClick: function onClick() {
                  return handleAssignRole(member.id, pet.name);
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  className: "fd-member-role-btn-text",
                  children: "\u89D2\u8272"
                })
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-member-name",
              children: pet.name
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-member-role",
              children: roleIcon ? "".concat(roleIcon, " ").concat(member.role || '乖宝宝') : member.role || '乖宝宝'
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
              className: "fd-member-breed",
              children: pet.breed || '未知品种'
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-member-remove",
              onClick: function onClick() {
                return handleRemoveMember(member.id, pet.name);
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-member-remove-text",
                children: "\u79FB\u51FA\u5BB6\u5EAD"
              })
            })]
          }, member.petId);
        })
      })]
    }), unassignedPets.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "fd-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-section-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-section-title",
          children: "\uD83D\uDCCB \u53EF\u9080\u8BF7\u7684\u6BDB\u5B69\u5B50"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-section-count",
          children: [unassignedPets.length, "\u4F4D"]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-invite-list",
        children: unassignedPets.map(function (pet) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-invite-item",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-invite-avatar",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                children: pet.species === 'cat' ? '🐱' : '🐕'
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-invite-info",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-invite-name",
                children: pet.name
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-invite-breed",
                children: pet.breed || '未知品种'
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-invite-btn",
              onClick: function onClick() {
                return handleAddMember(pet);
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-invite-btn-text",
                children: "+ \u9080\u8BF7"
              })
            })]
          }, pet.id);
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "fd-section",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-action-card",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
              url: '/pagesPet/family/lineage/index'
            });
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-action-icon",
            children: "\uD83E\uDDEC"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-action-label",
            children: "\u5BB6\u65CF\u56FE\u8C31"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
          className: "fd-action-card",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
              url: '/pagesPet/family/calendar/index'
            });
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-action-icon",
            children: "\uD83D\uDCC5"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
            className: "fd-action-label",
            children: "\u5BB6\u5EAD\u65E5\u5386"
          })]
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "fd-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-section-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-section-title",
          children: "\uD83D\uDCF8 \u5168\u5BB6\u798F\u76F8\u518C"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-section-count",
          children: [photos.length, "\u5F20"]
        })]
      }), photosLoading ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-album-loading",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          children: "\u52A0\u8F7D\u4E2D..."
        })
      }) : photos.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-album-empty",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-album-empty-icon",
          children: "\uD83D\uDDBC\uFE0F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
          className: "fd-album-empty-text",
          children: ["\u8FD8\u6CA1\u6709\u4FDD\u5B58\u8FC7\u5168\u5BB6\u798F", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("br", {}), "\u751F\u6210\u540E\u70B9\u51FB\"\u4FDD\u5B58\u5230\u76F8\u518C\"\u5373\u53EF\u6536\u85CF"]
        })]
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
        className: "fd-album-grid",
        children: photos.map(function (photo) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
            className: "fd-album-item",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-album-item-img",
              onClick: function onClick() {
                return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().previewImage({
                  urls: [photo.photoUrl],
                  current: photo.photoUrl
                });
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                className: "fd-album-item-placeholder",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  className: "fd-album-item-emoji",
                  children: "\uD83C\uDFE1"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  className: "fd-album-item-count",
                  children: [photo.memberCount, "\u4F4D\u6210\u5458"]
                })]
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
              className: "fd-album-item-info",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                className: "fd-album-item-date",
                children: photo.createdAt.slice(0, 10)
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
                className: "fd-album-item-del",
                onClick: function onClick() {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
                    title: '删除照片',
                    content: '确认删除这张全家福记录吗？',
                    confirmColor: '#E0856B',
                    success: function success(res) {
                      if (res.confirm) deletePhoto(photo.id);
                    }
                  });
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.Text, {
                  className: "fd-album-item-del-text",
                  children: "\u5220\u9664"
                })
              })]
            })]
          }, photo.id);
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_13__.View, {
      className: "fd-bottom-safe"
    })]
  });
}

/***/ }),

/***/ "./src/pagesPet/family/dashboard/index.tsx":
/*!*************************************************!*\
  !*** ./src/pagesPet/family/dashboard/index.tsx ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_family_dashboard_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/family/dashboard/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/family/dashboard/index!./src/pagesPet/family/dashboard/index.tsx");


var config = {"navigationBarTitleText":"我的家庭"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_family_dashboard_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/family/dashboard/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_family_dashboard_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/services/familyPhotoService.ts":
/*!********************************************!*\
  !*** ./src/services/familyPhotoService.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "buildFamilyPhotoData": function() { return /* binding */ buildFamilyPhotoData; },
/* harmony export */   "renderFamilyPhoto": function() { return /* binding */ renderFamilyPhoto; },
/* harmony export */   "saveFamilyPhoto": function() { return /* binding */ saveFamilyPhoto; },
/* harmony export */   "shareFamilyPhoto": function() { return /* binding */ shareFamilyPhoto; }
/* harmony export */ });
/* unused harmony export drawFamilyPhoto */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);



var CANVAS_WIDTH = 750;
var CANVAS_HEIGHT = 1000;
var BRAND_COLORS = {
  primary: '#FF8C42',
  gold: '#D4A574',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  background: '#FFF8F0',
  cardBg: '#FFFFFF',
  border: '#F0E0D0',
  accent: '#E8A87C'
};
function buildFamilyPhotoData(familyName, pets, roles) {
  return {
    familyName: familyName,
    members: pets.map(function (pet) {
      return {
        name: pet.name,
        emoji: pet.species === 'cat' ? '🐱' : '🐕',
        role: roles[pet.id] || ''
      };
    }),
    date: new Date().toISOString().slice(0, 10)
  };
}
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
function drawGradientBg(ctx) {
  var gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#FFF8F0');
  gradient.addColorStop(0.5, '#FFFDF8');
  gradient.addColorStop(1, '#FFF5EC');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
function drawDecorativeCircles(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = BRAND_COLORS.gold;
  ctx.beginPath();
  ctx.arc(80, 100, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(670, 800, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(100, 700, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = BRAND_COLORS.primary;
  ctx.beginPath();
  ctx.arc(600, 150, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawHeader(ctx, data) {
  ctx.save();
  ctx.fillStyle = BRAND_COLORS.text;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏡 全家福', CANVAS_WIDTH / 2, 100);
  ctx.fillStyle = BRAND_COLORS.accent;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(data.familyName, CANVAS_WIDTH / 2, 145);
  ctx.fillStyle = BRAND_COLORS.textLight;
  ctx.font = '22px sans-serif';
  ctx.fillText(data.date, CANVAS_WIDTH / 2, 178);
  ctx.restore();
  return 210;
}
function drawFamilyFrame(ctx, data) {
  var memberCount = data.members.length;
  if (memberCount === 0) return 0;
  var startY = 230;
  var framePadding = 60;
  var frameTop = startY;
  var frameLeft = framePadding;
  var columns = 1;
  var avatarSize = 120;
  if (memberCount === 2) {
    columns = 2;
    avatarSize = 130;
  } else if (memberCount === 3) {
    columns = 3;
    avatarSize = 110;
  } else if (memberCount === 4) {
    columns = 2;
    avatarSize = 110;
  } else if (memberCount <= 6) {
    columns = 3;
    avatarSize = 90;
  } else {
    columns = 4;
    avatarSize = 80;
  }
  var rows = Math.ceil(memberCount / columns);
  var cellW = (CANVAS_WIDTH - framePadding * 2) / columns;
  var contentHeight = rows * (avatarSize + 80);
  var frameHeight = contentHeight + 80;
  var frameWidth = CANVAS_WIDTH - framePadding * 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = BRAND_COLORS.cardBg;
  drawRoundedRect(ctx, frameLeft, frameTop, frameWidth, frameHeight, 24);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = BRAND_COLORS.border;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, frameLeft, frameTop, frameWidth, frameHeight, 24);
  ctx.stroke();
  data.members.forEach(function (member, index) {
    var col = index % columns;
    var row = Math.floor(index / columns);
    var cx = frameLeft + cellW * col + cellW / 2;
    var cy = frameTop + 50 + row * (avatarSize + 70);
    var circleRadius = avatarSize / 2;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, circleRadius + 6, 0, Math.PI * 2);
    ctx.fillStyle = BRAND_COLORS.border;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - 8, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF5EC';
    ctx.fill();
    ctx.strokeStyle = BRAND_COLORS.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = "".concat(Math.round(avatarSize * 0.5), "px sans-serif");
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.emoji, cx, cy - 8);
    ctx.fillStyle = BRAND_COLORS.text;
    ctx.font = 'bold 24px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(member.name, cx, cy + circleRadius + 6);
    if (member.role) {
      ctx.fillStyle = BRAND_COLORS.gold;
      ctx.font = '20px sans-serif';
      ctx.fillText(member.role, cx, cy + circleRadius + 34);
    }
  });
  ctx.restore();
  return frameTop + frameHeight + 30;
}
function drawFooter(ctx) {
  ctx.save();
  var footerY = CANVAS_HEIGHT - 100;
  ctx.strokeStyle = BRAND_COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, footerY);
  ctx.lineTo(CANVAS_WIDTH - 80, footerY);
  ctx.stroke();
  ctx.fillStyle = BRAND_COLORS.textLight;
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('星寰海 · 记录毛孩子的温暖时光', CANVAS_WIDTH / 2, footerY + 40);
  ctx.fillText('长按保存 · 分享给家人', CANVAS_WIDTH / 2, footerY + 70);
  ctx.restore();
}
function drawFamilyPhoto(ctx, data) {
  drawGradientBg(ctx);
  drawDecorativeCircles(ctx);
  drawHeader(ctx, data);
  drawFamilyFrame(ctx, data);
  drawFooter(ctx);
}
function renderFamilyPhoto(_x, _x2) {
  return _renderFamilyPhoto.apply(this, arguments);
}
function _renderFamilyPhoto() {
  _renderFamilyPhoto = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee(data, options) {
    var pixelRatio, canvasWidth, canvasHeight;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          pixelRatio = options.pixelRatio || 2;
          canvasWidth = options.width || CANVAS_WIDTH;
          canvasHeight = options.height || CANVAS_HEIGHT;
          return _context.a(2, new Promise(function (resolve, reject) {
            var query = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().createSelectorQuery();
            query.select("#".concat(options.canvasId)).fields({
              node: true,
              size: true
            }).exec(function (res) {
              if (!res || !res[0] || !res[0].node) {
                reject(new Error('Canvas context not found'));
                return;
              }
              var canvas = res[0].node;
              var ctx = canvas.getContext('2d');
              var dpr = pixelRatio;
              canvas.width = canvasWidth * dpr;
              canvas.height = canvasHeight * dpr;
              ctx.scale(dpr, dpr);
              drawFamilyPhoto(ctx, data);
              setTimeout(function () {
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().canvasToTempFilePath({
                  canvas: canvas,
                  width: canvasWidth,
                  height: canvasHeight,
                  destWidth: canvasWidth * dpr,
                  destHeight: canvasHeight * dpr,
                  fileType: 'png',
                  success: function success(res) {
                    resolve({
                      tempFilePath: res.tempFilePath,
                      width: canvasWidth,
                      height: canvasHeight
                    });
                  },
                  fail: function fail(err) {
                    reject(new Error("Canvas export failed: ".concat(err.errMsg)));
                  }
                });
              }, 300);
            });
          }));
      }
    }, _callee);
  }));
  return _renderFamilyPhoto.apply(this, arguments);
}
function saveFamilyPhoto(_x3) {
  return _saveFamilyPhoto.apply(this, arguments);
}
function _saveFamilyPhoto() {
  _saveFamilyPhoto = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee2(tempFilePath) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          return _context2.a(2, new Promise(function (resolve, reject) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().saveImageToPhotosAlbum({
              filePath: tempFilePath,
              success: function success() {
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
                  title: '全家福已保存到相册',
                  icon: 'success'
                });
                resolve();
              },
              fail: function fail(err) {
                reject(new Error("Save failed: ".concat(err.errMsg)));
              }
            });
          }));
      }
    }, _callee2);
  }));
  return _saveFamilyPhoto.apply(this, arguments);
}
function shareFamilyPhoto(_x4) {
  return _shareFamilyPhoto.apply(this, arguments);
}
function _shareFamilyPhoto() {
  _shareFamilyPhoto = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee3(tempFilePath) {
    var _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          _context3.p = 0;
          _context3.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showShareImageMenu({
            path: tempFilePath
          });
        case 1:
          _context3.n = 3;
          break;
        case 2:
          _context3.p = 2;
          _t = _context3.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().previewImage({
            urls: [tempFilePath],
            current: tempFilePath
          });
        case 3:
          return _context3.a(2);
      }
    }, _callee3, null, [[0, 2]]);
  }));
  return _shareFamilyPhoto.apply(this, arguments);
}

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/family/dashboard/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map