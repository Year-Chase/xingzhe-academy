"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/activity/cert-preview"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/activity/cert-preview!./src/pages/activity/cert-preview.tsx":
/*!************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/activity/cert-preview!./src/pages/activity/cert-preview.tsx ***!
  \************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ CertPreviewPage; }
/* harmony export */ });
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/api */ "./src/services/api.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);






var GOLDEN_QUOTE = '不是抵达终点\n而是在同行中\n看见更大的自己';
function CertPreviewPage() {
  var router = (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.useRouter)();
  var id = router.params.id;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState2 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState, 2),
    cert = _useState2[0],
    setCert = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    _useState4 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState3, 2),
    activity = _useState4[0],
    setActivity = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState6 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState5, 2),
    nickname = _useState6[0],
    setNickname = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true),
    _useState8 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState7, 2),
    loading = _useState8[0],
    setLoading = _useState8[1];
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    if (!id) return;
    var token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().getStorageSync('token');
    var headers = {
      Authorization: "Bearer ".concat(token)
    };
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().request({
      url: "".concat(_services_api__WEBPACK_IMPORTED_MODULE_2__.BASE_URL, "/api/certificates/").concat(id),
      header: headers
    }).then(function (res) {
      var body = res.data;
      if (body.code === 0) {
        setCert(body.data);
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().request({
          url: "".concat(_services_api__WEBPACK_IMPORTED_MODULE_2__.BASE_URL, "/api/activities/").concat(body.data.activityId),
          header: headers
        }).then(function (r) {
          var b = r.data;
          if (b.code === 0) setActivity(b.data);
        }).catch(function () {});
      }
    }).catch(function () {}).finally(function () {
      return setLoading(false);
    });
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().request({
      url: "".concat(_services_api__WEBPACK_IMPORTED_MODULE_2__.BASE_URL, "/api/users/profile"),
      header: headers
    }).then(function (res) {
      var _body$data;
      var body = res.data;
      if (body.code === 0 && (_body$data = body.data) !== null && _body$data !== void 0 && _body$data.nickName) {
        setNickname(body.data.nickName);
      }
    }).catch(function () {});
  }, [id]);
  var formatDate = function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return "".concat(d.getFullYear(), "\u5E74").concat(d.getMonth() + 1, "\u6708").concat(d.getDate(), "\u65E5");
  };
  if (loading) return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
    style: "padding:32px;min-height:100vh;background:#faf9f6",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
      style: "font-size:28rpx;color:#A09B8E;text-align:center;margin-top:200px;display:block",
      children: "\u52A0\u8F7D\u4E2D..."
    })
  });
  if (!cert) return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
    style: "padding:32px;min-height:100vh;background:#faf9f6",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
      style: "font-size:28rpx;color:#A09B8E;text-align:center;margin-top:200px;display:block",
      children: "\u8BC1\u4E66\u4E0D\u5B58\u5728"
    })
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
    style: "padding:40px 28px;min-height:100vh;background:#faf9f6;display:flex;flex-direction:column;align-items:center",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      style: "width:100%;background:#fff;border-radius:16px;padding:52px 36px 36px;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:2rpx solid #e8d5b7",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        style: "font-size:20rpx;color:#c4a97d;letter-spacing:6rpx;display:block;text-align:center;margin-bottom:44px",
        children: "\u884C\u8005\u5B66\u793E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        style: "text-align:center;margin-bottom:40rpx",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          style: "font-size:28rpx;font-weight:600;color:#2C3328;display:block;margin-bottom:16rpx",
          children: (activity === null || activity === void 0 ? void 0 : activity.title) || '行者学社活动'
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          style: "font-size:22rpx;font-weight:400;color:#A09B8E;display:block;margin-bottom:16rpx",
          children: "\u6B64\u6B21\u540C\u884C"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          style: "font-size:40rpx;font-weight:400;color:#2C3328;letter-spacing:4rpx;display:block",
          children: nickname || '行者'
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        style: "text-align:center;margin-bottom:48rpx",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          style: "font-size:30rpx;font-weight:300;color:#6B5A42;display:block;line-height:1.8;whiteSpace:pre-line",
          children: GOLDEN_QUOTE
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        style: "margin-bottom:32rpx;padding:0 4px",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
          style: "display:flex;flex-direction:row;align-items:baseline;margin-bottom:12px",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
            style: "font-size:24rpx;font-weight:400;color:#2C3328;width:80rpx;flex-shrink:0",
            children: "\u65F6\u95F4"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
            style: "font-size:24rpx;font-weight:400;color:#2C3328",
            children: formatDate(activity === null || activity === void 0 ? void 0 : activity.startTime)
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
          style: "display:flex;flex-direction:row;align-items:baseline",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
            style: "font-size:24rpx;font-weight:400;color:#2C3328;width:80rpx;flex-shrink:0",
            children: "\u5730\u70B9"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
            style: "font-size:24rpx;font-weight:400;color:#2C3328",
            children: (activity === null || activity === void 0 ? void 0 : activity.location) || '—'
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        style: "font-size:22rpx;color:#A09B8E;display:block;word-break:break-all;padding-right:120rpx",
        children: cert.certificateNo
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        style: "margin-top:24rpx;display:flex;justify-content:flex-end",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
          style: "width:112rpx;height:112rpx;border-radius:50%;border:2rpx solid #B36B4B;transform:rotate(-12deg);display:flex;align-items:center;justify-content:center",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
            style: "font-size:22rpx;color:#B36B4B;font-weight:600;text-align:center;line-height:1.4",
            children: '行者\n学社'
          })
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      style: "margin-top:40px;width:100%",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        style: "width:100%;background:#1989fa;border-radius:24px;padding:16px 0;text-align:center",
        onClick: function onClick() {
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '证书已保存',
            icon: 'success'
          });
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().request({
            url: "".concat(_services_api__WEBPACK_IMPORTED_MODULE_2__.BASE_URL, "/api/admin/certificates/").concat(id, "/status"),
            method: 'PUT',
            data: {
              status: 'DOWNLOADED'
            },
            header: {
              Authorization: "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().getStorageSync('token')),
              'Content-Type': 'application/json'
            }
          }).catch(function () {});
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          style: "font-size:30rpx;color:#fff;font-weight:600",
          children: "\u4FDD\u5B58\u8BC1\u4E66"
        })
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/activity/cert-preview.tsx":
/*!*********************************************!*\
  !*** ./src/pages/activity/cert-preview.tsx ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_activity_cert_preview_cert_preview_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/activity/cert-preview!./cert-preview.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/activity/cert-preview!./src/pages/activity/cert-preview.tsx");


var config = {"navigationBarTitleText":"活动证书"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_activity_cert_preview_cert_preview_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/activity/cert-preview', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_activity_cert_preview_cert_preview_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/activity/cert-preview.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=cert-preview.js.map