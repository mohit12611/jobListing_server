import express from 'express';
import cors from 'cors';
import routes from './routes/routes.js'

//import dotenv from 'dotenv'

const app = express();
app.use(express.json());
app.use(cors());
app.use('/user' , routes);


app.get('/', (req , res) => {
    res.send('Hello to Job Listing API');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Listening on Port : ${PORT}`));
