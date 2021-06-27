import express from 'express';
import {
    getJobs,
    createJob,
    applyJob,
    loginUser,
    register,
    checkToken,
    authenticate,
    getCandidates,
    // updateJob,
    // deleteJob,
} from '../controllers/controllers.js'

const router = express.Router();


router.get('/get-jobs', getJobs);
router.post('/create-job', createJob);
router.post('/apply-job/:id', applyJob);
router.post('/login', loginUser);
router.post('/register', register);
router.get('/check-token',authenticate,checkToken);
router.get('/get-candidates/:id', getCandidates);



export default router;