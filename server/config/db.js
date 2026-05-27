import dns from "dns";
import mongoose from "mongoose";

// Windows/local DNS often refuses SRV lookups; mongodb+srv:// needs them.
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set in environment");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
};

export default connectDB;
