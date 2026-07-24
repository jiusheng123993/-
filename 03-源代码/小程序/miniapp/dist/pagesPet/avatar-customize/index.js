"use strict";require("../sub-vendors.js");require("../sub-common/6445d8bdf2172a6fd6abee9a9e2cae24.js");require("../sub-common/a80d2ee33a59c94051f538ac359a531d.js");require("../sub-common/bdd8c1063b7c478b3c5853b4e19995be.js");require("../sub-common/8e9e3160e7a3b06d42389337fa063587.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/avatar-customize/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/avatar-customize/index!./src/pagesPet/avatar-customize/index.tsx":
/*!********************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/avatar-customize/index!./src/pagesPet/avatar-customize/index.tsx ***!
  \********************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ AvatarCustomizePage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var _hooks_useAvatar2DTask__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../hooks/useAvatar2DTask */ "./src/hooks/useAvatar2DTask.ts");
/* harmony import */ var _hooks_useAvatar3DTask__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../hooks/useAvatar3DTask */ "./src/hooks/useAvatar3DTask.ts");
/* harmony import */ var _utils_navigation__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils/navigation */ "./src/utils/navigation.ts");
/* harmony import */ var _components_PetAvatar__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../components/PetAvatar */ "./src/components/PetAvatar.tsx");
/* harmony import */ var _components_PetAvatar_PhotoUploader__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../components/PetAvatar/PhotoUploader */ "./src/components/PetAvatar/PhotoUploader.tsx");
/* harmony import */ var _components_PetAvatar_ImageGallery__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../components/PetAvatar/ImageGallery */ "./src/components/PetAvatar/ImageGallery.tsx");
/* harmony import */ var _components_PetAvatar_Model3DViewer__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../components/PetAvatar/Model3DViewer */ "./src/components/PetAvatar/Model3DViewer.tsx");
/* harmony import */ var _components_PetAvatar_GenerationProgress__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../components/PetAvatar/GenerationProgress */ "./src/components/PetAvatar/GenerationProgress.tsx");
/* harmony import */ var _services_avatarService__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../services/avatarService */ "./src/services/avatarService.ts");
/* harmony import */ var _stores_petStore__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../stores/petStore */ "./src/stores/petStore.ts");
/* harmony import */ var _hooks_useMembership__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../hooks/useMembership */ "./src/hooks/useMembership.ts");
/* harmony import */ var _hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../hooks/useAnalytics */ "./src/hooks/useAnalytics.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");





















var STYLE_OPTIONS = [{
  value: 'cartoon',
  label: '卡通风格',
  desc: '可爱萌趣'
}, {
  value: 'realistic',
  label: '写实风格',
  desc: '真实细腻'
}];
var BASE_COLORS = [{
  value: '#FFD93D',
  label: '暖阳金'
}, {
  value: '#FF8C42',
  label: '活力橙'
}, {
  value: '#6BCB77',
  label: '清新绿'
}, {
  value: '#4D96FF',
  label: '天空蓝'
}, {
  value: '#FF6B6B',
  label: '甜蜜粉'
}, {
  value: '#9B8EC4',
  label: '梦幻紫'
}, {
  value: '#FFF8E7',
  label: '奶白色'
}, {
  value: '#2C3E50',
  label: '酷黑色'
}];
function AvatarCustomizePage() {
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_2__.useThemeClass)();
  var _usePetStore = (0,_stores_petStore__WEBPACK_IMPORTED_MODULE_12__.usePetStore)(),
    currentPet = _usePetStore.currentPet;
  var _useMembership = (0,_hooks_useMembership__WEBPACK_IMPORTED_MODULE_13__.useMembership)(),
    isMember = _useMembership.isMember;
  var _useAnalytics = (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_14__.useAnalytics)(),
    trackPageView = _useAnalytics.trackPageView,
    trackEvent = _useAnalytics.trackEvent;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('text'),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState, 2),
    activeTab = _useState2[0],
    setActiveTab = _useState2[1];
  var species = (currentPet === null || currentPet === void 0 ? void 0 : currentPet.species) || 'dog';
  var petName = (currentPet === null || currentPet === void 0 ? void 0 : currentPet.name) || '毛孩子';
  var petId = (currentPet === null || currentPet === void 0 ? void 0 : currentPet.id) || '';
  var task2D = (0,_hooks_useAvatar2DTask__WEBPACK_IMPORTED_MODULE_3__.useAvatar2DTask)(petId);
  var task3D = (0,_hooks_useAvatar3DTask__WEBPACK_IMPORTED_MODULE_4__.useAvatar3DTask)(petId);
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('cartoon'),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState3, 2),
    selectedStyle = _useState4[0],
    setSelectedStyle = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('#FFD93D'),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState5, 2),
    selectedColor = _useState6[0],
    setSelectedColor = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState7, 2),
    isGenerating = _useState8[0],
    setIsGenerating = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState9, 2),
    generatedUrl = _useState0[0],
    setGeneratedUrl = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)((0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.getGenerationCount)()),
    _useState10 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState1, 2),
    genCount = _useState10[0],
    setGenCount = _useState10[1];
  var _useState11 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState12 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState11, 2),
    photoUrl = _useState12[0],
    setPhotoUrl = _useState12[1];
  var _useState13 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState14 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState13, 2),
    uploadedPhotoUrl = _useState14[0],
    setUploadedPhotoUrl = _useState14[1];
  var _useState15 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState16 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState15, 2),
    isUploading = _useState16[0],
    setIsUploading = _useState16[1];
  var _useState17 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('cartoon'),
    _useState18 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState17, 2),
    photoStyle = _useState18[0],
    setPhotoStyle = _useState18[1];
  var _useState19 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState20 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_useState19, 2),
    serverQuota = _useState20[0],
    setServerQuota = _useState20[1];
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    trackPageView('avatar_customize');
  }, [trackPageView]);
  var expressionContext = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return {
      todayEntry: null,
      hasAnomaly: false,
      anomalyCount: 0,
      riskLevel: null,
      streakDays: 0,
      isBirthday: false,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: false
    };
  }, []);
  var canGenerate = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    if (serverQuota) {
      return serverQuota.isMember || serverQuota.generation2D.used < serverQuota.generation2D.limit;
    }
    return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.canGenerateAvatar)(isMember);
  }, [serverQuota, isMember, genCount]);
  var canGenPhoto = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    if (serverQuota) {
      return serverQuota.isMember || serverQuota.generation2D.used < serverQuota.generation2D.limit;
    }
    return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.canGeneratePhoto)(isMember);
  }, [serverQuota, isMember]);
  var canGen3D = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    if (serverQuota) {
      return serverQuota.isMember && serverQuota.generation3D.used < serverQuota.generation3D.limit;
    }
    return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.canGenerate3D)(isMember);
  }, [serverQuota, isMember]);
  var textQuotaText = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    if (serverQuota) {
      if (serverQuota.isMember) return '会员无限生成';
      var remaining = Math.max(0, serverQuota.generation2D.limit - serverQuota.generation2D.used);
      return "\u5269\u4F59\u6B21\u6570\uFF1A".concat(remaining, "/").concat(serverQuota.generation2D.limit);
    }
    return isMember ? '会员无限生成' : "\u5269\u4F59\u6B21\u6570\uFF1A".concat(Math.max(0, 1 - genCount), "/1");
  }, [serverQuota, isMember, genCount]);
  var photoQuotaText = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    if (serverQuota) {
      if (serverQuota.isMember) return '会员无限生成';
      var remaining = Math.max(0, serverQuota.generation2D.limit - serverQuota.generation2D.used);
      return "\u5269\u4F59\u7167\u7247\u751F\u6210\u6B21\u6570\uFF1A".concat(remaining, "/").concat(serverQuota.generation2D.limit);
    }
    return isMember ? '会员无限生成' : "\u5269\u4F59\u7167\u7247\u751F\u6210\u6B21\u6570\uFF1A".concat(Math.max(0, 1 - (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.getPhotoGenerationCount)()), "/1");
  }, [serverQuota, isMember]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    if (!petId) return;
    var cancelled = false;
    var loadExisting = /*#__PURE__*/function () {
      var _ref = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_17__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().m(function _callee() {
        var _yield$Promise$all, _yield$Promise$all2, pack2D, result3D, quota, _t;
        return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              _context.p = 0;
              _context.n = 1;
              return Promise.all([(0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.getAvatar2DImages)(petId), (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.getAvatar3DModel)(petId), (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.getAvatarQuota)()]);
            case 1:
              _yield$Promise$all = _context.v;
              _yield$Promise$all2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_16__["default"])(_yield$Promise$all, 3);
              pack2D = _yield$Promise$all2[0];
              result3D = _yield$Promise$all2[1];
              quota = _yield$Promise$all2[2];
              if (!cancelled) {
                _context.n = 2;
                break;
              }
              return _context.a(2);
            case 2:
              if (pack2D.task) {
                task2D.restoreFromTask(pack2D.task, pack2D);
              }
              if (result3D.task) {
                task3D.restoreFromTask(result3D.task, result3D);
              }
              if (quota) {
                setServerQuota(quota);
              }
              _context.n = 4;
              break;
            case 3:
              _context.p = 3;
              _t = _context.v;
            case 4:
              return _context.a(2);
          }
        }, _callee, null, [[0, 3]]);
      }));
      return function loadExisting() {
        return _ref.apply(this, arguments);
      };
    }();
    loadExisting();
    return function () {
      cancelled = true;
    };
  }, [petId]); // eslint-disable-line react-hooks/exhaustive-deps

  var showMemberGuide = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (content) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
      title: '开通会员',
      content: content,
      confirmText: '去开通',
      cancelText: '取消',
      success: function success(res) {
        if (res.confirm) _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().switchTab({
          url: '/pages/member/index'
        });
      }
    });
  }, []);
  var handlePhotoChange = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/function () {
    var _ref2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_17__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().m(function _callee2(path) {
      var _result$data, result, _t2;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            setPhotoUrl(path);
            if (path) {
              _context2.n = 1;
              break;
            }
            setUploadedPhotoUrl(null);
            return _context2.a(2);
          case 1:
            setIsUploading(true);
            _context2.p = 2;
            _context2.n = 3;
            return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.uploadPetPhoto)(petId, path);
          case 3:
            result = _context2.v;
            if (result.success && (_result$data = result.data) !== null && _result$data !== void 0 && _result$data.url) {
              setUploadedPhotoUrl(result.data.url);
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                title: result.message || '上传失败',
                icon: 'none'
              });
              setPhotoUrl(null);
            }
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t2 = _context2.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '上传失败，请重试',
              icon: 'none'
            });
            setPhotoUrl(null);
          case 5:
            _context2.p = 5;
            setIsUploading(false);
            return _context2.f(5);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 4, 5, 6]]);
    }));
    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  }(), [petId]);
  var handleGenerate2D = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_17__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().m(function _callee3() {
    var _result$data2, result, _t3;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          if (uploadedPhotoUrl) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2);
        case 1:
          if (canGenPhoto) {
            _context3.n = 2;
            break;
          }
          showMemberGuide('免费用户每月仅可生成 1 次 2D 形象，开通会员可无限生成');
          return _context3.a(2);
        case 2:
          trackEvent('generate_2d_avatar_photo', {
            style: photoStyle
          });
          _context3.p = 3;
          _context3.n = 4;
          return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.generate2DAvatar)(petId, uploadedPhotoUrl, photoStyle);
        case 4:
          result = _context3.v;
          if (result.success && (_result$data2 = result.data) !== null && _result$data2 !== void 0 && _result$data2.taskId) {
            task2D.startPolling(result.data.taskId);
          } else {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: result.message || '创建生成任务失败',
              icon: 'none'
            });
          }
          _context3.n = 6;
          break;
        case 5:
          _context3.p = 5;
          _t3 = _context3.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '生成失败，请重试',
            icon: 'none'
          });
        case 6:
          return _context3.a(2);
      }
    }, _callee3, null, [[3, 5]]);
  })), [uploadedPhotoUrl, canGenPhoto, petId, photoStyle, trackEvent, task2D, showMemberGuide]);
  var handleGenerate3D = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_17__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().m(function _callee4() {
    var _result$data3, result, _t4;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          if (!(!task2D.taskId || task3D.isGenerating)) {
            _context4.n = 1;
            break;
          }
          return _context4.a(2);
        case 1:
          if (canGen3D) {
            _context4.n = 2;
            break;
          }
          if (!isMember) {
            showMemberGuide('3D 模型生成仅限会员使用，开通会员每月可生成 3 次');
          } else {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '本月 3D 生成次数已用完，请下月再试',
              icon: 'none'
            });
          }
          return _context4.a(2);
        case 2:
          trackEvent('generate_3d_model');
          _context4.p = 3;
          _context4.n = 4;
          return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.generate3DAvatar)(petId, task2D.taskId);
        case 4:
          result = _context4.v;
          if (result.success && (_result$data3 = result.data) !== null && _result$data3 !== void 0 && _result$data3.taskId) {
            task3D.startPolling(result.data.taskId);
          } else {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: result.message || '创建 3D 任务失败',
              icon: 'none'
            });
          }
          _context4.n = 6;
          break;
        case 5:
          _context4.p = 5;
          _t4 = _context4.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '3D 生成失败，请重试',
            icon: 'none'
          });
        case 6:
          return _context4.a(2);
      }
    }, _callee4, null, [[3, 5]]);
  })), [task2D.taskId, task3D.isGenerating, petId, trackEvent, task3D, showMemberGuide, canGen3D, isMember]);
  var handleSaveAsAvatar = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/function () {
    var _ref5 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_17__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().m(function _callee5(image) {
      var _t5;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            trackEvent('save_photo_avatar');
            _context5.p = 1;
            _context5.n = 2;
            return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.saveAvatarCustomization)({
              species: species,
              style: photoStyle,
              baseColor: '#FFD93D',
              generatedAt: new Date().toISOString(),
              cartoonUrl: image.imageUrl
            });
          case 2:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '保存成功',
              icon: 'success'
            });
            setTimeout(function () {
              return (0,_utils_navigation__WEBPACK_IMPORTED_MODULE_5__.safeNavigateBack)();
            }, 1500);
            _context5.n = 4;
            break;
          case 3:
            _context5.p = 3;
            _t5 = _context5.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '保存失败',
              icon: 'none'
            });
          case 4:
            return _context5.a(2);
        }
      }, _callee5, null, [[1, 3]]);
    }));
    return function (_x2) {
      return _ref5.apply(this, arguments);
    };
  }(), [species, photoStyle, trackEvent]);
  var handleTextGenerate = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_17__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().m(function _callee6() {
    var result, _t6;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          if (!(!canGenerate || isGenerating)) {
            _context6.n = 1;
            break;
          }
          return _context6.a(2);
        case 1:
          trackEvent('generate_avatar', {
            style: selectedStyle,
            species: species
          });
          setIsGenerating(true);
          _context6.p = 2;
          _context6.n = 3;
          return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.generateAvatarImage)(species, petName, selectedStyle, undefined, selectedColor);
        case 3:
          result = _context6.v;
          if (result !== null && result !== void 0 && result.success && result.imageUrl) {
            setGeneratedUrl(result.imageUrl);
            setGenCount((0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.getGenerationCount)());
            trackEvent('generate_avatar_success', {
              style: selectedStyle
            });
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '生成成功',
              icon: 'success'
            });
          } else if (!(0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.canGenerateAvatar)(isMember)) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
              title: '生成次数已用完',
              content: '免费用户仅可生成1次，开通会员可无限生成',
              confirmText: '开通会员',
              success: function success(res) {
                if (res.confirm) _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().switchTab({
                  url: '/pages/member/index'
                });
              }
            });
          } else {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '生成失败，请重试',
              icon: 'none'
            });
          }
          _context6.n = 5;
          break;
        case 4:
          _context6.p = 4;
          _t6 = _context6.v;
          trackEvent('generate_avatar_failure');
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '生成失败，请重试',
            icon: 'none'
          });
        case 5:
          _context6.p = 5;
          setIsGenerating(false);
          return _context6.f(5);
        case 6:
          return _context6.a(2);
      }
    }, _callee6, null, [[2, 4, 5, 6]]);
  })), [canGenerate, isGenerating, species, petName, selectedStyle, selectedColor, isMember, trackEvent]);
  var handleTextSave = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_17__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().m(function _callee7() {
    var _t7;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_18__["default"])().w(function (_context7) {
      while (1) switch (_context7.p = _context7.n) {
        case 0:
          if (generatedUrl) {
            _context7.n = 1;
            break;
          }
          return _context7.a(2);
        case 1:
          trackEvent('save_avatar');
          _context7.p = 2;
          _context7.n = 3;
          return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.saveAvatarCustomization)({
            species: species,
            style: selectedStyle,
            baseColor: selectedColor,
            generatedAt: new Date().toISOString(),
            cartoonUrl: generatedUrl
          });
        case 3:
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '保存成功',
            icon: 'success'
          });
          setTimeout(function () {
            return (0,_utils_navigation__WEBPACK_IMPORTED_MODULE_5__.safeNavigateBack)();
          }, 1500);
          _context7.n = 5;
          break;
        case 4:
          _context7.p = 4;
          _t7 = _context7.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '保存失败',
            icon: 'none'
          });
        case 5:
          return _context7.a(2);
      }
    }, _callee7, null, [[2, 4]]);
  })), [generatedUrl, species, selectedStyle, selectedColor, trackEvent]);
  var handle2DRetry = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    task2D.reset();
    handleGenerate2D();
  }, [task2D, handleGenerate2D]);
  var existingCustom = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_11__.getAvatarCustomization)();
  }, []);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
    className: "avatar-customize ".concat(themeClass),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
      className: "avatar-customize__tabs",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__tab ".concat(activeTab === 'text' ? 'avatar-customize__tab--active' : ''),
        onClick: function onClick() {
          return setActiveTab('text');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__tab-text",
          children: "\u6587\u5B57\u63CF\u8FF0\u751F\u6210"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__tab ".concat(activeTab === 'photo' ? 'avatar-customize__tab--active' : ''),
        onClick: function onClick() {
          return setActiveTab('photo');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__tab-text",
          children: "\u7167\u7247\u751F\u6210"
        })
      })]
    }), activeTab === 'text' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__preview",
        children: isGenerating ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
          className: "avatar-customize__generating",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
            className: "avatar-customize__generating-spinner"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
            className: "avatar-customize__generating-text",
            children: "AI \u6B63\u5728\u4E3A\u4F60\u751F\u6210\u4E13\u5C5E\u5F62\u8C61..."
          })]
        }) : generatedUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Image, {
          className: "avatar-customize__generated-img",
          src: generatedUrl,
          mode: "aspectFit"
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_components_PetAvatar__WEBPACK_IMPORTED_MODULE_6__["default"], {
          species: species,
          petName: petName,
          expressionContext: expressionContext,
          size: 160,
          showLabel: true
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__section-title",
          children: "\u98CE\u683C\u9009\u62E9"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
          className: "avatar-customize__style-options",
          children: STYLE_OPTIONS.map(function (opt) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
              className: "avatar-customize__style-item ".concat(selectedStyle === opt.value ? 'avatar-customize__style-item--active' : ''),
              onClick: function onClick() {
                return setSelectedStyle(opt.value);
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
                className: "avatar-customize__style-label",
                children: opt.label
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
                className: "avatar-customize__style-desc",
                children: opt.desc
              })]
            }, opt.value);
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__section-title",
          children: "\u57FA\u7840\u914D\u8272"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
          className: "avatar-customize__color-options",
          children: BASE_COLORS.map(function (color) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
              className: "avatar-customize__color-item ".concat(selectedColor === color.value ? 'avatar-customize__color-item--active' : ''),
              style: {
                backgroundColor: color.value
              },
              onClick: function onClick() {
                return setSelectedColor(color.value);
              },
              children: selectedColor === color.value && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
                className: "avatar-customize__color-check",
                children: "\u2713"
              })
            }, color.value);
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__quota",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__quota-text",
          children: textQuotaText
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__actions",
        children: !generatedUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
          className: "avatar-customize__btn ".concat(!canGenerate ? 'avatar-customize__btn--disabled' : ''),
          onClick: handleTextGenerate,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
            className: "avatar-customize__btn-text",
            children: "\u751F\u6210\u5934\u50CF"
          })
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
          className: "avatar-customize__btn-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
            className: "avatar-customize__btn avatar-customize__btn--secondary",
            onClick: function onClick() {
              return setGeneratedUrl(null);
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
              className: "avatar-customize__btn-text",
              children: "\u91CD\u65B0\u751F\u6210"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
            className: "avatar-customize__btn",
            onClick: handleTextSave,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
              className: "avatar-customize__btn-text",
              children: "\u4FDD\u5B58\u5934\u50CF"
            })
          })]
        })
      })]
    }), activeTab === 'photo' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__section-title",
          children: "\u4E0A\u4F20\u5BA0\u7269\u7167\u7247"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_components_PetAvatar_PhotoUploader__WEBPACK_IMPORTED_MODULE_7__["default"], {
          value: photoUrl,
          onChange: handlePhotoChange,
          disabled: isUploading
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__section-title",
          children: "\u98CE\u683C\u9009\u62E9"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
          className: "avatar-customize__style-options",
          children: STYLE_OPTIONS.map(function (opt) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
              className: "avatar-customize__style-item ".concat(photoStyle === opt.value ? 'avatar-customize__style-item--active' : ''),
              onClick: function onClick() {
                return setPhotoStyle(opt.value);
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
                className: "avatar-customize__style-label",
                children: opt.label
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
                className: "avatar-customize__style-desc",
                children: opt.desc
              })]
            }, opt.value);
          })
        })]
      }), !task2D.isProcessing && !task2D.isComplete && !task2D.isFailed && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__quota",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__quota-text",
          children: photoQuotaText
        })
      }), !task2D.isProcessing && !task2D.isComplete && !task2D.isFailed && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__actions",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
          className: "avatar-customize__btn ".concat(!uploadedPhotoUrl || !canGenPhoto ? 'avatar-customize__btn--disabled' : ''),
          onClick: handleGenerate2D,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
            className: "avatar-customize__btn-text",
            children: "\u751F\u6210 2D \u5F62\u8C61\u5305"
          })
        })
      }), (task2D.isProcessing || task2D.isFailed) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_components_PetAvatar_GenerationProgress__WEBPACK_IMPORTED_MODULE_10__["default"], {
        progress: task2D.progress,
        status: task2D.status === 'pending' ? 'processing' : task2D.status,
        type: "2d",
        error: task2D.error,
        onRetry: task2D.isFailed ? handle2DRetry : undefined
      }), task2D.isComplete && task2D.pack.images.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_components_PetAvatar_ImageGallery__WEBPACK_IMPORTED_MODULE_8__["default"], {
        images: task2D.pack.images,
        onSaveAsAvatar: handleSaveAsAvatar,
        onGenerate3D: handleGenerate3D,
        isGenerating3D: task3D.isGenerating,
        canGenerate3D: canGen3D
      }), (task3D.isProcessing || task3D.isFailed) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_components_PetAvatar_GenerationProgress__WEBPACK_IMPORTED_MODULE_10__["default"], {
        progress: task3D.progress,
        status: task3D.status === 'pending' ? 'processing' : task3D.status,
        type: "3d",
        error: task3D.error,
        onRetry: task3D.isFailed ? function () {
          return task3D.retry(petId, task2D.taskId);
        } : undefined
      }), task3D.isComplete && task3D.result.model && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_components_PetAvatar_Model3DViewer__WEBPACK_IMPORTED_MODULE_9__["default"], {
        modelUrl: task3D.result.model.modelUrl,
        thumbnailUrl: task3D.result.model.thumbnailUrl
      }), existingCustom && !task2D.isComplete && !task3D.isComplete && !task2D.isProcessing && !task3D.isProcessing && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.View, {
        className: "avatar-customize__existing",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Text, {
          className: "avatar-customize__existing-label",
          children: "\u5F53\u524D\u5934\u50CF"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_19__.Image, {
          className: "avatar-customize__existing-img",
          src: existingCustom.cartoonUrl || '',
          mode: "aspectFit",
          lazyLoad: true
        })]
      })]
    })]
  });
}

/***/ }),

/***/ "./src/components/PetAvatar/GenerationProgress.tsx":
/*!*********************************************************!*\
  !*** ./src/components/PetAvatar/GenerationProgress.tsx ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ GenerationProgress; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");


function GenerationProgress(_ref) {
  var progress = _ref.progress,
    status = _ref.status,
    type = _ref.type,
    error = _ref.error,
    onRetry = _ref.onRetry;
  var label = type === '2d' ? '2D 形象' : '3D 模型';
  if (status === 'failed') {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
      className: "generation-progress generation-progress--failed",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "generation-progress__icon",
        children: "\u274C"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "generation-progress__text",
        children: error || "".concat(label, "\u751F\u6210\u5931\u8D25")
      }), onRetry && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "generation-progress__retry-btn",
        onClick: onRetry,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
          className: "generation-progress__retry-btn-text",
          children: "\u91CD\u8BD5"
        })
      })]
    });
  }
  if (status === 'completed') {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
      className: "generation-progress generation-progress--completed",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "generation-progress__icon",
        children: "\u2705"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "generation-progress__text",
        children: [label, "\u751F\u6210\u5B8C\u6210"]
      })]
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
    className: "generation-progress",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
      className: "generation-progress__header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "generation-progress__label",
        children: ["\u6B63\u5728\u751F\u6210", label, "..."]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "generation-progress__percent",
        children: [progress, "%"]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
      className: "generation-progress__bar",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "generation-progress__fill",
        style: {
          width: "".concat(progress, "%")
        }
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
      className: "generation-progress__hint",
      children: type === '2d' ? '正在绘制多角度形象，请耐心等待' : '正在构建 3D 模型，可能需要 2-5 分钟'
    })]
  });
}

/***/ }),

/***/ "./src/components/PetAvatar/ImageGallery.tsx":
/*!***************************************************!*\
  !*** ./src/components/PetAvatar/ImageGallery.tsx ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ImageGallery; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../constants */ "./src/constants/index.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");





function ImageGallery(_ref) {
  var images = _ref.images,
    onSaveAsAvatar = _ref.onSaveAsAvatar,
    onGenerate3D = _ref.onGenerate3D,
    _ref$isGenerating3D = _ref.isGenerating3D,
    isGenerating3D = _ref$isGenerating3D === void 0 ? false : _ref$isGenerating3D,
    _ref$canGenerate3D = _ref.canGenerate3D,
    canGenerate3D = _ref$canGenerate3D === void 0 ? true : _ref$canGenerate3D;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('expression'),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    activeTab = _useState2[0],
    setActiveTab = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(_constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_ANGLES[0].key),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    selectedAngle = _useState4[0],
    setSelectedAngle = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(_constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_EXPRESSIONS[0].key),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    selectedKey = _useState6[0],
    setSelectedKey = _useState6[1];
  var currentAngles = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return activeTab === 'expression' ? _constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_ANGLES : _constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_ACTION_ANGLES;
  }, [activeTab]);
  var currentItems = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return activeTab === 'expression' ? _constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_EXPRESSIONS : _constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_ACTIONS;
  }, [activeTab]);
  var currentImage = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return images.find(function (img) {
      return img.angle === selectedAngle && img.expression === selectedKey;
    });
  }, [images, selectedAngle, selectedKey]);
  var handleSwitchTab = function handleSwitchTab(tab) {
    setActiveTab(tab);
    var angles = tab === 'expression' ? _constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_ANGLES : _constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_ACTION_ANGLES;
    var items = tab === 'expression' ? _constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_EXPRESSIONS : _constants__WEBPACK_IMPORTED_MODULE_1__.AVATAR_ACTIONS;
    setSelectedAngle(angles[0].key);
    setSelectedKey(items[0].key);
  };
  var handle3DClick = function handle3DClick() {
    if (isGenerating3D) return;
    // canGenerate3D=false 时也调用，由父组件处理会员引导
    onGenerate3D === null || onGenerate3D === void 0 || onGenerate3D();
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "image-gallery",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "image-gallery__angles",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
        scrollX: true,
        className: "image-gallery__angles-scroll",
        children: currentAngles.map(function (angle) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "image-gallery__angle-item ".concat(selectedAngle === angle.key ? 'image-gallery__angle-item--active' : ''),
            onClick: function onClick() {
              return setSelectedAngle(angle.key);
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "image-gallery__angle-label",
              children: angle.label
            })
          }, angle.key);
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "image-gallery__preview",
      children: currentImage ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Image, {
        className: "image-gallery__preview-img",
        src: currentImage.imageUrl,
        mode: "aspectFit",
        lazyLoad: true
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "image-gallery__preview-empty",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "image-gallery__preview-empty-text",
          children: "\u6682\u65E0\u5F62\u8C61\u56FE"
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "image-gallery__tabs",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "image-gallery__tab ".concat(activeTab === 'expression' ? 'image-gallery__tab--active' : ''),
        onClick: function onClick() {
          return handleSwitchTab('expression');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "image-gallery__tab-text",
          children: "\u8868\u60C5"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "image-gallery__tab ".concat(activeTab === 'action' ? 'image-gallery__tab--active' : ''),
        onClick: function onClick() {
          return handleSwitchTab('action');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "image-gallery__tab-text",
          children: "\u52A8\u4F5C"
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "image-gallery__selector",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
        scrollX: true,
        className: "image-gallery__selector-scroll",
        children: currentItems.map(function (item) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "image-gallery__selector-item ".concat(selectedKey === item.key ? 'image-gallery__selector-item--active' : ''),
            onClick: function onClick() {
              return setSelectedKey(item.key);
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "image-gallery__selector-emoji",
              children: item.emoji
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "image-gallery__selector-label",
              children: item.label
            })]
          }, item.key);
        })
      })
    }), currentImage && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "image-gallery__actions",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "image-gallery__btn",
        onClick: function onClick() {
          return onSaveAsAvatar === null || onSaveAsAvatar === void 0 ? void 0 : onSaveAsAvatar(currentImage);
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "image-gallery__btn-text",
          children: "\u4FDD\u5B58\u4E3A\u5934\u50CF"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "image-gallery__btn image-gallery__btn--3d ".concat(isGenerating3D || !canGenerate3D ? 'image-gallery__btn--disabled' : ''),
        onClick: handle3DClick,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "image-gallery__btn-text",
          children: isGenerating3D ? '生成中...' : canGenerate3D ? '生成 3D 模型' : '会员专享'
        })
      })]
    })]
  });
}

/***/ }),

/***/ "./src/components/PetAvatar/Model3DViewer.tsx":
/*!****************************************************!*\
  !*** ./src/components/PetAvatar/Model3DViewer.tsx ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Model3DViewer; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");







function Model3DViewer(_ref) {
  var modelUrl = _ref.modelUrl,
    thumbnailUrl = _ref.thumbnailUrl;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    rotation = _useState2[0],
    setRotation = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(1),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    scale = _useState4[0],
    setScale = _useState4[1];
  var lastTouchRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  var lastDistanceRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  var handleDownload = /*#__PURE__*/function () {
    var _ref2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee() {
      var res, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.p = 0;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showLoading({
              title: '下载中...'
            });
            _context.n = 1;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().downloadFile({
              url: modelUrl
            });
          case 1:
            res = _context.v;
            if (!(res.statusCode === 200)) {
              _context.n = 3;
              break;
            }
            _context.n = 2;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().saveFile({
              tempFilePath: res.tempFilePath
            });
          case 2:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().hideLoading();
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '模型已保存',
              icon: 'success'
            });
            _context.n = 4;
            break;
          case 3:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().hideLoading();
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '下载失败',
              icon: 'none'
            });
          case 4:
            _context.n = 6;
            break;
          case 5:
            _context.p = 5;
            _t = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().hideLoading();
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '下载失败，请稍后重试',
              icon: 'none'
            });
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[0, 5]]);
    }));
    return function handleDownload() {
      return _ref2.apply(this, arguments);
    };
  }();
  var handlePreview = function handlePreview() {
    if (thumbnailUrl) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().previewImage({
        urls: [thumbnailUrl],
        current: thumbnailUrl
      });
    }
  };
  var handleReset = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setRotation(0);
    setScale(1);
  }, []);
  var handleTouchStart = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (e) {
    var touches = e.touches;
    if (touches.length === 1) {
      lastTouchRef.current = {
        x: touches[0].clientX,
        y: touches[0].clientY
      };
    } else if (touches.length === 2) {
      var dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      lastDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);
  var handleTouchMove = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (e) {
    var touches = e.touches;
    if (touches.length === 1 && lastTouchRef.current) {
      var dx = touches[0].clientX - lastTouchRef.current.x;
      setRotation(function (prev) {
        return prev + dx * 0.5;
      });
      lastTouchRef.current = {
        x: touches[0].clientX,
        y: touches[0].clientY
      };
    } else if (touches.length === 2 && lastDistanceRef.current) {
      var _dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      var distance = Math.sqrt(_dx * _dx + dy * dy);
      var delta = distance - lastDistanceRef.current;
      setScale(function (prev) {
        return Math.min(Math.max(prev + delta * 0.005, 0.5), 3);
      });
      lastDistanceRef.current = distance;
    }
  }, []);
  var handleTouchEnd = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    lastTouchRef.current = null;
    lastDistanceRef.current = null;
  }, []);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
    className: "model-3d-viewer",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "model-3d-viewer__preview",
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      children: thumbnailUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Image, {
        className: "model-3d-viewer__thumbnail",
        src: thumbnailUrl,
        mode: "aspectFit",
        style: {
          transform: "rotate(".concat(rotation, "deg) scale(").concat(scale, ")"),
          transition: 'transform 0.05s linear'
        }
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "model-3d-viewer__placeholder",
        onClick: handlePreview,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "model-3d-viewer__placeholder-icon",
          children: "\uD83E\uDDCA"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "model-3d-viewer__placeholder-text",
          children: "3D \u6A21\u578B\u5DF2\u751F\u6210"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "model-3d-viewer__placeholder-hint",
          children: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE"
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "model-3d-viewer__controls",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        className: "model-3d-viewer__hint",
        children: "\u5355\u6307\u62D6\u62FD\u65CB\u8F6C\uFF0C\u53CC\u6307\u7F29\u653E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "model-3d-viewer__btn-group",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          className: "model-3d-viewer__btn model-3d-viewer__btn--secondary",
          onClick: handleReset,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            className: "model-3d-viewer__btn-text",
            children: "\u91CD\u7F6E\u89C6\u89D2"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Button, {
          className: "model-3d-viewer__btn",
          onClick: handleDownload,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            className: "model-3d-viewer__btn-text",
            children: "\u4E0B\u8F7D .glb \u6A21\u578B"
          })
        })]
      })]
    })]
  });
}

/***/ }),

/***/ "./src/components/PetAvatar/PhotoUploader.tsx":
/*!****************************************************!*\
  !*** ./src/components/PetAvatar/PhotoUploader.tsx ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ PhotoUploader; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");






var ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
function PhotoUploader(_ref) {
  var value = _ref.value,
    onChange = _ref.onChange,
    _ref$disabled = _ref.disabled,
    disabled = _ref$disabled === void 0 ? false : _ref$disabled;
  var handleChooseImage = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().m(function _callee() {
    var _filePath$split$pop, res, filePath, ext, _errMsg, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (!disabled) {
            _context.n = 1;
            break;
          }
          return _context.a(2);
        case 1:
          _context.p = 1;
          _context.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera']
          });
        case 2:
          res = _context.v;
          if (res.tempFilePaths.length) {
            _context.n = 3;
            break;
          }
          return _context.a(2);
        case 3:
          filePath = res.tempFilePaths[0];
          ext = ((_filePath$split$pop = filePath.split('.').pop()) === null || _filePath$split$pop === void 0 ? void 0 : _filePath$split$pop.toLowerCase()) || '';
          if (ALLOWED_EXTENSIONS.includes(ext)) {
            _context.n = 4;
            break;
          }
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '请上传 JPG/PNG/WebP 格式图片',
            icon: 'none'
          });
          return _context.a(2);
        case 4:
          onChange(filePath);
          _context.n = 7;
          break;
        case 5:
          _context.p = 5;
          _t = _context.v;
          if (!((_errMsg = _t.errMsg) !== null && _errMsg !== void 0 && _errMsg.includes('cancel'))) {
            _context.n = 6;
            break;
          }
          return _context.a(2);
        case 6:
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '选择照片失败',
            icon: 'none'
          });
        case 7:
          return _context.a(2);
      }
    }, _callee, null, [[1, 5]]);
  })), [disabled, onChange]);
  var handleRemove = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    onChange('');
  }, [onChange]);
  if (value) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "photo-uploader photo-uploader--has-image",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Image, {
        className: "photo-uploader__preview",
        src: value,
        mode: "aspectFill"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "photo-uploader__actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
          className: "photo-uploader__btn",
          onClick: handleChooseImage,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
            className: "photo-uploader__btn-text",
            children: "\u91CD\u65B0\u9009\u62E9"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
          className: "photo-uploader__btn photo-uploader__btn--remove",
          onClick: handleRemove,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
            className: "photo-uploader__btn-text",
            children: "\u5220\u9664"
          })
        })]
      })]
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
    className: "photo-uploader photo-uploader--empty",
    onClick: handleChooseImage,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "photo-uploader__placeholder",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "photo-uploader__icon",
        children: "\uD83D\uDCF7"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "photo-uploader__label",
        children: "\u70B9\u51FB\u4E0A\u4F20\u5BA0\u7269\u7167\u7247"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "photo-uploader__hint",
        children: "\u652F\u6301\u62CD\u7167\u6216\u4ECE\u76F8\u518C\u9009\u62E9"
      })]
    })
  });
}

/***/ }),

/***/ "./src/hooks/useAvatar2DTask.ts":
/*!**************************************!*\
  !*** ./src/hooks/useAvatar2DTask.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useAvatar2DTask": function() { return /* binding */ useAvatar2DTask; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_avatarService__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../services/avatarService */ "./src/services/avatarService.ts");






function useAvatar2DTask(petId) {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    taskId = _useState2[0],
    setTaskId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    progress = _useState4[0],
    setProgress = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('pending'),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    status = _useState6[0],
    setStatus = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    error = _useState8[0],
    setError = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
      task: null,
      images: []
    }),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState9, 2),
    pack = _useState0[0],
    setPack = _useState0[1];
  var pollingRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  var isMountedRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(true);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    isMountedRef.current = true;
    return function () {
      isMountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);
  var startPolling = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (id) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setTaskId(id);
    setStatus('pending');
    setProgress(0);
    setError(null);
    pollingRef.current = setInterval(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee() {
      var task, newPack;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_2__.getTaskProgress)(id);
          case 1:
            task = _context.v;
            if (!(!task || !isMountedRef.current)) {
              _context.n = 2;
              break;
            }
            if (pollingRef.current) clearInterval(pollingRef.current);
            return _context.a(2);
          case 2:
            setProgress(task.progress);
            setStatus(task.status);
            if (!(task.status === 'completed')) {
              _context.n = 5;
              break;
            }
            if (pollingRef.current) clearInterval(pollingRef.current);
            (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_2__.incrementPhotoGenerationCount)();
            _context.n = 3;
            return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_2__.getAvatar2DImages)(petId);
          case 3:
            newPack = _context.v;
            if (isMountedRef.current) {
              _context.n = 4;
              break;
            }
            return _context.a(2);
          case 4:
            setPack(newPack);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '2D 形象生成完成',
              icon: 'success'
            });
            _context.n = 6;
            break;
          case 5:
            if (task.status === 'failed') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setError(task.error || '2D 形象生成失败，请重试');
            }
          case 6:
            return _context.a(2);
        }
      }, _callee);
    })), 2000);
  }, [petId]);
  var restoreFromTask = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (task, existingPack) {
    setTaskId(task.id);
    setStatus(task.status);
    setProgress(task.progress);
    setError(task.error);
    if (existingPack) setPack(existingPack);
    if (task.status === 'pending' || task.status === 'processing') {
      startPolling(task.id);
    }
  }, [startPolling]);
  var reset = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setStatus('pending');
    setProgress(0);
    setError(null);
  }, []);
  var isProcessing = status === 'pending' || status === 'processing';
  var isComplete = status === 'completed';
  var isFailed = status === 'failed';
  return {
    taskId: taskId,
    progress: progress,
    status: status,
    error: error,
    pack: pack,
    isProcessing: isProcessing,
    isComplete: isComplete,
    isFailed: isFailed,
    startPolling: startPolling,
    restoreFromTask: restoreFromTask,
    reset: reset,
    setTaskId: setTaskId
  };
}

/***/ }),

/***/ "./src/hooks/useAvatar3DTask.ts":
/*!**************************************!*\
  !*** ./src/hooks/useAvatar3DTask.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useAvatar3DTask": function() { return /* binding */ useAvatar3DTask; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_avatarService__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../services/avatarService */ "./src/services/avatarService.ts");






function useAvatar3DTask(petId) {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    taskId = _useState2[0],
    setTaskId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    progress = _useState4[0],
    setProgress = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('pending'),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    status = _useState6[0],
    setStatus = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    error = _useState8[0],
    setError = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
      task: null,
      model: null
    }),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState9, 2),
    result = _useState0[0],
    setResult = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState10 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState1, 2),
    isGenerating = _useState10[0],
    setIsGenerating = _useState10[1];
  var pollingRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  var isMountedRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(true);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    isMountedRef.current = true;
    return function () {
      isMountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);
  var startPolling = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (id) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setTaskId(id);
    setStatus('pending');
    setProgress(0);
    setError(null);
    setIsGenerating(true);
    pollingRef.current = setInterval(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee() {
      var task, newResult;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_2__.getTaskProgress)(id);
          case 1:
            task = _context.v;
            if (!(!task || !isMountedRef.current)) {
              _context.n = 2;
              break;
            }
            if (pollingRef.current) clearInterval(pollingRef.current);
            return _context.a(2);
          case 2:
            setProgress(task.progress);
            setStatus(task.status);
            if (!(task.status === 'completed')) {
              _context.n = 5;
              break;
            }
            if (pollingRef.current) clearInterval(pollingRef.current);
            (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_2__.increment3DGenerationCount)();
            _context.n = 3;
            return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_2__.getAvatar3DModel)(petId);
          case 3:
            newResult = _context.v;
            if (isMountedRef.current) {
              _context.n = 4;
              break;
            }
            return _context.a(2);
          case 4:
            setResult(newResult);
            setIsGenerating(false);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '3D 模型生成完成',
              icon: 'success'
            });
            _context.n = 6;
            break;
          case 5:
            if (task.status === 'failed') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setError(task.error || '3D 模型生成失败，请重试');
              setIsGenerating(false);
            }
          case 6:
            return _context.a(2);
        }
      }, _callee);
    })), 3000);
  }, [petId]);
  var restoreFromTask = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function (task, existingResult) {
    setTaskId(task.id);
    setStatus(task.status);
    setProgress(task.progress);
    setError(task.error);
    if (existingResult) setResult(existingResult);
    if (task.status === 'pending' || task.status === 'processing') {
      setIsGenerating(true);
      startPolling(task.id);
    }
  }, [startPolling]);
  var reset = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    setStatus('pending');
    setProgress(0);
    setError(null);
    setIsGenerating(false);
  }, []);
  var retry = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/function () {
    var _ref2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee2(currentPetId, image2DTaskId) {
      var _res$data, res, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            reset();
            setIsGenerating(true);
            _context2.p = 1;
            _context2.n = 2;
            return (0,_services_avatarService__WEBPACK_IMPORTED_MODULE_2__.generate3DAvatar)(currentPetId, image2DTaskId);
          case 2:
            res = _context2.v;
            if (isMountedRef.current) {
              _context2.n = 3;
              break;
            }
            return _context2.a(2);
          case 3:
            if (res.success && (_res$data = res.data) !== null && _res$data !== void 0 && _res$data.taskId) {
              setTaskId(res.data.taskId);
              startPolling(res.data.taskId);
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                title: res.message || '重试失败',
                icon: 'none'
              });
              setIsGenerating(false);
            }
            _context2.n = 6;
            break;
          case 4:
            _context2.p = 4;
            _t = _context2.v;
            if (isMountedRef.current) {
              _context2.n = 5;
              break;
            }
            return _context2.a(2);
          case 5:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '重试失败，请稍后再试',
              icon: 'none'
            });
            setIsGenerating(false);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 4]]);
    }));
    return function (_x, _x2) {
      return _ref2.apply(this, arguments);
    };
  }(), [reset, startPolling]);
  var isProcessing = status === 'pending' || status === 'processing';
  var isComplete = status === 'completed';
  var isFailed = status === 'failed';
  return {
    taskId: taskId,
    progress: progress,
    status: status,
    error: error,
    result: result,
    isGenerating: isGenerating,
    isProcessing: isProcessing,
    isComplete: isComplete,
    isFailed: isFailed,
    startPolling: startPolling,
    restoreFromTask: restoreFromTask,
    reset: reset,
    retry: retry
  };
}

/***/ }),

/***/ "./src/pagesPet/avatar-customize/index.tsx":
/*!*************************************************!*\
  !*** ./src/pagesPet/avatar-customize/index.tsx ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_avatar_customize_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/avatar-customize/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/avatar-customize/index!./src/pagesPet/avatar-customize/index.tsx");


var config = {"navigationBarTitleText":"头像定制"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_avatar_customize_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/avatar-customize/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_avatar_customize_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/services/avatarService.ts":
/*!***************************************!*\
  !*** ./src/services/avatarService.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "canGenerate3D": function() { return /* binding */ canGenerate3D; },
/* harmony export */   "canGenerateAvatar": function() { return /* binding */ canGenerateAvatar; },
/* harmony export */   "canGeneratePhoto": function() { return /* binding */ canGeneratePhoto; },
/* harmony export */   "generate2DAvatar": function() { return /* binding */ generate2DAvatar; },
/* harmony export */   "generate3DAvatar": function() { return /* binding */ generate3DAvatar; },
/* harmony export */   "generateAvatarImage": function() { return /* binding */ generateAvatarImage; },
/* harmony export */   "getAvatar2DImages": function() { return /* binding */ getAvatar2DImages; },
/* harmony export */   "getAvatar3DModel": function() { return /* binding */ getAvatar3DModel; },
/* harmony export */   "getAvatarCustomization": function() { return /* binding */ getAvatarCustomization; },
/* harmony export */   "getAvatarQuota": function() { return /* binding */ getAvatarQuota; },
/* harmony export */   "getGenerationCount": function() { return /* binding */ getGenerationCount; },
/* harmony export */   "getPhotoGenerationCount": function() { return /* binding */ getPhotoGenerationCount; },
/* harmony export */   "getTaskProgress": function() { return /* binding */ getTaskProgress; },
/* harmony export */   "increment3DGenerationCount": function() { return /* binding */ increment3DGenerationCount; },
/* harmony export */   "incrementPhotoGenerationCount": function() { return /* binding */ incrementPhotoGenerationCount; },
/* harmony export */   "saveAvatarCustomization": function() { return /* binding */ saveAvatarCustomization; },
/* harmony export */   "uploadPetPhoto": function() { return /* binding */ uploadPetPhoto; }
/* harmony export */ });
/* unused harmony exports getAvatarFaceUri, getPetDiary, incrementGenerationCount, get3DGenerationCount */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _engines_petAvatar_svgRenderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../engines/petAvatar/svgRenderer */ "./src/engines/petAvatar/svgRenderer.ts");
/* harmony import */ var _engines_petAvatar_expressionEngine__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../engines/petAvatar/expressionEngine */ "./src/engines/petAvatar/expressionEngine.ts");
/* harmony import */ var _engines_petAvatar_diaryEngine__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../engines/petAvatar/diaryEngine */ "./src/engines/petAvatar/diaryEngine.ts");
/* harmony import */ var _engines_petAvatar_seedreamAdapter__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../engines/petAvatar/seedreamAdapter */ "./src/engines/petAvatar/seedreamAdapter.ts");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../config */ "./src/config/index.ts");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../constants */ "./src/constants/index.ts");











var STORAGE_KEYS = {
  AVATAR_CUSTOM: 'xhh_avatar_custom',
  AVATAR_GEN_COUNT: 'xhh_avatar_gen_count',
  DIARY_CACHE: 'xhh_diary_cache',
  CURRENT_PET_ID: 'xhh_current_pet_id'
};
function getAuthHeaders(extra) {
  var token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync('xhh_token');
  return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_8__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_8__["default"])({}, token ? {
    Authorization: "Bearer ".concat(token)
  } : {}), extra);
}
function generateAvatarImage(_x, _x2, _x3, _x4, _x5) {
  return _generateAvatarImage.apply(this, arguments);
}
function _generateAvatarImage() {
  _generateAvatarImage = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee(species, petName, style, referenceImageUrl, baseColor) {
    var expression, result;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          expression = (0,_engines_petAvatar_expressionEngine__WEBPACK_IMPORTED_MODULE_2__.calculateExpression)({
            todayEntry: null,
            hasAnomaly: false,
            anomalyCount: 0,
            riskLevel: null,
            streakDays: 0,
            isBirthday: false,
            isVaccineComplete: false,
            isRecovery: false,
            isDeceased: false
          });
          _context.n = 1;
          return _engines_petAvatar_seedreamAdapter__WEBPACK_IMPORTED_MODULE_4__.seedreamAdapter.generatePetImage({
            species: species,
            expression: expression,
            breed: petName,
            color: baseColor,
            style: style === 'cartoon' ? 'cartoon' : 'realistic'
          });
        case 1:
          result = _context.v;
          if (!(result.success && result.imageUrl)) {
            _context.n = 3;
            break;
          }
          incrementGenerationCount();
          _context.n = 2;
          return saveAvatarCustomization({
            species: species,
            style: style || 'cartoon',
            baseColor: baseColor || '#FFD93D',
            generatedAt: new Date().toISOString(),
            cartoonUrl: result.imageUrl
          });
        case 2:
          return _context.a(2, result);
        case 3:
          return _context.a(2, null);
      }
    }, _callee);
  }));
  return _generateAvatarImage.apply(this, arguments);
}
function getAvatarFaceUri(species, expressionContext) {
  var size = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 100;
  var config = (0,_engines_petAvatar_expressionEngine__WEBPACK_IMPORTED_MODULE_2__.calculateExpression)(expressionContext);
  return (0,_engines_petAvatar_svgRenderer__WEBPACK_IMPORTED_MODULE_1__.getPetFaceDataUri)(config, species, size);
}
function getPetDiary(petName, expressionContext) {
  var cached = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(STORAGE_KEYS.DIARY_CACHE);
  if (cached && typeof cached === 'string') {
    try {
      var parsed = JSON.parse(cached);
      if (parsed.date === new Date().toISOString().slice(0, 10)) {
        return parsed.text;
      }
    } catch (_unused) {
      // ignore parse error
    }
  }
  var entry = expressionContext.todayEntry;
  var diary = (0,_engines_petAvatar_diaryEngine__WEBPACK_IMPORTED_MODULE_3__.generateDiaryForToday)(entry, expressionContext.streakDays, expressionContext.isBirthday, expressionContext.isRecovery);
  if (!diary) return null;
  var diaryText = "".concat(diary.emoji, " \"").concat(diary.text, "\" \u2014\u2014 ").concat(petName);
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(STORAGE_KEYS.DIARY_CACHE, JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    text: diaryText
  }));
  return diaryText;
}
function getAvatarCustomization() {
  var stored = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(STORAGE_KEYS.AVATAR_CUSTOM);
  if (!stored) return null;
  return stored;
}
function saveAvatarCustomization(_x6) {
  return _saveAvatarCustomization.apply(this, arguments);
}
function _saveAvatarCustomization() {
  _saveAvatarCustomization = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee2(custom) {
    var petId, _t;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(STORAGE_KEYS.AVATAR_CUSTOM, custom);
          _context2.p = 1;
          petId = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(STORAGE_KEYS.CURRENT_PET_ID);
          if (petId) {
            _context2.n = 2;
            break;
          }
          return _context2.a(2);
        case 2:
          _context2.n = 3;
          return _api__WEBPACK_IMPORTED_MODULE_5__.api.put("/api/pets/".concat(petId), {
            avatarStyle: custom.style,
            avatarCartoonUrl: custom.cartoonUrl,
            avatarGeneratedAt: custom.generatedAt
          });
        case 3:
          _context2.n = 5;
          break;
        case 4:
          _context2.p = 4;
          _t = _context2.v;
        case 5:
          return _context2.a(2);
      }
    }, _callee2, null, [[1, 4]]);
  }));
  return _saveAvatarCustomization.apply(this, arguments);
}
function getGenerationCount() {
  var count = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(STORAGE_KEYS.AVATAR_GEN_COUNT);
  return typeof count === 'number' ? count : 0;
}
function incrementGenerationCount() {
  var count = getGenerationCount();
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(STORAGE_KEYS.AVATAR_GEN_COUNT, count + 1);
}
function canGenerateAvatar(isMember) {
  if (isMember) return true;
  return getGenerationCount() < _constants__WEBPACK_IMPORTED_MODULE_7__.AVATAR_FREE_GENERATIONS;
}
function uploadPetPhoto(_x7, _x8) {
  return _uploadPetPhoto.apply(this, arguments);
}
function _uploadPetPhoto() {
  _uploadPetPhoto = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee3(petId, tempFilePath) {
    var res, data, _t2;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          _context3.p = 0;
          _context3.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().uploadFile({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.API_BASE_URL, "/api/avatar/photo/upload"),
            filePath: tempFilePath,
            name: 'photo',
            formData: {
              petId: petId
            },
            header: getAuthHeaders()
          });
        case 1:
          res = _context3.v;
          data = JSON.parse(res.data);
          return _context3.a(2, data);
        case 2:
          _context3.p = 2;
          _t2 = _context3.v;
          return _context3.a(2, {
            success: false,
            message: _t2 instanceof Error ? _t2.message : '上传失败'
          });
      }
    }, _callee3, null, [[0, 2]]);
  }));
  return _uploadPetPhoto.apply(this, arguments);
}
function generate2DAvatar(_x9, _x0, _x1) {
  return _generate2DAvatar.apply(this, arguments);
}
function _generate2DAvatar() {
  _generate2DAvatar = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee4(petId, referencePhotoUrl, style) {
    var res;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context4) {
      while (1) switch (_context4.n) {
        case 0:
          _context4.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.API_BASE_URL, "/api/avatar/generate-2d"),
            method: 'POST',
            data: {
              petId: petId,
              referencePhotoUrl: referencePhotoUrl,
              style: style
            },
            header: getAuthHeaders({
              'Content-Type': 'application/json'
            })
          });
        case 1:
          res = _context4.v;
          return _context4.a(2, res.data);
      }
    }, _callee4);
  }));
  return _generate2DAvatar.apply(this, arguments);
}
function getTaskProgress(_x10) {
  return _getTaskProgress.apply(this, arguments);
}
function _getTaskProgress() {
  _getTaskProgress = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee5(taskId) {
    var res, data;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          _context5.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.API_BASE_URL, "/api/avatar/task/").concat(taskId),
            method: 'GET',
            header: getAuthHeaders()
          });
        case 1:
          res = _context5.v;
          data = res.data;
          return _context5.a(2, data.success ? data.data : null);
      }
    }, _callee5);
  }));
  return _getTaskProgress.apply(this, arguments);
}
function generate3DAvatar(_x11, _x12) {
  return _generate3DAvatar.apply(this, arguments);
}
function _generate3DAvatar() {
  _generate3DAvatar = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee6(petId, image2DTaskId) {
    var res;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context6) {
      while (1) switch (_context6.n) {
        case 0:
          _context6.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.API_BASE_URL, "/api/avatar/generate-3d"),
            method: 'POST',
            data: {
              petId: petId,
              image2DTaskId: image2DTaskId
            },
            header: getAuthHeaders({
              'Content-Type': 'application/json'
            })
          });
        case 1:
          res = _context6.v;
          return _context6.a(2, res.data);
      }
    }, _callee6);
  }));
  return _generate3DAvatar.apply(this, arguments);
}
function getAvatar2DImages(_x13) {
  return _getAvatar2DImages.apply(this, arguments);
}
function _getAvatar2DImages() {
  _getAvatar2DImages = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee7(petId) {
    var res, data;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context7) {
      while (1) switch (_context7.n) {
        case 0:
          _context7.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.API_BASE_URL, "/api/avatar/images/").concat(petId),
            method: 'GET',
            header: getAuthHeaders()
          });
        case 1:
          res = _context7.v;
          data = res.data;
          return _context7.a(2, data.success ? data.data : {
            task: null,
            images: []
          });
      }
    }, _callee7);
  }));
  return _getAvatar2DImages.apply(this, arguments);
}
function getAvatar3DModel(_x14) {
  return _getAvatar3DModel.apply(this, arguments);
}
function _getAvatar3DModel() {
  _getAvatar3DModel = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee8(petId) {
    var res, data;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          _context8.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.API_BASE_URL, "/api/avatar/model/").concat(petId),
            method: 'GET',
            header: getAuthHeaders()
          });
        case 1:
          res = _context8.v;
          data = res.data;
          return _context8.a(2, data.success ? data.data : {
            task: null,
            model: null
          });
      }
    }, _callee8);
  }));
  return _getAvatar3DModel.apply(this, arguments);
}
function getPhotoGenerationCount() {
  var count = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync('xhh_avatar_photo_count');
  return typeof count === 'number' ? count : 0;
}
function canGeneratePhoto(isMember) {
  if (isMember) return true;
  return getPhotoGenerationCount() < _constants__WEBPACK_IMPORTED_MODULE_7__.AVATAR_PHOTO_FREE_COUNT;
}
function incrementPhotoGenerationCount() {
  var count = getPhotoGenerationCount();
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync('xhh_avatar_photo_count', count + 1);
}
function get3DGenerationCount() {
  var dateKey = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync('xhh_avatar_3d_count_date');
  var today = new Date().toISOString().slice(0, 7);
  if (dateKey !== today) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync('xhh_avatar_3d_count', 0);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync('xhh_avatar_3d_count_date', today);
    return 0;
  }
  var count = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync('xhh_avatar_3d_count');
  return typeof count === 'number' ? count : 0;
}
function canGenerate3D(isMember) {
  if (!isMember) return false;
  return get3DGenerationCount() < _constants__WEBPACK_IMPORTED_MODULE_7__.AVATAR_3D_MONTHLY_LIMIT;
}
function increment3DGenerationCount() {
  var count = get3DGenerationCount();
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync('xhh_avatar_3d_count', count + 1);
}
function getAvatarQuota() {
  return _getAvatarQuota.apply(this, arguments);
}
function _getAvatarQuota() {
  _getAvatarQuota = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_9__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().m(function _callee9() {
    var res, data, _t3;
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_10__["default"])().w(function (_context9) {
      while (1) switch (_context9.p = _context9.n) {
        case 0:
          _context9.p = 0;
          _context9.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.API_BASE_URL, "/api/avatar/quota"),
            method: 'GET',
            header: getAuthHeaders()
          });
        case 1:
          res = _context9.v;
          data = res.data;
          return _context9.a(2, data.success ? data.data : null);
        case 2:
          _context9.p = 2;
          _t3 = _context9.v;
          return _context9.a(2, null);
      }
    }, _callee9, null, [[0, 2]]);
  }));
  return _getAvatarQuota.apply(this, arguments);
}

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["pagesPet/sub-vendors","sub-common/6445d8bdf2172a6fd6abee9a9e2cae24","sub-common/a80d2ee33a59c94051f538ac359a531d","sub-common/bdd8c1063b7c478b3c5853b4e19995be","sub-common/8e9e3160e7a3b06d42389337fa063587","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/avatar-customize/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map