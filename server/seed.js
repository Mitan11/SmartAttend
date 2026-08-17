import connectDB from "./src/database/db.js";
import User from "./src/models/User.js";
import mongoose from "mongoose";

async function seedAdmin() {
  try {
    await connectDB();
    console.log("Database connected successfully.");

    const adminEmail = "admin@smartattend.com";
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("Admin user already exists. Updating password...");
      existingAdmin.password = "admin123";
      await existingAdmin.save();
      console.log("Admin password updated successfully.");
    } else {
      console.log("Creating admin user...");
      const newAdmin = new User({
        name: "Super Admin",
        email: adminEmail,
        password: "admin123",
        role: "Admin",
      });
      await newAdmin.save();
      console.log("Admin user created successfully.");
    }
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  }
}

seedAdmin();
