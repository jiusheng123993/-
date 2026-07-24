"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/naming/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/naming/index!./src/pagesPet/naming/index.tsx":
/*!************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/naming/index!./src/pagesPet/naming/index.tsx ***!
  \************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ NamingPage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _services_namingService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../services/namingService */ "./src/services/namingService.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");







function NamingPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('interpret'),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    tab = _useState2[0],
    setTab = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    name = _useState4[0],
    setName = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    breed = _useState6[0],
    setBreed = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    birthDate = _useState8[0],
    setBirthDate = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState9, 2),
    gender = _useState0[0],
    setGender = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState10 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState1, 2),
    result = _useState10[0],
    setResult = _useState10[1];
  var _useState11 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState12 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState11, 2),
    loading = _useState12[0],
    setLoading = _useState12[1];
  var handleInterpret = /*#__PURE__*/function () {
    var _ref = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee() {
      var res, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!name || !breed || !birthDate)) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setLoading(true);
            _context.p = 2;
            _context.n = 3;
            return (0,_services_namingService__WEBPACK_IMPORTED_MODULE_1__.interpretName)(name, breed, birthDate);
          case 3:
            res = _context.v;
            setResult(res);
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            setResult('解读服务暂时不可用，请稍后再试。');
          case 5:
            _context.p = 5;
            setLoading(false);
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4, 5, 6]]);
    }));
    return function handleInterpret() {
      return _ref.apply(this, arguments);
    };
  }();
  var handleRecommend = /*#__PURE__*/function () {
    var _ref2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_4__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().m(function _callee2() {
      var res, _t2;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (!(!breed || !birthDate || !gender)) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            setLoading(true);
            _context2.p = 2;
            _context2.n = 3;
            return (0,_services_namingService__WEBPACK_IMPORTED_MODULE_1__.recommendNames)(breed, birthDate, gender);
          case 3:
            res = _context2.v;
            setResult(res);
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t2 = _context2.v;
            setResult('推荐服务暂时不可用，请稍后再试。');
          case 5:
            _context2.p = 5;
            setLoading(false);
            return _context2.f(5);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 4, 5, 6]]);
    }));
    return function handleRecommend() {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
    style: {
      minHeight: '100vh',
      background: '#0F1724',
      padding: '20px',
      paddingTop: '60px'
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
      style: {
        color: '#F5D78C',
        fontSize: '22px',
        fontFamily: 'serif',
        display: 'block',
        textAlign: 'center',
        marginBottom: '24px'
      },
      children: "\u7ED9\u5B9D\u8D1D\u53D6\u540D \u2726"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      style: {
        display: 'flex',
        marginBottom: '24px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(232,168,56,0.2)'
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        onClick: function onClick() {
          setTab('interpret');
          setResult('');
        },
        style: {
          flex: 1,
          padding: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: tab === 'interpret' ? 'rgba(232,168,56,0.15)' : 'transparent',
          color: tab === 'interpret' ? '#E8A838' : '#8899AA',
          fontSize: '13px'
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          children: "\u6211\u53D6\u597D\u4E86\uFF0C\u60F3\u770B\u770B\u5BD3\u610F"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        onClick: function onClick() {
          setTab('recommend');
          setResult('');
        },
        style: {
          flex: 1,
          padding: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: tab === 'recommend' ? 'rgba(232,168,56,0.15)' : 'transparent',
          color: tab === 'recommend' ? '#E8A838' : '#8899AA',
          fontSize: '13px'
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          children: "\u5E2E\u6211\u60F3\u60F3"
        })
      })]
    }), tab === 'interpret' ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
        style: inputStyle,
        value: name,
        onInput: function onInput(e) {
          return setName(e.detail.value);
        },
        placeholder: "\u8F93\u5165\u5BA0\u7269\u540D\u5B57",
        placeholderStyle: "color:#556"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
        style: inputStyle,
        value: breed,
        onInput: function onInput(e) {
          return setBreed(e.detail.value);
        },
        placeholder: "\u54C1\u79CD\uFF08\u5982\u82F1\u77ED\u3001\u7530\u56ED\u732B\uFF09",
        placeholderStyle: "color:#556"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
        style: inputStyle,
        value: birthDate,
        onInput: function onInput(e) {
          return setBirthDate(e.detail.value);
        },
        placeholder: "\u51FA\u751F\u65E5\u671F\uFF08\u59822025-03-15\uFF09",
        placeholderStyle: "color:#556"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        onClick: handleInterpret,
        style: btnStyle,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          style: {
            color: '#0F1724',
            fontWeight: 600
          },
          children: loading ? '解读中...' : '开始解读'
        })
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
        style: inputStyle,
        value: breed,
        onInput: function onInput(e) {
          return setBreed(e.detail.value);
        },
        placeholder: "\u54C1\u79CD\uFF08\u5982\u82F1\u77ED\u3001\u7530\u56ED\u732B\uFF09",
        placeholderStyle: "color:#556"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
        style: inputStyle,
        value: birthDate,
        onInput: function onInput(e) {
          return setBirthDate(e.detail.value);
        },
        placeholder: "\u51FA\u751F\u65E5\u671F\uFF08\u59822025-03-15\uFF09",
        placeholderStyle: "color:#556"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        style: {
          display: 'flex',
          gap: '12px',
          marginBottom: '12px'
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          onClick: function onClick() {
            return setGender('公');
          },
          style: {
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center',
            background: gender === '公' ? 'rgba(91,154,155,0.2)' : 'rgba(255,255,255,0.04)',
            border: gender === '公' ? '1px solid #5B9A9B' : '1px solid rgba(255,255,255,0.06)',
            color: gender === '公' ? '#5B9A9B' : '#8899AA'
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            children: "\u2642 \u516C"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          onClick: function onClick() {
            return setGender('母');
          },
          style: {
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center',
            background: gender === '母' ? 'rgba(224,133,107,0.2)' : 'rgba(255,255,255,0.04)',
            border: gender === '母' ? '1px solid #E0856B' : '1px solid rgba(255,255,255,0.06)',
            color: gender === '母' ? '#E0856B' : '#8899AA'
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            children: "\u2640 \u6BCD"
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        onClick: handleRecommend,
        style: btnStyle,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          style: {
            color: '#0F1724',
            fontWeight: 600
          },
          children: loading ? '推荐中...' : '帮我推荐'
        })
      })]
    }), result && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      style: {
        marginTop: '24px',
        padding: '20px',
        borderRadius: '16px',
        background: '#1A2332',
        border: '1px solid rgba(232,168,56,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        style: {
          color: '#F5D78C',
          fontSize: '14px',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap'
        },
        children: result
      })
    })]
  });
}
var inputStyle = {
  width: '100%',
  padding: '14px',
  marginBottom: '12px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#E8DFD5',
  fontSize: '14px',
  boxSizing: 'border-box'
};
var btnStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #E8A838, #C88520)',
  textAlign: 'center',
  marginTop: '8px'
};

/***/ }),

/***/ "./src/pagesPet/naming/index.tsx":
/*!***************************************!*\
  !*** ./src/pagesPet/naming/index.tsx ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_naming_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/naming/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/naming/index!./src/pagesPet/naming/index.tsx");


var config = {"navigationBarTitleText":"给宝贝取名"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_naming_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/naming/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_naming_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/naming/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map