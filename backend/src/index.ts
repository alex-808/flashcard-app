import express, { Express } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import userRoutes from './routes/User';
import mongoDbSession from 'connect-mongodb-session';

// Configuration
dotenv.config();
const app: Express = express();
const MongoStore = mongoDbSession(session);
const store = new MongoStore({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    databaseName: process.env.DB_NAME || 'test',
    collection: process.env.SESSION_COLLECTION || 'sessions',
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

// Routes
app.use('/user', userRoutes);

// Session Database
async function main() {
    await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
    );
}
try {
    main();
} catch (err) {
    console.error(err);
}

const port = 3000;

app.listen(process.env.PORT || port, () => {
    console.log(`App listening on port ${process.env.PORT || port}`);
});

export default app;
