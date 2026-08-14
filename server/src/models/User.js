import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: true
  },
  role: { type: String, enum: ["Admin", "Teacher", "Student"], required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  status: { type: String, enum: ["Active", "Inactive", "Suspended"], default: "Active" },
  avatar: { type: String },
  refreshToken: { type: String },
  mobile: { type: Number },
  registeredDeviceId: { type: String, default: null }
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = bcrypt.hashSync(this.password, 10);
});

userSchema.methods.comparePassword = function (password) {
  if (!this.password) return false;
  return bcrypt.compareSync(password, this.password);
};

export default mongoose.model("User", userSchema);
