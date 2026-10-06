import jwt from "jsonwebtoken";

const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in .env");
  }
  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

export default generateToken;
