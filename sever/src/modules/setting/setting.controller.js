import Setting from "../../models/Setting.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class SettingController {
  // Get global settings (create defaults if not exists)
  async getSettings(req, res) {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }
    return sendSuccess(res, 200, "Settings retrieved successfully", { setting });
  }

  // Update global settings
  async updateSettings(req, res) {
    const { defaultGeofenceRadius, qrRotationInterval, allowTeacherOverrides } = req.body;
    
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
    }

    if (defaultGeofenceRadius !== undefined) setting.defaultGeofenceRadius = defaultGeofenceRadius;
    if (qrRotationInterval !== undefined) setting.qrRotationInterval = qrRotationInterval;
    if (allowTeacherOverrides !== undefined) setting.allowTeacherOverrides = allowTeacherOverrides;

    await setting.save();

    return sendSuccess(res, 200, "Settings updated successfully", { setting });
  }
}
