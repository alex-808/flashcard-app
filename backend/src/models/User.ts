import { model, Model, Schema } from 'mongoose';

// This is the schema
export interface IUser {
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    _id: Schema.Types.ObjectId;
}

interface IUserMethods {
    comparePassword(password: string): boolean;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const schema = new Schema<IUser, UserModel, IUserMethods>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

schema.method('comparePassword', function comparePassword(password: string) {
    console.log(this.password === password);
    return this.password === password;
});

export const userModel = model<IUser, UserModel>('User', schema);
