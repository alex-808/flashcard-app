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
    comparePassword: (password: string) => Promise<boolean>;
}

type UserModel = Model<IUser, IUserMethods>;

const schema = new Schema<IUser, UserModel, IUserMethods>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

schema.methods.comparePassword = async function (password: string) {
    return this.password === password;
};

export const userModel = model<IUser, UserModel>('User', schema);

const user = new userModel({
    username: 'test',
    email: 'test@test.com',
    password: 'test',
});

// Why is there no method comparePassword?
user.comparePassword('test');
