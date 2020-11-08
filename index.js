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
mongoose.connect(
	process.env.DB_URI,
	// ||
	// 'mongodb://localhost/leboncoin'
	{
		useNewUrlParser: true,
		useFindAndModify: false,
		useCreateIndex: true
	}
);


const MongoClient = require('mongodb').MongoClient;
const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
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
app.listen(
	process.env.PORT,
	// || 3001
	() => {
		console.log('Yeah !! server has started');
	}
);
