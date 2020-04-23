const express = require('express');
const router = express.Router();
// const bodyParser = require('body-parser');

//hash du password
const SHA256 = require('crypto-js/sha256');
const encBase64 = require('crypto-js/enc-base64');
const uid2 = require('uid2');

// router.use(bodyParser.json());

const formidableMiddleware = require("express-formidable");
router.use(formidableMiddleware());
//MODELS
const User = require('../models/user');

/* ROUTES */
router.get('/user', async (req, res) => {
	try {
		const users = await User.find();
		res.status(200).json({ message: 'liste des users', users });
	} catch (e) {
		res.status(404).json({ error: e });
	}
});

//SIGN UP
router.post('/signup', async (req, res) => {
	try {
		const { password, username, email } = req.fields;

		const user = await User.findOne({ email });
		if (user) {
			res.status(400).json({ message: 'Email already exist' });
		} else {
			if (email && password && username) {
				const token = uid2(64);
				const salt = uid2(64);
				const hash = SHA256(password + salt).toString(encBase64);

				const user = new User({
					account: {
						username: req.fields.username,
						phone: req.fields.phone
					},
					email,
					token,
					salt,
					hash
				});
				const newUserCreate = await user.save();
				if (newUserCreate === null) {
					res.status(404).json({ message: "it's impossible to add new user" });
				}
				res.json({
					message: 'user added successfully',
					_id: newUserCreate._id,
					account: newUserCreate.account,
					email: newUserCreate.email,
					token: newUserCreate.token
				});
			} else {
				res.status(404).json({ error: 'Missing information' });
			}
		}
	} catch (error) {
		res.status(404).json({ error: error.message });
	}
});

//LOGIN
router.post('/login', async (req, res) => {
	try {
		const { password, email } = req.fields;
		const user = await User.findOne({ email });
		if (!user) {
			res.status(403).json({
				error: 'unvalid email'
			});
			return;
		}
		const hash = SHA256(password + user.salt).toString(encBase64);
		if (hash !== user.hash) {
			res.status(403).json({
				error: 'unvalid password'
			});
			return;
		}
		res.json({
			_id: user._id,
			account: user.account,
			email: user.email,
			token: user.token
		});
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

module.exports = router;
