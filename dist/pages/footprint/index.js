"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/footprint/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/footprint/index!./src/pages/footprint/index.tsx":
/*!************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/footprint/index!./src/pages/footprint/index.tsx ***!
  \************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WalkerPath; }
/* harmony export */ });
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/api */ "./src/services/api.ts");
/* harmony import */ var _services_demoData__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../services/demoData */ "./src/services/demoData.ts");
/* harmony import */ var _services_provinceData__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../services/provinceData */ "./src/services/provinceData.ts");
/* harmony import */ var _components_ProvinceMap__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../components/ProvinceMap */ "./src/components/ProvinceMap.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);










/**
 * 行者之路 — The Walker's Path
 * Three modules: Identity → Journey Timeline → Footprint Map
 */

function WalkerPath() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true),
    _useState2 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_7__["default"])(_useState, 2),
    loading = _useState2[0],
    setLoading = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
      activityCount: 0,
      cityCount: 0,
      companionCount: 0,
      speakerCount: 0
    }),
    _useState4 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_7__["default"])(_useState3, 2),
    stats = _useState4[0],
    setStats = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]),
    _useState6 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_7__["default"])(_useState5, 2),
    timeline = _useState6[0],
    setTimeline = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState8 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_7__["default"])(_useState7, 2),
    showAll = _useState8[0],
    setShowAll = _useState8[1];
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    var token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().getStorageSync('token');
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([(0,_services_api__WEBPACK_IMPORTED_MODULE_2__.getFootprintStats)().catch(function () {
      return null;
    }), token ? _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().request({
      url: "".concat(_services_api__WEBPACK_IMPORTED_MODULE_2__.BASE_URL, "/api/users/profile"),
      header: {
        Authorization: "Bearer ".concat(token)
      }
    }).catch(function () {
      return {
        data: {
          code: -1
        }
      };
    }) : Promise.resolve({
      data: {
        code: -1
      }
    }), token ? _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().request({
      url: "".concat(_services_api__WEBPACK_IMPORTED_MODULE_2__.BASE_URL, "/api/certificates/my"),
      header: {
        Authorization: "Bearer ".concat(token)
      }
    }).catch(function () {
      return {
        data: {
          code: -1
        }
      };
    }) : Promise.resolve({
      data: {
        code: -1
      }
    })]).then(function (_ref) {
      var _ref2 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_7__["default"])(_ref, 3),
        apiStats = _ref2[0],
        pRes = _ref2[1],
        cRes = _ref2[2];
      var pBody = pRes.data;
      var cBody = cRes.data;
      var certs = (cBody.code === 0 ? cBody.data : []) || [];

      // Only use demo if the API call completely failed (network error), never for empty but valid responses
      var source = 'real';
      if (certs.length === 0 && cBody.code !== 0) {
        // API returned error or network failed — hard fallback
        certs = _services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_CERTIFICATES;
        source = 'fallback-error';
      } else if (certs.length === 0) {
        source = 'empty';
      }
      console.log('[行者之路] 数据来源: source=' + source + ', certs=' + certs.length);
      var profileData = (pBody.code === 0 ? pBody.data : null) || _services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_USER_PROFILE;
      var cities = new Set();
      certs.forEach(function (c) {
        var _c$activity;
        if ((_c$activity = c.activity) !== null && _c$activity !== void 0 && _c$activity.location) cities.add(c.activity.location);
      });
      var activityCount = (apiStats === null || apiStats === void 0 ? void 0 : apiStats.activityCount) || certs.length;
      var cityCount = (apiStats === null || apiStats === void 0 ? void 0 : apiStats.cityCount) || cities.size;
      var companionCount = (apiStats === null || apiStats === void 0 ? void 0 : apiStats.companionCount) || _services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_COMPANIONS.length;
      var speakerCount = (apiStats === null || apiStats === void 0 ? void 0 : apiStats.speakerCount) || certs.filter(function (c) {
        return c.certificateType === 'SPEAKER';
      }).length;
      setStats({
        nickname: (profileData === null || profileData === void 0 ? void 0 : profileData.nickName) || '行者',
        joinedAt: (profileData === null || profileData === void 0 ? void 0 : profileData.createdAt) || '',
        activityCount: activityCount,
        cityCount: cityCount,
        companionCount: companionCount,
        speakerCount: speakerCount
      });
      setTimeline(certs.sort(function (a, b) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }));
    }).catch(function () {
      // Total failure — use demo
      var demoCities = new Set();
      _services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_CERTIFICATES.forEach(function (c) {
        var _c$activity2;
        if ((_c$activity2 = c.activity) !== null && _c$activity2 !== void 0 && _c$activity2.location) demoCities.add(c.activity.location);
      });
      setStats({
        nickname: _services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_USER_PROFILE.nickName,
        joinedAt: _services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_USER_PROFILE.createdAt,
        activityCount: _services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_REGISTRATIONS.length,
        cityCount: demoCities.size,
        companionCount: _services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_COMPANIONS.length,
        speakerCount: 1
      });
      setTimeline(_services_demoData__WEBPACK_IMPORTED_MODULE_3__.DEMO_CERTIFICATES.sort(function (a, b) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }));
    }).finally(function () {
      return setLoading(false);
    });
  }, []);
  var displayTimeline = showAll ? timeline : timeline.slice(0, 10);
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
      className: "wp-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
        className: "wp-loading",
        children: "..."
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
    className: "wp-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
      className: "wp-identity",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
        className: "wp-id-name",
        children: stats.nickname || '行者'
      }), stats.joinedAt && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
        className: "wp-id-joined",
        children: ["\u52A0\u5165\u4E8E ", new Date(stats.joinedAt).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long'
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "wp-id-stats",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "wp-stat-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-stat-num",
            children: stats.activityCount
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-stat-label",
            children: "\u573A\u6D3B\u52A8"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "wp-stat-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-stat-num",
            children: stats.cityCount
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-stat-label",
            children: "\u5EA7\u57CE\u5E02"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "wp-stat-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-stat-num",
            children: stats.companionCount
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-stat-label",
            children: "\u4F4D\u540C\u884C\u8005"
          })]
        }), stats.speakerCount > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "wp-stat-item wp-stat-speaker",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-stat-num",
            children: stats.speakerCount
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-stat-label",
            children: "\u6B21\u5206\u4EAB"
          })]
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
      className: "wp-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
        className: "wp-section-title",
        children: "\u884C\u8005\u65F6\u5149"
      }), timeline.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        className: "wp-empty-state",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "wp-empty-text",
          children: "\u8FD8\u6CA1\u6709\u884C\u8005\u65F6\u5149"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
          className: "wp-empty-hint",
          children: "\u53C2\u4E0E\u4E00\u573A\u6D3B\u52A8\uFF0C\u4F60\u7684\u7B2C\u4E00\u6BB5\u65C5\u7A0B\u5C06\u5728\u8FD9\u91CC\u5F00\u59CB"
        })]
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "wp-timeline",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
            className: "wp-tl-line"
          }), displayTimeline.map(function (c) {
            var a = c.activity || {};
            var isSpeaker = c.certificateType === 'SPEAKER';
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
              className: "wp-tl-node",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
                className: "wp-tl-dot"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
                className: "wp-tl-card",
                onClick: function onClick() {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
                    url: "/pages/footprint/memory/index?certId=".concat(c.id)
                  });
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                  className: "wp-tl-label",
                  children: isSpeaker ? '讲者' : '听众'
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                  className: "wp-tl-title",
                  children: a.title || '行者学社活动'
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                  className: "wp-tl-meta",
                  children: [c.createdAt ? new Date(c.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '', a.location ? ' · ' + a.location : '']
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
                  className: "wp-tl-cert",
                  children: isSpeaker ? '分享者足迹' : '行者足迹'
                })]
              })]
            }, c.id);
          })]
        }), timeline.length > 10 && !showAll && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
          className: "wp-show-more",
          onClick: function onClick() {
            return setShowAll(true);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
            className: "wp-show-more-text",
            children: "\u67E5\u770B\u66F4\u591A"
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.View, {
      className: "wp-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_8__.Text, {
        className: "wp-section-title",
        children: "\u884C\u8005\u7248\u56FE"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_components_ProvinceMap__WEBPACK_IMPORTED_MODULE_5__["default"], {
        litProvinces: (0,_services_provinceData__WEBPACK_IMPORTED_MODULE_4__.getLitProvinces)(timeline)
      })]
    })]
  });
}

/***/ }),

/***/ "./src/components/ProvinceMap.tsx":
/*!****************************************!*\
  !*** ./src/components/ProvinceMap.tsx ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ProvinceMap; }
/* harmony export */ });
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);





/**
 * China province boundary data — simplified Natural Earth 1:110m, 600×500 viewBox.
 * Each province has ~20-40 vertices for recognizable boundary shapes.
 */
var P = {
  '黑龙江': {
    poly: [[432, 0], [448, 2], [464, 8], [472, 18], [468, 30], [472, 42], [464, 52], [452, 58], [440, 64], [424, 68], [408, 64], [396, 56], [388, 44], [392, 28], [400, 12], [416, 4]],
    cx: 432,
    cy: 34
  },
  '吉林': {
    poly: [[432, 34], [440, 40], [448, 38], [460, 42], [464, 52], [468, 62], [460, 72], [452, 80], [440, 84], [424, 86], [412, 82], [404, 74], [404, 64], [412, 54], [420, 46]],
    cx: 436,
    cy: 60
  },
  '辽宁': {
    poly: [[396, 54], [412, 50], [424, 54], [432, 62], [440, 72], [444, 82], [436, 92], [424, 98], [408, 100], [392, 96], [380, 84], [376, 68], [384, 58]],
    cx: 410,
    cy: 76
  },
  '内蒙古': {
    poly: [[276, 8], [304, 4], [336, 2], [368, 4], [392, 8], [408, 16], [416, 28], [412, 42], [400, 52], [388, 56], [372, 58], [352, 58], [332, 56], [312, 52], [292, 44], [280, 32], [272, 20]],
    cx: 344,
    cy: 38
  },
  '新疆': {
    poly: [[36, 14], [52, 10], [68, 8], [84, 10], [100, 16], [116, 20], [128, 28], [136, 36], [140, 48], [144, 60], [144, 72], [140, 84], [136, 96], [128, 108], [116, 116], [100, 120], [88, 118], [76, 114], [64, 108], [52, 100], [44, 88], [40, 74], [36, 58], [32, 40], [32, 26]],
    cx: 88,
    cy: 72
  },
  '西藏': {
    poly: [[40, 130], [52, 124], [68, 118], [84, 116], [100, 116], [112, 120], [120, 128], [124, 140], [128, 154], [128, 170], [124, 186], [116, 198], [104, 210], [88, 218], [72, 222], [56, 220], [40, 212], [28, 200], [22, 184], [22, 166], [28, 148]],
    cx: 74,
    cy: 170
  },
  '青海': {
    poly: [[108, 116], [128, 110], [148, 106], [168, 106], [188, 108], [204, 114], [220, 122], [232, 132], [240, 146], [244, 162], [244, 178], [240, 192], [228, 204], [212, 212], [196, 216], [176, 216], [156, 212], [140, 204], [124, 192], [112, 178], [104, 162], [102, 144], [104, 128]],
    cx: 174,
    cy: 162
  },
  '甘肃': {
    poly: [[128, 98], [144, 92], [160, 90], [176, 92], [192, 96], [208, 100], [220, 106], [228, 114], [236, 124], [240, 136], [240, 148], [236, 162], [224, 172], [212, 178], [196, 182], [180, 182], [164, 178], [152, 170], [144, 158], [140, 144], [136, 128], [132, 114]],
    cx: 186,
    cy: 134
  },
  '宁夏': {
    poly: [[240, 108], [248, 104], [256, 104], [264, 108], [268, 116], [268, 124], [264, 132], [256, 136], [248, 136], [240, 132], [236, 124], [236, 116]],
    cx: 252,
    cy: 120
  },
  '陕西': {
    poly: [[216, 130], [228, 126], [244, 124], [256, 126], [268, 130], [276, 138], [280, 148], [280, 160], [276, 170], [268, 178], [256, 184], [244, 188], [232, 188], [220, 184], [212, 176], [208, 164], [208, 150], [212, 140]],
    cx: 244,
    cy: 156
  },
  '山西': {
    poly: [[300, 106], [316, 100], [328, 100], [340, 104], [348, 112], [356, 122], [360, 134], [360, 144], [356, 152], [348, 156], [336, 158], [320, 156], [308, 150], [300, 140], [296, 128], [296, 118]],
    cx: 328,
    cy: 130
  },
  '河北': {
    poly: [[340, 82], [352, 74], [368, 68], [380, 68], [392, 72], [400, 82], [404, 92], [404, 102], [400, 112], [392, 120], [380, 124], [368, 124], [356, 120], [348, 112], [344, 100], [340, 90]],
    cx: 372,
    cy: 96
  },
  '北京': {
    poly: [[360, 60], [372, 56], [380, 58], [388, 64], [388, 74], [384, 80], [376, 82], [368, 82], [360, 78], [356, 72]],
    cx: 372,
    cy: 70
  },
  '天津': {
    poly: [[372, 78], [384, 74], [392, 80], [388, 88], [380, 90], [372, 86]],
    cx: 380,
    cy: 82
  },
  '山东': {
    poly: [[344, 108], [356, 102], [372, 100], [388, 102], [400, 106], [408, 114], [416, 126], [416, 138], [412, 148], [404, 156], [392, 162], [376, 164], [360, 160], [348, 152], [340, 140], [336, 128], [340, 118]],
    cx: 378,
    cy: 132
  },
  '河南': {
    poly: [[296, 138], [312, 132], [328, 132], [344, 136], [356, 142], [364, 152], [368, 162], [368, 174], [364, 184], [356, 192], [344, 196], [328, 196], [312, 192], [300, 184], [292, 174], [288, 162], [288, 150]],
    cx: 330,
    cy: 166
  },
  '湖北': {
    poly: [[264, 194], [280, 188], [296, 188], [312, 192], [324, 200], [332, 212], [336, 226], [336, 242], [332, 256], [324, 268], [312, 276], [296, 280], [280, 278], [264, 272], [252, 260], [248, 244], [248, 228], [252, 212], [260, 200]],
    cx: 292,
    cy: 236
  },
  '湖南': {
    poly: [[252, 264], [268, 256], [284, 252], [300, 252], [316, 256], [328, 266], [336, 278], [336, 294], [332, 308], [324, 318], [312, 326], [296, 330], [280, 330], [264, 326], [252, 316], [244, 302], [242, 286], [246, 274]],
    cx: 290,
    cy: 294
  },
  '安徽': {
    poly: [[352, 182], [368, 174], [384, 174], [396, 182], [404, 194], [408, 208], [408, 220], [404, 232], [396, 240], [384, 242], [372, 240], [360, 234], [352, 222], [348, 208], [348, 194]],
    cx: 378,
    cy: 210
  },
  '江苏': {
    poly: [[364, 164], [380, 158], [396, 160], [408, 168], [416, 180], [420, 194], [424, 210], [420, 226], [412, 238], [400, 244], [388, 246], [376, 244], [364, 238], [356, 226], [352, 210], [352, 194], [356, 178]],
    cx: 388,
    cy: 204
  },
  '上海': {
    poly: [[408, 246], [420, 244], [428, 252], [424, 260], [416, 264], [408, 260], [404, 254]],
    cx: 416,
    cy: 254
  },
  '浙江': {
    poly: [[376, 254], [396, 246], [412, 246], [424, 252], [432, 264], [436, 280], [436, 296], [432, 308], [424, 316], [412, 318], [396, 316], [384, 310], [376, 298], [372, 282], [372, 268]],
    cx: 404,
    cy: 282
  },
  '江西': {
    poly: [[348, 242], [364, 236], [380, 236], [396, 240], [408, 248], [416, 260], [420, 276], [420, 292], [416, 306], [408, 314], [396, 316], [380, 314], [364, 308], [352, 298], [344, 284], [340, 268], [340, 254]],
    cx: 380,
    cy: 280
  },
  '福建': {
    poly: [[368, 280], [384, 274], [400, 274], [412, 280], [420, 292], [424, 308], [424, 322], [420, 334], [412, 340], [400, 342], [388, 338], [380, 330], [376, 316], [372, 300], [368, 288]],
    cx: 396,
    cy: 312
  },
  '广东': {
    poly: [[276, 324], [296, 318], [316, 314], [336, 316], [352, 324], [364, 336], [372, 352], [372, 368], [368, 384], [356, 394], [340, 398], [320, 396], [300, 390], [284, 380], [272, 366], [268, 348], [270, 334]],
    cx: 322,
    cy: 358
  },
  '广西': {
    poly: [[252, 316], [268, 310], [284, 308], [300, 312], [316, 318], [328, 328], [336, 340], [340, 354], [336, 368], [328, 378], [316, 384], [300, 386], [284, 382], [268, 374], [256, 360], [248, 344], [248, 328]],
    cx: 294,
    cy: 348
  },
  '海南': {
    poly: [[268, 396], [284, 390], [300, 390], [312, 398], [316, 410], [308, 420], [292, 424], [276, 418], [268, 408]],
    cx: 292,
    cy: 408
  },
  '四川': {
    poly: [[144, 182], [164, 174], [184, 170], [204, 170], [224, 172], [240, 178], [256, 188], [268, 202], [276, 220], [276, 238], [272, 256], [260, 272], [244, 284], [224, 292], [204, 296], [184, 294], [164, 288], [148, 276], [136, 260], [128, 242], [128, 222], [132, 204]],
    cx: 202,
    cy: 236
  },
  '贵州': {
    poly: [[228, 276], [244, 270], [260, 270], [276, 274], [288, 280], [300, 290], [304, 304], [304, 316], [296, 328], [284, 336], [268, 340], [252, 340], [240, 334], [232, 324], [228, 310], [224, 294]],
    cx: 264,
    cy: 308
  },
  '云南': {
    poly: [[116, 260], [136, 252], [156, 248], [172, 248], [188, 252], [204, 260], [216, 272], [224, 288], [228, 304], [228, 322], [224, 340], [216, 352], [200, 358], [180, 358], [160, 352], [144, 342], [132, 326], [124, 308], [120, 288], [118, 274]],
    cx: 172,
    cy: 306
  },
  '重庆': {
    poly: [[216, 232], [228, 226], [244, 224], [256, 228], [264, 236], [268, 248], [264, 258], [256, 264], [244, 264], [232, 260], [224, 250], [220, 240]],
    cx: 244,
    cy: 244
  }
};
var W = 600;
var H = 500;
var CID = 'pmap';
function ProvinceMap(_ref) {
  var litProvinces = _ref.litProvinces;
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    var t = setTimeout(function () {
      var ctx = _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().createCanvasContext(CID);
      if (!ctx) return;
      ctx.setFillStyle('#F9F7F2');
      ctx.fillRect(0, 0, W, H);
      var names = Object.keys(P);
      names.forEach(function (name) {
        var s = P[name];
        var lit = litProvinces.has(name);
        var p = s.poly;
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
        ctx.closePath();
        if (lit) {
          ctx.setFillStyle('rgba(63,107,79,0.55)');
          ctx.fill();
          ctx.setStrokeStyle('#3F6B4F');
          ctx.setLineWidth(1.5);
        } else {
          ctx.setFillStyle('rgba(217,212,200,0.6)');
          ctx.fill();
          ctx.setStrokeStyle('rgba(139,130,110,0.18)');
          ctx.setLineWidth(0.8);
        }
        ctx.stroke();
      });

      // Labels
      names.forEach(function (name) {
        var s = P[name];
        ctx.setFillStyle(litProvinces.has(name) ? '#18231E' : '#A6AAA2');
        ctx.setFontSize(9);
        ctx.setTextAlign('center');
        ctx.fillText(name, s.cx, s.cy);
      });
      ctx.draw();
    }, 400);
    return function () {
      return clearTimeout(t);
    };
  }, [litProvinces]);
  var handleTap = function handleTap(e) {
    var _e$detail$x, _e$detail, _e$detail$y, _e$detail2;
    var x = (_e$detail$x = e === null || e === void 0 || (_e$detail = e.detail) === null || _e$detail === void 0 ? void 0 : _e$detail.x) !== null && _e$detail$x !== void 0 ? _e$detail$x : 0;
    var y = (_e$detail$y = e === null || e === void 0 || (_e$detail2 = e.detail) === null || _e$detail2 === void 0 ? void 0 : _e$detail2.y) !== null && _e$detail$y !== void 0 ? _e$detail$y : 0;
    var best = {
      name: '',
      dist: Infinity
    };
    Object.entries(P).forEach(function (_ref2) {
      var _ref3 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_ref2, 2),
        n = _ref3[0],
        s = _ref3[1];
      var d = Math.pow(x - s.cx, 2) + Math.pow(y - s.cy, 2);
      if (d < best.dist) best = {
        name: n,
        dist: d
      };
    });
    if (best.dist < 2000) {
      var lit = litProvinces.has(best.name);
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
        title: lit ? "\u5DF2\u70B9\u4EAE".concat(best.name) : "\u8FD8\u6CA1\u6709\u5728".concat(best.name, "\u7559\u4E0B\u884C\u8005\u8DB3\u8FF9"),
        icon: 'none'
      });
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    style: {
      width: '100%',
      background: '#FBFAF6',
      borderRadius: '28rpx',
      padding: '24rpx 16rpx 20rpx',
      border: '1rpx solid rgba(24,35,30,0.06)'
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      style: {
        width: '100%',
        height: '420rpx',
        background: '#F9F7F2',
        borderRadius: '16rpx',
        overflow: 'hidden'
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Canvas, {
        canvasId: CID,
        id: CID,
        style: {
          width: '100%',
          height: '100%'
        },
        onTouchEnd: handleTap
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      style: {
        textAlign: 'center',
        marginTop: '20rpx'
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        style: {
          fontSize: '24rpx',
          color: '#7A8178'
        },
        children: "\u5DF2\u70B9\u4EAE\uFF1A"
      }), litProvinces.size === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        style: {
          fontSize: '24rpx',
          color: '#A6AAA2'
        },
        children: "\u8FD8\u6CA1\u6709\u70B9\u4EAE\u4EFB\u4F55\u533A\u57DF"
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        style: {
          fontSize: '26rpx',
          color: '#18231E'
        },
        children: Array.from(litProvinces).join(' · ')
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/footprint/index.tsx":
/*!***************************************!*\
  !*** ./src/pages/footprint/index.tsx ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_footprint_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/footprint/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/footprint/index!./src/pages/footprint/index.tsx");


var config = {"navigationBarTitleText":"行者之路"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_footprint_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/footprint/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_footprint_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ }),

/***/ "./src/services/provinceData.ts":
/*!**************************************!*\
  !*** ./src/services/provinceData.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getLitProvinces": function() { return /* binding */ getLitProvinces; }
/* harmony export */ });
/* unused harmony exports CITY_TO_PROVINCE, PROVINCE_BLOCKS */
/**
 * Full city-to-province mapping and province territory data.
 * Used by the footprint map.
 *
 * TODO: V5 add activity.city field; location is currently used for city extraction.
 */

var CITY_TO_PROVINCE = {
  // 直辖市
  '北京': '北京',
  '上海': '上海',
  '天津': '天津',
  '重庆': '重庆',
  // 华东
  '杭州': '浙江',
  '宁波': '浙江',
  '温州': '浙江',
  '绍兴': '浙江',
  '嘉兴': '浙江',
  '湖州': '浙江',
  '金华': '浙江',
  '台州': '浙江',
  '舟山': '浙江',
  '丽水': '浙江',
  '南京': '江苏',
  '苏州': '江苏',
  '无锡': '江苏',
  '常州': '江苏',
  '南通': '江苏',
  '扬州': '江苏',
  '镇江': '江苏',
  '泰州': '江苏',
  '徐州': '江苏',
  '淮安': '江苏',
  '盐城': '江苏',
  '连云港': '江苏',
  '宿迁': '江苏',
  '济南': '山东',
  '青岛': '山东',
  '烟台': '山东',
  '威海': '山东',
  '潍坊': '山东',
  '淄博': '山东',
  '临沂': '山东',
  '济宁': '山东',
  '泰安': '山东',
  '日照': '山东',
  '合肥': '安徽',
  '芜湖': '安徽',
  '蚌埠': '安徽',
  '黄山': '安徽',
  '安庆': '安徽',
  '南昌': '江西',
  '九江': '江西',
  '景德镇': '江西',
  '赣州': '江西',
  '福州': '福建',
  '厦门': '福建',
  '泉州': '福建',
  '漳州': '福建',
  '莆田': '福建',
  '龙岩': '福建',
  // 华南
  '广州': '广东',
  '深圳': '广东',
  '珠海': '广东',
  '佛山': '广东',
  '东莞': '广东',
  '惠州': '广东',
  '中山': '广东',
  '江门': '广东',
  '汕头': '广东',
  '湛江': '广东',
  '肇庆': '广东',
  '南宁': '广西',
  '桂林': '广西',
  '柳州': '广西',
  '北海': '广西',
  '海口': '海南',
  '三亚': '海南',
  // 华中
  '武汉': '湖北',
  '宜昌': '湖北',
  '襄阳': '湖北',
  '荆州': '湖北',
  '十堰': '湖北',
  '长沙': '湖南',
  '株洲': '湖南',
  '湘潭': '湖南',
  '岳阳': '湖南',
  '张家界': '湖南',
  '衡阳': '湖南',
  '郑州': '河南',
  '洛阳': '河南',
  '开封': '河南',
  '南阳': '河南',
  '安阳': '河南',
  // 华北
  '石家庄': '河北',
  '唐山': '河北',
  '秦皇岛': '河北',
  '保定': '河北',
  '邯郸': '河北',
  '太原': '山西',
  '大同': '山西',
  '运城': '山西',
  '晋中': '山西',
  '呼和浩特': '内蒙古',
  '包头': '内蒙古',
  '鄂尔多斯': '内蒙古',
  // 东北
  '沈阳': '辽宁',
  '大连': '辽宁',
  '鞍山': '辽宁',
  '锦州': '辽宁',
  '长春': '吉林',
  '吉林': '吉林',
  '延吉': '吉林',
  '哈尔滨': '黑龙江',
  '齐齐哈尔': '黑龙江',
  '牡丹江': '黑龙江',
  '大庆': '黑龙江',
  // 西南
  '成都': '四川',
  '绵阳': '四川',
  '乐山': '四川',
  '宜宾': '四川',
  '德阳': '四川',
  '阿坝': '四川',
  '贵阳': '贵州',
  '遵义': '贵州',
  '安顺': '贵州',
  '昆明': '云南',
  '大理': '云南',
  '丽江': '云南',
  '西双版纳': '云南',
  '香格里拉': '云南',
  '拉萨': '西藏',
  '林芝': '西藏',
  // 西北
  '西安': '陕西',
  '咸阳': '陕西',
  '宝鸡': '陕西',
  '延安': '陕西',
  '兰州': '甘肃',
  '敦煌': '甘肃',
  '天水': '甘肃',
  '西宁': '青海',
  '格尔木': '青海',
  '银川': '宁夏',
  '乌鲁木齐': '新疆',
  '喀什': '新疆',
  '伊犁': '新疆',
  '吐鲁番': '新疆',
  // 特别行政区
  '香港': '香港',
  '澳门': '澳门'
};

/** Simplified province blocks for territory grid. 5-column x 4-row CSS grid. */
var PROVINCE_BLOCKS = [{
  name: '北京',
  col: 3,
  row: 1
}, {
  name: '上海',
  col: 5,
  row: 3
}, {
  name: '浙江',
  col: 4,
  row: 3
}, {
  name: '广东',
  col: 3,
  row: 4
}, {
  name: '四川',
  col: 1,
  row: 2
}, {
  name: '江苏',
  col: 4,
  row: 2
}, {
  name: '湖北',
  col: 3,
  row: 2
}, {
  name: '陕西',
  col: 2,
  row: 2
}, {
  name: '福建',
  col: 5,
  row: 3
}, {
  name: '云南',
  col: 1,
  row: 3
}, {
  name: '山东',
  col: 4,
  row: 1
}, {
  name: '河南',
  col: 3,
  row: 2
}, {
  name: '湖南',
  col: 2,
  row: 3
}, {
  name: '辽宁',
  col: 5,
  row: 1
}, {
  name: '新疆',
  col: 1,
  row: 1
}, {
  name: '西藏',
  col: 1,
  row: 1
}, {
  name: '海南',
  col: 2,
  row: 4
}, {
  name: '黑龙江',
  col: 6,
  row: 1
}, {
  name: '内蒙古',
  col: 3,
  row: 1
}];

/**
 * Build lit province set from certificate activity locations.
 */
function getLitProvinces(certs) {
  var lit = new Set();
  certs.forEach(function (c) {
    var _c$activity;
    var loc = ((_c$activity = c.activity) === null || _c$activity === void 0 ? void 0 : _c$activity.location) || c.location;
    if (!loc) return;
    // Try exact match first
    if (CITY_TO_PROVINCE[loc]) {
      lit.add(CITY_TO_PROVINCE[loc]);
      return;
    }
    // Try fuzzy — if the location string contains a known city name
    for (var _i = 0, _Object$keys = Object.keys(CITY_TO_PROVINCE); _i < _Object$keys.length; _i++) {
      var city = _Object$keys[_i];
      if (loc.includes(city)) {
        lit.add(CITY_TO_PROVINCE[city]);
        return;
      }
    }
  });
  return lit;
}

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/footprint/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map