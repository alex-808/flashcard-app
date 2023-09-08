/* eslint-disable */

export const protobufPackage = "user";

export interface User {
  id: string;
  userName: string;
  email: string;
  passwordHash: string;
}

export interface UserCreateRequest {
  userName: string;
  email: string;
  password: string;
}
