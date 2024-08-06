import mongoose from "mongoose";

export const connect = async () => {
  try {
    await mongoose.set("strictQuery", false);
    await mongoose.connect(
      "mongodb+srv://chien:12341234@chien.nsh8gkh.mongodb.net/do-an",
      {
      }
    );
    console.log("Connect database successfully!!!");
  } catch (error) {
    console.log("Connect database failure!!!");
  }
};
