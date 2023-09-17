import { model, Model, Schema } from 'mongoose';

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

interface IUserStatics {
    isUsernameTaken(username: string): boolean;
    isEmailTaken(email: string): boolean;
}

type UserModel = Model<IUser, {}, IUserMethods> & IUserStatics;

const schema = new Schema<IUser, UserModel, IUserMethods>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

schema.method('comparePassword', function comparePassword(password: string) {
    return this.password === password;
});
schema.static(
    'isUsernameTaken',
    async function isUsernameTaken(username: string) {
        const user = await this.findOne({ username: username });
        return user !== null;
    }
);
schema.static('isEmailTaken', async function isEmailTaken(email: string) {
    const user = await this.findOne({ email: email });
    return user !== null;
});

export const userModel = model<IUser, UserModel>('User', schema);
