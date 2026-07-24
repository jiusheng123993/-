"use strict";require("../sub-common/6445d8bdf2172a6fd6abee9a9e2cae24.js");require("../sub-common/a80d2ee33a59c94051f538ac359a531d.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesUser/onboarding/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesUser/onboarding/index!./src/pagesUser/onboarding/index.tsx":
/*!**********************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesUser/onboarding/index!./src/pagesUser/onboarding/index.tsx ***!
  \**********************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ OnboardingPage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useAnalytics */ "./src/hooks/useAnalytics.ts");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");








var SLIDES = [{
  key: 'checkin',
  icon: '📋',
  title: '3秒健康打卡',
  description: '每天3秒记录便便、食欲、精神、运动、体重，AI即时反馈健康状态'
}, {
  key: 'food',
  icon: '🍖',
  title: '食物安全查询',
  description: '输入食物名称，秒查能不能吃。支持品种禁忌识别，保护毛孩子远离危险'
}, {
  key: 'symptom',
  icon: '🩺',
  title: 'AI症状初筛',
  description: '4步描述症状，AI评估紧急程度。红色预警立即就医，守护每一刻'
}];
function OnboardingPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState, 2),
    currentSlide = _useState2[0],
    setCurrentSlide = _useState2[1];
  var _useAnalytics = (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_2__.useAnalytics)(),
    trackPageView = _useAnalytics.trackPageView,
    trackEvent = _useAnalytics.trackEvent;
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    trackPageView('onboarding');
  }, [trackPageView]);
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_3__.useThemeClass)();
  var slide = SLIDES[currentSlide];
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    trackEvent('onboarding_step_view', {
      step: currentSlide + 1,
      stepKey: slide.key
    });
  }, [currentSlide, slide.key, trackEvent]);
  var handleNext = function handleNext() {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };
  var handleStart = function handleStart() {
    trackEvent('onboarding_complete');
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().setStorageSync('onboarding_completed', 'true');
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().redirectTo({
      url: '/pagesPet/add/index'
    });
  };
  var handleSkip = function handleSkip() {
    trackEvent('onboarding_skip', {
      step: currentSlide + 1
    });
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().setStorageSync('onboarding_completed', 'true');
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().switchTab({
      url: '/pages/index/index'
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
    className: 'onboarding-page ' + themeClass,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "onboarding-page__skip",
      onClick: handleSkip,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        className: "onboarding-page__skip-text",
        children: "\u8DF3\u8FC7"
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "onboarding-page__content",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "onboarding-page__icon",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "onboarding-page__icon-emoji",
          children: slide.icon
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        className: "onboarding-page__title",
        children: slide.title
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        className: "onboarding-page__description",
        children: slide.description
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "onboarding-page__dots",
      children: SLIDES.map(function (s, i) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          className: "onboarding-page__dot ".concat(i === currentSlide ? 'onboarding-page__dot--active' : '')
        }, s.key);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "onboarding-page__actions",
      children: currentSlide < SLIDES.length - 1 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "onboarding-page__btn onboarding-page__btn--next",
        onClick: handleNext,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "onboarding-page__btn-text",
          children: "\u4E0B\u4E00\u6B65"
        })
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "onboarding-page__btn onboarding-page__btn--start",
        onClick: handleStart,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "onboarding-page__btn-text",
          children: "\u6DFB\u52A0\u6211\u7684\u5BA0\u7269"
        })
      })
    })]
  });
}

/***/ }),

/***/ "./src/pagesUser/onboarding/index.tsx":
/*!********************************************!*\
  !*** ./src/pagesUser/onboarding/index.tsx ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesUser_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesUser/onboarding/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesUser/onboarding/index!./src/pagesUser/onboarding/index.tsx");


var config = {"navigationBarTitleText":"欢迎使用星寰海","navigationStyle":"custom"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesUser_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesUser/onboarding/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesUser_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["sub-common/6445d8bdf2172a6fd6abee9a9e2cae24","sub-common/a80d2ee33a59c94051f538ac359a531d","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesUser/onboarding/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map