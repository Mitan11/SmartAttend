import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    defaultGeofenceRadius: {
      type: Number,
      default: 50,
      min: 10,
      max: 1000
    },
    qrRotationInterval: {
      type: Number,
      default: 15, // seconds
      min: 5,
      max: 60
    },
    allowTeacherOverrides: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;
