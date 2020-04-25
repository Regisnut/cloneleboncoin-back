const express = require('express');
const router = express.Router();

const Pay = require('../models/pay');
const User = require('../models/user');
const Offer = require('../models/offer');

require('dotenv').config();
// clé SECRETE API Stripe
const stripe = require('stripe')(process.env.STRIPE_API_SECRET);
//réception du token
router.post('/payment', async (req, res) => {
	console.log('stripe env', process.env.STRIPE_API_SECRET);
	try {
		//envoi TOKEN a STRIPE
		const { stripeToken, amount, title, productId } = req.fields;
		console.log('req.fields', req.fields);
		const response = await stripe.charges.create({
			amount: amount,
			currency: 'eur',
			description: `Paiement leboncoin pour : ${title}. ID du produit ${productId}`,
			source: stripeToken
		});
		console.log('response', response);
		if (response.status === 'succeeded') {
			//on prend id user
			console.log('req.fields.token', req.fields.token);
			const token = req.fields.token;

			const user = await User.findOne({ token: token });
			console.log('user', user);
			const userId = user._id;

			//le paiement est sauvé
			const payment = await new Pay({
				amount: amount,
				offer: productId,
				account: userId
			});
			await payment.save();
			//on retire l'annonce payée
			const offer = await Offer.findById(productId);
			await offer.remove();
			res.status(200).json({ message: 'success' });
		} else {
			res.json({ message: 'incident de paiement' });
		}
	} catch (error) {
		console.log(error.message);
		res.status(404).json({ error: error.message });
	}
});

module.exports = router;
