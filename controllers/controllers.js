import mongodb from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const URL = 'mongodb+srv://mohit:mohit1234@job-listing.rsvr7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const DB = 'job-listing';
dotenv.config();

export function authenticate(req, res, next) {

    if (req.headers.authorization) {
        try {
            let jwtValid = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);

            if (jwtValid) {
                req.userId = jwtValid._id;
                next();
            }

        } catch (error) {
            res.status(401).json({
                message: "Invalid Token"
            })
        }
    }
    else {
        res.status(401).json({
            message: "No Token Present"
        })
    }
}

export const register = async (req, res) => {
    try {
        if (req.body.role === "candidate") {
            let connection = await mongodb.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log("database connected");
            let db = connection.db(DB);
            console.log(req.body)
            let isEmailUnique = await db.collection("users").findOne({ email: req.body.email });

            if (isEmailUnique) {
                console.log("Email Already Exist")
                await connection.close()
                res.status(401).json({
                    message: "Email Already Exist"
                })
            } else {
                // Generate a SALT
                let salt = await bcrypt.genSalt(10)
                console.log("Salt----", salt);
                // Hash the Password with SALT
                let hash = await bcrypt.hash(req.body.password, salt)
                console.log("Hash", hash)
                // Store it in DB
                req.body.password = hash;

                let user = await db.collection("users").insertOne({
                    "email": req.body.email,
                    "password": req.body.password,
                    "role": req.body.role
                })

                await connection.close()

                res.json({
                    message: "User Registered"
                })
            }
        }
        else if (req.body.role === "recruiter") {
            let connection = await mongodb.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log("database connected");
            let db = connection.db(DB);

            let isEmailUnique = await db.collection("users").findOne({ email: req.body.email });

            if (isEmailUnique) {
                console.log("Email Already Exist")
                await connection.close()
                res.status(401).json({
                    message: "Email Already Exist"
                })
            } else {
                // Generate a SALT
                let salt = await bcrypt.genSalt(10)

                // Hash the Password with SALT
                let hash = await bcrypt.hash(req.body.password, salt)

                // Store it in DB
                req.body.password = hash;

                let user = await db.collection("users").insertOne({
                    "email": req.body.email,
                    "password": req.body.password,
                    "role": req.body.role
                })

                await connection.close()

                res.json({
                    message: "Recruiter Registered"
                })
            }

        }
        else {
            res.status(404).json({
                message: "Please check th Credentials"
            })
        }

    } catch (error) {
        console.log(error)
    }
}

export const loginUser = async (req, res) => {
    try {
        let connection = await mongodb.connect(URL, { useUnifiedTopology: true });
        let db = connection.db(DB);
        console.log("Database Connected");

        let user = await db.collection("users").findOne({ "email": req.body.email });
        console.log(user);
        if (user) {
            let isPassword = await bcrypt.compare(req.body.password, user.password);

            if (isPassword) {

                let token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })

                await connection.close()

                res.json({
                    "message": "Allow",
                    token,
                    "role": user.role
                })
            }
            else {
                await connection.close()
                res.status(404).json({
                    "message": "Email or Password is Incorrect"
                })
            }
        }
        else {
            await connection.close()
            res.status(404).json({
                "message": "Email or Password is Incorrect"
            })
        }
    } catch (error) {
        console.log(error);
    }

}

export const checkToken = async (req, res) => {

    try {
        let connection = await mongodb.connect(URL, { useUnifiedTopology: true });
        console.log("Database Connected")
        let db = connection.db(DB);
        let userData = await db.collection("users").findOne({ _id: mongodb.ObjectID(req.userId) });
        await connection.close();
        console.log(userData);
        res.json(userData);

    }
    catch (error) {
        console.log(error);
    }
}


export const createJob = async (req, res) => {

    try {
        const job = req.body;
        let connection = await mongodb.connect(URL, { useUnifiedTopology: true });
        console.log("Database Connected");
        let db = connection.db(DB);

        await db.collection("users").updateOne({ _id: mongodb.ObjectID(job._id) }, { $push: { jobs: { $each: [{ ...job }] } } });
        let recruiterData = await db.collection("users").findOne({ _id: mongodb.ObjectID(job._id) });

        await db.collection("jobs").insertOne({ job: { ...job, recruiter_id: job._id } });
        let jobAdded = await db.collection("users").findOne({ _id: mongodb.ObjectID(job._id) });

        res.json({ ...recruiterData, ...jobAdded });
    } catch (error) {
        res.json(error)
    }

}



export const getJobs = async (req, res) => {
    try {
        let connection = await mongodb.connect(URL, { useUnifiedTopology: true });
        console.log("Database Connected");
        let db = connection.db(DB);

        let allJobs = await db.collection("jobs").find().toArray();
        await connection.close();
        res.json(allJobs);

    } catch (error) {
        console.log(error);
    }
}


export const applyJob = async (req, res) => {
    try {
        let candidateId = req.params.id;
        let dataToAdd = req.body
        console.log("candidateId", candidateId);
        console.log("dataToAdd", dataToAdd);
        let connection = await mongodb.connect(URL, { useUnifiedTopology: true });
        console.log("Database Connected");
        let db = connection.db(DB);

        await db.collection("users").updateOne({ _id: mongodb.ObjectID(dataToAdd.recruiter_id) }, { $push: { candidates: { $each: [{ "email": dataToAdd.email, "designation": dataToAdd.designation, "discription": dataToAdd.discription, "skills": dataToAdd.skills, "experience": dataToAdd.experience }] } } });
        let recruiterData = await db.collection("users").findOne({ _id: mongodb.ObjectID(dataToAdd.recruiter_id) });

        connection.close();
        res.json(recruiterData);
    } catch (error) {
        console.log(error);
    }
}



export const getCandidates = async (req, res) => {
    try {
        let {id} = req.params;
        id = id.slice(1);

        let connection = await mongodb.connect(URL, { useUnifiedTopology: true });
        console.log("Database Connected");
        let db = connection.db(DB);

        let recruiterData = await db.collection("users").findOne({ _id: mongodb.ObjectID(id) });
        console.log(recruiterData);

        connection.close();
        res.json(recruiterData);
    } catch (error) {
        console.log(error)
    }
}

// export const deleteJob = async (req, res) => {

// }
// {
//     createJob,

//     getJobs,
//     applyJob}