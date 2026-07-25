"use strict";require("../sub-vendors.js");require("../sub-common/6445d8bdf2172a6fd6abee9a9e2cae24.js");require("../sub-common/a80d2ee33a59c94051f538ac359a531d.js");require("../sub-common/53c676dc54a90fa031d0d212976af696.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/hospital/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/hospital/index!./src/pagesPet/hospital/index.tsx":
/*!****************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/hospital/index!./src/pagesPet/hospital/index.tsx ***!
  \****************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ HospitalPage; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useAnalytics */ "./src/hooks/useAnalytics.ts");
/* harmony import */ var _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../types/analyticsTypes */ "./src/types/analyticsTypes.ts");
/* harmony import */ var _engines_petSafety_MedicalDisclaimer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../engines/petSafety/MedicalDisclaimer */ "./src/engines/petSafety/MedicalDisclaimer.ts");
/* harmony import */ var _components_PageLoading__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../components/PageLoading */ "./src/components/PageLoading.tsx");
/* harmony import */ var _services_hospitalService__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../services/hospitalService */ "./src/services/hospitalService.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");











var FILTER_TABS = [{
  key: 'all',
  label: '全部'
}, {
  key: 'emergency',
  label: '24h急诊'
}, {
  key: 'general',
  label: '综合'
}, {
  key: 'specialist',
  label: '专科'
}, {
  key: 'nearest',
  label: '离我最近'
}];
var TYPE_LABELS = {
  general: '综合',
  specialist: '专科',
  emergency: '急诊'
};
var TYPE_COLORS = {
  general: '#4A90D9',
  specialist: '#FF8C42',
  emergency: '#FF4D4F'
};
function HospitalPage() {
  var _useAnalytics = (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_2__.useAnalytics)(),
    trackEvent = _useAnalytics.trackEvent;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(''),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState, 2),
    searchText = _useState2[0],
    setSearchText = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('all'),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState3, 2),
    activeFilter = _useState4[0],
    setActiveFilter = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState5, 2),
    hospitals = _useState6[0],
    setHospitals = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState7, 2),
    loading = _useState8[0],
    setLoading = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null),
    _useState0 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_8__["default"])(_useState9, 2),
    selectedHospital = _useState0[0],
    setSelectedHospital = _useState0[1];
  (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_2__.usePageView)('hospital');
  var loadHospitals = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function () {
    setLoading(true);
    try {
      var result = [];
      switch (activeFilter) {
        case 'emergency':
          result = (0,_services_hospitalService__WEBPACK_IMPORTED_MODULE_6__.getEmergencyHospitals)();
          break;
        case 'general':
          result = (0,_services_hospitalService__WEBPACK_IMPORTED_MODULE_6__.getNearbyHospitals)().filter(function (h) {
            return h.type === 'general';
          });
          break;
        case 'specialist':
          result = (0,_services_hospitalService__WEBPACK_IMPORTED_MODULE_6__.getNearbyHospitals)().filter(function (h) {
            return h.type === 'specialist';
          });
          break;
        case 'nearest':
          result = (0,_services_hospitalService__WEBPACK_IMPORTED_MODULE_6__.getNearbyHospitals)();
          break;
        default:
          result = (0,_services_hospitalService__WEBPACK_IMPORTED_MODULE_6__.getNearbyHospitals)();
      }
      setHospitals(result);
    } catch (error) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);
  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    loadHospitals();
  }, [loadHospitals]);
  var handleSearch = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function () {
    if (!searchText.trim()) {
      loadHospitals();
      return;
    }
    trackEvent(_types_analyticsTypes__WEBPACK_IMPORTED_MODULE_3__.AnalyticsEventName.FindHospital, {
      petId: '',
      urgencyLevel: 'green',
      source: 'search'
    });
    setLoading(true);
    try {
      var result = (0,_services_hospitalService__WEBPACK_IMPORTED_MODULE_6__.searchHospitals)(searchText.trim());
      setHospitals(result);
    } catch (error) {} finally {
      setLoading(false);
    }
  }, [searchText, loadHospitals, trackEvent]);
  var handleFilterChange = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (filter) {
    setActiveFilter(filter);
    trackEvent(_types_analyticsTypes__WEBPACK_IMPORTED_MODULE_3__.AnalyticsEventName.FindHospital, {
      petId: '',
      urgencyLevel: 'green',
      source: "filter_".concat(filter)
    });
  }, [trackEvent]);
  var handleCall = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (phone, hospitalName) {
    trackEvent(_types_analyticsTypes__WEBPACK_IMPORTED_MODULE_3__.AnalyticsEventName.FindHospital, {
      petId: '',
      urgencyLevel: 'green',
      source: 'call_phone'
    });
    (0,_services_hospitalService__WEBPACK_IMPORTED_MODULE_6__.callHospital)(phone);
  }, [trackEvent]);
  var handleNavigate = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (hospital) {
    trackEvent(_types_analyticsTypes__WEBPACK_IMPORTED_MODULE_3__.AnalyticsEventName.FindHospital, {
      petId: '',
      urgencyLevel: 'green',
      source: 'navigate'
    });
    (0,_services_hospitalService__WEBPACK_IMPORTED_MODULE_6__.navigateToHospital)(hospital.latitude, hospital.longitude, hospital.name);
  }, [trackEvent]);
  var handleCardClick = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (hospital) {
    setSelectedHospital(function (prev) {
      return (prev === null || prev === void 0 ? void 0 : prev.id) === hospital.id ? null : hospital;
    });
  }, []);
  var renderStars = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (rating) {
    var fullStars = Math.floor(rating);
    var hasHalf = rating - fullStars >= 0.5;
    var stars = [];
    for (var i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalf) {
      stars.push('☆');
    }
    return stars.join('');
  }, []);
  var filteredHospitals = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
    return hospitals;
  }, [hospitals]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
    className: "hospital-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "hospital-page__search",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "hospital-page__search-input-wrap",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "hospital-page__search-icon"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Input, {
          className: "hospital-page__search-input",
          placeholder: "\u641C\u7D22\u533B\u9662\u540D\u79F0\u3001\u5730\u5740\u6216\u670D\u52A1",
          placeholderClass: "hospital-page__search-placeholder",
          value: searchText,
          onInput: function onInput(e) {
            return setSearchText(e.detail.value);
          },
          onConfirm: handleSearch
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "hospital-page__search-btn",
        onClick: handleSearch,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "hospital-page__search-btn-text",
          children: "\u641C\u7D22"
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "hospital-page__filters",
      children: FILTER_TABS.map(function (tab) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          className: "hospital-page__filter-tag".concat(activeFilter === tab.key ? ' hospital-page__filter-tag--active' : ''),
          onClick: function onClick() {
            return handleFilterChange(tab.key);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
            className: "hospital-page__filter-tag-text",
            children: tab.label
          })
        }, tab.key);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "hospital-page__disclaimer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "hospital-page__disclaimer-text",
        children: new _engines_petSafety_MedicalDisclaimer__WEBPACK_IMPORTED_MODULE_4__.MedicalDisclaimer().getSymptomDisclaimer('green')
      })
    }), loading ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_components_PageLoading__WEBPACK_IMPORTED_MODULE_5__["default"], {
      text: "\u6B63\u5728\u52A0\u8F7D\u533B\u9662\u4FE1\u606F..."
    }) : filteredHospitals.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "hospital-page__empty",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "hospital-page__empty-icon",
        children: "\uD83C\uDFE5"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "hospital-page__empty-text",
        children: "\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u533B\u9662"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "hospital-page__empty-hint",
        children: "\u5C1D\u8BD5\u66F4\u6362\u7B5B\u9009\u6761\u4EF6\u6216\u641C\u7D22\u5173\u952E\u8BCD"
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "hospital-page__list",
      children: filteredHospitals.map(function (hospital) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          className: "hospital-page__card",
          onClick: function onClick() {
            return handleCardClick(hospital);
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "hospital-page__card-header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-title-wrap",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-name",
                children: hospital.name
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
                className: "hospital-page__card-type",
                style: {
                  backgroundColor: "".concat(TYPE_COLORS[hospital.type], "18"),
                  color: TYPE_COLORS[hospital.type]
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                  className: "hospital-page__card-type-text",
                  children: TYPE_LABELS[hospital.type] || hospital.type
                })
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-rating",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-stars",
                children: renderStars(hospital.rating)
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-rating-text",
                children: hospital.rating.toFixed(1)
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "hospital-page__card-info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-info-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-info-icon",
                children: "\uD83D\uDCCD"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-info-text",
                children: hospital.address
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-info-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-info-icon"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-info-text",
                children: hospital.openHours
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-info-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-info-icon",
                children: "\uD83D\uDCCF"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-info-text",
                children: ["\u8DDD\u60A8\u7EA6 ", hospital.distance, "km"]
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "hospital-page__card-services",
            children: [hospital.services.slice(0, 4).map(function (service, index) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
                className: "hospital-page__card-service-tag",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                  className: "hospital-page__card-service-tag-text",
                  children: service
                })
              }, index);
            }), hospital.services.length > 4 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-service-tag hospital-page__card-service-tag--more",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-service-tag-text",
                children: ["+", hospital.services.length - 4]
              })
            })]
          }), (selectedHospital === null || selectedHospital === void 0 ? void 0 : selectedHospital.id) === hospital.id && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "hospital-page__card-detail",
            children: [hospital.specialties && hospital.specialties.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-detail-section",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-detail-label",
                children: "\u4E13\u79D1\u7279\u8272"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
                className: "hospital-page__card-detail-tags",
                children: hospital.specialties.map(function (specialty, index) {
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                    className: "hospital-page__card-detail-tag",
                    children: specialty
                  }, index);
                })
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-detail-section",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-detail-label",
                children: "\u63A5\u8BCA\u7269\u79CD"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
                className: "hospital-page__card-detail-tags",
                children: hospital.species.map(function (s, index) {
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                    className: "hospital-page__card-detail-tag",
                    children: s === 'dog' ? '犬' : s === 'cat' ? '猫' : s === 'bird' ? '鸟类' : s === 'rabbit' ? '兔子' : s === 'reptile' ? '爬行类' : '小宠'
                  }, index);
                })
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "hospital-page__card-actions",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-btn hospital-page__card-btn--call",
              onClick: function onClick(e) {
                e.stopPropagation();
                handleCall(hospital.phone, hospital.name);
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-btn-icon",
                children: "\uD83D\uDCDE"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-btn-text",
                children: "\u7535\u8BDD"
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "hospital-page__card-btn hospital-page__card-btn--nav",
              onClick: function onClick(e) {
                e.stopPropagation();
                handleNavigate(hospital);
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-btn-icon",
                children: "\uD83E\uDDED"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "hospital-page__card-btn-text",
                children: "\u5BFC\u822A"
              })]
            })]
          })]
        }, hospital.id);
      })
    })]
  });
}

/***/ }),

/***/ "./src/data/hospitals.ts":
/*!*******************************!*\
  !*** ./src/data/hospitals.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getEmergencyHospitals": function() { return /* binding */ getEmergencyHospitals; },
/* harmony export */   "getHospitalById": function() { return /* binding */ getHospitalById; },
/* harmony export */   "getNearbyHospitals": function() { return /* binding */ getNearbyHospitals; },
/* harmony export */   "searchHospitals": function() { return /* binding */ searchHospitals; }
/* harmony export */ });
/* unused harmony exports getAllCities, getHospitalsByType */
var HOSPITALS = [{
  id: 'h001',
  name: '北京瑞派宠物医院（朝阳总院）',
  address: '北京市朝阳区建国路88号SOHO现代城A座',
  phone: '010-88886666',
  distance: 1.2,
  rating: 4.8,
  openHours: '09:00-21:00',
  services: ['内科', '外科', '影像科', '检验科', '牙科', '皮肤科'],
  species: ['dog', 'cat', 'bird', 'rabbit'],
  emergency: false,
  latitude: 39.9042,
  longitude: 116.4074,
  city: '北京',
  type: 'general',
  isPartner: true,
  partnerId: 'partner_h001',
  commissionRate: 0.08
}, {
  id: 'h002',
  name: '北京爱诺动物医院（24h急诊）',
  address: '北京市海淀区中关村大街27号中关村大厦',
  phone: '010-66668888',
  distance: 3.5,
  rating: 4.9,
  openHours: '24小时',
  services: ['24h急诊', '内科', '外科', 'ICU', '血液透析', '影像科'],
  species: ['dog', 'cat', 'bird', 'rabbit', 'reptile', 'small_animal'],
  emergency: true,
  latitude: 39.959,
  longitude: 116.317,
  city: '北京',
  type: 'emergency'
}, {
  id: 'h003',
  name: '北京芭比堂动物眼科中心',
  address: '北京市西城区金融街甲9号',
  phone: '010-55559999',
  distance: 5.8,
  rating: 4.7,
  openHours: '09:00-18:00',
  services: ['眼科专科', '白内障手术', '青光眼治疗', '角膜移植'],
  species: ['dog', 'cat'],
  emergency: false,
  latitude: 39.9139,
  longitude: 116.3669,
  city: '北京',
  type: 'specialist',
  specialties: ['眼科']
}, {
  id: 'h004',
  name: '上海瑞鹏宠物医院（浦东旗舰店）',
  address: '上海市浦东新区陆家嘴环路1000号',
  phone: '021-68888888',
  distance: 2.1,
  rating: 4.6,
  openHours: '08:30-22:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育', '牙科'],
  species: ['dog', 'cat', 'rabbit'],
  emergency: false,
  latitude: 31.2304,
  longitude: 121.4737,
  city: '上海',
  type: 'general'
}, {
  id: 'h005',
  name: '上海芭比堂动物医院（浦东分院）',
  address: '上海市浦东新区张杨路828号华都大厦',
  phone: '021-33336666',
  distance: 2.8,
  rating: 4.7,
  openHours: '08:30-22:00',
  services: ['内科', '外科', '影像科', '牙科', '体检', '绝育', '住院'],
  species: ['dog', 'cat', 'bird', 'rabbit', 'reptile'],
  emergency: false,
  latitude: 31.2304,
  longitude: 121.4737,
  city: '上海',
  type: 'general',
  isPartner: true,
  partnerId: 'partner_h005',
  commissionRate: 0.07
}, {
  id: 'h006',
  name: '上海顽皮家族宠物骨科中心',
  address: '上海市长宁区虹桥路1438号',
  phone: '021-77778888',
  distance: 6.2,
  rating: 4.8,
  openHours: '09:00-19:00',
  services: ['骨科专科', '关节置换', '脊柱手术', '运动康复', '物理治疗'],
  species: ['dog', 'cat'],
  emergency: false,
  latitude: 31.198,
  longitude: 121.4,
  city: '上海',
  type: 'specialist',
  specialties: ['骨科']
}, {
  id: 'h007',
  name: '广州爱宠动物医院（天河分院）',
  address: '广州市天河区天河路385号太古汇',
  phone: '020-88889999',
  distance: 1.8,
  rating: 4.5,
  openHours: '09:00-21:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育', '影像科'],
  species: ['dog', 'cat', 'bird'],
  emergency: false,
  latitude: 23.1291,
  longitude: 113.2644,
  city: '广州',
  type: 'general'
}, {
  id: 'h008',
  name: '广州立德动物医院（24h急诊）',
  address: '广州市越秀区东风东路753号',
  phone: '020-66667777',
  distance: 3.9,
  rating: 4.7,
  openHours: '24小时',
  services: ['24h急诊', '内科', '外科', 'ICU', '中毒急救'],
  species: ['dog', 'cat', 'bird', 'rabbit', 'small_animal'],
  emergency: true,
  latitude: 23.1291,
  longitude: 113.2644,
  city: '广州',
  type: 'emergency'
}, {
  id: 'h009',
  name: '广州瑞派宠物皮肤科中心',
  address: '广州市海珠区新港中路350号',
  phone: '020-55554444',
  distance: 5.1,
  rating: 4.6,
  openHours: '09:00-18:00',
  services: ['皮肤科专科', '过敏检测', '真菌治疗', '寄生虫防治', '药浴'],
  species: ['dog', 'cat'],
  emergency: false,
  latitude: 23.0958,
  longitude: 113.3199,
  city: '广州',
  type: 'specialist',
  specialties: ['皮肤科']
}, {
  id: 'h010',
  name: '深圳瑞鹏宠物医院（南山总院）',
  address: '深圳市南山区深南大道9966号',
  phone: '0755-88886666',
  distance: 2.5,
  rating: 4.7,
  openHours: '08:30-22:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育', '牙科', '影像科'],
  species: ['dog', 'cat', 'rabbit', 'bird'],
  emergency: false,
  latitude: 22.5431,
  longitude: 114.0579,
  city: '深圳',
  type: 'general',
  isPartner: true,
  partnerId: 'partner_h010',
  commissionRate: 0.06
}, {
  id: 'h011',
  name: '深圳联合宠物医院（24h急诊）',
  address: '深圳市福田区福华三路168号',
  phone: '0755-66668888',
  distance: 4.8,
  rating: 4.8,
  openHours: '24小时',
  services: ['24h急诊', '内科', '外科', 'ICU', '血液透析', '中毒急救'],
  species: ['dog', 'cat', 'bird', 'rabbit', 'reptile', 'small_animal'],
  emergency: true,
  latitude: 22.5431,
  longitude: 114.0579,
  city: '深圳',
  type: 'emergency'
}, {
  id: 'h012',
  name: '成都瑞派宠物医院（锦江总院）',
  address: '成都市锦江区人民南路二段80号',
  phone: '028-88889999',
  distance: 1.5,
  rating: 4.6,
  openHours: '09:00-21:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育', '影像科'],
  species: ['dog', 'cat', 'bird'],
  emergency: false,
  latitude: 30.5728,
  longitude: 104.0668,
  city: '成都',
  type: 'general'
}, {
  id: 'h013',
  name: '成都华西动物医院（24h急诊）',
  address: '成都市武侯区人民南路三段17号',
  phone: '028-66667777',
  distance: 3.2,
  rating: 4.9,
  openHours: '24小时',
  services: ['24h急诊', '内科', '外科', 'ICU', '创伤处理', '中毒急救'],
  species: ['dog', 'cat', 'bird', 'rabbit', 'small_animal'],
  emergency: true,
  latitude: 30.6359,
  longitude: 104.0607,
  city: '成都',
  type: 'emergency'
}, {
  id: 'h014',
  name: '杭州瑞鹏宠物医院（西湖分院）',
  address: '杭州市西湖区曙光路120号',
  phone: '0571-88887777',
  distance: 2.3,
  rating: 4.5,
  openHours: '09:00-21:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育', '牙科'],
  species: ['dog', 'cat', 'rabbit'],
  emergency: false,
  latitude: 30.2741,
  longitude: 120.1551,
  city: '杭州',
  type: 'general'
}, {
  id: 'h015',
  name: '杭州派希德动物医院（24h急诊）',
  address: '杭州市江干区钱江新城城星路89号',
  phone: '0571-66665555',
  distance: 5.6,
  rating: 4.7,
  openHours: '24小时',
  services: ['24h急诊', '内科', '外科', 'ICU', '中毒急救'],
  species: ['dog', 'cat', 'bird', 'rabbit', 'small_animal'],
  emergency: true,
  latitude: 30.2741,
  longitude: 120.1551,
  city: '杭州',
  type: 'emergency'
}, {
  id: 'h016',
  name: '武汉瑞派宠物医院（武昌总院）',
  address: '武汉市武昌区中南路7号',
  phone: '027-88886666',
  distance: 1.9,
  rating: 4.4,
  openHours: '09:00-21:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育'],
  species: ['dog', 'cat', 'bird'],
  emergency: false,
  latitude: 30.5928,
  longitude: 114.3055,
  city: '武汉',
  type: 'general'
}, {
  id: 'h017',
  name: '武汉联合动物医院（24h急诊）',
  address: '武汉市江汉区解放大道686号',
  phone: '027-66669999',
  distance: 4.1,
  rating: 4.6,
  openHours: '24小时',
  services: ['24h急诊', '内科', '外科', 'ICU', '创伤处理'],
  species: ['dog', 'cat', 'bird', 'rabbit'],
  emergency: true,
  latitude: 30.5928,
  longitude: 114.3055,
  city: '武汉',
  type: 'emergency'
}, {
  id: 'h018',
  name: '南京瑞鹏宠物医院（玄武分院）',
  address: '南京市玄武区中山路81号',
  phone: '025-88885555',
  distance: 2.7,
  rating: 4.5,
  openHours: '09:00-21:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育', '影像科'],
  species: ['dog', 'cat', 'rabbit'],
  emergency: false,
  latitude: 32.0603,
  longitude: 118.7969,
  city: '南京',
  type: 'general'
}, {
  id: 'h019',
  name: '西安瑞派宠物医院（雁塔总院）',
  address: '西安市雁塔区长安中路38号',
  phone: '029-88884444',
  distance: 3.3,
  rating: 4.3,
  openHours: '09:00-20:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育'],
  species: ['dog', 'cat'],
  emergency: false,
  latitude: 34.3416,
  longitude: 108.9398,
  city: '西安',
  type: 'general'
}, {
  id: 'h020',
  name: '重庆瑞鹏宠物医院（渝中总院）',
  address: '重庆市渝中区邹容路120号',
  phone: '023-88883333',
  distance: 1.6,
  rating: 4.4,
  openHours: '09:00-21:00',
  services: ['内科', '外科', '疫苗接种', '体检', '绝育', '影像科'],
  species: ['dog', 'cat', 'bird', 'rabbit'],
  emergency: false,
  latitude: 29.563,
  longitude: 106.5516,
  city: '重庆',
  type: 'general'
}];
function getNearbyHospitals(city, species) {
  var result = [].concat(HOSPITALS);
  if (city) {
    result = result.filter(function (h) {
      return h.city === city;
    });
  }
  if (species) {
    result = result.filter(function (h) {
      return h.species.includes(species);
    });
  }
  return result.sort(function (a, b) {
    return a.distance - b.distance;
  });
}
function searchHospitals(keyword) {
  if (!keyword.trim()) {
    return [].concat(HOSPITALS).sort(function (a, b) {
      return a.distance - b.distance;
    });
  }
  var lowerKeyword = keyword.toLowerCase().trim();
  return HOSPITALS.filter(function (h) {
    return h.name.toLowerCase().includes(lowerKeyword) || h.address.toLowerCase().includes(lowerKeyword) || h.services.some(function (s) {
      return s.toLowerCase().includes(lowerKeyword);
    }) || h.city.toLowerCase().includes(lowerKeyword) || h.specialties && h.specialties.some(function (s) {
      return s.toLowerCase().includes(lowerKeyword);
    });
  }).sort(function (a, b) {
    return a.distance - b.distance;
  });
}
function getHospitalById(id) {
  return HOSPITALS.find(function (h) {
    return h.id === id;
  });
}
function getEmergencyHospitals() {
  return HOSPITALS.filter(function (h) {
    return h.emergency;
  }).sort(function (a, b) {
    return a.distance - b.distance;
  });
}
function getAllCities() {
  return Array.from(new Set(HOSPITALS.map(function (h) {
    return h.city;
  })));
}
function getHospitalsByType(type) {
  return HOSPITALS.filter(function (h) {
    return h.type === type;
  }).sort(function (a, b) {
    return a.distance - b.distance;
  });
}

/***/ }),

/***/ "./src/pagesPet/hospital/index.tsx":
/*!*****************************************!*\
  !*** ./src/pagesPet/hospital/index.tsx ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_hospital_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/hospital/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/hospital/index!./src/pagesPet/hospital/index.tsx");


var config = {"navigationBarTitleText":"附近宠物医院"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_hospital_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/hospital/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_hospital_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/services/hospitalService.ts":
/*!*****************************************!*\
  !*** ./src/services/hospitalService.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "callHospital": function() { return /* binding */ callHospital; },
/* harmony export */   "getEmergencyHospitals": function() { return /* binding */ getEmergencyHospitals; },
/* harmony export */   "getNearbyHospitals": function() { return /* binding */ getNearbyHospitals; },
/* harmony export */   "navigateToHospital": function() { return /* binding */ navigateToHospital; },
/* harmony export */   "searchHospitals": function() { return /* binding */ searchHospitals; }
/* harmony export */ });
/* unused harmony exports getHospitalDetail, getRecommendedHospitals */
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _data_hospitals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../data/hospitals */ "./src/data/hospitals.ts");




function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * (Math.PI / 180);
  var dLon = (lon2 - lon1) * (Math.PI / 180);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function sortByDistance(hospitals, latitude, longitude) {
  if (latitude == null || longitude == null) {
    return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(hospitals).sort(function (a, b) {
      return a.distance - b.distance;
    });
  }
  return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(hospitals).sort(function (a, b) {
    var distA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
    var distB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
    return distA - distB;
  });
}
function getNearbyHospitals(options) {
  try {
    var _ref = options || {},
      city = _ref.city,
      species = _ref.species,
      latitude = _ref.latitude,
      longitude = _ref.longitude;
    var hospitals = (0,_data_hospitals__WEBPACK_IMPORTED_MODULE_1__.getNearbyHospitals)(city, species);
    return sortByDistance(hospitals, latitude, longitude);
  } catch (error) {
    return [];
  }
}
function searchHospitals(keyword) {
  try {
    if (!keyword || typeof keyword !== 'string') {
      return [];
    }
    return (0,_data_hospitals__WEBPACK_IMPORTED_MODULE_1__.searchHospitals)(keyword.trim());
  } catch (error) {
    return [];
  }
}
function getHospitalDetail(id) {
  try {
    if (!id || typeof id !== 'string') {
      return null;
    }
    var hospital = (0,_data_hospitals__WEBPACK_IMPORTED_MODULE_1__.getHospitalById)(id);
    return hospital || null;
  } catch (error) {
    return null;
  }
}
function getEmergencyHospitals() {
  try {
    return (0,_data_hospitals__WEBPACK_IMPORTED_MODULE_1__.getEmergencyHospitals)();
  } catch (error) {
    return [];
  }
}
function callHospital(phone) {
  try {
    if (!phone || typeof phone !== 'string') {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
        title: '电话号码无效',
        icon: 'none'
      });
      return;
    }
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().makePhoneCall({
      phoneNumber: phone.replace(/[^\d-]/g, ''),
      fail: function fail() {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  } catch (error) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
      title: '拨打电话失败',
      icon: 'none'
    });
  }
}
function navigateToHospital(latitude, longitude, name) {
  try {
    if (latitude == null || longitude == null) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
        title: '位置信息无效',
        icon: 'none'
      });
      return;
    }
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().openLocation({
      latitude: latitude,
      longitude: longitude,
      name: name,
      address: '',
      fail: function fail() {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
          title: '打开导航失败',
          icon: 'none'
        });
      }
    });
  } catch (error) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
      title: '导航失败',
      icon: 'none'
    });
  }
}
var SYMPTOM_TO_SPECIALTY = {
  eye: ['眼科', '眼科专科', '白内障手术', '青光眼治疗'],
  vision: ['眼科', '眼科专科'],
  bone: ['骨科', '骨科专科', '关节置换', '脊柱手术'],
  joint: ['骨科', '骨科专科', '关节置换'],
  fracture: ['骨科', '骨科专科', '创伤处理'],
  skin: ['皮肤科', '皮肤科专科', '过敏检测', '真菌治疗'],
  allergy: ['皮肤科', '皮肤科专科', '过敏检测'],
  rash: ['皮肤科', '皮肤科专科'],
  emergency: ['24h急诊', '急诊', 'ICU', '中毒急救', '创伤处理'],
  poisoning: ['24h急诊', '中毒急救'],
  trauma: ['24h急诊', '创伤处理', '外科'],
  surgery: ['外科', '手术'],
  dental: ['牙科', '口腔'],
  internal: ['内科'],
  vaccine: ['疫苗接种'],
  checkup: ['体检']
};
function getRecommendedHospitals(petId, symptoms) {
  try {
    var allHospitals = (0,_data_hospitals__WEBPACK_IMPORTED_MODULE_1__.getNearbyHospitals)();
    var recommendations = [];
    if (!symptoms || symptoms.length === 0) {
      return allHospitals.slice(0, 5).map(function (hospital) {
        return {
          hospital: hospital,
          reason: '综合推荐',
          relevanceScore: 0.5
        };
      });
    }
    var matchedSpecialties = new Set();
    symptoms.forEach(function (symptom) {
      var lowerSymptom = symptom.toLowerCase();
      Object.entries(SYMPTOM_TO_SPECIALTY).forEach(function (_ref2) {
        var _ref3 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_ref2, 2),
          key = _ref3[0],
          specialties = _ref3[1];
        if (lowerSymptom.includes(key)) {
          specialties.forEach(function (s) {
            return matchedSpecialties.add(s);
          });
        }
      });
    });
    if (matchedSpecialties.size === 0) {
      return allHospitals.slice(0, 5).map(function (hospital) {
        return {
          hospital: hospital,
          reason: '综合推荐',
          relevanceScore: 0.5
        };
      });
    }
    allHospitals.forEach(function (hospital) {
      var score = 0;
      var matchedServices = [];
      hospital.services.forEach(function (service) {
        matchedSpecialties.forEach(function (specialty) {
          if (service.includes(specialty)) {
            score += 1;
            if (!matchedServices.includes(specialty)) {
              matchedServices.push(specialty);
            }
          }
        });
      });
      if (hospital.specialties) {
        hospital.specialties.forEach(function (specialty) {
          matchedSpecialties.forEach(function (matched) {
            if (specialty.includes(matched) || matched.includes(specialty)) {
              score += 2;
            }
          });
        });
      }
      if (hospital.emergency && symptoms.some(function (s) {
        var lower = s.toLowerCase();
        return lower.includes('emergency') || lower.includes('urgent') || lower.includes('中毒') || lower.includes('创伤');
      })) {
        score += 3;
      }
      if (score > 0) {
        var reason = matchedServices.length > 0 ? "\u64C5\u957F\uFF1A".concat(matchedServices.slice(0, 3).join('、')) : '专科匹配';
        recommendations.push({
          hospital: hospital,
          reason: reason,
          relevanceScore: score
        });
      }
    });
    return recommendations.sort(function (a, b) {
      return b.relevanceScore - a.relevanceScore;
    }).slice(0, 10);
  } catch (error) {
    return [];
  }
}

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["sub-common/6445d8bdf2172a6fd6abee9a9e2cae24","sub-common/a80d2ee33a59c94051f538ac359a531d","sub-common/53c676dc54a90fa031d0d212976af696","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/hospital/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map