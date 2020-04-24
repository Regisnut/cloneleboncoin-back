const express = require('express');
const app = express();
// const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
// app.use(bodyParser.json());
app.use(cors());
require('dotenv').config();

const formidableMiddleware = require('express-formidable');
app.use(formidableMiddleware());

//avec Heroku
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/leboncoin', {
	useNewUrlParser: true,
	useFindAndModify: false,
	useCreateIndex: true
});

// ** MODELS
require('./models/user');
require('./models/offer');

// ** ROUTES USER OFFER PAYMENT**

const userRoutes = require('./routes/user');
app.use(userRoutes);

const offersRoutes = require('./routes/offer');
app.use(offersRoutes);

const paymentRoutes = require('./routes/payment');
app.use(paymentRoutes);

app.all('*', (req, res) => {
	res.status(404).send({ message: 'Page not found' });
});

//app listen
app.listen(process.env.PORT || 3001, () => {
	console.log('Yeah !! server has started');
});
