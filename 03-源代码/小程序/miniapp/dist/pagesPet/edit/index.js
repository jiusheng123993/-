"use strict";require("../sub-vendors.js");require("../sub-common/6445d8bdf2172a6fd6abee9a9e2cae24.js");require("../sub-common/a80d2ee33a59c94051f538ac359a531d.js");require("../sub-common/ad46eb011750498141202c06d6a54fd7.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pagesPet/edit/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/edit/index!./src/pagesPet/edit/index.tsx":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/edit/index!./src/pagesPet/edit/index.tsx ***!
  \********************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ EditPet; }
/* harmony export */ });
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../hooks/useThemeClass */ "./src/hooks/useThemeClass.ts");
/* harmony import */ var _hooks_usePet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../hooks/usePet */ "./src/hooks/usePet.ts");
/* harmony import */ var _stores_authStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../stores/authStore */ "./src/stores/authStore.ts");
/* harmony import */ var _data_petKnowledge_breeds__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../data/petKnowledge/breeds */ "./src/data/petKnowledge/breeds.ts");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../hooks/useAnalytics */ "./src/hooks/useAnalytics.ts");
/* harmony import */ var _utils_navigation__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../utils/navigation */ "./src/utils/navigation.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");
















var INITIAL_FORM = {
  name: '',
  species: '',
  breedId: '',
  breedName: '',
  gender: '',
  birthDate: '',
  weight: '',
  coatColor: '',
  isNeutered: false,
  microchipId: '',
  allergies: '',
  medications: '',
  chronicConditions: '',
  notes: '',
  avatarUrl: ''
};
function EditPet() {
  var themeClass = (0,_hooks_useThemeClass__WEBPACK_IMPORTED_MODULE_0__.useThemeClass)();
  var _usePet = (0,_hooks_usePet__WEBPACK_IMPORTED_MODULE_1__.usePet)(),
    pets = _usePet.pets,
    updatePet = _usePet.updatePet;
  var _useAnalytics = (0,_hooks_useAnalytics__WEBPACK_IMPORTED_MODULE_6__.useAnalytics)(),
    trackPageView = _useAnalytics.trackPageView,
    trackEvent = _useAnalytics.trackEvent;
  var userId = (0,_stores_authStore__WEBPACK_IMPORTED_MODULE_2__.useAuthStore)(function (s) {
    var _s$user;
    return (_s$user = s.user) === null || _s$user === void 0 ? void 0 : _s$user.id;
  }) || '';
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, INITIAL_FORM)),
    _useState2 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_10__["default"])(_useState, 2),
    formData = _useState2[0],
    setFormData = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState4 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_10__["default"])(_useState3, 2),
    submitting = _useState4[0],
    setSubmitting = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState6 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_10__["default"])(_useState5, 2),
    petId = _useState6[0],
    setPetId = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(null),
    _useState8 = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_10__["default"])(_useState7, 2),
    selectedBreed = _useState8[0],
    setSelectedBreed = _useState8[1];
  (0,react__WEBPACK_IMPORTED_MODULE_5__.useEffect)(function () {
    trackPageView('edit_pet');
  }, [trackPageView]);
  (0,react__WEBPACK_IMPORTED_MODULE_5__.useEffect)(function () {
    var _instance$router;
    var instance = _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().getCurrentInstance();
    var id = (_instance$router = instance.router) === null || _instance$router === void 0 || (_instance$router = _instance$router.params) === null || _instance$router === void 0 ? void 0 : _instance$router.id;
    if (!id) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(function () {
        (0,_utils_navigation__WEBPACK_IMPORTED_MODULE_7__.safeNavigateBack)();
      }, 1500);
      return;
    }
    setPetId(id);
    var pet = pets.find(function (p) {
      return p.id === id;
    });
    if (pet) {
      setFormData({
        name: pet.name,
        species: pet.species,
        breedId: pet.breedId || '',
        breedName: pet.breed || '',
        gender: pet.gender === 'male' || pet.gender === 'female' ? pet.gender : '',
        birthDate: pet.birthDate,
        weight: pet.weight ? String(pet.weight) : '',
        coatColor: pet.coatColor || '',
        isNeutered: pet.isNeutered,
        microchipId: pet.microchipId || '',
        allergies: (pet.allergies || []).join('、'),
        medications: (pet.medications || []).join('、'),
        chronicConditions: (pet.chronicConditions || []).join('、'),
        notes: pet.notes || '',
        avatarUrl: pet.avatarPhotoUrl || ''
      });
      if (pet.breedId) {
        var breed = _data_petKnowledge_breeds__WEBPACK_IMPORTED_MODULE_3__.BREED_DATA.find(function (b) {
          return b.id === pet.breedId;
        });
        if (breed) setSelectedBreed(breed);
      }
    }
  }, [pets]);
  var filteredBreeds = (0,react__WEBPACK_IMPORTED_MODULE_5__.useMemo)(function () {
    if (!formData.species) return [];
    return _data_petKnowledge_breeds__WEBPACK_IMPORTED_MODULE_3__.BREED_DATA.filter(function (b) {
      return b.species === formData.species;
    });
  }, [formData.species]);
  var breedOptions = (0,react__WEBPACK_IMPORTED_MODULE_5__.useMemo)(function () {
    return filteredBreeds.map(function (b) {
      return {
        value: b.id,
        label: b.aliases.length > 0 ? "".concat(b.name, "\uFF08").concat(b.aliases[0], "\uFF09") : b.name
      };
    });
  }, [filteredBreeds]);
  var selectedBreedIndex = (0,react__WEBPACK_IMPORTED_MODULE_5__.useMemo)(function () {
    return breedOptions.findIndex(function (b) {
      return b.value === formData.breedId;
    });
  }, [breedOptions, formData.breedId]);
  var updateField = function updateField(key, value) {
    setFormData(function (prev) {
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])((0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_9__["default"])({}, prev), {}, (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_11__["default"])({}, key, value));
    });
  };
  var handleSpeciesChange = function handleSpeciesChange(species) {
    trackEvent('select_species', {
      species: species
    });
    updateField('species', species);
    updateField('breedId', '');
    updateField('breedName', '');
    setSelectedBreed(null);
  };
  var handleBreedChange = function handleBreedChange(e) {
    var index = e.detail.value;
    var breed = filteredBreeds[index];
    if (breed) {
      updateField('breedId', breed.id);
      updateField('breedName', breed.name);
      setSelectedBreed(breed);
    }
  };
  var handleBirthDateChange = function handleBirthDateChange(e) {
    updateField('birthDate', e.detail.value);
  };
  var handleChooseAvatar = function handleChooseAvatar() {
    trackEvent('choose_avatar');
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function success(res) {
        updateField('avatarUrl', res.tempFilePaths[0]);
      }
    });
  };
  var validate = function validate() {
    if (!formData.name.trim()) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '请输入宠物名字',
        icon: 'none'
      });
      return false;
    }
    if (!formData.species) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '请选择物种',
        icon: 'none'
      });
      return false;
    }
    if (!formData.breedId) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '请选择品种',
        icon: 'none'
      });
      return false;
    }
    if (!formData.gender) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '请选择性别',
        icon: 'none'
      });
      return false;
    }
    if (!formData.birthDate) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '请选择出生日期',
        icon: 'none'
      });
      return false;
    }
    return true;
  };
  var handleSubmit = /*#__PURE__*/function () {
    var _ref = (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_12__["default"])(/*#__PURE__*/(0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])().m(function _callee() {
      var message, _t;
      return (0,E_03_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_13__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (validate()) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            if (petId) {
              _context.n = 2;
              break;
            }
            return _context.a(2);
          case 2:
            setSubmitting(true);
            _context.p = 3;
            _context.n = 4;
            return updatePet(petId, {
              name: formData.name.trim(),
              species: formData.species,
              breed: formData.breedName,
              breedId: formData.breedId,
              gender: formData.gender,
              birthDate: formData.birthDate,
              weight: formData.weight ? parseFloat(formData.weight) : 0,
              coatColor: formData.coatColor.trim(),
              avatarPhotoUrl: formData.avatarUrl,
              photos: formData.avatarUrl ? [formData.avatarUrl] : [],
              isNeutered: formData.isNeutered,
              microchipId: formData.microchipId.trim(),
              allergies: formData.allergies ? formData.allergies.split(/[,，]/).map(function (s) {
                return s.trim();
              }).filter(Boolean) : [],
              medications: formData.medications ? formData.medications.split(/[,，]/).map(function (s) {
                return s.trim();
              }).filter(Boolean) : [],
              chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(/[,，]/).map(function (s) {
                return s.trim();
              }).filter(Boolean) : [],
              notes: formData.notes.trim(),
              userId: userId
            });
          case 4:
            trackEvent('edit_pet_success', {
              petId: petId
            });
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '保存成功',
              icon: 'success'
            });
            setTimeout(function () {
              (0,_utils_navigation__WEBPACK_IMPORTED_MODULE_7__.safeNavigateBack)();
            }, 1500);
            _context.n = 6;
            break;
          case 5:
            _context.p = 5;
            _t = _context.v;
            trackEvent('edit_pet_failure');
            message = _t instanceof Error ? _t.message : '保存失败，请重试';
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: message,
              icon: 'none'
            });
          case 6:
            _context.p = 6;
            setSubmitting(false);
            return _context.f(6);
          case 7:
            return _context.a(2);
        }
      }, _callee, null, [[3, 5, 6, 7]]);
    }));
    return function handleSubmit() {
      return _ref.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
    className: "add-pet ".concat(themeClass),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
      className: "add-pet__form",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label add-pet__label--required",
          children: "\u540D\u5B57"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
          className: "add-pet__input",
          placeholder: "\u8BF7\u8F93\u5165\u5BA0\u7269\u540D\u5B57",
          placeholderClass: "add-pet__input-placeholder",
          value: formData.name,
          onInput: function onInput(e) {
            return updateField('name', e.detail.value);
          },
          maxlength: 20
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label add-pet__label--required",
          children: "\u7269\u79CD"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "add-pet__species-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__species-btn ".concat(formData.species === 'dog' ? 'add-pet__species-btn--active' : ''),
            onClick: function onClick() {
              return handleSpeciesChange('dog');
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "add-pet__species-icon",
              children: "\uD83D\uDC15"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\u72D7\u72D7"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__species-btn ".concat(formData.species === 'cat' ? 'add-pet__species-btn--active' : ''),
            onClick: function onClick() {
              return handleSpeciesChange('cat');
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "add-pet__species-icon",
              children: "\uD83D\uDC31"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\u732B\u732B"
            })]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label add-pet__label--required",
          children: "\u54C1\u79CD"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Picker, {
          mode: "selector",
          range: breedOptions,
          rangeKey: "label",
          value: selectedBreedIndex >= 0 ? selectedBreedIndex : 0,
          onChange: handleBreedChange,
          disabled: !formData.species,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__picker",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: formData.breedName ? '' : 'add-pet__picker-placeholder',
              children: formData.breedName || '请选择品种'
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "add-pet__picker-arrow",
              children: "\u25BC"
            })]
          })
        })]
      }), selectedBreed && (selectedBreed.geneticDiseases.length > 0 || selectedBreed.dietRestrictions.length > 0) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__breed-info",
        children: [selectedBreed.geneticDiseases.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "add-pet__breed-info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
            className: "add-pet__breed-info-label",
            children: "\u9057\u4F20\u75C5\u6613\u611F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__breed-info-tags",
            children: selectedBreed.geneticDiseases.map(function (d) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "add-pet__breed-info-tag add-pet__breed-info-tag--warn",
                children: ["\u26A0\uFE0F", d]
              }, d);
            })
          })]
        }), selectedBreed.dietRestrictions.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "add-pet__breed-info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
            className: "add-pet__breed-info-label",
            children: "\u996E\u98DF\u7981\u5FCC"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__breed-info-tags",
            children: selectedBreed.dietRestrictions.map(function (d) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
                className: "add-pet__breed-info-tag add-pet__breed-info-tag--danger",
                children: ["\uD83D\uDEAB", d]
              }, d);
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "add-pet__breed-info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
            className: "add-pet__breed-info-label",
            children: "\u5EFA\u8BAE\u4F53\u91CD"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
            className: "add-pet__breed-info-value",
            children: [selectedBreed.weightRange.min, "-", selectedBreed.weightRange.max, "kg"]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label add-pet__label--required",
          children: "\u6027\u522B"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "add-pet__gender-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__gender-btn ".concat(formData.gender === 'male' ? 'add-pet__gender-btn--active' : ''),
            onClick: function onClick() {
              return updateField('gender', 'male');
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\u2642\uFE0F"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\u516C"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__gender-btn ".concat(formData.gender === 'female' ? 'add-pet__gender-btn--active' : ''),
            onClick: function onClick() {
              return updateField('gender', 'female');
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\u2640\uFE0F"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\u6BCD"
            })]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label add-pet__label--required",
          children: "\u51FA\u751F\u65E5\u671F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Picker, {
          mode: "date",
          value: formData.birthDate,
          onChange: handleBirthDateChange,
          end: new Date().toISOString().split('T')[0],
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__picker",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: formData.birthDate ? '' : 'add-pet__picker-placeholder',
              children: formData.birthDate || '请选择出生日期'
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "add-pet__picker-arrow",
              children: "\u25BC"
            })]
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u4F53\u91CD\uFF08kg\uFF09"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
          className: "add-pet__input",
          placeholder: "\u8BF7\u8F93\u5165\u4F53\u91CD",
          placeholderClass: "add-pet__input-placeholder",
          type: "digit",
          value: formData.weight,
          onInput: function onInput(e) {
            return updateField('weight', e.detail.value);
          }
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u6BDB\u8272"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
          className: "add-pet__input",
          placeholder: "\u5982\uFF1A\u6A58\u8272\u3001\u9ED1\u767D\u3001\u4E09\u82B1",
          placeholderClass: "add-pet__input-placeholder",
          value: formData.coatColor,
          onInput: function onInput(e) {
            return updateField('coatColor', e.detail.value);
          }
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u662F\u5426\u7EDD\u80B2"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "add-pet__switch-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
            className: "add-pet__switch-label",
            children: formData.isNeutered ? '已绝育' : '未绝育'
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Switch, {
            checked: formData.isNeutered,
            onChange: function onChange(e) {
              return updateField('isNeutered', e.detail.value);
            },
            color: "#FF8C42"
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u82AF\u7247\u53F7"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
          className: "add-pet__input",
          placeholder: "\u8BF7\u8F93\u5165\u82AF\u7247\u53F7",
          placeholderClass: "add-pet__input-placeholder",
          value: formData.microchipId,
          onInput: function onInput(e) {
            return updateField('microchipId', e.detail.value);
          },
          maxlength: 30
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u8FC7\u654F\u53F2"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
          className: "add-pet__input",
          placeholder: "\u5982\uFF1A\u9E21\u8089\u3001\u82B1\u7C89\uFF08\u9017\u53F7\u5206\u9694\uFF09",
          placeholderClass: "add-pet__input-placeholder",
          value: formData.allergies,
          onInput: function onInput(e) {
            return updateField('allergies', e.detail.value);
          }
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u7528\u836F\u53F2"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
          className: "add-pet__input",
          placeholder: "\u5982\uFF1A\u5FC3\u810F\u836F\u3001\u5173\u8282\u4FDD\u5065\u54C1\uFF08\u9017\u53F7\u5206\u9694\uFF09",
          placeholderClass: "add-pet__input-placeholder",
          value: formData.medications,
          onInput: function onInput(e) {
            return updateField('medications', e.detail.value);
          }
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u6162\u6027\u75C5"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Input, {
          className: "add-pet__input",
          placeholder: "\u5982\uFF1A\u7CD6\u5C3F\u75C5\u3001\u5173\u8282\u708E\uFF08\u9017\u53F7\u5206\u9694\uFF09",
          placeholderClass: "add-pet__input-placeholder",
          value: formData.chronicConditions,
          onInput: function onInput(e) {
            return updateField('chronicConditions', e.detail.value);
          }
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u5907\u6CE8"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Textarea, {
          className: "add-pet__textarea",
          placeholder: "\u5907\u6CE8\u4FE1\u606F\uFF08\u9009\u586B\uFF09",
          placeholderClass: "add-pet__textarea-placeholder",
          value: formData.notes,
          onInput: function onInput(e) {
            return updateField('notes', e.detail.value);
          },
          maxlength: 200
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          className: "add-pet__label",
          children: "\u5934\u50CF"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
          className: "add-pet__photo-area",
          onClick: handleChooseAvatar,
          children: formData.avatarUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Image, {
            className: "add-pet__photo-preview",
            src: formData.avatarUrl,
            mode: "aspectFill",
            lazyLoad: true
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
            className: "add-pet__photo-placeholder",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              className: "add-pet__photo-icon",
              children: "\uD83D\uDCF7"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
              children: "\u70B9\u51FB\u9009\u62E9\u7167\u7247"
            })]
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
      className: "add-pet__submit-wrap",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.View, {
        className: "add-pet__submit-btn ".concat(submitting ? 'add-pet__submit-btn--disabled' : ''),
        onClick: submitting ? undefined : handleSubmit,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_14__.Text, {
          children: submitting ? '保存中...' : '保存'
        })
      })
    })]
  });
}

/***/ }),

/***/ "./src/pagesPet/edit/index.tsx":
/*!*************************************!*\
  !*** ./src/pagesPet/edit/index.tsx ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_edit_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/edit/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pagesPet/edit/index!./src/pagesPet/edit/index.tsx");


var config = {"navigationBarTitleText":"编辑宠物"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_edit_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pagesPet/edit/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pagesPet_edit_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["pagesPet/sub-vendors","sub-common/6445d8bdf2172a6fd6abee9a9e2cae24","sub-common/a80d2ee33a59c94051f538ac359a531d","sub-common/ad46eb011750498141202c06d6a54fd7","taro","vendors","common"], function() { return __webpack_exec__("./src/pagesPet/edit/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map