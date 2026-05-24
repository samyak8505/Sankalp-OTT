import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchPendingNotifications = createAsyncThunk(
  'notifications/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/notifications/pending');
      return response.data.data || [];
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to fetch notifications';
      return rejectWithValue(message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.put(`/v1/notifications/${notificationId}/read`);
      return notificationId;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);

const initialState = {
  pending: [],
  all: [],
  loading: false,
  error: null,
  showModal: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    dismissNotification: (state, action) => {
      state.pending = state.pending.filter(n => n.id !== action.payload);
    },
    setShowModal: (state, action) => {
      state.showModal = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.pending = action.payload.pending || [];
        if (state.pending.length > 0) {
          state.showModal = true;
        }
      })
      .addCase(fetchPendingNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.pending = state.pending.filter(n => n.id !== action.payload);
      });
  },
});

export const { dismissNotification, setShowModal } = notificationSlice.actions;
export default notificationSlice.reducer;
