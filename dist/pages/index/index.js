"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/index/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ActivityTab; }
/* harmony export */ });
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/api */ "./src/services/api.ts");
/* harmony import */ var _services_auth__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../services/auth */ "./src/services/auth.ts");
/* harmony import */ var _services_demoData__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../services/demoData */ "./src/services/demoData.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);











var CITIES = ['全部', '杭州', '上海', '深圳', '北京', '线上'];
var ALL_CITIES_FILTER = ['杭州', '上海', '深圳', '北京'];
function ActivityTab() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]),
    _useState2 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState, 2),
    list = _useState2[0],
    setList = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)((0,_services_auth__WEBPACK_IMPORTED_MODULE_3__.getSavedCity)() || '全部'),
    _useState4 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState3, 2),
    city = _useState4[0],
    setCity = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true),
    _useState6 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState8 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState7, 2),
    showConsent = _useState8[0],
    setShowConsent = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState0 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState9, 2),
    showLoginSheet = _useState0[0],
    setShowLoginSheet = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState10 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState1, 2),
    loginLoading = _useState10[0],
    setLoginLoading = _useState10[1];
  var _useState11 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)((0,_services_api__WEBPACK_IMPORTED_MODULE_2__.isLoggedIn)()),
    _useState12 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState11, 2),
    loggedIn = _useState12[0],
    setLoggedIn = _useState12[1];

  // Check consent on first load
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    if (!(0,_services_auth__WEBPACK_IMPORTED_MODULE_3__.getConsent)()) {
      setShowConsent(true);
      setLoading(false);
      return;
    }
    fetchActivities();
  }, []);
  var fetchActivities = function fetchActivities() {
    setLoading(true);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().request({
      url: "".concat(_services_api__WEBPACK_IMPORTED_MODULE_2__.BASE_URL, "/api/activities?status=PUBLISHED"),
      header: {
        Authorization: "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().getStorageSync('token'))
      }
    }).then(function (res) {
      var body = res.data;
      if (body.code === 0 && body.data && body.data.length > 0) {
        setList(body.data);
      } else {
        setList(_services_demoData__WEBPACK_IMPORTED_MODULE_4__.DEMO_ACTIVITIES);
      }
    }).catch(function () {
      setList(_services_demoData__WEBPACK_IMPORTED_MODULE_4__.DEMO_ACTIVITIES);
    }).finally(function () {
      return setLoading(false);
    });
  };
  var handleAgree = function handleAgree() {
    (0,_services_auth__WEBPACK_IMPORTED_MODULE_3__.setConsent)(true);
    setShowConsent(false);
    fetchActivities();
  };
  var handleCityChange = function handleCityChange(c) {
    setCity(c);
    (0,_services_auth__WEBPACK_IMPORTED_MODULE_3__.setSavedCity)(c);
  };
  var handlePhoneLogin = /*#__PURE__*/function () {
    var _ref = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().m(function _callee() {
      var result, _t;
      return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            setLoginLoading(true);
            _context.p = 1;
            _context.n = 2;
            return (0,_services_auth__WEBPACK_IMPORTED_MODULE_3__.doLogin)();
          case 2:
            result = _context.v;
            if (result.token) {
              setLoggedIn(true);
              setShowLoginSheet(false);
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                title: '登录成功',
                icon: 'success'
              });
              // Ask for location after login
              setTimeout(function () {
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().getLocation({
                  type: 'gcj02'
                }).then(function (loc) {
                  // Location granted — could update city recommendation
                }).catch(function () {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                    title: '可在设置中授权位置以推荐附近活动',
                    icon: 'none',
                    duration: 2000
                  });
                });
              }, 1500);
            }
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: _t.message || '登录失败',
              icon: 'none'
            });
          case 4:
            setLoginLoading(false);
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[1, 3]]);
    }));
    return function handlePhoneLogin() {
      return _ref.apply(this, arguments);
    };
  }();
  var handleGuest = function handleGuest() {
    setShowLoginSheet(false);
  };

  // Protected action wrapper
  var requireLogin = function requireLogin(action) {
    if ((0,_services_api__WEBPACK_IMPORTED_MODULE_2__.isLoggedIn)()) {
      action();
    } else {
      setShowLoginSheet(true);
    }
  };

  // ===== Consent Overlay (first visit) =====
  if (showConsent) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      style: {
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(24,35,30,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32rpx'
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        style: {
          width: '100%',
          maxWidth: '640rpx',
          background: '#FBFAF6',
          borderRadius: '40rpx',
          padding: '56rpx 40rpx 40rpx',
          textAlign: 'center'
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          style: {
            fontSize: '44rpx',
            fontWeight: 600,
            color: '#18231E',
            display: 'block',
            marginBottom: '16rpx'
          },
          children: "\u884C\u8005\u5B66\u793E"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          style: {
            fontSize: '30rpx',
            color: '#7A8178',
            display: 'block',
            marginBottom: '40rpx',
            lineHeight: 1.6
          },
          children: "\u5728\u884C\u8D70\u4E2D\u6062\u590D\u79E9\u5E8F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          style: {
            textAlign: 'left',
            marginBottom: '40rpx'
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
            style: {
              fontSize: '28rpx',
              color: '#7A8178',
              lineHeight: 1.8,
              display: 'block',
              marginBottom: '16rpx'
            },
            children: "\u884C\u8005\u5B66\u793E\u662F\u4E00\u4E2A\u5E2E\u52A9\u57CE\u5E02\u4EBA\u53C2\u4E0E\u6237\u5916\u6D3B\u52A8\u3001\u7559\u4E0B\u8DB3\u8FF9\u3001\u5B8C\u6210\u89C9\u5BDF\u7684\u6570\u5B57\u7A7A\u95F4\u3002"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
            style: {
              fontSize: '26rpx',
              color: '#A6AAA2',
              lineHeight: 1.6,
              display: 'block'
            },
            children: "\u6211\u4EEC\u5C06\u7533\u8BF7\u83B7\u53D6\u4F60\u7684\u4F4D\u7F6E\u4FE1\u606F\uFF0C\u7528\u4E8E\u63A8\u8350\u9644\u8FD1\u7684\u6D3B\u52A8\u3002\u4F60\u53EF\u4EE5\u5728\u8BBE\u7F6E\u4E2D\u968F\u65F6\u7BA1\u7406\u6388\u6743\u3002"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Button, {
          style: {
            width: '100%',
            height: '96rpx',
            lineHeight: '96rpx',
            fontSize: '32rpx',
            fontWeight: 500,
            borderRadius: '999rpx',
            background: '#18231E',
            color: '#FBFAF6',
            border: 'none'
          },
          onClick: handleAgree,
          children: "\u540C\u610F\u5E76\u7EE7\u7EED"
        })]
      })
    });
  }

  // ===== Main Page =====
  var filtered = city === '全部' ? list : list.filter(function (a) {
    var loc = (a.location || '').toLowerCase();
    if (city === '线上') return !ALL_CITIES_FILTER.some(function (c) {
      return loc.includes(c);
    });
    return loc.includes(city);
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
    className: "activity-home",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "activity-home-header",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "home-brand",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "home-brand-text",
          children: "\u884C\u8005\u5B66\u793E"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "home-brand-sub",
          children: "\u5728\u884C\u8D70\u4E2D\u6062\u590D\u79E9\u5E8F"
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.ScrollView, {
      className: "city-bar",
      scrollX: true,
      children: CITIES.map(function (c) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          className: "city-tag ".concat(c === city ? 'active' : ''),
          onClick: function onClick() {
            return handleCityChange(c);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
            className: "city-text",
            children: c
          })
        }, c);
      })
    }), loading ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "empty",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-text",
        children: "\u52A0\u8F7D\u4E2D..."
      })
    }) : filtered.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "empty",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-text",
        children: "\u6682\u65E0\u6D3B\u52A8"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-hint",
        children: "\u6D3B\u52A8\u6B63\u5728\u7B79\u5907\u4E2D\uFF0C\u7A0D\u540E\u56DE\u6765"
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.ScrollView, {
      className: "card-list",
      scrollY: true,
      children: filtered.map(function (a) {
        var loc = a.location || '';
        var cityTag = ALL_CITIES_FILTER.find(function (c) {
          return loc.includes(c);
        }) || '';
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          className: "act-card",
          onClick: function onClick() {
            return requireLogin(function () {
              return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
                url: "/pages/activity/detail?id=".concat(a.id)
              });
            });
          },
          children: [a.cover ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Image, {
            className: "act-cover",
            src: a.cover,
            mode: "aspectFill"
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "act-cover-placeholder"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "act-body",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "act-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "act-title",
                children: a.title
              }), cityTag && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
                className: "act-city",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                  className: "act-city-text",
                  children: cityTag
                })
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
              className: "act-time",
              children: a.startTime ? new Date(a.startTime).toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              }) : ''
            }), a.summary && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
              className: "act-summary",
              children: a.summary
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
              className: "act-btn",
              children: "\u4E86\u89E3\u8BE6\u60C5"
            })]
          })]
        }, a.id);
      })
    }), showLoginSheet && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "login-sheet-overlay",
      onClick: handleGuest,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "login-sheet",
        onClick: function onClick(e) {
          return e.stopPropagation();
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          className: "login-sheet-handle"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "login-sheet-title",
          children: "\u6B22\u8FCE\u6765\u5230\u884C\u8005\u5B66\u793E"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "login-sheet-sub",
          children: "\u767B\u5F55\u540E\u5373\u53EF\u62A5\u540D\u6D3B\u52A8\u3001\u8BB0\u5F55\u884C\u8005\u4E4B\u8DEF"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
          className: "login-sheet-body",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "login-sheet-benefits",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "benefit-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "benefit-icon",
                children: "\uD83D\uDDFB"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "benefit-text",
                children: "\u62A5\u540D\u4F18\u8D28\u6D3B\u52A8"
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "benefit-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "benefit-icon",
                children: "\uD83C\uDFD5"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "benefit-text",
                children: "\u8BB0\u5F55\u884C\u8005\u4E4B\u8DEF"
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
              className: "benefit-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "benefit-icon",
                children: "\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
                className: "benefit-text",
                children: "\u7ED3\u8BC6\u540C\u884C\u8005"
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Button, {
            className: "login-sheet-phone-btn",
            openType: "getPhoneNumber",
            onGetPhoneNumber: (/*#__PURE__*/function () {
              var _ref2 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().m(function _callee2(e) {
                var _e$detail;
                return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().w(function (_context2) {
                  while (1) switch (_context2.n) {
                    case 0:
                      if (!(((_e$detail = e.detail) === null || _e$detail === void 0 ? void 0 : _e$detail.errMsg) === 'getPhoneNumber:ok')) {
                        _context2.n = 2;
                        break;
                      }
                      _context2.n = 1;
                      return handlePhoneLogin();
                    case 1:
                      _context2.n = 3;
                      break;
                    case 2:
                      // User declined — offer guest mode
                      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
                        title: '可先浏览，需要时再登录',
                        icon: 'none'
                      });
                    case 3:
                      return _context2.a(2);
                  }
                }, _callee2);
              }));
              return function (_x) {
                return _ref2.apply(this, arguments);
              };
            }()),
            loading: loginLoading,
            children: "\u624B\u673A\u53F7\u5FEB\u6377\u767B\u5F55"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
            className: "login-sheet-guest",
            onClick: handleGuest,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
              className: "guest-text",
              children: "\u6682\u4E0D\u767B\u5F55\uFF0C\u5148\u770B\u770B"
            })
          })]
        })]
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/index/index.tsx":
/*!***********************************!*\
  !*** ./src/pages/index/index.tsx ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx");


var config = {"navigationBarTitleText":"TenseLog"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/index/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/index/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map