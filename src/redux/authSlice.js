import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance"; // instance của bạn

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await axiosInstance.post("/users/login", {
        email,
        password,
      });
      // data giả sử trả về { user, accessToken }
      return data; // trả cả user + accessToken
    } catch (error) {
      return rejectWithValue(
        error.errors?.email?.msg ||
          error.errors?.password?.msg ||
          error.message ||
          "Login failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    login: {
      currentUser: null,
      accessToken: null,
      isLoading: false,
      error: false,
      errorMessage: null,
    },
    register: {
      isLoading: false,
      error: false,
      success: false,
    },
    logout: {
      isLoading: false,
      error: false,
    },
  },
  reducers: {
    clearLoginError: (state) => {
      state.login.error = null;
      state.login.errorMessage = null;
    },
    // loginStart: (state) => {
    //   state.login.isLoading = true;
    // },
    // loginSuccess: (state, action) => {
    //   state.login.isLoading = false;
    //   state.login.currentUser = action.payload.user;
    //   state.login.accessToken = action.payload.accessToken; // Assuming token is part of the payload
    //   state.login.error = false;
    // },
    // loginFailed: (state) => {
    //   state.login.isLoading = false;
    //   state.login.error = true;
    // },
    // registerStart: (state) => {
    //   state.register.isLoading = true;
    // },
    // registerSuccess: (state) => {
    //   state.register.isLoading = false;
    //   state.register.error = false;
    //   state.register.success = true;
    // },
    // registerFailed: (state) => {
    //   state.register.isLoading = false;
    //   state.register.error = true;
    //   state.register.success = false;
    // },
    logoutSuccess: (state) => {
      state.login.isLoading = false;
      state.login.currentUser = null;
      state.login.accessToken = null;
      state.login.error = false;
    },
    // logoutFailed: (state) => {
    //   state.login.isLoading = false;
    //   state.login.error = true;
    // },
    // logoutStart: (state) => {
    //   state.login.isLoading = true;
    // },
    setAccessToken: (state, action) => {
      state.login.accessToken = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.login.currentUser = action.payload.user;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.login.isLoading = true;
        state.login.error = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.login.isLoading = false;
        state.login.currentUser = action.payload.user;
        state.login.accessToken = action.payload.access_token;
        state.login.error = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.isLoading = false;
        state.login.error = true;
        state.login.errorMessage = action.payload;
      });
  },
});

export const {
  clearLoginError,
  // registerStart,
  // registerSuccess,
  // registerFailed,
  // logoutStart,
  logoutSuccess,
  // logoutFailed,
  setAccessToken,
  setCurrentUser,
} = authSlice.actions;

export default authSlice.reducer;
