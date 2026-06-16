"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/relax/breathing/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/relax/breathing/index!./src/pages/relax/breathing/index.tsx":
/*!************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/relax/breathing/index!./src/pages/relax/breathing/index.tsx ***!
  \************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ BreathingPage; }
/* harmony export */ });
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);






var TOTAL_ROUNDS = 3;
var CYCLE_S = 19; // 4+7+8

function BreathingPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(TOTAL_ROUNDS),
    _useState2 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    roundsLeft = _useState2[0],
    setRoundsLeft = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('inhale'),
    _useState4 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    phase = _useState4[0],
    setPhase = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(4),
    _useState6 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    countdown = _useState6[0],
    setCountdown = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState8 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    elapsed = _useState8[0],
    setElapsed = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState0 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState9, 2),
    paused = _useState0[0],
    setPaused = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState10 = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState1, 2),
    done = _useState10[0],
    setDone = _useState10[1];
  var timerRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  var roundRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(TOTAL_ROUNDS);
  var elapsedRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(0);
  var phaseRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)('inhale');
  var phaseLabels = {
    inhale: '慢慢吸气',
    hold: '轻轻停住',
    exhale: '缓缓呼出'
  };
  var tick = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
    var next = elapsedRef.current + 1;
    elapsedRef.current = next;
    setElapsed(next);
    var cyclePos = next % CYCLE_S;

    // 一轮结束（position==0 即 19/38/57 秒）
    if (cyclePos === 0) {
      roundRef.current -= 1;
      setRoundsLeft(roundRef.current);
      if (roundRef.current <= 0) {
        // 全部完成
        if (timerRef.current) clearInterval(timerRef.current);
        setDone(true);
        setPhase('done');
        return;
      }
    }

    // 阶段判定（基于 cyclePos，不依赖 state）
    if (cyclePos < 4) {
      phaseRef.current = 'inhale';
      setPhase('inhale');
      setCountdown(4 - cyclePos);
    } else if (cyclePos < 11) {
      phaseRef.current = 'hold';
      setPhase('hold');
      setCountdown(11 - cyclePos);
    } else {
      phaseRef.current = 'exhale';
      setPhase('exhale');
      setCountdown(19 - cyclePos === 0 ? 19 : 19 - cyclePos);
    }
  }, []);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    timerRef.current = setInterval(tick, 1000);
    return function () {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tick]);
  var handlePause = function handlePause() {
    if (paused) {
      timerRef.current = setInterval(tick, 1000);
      setPaused(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setPaused(true);
    }
  };
  var handleEnd = function handleEnd() {
    if (timerRef.current) clearInterval(timerRef.current);
    setDone(true);
    setPhase('done');
  };
  var fmt = function fmt(s) {
    return "".concat(Math.floor(s / 60), ":").concat(String(s % 60).padStart(2, '0'));
  };
  if (done) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "breath-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "breath-done",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "done-icon",
          children: "\uD83E\uDDD8"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "done-text",
          children: "\u8FD9\u6B21\u653E\u677E\u5DF2\u5B8C\u6210"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "done-time",
          children: ["\u603B\u65F6\u957F ", fmt(elapsed)]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "done-btn",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateBack();
          },
          children: "\u8FD4\u56DE"
        })]
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "breath-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "breath-guide",
      children: "\u8BF7\u8DDF\u968F\u5706\u5708\u7684\u81A8\u80C0\u4E0E\u6536\u7F29\uFF0C\u8C03\u6574\u4F60\u7684\u547C\u5438\u8282\u5F8B"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "breath-circle-wrap",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "breath-circle ".concat(paused ? 'paused' : '')
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
      className: "breath-phase",
      children: phaseLabels[phase]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
      className: "breath-countdown",
      children: countdown
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "breath-info",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "breath-rounds",
        children: ["\u5269\u4F59 ", roundsLeft, " \u6B21"]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "breath-elapsed",
        children: fmt(elapsed)
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "breath-btns",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "breath-btn",
        onClick: handlePause,
        children: paused ? '继续' : '暂停'
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "breath-btn",
        onClick: handleEnd,
        children: "\u7ED3\u675F"
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/relax/breathing/index.tsx":
/*!*********************************************!*\
  !*** ./src/pages/relax/breathing/index.tsx ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_relax_breathing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/relax/breathing/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/relax/breathing/index!./src/pages/relax/breathing/index.tsx");


var config = {"navigationBarTitleText":"478 呼吸"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_relax_breathing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/relax/breathing/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_relax_breathing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/relax/breathing/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map