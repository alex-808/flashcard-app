import express, { Express, Request, Response } from 'express';
import mongoose, { HydratedDocument, Schema } from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import checkUser from './middlewares/auth';
import { IUser, userModel } from './models/User';
dotenv.config();
const app: Express = express();
const MongoStore = require('connect-mongodb-session')(session);
const store = new MongoStore({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
    databaseName: 'test',
    collection: 'sessions',
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        resave: false,
        saveUninitialized: false, // Only send a cookie when the session has been modified
        secret: 'SECRET',
        store: store, // Sessions are stored in the database and checked against on each request
    })
);

const port = 3000;

async function main() {
    await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
    );
}

main().catch((err) => console.log(err));

type SessionUser = {
    id: Schema.Types.ObjectId;
    username: string;
    email: string;
};
declare module 'express-session' {
    interface SessionData {
        views: number;
        user: SessionUser;
    }
}

app.post('/register', async (req: Request, res: Response) => {
    // TODO validate email
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.sendStatus(400);
        return;
    }

    const newUser: HydratedDocument<IUser> = new userModel({
        username: username,
        email: email,
        password: password,
    });

    try {
        await newUser.save();
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
        return;
    }

    res.sendStatus(200);
});

app.post('/login', async (req: Request, res: Response) => {
    if (!(req.body.username || req.body.email) || !req.body.password) {
        res.sendStatus(400);
        return;
    }

    const result = await userModel.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }],
    });

    const user = new userModel(result);

    if (!user) return res.sendStatus(401);

    if (user.comparePassword(req.body.password)) return res.sendStatus(401);

    if (!user._id || !user.username || !user.email) return res.sendStatus(500);

    const sessionUser: SessionUser = {
        id: user._id,
        username: user.username,
        email: user.email,
    };
    // grants session
    req.session.user = sessionUser;
    res.sendStatus(200);
});

app.post('/logout', checkUser, (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
    });
    res.clearCookie('connect.sid');
    res.sendStatus(200);
});

app.get('/user:userId', checkUser, async (req: Request, res: Response) => {
    // this functionality should be in the model
    const result = await userModel.findOne({ _id: req.params.userId });
    if (!result) return res.sendStatus(404);

    const user = {
        _id: result._id,
        username: result.username,
        email: result.email,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
    };

    // userId, username, email, created_at, updated_at
    res.send(user);
});

app.post('/user:userId/update', (req: Request, res: Response) => {});
app.post('/user:userId/delete', checkUser, (req: Request, res: Response) => {
    // must be logged in
    // must be the user
    // But what about admin users?
    //if (req.params.userId === req.session.user.id) {
    // console.log('delete user');
    // }
    // delete user
});

app.post('/generate/deck', (req: Request, res: Response) => {
    if (!req.body.sourceContent) {
        res.sendStatus(400);
        return;
    }
    // create message and send to queue
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// Mongoose will enforce the structure of the document
// on creation but not retrieval

// I think we can assume that data retrieved from the database will conform to the schema defined in the model, therefore validation is not needed
