import express, { Express } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import userRoutes from './routes/User';
const MongoStore = require('connect-mongodb-session')(session);

// Configuration
dotenv.config();
const app: Express = express();
const store = new MongoStore({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
    // convert to env variables
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

// Routes
app.use('/user', userRoutes);

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

// Mongoose will enforce the structure of the document
// on creation but not retrieval

// I think we can assume that data retrieved from the database will conform to the schema defined in the model, therefore validation is not needed

export default app;
