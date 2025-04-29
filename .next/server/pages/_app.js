/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./contexts/AuthContext.js":
/*!*********************************!*\
  !*** ./contexts/AuthContext.js ***!
  \*********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AuthProvider: () => (/* binding */ AuthProvider),\n/* harmony export */   useAuth: () => (/* binding */ useAuth)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_firebase__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../lib/firebase */ \"./lib/firebase.js\");\n/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! firebase/auth */ \"firebase/auth\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! firebase/firestore */ \"firebase/firestore\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_firebase__WEBPACK_IMPORTED_MODULE_2__, firebase_auth__WEBPACK_IMPORTED_MODULE_3__, firebase_firestore__WEBPACK_IMPORTED_MODULE_4__]);\n([_lib_firebase__WEBPACK_IMPORTED_MODULE_2__, firebase_auth__WEBPACK_IMPORTED_MODULE_3__, firebase_firestore__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\n\n\nconst AuthContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)();\nfunction AuthProvider({ children }) {\n    const [user, setUser] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [userData, setUserData] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        const unsubscribe = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_3__.onAuthStateChanged)(_lib_firebase__WEBPACK_IMPORTED_MODULE_2__.auth, async (user)=>{\n            setUser(user);\n            if (user) {\n                // Fetch additional user data from Firestore\n                const userDoc = await (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_4__.getDoc)((0,firebase_firestore__WEBPACK_IMPORTED_MODULE_4__.doc)(_lib_firebase__WEBPACK_IMPORTED_MODULE_2__.db, \"users\", user.uid));\n                if (userDoc.exists()) {\n                    setUserData(userDoc.data());\n                } else {\n                    setUserData(null);\n                }\n            } else {\n                setUserData(null);\n            }\n            setLoading(false);\n        });\n        return unsubscribe;\n    }, []);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AuthContext.Provider, {\n        value: {\n            user,\n            userData,\n            loading\n        },\n        children: !loading && children\n    }, void 0, false, {\n        fileName: \"/Users/johanna/Documents/onlyfries-app/contexts/AuthContext.js\",\n        lineNumber: 35,\n        columnNumber: 5\n    }, this);\n}\nfunction useAuth() {\n    return (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AuthContext);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb250ZXh0cy9BdXRoQ29udGV4dC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQXVFO0FBQ2hDO0FBQ1k7QUFDRjtBQUNaO0FBRXJDLE1BQU1TLDRCQUFjVCxvREFBYUE7QUFFMUIsU0FBU1UsYUFBYSxFQUFFQyxRQUFRLEVBQUU7SUFDdkMsTUFBTSxDQUFDQyxNQUFNQyxRQUFRLEdBQUdWLCtDQUFRQSxDQUFDO0lBQ2pDLE1BQU0sQ0FBQ1csVUFBVUMsWUFBWSxHQUFHWiwrQ0FBUUEsQ0FBQztJQUN6QyxNQUFNLENBQUNhLFNBQVNDLFdBQVcsR0FBR2QsK0NBQVFBLENBQUM7SUFFdkNELGdEQUFTQSxDQUFDO1FBQ1IsTUFBTWdCLGNBQWNiLGlFQUFrQkEsQ0FBQ0QsK0NBQUlBLEVBQUUsT0FBT1E7WUFDbERDLFFBQVFEO1lBQ1IsSUFBSUEsTUFBTTtnQkFDUiw0Q0FBNEM7Z0JBQzVDLE1BQU1PLFVBQVUsTUFBTVosMERBQU1BLENBQUNELHVEQUFHQSxDQUFDRSw2Q0FBRUEsRUFBRSxTQUFTSSxLQUFLUSxHQUFHO2dCQUN0RCxJQUFJRCxRQUFRRSxNQUFNLElBQUk7b0JBQ3BCTixZQUFZSSxRQUFRRyxJQUFJO2dCQUMxQixPQUFPO29CQUNMUCxZQUFZO2dCQUNkO1lBQ0YsT0FBTztnQkFDTEEsWUFBWTtZQUNkO1lBQ0FFLFdBQVc7UUFDYjtRQUVBLE9BQU9DO0lBQ1QsR0FBRyxFQUFFO0lBRUwscUJBQ0UsOERBQUNULFlBQVljLFFBQVE7UUFBQ0MsT0FBTztZQUFFWjtZQUFNRTtZQUFVRTtRQUFRO2tCQUNwRCxDQUFDQSxXQUFXTDs7Ozs7O0FBR25CO0FBRU8sU0FBU2M7SUFDZCxPQUFPeEIsaURBQVVBLENBQUNRO0FBQ3BCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vb25seWZyaWVzLWFwcC8uL2NvbnRleHRzL0F1dGhDb250ZXh0LmpzPzU5Y2UiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlQ29udGV4dCwgdXNlQ29udGV4dCwgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGF1dGggfSBmcm9tICcuLi9saWIvZmlyZWJhc2UnO1xuaW1wb3J0IHsgb25BdXRoU3RhdGVDaGFuZ2VkIH0gZnJvbSAnZmlyZWJhc2UvYXV0aCc7XG5pbXBvcnQgeyBkb2MsIGdldERvYyB9IGZyb20gJ2ZpcmViYXNlL2ZpcmVzdG9yZSc7XG5pbXBvcnQgeyBkYiB9IGZyb20gJy4uL2xpYi9maXJlYmFzZSc7XG5cbmNvbnN0IEF1dGhDb250ZXh0ID0gY3JlYXRlQ29udGV4dCgpO1xuXG5leHBvcnQgZnVuY3Rpb24gQXV0aFByb3ZpZGVyKHsgY2hpbGRyZW4gfSkge1xuICBjb25zdCBbdXNlciwgc2V0VXNlcl0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW3VzZXJEYXRhLCBzZXRVc2VyRGF0YV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCB1bnN1YnNjcmliZSA9IG9uQXV0aFN0YXRlQ2hhbmdlZChhdXRoLCBhc3luYyAodXNlcikgPT4ge1xuICAgICAgc2V0VXNlcih1c2VyKTtcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIC8vIEZldGNoIGFkZGl0aW9uYWwgdXNlciBkYXRhIGZyb20gRmlyZXN0b3JlXG4gICAgICAgIGNvbnN0IHVzZXJEb2MgPSBhd2FpdCBnZXREb2MoZG9jKGRiLCAndXNlcnMnLCB1c2VyLnVpZCkpO1xuICAgICAgICBpZiAodXNlckRvYy5leGlzdHMoKSkge1xuICAgICAgICAgIHNldFVzZXJEYXRhKHVzZXJEb2MuZGF0YSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRVc2VyRGF0YShudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VXNlckRhdGEobnVsbCk7XG4gICAgICB9XG4gICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB1bnN1YnNjcmliZTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiAoXG4gICAgPEF1dGhDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt7IHVzZXIsIHVzZXJEYXRhLCBsb2FkaW5nIH19PlxuICAgICAgeyFsb2FkaW5nICYmIGNoaWxkcmVufVxuICAgIDwvQXV0aENvbnRleHQuUHJvdmlkZXI+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VBdXRoKCkge1xuICByZXR1cm4gdXNlQ29udGV4dChBdXRoQ29udGV4dCk7XG59ICJdLCJuYW1lcyI6WyJjcmVhdGVDb250ZXh0IiwidXNlQ29udGV4dCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiYXV0aCIsIm9uQXV0aFN0YXRlQ2hhbmdlZCIsImRvYyIsImdldERvYyIsImRiIiwiQXV0aENvbnRleHQiLCJBdXRoUHJvdmlkZXIiLCJjaGlsZHJlbiIsInVzZXIiLCJzZXRVc2VyIiwidXNlckRhdGEiLCJzZXRVc2VyRGF0YSIsImxvYWRpbmciLCJzZXRMb2FkaW5nIiwidW5zdWJzY3JpYmUiLCJ1c2VyRG9jIiwidWlkIiwiZXhpc3RzIiwiZGF0YSIsIlByb3ZpZGVyIiwidmFsdWUiLCJ1c2VBdXRoIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./contexts/AuthContext.js\n");

/***/ }),

/***/ "./lib/firebase.js":
/*!*************************!*\
  !*** ./lib/firebase.js ***!
  \*************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   auth: () => (/* binding */ auth),\n/* harmony export */   db: () => (/* binding */ db),\n/* harmony export */   storage: () => (/* binding */ storage)\n/* harmony export */ });\n/* harmony import */ var firebase_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase/app */ \"firebase/app\");\n/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! firebase/auth */ \"firebase/auth\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase/firestore */ \"firebase/firestore\");\n/* harmony import */ var firebase_storage__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! firebase/storage */ \"firebase/storage\");\n/* harmony import */ var firebase_analytics__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! firebase/analytics */ \"firebase/analytics\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([firebase_app__WEBPACK_IMPORTED_MODULE_0__, firebase_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_firestore__WEBPACK_IMPORTED_MODULE_2__, firebase_storage__WEBPACK_IMPORTED_MODULE_3__, firebase_analytics__WEBPACK_IMPORTED_MODULE_4__]);\n([firebase_app__WEBPACK_IMPORTED_MODULE_0__, firebase_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_firestore__WEBPACK_IMPORTED_MODULE_2__, firebase_storage__WEBPACK_IMPORTED_MODULE_3__, firebase_analytics__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\n\n// Validate Firebase configuration\n/*const validateConfig = (config) => {\n    const requiredFields = [\n        'apiKey',\n        'authDomain',\n        'projectId',\n        'storageBucket',\n        'messagingSenderId',\n        'appId'\n    ];\n\n    const missingFields = requiredFields.filter(field => !config[field]);\n    if (missingFields.length > 0) {\n        throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);\n    }\n    \n    return true;\n};*/ // Your web app's Firebase configuration\nconst firebaseConfig = {\n    apiKey: \"AIzaSyBt9tzisH1lRcivPB4wh7D2WzHxgkp9v4Y\",\n    authDomain: \"onlyfries-app.firebaseapp.com\",\n    projectId: \"onlyfries-app\",\n    storageBucket: \"onlyfries-app.firebasestorage.app\",\n    messagingSenderId: \"933935883918\",\n    appId: \"1:933935883918:web:66bb3a09f5981791918bdf\",\n    measurementId: \"G-RWD456SCHN\"\n};\n// Initialize Firebase\n//let app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);\n// Initialize services\nconst app = (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.initializeApp)(firebaseConfig);\nconst db = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_2__.getFirestore)(app, \"onlyfries-app\"); //Need to specify the database name!!!!\nconst auth = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_1__.getAuth)(app);\nconst storage = (0,firebase_storage__WEBPACK_IMPORTED_MODULE_3__.getStorage)(app);\n// Initialize Analytics in browser environment\nif (false) {}\n// Log initialization\nconsole.log(\"Firebase initialized with config:\", {\n    projectId: firebaseConfig.projectId,\n    authDomain: firebaseConfig.authDomain\n});\n\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9saWIvZmlyZWJhc2UuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBc0Q7QUFDZDtBQUM4QjtBQUN4QjtBQUNpQjtBQUUvRCxrQ0FBa0M7QUFDbEM7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkUsR0FFRix3Q0FBd0M7QUFDeEMsTUFBTVMsaUJBQWlCO0lBQ25CQyxRQUFRO0lBQ1JDLFlBQVk7SUFDWkMsV0FBVztJQUNYQyxlQUFlO0lBQ2ZDLG1CQUFtQjtJQUNuQkMsT0FBTztJQUNQQyxlQUFlO0FBQ25CO0FBRUEsc0JBQXNCO0FBQ3RCLDRFQUE0RTtBQUU1RSxzQkFBc0I7QUFDdEIsTUFBTUMsTUFBTWpCLDJEQUFhQSxDQUFDUztBQUMxQixNQUFNUyxLQUFLZixnRUFBWUEsQ0FBQ2MsS0FBSyxrQkFBa0IsdUNBQXVDO0FBQ3RGLE1BQU1FLE9BQU9qQixzREFBT0EsQ0FBQ2U7QUFDckIsTUFBTUcsVUFBVWQsNERBQVVBLENBQUNXO0FBRTNCLDhDQUE4QztBQUM5QyxJQUFJLEtBQWtCLEVBQWEsRUFFbEM7QUFFRCxxQkFBcUI7QUFDckJNLFFBQVFDLEdBQUcsQ0FBQyxxQ0FBcUM7SUFDN0NaLFdBQVdILGVBQWVHLFNBQVM7SUFDbkNELFlBQVlGLGVBQWVFLFVBQVU7QUFDekM7QUFFNkIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9vbmx5ZnJpZXMtYXBwLy4vbGliL2ZpcmViYXNlLmpzP2FiNDQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaW5pdGlhbGl6ZUFwcCwgZ2V0QXBwcyB9IGZyb20gXCJmaXJlYmFzZS9hcHBcIjtcbmltcG9ydCB7IGdldEF1dGggfSBmcm9tIFwiZmlyZWJhc2UvYXV0aFwiO1xuaW1wb3J0IHsgZ2V0RmlyZXN0b3JlLCBjb2xsZWN0aW9uLCBhZGREb2MgfSBmcm9tIFwiZmlyZWJhc2UvZmlyZXN0b3JlXCI7XG5pbXBvcnQgeyBnZXRTdG9yYWdlIH0gZnJvbSBcImZpcmViYXNlL3N0b3JhZ2VcIjtcbmltcG9ydCB7IGdldEFuYWx5dGljcywgaXNTdXBwb3J0ZWQgfSBmcm9tIFwiZmlyZWJhc2UvYW5hbHl0aWNzXCI7XG5cbi8vIFZhbGlkYXRlIEZpcmViYXNlIGNvbmZpZ3VyYXRpb25cbi8qY29uc3QgdmFsaWRhdGVDb25maWcgPSAoY29uZmlnKSA9PiB7XG4gICAgY29uc3QgcmVxdWlyZWRGaWVsZHMgPSBbXG4gICAgICAgICdhcGlLZXknLFxuICAgICAgICAnYXV0aERvbWFpbicsXG4gICAgICAgICdwcm9qZWN0SWQnLFxuICAgICAgICAnc3RvcmFnZUJ1Y2tldCcsXG4gICAgICAgICdtZXNzYWdpbmdTZW5kZXJJZCcsXG4gICAgICAgICdhcHBJZCdcbiAgICBdO1xuXG4gICAgY29uc3QgbWlzc2luZ0ZpZWxkcyA9IHJlcXVpcmVkRmllbGRzLmZpbHRlcihmaWVsZCA9PiAhY29uZmlnW2ZpZWxkXSk7XG4gICAgaWYgKG1pc3NpbmdGaWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgcmVxdWlyZWQgRmlyZWJhc2UgY29uZmlndXJhdGlvbiBmaWVsZHM6ICR7bWlzc2luZ0ZpZWxkcy5qb2luKCcsICcpfWApO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJ1ZTtcbn07Ki9cblxuLy8gWW91ciB3ZWIgYXBwJ3MgRmlyZWJhc2UgY29uZmlndXJhdGlvblxuY29uc3QgZmlyZWJhc2VDb25maWcgPSB7XG4gICAgYXBpS2V5OiBcIkFJemFTeUJ0OXR6aXNIMWxSY2l2UEI0d2g3RDJXekh4Z2twOXY0WVwiLFxuICAgIGF1dGhEb21haW46IFwib25seWZyaWVzLWFwcC5maXJlYmFzZWFwcC5jb21cIixcbiAgICBwcm9qZWN0SWQ6IFwib25seWZyaWVzLWFwcFwiLFxuICAgIHN0b3JhZ2VCdWNrZXQ6IFwib25seWZyaWVzLWFwcC5maXJlYmFzZXN0b3JhZ2UuYXBwXCIsXG4gICAgbWVzc2FnaW5nU2VuZGVySWQ6IFwiOTMzOTM1ODgzOTE4XCIsXG4gICAgYXBwSWQ6IFwiMTo5MzM5MzU4ODM5MTg6d2ViOjY2YmIzYTA5ZjU5ODE3OTE5MThiZGZcIixcbiAgICBtZWFzdXJlbWVudElkOiBcIkctUldENDU2U0NITlwiXG59O1xuXG4vLyBJbml0aWFsaXplIEZpcmViYXNlXG4vL2xldCBhcHAgPSBnZXRBcHBzKCkubGVuZ3RoID8gZ2V0QXBwcygpWzBdIDogaW5pdGlhbGl6ZUFwcChmaXJlYmFzZUNvbmZpZyk7XG5cbi8vIEluaXRpYWxpemUgc2VydmljZXNcbmNvbnN0IGFwcCA9IGluaXRpYWxpemVBcHAoZmlyZWJhc2VDb25maWcpO1xuY29uc3QgZGIgPSBnZXRGaXJlc3RvcmUoYXBwLCAnb25seWZyaWVzLWFwcCcpOyAvL05lZWQgdG8gc3BlY2lmeSB0aGUgZGF0YWJhc2UgbmFtZSEhISFcbmNvbnN0IGF1dGggPSBnZXRBdXRoKGFwcCk7XG5jb25zdCBzdG9yYWdlID0gZ2V0U3RvcmFnZShhcHApO1xuXG4vLyBJbml0aWFsaXplIEFuYWx5dGljcyBpbiBicm93c2VyIGVudmlyb25tZW50XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpc1N1cHBvcnRlZCgpLnRoZW4oeWVzID0+IHllcyAmJiBnZXRBbmFseXRpY3MoYXBwKSk7XG59XG5cbi8vIExvZyBpbml0aWFsaXphdGlvblxuY29uc29sZS5sb2coJ0ZpcmViYXNlIGluaXRpYWxpemVkIHdpdGggY29uZmlnOicsIHtcbiAgICBwcm9qZWN0SWQ6IGZpcmViYXNlQ29uZmlnLnByb2plY3RJZCxcbiAgICBhdXRoRG9tYWluOiBmaXJlYmFzZUNvbmZpZy5hdXRoRG9tYWluXG59KTtcblxuZXhwb3J0IHsgYXV0aCwgZGIsIHN0b3JhZ2UgfTtcbiJdLCJuYW1lcyI6WyJpbml0aWFsaXplQXBwIiwiZ2V0QXBwcyIsImdldEF1dGgiLCJnZXRGaXJlc3RvcmUiLCJjb2xsZWN0aW9uIiwiYWRkRG9jIiwiZ2V0U3RvcmFnZSIsImdldEFuYWx5dGljcyIsImlzU3VwcG9ydGVkIiwiZmlyZWJhc2VDb25maWciLCJhcGlLZXkiLCJhdXRoRG9tYWluIiwicHJvamVjdElkIiwic3RvcmFnZUJ1Y2tldCIsIm1lc3NhZ2luZ1NlbmRlcklkIiwiYXBwSWQiLCJtZWFzdXJlbWVudElkIiwiYXBwIiwiZGIiLCJhdXRoIiwic3RvcmFnZSIsInRoZW4iLCJ5ZXMiLCJjb25zb2xlIiwibG9nIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./lib/firebase.js\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _contexts_AuthContext__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../contexts/AuthContext */ \"./contexts/AuthContext.js\");\n/* harmony import */ var _global_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../global.css */ \"./global.css\");\n/* harmony import */ var _global_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_global_css__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_script__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/script */ \"./node_modules/next/script.js\");\n/* harmony import */ var next_script__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_script__WEBPACK_IMPORTED_MODULE_3__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_contexts_AuthContext__WEBPACK_IMPORTED_MODULE_1__]);\n_contexts_AuthContext__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\n// Google Maps Integration\n// This script loads the Google Maps JavaScript API with Places library\n// The API key is stored in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable\n// The 'beforeInteractive' strategy ensures the script loads before the page becomes interactive\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_contexts_AuthContext__WEBPACK_IMPORTED_MODULE_1__.AuthProvider, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"min-h-screen\",\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_script__WEBPACK_IMPORTED_MODULE_3___default()), {\n                    src: `https://maps.googleapis.com/maps/api/js?key=${\"AIzaSyBqK--z05aRUw2rZP1Lk_ELvBd2_vVUWKc\"}&libraries=places`,\n                    strategy: \"beforeInteractive\"\n                }, void 0, false, {\n                    fileName: \"/Users/johanna/Documents/onlyfries-app/pages/_app.js\",\n                    lineNumber: 13,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                    ...pageProps\n                }, void 0, false, {\n                    fileName: \"/Users/johanna/Documents/onlyfries-app/pages/_app.js\",\n                    lineNumber: 17,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"/Users/johanna/Documents/onlyfries-app/pages/_app.js\",\n            lineNumber: 12,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/johanna/Documents/onlyfries-app/pages/_app.js\",\n        lineNumber: 11,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUF1RDtBQUNqQztBQUNVO0FBRWhDLDBCQUEwQjtBQUMxQix1RUFBdUU7QUFDdkUsZ0ZBQWdGO0FBQ2hGLGdHQUFnRztBQUNoRyxTQUFTRSxNQUFNLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFFO0lBQ3JDLHFCQUNFLDhEQUFDSiwrREFBWUE7a0JBQ1gsNEVBQUNLO1lBQUlDLFdBQVU7OzhCQUNiLDhEQUFDTCxvREFBTUE7b0JBQ0xNLEtBQUssQ0FBQyw0Q0FBNEMsRUFBRUMseUNBQTJDLENBQUMsaUJBQWlCLENBQUM7b0JBQ2xIRyxVQUFTOzs7Ozs7OEJBRVgsOERBQUNSO29CQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSWhDO0FBRUEsaUVBQWVGLEtBQUtBLEVBQUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9vbmx5ZnJpZXMtYXBwLy4vcGFnZXMvX2FwcC5qcz9lMGFkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1dGhQcm92aWRlciB9IGZyb20gJy4uL2NvbnRleHRzL0F1dGhDb250ZXh0JztcbmltcG9ydCAnLi4vZ2xvYmFsLmNzcydcbmltcG9ydCBTY3JpcHQgZnJvbSAnbmV4dC9zY3JpcHQnXG5cbi8vIEdvb2dsZSBNYXBzIEludGVncmF0aW9uXG4vLyBUaGlzIHNjcmlwdCBsb2FkcyB0aGUgR29vZ2xlIE1hcHMgSmF2YVNjcmlwdCBBUEkgd2l0aCBQbGFjZXMgbGlicmFyeVxuLy8gVGhlIEFQSSBrZXkgaXMgc3RvcmVkIGluIE5FWFRfUFVCTElDX0dPT0dMRV9NQVBTX0FQSV9LRVkgZW52aXJvbm1lbnQgdmFyaWFibGVcbi8vIFRoZSAnYmVmb3JlSW50ZXJhY3RpdmUnIHN0cmF0ZWd5IGVuc3VyZXMgdGhlIHNjcmlwdCBsb2FkcyBiZWZvcmUgdGhlIHBhZ2UgYmVjb21lcyBpbnRlcmFjdGl2ZVxuZnVuY3Rpb24gTXlBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9KSB7XG4gIHJldHVybiAoXG4gICAgPEF1dGhQcm92aWRlcj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuXCI+XG4gICAgICAgIDxTY3JpcHRcbiAgICAgICAgICBzcmM9e2BodHRwczovL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvanM/a2V5PSR7cHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfR09PR0xFX01BUFNfQVBJX0tFWX0mbGlicmFyaWVzPXBsYWNlc2B9XG4gICAgICAgICAgc3RyYXRlZ3k9XCJiZWZvcmVJbnRlcmFjdGl2ZVwiXG4gICAgICAgIC8+XG4gICAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvQXV0aFByb3ZpZGVyPlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IE15QXBwICJdLCJuYW1lcyI6WyJBdXRoUHJvdmlkZXIiLCJTY3JpcHQiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsImRpdiIsImNsYXNzTmFtZSIsInNyYyIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19HT09HTEVfTUFQU19BUElfS0VZIiwic3RyYXRlZ3kiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./global.css":
/*!********************!*\
  !*** ./global.css ***!
  \********************/
/***/ (() => {



/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "firebase/analytics":
/*!*************************************!*\
  !*** external "firebase/analytics" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/analytics");;

/***/ }),

/***/ "firebase/app":
/*!*******************************!*\
  !*** external "firebase/app" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/app");;

/***/ }),

/***/ "firebase/auth":
/*!********************************!*\
  !*** external "firebase/auth" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/auth");;

/***/ }),

/***/ "firebase/firestore":
/*!*************************************!*\
  !*** external "firebase/firestore" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/firestore");;

/***/ }),

/***/ "firebase/storage":
/*!***********************************!*\
  !*** external "firebase/storage" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/storage");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();