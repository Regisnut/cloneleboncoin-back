const express = require('express');
const router = express.Router();

// const bodyParser = require('body-parser');
// router.use(bodyParser.json());

require('dotenv').config();
const formidableMiddleware = require('express-formidable');
//middleware
const isAuthenticated = require('../middleware/isAuthenticated');
//MODELS
const Offer = require('../models/offer');

//import setup cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

// ROUTE OFFERS **POST**
//utilisation de express-formidable pour utiliser le req.files
router.post('/offer/publish', isAuthenticated, async (req, res) => {
	try {
		let obj = {
			title: req.fields.title,
			description: req.fields.description,
			price: req.fields.price,
			created: new Date(),
			creator: req.user
		};

		const files = req.files.files;

		if (files) {
			let obj = {
				title: req.fields.title,
				description: req.fields.description,
				price: req.fields.price,
				picture: [],
				created: new Date(),
				creator: req.user
			};
			if (files.length > 1) {
				//more than 1 pic
				const pictures = [];
				const files = Object.keys(req.files.files);
				const results = {};
				files.forEach((fileKey) => {
					cloudinary.uploader.upload(
						req.files.files[fileKey].path,
						{
							folder: 'leboncoin-api'
						},
						async (error, result) => {
							if (error) {
								results[fileKey] = {
									success: false,
									error: error
								};
							} else {
								results[fileKey] = {
									success: true,
									result: result
								};
							}
							if (Object.keys(results).length === files.length) {
								for (let i = 0; i < Object.keys(results).length; i++) {
									pictures.push(results[i].result.secure_url);
								}
								obj.picture = pictures;
								const newOffer = await new Offer(obj);
								await newOffer.save();
								res.json({
									_id: newOffer._id,
									title: newOffer.title,
									description: newOffer.description,
									price: newOffer.price,
									picture: newOffer.picture,
									created: newOffer.created,
									creator: {
										account: newOffer.creator.account,
										_id: newOffer.creator._id
									}
								});
							}
						}
					);
				});
			} else {
				//1 picture
				console.log('1 image');
				console.log('files.path==>', files.path);
				await cloudinary.uploader.upload(
					files.path,
					{
						use_filename: true,
						unique_filename: false
					},
					{
						folder: 'leboncoin-api'
					},
					async (error, result) => {
						if (error) {
							return res.status(401).json({ message: 'incorrect upload file', error: error.message });
						} else {
							console.log('1 image result', result);

							obj.picture = result;

							const newOffer = new Offer(obj);
							await newOffer.save();
							console.log('1 image>offer', newOffer);
							res.json({
								_id: newOffer._id,
								title: newOffer.title,
								description: newOffer.description,
								price: newOffer.price,
								picture: newOffer.picture,
								created: newOffer.created,
								creator: {
									account: newOffer.creator.account,
									_id: newOffer.creator._id
								}
							});
						}
					}
				);
			}
		} else {
			// no image
			const offer = new Offer(obj);
			await offer.save();
			res.status(200).json({
				_id: offer._id,
				title: offer.title,
				description: offer.description,
				price: offer.price,
				created: offer.created,
				creator: {
					account: offer.creator.account,
					_id: offer.creator._id
				}
			});
		}
	} catch (error) {
		console.log(error.message);
		res.status(404).json(error.message);
	}
});

// READ post route
router.get('/offer/with-count', async (req, res) => {
	try {
		const filters = {};
		if (req.query.title) {
			filters.title = new RegExp(req.query.title, 'i');
		}
		// OK cas avec que priceMin
		// OK cas avec que priceMax
		// OK cas avec priceMin et priceMax
		if (req.query.priceMin) {
			filters.price = {
				$gte: req.query.priceMin
			};
		}
		if (req.query.priceMax) {
			// filters.price = {
			//   $lte: req.query.priceMax,
			// };
			if (!filters.price) {
				filters.price = {};
			}
			filters.price.$lte = req.query.priceMax;
		}
		// if (req.query.priceMin && req.query.priceMax) {
		//   filters.price = {
		//     $gte: req.query.priceMin,
		//     $lte: req.query.priceMax,
		//   };
		// }
		let sort = {};
		if (req.query.sort === 'date-desc') {
			sort = { date: 'desc' };
		} else if (req.query.sort === 'date-asc') {
			sort = { date: 'asc' };
		} else if (req.query.sort === 'price-asc') {
			sort = { price: 'asc' };
		} else if (req.query.sort === 'price-desc') {
			sort = { price: 'desc' };
		}
		// Compter le nombre de résultat
		const count = await Offer.countDocuments(filters);
		let offers;
		// Récupérer des annonces
		let page = Number(req.query.page);
		if (!page) {
			// Forcer à afficher la première page
			page = 1;
		}
		let limit = 3;
		// On affiche 2 resultats par page
		// Si on me demande page 1, alors le skip est 0 et limit est 2
		// Si on me demande page 2, alors le skip est 2 et limit est 2
		// Si on me demande page 3, alors le skip est 4 et limit est 2

		offers = await Offer.find(filters)
			.select('title price created creator picture.secure_url description')
			.populate({
				path: 'creator',
				select: 'account.username account.phone'
			})
			.skip((page - 1) * limit)
			.limit(limit)
			.sort(sort);
		// Répondre au client
		return res.json({
			count: count,
			offers: offers,
			limit: limit,
			page: page
		});
	} catch (error) {
		return res.status(400).json({ message: error.message });
	}
});

// READ post by id route
router.get('/offer/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const offer = await Offer.findOne({ _id: id }).populate({
			path: 'creator',
			select: 'account'
		});
		res.json(offer);
	} catch (error) {
		res.json({ message: error.message });
	}
});

router.get('/', async (req, res) => {
	try {
		const offerLength = await Offer.find();
		count = offerLength.length;

		const limit = 3;
		const page = Number(req.query.page);

		const offers = await Offer.find().sort({ created: 'desc' }).limit(limit).skip(limit * (page - 1));

		res.json({ count, page, limit, offers });
	} catch (error) {
		res.json({ message: error.message });
	}
});

module.exports = router;
