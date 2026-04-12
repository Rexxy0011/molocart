import mongoose from "mongoose";

// Cache the connection across serverless invocations
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.connection.on("connected", () =>
      console.log("Database connected")
    );
    cached.promise = mongoose
      .connect(`${process.env.MONGODB_URI}/molocart`)
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default connectDB;
