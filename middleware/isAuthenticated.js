const express = require('express');

const User = require('../models/user');

const isAuthenticate = async (req, res, next) => {
	console.log('req.headers.authorization', req.headers.authorization);
	// Si j'ai un bien entré un token dans le post :
	const auth = req.headers.authorization;
	try {
		if (auth) {
			const user = await User.findOne({
				token: auth.replace('Bearer ', '')
			}); // Va chercher le User avec cet exact token entré sans le bearer
			console.log('user', user);
			if (!user) {
				// Si je n'ai pas trouvé de user correspondant
				res.status(401).json({ message: 'Invalid Token' });
			} else {
				req.user = user; // la requête req va avoir une clé supplémentaire appelée "user" qui aura toutes les infos de user ()
				console.log('req.user', req.user);
				next();
			}
		} else {
			// je n'ai pas entré de token dans le post
			res.status(401).json({ message: 'Missing Authorization Header' });
		}
	} catch (error) {
		res.json({ message: error.message, error: 'Unauthorized' });
	}
};

module.exports = isAuthenticate;
