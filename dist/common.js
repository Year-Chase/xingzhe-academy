"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["common"],{

/***/ "./src/services/api.ts":
/*!*****************************!*\
  !*** ./src/services/api.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BASE_URL": function() { return /* binding */ BASE_URL; },
/* harmony export */   "archiveSupplementaryTask": function() { return /* binding */ archiveSupplementaryTask; },
/* harmony export */   "clearToken": function() { return /* binding */ clearToken; },
/* harmony export */   "getActivityDetail": function() { return /* binding */ getActivityDetail; },
/* harmony export */   "getCertificateCompanions": function() { return /* binding */ getCertificateCompanions; },
/* harmony export */   "getFootprintStats": function() { return /* binding */ getFootprintStats; },
/* harmony export */   "getInviteList": function() { return /* binding */ getInviteList; },
/* harmony export */   "getInviteStatus": function() { return /* binding */ getInviteStatus; },
/* harmony export */   "getProfile": function() { return /* binding */ getProfile; },
/* harmony export */   "getReview": function() { return /* binding */ getReview; },
/* harmony export */   "isLoggedIn": function() { return /* binding */ isLoggedIn; },
/* harmony export */   "listSupplementaryTasks": function() { return /* binding */ listSupplementaryTasks; },
/* harmony export */   "logShare": function() { return /* binding */ logShare; },
/* harmony export */   "setToken": function() { return /* binding */ setToken; },
/* harmony export */   "updateSupplementaryTask": function() { return /* binding */ updateSupplementaryTask; }
/* harmony export */ });
/* unused harmony exports getToken, login, phoneMockLogin, getMe, uploadAudio, createTranscribeTask, queryTaskStatus, pollTranscribe, createDiary, analyzeDiary, getLatestAnalysis, getDiaryList, getDiaryDetail, getTrend, getContinuity, getTasks, submitTask, submitFeedback, getDebugLatest, getMapperStats, getTrajectory, prepareTaskSession, completeTaskSession, createSupplementaryTask, bindInviteCode, listActivities, getMyCertificates, getMyRegistrations, getMyOrders */
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);





// 后端地址：编译时自动注入局域网 IP（config/dev.ts）
// 真机预览时需要设置 LAN_IP 环境变量：LAN_IP=192.168.x.x npm run dev:weapp
var HOST = ( true ? "localhost" : 0) || 0;
var BASE_URL = "http://".concat(HOST, ":3000");

// 真机检测：非 devtools 平台且 HOST 为 localhost 时，视为离线模式
var _isRealDevice = null;
function isRealDeviceWithoutBackend() {
  if (_isRealDevice !== null) return _isRealDevice;
  try {
    var info = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getSystemInfoSync();
    _isRealDevice = info.platform !== 'devtools' && HOST === 'localhost';
  } catch (_) {
    _isRealDevice = false;
  }
  return _isRealDevice;
}
var _token = '';
function setToken(token) {
  _token = token;
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync('token', token);
}
function getToken() {
  if (_token) return _token;
  _token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync('token') || '';
  return _token;
}
function clearToken() {
  _token = '';
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync('token');
}
function request(_x) {
  return _request.apply(this, arguments);
} // ---- API 方法 ----
function _request() {
  _request = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee(opts) {
    var res, _res$data, msg, body, _t;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (!isRealDeviceWithoutBackend()) {
            _context.n = 1;
            break;
          }
          throw new Error('OFFLINE: real device without backend connectivity');
        case 1:
          _context.p = 1;
          _context.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(BASE_URL).concat(opts.url),
            method: opts.method || 'GET',
            data: opts.data,
            header: (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])({
              'Content-Type': 'application/json'
            }, getToken() ? {
              Authorization: "Bearer ".concat(getToken())
            } : {})
          });
        case 2:
          res = _context.v;
          if (!(res.statusCode === 401)) {
            _context.n = 3;
            break;
          }
          clearToken();
          throw new Error('登录已过期，请重新登录');
        case 3:
          if (!(res.statusCode >= 400)) {
            _context.n = 4;
            break;
          }
          msg = ((_res$data = res.data) === null || _res$data === void 0 ? void 0 : _res$data.message) || "HTTP ".concat(res.statusCode);
          throw new Error(msg);
        case 4:
          body = res.data;
          if (!(body.code !== 0)) {
            _context.n = 5;
            break;
          }
          throw new Error(body.message || "\u9519\u8BEF\u7801: ".concat(body.code));
        case 5:
          return _context.a(2, body.data);
        case 6:
          _context.p = 6;
          _t = _context.v;
          if (!(_t.errMsg && _t.errMsg.includes('request:fail'))) {
            _context.n = 7;
            break;
          }
          throw new Error("\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25: ".concat(_t.errMsg, "\u3002\u8BF7\u786E\u8BA4\u540E\u7AEF\u5DF2\u542F\u52A8 (").concat(BASE_URL, ")"));
        case 7:
          throw _t;
        case 8:
          return _context.a(2);
      }
    }, _callee, null, [[1, 6]]);
  }));
  return _request.apply(this, arguments);
}
function login() {
  return _login.apply(this, arguments);
}

/**
 * Mock phone login — simulates WeChat getPhoneNumber callback.
 * In production, replace with wx.cloud.callFunction or your backend decryption.
 * TODO: integrate wx.login → code → backend /api/auth/phone-login
 */
function _login() {
  _login = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee2() {
    var code,
      nickname,
      inviteCode,
      token,
      data,
      _token2,
      _args2 = arguments,
      _t2;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          code = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : 'mock';
          nickname = _args2.length > 1 ? _args2[1] : undefined;
          inviteCode = _args2.length > 2 ? _args2[2] : undefined;
          if (!isRealDeviceWithoutBackend()) {
            _context2.n = 1;
            break;
          }
          token = 'demo_token_' + Date.now();
          setToken(token);
          return _context2.a(2, {
            token: token,
            user: {
              userId: 'demo-user',
              nickName: nickname || '行者'
            },
            bindMsg: null
          });
        case 1:
          _context2.p = 1;
          _context2.n = 2;
          return request({
            url: '/api/auth/login',
            method: 'POST',
            data: {
              code: code,
              nickname: nickname,
              manualInviteCode: inviteCode
            }
          });
        case 2:
          data = _context2.v;
          setToken(data.token);
          return _context2.a(2, data);
        case 3:
          _context2.p = 3;
          _t2 = _context2.v;
          _token2 = 'demo_token_' + Date.now();
          setToken(_token2);
          return _context2.a(2, {
            token: _token2,
            user: {
              userId: 'demo-user',
              nickName: nickname || '行者'
            },
            bindMsg: null
          });
      }
    }, _callee2, null, [[1, 3]]);
  }));
  return _login.apply(this, arguments);
}
function phoneMockLogin(_x2, _x3) {
  return _phoneMockLogin.apply(this, arguments);
}
function _phoneMockLogin() {
  _phoneMockLogin = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee3(nickname, inviteCode) {
    var token, code, data, _token3, _t3;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          if (!isRealDeviceWithoutBackend()) {
            _context3.n = 1;
            break;
          }
          token = 'demo_token_' + Date.now();
          setToken(token);
          return _context3.a(2, {
            token: token,
            user: {
              userId: 'demo-user',
              nickName: nickname || '行者'
            },
            bindMsg: null
          });
        case 1:
          _context3.p = 1;
          code = 'phone_mock_' + Date.now();
          _context3.n = 2;
          return request({
            url: '/api/auth/login',
            method: 'POST',
            data: {
              code: code,
              nickname: nickname,
              manualInviteCode: inviteCode
            }
          });
        case 2:
          data = _context3.v;
          setToken(data.token);
          return _context3.a(2, data);
        case 3:
          _context3.p = 3;
          _t3 = _context3.v;
          _token3 = 'demo_token_' + Date.now();
          setToken(_token3);
          return _context3.a(2, {
            token: _token3,
            user: {
              userId: 'demo-user',
              nickName: nickname || '行者'
            },
            bindMsg: null
          });
      }
    }, _callee3, null, [[1, 3]]);
  }));
  return _phoneMockLogin.apply(this, arguments);
}
function isLoggedIn() {
  return !!getToken();
}
function getMe() {
  return _getMe.apply(this, arguments);
}
function _getMe() {
  _getMe = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee4() {
    var _t4;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          if (!isRealDeviceWithoutBackend()) {
            _context4.n = 1;
            break;
          }
          return _context4.a(2, {
            userId: 'demo-user',
            nickName: '行者阿寺'
          });
        case 1:
          _context4.p = 1;
          _context4.n = 2;
          return request({
            url: '/api/auth/me'
          });
        case 2:
          return _context4.a(2, _context4.v);
        case 3:
          _context4.p = 3;
          _t4 = _context4.v;
          return _context4.a(2, {
            userId: 'demo-user',
            nickName: '行者阿寺'
          });
      }
    }, _callee4, null, [[1, 3]]);
  }));
  return _getMe.apply(this, arguments);
}
function getProfile() {
  return _getProfile.apply(this, arguments);
}

/**
 * 上传录音文件
 * @returns { audioUrl, fileSize, originalName }
 */
function _getProfile() {
  _getProfile = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee5() {
    var _t5;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context5) {
      while (1) switch (_context5.p = _context5.n) {
        case 0:
          if (!isRealDeviceWithoutBackend()) {
            _context5.n = 1;
            break;
          }
          return _context5.a(2, {
            userId: 'demo-user',
            nickName: '行者阿寺',
            createdAt: '2025-10-15T00:00:00'
          });
        case 1:
          _context5.p = 1;
          _context5.n = 2;
          return request({
            url: '/api/users/profile'
          });
        case 2:
          return _context5.a(2, _context5.v);
        case 3:
          _context5.p = 3;
          _t5 = _context5.v;
          return _context5.a(2, {
            userId: 'demo-user',
            nickName: '行者阿寺',
            createdAt: '2025-10-15T00:00:00'
          });
      }
    }, _callee5, null, [[1, 3]]);
  }));
  return _getProfile.apply(this, arguments);
}
function uploadAudio(_x4, _x5) {
  return _uploadAudio.apply(this, arguments);
}

/**
 * 创建录音文件识别任务
 */
function _uploadAudio() {
  _uploadAudio = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee6(filePath, duration) {
    var token, res, body, _t6;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          token = getToken();
          if (token) {
            _context6.n = 1;
            break;
          }
          throw new Error('未登录');
        case 1:
          _context6.p = 1;
          _context6.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().uploadFile({
            url: "".concat(BASE_URL, "/api/diary/upload-audio"),
            filePath: filePath,
            name: 'file',
            formData: {
              duration: String(duration)
            },
            header: {
              Authorization: "Bearer ".concat(token)
            }
          });
        case 2:
          res = _context6.v;
          body = JSON.parse(res.data);
          if (!(body.code !== 0)) {
            _context6.n = 3;
            break;
          }
          throw new Error(body.message || '上传失败');
        case 3:
          return _context6.a(2, body.data);
        case 4:
          _context6.p = 4;
          _t6 = _context6.v;
          if (!(_t6.errMsg && _t6.errMsg.includes('uploadFile:fail'))) {
            _context6.n = 5;
            break;
          }
          throw new Error("\u4E0A\u4F20\u5931\u8D25: ".concat(_t6.errMsg, "\u3002\u8BF7\u786E\u8BA4\u540E\u7AEF\u5DF2\u542F\u52A8\u3002"));
        case 5:
          throw _t6;
        case 6:
          return _context6.a(2);
      }
    }, _callee6, null, [[1, 4]]);
  }));
  return _uploadAudio.apply(this, arguments);
}
function createTranscribeTask(_x6) {
  return _createTranscribeTask.apply(this, arguments);
}

/**
 * 查询识别任务状态
 * status: 0=等待, 1=执行中, 2=成功
 */
function _createTranscribeTask() {
  _createTranscribeTask = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee7(audioUrl) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context7) {
      while (1) switch (_context7.n) {
        case 0:
          return _context7.a(2, request({
            url: '/api/speech/transcribe',
            method: 'POST',
            data: {
              audioUrl: audioUrl
            }
          }));
      }
    }, _callee7);
  }));
  return _createTranscribeTask.apply(this, arguments);
}
function queryTaskStatus(_x7) {
  return _queryTaskStatus.apply(this, arguments);
}

/**
 * 轮询直到识别完成
 * @param taskId 任务 ID
 * @param maxRetries 最大轮询次数（默认 20 次，每 2s 一次 = 40s）
 */
function _queryTaskStatus() {
  _queryTaskStatus = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee8(taskId) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          return _context8.a(2, request({
            url: "/api/speech/task-status/".concat(taskId)
          }));
      }
    }, _callee8);
  }));
  return _queryTaskStatus.apply(this, arguments);
}
function pollTranscribe(_x8) {
  return _pollTranscribe.apply(this, arguments);
}
function _pollTranscribe() {
  _pollTranscribe = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee9(taskId) {
    var maxRetries,
      i,
      result,
      _args9 = arguments;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context9) {
      while (1) switch (_context9.n) {
        case 0:
          maxRetries = _args9.length > 1 && _args9[1] !== undefined ? _args9[1] : 20;
          i = 0;
        case 1:
          if (!(i < maxRetries)) {
            _context9.n = 6;
            break;
          }
          _context9.n = 2;
          return new Promise(function (r) {
            return setTimeout(r, 2000);
          });
        case 2:
          _context9.n = 3;
          return queryTaskStatus(taskId);
        case 3:
          result = _context9.v;
          if (!(result.status === 2)) {
            _context9.n = 4;
            break;
          }
          return _context9.a(2, result.text || '');
        case 4:
          if (!(result.status === 3)) {
            _context9.n = 5;
            break;
          }
          throw new Error('语音识别失败');
        case 5:
          i++;
          _context9.n = 1;
          break;
        case 6:
          throw new Error('识别超时，请手动输入');
        case 7:
          return _context9.a(2);
      }
    }, _callee9);
  }));
  return _pollTranscribe.apply(this, arguments);
}
function createDiary(_x9) {
  return _createDiary.apply(this, arguments);
}
function _createDiary() {
  _createDiary = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee0(params) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context0) {
      while (1) switch (_context0.n) {
        case 0:
          return _context0.a(2, request({
            url: '/api/diary',
            method: 'POST',
            data: params
          }));
      }
    }, _callee0);
  }));
  return _createDiary.apply(this, arguments);
}
function analyzeDiary(_x0) {
  return _analyzeDiary.apply(this, arguments);
}
function _analyzeDiary() {
  _analyzeDiary = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee1(diaryId) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context1) {
      while (1) switch (_context1.n) {
        case 0:
          return _context1.a(2, request({
            url: '/api/analysis',
            method: 'POST',
            data: {
              diaryId: diaryId
            }
          }));
      }
    }, _callee1);
  }));
  return _analyzeDiary.apply(this, arguments);
}
function getLatestAnalysis() {
  return _getLatestAnalysis.apply(this, arguments);
}
function _getLatestAnalysis() {
  _getLatestAnalysis = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee10() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context10) {
      while (1) switch (_context10.n) {
        case 0:
          return _context10.a(2, request({
            url: '/api/analysis/latest'
          }));
      }
    }, _callee10);
  }));
  return _getLatestAnalysis.apply(this, arguments);
}
function getDiaryList() {
  return _getDiaryList.apply(this, arguments);
}
function _getDiaryList() {
  _getDiaryList = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee11() {
    var page,
      pageSize,
      _args11 = arguments;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context11) {
      while (1) switch (_context11.n) {
        case 0:
          page = _args11.length > 0 && _args11[0] !== undefined ? _args11[0] : 1;
          pageSize = _args11.length > 1 && _args11[1] !== undefined ? _args11[1] : 20;
          return _context11.a(2, request({
            url: "/api/diary?page=".concat(page, "&pageSize=").concat(pageSize)
          }));
      }
    }, _callee11);
  }));
  return _getDiaryList.apply(this, arguments);
}
function getDiaryDetail(_x1) {
  return _getDiaryDetail.apply(this, arguments);
}
function _getDiaryDetail() {
  _getDiaryDetail = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee12(id) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context12) {
      while (1) switch (_context12.n) {
        case 0:
          return _context12.a(2, request({
            url: "/api/diary/".concat(id)
          }));
      }
    }, _callee12);
  }));
  return _getDiaryDetail.apply(this, arguments);
}
function getTrend() {
  return _getTrend.apply(this, arguments);
}
function _getTrend() {
  _getTrend = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee13() {
    var days,
      _args13 = arguments;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context13) {
      while (1) switch (_context13.n) {
        case 0:
          days = _args13.length > 0 && _args13[0] !== undefined ? _args13[0] : 7;
          return _context13.a(2, request({
            url: "/api/analysis/trend?days=".concat(days)
          }));
      }
    }, _callee13);
  }));
  return _getTrend.apply(this, arguments);
}
function getContinuity() {
  return _getContinuity.apply(this, arguments);
}
function _getContinuity() {
  _getContinuity = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee14() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context14) {
      while (1) switch (_context14.n) {
        case 0:
          return _context14.a(2, request({
            url: '/api/analysis/continuity'
          }));
      }
    }, _callee14);
  }));
  return _getContinuity.apply(this, arguments);
}
function getReview() {
  return _getReview.apply(this, arguments);
}
function _getReview() {
  _getReview = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee15() {
    var days,
      _args15 = arguments;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context15) {
      while (1) switch (_context15.n) {
        case 0:
          days = _args15.length > 0 && _args15[0] !== undefined ? _args15[0] : 30;
          return _context15.a(2, request({
            url: "/api/analysis/review?days=".concat(days)
          }));
      }
    }, _callee15);
  }));
  return _getReview.apply(this, arguments);
}
function getTasks(_x10) {
  return _getTasks.apply(this, arguments);
}
function _getTasks() {
  _getTasks = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee16(analysisId) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context16) {
      while (1) switch (_context16.n) {
        case 0:
          return _context16.a(2, request({
            url: "/api/analysis/tasks/".concat(analysisId)
          }));
      }
    }, _callee16);
  }));
  return _getTasks.apply(this, arguments);
}
function submitTask(_x11, _x12, _x13) {
  return _submitTask.apply(this, arguments);
}
function _submitTask() {
  _submitTask = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee17(analysisId, taskCode, value) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context17) {
      while (1) switch (_context17.n) {
        case 0:
          return _context17.a(2, request({
            url: '/api/analysis/tasks/submit',
            method: 'POST',
            data: {
              analysisId: analysisId,
              taskCode: taskCode,
              value: value
            }
          }));
      }
    }, _callee17);
  }));
  return _submitTask.apply(this, arguments);
}
function submitFeedback(_x14, _x15, _x16) {
  return _submitFeedback.apply(this, arguments);
}
function _submitFeedback() {
  _submitFeedback = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee18(analysisId, feedbackScore, correctedState) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context18) {
      while (1) switch (_context18.n) {
        case 0:
          return _context18.a(2, request({
            url: '/api/analysis/feedback',
            method: 'POST',
            data: {
              analysisId: analysisId,
              feedbackScore: feedbackScore,
              correctedState: correctedState
            }
          }));
      }
    }, _callee18);
  }));
  return _submitFeedback.apply(this, arguments);
}
function getDebugLatest() {
  return _getDebugLatest.apply(this, arguments);
}
function _getDebugLatest() {
  _getDebugLatest = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee19() {
    var limit,
      _args19 = arguments;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context19) {
      while (1) switch (_context19.n) {
        case 0:
          limit = _args19.length > 0 && _args19[0] !== undefined ? _args19[0] : 20;
          return _context19.a(2, request({
            url: "/api/analysis/debug/latest?limit=".concat(limit)
          }));
      }
    }, _callee19);
  }));
  return _getDebugLatest.apply(this, arguments);
}
function getMapperStats() {
  return _getMapperStats.apply(this, arguments);
}
function _getMapperStats() {
  _getMapperStats = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee20() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context20) {
      while (1) switch (_context20.n) {
        case 0:
          return _context20.a(2, request({
            url: '/api/analysis/mapper-stats'
          }));
      }
    }, _callee20);
  }));
  return _getMapperStats.apply(this, arguments);
}
function getTrajectory() {
  return _getTrajectory.apply(this, arguments);
}
function _getTrajectory() {
  _getTrajectory = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee21() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context21) {
      while (1) switch (_context21.n) {
        case 0:
          return _context21.a(2, request({
            url: '/api/analysis/trajectory'
          }));
      }
    }, _callee21);
  }));
  return _getTrajectory.apply(this, arguments);
}
function prepareTaskSession(_x17, _x18, _x19, _x20, _x21) {
  return _prepareTaskSession.apply(this, arguments);
}
function _prepareTaskSession() {
  _prepareTaskSession = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee22(content, stateCode, scoreStress, scoreEmotion, currentStreak) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context22) {
      while (1) switch (_context22.n) {
        case 0:
          return _context22.a(2, request({
            url: '/api/analysis/tasks/prepare',
            method: 'POST',
            data: {
              content: content,
              stateCode: stateCode,
              scoreStress: scoreStress,
              scoreEmotion: scoreEmotion,
              currentStreak: currentStreak
            }
          }));
      }
    }, _callee22);
  }));
  return _prepareTaskSession.apply(this, arguments);
}
function completeTaskSession(_x22, _x23) {
  return _completeTaskSession.apply(this, arguments);
}

// ---- Admin CMS ----
function _completeTaskSession() {
  _completeTaskSession = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee23(sessionId, answers) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context23) {
      while (1) switch (_context23.n) {
        case 0:
          return _context23.a(2, request({
            url: '/api/analysis/tasks/complete',
            method: 'POST',
            data: {
              sessionId: sessionId,
              answers: answers
            }
          }));
      }
    }, _callee23);
  }));
  return _completeTaskSession.apply(this, arguments);
}
function listSupplementaryTasks() {
  return _listSupplementaryTasks.apply(this, arguments);
}
function _listSupplementaryTasks() {
  _listSupplementaryTasks = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee24() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context24) {
      while (1) switch (_context24.n) {
        case 0:
          return _context24.a(2, request({
            url: '/api/admin/supplementary-tasks'
          }));
      }
    }, _callee24);
  }));
  return _listSupplementaryTasks.apply(this, arguments);
}
function createSupplementaryTask(_x24) {
  return _createSupplementaryTask.apply(this, arguments);
}
function _createSupplementaryTask() {
  _createSupplementaryTask = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee25(data) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context25) {
      while (1) switch (_context25.n) {
        case 0:
          return _context25.a(2, request({
            url: '/api/admin/supplementary-tasks',
            method: 'POST',
            data: data
          }));
      }
    }, _callee25);
  }));
  return _createSupplementaryTask.apply(this, arguments);
}
function updateSupplementaryTask(_x25, _x26) {
  return _updateSupplementaryTask.apply(this, arguments);
}
function _updateSupplementaryTask() {
  _updateSupplementaryTask = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee26(taskCode, data) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context26) {
      while (1) switch (_context26.n) {
        case 0:
          return _context26.a(2, request({
            url: "/api/admin/supplementary-tasks/".concat(taskCode),
            method: 'PUT',
            data: data
          }));
      }
    }, _callee26);
  }));
  return _updateSupplementaryTask.apply(this, arguments);
}
function archiveSupplementaryTask(_x27) {
  return _archiveSupplementaryTask.apply(this, arguments);
}
function _archiveSupplementaryTask() {
  _archiveSupplementaryTask = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee27(taskCode) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context27) {
      while (1) switch (_context27.n) {
        case 0:
          return _context27.a(2, request({
            url: "/api/admin/supplementary-tasks/".concat(taskCode),
            method: 'DELETE'
          }));
      }
    }, _callee27);
  }));
  return _archiveSupplementaryTask.apply(this, arguments);
}
function getInviteStatus() {
  return _getInviteStatus.apply(this, arguments);
}
function _getInviteStatus() {
  _getInviteStatus = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee28() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context28) {
      while (1) switch (_context28.n) {
        case 0:
          return _context28.a(2, request({
            url: '/api/invite/me'
          }));
      }
    }, _callee28);
  }));
  return _getInviteStatus.apply(this, arguments);
}
function getInviteList() {
  return _getInviteList.apply(this, arguments);
}
function _getInviteList() {
  _getInviteList = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee29() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context29) {
      while (1) switch (_context29.n) {
        case 0:
          return _context29.a(2, request({
            url: '/api/invite/list'
          }));
      }
    }, _callee29);
  }));
  return _getInviteList.apply(this, arguments);
}
function bindInviteCode(_x28) {
  return _bindInviteCode.apply(this, arguments);
}
function _bindInviteCode() {
  _bindInviteCode = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee30(inviteCode) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context30) {
      while (1) switch (_context30.n) {
        case 0:
          return _context30.a(2, request({
            url: '/api/invite/bind',
            method: 'POST',
            data: {
              inviteCode: inviteCode
            }
          }));
      }
    }, _callee30);
  }));
  return _bindInviteCode.apply(this, arguments);
}
function listActivities(_x29) {
  return _listActivities.apply(this, arguments);
}
function _listActivities() {
  _listActivities = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee31(status) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context31) {
      while (1) switch (_context31.n) {
        case 0:
          return _context31.a(2, request({
            url: "/api/activities".concat(status ? "?status=".concat(status) : '')
          }));
      }
    }, _callee31);
  }));
  return _listActivities.apply(this, arguments);
}
function getActivityDetail(_x30) {
  return _getActivityDetail.apply(this, arguments);
}
function _getActivityDetail() {
  _getActivityDetail = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee32(id) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context32) {
      while (1) switch (_context32.n) {
        case 0:
          return _context32.a(2, request({
            url: "/api/activities/".concat(id)
          }));
      }
    }, _callee32);
  }));
  return _getActivityDetail.apply(this, arguments);
}
function logShare(_x31) {
  return _logShare.apply(this, arguments);
}

// ---- Walker Path (行者之路) ----
function _logShare() {
  _logShare = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee33(activityId) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context33) {
      while (1) switch (_context33.n) {
        case 0:
          return _context33.a(2, request({
            url: "/api/activities/".concat(activityId, "/share"),
            method: 'POST',
            data: {
              channel: 'friend'
            }
          }));
      }
    }, _callee33);
  }));
  return _logShare.apply(this, arguments);
}
function getMyCertificates() {
  return _getMyCertificates.apply(this, arguments);
}
function _getMyCertificates() {
  _getMyCertificates = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee34() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context34) {
      while (1) switch (_context34.n) {
        case 0:
          return _context34.a(2, request({
            url: '/api/certificates/my'
          }));
      }
    }, _callee34);
  }));
  return _getMyCertificates.apply(this, arguments);
}
function getMyRegistrations() {
  return _getMyRegistrations.apply(this, arguments);
}
function _getMyRegistrations() {
  _getMyRegistrations = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee35() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context35) {
      while (1) switch (_context35.n) {
        case 0:
          return _context35.a(2, request({
            url: '/api/activities/my/list'
          }));
      }
    }, _callee35);
  }));
  return _getMyRegistrations.apply(this, arguments);
}
function getMyOrders() {
  return _getMyOrders.apply(this, arguments);
}
function _getMyOrders() {
  _getMyOrders = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee36() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context36) {
      while (1) switch (_context36.n) {
        case 0:
          return _context36.a(2, request({
            url: '/api/orders/my'
          }));
      }
    }, _callee36);
  }));
  return _getMyOrders.apply(this, arguments);
}
function getFootprintStats() {
  return _getFootprintStats.apply(this, arguments);
}
function _getFootprintStats() {
  _getFootprintStats = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee37() {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context37) {
      while (1) switch (_context37.n) {
        case 0:
          return _context37.a(2, request({
            url: '/api/footprint/stats'
          }));
      }
    }, _callee37);
  }));
  return _getFootprintStats.apply(this, arguments);
}
function getCertificateCompanions(_x32) {
  return _getCertificateCompanions.apply(this, arguments);
}
function _getCertificateCompanions() {
  _getCertificateCompanions = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee38(certId) {
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context38) {
      while (1) switch (_context38.n) {
        case 0:
          return _context38.a(2, request({
            url: "/api/certificates/".concat(certId, "/companions")
          }));
      }
    }, _callee38);
  }));
  return _getCertificateCompanions.apply(this, arguments);
}

/***/ }),

/***/ "./src/services/auth.ts":
/*!******************************!*\
  !*** ./src/services/auth.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "doLogin": function() { return /* binding */ doLogin; },
/* harmony export */   "getConsent": function() { return /* binding */ getConsent; },
/* harmony export */   "getSavedCity": function() { return /* binding */ getSavedCity; },
/* harmony export */   "isLocationGranted": function() { return /* binding */ isLocationGranted; },
/* harmony export */   "setConsent": function() { return /* binding */ setConsent; },
/* harmony export */   "setLocationGranted": function() { return /* binding */ setLocationGranted; },
/* harmony export */   "setSavedCity": function() { return /* binding */ setSavedCity; },
/* harmony export */   "storePendingInviter": function() { return /* binding */ storePendingInviter; }
/* harmony export */ });
/* unused harmony export consumePendingInviter */
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var _Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");




var CONSENT_KEY = 'xingzhe_user_consent';
var INVITER_KEY = 'xingzhe_pending_inviter';
var LOC_KEY = 'xingzhe_location_granted';

// ---- Location Lock ----

function isLocationGranted() {
  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(LOC_KEY) === '1';
}
function setLocationGranted(v) {
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(LOC_KEY, v ? '1' : '0');
}

// ---- User Consent ----

function getConsent() {
  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(CONSENT_KEY) === '1';
}
function setConsent(agreed) {
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(CONSENT_KEY, agreed ? '1' : '0');
}

// ---- Invite Chain ----

function storePendingInviter(inviterId) {
  if (!inviterId) return;
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(INVITER_KEY, inviterId);
}
function consumePendingInviter() {
  var id = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(INVITER_KEY);
  if (id) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().removeStorageSync(INVITER_KEY);
    return id;
  }
  return undefined;
}
var CITY_KEY = 'xingzhe_city';
var DEFAULT_CITY = '';
// ---- City ----

function getSavedCity() {
  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync(CITY_KEY) || DEFAULT_CITY;
}
function setSavedCity(city) {
  _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().setStorageSync(CITY_KEY, city);
}

// ---- Demo phone login (production: wx.getPhoneNumber → backend decrypt) ----

/**
 * Complete phone-based login.
 * On real device without backend, creates a demo token.
 * Inviter ID is consumed from the share link chain.
 */
function doLogin(_x) {
  return _doLogin.apply(this, arguments);
}
function _doLogin() {
  _doLogin = (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().m(function _callee(inviteCode) {
    var BASE_URL, apiBase, pendingInviter, finalCode, isRealDevice, token, _body$data, res, body, _e$message, _token, _t;
    return (0,_Users_chen_projects_tenselog_miniapp_tenselog_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          BASE_URL = ( true ? "localhost" : 0) || 0;
          apiBase = "http://".concat(BASE_URL, ":3000"); // Consume inviter from share link
          pendingInviter = consumePendingInviter();
          finalCode = inviteCode || pendingInviter || undefined;
          isRealDevice = function () {
            try {
              var info = _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getSystemInfoSync();
              return info.platform !== 'devtools';
            } catch (_) {
              return false;
            }
          }();
          if (!isRealDevice) {
            _context.n = 1;
            break;
          }
          // Real device: generate demo token
          token = 'demo_token_' + Date.now();
          (0,_api__WEBPACK_IMPORTED_MODULE_1__.setToken)(token);
          return _context.a(2, {
            token: token,
            user: {
              userId: 'demo-user',
              nickName: '微信用户',
              avatarUrl: ''
            },
            bindMsg: finalCode ? '邀请关系已建立' : null
          });
        case 1:
          _context.p = 1;
          _context.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(apiBase, "/api/auth/login"),
            method: 'POST',
            header: {
              'Content-Type': 'application/json'
            },
            data: {
              code: 'phone_mock_' + Date.now(),
              nickname: '微信用户',
              manualInviteCode: finalCode
            }
          });
        case 2:
          res = _context.v;
          body = res.data;
          if (!(body.code === 0 && (_body$data = body.data) !== null && _body$data !== void 0 && _body$data.token)) {
            _context.n = 3;
            break;
          }
          (0,_api__WEBPACK_IMPORTED_MODULE_1__.setToken)(body.data.token);
          return _context.a(2, body.data);
        case 3:
          throw new Error(body.message || '登录失败');
        case 4:
          _context.p = 4;
          _t = _context.v;
          if (!((_e$message = _t.message) !== null && _e$message !== void 0 && _e$message.includes('request:fail'))) {
            _context.n = 5;
            break;
          }
          // Backend unreachable — demo fallback
          _token = 'demo_token_' + Date.now();
          (0,_api__WEBPACK_IMPORTED_MODULE_1__.setToken)(_token);
          return _context.a(2, {
            token: _token,
            user: {
              userId: 'demo-user',
              nickName: '微信用户',
              avatarUrl: ''
            },
            bindMsg: finalCode ? '邀请关系已建立' : null
          });
        case 5:
          throw _t;
        case 6:
          return _context.a(2);
      }
    }, _callee, null, [[1, 4]]);
  }));
  return _doLogin.apply(this, arguments);
}

/***/ }),

/***/ "./src/services/demoData.ts":
/*!**********************************!*\
  !*** ./src/services/demoData.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEMO_ACTIVITIES": function() { return /* binding */ DEMO_ACTIVITIES; },
/* harmony export */   "DEMO_CERTIFICATES": function() { return /* binding */ DEMO_CERTIFICATES; },
/* harmony export */   "DEMO_COMPANIONS": function() { return /* binding */ DEMO_COMPANIONS; },
/* harmony export */   "DEMO_REGISTRATIONS": function() { return /* binding */ DEMO_REGISTRATIONS; },
/* harmony export */   "DEMO_USER_PROFILE": function() { return /* binding */ DEMO_USER_PROFILE; }
/* harmony export */ });
/* unused harmony export DEMO_MODE */
/**
 * Demo / Mock data for visual validation.
 *
 * Enabled by default when the backend returns empty arrays.
 * To disable, set DEMO_MODE = false or remove the fallback in api.ts.
 */
var DEMO_MODE = true;
var DEMO_ACTIVITIES = [{
  id: 'demo-act-1',
  title: '城市行走 · AI 与人生',
  cover: '',
  summary: '用一整个上午，把身体从屏幕里带出来。不止是行走，更是一场关于 AI 时代如何自处的精神讨论。',
  content: '<p>上海外滩出发，沿着苏州河漫步至静安。全程约 6 公里，途中设三个分享点。本场由资深行者带领，结合城市历史与 AI 时代的人文思考。</p>',
  startTime: '2026-08-18T08:30:00',
  endTime: '2026-08-18T12:00:00',
  location: '上海',
  organizer: '行者学社',
  price: 0,
  capacity: 100,
  status: 'PUBLISHED',
  registeredCount: 86,
  isRegistered: true,
  registrationStatus: 'REGISTERED',
  createdAt: '2026-06-01T00:00:00'
}, {
  id: 'demo-act-2',
  title: '山野徒步 · 城市之外的精神补给',
  cover: '',
  summary: '周末，把身体还给山野。一次中低强度的徒步，适合所有想从屏幕前走出去的人。',
  content: '<p>杭州龙井出发，途经九溪十八涧，全程约 8 公里，爬升约 300 米。途中有茶歇点，可在茶山间短暂冥想。</p>',
  startTime: '2026-07-12T07:00:00',
  endTime: '2026-07-12T14:00:00',
  location: '杭州',
  organizer: '行者学社',
  price: 0,
  capacity: 50,
  status: 'PUBLISHED',
  registeredCount: 42,
  isRegistered: true,
  registrationStatus: 'REGISTERED',
  createdAt: '2026-05-15T00:00:00'
}, {
  id: 'demo-act-3',
  title: '深圳湾夜行 · 跑者的城市边界',
  cover: '',
  summary: '夜幕降临后的深圳湾，城市的灯火与海浪声交织。一次为跑者设计的夜行体验。',
  content: '<p>深圳湾公园出发，沿海岸线步道行进，全程 10 公里。中途设补水点和拉伸指导。</p>',
  startTime: '2026-09-05T19:00:00',
  endTime: '2026-09-05T22:00:00',
  location: '深圳',
  organizer: '行者学社',
  price: 0,
  capacity: 80,
  status: 'PUBLISHED',
  registeredCount: 64,
  isRegistered: true,
  registrationStatus: 'REGISTERED',
  createdAt: '2026-04-20T00:00:00'
}, {
  id: 'demo-act-4',
  title: '北京 · 胡同里的精神恢复',
  cover: '',
  summary: '穿过老北京的胡同，在灰色砖墙间寻找内心的秩序。',
  content: '<p>南锣鼓巷出发，走过后海、什刹海。全程约 5 公里，适合所有年龄。</p>',
  startTime: '2026-09-20T09:00:00',
  endTime: '2026-09-20T12:00:00',
  location: '北京',
  organizer: '行者学社',
  price: 88,
  capacity: 30,
  status: 'PUBLISHED',
  registeredCount: 0,
  isRegistered: false,
  createdAt: '2026-06-05T00:00:00'
}];
var DEMO_CERTIFICATES = [{
  id: 'demo-cert-1',
  userId: 'demo-user',
  activityId: 'demo-act-1',
  certificateNo: 'CERT20260818SH001',
  certificateType: 'SPEAKER',
  certificateUrl: '',
  status: 'GENERATED',
  downloadCount: 0,
  createdAt: '2026-08-18T12:00:00',
  activity: DEMO_ACTIVITIES[0]
}, {
  id: 'demo-cert-2',
  userId: 'demo-user',
  activityId: 'demo-act-2',
  certificateNo: 'CERT20260712HZ001',
  certificateType: 'WALKER',
  certificateUrl: '',
  status: 'GENERATED',
  downloadCount: 0,
  createdAt: '2026-07-12T14:00:00',
  activity: DEMO_ACTIVITIES[1]
}, {
  id: 'demo-cert-3',
  userId: 'demo-user',
  activityId: 'demo-act-3',
  certificateNo: 'CERT20260905SZ001',
  certificateType: 'WALKER',
  certificateUrl: '',
  status: 'GENERATED',
  downloadCount: 0,
  createdAt: '2026-09-05T22:00:00',
  activity: DEMO_ACTIVITIES[2]
}];
var DEMO_REGISTRATIONS = [{
  id: 'demo-reg-1',
  activityId: 'demo-act-1',
  userId: 'demo-user',
  status: 'REGISTERED',
  createdAt: '2026-06-01T00:00:00',
  activity: DEMO_ACTIVITIES[0]
}, {
  id: 'demo-reg-2',
  activityId: 'demo-act-2',
  userId: 'demo-user',
  status: 'REGISTERED',
  createdAt: '2026-05-15T00:00:00',
  activity: DEMO_ACTIVITIES[1]
}, {
  id: 'demo-reg-3',
  activityId: 'demo-act-3',
  userId: 'demo-user',
  status: 'REGISTERED',
  createdAt: '2026-04-20T00:00:00',
  activity: DEMO_ACTIVITIES[2]
}];
var DEMO_COMPANIONS = [{
  nickName: '山野行者',
  sharedCount: 3
}, {
  nickName: '城市漫步者',
  sharedCount: 2
}, {
  nickName: '风中骆驼',
  sharedCount: 2
}, {
  nickName: '夜跑阿莱',
  sharedCount: 1
}, {
  nickName: '徒步叶子',
  sharedCount: 1
}, {
  nickName: '读行者',
  sharedCount: 1
}, {
  nickName: '北纬三十度',
  sharedCount: 1
}, {
  nickName: '山海之间',
  sharedCount: 1
}, {
  nickName: '了不起的麦子',
  sharedCount: 1
}, {
  nickName: '跑者无忌',
  sharedCount: 1
}];
var DEMO_USER_PROFILE = {
  userId: 'demo-user',
  nickName: '行者阿寺',
  createdAt: '2025-10-15T00:00:00',
  inviteCode: 'TGXZ7K'
};

/***/ })

}]);
//# sourceMappingURL=common.js.map