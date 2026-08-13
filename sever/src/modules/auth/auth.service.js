import * as error from "../../shared/error/globalError.js";
import * as token from "../../utils/generateToken.js";
import User from "../../models/User.js";

export default class AuthService {
  async registerService(data) {
    const { name, email, password, role, departmentId } = data;
    const isExisted = await User.findOne({ email });
    if (isExisted) throw new error.ALLREADYEXIST("User already exists");
    
    const user = await User.create({ name, email, password, role, departmentId });
    const accessToken = token.generateAccessToken(user._id);
    const refreshToken = token.generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    return { accessToken, refreshToken, user };
  }

  async loginService(data) {
    const { email, password } = data;
    const user = await User.findOne({ email });
    if (!user) throw new error.NOTFOUNDERROR("User not found");
    
    const compare = user.comparePassword(password);
    if (!compare) throw new error.UNAUTHORIZED("Wrong Credentials");
    
    if (user.status === "Suspended" || user.status === "Inactive") {
      throw new error.UNAUTHORIZED(`Account is ${user.status}`);
    }

    const accessToken = token.generateAccessToken(user._id);
    const refreshToken = token.generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    return { accessToken, refreshToken, user };
  }
}
