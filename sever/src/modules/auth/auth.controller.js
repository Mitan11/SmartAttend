import AuthService from "./auth.service.js";
import { app_constant } from "../../constant/app.constant.js";
import { sendSuccess } from "../../utils/response.js";

export default class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async registerController(req, res) {
    const result = await this.authService.registerService(req.body);
    res.cookie("accessToken", result.accessToken, app_constant.cookie.accessToken);
    res.cookie("refreshToken", result.refreshToken, app_constant.cookie.refreshToken);
    return sendSuccess(res, 201, "User registered successfully", { user: result.user });
  }

  async loginController(req, res) {
    const result = await this.authService.loginService(req.body);
    res.cookie("accessToken", result.accessToken, app_constant.cookie.accessToken);
    res.cookie("refreshToken", result.refreshToken, app_constant.cookie.refreshToken);
    return sendSuccess(res, 200, "User logged in successfully", { user: result.user });
  }

  async logoutController(req, res) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return sendSuccess(res, 200, "User logged out successfully");
  }

  async meController(req, res) {
    return sendSuccess(res, 200, "User profile retrieved", { user: req.user });
  }
}
