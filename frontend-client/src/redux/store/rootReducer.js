import { combineReducers } from '@reduxjs/toolkit';

import authReducer from '../slices/authSlice';
import reelsReducer from '../slices/reelsSlice';
import showPlayerReducer from '../slices/showPlayerSlice';
import myListReducer from '../slices/myListSlice'; // NEW
import notificationReducer from '../slices/notificationSlice'; // NEW

const rootReducer = combineReducers({
  auth: authReducer,
  reels: reelsReducer,
  showPlayer: showPlayerReducer,
  myList: myListReducer, // NEW
  notifications: notificationReducer, // NEW
});

export default rootReducer;