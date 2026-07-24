"use strict";require("../sub-vendors.js");require("../sub-common/6445d8bdf2172a6fd6abee9a9e2cae24.js");require("../sub-common/a80d2ee33a59c94051f538ac359a531d.js");require("../sub-common/ad46eb011750498141202c06d6a54fd7.js");require("../sub-common/53c676dc54a90fa031d0d212976af696.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/breed-detail/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/breed-detail/index!./src/pagesPet/breed-detail/index.tsx":
/*!************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/breed-detail/index!./src/pagesPet/breed-detail/index.tsx ***!
  \************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ BreedDetail; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _data_petKnowledge_breeds__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../data/petKnowledge/breeds */ "./src/data/petKnowledge/breeds.ts");
/* harmony import */ var _engines_petSafety_MedicalDisclaimer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../engines/petSafety/MedicalDisclaimer */ "./src/engines/petSafety/MedicalDisclaimer.ts");
/* harmony import */ var _hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../hooks/useAnalytics */ "./src/hooks/useAnalytics.ts");
/* harmony import */ var _constants_analyticsEvents__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../constants/analyticsEvents */ "./src/constants/analyticsEvents.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");










var disclaimerText = new _engines_petSafety_MedicalDisclaimer__WEBPACK_IMPORTED_MODULE_3__.MedicalDisclaimer().getDisclaimer('green', 'breed');
var SPECIES_LABEL = {
  dog: '犬类',
  cat: '猫类'
};
var SPECIES_EMOJI = {
  dog: '🐶',
  cat: '🐱'
};
var SIZE_LABEL = {
  toy: '超小型',
  small: '小型',
  medium: '中型',
  large: '大型',
  giant: '巨型'
};
var EXERCISE_LABEL = {
  low: '低',
  medium: '中',
  high: '高'
};
var GROOMING_LABEL = {
  low: '低',
  medium: '中',
  high: '高'
};
function BreedDetail() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_7__["default"])(_useState, 2),
    breed = _useState2[0],
    setBreed = _useState2[1];
  var router = (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__.useRouter)();
  var _useAnalytics = (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_4__.useAnalytics)(),
    trackEvent = _useAnalytics.trackEvent;
  (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_4__.usePageView)('breed_detail');
  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    var id = router.params.id;
    if (id) {
      var found = _data_petKnowledge_breeds__WEBPACK_IMPORTED_MODULE_2__.BREED_DATA.find(function (b) {
        return b.id === id;
      });
      if (found) {
        setBreed(found);
        trackEvent(_constants_analyticsEvents__WEBPACK_IMPORTED_MODULE_5__.EVENT.BREED_VIEW, {
          breedId: found.id,
          breedName: found.name
        });
      }
    }
  }, [router.params.id]);
  var handleSetMyPet = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function () {
    if (!breed) return;
    trackEvent('set_my_pet_breed', {
      breedId: breed.id,
      breedName: breed.name
    });
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().navigateTo({
      url: "/pagesPet/edit/index?breedId=".concat(breed.id, "&breedName=").concat(encodeURIComponent(breed.name), "&species=").concat(breed.species)
    });
  }, [breed, trackEvent]);
  if (!breed) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
      className: "breed-detail",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__loading",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__loading-text",
          children: "\u52A0\u8F7D\u4E2D..."
        })
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
    className: "breed-detail",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.ScrollView, {
      className: "breed-detail__scroll",
      scrollY: true,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__hero",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__hero-emoji",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__hero-emoji-text",
            children: SPECIES_EMOJI[breed.species]
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__hero-name",
          children: breed.name
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__hero-badges",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
            className: "breed-detail__hero-badge",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
              children: SPECIES_LABEL[breed.species]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
            className: "breed-detail__hero-badge",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
              children: SIZE_LABEL[breed.size]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
            className: "breed-detail__hero-badge",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
              children: breed.origin
            })
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__info-grid",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__info-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__info-label",
            children: "\u5BFF\u547D"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__info-value",
            children: breed.lifespan
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__info-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__info-label",
            children: "\u4F53\u91CD"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__info-value",
            children: breed.weightRangeStr
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__info-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__info-label",
            children: "\u8FD0\u52A8\u9700\u6C42"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__info-value",
            children: EXERCISE_LABEL[breed.exerciseNeeds]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__info-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__info-label",
            children: "\u7F8E\u5BB9\u9700\u6C42"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "breed-detail__info-value",
            children: GROOMING_LABEL[breed.groomingNeeds]
          })]
        })]
      }), breed.aliases.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__section-title",
          children: "\u522B\u540D"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__tags",
          children: breed.aliases.map(function (alias) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
              className: "breed-detail__tag",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                children: alias
              })
            }, alias);
          })
        })]
      }), breed.temperament.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__section-title",
          children: "\u6027\u683C\u7279\u5F81"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__tags",
          children: breed.temperament.map(function (t) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
              className: "breed-detail__tag breed-detail__tag--primary",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                children: t
              })
            }, t);
          })
        })]
      }), breed.suitableFor.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__section-title",
          children: "\u9002\u5408\u4EBA\u7FA4"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__tags",
          children: breed.suitableFor.map(function (s) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
              className: "breed-detail__tag breed-detail__tag--green",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                children: s
              })
            }, s);
          })
        })]
      }), breed.toxicFoods.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__section-title breed-detail__section-title--danger",
          children: "\u26A0\uFE0F \u996E\u98DF\u7981\u5FCC"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__danger-list",
          children: breed.toxicFoods.map(function (food) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
              className: "breed-detail__danger-card",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                className: "breed-detail__danger-icon",
                children: "\uD83D\uDEAB"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                className: "breed-detail__danger-text",
                children: food
              })]
            }, food);
          })
        })]
      }), breed.commonDiseases.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__section-title breed-detail__section-title--warning",
          children: "\u26A1 \u5E38\u89C1\u75BE\u75C5"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__warning-list",
          children: breed.commonDiseases.map(function (disease) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
              className: "breed-detail__warning-card",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                className: "breed-detail__warning-icon",
                children: "\uD83D\uDCA1"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                className: "breed-detail__warning-text",
                children: disease
              })]
            }, disease);
          })
        })]
      }), breed.careTips.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__section-title breed-detail__section-title--success",
          children: "\uD83D\uDC9A \u517B\u62A4\u5EFA\u8BAE"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__success-list",
          children: breed.careTips.map(function (tip, index) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
              className: "breed-detail__success-card",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                className: "breed-detail__success-index",
                children: index + 1
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                className: "breed-detail__success-text",
                children: tip
              })]
            }, index);
          })
        })]
      }), breed.dietRestrictions.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__section-title",
          children: "\u996E\u98DF\u5EFA\u8BAE"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "breed-detail__list",
          children: breed.dietRestrictions.map(function (item) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
              className: "breed-detail__list-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                className: "breed-detail__list-dot",
                children: "\u2022"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                className: "breed-detail__list-text",
                children: item
              })]
            }, item);
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__disclaimer",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__disclaimer-text",
          children: disclaimerText
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__bottom-spacer"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
      className: "breed-detail__footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "breed-detail__footer-btn",
        onClick: handleSetMyPet,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "breed-detail__footer-btn-text",
          children: "\u6211\u7684\u5BA0\u7269\u662F\u8FD9\u4E2A\u54C1\u79CD"
        })
      })
    })]
  });
}

/***/ }),

/***/ "./src/constants/analyticsEvents.ts":
/*!******************************************!*\
  !*** ./src/constants/analyticsEvents.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EVENT": function() { return /* binding */ EVENT; }
/* harmony export */ });
/* harmony import */ var _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../types/analyticsTypes */ "./src/types/analyticsTypes.ts");

var EVENT = {
  USER_REGISTER: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.UserRegister,
  PET_CREATE: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.PetCreate,
  CHECKIN_SUBMIT: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.CheckinSubmit,
  CHECKIN_ANOMALY: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.CheckinAnomaly,
  FOOD_QUERY: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.FoodQuery,
  SYMPTOM_CHECK: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.SymptomCheck,
  EMERGENCY_ALERT: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.EmergencyAlert,
  VACCINE_REMINDER_CLICK: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.VaccineReminderClick,
  VACCINE_DONE: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.VaccineDone,
  MEMBER_PAGE_VIEW: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.MemberPageView,
  MEMBER_SUBSCRIBE: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.MemberSubscribe,
  SHARE_ACTION: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.ShareAction,
  EMOTION_TRIGGER: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.EmotionTrigger,
  FIND_HOSPITAL: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.FindHospital,
  PAGE_VIEW: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.PageView,
  FUNNEL_STEP: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.FunnelStep,
  BREED_VIEW: _types_analyticsTypes__WEBPACK_IMPORTED_MODULE_0__.AnalyticsEventName.BreedView
};

/***/ }),

/***/ "./src/pagesPet/breed-detail/index.tsx":
/*!*********************************************!*\
  !*** ./src/pagesPet/breed-detail/index.tsx ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_breed_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/breed-detail/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/breed-detail/index!./src/pagesPet/breed-detail/index.tsx");


var config = {};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_breed_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/breed-detail/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_breed_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["pagesPet/sub-vendors","sub-common/6445d8bdf2172a6fd6abee9a9e2cae24","sub-common/a80d2ee33a59c94051f538ac359a531d","sub-common/ad46eb011750498141202c06d6a54fd7","sub-common/53c676dc54a90fa031d0d212976af696","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/breed-detail/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map